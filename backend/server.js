import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { scrapeHac } from './scraper/hacScraper.js';

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

// ── User Profile Cache Helpers ──
function saveUserProfile(username, data) {
  if (!username || !data) return;
  try {
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const safeName = username.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cachePath = path.join(dataDir, `user_${safeName}.json`);
    fs.writeFileSync(cachePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.warn('[Profile Saver] Error writing user profile:', err.message);
  }
}

function loadUserProfile(username) {
  if (!username) return null;
  try {
    const safeName = username.replace(/[^a-zA-Z0-9_-]/g, '_');
    const cachePath = path.join(__dirname, 'data', `user_${safeName}.json`);
    if (fs.existsSync(cachePath)) {
      return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    }
  } catch (err) {
    console.warn('[Profile Loader] Error reading user profile:', err.message);
  }
  return null;
}

// GET /api/hac/latest - returns latest synced student profile for a specific user
app.get('/api/hac/latest', (req, res) => {
  const username = req.query.username;
  if (username) {
    const profile = loadUserProfile(username);
    if (profile) return res.json({ success: true, data: profile });
  }
  res.status(404).json({ error: 'No synced HAC data found.' });
});

// API Endpoint to authenticate and scrape real HAC
app.post('/api/login', async (req, res) => {
  const { username, password, districtUrl } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    console.log(`[Auth] Authenticating user: ${username} (District: ${districtUrl || 'default'})...`);
    const profileData = await scrapeHac(username, password, districtUrl);

    // Save this user's real profile
    saveUserProfile(username, profileData);

    res.json({ success: true, data: profileData });
  } catch (error) {
    console.warn('[Auth] HAC authentication/scraping failed:', error.message);
    res.status(401).json({ 
      error: error.message || 'Failed to authenticate with Home Access Center. Please verify your credentials and district portal.' 
    });
  }
});

// ── Serve Frontend Static Files in Production ──
const frontendDist = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
  });
}

const server = app.listen(PORT, () => {
  console.log(`Ascend Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${PORT} is already in use by another running instance. The backend is already active!`);
  } else {
    console.error('Server error:', err);
  }
});
