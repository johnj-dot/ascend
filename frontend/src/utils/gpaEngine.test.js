import assert from 'assert';
import {
  classifyCourse,
  getUnweightedPoints,
  getWeightedPoints,
  calculateGPA,
  estimateClassRank,
} from './gpaEngine.js';

console.log('--- Running GPA Engine Unit Tests ---');

// 1. Classification Tests
console.log('[1] Course Classification');
assert.strictEqual(classifyCourse('AP Comp Sci Principles').tier, 'ap_advanced');
assert.strictEqual(classifyCourse('TAG/Advanced Alg II').tier, 'ap_advanced');
assert.strictEqual(classifyCourse('TAG/Advanced Biology').tier, 'ap_advanced');
assert.strictEqual(classifyCourse('TAG/Advanced English I').tier, 'ap_advanced');
assert.strictEqual(classifyCourse('TAG/AP Human Geography').tier, 'ap_advanced');
assert.strictEqual(classifyCourse('Advanced Spanish III').tier, 'ap_advanced');
assert.strictEqual(classifyCourse('Spanish 1').tier, 'on_level_weighted');
assert.strictEqual(classifyCourse('Intro Engineering Design').tier, 'unweighted_only');
assert.strictEqual(classifyCourse('Lifetime Fitness & Wellness').tier, 'unweighted_only');
console.log('  ✓ Course classification verified');

// 2. Unweighted Points (4.0 Scale: 90-100 = 4.0)
console.log('[2] Unweighted 4.0 Bracket Scale');
assert.strictEqual(getUnweightedPoints(100), 4.0);
assert.strictEqual(getUnweightedPoints(90), 4.0, '90 must equal 4.0');
assert.strictEqual(getUnweightedPoints(89), 3.0);
assert.strictEqual(getUnweightedPoints(80), 3.0);
assert.strictEqual(getUnweightedPoints(79), 2.0);
assert.strictEqual(getUnweightedPoints(70), 2.0);
assert.strictEqual(getUnweightedPoints(69), 0.0);
console.log('  ✓ Unweighted bracket mapping verified (90 == 100 == 4.0)');

// 3. Weighted Points (6.0 Scale)
console.log('[3] Weighted 6.0 Scale Points');
// AP & Advanced contribute exact same (Tier 1: 100 -> 6.0, 90 -> 5.0)
assert.strictEqual(getWeightedPoints(100, 'ap_advanced'), 6.0);
assert.strictEqual(getWeightedPoints(90, 'ap_advanced'), 5.0);
assert.strictEqual(getWeightedPoints(95, 'ap_advanced'), 5.5);

// On-level Spanish (Tier 2: 100 -> 5.0, exact same as 90 in AP/Advanced)
assert.strictEqual(getWeightedPoints(100, 'on_level_weighted'), 5.0);
assert.strictEqual(getWeightedPoints(90, 'on_level_weighted'), 4.0);

// Unweighted Only (Intro Engineering Design, Fitness) -> null
assert.strictEqual(getWeightedPoints(100, 'unweighted_only'), null);
console.log('  ✓ Weighted points verified (AP/Adv 100=6.0, On-Level 100=5.0, Electives excluded)');

// 4. GPA Calculation
console.log('[4] Comprehensive GPA Calculation');
const studentClasses = [
  { name: 'AP Comp Sci Principles', grade: 100, credits: 1 },
  { name: 'Lifetime Fitness & Wellness', grade: 100, credits: 1 },
  { name: 'TAG/Advanced Alg II', grade: 100, credits: 1 },
  { name: 'TAG/Advanced Biology', grade: 100, credits: 1 },
  { name: 'Intro Engineering Design', grade: 100, credits: 1 },
  { name: 'TAG/Advanced English I', grade: 100, credits: 1 },
  { name: 'TAG/AP Human Geography', grade: 100, credits: 1 },
  { name: 'Advanced Spanish III', grade: 100, credits: 1 },
];

const gpaFull = calculateGPA(studentClasses);
assert.strictEqual(gpaFull.unweighted, 4.0);
assert.strictEqual(gpaFull.weighted, 6.0);
assert.strictEqual(gpaFull.weightedCredits, 6.0, 'Only 6 weighted classes count in weighted denominator');
assert.strictEqual(gpaFull.totalCredits, 8.0, 'All 8 classes count in unweighted');

// Test that 90 in Intro Eng Design leaves Unweighted at 4.0 and Weighted at 6.0
studentClasses[4].grade = 90; // Intro Eng Design
const gpaEng90 = calculateGPA(studentClasses);
assert.strictEqual(gpaEng90.unweighted, 4.0, '90 in elective remains 4.0 unweighted');
assert.strictEqual(gpaEng90.weighted, 6.0, 'Elective grade does not affect 6.0 weighted');

// Test that 90 in AP Comp Sci drops weighted to 5.833, but unweighted remains 4.0
studentClasses[0].grade = 90; // AP CS
const gpaAp90 = calculateGPA(studentClasses);
assert.strictEqual(gpaAp90.unweighted, 4.0, '90 in AP course remains 4.0 unweighted');
assert.strictEqual(gpaAp90.weighted, 5.833, 'Weighted drops to 35/6 = 5.833');
console.log('  ✓ GPA calculation engine verified');

// 5. Rank Estimation
console.log('[5] Rank & Cohort Standing');
const rankTop = estimateClassRank(6.0, 650);
assert.strictEqual(rankTop.estimatedRank, 1);
assert.strictEqual(rankTop.percentile, 'Top 1%');
console.log('  ✓ Rank estimation verified');

console.log('\nAll 5 GPA Engine tests passed successfully!');
