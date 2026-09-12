/**
 * Offline unit test for hacScraper parsers.
 * Uses real HTML extracted from HAR dumps.
 * Run: node scraper/hacScraper.test.js
 */
import fs from 'fs';
import {
  scrapeClasses,
  scrapeAssignments,
  scrapeTranscript,
  scrapeAttendance,
  scrapeRegistration,
  gradeToLetter
} from './hacScraper.js';

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

console.log('\n=== GradeForge Scraper Unit Tests ===\n');

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getFixture = (name) => {
  const p1 = path.join(__dirname, 'testData', name);
  if (fs.existsSync(p1)) return p1;
  const p2 = path.join(process.cwd(), name);
  if (fs.existsSync(p2)) return p2;
  const p3 = path.join(process.cwd(), 'scraper', 'testData', name);
  if (fs.existsSync(p3)) return p3;
  return null;
};

const readFixture = (name) => {
  const p = getFixture(name);
  return p ? fs.readFileSync(p, 'utf8') : null;
};

// ── Test 1: Classes ──
console.log('[ Classes ]');
const classesHtml = readFixture('extracted_299.html');
if (classesHtml) {
  const classes = scrapeClasses(classesHtml);
  assert('Returns array', Array.isArray(classes));
  assert('Has > 0 classes', classes.length > 0, `got ${classes.length}`);
  assert('Deduplication (no A/B duplicates)', classes.length <= 8, `got ${classes.length}`);
  assert('First class has name', !!classes[0]?.name, classes[0]?.name);
  assert('First class has teacher', !!classes[0]?.teacher, classes[0]?.teacher);
  assert('First class has period', !!classes[0]?.period, classes[0]?.period);
  console.log(`    Classes: ${classes.map(c => c.name).join(', ')}`);
} else {
  console.log('  SKIP — extracted_299.html not found');
}

// ── Test 2: Assignments & Live Grade Extraction ──
console.log('\n[ Assignments & Live Grade Extraction ]');
const assignHtml = readFixture('extracted_220.html');
if (assignHtml) {
  // Test with empty initial classes array - scrapeAssignments must discover all classes from Assignments page
  const discoveredClasses = [];
  scrapeAssignments(assignHtml, discoveredClasses);
  assert('Discovers classes from Assignments HTML when empty', discoveredClasses.length >= 8, `got ${discoveredClasses.length}`);
  
  const classes = classesHtml ? scrapeClasses(classesHtml) : [...discoveredClasses];
  scrapeAssignments(assignHtml, classes);
  assert('Maintains all classes after scrapeAssignments', classes.length >= 8, `got ${classes.length}`);
  
  const withAssignments = classes.filter(c => c.assignments && c.assignments.length > 0);
  assert('At least 1 class has assignments', withAssignments.length > 0, `${withAssignments.length} classes with assignments`);
  const first = withAssignments[0]?.assignments[0];
  if (first) {
    assert('Assignment has name', !!first.name, first.name);
    assert('Assignment has dateDue', !!first.dateDue, first.dateDue);
    assert('Assignment has category', !!first.category, first.category);
  }
  console.log(`    Discovered classes: ${classes.map(c => c.name).join(', ')}`);
} else {
  console.log('  SKIP — extracted_220.html not found');
}

// ── Test 3: Multi-Year Transcript & GPA/Rank ──
console.log('\n[ Transcript & GPA ]');
const transcriptPath = getFixture('Transcript_2.html') || getFixture('extracted_transcript_364.html');

if (transcriptPath) {
  const transcriptHtml = fs.readFileSync(transcriptPath, 'utf8');
  const { years, gpa } = scrapeTranscript(transcriptHtml);
  assert('Has transcript years', years.length > 0, `got ${years.length}`);
  assert('Extracts multiple years if available', years.length >= 2, `got ${years.length}`);
  assert('First year has courses', years[0]?.courses.length > 0, `got ${years[0]?.courses.length}`);
  assert('First year has grade level', !!years[0]?.grade, years[0]?.grade);
  assert('First year has building', !!years[0]?.building, years[0]?.building);
  assert('Second year has courses', years[1]?.courses.length > 0, `got ${years[1]?.courses.length}`);
  assert('Courses have descriptions', !!years[0]?.courses[0]?.description, years[0]?.courses[0]?.description);
  const totalCredits = years.reduce((s, y) => s + y.totalCredits, 0);
  assert('Total credits calculated', totalCredits > 0, `got ${totalCredits}`);
  console.log(`    ${years.length} years: ${years.map(y => y.year + ' (Gr ' + y.grade + '): ' + y.courses.length + ' courses, ' + y.totalCredits + ' cr').join(', ')}`);
  console.log(`    GPA & Rank: weighted=${gpa.weighted} unweighted=${gpa.unweighted} rank=${gpa.rank}`);
} else {
  console.log('  SKIP — Transcript HTML not found');
}

// ── Test 4: Registration Info ──
console.log('\n[ Registration ]');
const regPath = getFixture('Registration_2.html');
if (regPath) {
  const regHtml = fs.readFileSync(regPath, 'utf8');
  const reg = scrapeRegistration(regHtml);
  assert('Registration parsed object', !!reg);
  assert('Has student ID', !!reg.studentId, reg.studentId);
  assert('Has counselor', !!reg.counselor, reg.counselor);
  assert('Has building name', !!reg.building, reg.building);
  assert('Has grade', !!reg.grade, reg.grade);
  console.log(`    Registration: ID=${reg.studentId}, Counselor=${reg.counselor}, Building=${reg.building}, Grade=${reg.grade}`);
} else {
  console.log('  SKIP — Registration HTML not found');
}

// ── Test 5: Attendance ──
console.log('\n[ Attendance ]');
const attendanceHtml = readFixture('Attendance_extracted_69.html') || readFixture('extracted_148.html');
if (attendanceHtml) {
  const records = scrapeAttendance(attendanceHtml);
  assert('Returns array', Array.isArray(records));
  assert('Extracts calendar attendance days', records.length > 0, `got ${records.length}`);
  const day19 = records.find(r => r.day === 19);
  assert('Day 19 record extracted', !!day19);
  if (day19) {
    assert('Day 19 has period information', day19.raw.includes('period') || day19.code.includes('period'));
    assert('Day 19 has status present', day19.status === 'present');
  }
  console.log(`    Attendance records: ${records.length} days found`);
} else {
  console.log('  SKIP — Attendance HTML not found');
}

// ── Test 6: 5-Attempt Retry Mechanism ──
console.log('\n[ Retry Mechanism (5 attempts) ]');
import { withGracefulRetry } from './hacScraper.js';
let attemptsMade = 0;
const retryTestResult = await withGracefulRetry(async () => {
  attemptsMade++;
  if (attemptsMade < 5) return null;
  return ['success_data'];
}, res => !res || res.length === 0, 5, 'TestStep', 10);

assert('Executes up to 5 attempts', attemptsMade === 5, `expected 5, got ${attemptsMade}`);
assert('Succeeds on 5th attempt', retryTestResult.failed === false && retryTestResult.data[0] === 'success_data');

let failedAttempts = 0;
const failureResult = await withGracefulRetry(async () => {
  failedAttempts++;
  return [];
}, res => !res || res.length === 0, 5, 'FailedStep', 10);
assert('Fails gracefully after exactly 5 attempts', failedAttempts === 5, `expected 5, got ${failedAttempts}`);
assert('Flags step as failed', failureResult.failed === true);

// ── Test 7: Grade Letter Conversion ──
console.log('\n[ Grade Letter Conversion ]');
assert('100 → A', gradeToLetter(100) === 'A');
assert('90  → A', gradeToLetter(90)  === 'A');
assert('89  → B', gradeToLetter(89)  === 'B');
assert('80  → B', gradeToLetter(80)  === 'B');
assert('79  → C', gradeToLetter(79)  === 'C');
assert('70  → C', gradeToLetter(70)  === 'C');
assert('69  → D', gradeToLetter(69)  === 'D');
assert('59  → F', gradeToLetter(59)  === 'F');

// ── Summary ──
console.log(`\n════════════════════════════════════`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
