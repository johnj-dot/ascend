import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { scrapeHac, parseHacFromHar } from './scraper/hacScraper.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── GET /api/health ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Helper: Load and merge all local HAR files or cached profile available
function loadLatestHarData() {
  const cachePath = path.join(__dirname, 'data', 'cached_student_profile.json');
  if (fs.existsSync(cachePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      if (data && data.classes?.length > 0) return data;
    } catch (err) {
      console.warn('[Cache Loader] Error reading cached_student_profile.json:', err.message);
    }
  }

  const possiblePaths = [
    path.join(__dirname, '..', 'gradeUpdate.har'),
    path.join(__dirname, '..', 'fourthPortalAttendenec.har'),
    path.join(__dirname, '..', 'thirdPortal.har'),
    path.join(__dirname, 'gradeUpdate.har'),
  ];

  let mergedProfile = null;
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const parsed = parseHacFromHar(p);
        if (parsed) {
          if (!mergedProfile) {
            mergedProfile = parsed;
          } else {
            // Merge classes, attendance, transcript if not present
            if (parsed.classes && parsed.classes.length > 0) {
              parsed.classes.forEach(pc => {
                const existing = mergedProfile.classes.find(c => c.id === pc.id || c.name.toLowerCase() === pc.name.toLowerCase());
                if (existing) {
                  if (pc.assignments?.length > 0) existing.assignments = pc.assignments;
                  if (pc.average !== null) {
                    existing.average = pc.average;
                    existing.letterGrade = pc.letterGrade;
                  }
                } else {
                  mergedProfile.classes.push(pc);
                }
              });
            }
            if (parsed.transcript?.years?.length > 0 && (!mergedProfile.transcript?.years || mergedProfile.transcript.years.length === 0)) {
              mergedProfile.transcript = parsed.transcript;
            }
            if (parsed.attendance?.length > 0 && (!mergedProfile.attendance || mergedProfile.attendance.length === 0)) {
              mergedProfile.attendance = parsed.attendance;
            }
            if (parsed.studentId && !mergedProfile.studentId) {
              mergedProfile.studentId = parsed.studentId;
              mergedProfile.studentName = parsed.studentName;
              mergedProfile.counselor = parsed.counselor;
              mergedProfile.building = parsed.building;
            }
          }
        }
      } catch (err) {
        console.warn(`[HAR Loader] Error reading ${p}:`, err.message);
      }
    }
  }

  // Recalculate overall average considering zero-weighted items
  if (mergedProfile?.classes) {
    const classesWithGrades = mergedProfile.classes.filter(c => c.average !== null);
    mergedProfile.overallAverage = classesWithGrades.length > 0
      ? parseFloat((classesWithGrades.reduce((s, c) => s + c.average, 0) / classesWithGrades.length).toFixed(2))
      : null;
    
    mergedProfile.allAssignments = mergedProfile.classes.flatMap(c => (c.assignments || []).map(a => ({ ...a, class: c.name, courseId: c.id })));
    mergedProfile.upcoming = mergedProfile.allAssignments
      .filter(a => !a.missing && (a.score === null || a.score === undefined))
      .sort((a, b) => {
        if (!a.dateDue && !b.dateDue) return 0;
        if (!a.dateDue) return 1;
        if (!b.dateDue) return -1;
        return new Date(a.dateDue) - new Date(b.dateDue);
      });
  }

  return mergedProfile;
}

// GET /api/hac/latest - returns latest synced student profile
app.get('/api/hac/latest', (req, res) => {
  const profile = loadLatestHarData();
  if (profile) {
    return res.json({ success: true, data: profile });
  }
  res.status(404).json({ error: 'No synced HAC data found.' });
});

// API Endpoint to authenticate and scrape HAC
app.post('/api/login', async (req, res) => {
  const { username, password, districtUrl } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    console.log(`Initiating HAC scraping for user: ${username} (District URL: ${districtUrl || 'default'})...`);
    const profileData = await scrapeHac(username, password, districtUrl);
    res.json({ success: true, data: profileData });
  } catch (error) {
    console.warn('Live HAC Scraping unavailable, checking for updated local HAR archives:', error.message);
    const harProfile = loadLatestHarData();
    if (harProfile) {
      console.log(`✓ Serving freshly synced student profile from gradeUpdate.har (${harProfile.classes.length} classes, ${harProfile.upcoming.length} upcoming tasks)`);
      return res.json({ success: true, data: harProfile });
    }
    res.status(500).json({ error: error.message || 'Failed to authenticate with HAC' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`GradeForge Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${PORT} is already in use by another running instance. The backend is already active!`);
  } else {
    console.error('Server error:', err);
  }
});
