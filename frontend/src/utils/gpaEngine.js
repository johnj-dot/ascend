/**
 * GPA Calculation Engine for Round Rock High School (Round Rock ISD)
 *
 * Weighting Rules:
 * 1. Unweighted (4.0 Scale):
 *    - All credit courses count (including Wellness, PE, Intro Engineering Design).
 *    - Strict bracket: 90 - 100 = 4.0 (a 90 has identical 4.0 impact as a 100).
 *    - 80 - 89 = 3.0, 70 - 79 = 2.0, < 70 = 0.0.
 *
 * 2. Weighted (6.0 Scale):
 *    - AP & TAG / Advanced courses contribute the exact same: max 6.0 (at 100 = 6.0, 90 = 5.0).
 *    - On-level weighted courses (e.g. On-Level Spanish, Regular Core): max 5.0 (at 100 = 5.0, equal to 90 in AP).
 *    - Unweighted-only electives (e.g. Intro Engineering Design, Lifetime Fitness & Wellness):
 *      Excluded from weighted numerator & denominator so they do not dilute 6.0 GPA.
 *
 * 3. Class Rank:
 *    - Extracted from HAC transcript if reported by registrar.
 *    - If unreleased (standard for 9th grade), estimated cohort standing provided.
 */

export const WEIGHT_TIERS = {
  ap_advanced: {
    id: 'ap_advanced',
    tier: 'ap_advanced',
    label: 'AP / Advanced (6.0 Max)',
    badge: 'AP / Advanced',
    maxPoints: 6.0,
    isWeighted: true,
    color: 'emerald',
  },
  on_level_weighted: {
    id: 'on_level_weighted',
    tier: 'on_level_weighted',
    label: 'On-Level Weighted (5.0 Max)',
    badge: 'On-Level (5.0)',
    maxPoints: 5.0,
    isWeighted: true,
    color: 'blue',
  },
  unweighted_only: {
    id: 'unweighted_only',
    tier: 'unweighted_only',
    label: 'Unweighted Only (4.0 Only)',
    badge: 'Unweighted Only',
    maxPoints: null,
    isWeighted: false,
    color: 'amber',
  },
  non_gpa: {
    id: 'non_gpa',
    tier: 'non_gpa',
    label: 'Non-GPA / Excluded',
    badge: 'Non-GPA',
    maxPoints: null,
    isWeighted: false,
    color: 'slate',
  },
};

/**
 * Cleans any concatenated assignment text or trailing artifact from course names.
 */
export function cleanCourseName(name = '') {
  if (!name || typeof name !== 'string') return '';
  // If there's parenthetical info like (100) or period info at end
  let cleaned = name.replace(/\s*\(.*?\)\s*$/, '').trim();
  // Strip common concatenated assignment text if scraped together
  cleaned = cleaned.replace(/(Skills Practice|CBAM|Adv Ext Test|Shoes Shoes|El presente|Quiz|Test|Exam|Assignment).*$/i, '').trim();
  return cleaned || name;
}

/**
 * Automatically classifies a course by its name based on Round Rock ISD catalog.
 */
export function classifyCourse(courseName = '') {
  const norm = cleanCourseName(courseName).toLowerCase().trim();

  // 1. Unweighted Only: Lifetime Fitness, PE, Intro Engineering Design, Athletics
  const isPE = /\bp\.?e\.?\b/i.test(norm) || norm.startsWith('pe ') || norm.endsWith(' pe');
  if (
    norm.includes('fitness') ||
    norm.includes('wellness') ||
    norm.includes('lifetime') ||
    isPE ||
    norm.includes('athletics') ||
    norm.includes('engineering design') ||
    norm.includes('intro engineering') ||
    norm.includes('ied') ||
    norm.includes('prappeng')
  ) {
    return WEIGHT_TIERS.unweighted_only;
  }

  // 2. AP & Advanced / TAG: Top Tier (6.0 scale)
  if (
    norm.includes('ap ') ||
    norm.includes('ap/') ||
    norm.includes('/ap') ||
    norm.includes('advanced') ||
    norm.includes('tag') ||
    norm.includes('honors') ||
    norm.includes('pre-ap') ||
    norm.includes('pre ap') ||
    norm.includes('ib ')
  ) {
    return WEIGHT_TIERS.ap_advanced;
  }

  // 3. Regular academic courses that count for weighted on-level (5.0 scale)
  if (
    norm.includes('spanish') ||
    norm.includes('span') ||
    norm.includes('french') ||
    norm.includes('german') ||
    norm.includes('latin') ||
    norm.includes('chinese') ||
    norm.includes('asl') ||
    norm.includes('algebra') ||
    norm.includes('alg') ||
    norm.includes('geometry') ||
    norm.includes('geom') ||
    norm.includes('calculus') ||
    norm.includes('biology') ||
    norm.includes('chemistry') ||
    norm.includes('physics') ||
    norm.includes('english') ||
    norm.includes('history') ||
    norm.includes('geography') ||
    norm.includes('economics') ||
    norm.includes('government')
  ) {
    return WEIGHT_TIERS.on_level_weighted;
  }

  // Default to unweighted only for local electives
  return WEIGHT_TIERS.unweighted_only;
}

/**
 * Computes unweighted grade points on 4.0 scale.
 * Strict bracket scale where 90 - 100 = 4.0.
 */
export function getUnweightedPoints(grade) {
  if (grade === null || grade === undefined || isNaN(grade)) return null;
  const num = parseFloat(grade);
  if (num >= 90) return 4.0;
  if (num >= 80) return 3.0;
  if (num >= 70) return 2.0;
  return 0.0;
}

/**
 * Computes weighted grade points on 6.0 scale.
 * AP & Advanced: 100 = 6.0, 90 = 5.0 (formula: (grade - 40) / 10).
 * On-Level Weighted: 100 = 5.0, 90 = 4.0 (formula: (grade - 50) / 10).
 * Unweighted Only / Non-GPA: null (excluded from weighted GPA).
 */
export function getWeightedPoints(grade, tierId) {
  if (grade === null || grade === undefined || isNaN(grade)) return null;
  const num = parseFloat(grade);

  if (tierId === 'ap_advanced') {
    if (num < 70) return 0.0;
    return parseFloat(((num - 40) / 10).toFixed(4));
  }

  if (tierId === 'on_level_weighted') {
    if (num < 70) return 0.0;
    return parseFloat(((num - 50) / 10).toFixed(4));
  }

  return null;
}

/**
 * Computes full Unweighted (4.0) and Weighted (6.0) GPA.
 */
export function calculateGPA(courses = [], options = {}) {
  let unweightedPointsTotal = 0;
  let unweightedCreditsTotal = 0;

  let weightedPointsTotal = 0;
  let weightedCreditsTotal = 0;

  const breakdown = [];

  courses.forEach(c => {
    const grade = c.grade !== undefined && c.grade !== null ? parseFloat(c.grade) : null;
    const credits = parseFloat(c.credits ?? c.credit ?? 1.0) || 1.0;
    const tier = c.tier || classifyCourse(c.name).id;
    const enabled = c.enabled !== false;

    if (!enabled || grade === null || isNaN(grade)) {
      breakdown.push({
        ...c,
        grade,
        credits,
        tier,
        unweightedPoints: null,
        weightedPoints: null,
        active: false,
      });
      return;
    }

    // 1. Unweighted (all credit courses except non_gpa)
    if (tier !== 'non_gpa') {
      const uwPoints = getUnweightedPoints(grade);
      unweightedPointsTotal += uwPoints * credits;
      unweightedCreditsTotal += credits;

      // 2. Weighted (only ap_advanced and on_level_weighted)
      const wPoints = getWeightedPoints(grade, tier);
      if (wPoints !== null) {
        weightedPointsTotal += wPoints * credits;
        weightedCreditsTotal += credits;
      }

      breakdown.push({
        ...c,
        grade,
        credits,
        tier,
        unweightedPoints: uwPoints,
        weightedPoints: wPoints,
        active: true,
      });
    } else {
      breakdown.push({
        ...c,
        grade,
        credits,
        tier: 'non_gpa',
        unweightedPoints: null,
        weightedPoints: null,
        active: false,
      });
    }
  });

  const unweightedGPA = unweightedCreditsTotal > 0
    ? parseFloat((unweightedPointsTotal / unweightedCreditsTotal).toFixed(4))
    : null;

  const weightedGPA = weightedCreditsTotal > 0
    ? parseFloat((weightedPointsTotal / weightedCreditsTotal).toFixed(4))
    : null;

  return {
    unweighted: unweightedGPA,
    weighted: weightedGPA,
    totalCredits: parseFloat(unweightedCreditsTotal.toFixed(2)),
    weightedCredits: parseFloat(weightedCreditsTotal.toFixed(2)),
    breakdown,
  };
}

/**
 * Calculates exact 4-decimal course average and category point breakdown.
 */
export function getExactCourseDetails(course) {
  if (!course) return { exactAverage: null, categories: [] };

  // 1. Check for explicit course.categories array
  if (Array.isArray(course.categories) && course.categories.length > 0) {
    let totalWeightedPoints = 0;
    let totalWeight = 0;
    const categories = [];

    course.categories.forEach(r => {
      const catName = r.name || 'Category';
      const earned = parseFloat(r.earned) || 0;
      const possible = parseFloat(r.possible) || 0;
      let weight = parseFloat(r.weight) || 0;
      let weightedPts = parseFloat(r.weightedPts) || 0;

      if (weight > 1) {
        weight = weight / 100;
        weightedPts = weightedPts / 100;
      }

      const pct = possible > 0 ? (earned / possible) * 100 : 100;
      totalWeightedPoints += weightedPts;
      totalWeight += weight;

      categories.push({
        name: catName,
        earned,
        possible,
        pct: parseFloat(pct.toFixed(4)),
        weight: parseFloat((weight * 100).toFixed(1)),
        weightedPts: parseFloat((weightedPts * 100).toFixed(4)),
      });
    });

    if (totalWeight > 0) {
      const exactAvg = (totalWeightedPoints / totalWeight) * 100;
      return {
        exactAverage: parseFloat(exactAvg.toFixed(4)),
        categories,
      };
    }
  }

  // 2. Check for category summary rows (legacy stored in assignments with '%' in category)
  const categoryRows = (course.assignments || []).filter(a => a.category && typeof a.category === 'string' && a.category.includes('%'));
  if (categoryRows.length > 0) {
    let totalWeightedPoints = 0;
    let totalWeight = 0;
    const categories = [];

    categoryRows.forEach(r => {
      const catName = r.dateDue || 'Category';
      const earned = parseFloat(r.dateAssigned) || 0;
      const possible = parseFloat(r.name) || 0;
      let weight = parseFloat(r.score) || 0;
      let weightedPts = parseFloat(r.totalPoints) || 0;

      if (weight > 1) {
        weight = weight / 100;
        weightedPts = weightedPts / 100;
      }

      const pct = possible > 0 ? (earned / possible) * 100 : 100;
      totalWeightedPoints += weightedPts;
      totalWeight += weight;

      categories.push({
        name: catName,
        earned,
        possible,
        pct: parseFloat(pct.toFixed(4)),
        weight: parseFloat((weight * 100).toFixed(1)),
        weightedPts: parseFloat((weightedPts * 100).toFixed(4)),
      });
    });

    if (totalWeight > 0) {
      const exactAvg = (totalWeightedPoints / totalWeight) * 100;
      return {
        exactAverage: parseFloat(exactAvg.toFixed(4)),
        categories,
      };
    }
  }

  // 3. Fallback: calculate from standard graded assignments
  const regularAssignments = (course.assignments || []).filter(
    a => !isNaN(parseFloat(a.score)) && !isNaN(parseFloat(a.totalPoints)) && !a.exempt && (!a.category || !a.category.includes('%'))
  );

  if (regularAssignments.length > 0) {
    const catMap = {};
    regularAssignments.forEach(a => {
      const cat = a.category || 'General';
      if (!catMap[cat]) catMap[cat] = { earned: 0, possible: 0, count: 0 };
      const w = a.weight !== null && a.weight !== undefined && !isNaN(a.weight) ? parseFloat(a.weight) : 1;
      catMap[cat].earned += parseFloat(a.score) * w;
      catMap[cat].possible += parseFloat(a.totalPoints) * w;
      catMap[cat].count++;
    });

    const categories = Object.keys(catMap).map(k => {
      const c = catMap[k];
      const pct = c.possible > 0 ? (c.earned / c.possible) * 100 : 100;
      return {
        name: k,
        earned: c.earned,
        possible: c.possible,
        pct: parseFloat(pct.toFixed(4)),
        weight: null,
      };
    });

    const totalEarned = regularAssignments.reduce((s, a) => {
      const w = a.weight !== null && a.weight !== undefined && !isNaN(a.weight) ? parseFloat(a.weight) : 1;
      return s + (parseFloat(a.score) * w);
    }, 0);
    const totalPossible = regularAssignments.reduce((s, a) => {
      const w = a.weight !== null && a.weight !== undefined && !isNaN(a.weight) ? parseFloat(a.weight) : 1;
      return s + (parseFloat(a.totalPoints) * w);
    }, 0);

    // Use computed assignment average for 4-decimal precision; fall back to official HAC average only when no scoreable points exist
    const hasOfficialAvg = course.average !== null && course.average !== undefined && !isNaN(course.average);
    const exactAvg = totalPossible > 0
      ? (totalEarned / totalPossible) * 100
      : (hasOfficialAvg ? parseFloat(course.average) : null);

    return {
      exactAverage: exactAvg !== null ? parseFloat(exactAvg.toFixed(4)) : null,
      categories,
    };
  }

  const hasOfficialAvg = course.average !== null && course.average !== undefined && !isNaN(course.average);
  return {
    exactAverage: hasOfficialAvg ? parseFloat(parseFloat(course.average).toFixed(4)) : null,
    categories: [],
  };
}

/**
 * Filters out HAC category summary rows mistakenly present in assignments.
 */
export function filterValidAssignments(assignments) {
  if (!Array.isArray(assignments)) return [];
  return assignments.filter(a => {
    if (!a || !a.name) return false;
    const nameStr = a.name.trim();
    const catStr = (a.category || '').trim();

    // Standard overall summary names
    if (/^(Course\s*Average|Overall\s*Average|Average|Total)$/i.test(nameStr)) return false;
    
    // HAC category summary rows: name is numeric point total (e.g. "100.00", "500.00", "400.00", "200.00")
    if (/^\d+(\.\d+)?$/.test(nameStr)) return false;

    // Category contains % or is formatted like weight percentage (e.g. "100.000%", "99.500%")
    if (catStr.includes('%') || /^\d+(\.\d+)?%$/.test(catStr)) return false;

    // Category summary text
    if (catStr.toLowerCase().includes('total') || catStr.toLowerCase().includes('average')) return false;

    return true;
  });
}

/**
 * Calculates updated course average when individual assignment scores are edited.
 */
export function calculateCourseAverageFromAssignments(course, customScores = {}) {
  if (!course) return 100;
  const rawList = filterValidAssignments(course.assignments || []);
  const assignments = rawList.map((a, idx) => ({
    ...a,
    score: customScores[idx] !== undefined && customScores[idx] !== null && customScores[idx] !== ''
      ? parseFloat(customScores[idx])
      : a.score,
  }));

  const regularAssignments = assignments.filter(
    a => a.score !== null && !isNaN(parseFloat(a.score)) && !isNaN(parseFloat(a.totalPoints)) && !a.exempt
  );

  if (regularAssignments.length === 0) {
    return course.average !== null && course.average !== undefined ? parseFloat(course.average) : 100;
  }

  // If course has category weights, compute weighted category average
  if (Array.isArray(course.categories) && course.categories.length > 0) {
    const catScores = {};
    regularAssignments.forEach(a => {
      const cat = (a.category || 'General').toLowerCase().trim();
      if (!catScores[cat]) catScores[cat] = { earned: 0, possible: 0 };
      const w = a.weight !== null && a.weight !== undefined && !isNaN(a.weight) ? parseFloat(a.weight) : 1;
      catScores[cat].earned += parseFloat(a.score) * w;
      catScores[cat].possible += parseFloat(a.totalPoints) * w;
    });

    let totalWeightedPoints = 0;
    let totalWeight = 0;

    course.categories.forEach(cat => {
      const cName = (cat.name || '').toLowerCase().trim();
      const match = Object.keys(catScores).find(k => k.includes(cName) || cName.includes(k));
      let weight = parseFloat(cat.weight) || 0;
      if (weight > 1) weight = weight / 100;

      if (match && catScores[match].possible > 0) {
        const catPct = catScores[match].earned / catScores[match].possible;
        totalWeightedPoints += catPct * weight;
        totalWeight += weight;
      } else if (cat.earned !== undefined && cat.possible > 0) {
        const catPct = parseFloat(cat.earned) / parseFloat(cat.possible);
        totalWeightedPoints += catPct * weight;
        totalWeight += weight;
      }
    });

    if (totalWeight > 0) {
      return parseFloat(((totalWeightedPoints / totalWeight) * 100).toFixed(4));
    }
  }

  // Fallback: direct assignment point calculation
  const totalEarned = regularAssignments.reduce((s, a) => {
    const w = a.weight !== null && a.weight !== undefined && !isNaN(a.weight) ? parseFloat(a.weight) : 1;
    return s + (parseFloat(a.score) * w);
  }, 0);
  const totalPossible = regularAssignments.reduce((s, a) => {
    const w = a.weight !== null && a.weight !== undefined && !isNaN(a.weight) ? parseFloat(a.weight) : 1;
    return s + (parseFloat(a.totalPoints) * w);
  }, 0);

  return totalPossible > 0 ? parseFloat(((totalEarned / totalPossible) * 100).toFixed(4)) : (course.average ?? 100);
}

/**
 * Estimates class rank and quartile based on 6.0 weighted scale.
 */
export function estimateClassRank(weightedGPA, classSize = 650) {
  if (!weightedGPA || isNaN(weightedGPA)) {
    return {
      estimatedRank: null,
      percentile: 'Pending',
      quartile: 'Pending',
      status: 'Official rank unreleased (Grade 09)',
    };
  }

  const gpa = parseFloat(weightedGPA);

  if (gpa >= 6.0) {
    return {
      estimatedRank: 1,
      percentile: 'Top 1%',
      quartile: '1st Quartile',
      status: 'Tied for Valedictorian (#1)',
    };
  } else if (gpa >= 5.85) {
    const est = Math.max(2, Math.round(classSize * 0.03));
    return {
      estimatedRank: est,
      percentile: 'Top 3%',
      quartile: '1st Quartile',
      status: `Top 3% (~#${est} of ${classSize})`,
    };
  } else if (gpa >= 5.70) {
    const est = Math.max(15, Math.round(classSize * 0.07));
    return {
      estimatedRank: est,
      percentile: 'Top 10%',
      quartile: '1st Quartile',
      status: `Top 10% (~#${est} of ${classSize})`,
    };
  } else if (gpa >= 5.40) {
    const est = Math.round(classSize * 0.20);
    return {
      estimatedRank: est,
      percentile: 'Top 25%',
      quartile: '1st Quartile',
      status: `1st Quartile (~#${est} of ${classSize})`,
    };
  } else if (gpa >= 5.00) {
    const est = Math.round(classSize * 0.40);
    return {
      estimatedRank: est,
      percentile: 'Top 50%',
      quartile: '2nd Quartile',
      status: `2nd Quartile (~#${est} of ${classSize})`,
    };
  } else {
    return {
      estimatedRank: Math.round(classSize * 0.65),
      percentile: 'Lower 50%',
      quartile: '3rd Quartile',
      status: 'Lower 50%',
    };
  }
}
