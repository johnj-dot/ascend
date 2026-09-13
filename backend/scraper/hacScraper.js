import fs from 'fs';
import * as cheerio from 'cheerio';

// ─── Helpers ────────────────────────────────────────────────────────────────

function t(el, $) {
  return $(el).text().replace(/\s+/g, ' ').trim();
}

// ─── Page Scrapers ───────────────────────────────────────────────────────────

/**
 * Scrape Student/Registration.aspx
 * Fields: Student ID, Student Name, Birth Date, Counselor, Building, Gender, Grade, Language
 */
function scrapeRegistration(html) {
  const $ = cheerio.load(html);
  return {
    studentId: $('#plnMain_lblRegStudentID').text().trim() || null,
    studentName: $('#plnMain_lblRegStudentName').text().trim() || null,
    birthDate: $('#plnMain_lblBirthDate').text().trim() || null,
    counselor: $('#plnMain_lblCounselor').text().trim() || null,
    building: $('#plnMain_lblBuildingName').text().trim() || null,
    gender: $('#plnMain_lblGender').text().trim() || null,
    grade: $('#plnMain_lblGrade').text().trim() || null,
    language: $('#plnMain_lblLanguage').text().trim() || null,
  };
}

/**
 * Scrape Student/Classes.aspx
 * Table ID: plnMain_dgSchedule
 * Cols: Course | Description | Periods | Teacher | Room | Days | Marking Periods | Building | Status
 */
function scrapeClasses(html) {
  const $ = cheerio.load(html);
  const classes = {};

  $('#plnMain_dgSchedule .sg-asp-table-data-row').each((_, row) => {
    const cols = $(row).find('td');
    if (cols.length < 5) return;

    const courseId = t(cols[0], $);
    const name     = t(cols[1], $);
    const period   = t(cols[2], $);
    const teacher  = t(cols[3], $);
    const room     = t(cols[4], $);
    const rawDays  = t(cols[5], $);
    const mps      = t(cols[6], $);
    const status   = t(cols[8], $);

    if (!courseId || !name || status !== 'Active') return;

    let days = rawDays.trim();
    if (days.toUpperCase() === 'A') days = 'A Day';
    else if (days.toUpperCase() === 'B') days = 'B Day';
    else {
      const perNum = parseInt(period, 10);
      if (!isNaN(perNum)) {
        days = (perNum >= 1 && perNum <= 4) ? 'A Day' : (perNum >= 5 && perNum <= 8) ? 'B Day' : (days || null);
      }
    }

    // Deduplicate: strip semester suffix (e.g. "3929A - 3" and "3929B - 3" → same class)
    const baseId = courseId.replace(/[AB] -/, 'A -');
    if (!classes[baseId]) {
      classes[baseId] = {
        id: baseId,
        name,
        period,
        teacher,
        room,
        days,
        markingPeriods: mps,
        average: null,
        letterGrade: null,
        assignments: [],
      };
    }
  });

  return Object.values(classes);
}

/**
 * Scrape Home/WeekView (Home View Summary)
 * Extracts all courses, current averages, and weekly assignments with popup metadata
 */
function scrapeWeekView(html, dialogDetails = {}) {
  const $ = cheerio.load(html);
  const classes = [];

  $('.sg-homeview-table tbody tr, .sg-homeview-table tr, .sg-asp-table tr').each((rowIdx, row) => {
    if ($(row).hasClass('sg-asp-table-header-row') || $(row).find('th').length > 0) return;

    const tds = $(row).find('td');
    if (tds.length < 2) return;

    let cell1 = $(tds[0]);
    let courseLink = cell1.find('a[id^="courseName-"], a[onclick*="Class"], a[href*="Class"]').first();
    let courseName = courseLink.length > 0 ? courseLink.text().trim() : '';

    const cell1Text = cell1.text().replace(/\s+/g, ' ').trim();
    if (!courseName) {
      const nameMatch = cell1Text.match(/^([^(]+?)(?:\s*\([^)]+\)|\s*Per:|$)/i);
      if (nameMatch && nameMatch[1].trim()) {
        courseName = nameMatch[1].trim();
      } else {
        courseName = cell1Text.split('\n')[0].trim();
      }
    }
    courseName = courseName.replace(/\s*\([^)]+\).*$/, '').replace(/Per:\s*.*$/, '').trim();
    if (!courseName || /^class$/i.test(courseName)) return;

    // Extract Course ID, Period, Teacher
    const idMatch = cell1Text.match(/\(([^)]+)\)/);
    const perMatch = cell1Text.match(/Per:\s*(\w+)/i);
    const teacherMatch = cell1Text.match(/Per:\s*\w+\s+(.+)$/i);

    const rawCourseId = idMatch ? idMatch[1].trim() : `C-${rowIdx}`;
    const baseId = rawCourseId.replace(/[AB] -/, 'A -');
    const period = perMatch ? perMatch[1].trim() : '';
    const teacher = teacherMatch ? teacherMatch[1].trim() : '';

    // Average cell (column 2)
    const avgCell = $(tds[1]);
    const avgLink = avgCell.find('a[id^="average-"], a');
    const avgText = avgLink.length > 0 ? avgLink.text().trim() : avgCell.text().trim();
    const parsedAvgMatch = avgText.match(/(\d+\.?\d*)/);
    const rawAvg = parsedAvgMatch ? parseFloat(parsedAvgMatch[1]) : null;
    const classAvg = (rawAvg !== null && !isNaN(rawAvg)) ? rawAvg : null;

    const assignments = [];

    // Search cells in this row for assignment items
    $(row).find('.sg-assignment-description, a[href*="Assignment"]').each((_, el) => {
      const titleAttr = $(el).attr('title') || '';
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (!titleAttr && (!text || text === '100' || text.includes('ViewAssignments'))) return;

      let name = text;
      let category = 'General';
      let dateDue = null;
      let totalPoints = 100;
      let score = null;
      let weight = 1;
      let missing = false;
      let exempt = false;

      if (titleAttr) {
        const titleMatch = titleAttr.match(/Title:\s*(.+?)(?:\n|$|Category:)/i);
        const catMatch = titleAttr.match(/Category:\s*(.+?)(?:\n|$|Due Date:)/i);
        const dueMatch = titleAttr.match(/Due Date:\s*([\d/]+)/i);
        const maxMatch = titleAttr.match(/Max Points:\s*([\d.]+)/i);

        if (titleMatch) name = titleMatch[1].trim();
        if (catMatch) category = catMatch[1].trim();
        if (dueMatch) dateDue = dueMatch[1].trim();
        if (maxMatch) totalPoints = parseFloat(maxMatch[1]);
      }

      // Check for scores in text e.g. "M1T1L1 Homework 100/100" or "Syllabus 100/100"
      const scoreMatch = text.match(/(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)/);
      if (scoreMatch) {
        score = parseFloat(scoreMatch[1]);
        totalPoints = parseFloat(scoreMatch[2]);
      } else if (text.includes(' 100%') || text.endsWith(' 100')) {
        score = 100;
      } else if (text.endsWith(' M') || text.includes('Missing')) {
        missing = true;
      } else if (text.endsWith(' X') || text.includes('Exempt')) {
        exempt = true;
      }

      // Clean name
      name = name.replace(/\s*\d+\.?\d*\s*\/\s*\d+\.?\d*$/, '').replace(/\s*100%?$/, '').replace(/\*/g, '').trim();
      if (!name || name === '100' || name.startsWith('ViewAssignments')) return;

      // Attach dialog details if available
      const cleanCourseKey = courseName.toLowerCase().replace(/tag\/advanced\s+|tag\/ap\s+|ap\s+/i, '').trim();
      const cleanAssignKey = name.toLowerCase().replace(/\*/g, '').trim();

      const matchedDialog = Object.entries(dialogDetails).find(([k]) => {
        const [cKey, aKey] = k.split('_');
        return (cKey.includes(cleanCourseKey) || cleanCourseKey.includes(cKey)) &&
               (aKey.includes(cleanAssignKey) || cleanAssignKey.includes(aKey));
      });

      if (matchedDialog) {
        const d = matchedDialog[1];
        if (d.weight !== undefined) weight = d.weight;
        if (d.score !== undefined && d.score !== null) score = d.score;
        if (d.totalPoints !== undefined && d.totalPoints !== null) totalPoints = d.totalPoints;
        if (d.dateDue) dateDue = d.dateDue;
        if (d.category) category = d.category;
      } else if (/syllabus|safety contract|parent signature/i.test(name)) {
        weight = 0;
      }

      assignments.push({
        name,
        category,
        dateDue,
        score,
        totalPoints,
        weight,
        missing,
        exempt,
      });
    });

    // Compute or verify class average considering weights
    let calculatedAverage = classAvg;
    const graded = assignments.filter(a => a.score !== null && !isNaN(a.score) && a.totalPoints !== null && !isNaN(a.totalPoints) && !a.exempt);
    const weightedGraded = graded.filter(a => a.weight > 0);

    if (calculatedAverage === null && weightedGraded.length > 0) {
      const totalEarned = weightedGraded.reduce((s, a) => s + (a.score * (a.weight !== undefined ? a.weight : 1)), 0);
      const totalPossible = weightedGraded.reduce((s, a) => s + (a.totalPoints * (a.weight !== undefined ? a.weight : 1)), 0);
      if (totalPossible > 0) {
        calculatedAverage = parseFloat(((totalEarned / totalPossible) * 100).toFixed(1));
      }
    } else if (calculatedAverage === null && weightedGraded.length === 0 && graded.length > 0 && graded.every(a => a.weight === 0)) {
      // All graded assignments have 0 weight -> class has no graded assignments yet!
      calculatedAverage = null;
    }

    const perNum = parseInt(period, 10);
    const resolvedDay = (!isNaN(perNum) && perNum >= 1 && perNum <= 4) ? 'A Day' : (!isNaN(perNum) && perNum >= 5 && perNum <= 8) ? 'B Day' : null;

    classes.push({
      id: baseId,
      name: courseName,
      period,
      teacher,
      days: resolvedDay,
      average: calculatedAverage,
      letterGrade: gradeToLetter(calculatedAverage),
      assignments,
    });
  });

  return classes;
}

/**
 * Scrape Student/Assignments.aspx
 * Tables: plnMain_rptAssigmnetsByCourse_dgCourseAssignments_N
 * Headers (rows in the header section before each table): .sg-header-heading
 * Cols: Date Due | Date Assigned | Assignment | Category | Score | Total Points | Weight | Weighted Score | Weighted Total Points
 */
function scrapeAssignments(html, classes) {
  const $ = cheerio.load(html);

  // Strategy 1: Iterate over .AssignmentClass blocks
  $('.AssignmentClass').each((_, card) => {
    const headingEl = $(card).find('.sg-header-heading').first();
    const heading = t(headingEl, $);
    if (!heading) return;

    // Course ID and Name extraction e.g. "1115A - 6 TAG/Advanced English I"
    const cleanHeading = heading.replace(/^\S+\s*-\s*\d+\s+/, '').replace(/\(.*?\)/g, '').trim();
    const idMatch = heading.match(/^(\S+\s*-\s*\d+)/);
    const baseCourseId = idMatch ? idMatch[1].replace(/[AB] -/, 'A -').trim() : null;

    let currentCourse = classes.find(c => {
      const cName = c.name.toLowerCase().trim();
      const hName = cleanHeading.toLowerCase().trim();
      const rawH = heading.toLowerCase().trim();
      const baseId = (c.id || '').split(' ')[0].toLowerCase().trim();
      return (
        cName === hName ||
        rawH.includes(cName) ||
        cName.includes(hName) ||
        (baseId && rawH.startsWith(baseId)) ||
        (c.id && rawH.includes(c.id.toLowerCase()))
      );
    });

    if (!currentCourse) {
      currentCourse = {
        id: baseCourseId || `C-${classes.length}`,
        name: cleanHeading || heading,
        period: '',
        teacher: '',
        room: '',
        average: null,
        letterGrade: null,
        assignments: [],
      };
      classes.push(currentCourse);
    }

    // Extract average directly from the course header
    const avgHeader = $(card).find('span[id*="lblHdrAverage"], span[title="AVG"], .sg-header-heading.sg-right').text().trim();
    const avgMatch = avgHeader.match(/(\d+\.?\d*)/);
    if (avgMatch) {
      const parsedAvg = parseFloat(avgMatch[1]);
      if (!isNaN(parsedAvg)) {
        currentCourse.average = parsedAvg;
        currentCourse.letterGrade = gradeToLetter(parsedAvg);
      }
    }

    // Scrape assignments from table
    const assignments = [];
    $(card).find('.sg-asp-table-data-row').each((_, row) => {
      const cols = $(row).find('td');
      if (cols.length < 6) return;
      const dateDue      = t(cols[0], $);
      const dateAssigned = t(cols[1], $);
      const assignName   = t(cols[2], $).replace(/\*/g, '').trim();
      const category     = t(cols[3], $);
      const score        = t(cols[4], $);
      const totalPoints  = t(cols[5], $);
      const rawWeight    = t(cols[6], $);

      if (!assignName) return;

      const rowText = $(row).text();
      if (/Course\s*Average|Overall\s*Average|Total\s*Average/i.test(rowText)) return;
      if (/^(Course\s*Average|Average|Total)$/i.test(assignName)) return;
      if (/^\d+(\.\d+)?$/.test(assignName) && !dateDue && (!score || score.trim() === '')) return;

      // Filter out HAC category summary rows (e.g. "100.00", "500.00" with category "100.000%" and weights like 0.6)
      const isCategorySummaryRow = (category && category.includes('%')) ||
        (/^\d+(\.\d+)?$/.test(assignName) && (/Formative|Summative|Assessment/i.test(dateDue) || /%/i.test(category)));

      if (isCategorySummaryRow) {
        if (!currentCourse.categories) currentCourse.categories = [];
        const catName = dateDue || 'Category';
        const earned = parseFloat(dateAssigned) || 0;
        const possible = parseFloat(assignName) || 0;
        const w = parseFloat(score) || 0;
        const wPts = parseFloat(totalPoints) || 0;
        currentCourse.categories.push({
          name: catName,
          earned,
          possible,
          pct: parseFloat((category || '').replace('%', '')) || (possible > 0 ? (earned / possible) * 100 : 100),
          weight: w > 1 ? w : w * 100,
          weightedPts: wPts > 1 ? wPts : wPts * 100,
        });
        return;
      }

      const isMissing  = $(cols[4]).find('.sg-content-alert-container').length > 0 || score === 'M';
      const isExempt   = score === 'X';
      const numericScore = score && !isNaN(parseFloat(score)) ? parseFloat(score) : null;
      const maxScore     = totalPoints && !isNaN(parseFloat(totalPoints)) ? parseFloat(totalPoints) : null;
      const parsedWeight = rawWeight && !isNaN(parseFloat(rawWeight)) ? parseFloat(rawWeight) : 1;

      assignments.push({
        name: assignName,
        dateDue: dateDue || null,
        dateAssigned: dateAssigned || null,
        category: category || 'General',
        score: numericScore,
        totalPoints: maxScore,
        weight: parsedWeight,
        missing: isMissing,
        exempt: isExempt,
      });
    });

    if (assignments.length > 0) {
      currentCourse.assignments = assignments;
    }

    // Fallback average from table footer if not found in header
    if (currentCourse.average === null) {
      const avgRow = $(card).find('tr').filter((_, r) => {
        const text = $(r).text();
        return /Course\s*Average|Overall\s*Average/i.test(text);
      });
      if (avgRow.length > 0) {
        const avgText = t(avgRow.last(), $);
        const rowAvgMatch = avgText.match(/(?:Course|Overall)\s*Average:?\s*(\d+\.?\d*)/i);
        if (rowAvgMatch) {
          currentCourse.average = parseFloat(rowAvgMatch[1]);
          currentCourse.letterGrade = gradeToLetter(currentCourse.average);
        }
      }
    }
  });

  // Strategy 2: If .AssignmentClass not present, check ddlClasses dropdown or table headers
  if (classes.length === 0) {
    $('#plnMain_ddlClasses option').each((_, opt) => {
      const text = $(opt).text().trim();
      const val = $(opt).attr('value');
      if (!val || val === 'ALL' || !text) return;
      const cleanName = text.replace(/^\S+\s*-\s*\d+\s+/, '').trim();
      const idMatch = text.match(/^(\S+\s*-\s*\d+)/);
      const baseId = idMatch ? idMatch[1].replace(/[AB] -/, 'A -').trim() : `C-${classes.length}`;
      if (!classes.some(c => c.id === baseId || c.name.toLowerCase() === cleanName.toLowerCase())) {
        classes.push({
          id: baseId,
          name: cleanName,
          period: '',
          teacher: '',
          room: '',
          average: null,
          letterGrade: null,
          assignments: [],
        });
      }
    });
  }

  // Second pass: compute averages from assignments with strict weight enforcement if average still null
  classes.forEach(c => {
    if (c.average === null && Array.isArray(c.assignments) && c.assignments.length > 0) {
      const graded = c.assignments.filter(a => a.score !== null && a.totalPoints !== null && !isNaN(a.score) && !isNaN(a.totalPoints) && !a.exempt);
      const weightedGraded = graded.filter(a => a.weight > 0);
      if (weightedGraded.length > 0) {
        const totalEarned = weightedGraded.reduce((s, a) => s + (a.score * (a.weight !== undefined ? a.weight : 1)), 0);
        const totalPossible = weightedGraded.reduce((s, a) => s + (a.totalPoints * (a.weight !== undefined ? a.weight : 1)), 0);
        if (totalPossible > 0) {
          c.average = parseFloat(((totalEarned / totalPossible) * 100).toFixed(1));
          c.letterGrade = gradeToLetter(c.average);
        }
      } else if (graded.length > 0 && graded.every(a => a.weight === 0)) {
        c.average = null;
        c.letterGrade = null;
      }
    }
  });
}


/**
 * Scrape Student/Transcript.aspx
 * Extracts ALL years, course history, final grades, credits, cumulative GPA, and class rank.
 */
function scrapeTranscript(html) {
  const $ = cheerio.load(html);
  const years = [];

  // Strategy 1: Iterate over course tables with ID containing dgCourses
  $('table[id*="dgCourses"]').each((idx, table) => {
    const yearVal = $(`#plnMain_rpTranscriptGroup_lblYearValue_${idx}`).text().trim();
    const gradeVal = $(`#plnMain_rpTranscriptGroup_lblGradeValue_${idx}`).text().trim();
    const bldgVal = $(`#plnMain_rpTranscriptGroup_lblBuildingValue_${idx}`).text().trim();

    let year = yearVal;
    let grade = gradeVal;
    let building = bldgVal;

    if (!year) {
      const prevText = $(table).prevAll().text() || $(table).parent().text();
      const ym = prevText.match(/Year:\s*([\d-]+)/i);
      const gm = prevText.match(/Grade:\s*(\w+)/i);
      const bm = prevText.match(/Building:\s*(.+?)(?:Grade:|Course|$)/i);
      if (ym) year = ym[1].trim();
      if (gm) grade = gm[1].trim();
      if (bm) building = bm[1].trim();
    }

    const yearData = {
      year: year || `Year ${idx + 1}`,
      grade: grade || null,
      building: building || null,
      courses: [],
      totalCredits: 0,
    };

    $(table).find('tr.sg-asp-table-data-row').each((_, row) => {
      const cols = $(row).find('td');
      if (cols.length < 5) return;

      const courseId    = t(cols[0], $);
      const description = t(cols[1], $);
      const sem1        = t(cols[2], $);
      const sem2        = t(cols[3], $);
      const finalGrade  = t(cols[4], $);
      const credit      = parseFloat(t(cols[cols.length - 1], $)) || 0;

      if (!courseId || !description) return;

      yearData.courses.push({
        courseId,
        description,
        sem1: sem1 || null,
        sem2: sem2 || null,
        finalGrade: finalGrade || null,
        credit,
      });

      yearData.totalCredits += credit;
    });

    if (yearData.courses.length > 0) {
      yearData.totalCredits = parseFloat(yearData.totalCredits.toFixed(3));
      years.push(yearData);
    }
  });

  // Strategy 2: Fallback to .sg-transcript-group or header rows if dgCourses tables not matched
  if (years.length === 0) {
    $('.sg-transcript-group, .sg-asp-table-header-row').each((_, headerEl) => {
      const text = t(headerEl, $);
      const yearMatch  = text.match(/Year:\s*([\d-]+)/i);
      const gradeMatch = text.match(/Grade:\s*(\w+)/i);
      const bldgMatch  = text.match(/Building:\s*(.+?)(?:Grade:|$)/i);

      if (!yearMatch) return;

      const yearData = {
        year: yearMatch[1].trim(),
        grade: gradeMatch ? gradeMatch[1].trim() : null,
        building: bldgMatch ? bldgMatch[1].trim() : null,
        courses: [],
        totalCredits: 0,
      };

      const table = $(headerEl).nextAll('table').first();
      table.find('.sg-asp-table-data-row').each((_, row) => {
        const cols = $(row).find('td');
        if (cols.length < 5) return;

        const courseId    = t(cols[0], $);
        const description = t(cols[1], $);
        const sem1        = t(cols[2], $);
        const sem2        = t(cols[3], $);
        const finalGrade  = t(cols[4], $);
        const credit      = parseFloat(t(cols[cols.length - 1], $)) || 0;

        if (!courseId || !description) return;

        yearData.courses.push({
          courseId,
          description,
          sem1: sem1 || null,
          sem2: sem2 || null,
          finalGrade: finalGrade || null,
          credit,
        });

        yearData.totalCredits += credit;
      });

      if (yearData.courses.length > 0) {
        yearData.totalCredits = parseFloat(yearData.totalCredits.toFixed(3));
        years.push(yearData);
      }
    });
  }

  // Scrape cumulative GPA, Rank, Class Size, Quartile, Scale
  let gpaWeighted = null;
  let gpaUnweighted = null;
  let rank = null;
  let classSize = null;
  let quartile = null;
  let scale = null;

  $('table[id*="tblCumGPAInfo"], table[id*="dgGPA"], table[id*="tblGPA"]').find('tr').each((_, r) => {
    const cols = $(r).find('td');
    if (cols.length >= 2) {
      const type = t(cols[0], $).toLowerCase();
      const val = parseFloat(t(cols[1], $));
      if (!isNaN(val)) {
        if (type.includes('weighted')) gpaWeighted = val;
        else if (type.includes('unweighted')) gpaUnweighted = val;
        else if (!gpaWeighted) gpaWeighted = val;
      }
    }
  });

  // Regex fallback across all text elements
  $('td, span, div, p').each((_, el) => {
    const text = $(el).text();
    const wMatch = text.match(/Weighted(?:\s+GPA)?[:\s]+(\d+\.\d+)/i);
    const uMatch = text.match(/Unweighted(?:\s+GPA)?[:\s]+(\d+\.\d+)/i);
    const rankMatch = text.match(/Rank(?:\s+in\s+Class)?[:\s]+(\d+)(?:\s*(?:of|\/)\s*(\d+))?/i);
    const quartMatch = text.match(/Quartile[:\s]+([^\n\r,;]+)/i);
    const scaleMatch = text.match(/Scale[:\s]+(\d+\.?\d*)/i);

    if (wMatch && !gpaWeighted)   gpaWeighted   = parseFloat(wMatch[1]);
    if (uMatch && !gpaUnweighted) gpaUnweighted = parseFloat(uMatch[1]);
    if (rankMatch && !rank) {
      rank = parseInt(rankMatch[1], 10);
      if (rankMatch[2] && !classSize) classSize = parseInt(rankMatch[2], 10);
    }
    if (quartMatch && !quartile) quartile = quartMatch[1].trim();
    if (scaleMatch && !scale) scale = parseFloat(scaleMatch[1]);
  });

  return {
    years,
    gpa: {
      weighted: gpaWeighted,
      unweighted: gpaUnweighted,
      rank,
      classSize,
      quartile,
      scale,
    },
  };
}

/**
 * Scrape Attendance/MonthlyView.aspx
 * Calendar day cells: #plnMain_cldAttendance td or .sg-asp-calendar td
 */
function scrapeAttendance(html) {
  const $ = cheerio.load(html);
  const attendanceRecords = [];

  const headerText = $('#plnMain_cldAttendance .sg-asp-calendar-header td').filter((_, el) => {
    return $(el).text().trim().length > 3 && !$(el).find('a').length;
  }).text().trim() || $('#plnMain_cldAttendance table tr td:nth-child(2)').text().trim();
  
  const monthMatch = headerText.match(/([A-Za-z]+)\s+(\d{4})/);
  const monthName = monthMatch ? monthMatch[1] : '';
  const yearStr = monthMatch ? monthMatch[2] : '';

  $('#plnMain_cldAttendance td, .sg-asp-calendar td, .sg-attendance-calendar-day').each((_, el) => {
    const $td = $(el);
    if ($td.find('table').length > 0 || $td.closest('table').hasClass('sg-asp-calendar-header')) return;

    const titleAttr = $td.attr('title') || '';
    const ariaLabel = $td.find('[aria-label]').attr('aria-label') || $td.attr('aria-label') || '';
    const text = $td.text().trim();
    
    const dayMatch = text.match(/^(\d{1,2})$/) || ariaLabel.match(/^(\d{1,2})/);
    if (!dayMatch) return;
    const dayNum = parseInt(dayMatch[1], 10);
    if (isNaN(dayNum) || dayNum < 1 || dayNum > 31) return;

    const info = titleAttr || ariaLabel;
    const isClosed = info.toLowerCase().includes('school closed');
    const isPresent = info.toLowerCase().includes('present');
    const isAbsent = info.toLowerCase().includes('absent') || info.toLowerCase().includes('unexcused') || info.toLowerCase().includes('excused') || info.toLowerCase().includes('tardy');

    attendanceRecords.push({
      day: dayNum,
      month: monthName,
      year: yearStr,
      status: isAbsent ? 'absent' : (isClosed ? 'closed' : (isPresent ? 'present' : 'info')),
      code: info || (isClosed ? 'School Closed' : (isPresent ? 'Present' : 'Regular Day')),
      raw: info
    });
  });

  return attendanceRecords;
}

// ─── Grade conversion ────────────────────────────────────────────────────────

function gradeToLetter(pct) {
  if (pct === null || pct === undefined || isNaN(pct)) return null;
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}

async function withRetry(fn, retries = 5, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.message.includes('Invalid credentials') || i === retries - 1) throw err;
      console.warn(`    ⚠️ Step failed (${err.message}). Retrying in ${delay * Math.pow(2, i)}ms... (Attempt ${i + 2}/${retries})`);
      await new Promise(r => setTimeout(r, delay * Math.pow(2, i)));
    }
  }
}

async function withGracefulRetry(fn, isZeroCheck, maxAttempts = 5, stepName = 'Step', delayMs = 1200) {
  let lastResult = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`    ⏳ ${stepName}: attempting to load... (Attempt ${attempt}/${maxAttempts})`);
      }
      const result = await fn();
      lastResult = result;
      if (!isZeroCheck(result)) {
        return { data: result, failed: false, attempts: attempt };
      }
    } catch (err) {
      if (err.message.includes('Invalid credentials')) throw err;
      // continue loop
    }
    if (attempt < maxAttempts) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  console.warn(`    ⚠️ Failed to pull ${stepName} after ${maxAttempts} attempts. Moving on.`);
  return { data: lastResult, failed: true, attempts: maxAttempts };
}

// ── Build Final Student Profile ──
function buildStudentProfile({ registration, classes, transcript, attendance, warnings = [] }) {
  const studentName = registration?.studentName || 'Student';
  const classesWithGrades = (classes || []).filter(c => c.average !== null);
  const overallAverage = classesWithGrades.length > 0
    ? (classesWithGrades.reduce((s, c) => s + c.average, 0) / classesWithGrades.length).toFixed(2)
    : null;

  const allAssignments = (classes || []).flatMap(c => (c.assignments || []).map(a => ({ ...a, class: c.name, courseId: c.id })));
  const upcoming = allAssignments
    .filter(a => !a.missing && (a.score === null || a.score === undefined))
    .sort((a, b) => {
      if (!a.dateDue && !b.dateDue) return 0;
      if (!a.dateDue) return 1;
      if (!b.dateDue) return -1;
      return new Date(a.dateDue) - new Date(b.dateDue);
    });
  const missing = allAssignments.filter(a => a.missing);

  return {
    studentName,
    studentId:      registration?.studentId || null,
    counselor:      registration?.counselor || null,
    grade:          registration?.grade || null,
    building:       registration?.building || null,
    school:         registration?.building || 'Home Access Center',
    registration:   registration || null,
    overallAverage: overallAverage ? parseFloat(overallAverage) : null,
    classes:        classes || [],
    upcoming,
    missing,
    transcript:     transcript || { years: [], gpa: { weighted: null, unweighted: null, rank: null, classSize: null } },
    attendance:     attendance || [],
    warnings,
  };
}

/**
 * Parse complete HAC dataset from a HAR file or HAR text
 */
function parseHacFromHar(harSource) {
  let har;
  if (typeof harSource === 'string') {
    if (fs.existsSync(harSource)) {
      har = JSON.parse(fs.readFileSync(harSource, 'utf8'));
    } else {
      har = JSON.parse(harSource);
    }
  } else {
    har = harSource;
  }

  if (!har?.log?.entries) return null;

  let regHtml = '', classesHtml = '', assignHtml = '', weekHtml = '', transHtml = '', attHtml = '';
  const dialogDetails = {};

  har.log.entries.forEach(e => {
    const url = e.request?.url || '';
    const text = e.response?.content?.text || '';
    if (!text || text.length < 50) return;

    if (url.includes('Registration.aspx')) regHtml = text;
    else if (url.includes('Classes.aspx')) classesHtml = text;
    else if (url.includes('Assignments.aspx')) assignHtml = text;
    else if (url.includes('WeekView') && text.length > 5000) weekHtml = text;
    else if (url.includes('Transcript.aspx') && text.length > 1000) transHtml = text;
    else if ((url.includes('MonthlyView.aspx') || url.includes('MonthView')) && text.length > 500) attHtml = text;
    else if (url.includes('_AssignmentDialog') && e.request?.method === 'POST') {
      const $d = cheerio.load(text);
      const container = $d('.sg-content-grid-container');
      if (container.length > 0) {
        let courseRaw = '', assignName = '', category = '', dateDue = '', points = null, weight = 1, score = null;
        container.find('div').each((_, div) => {
          const line = $d(div).text().trim();
          if (line.startsWith('Course:')) courseRaw = line.replace('Course:', '').trim();
          else if (line.startsWith('Assignment:')) assignName = line.replace('Assignment:', '').trim();
          else if (line.startsWith('Category:')) category = line.replace('Category:', '').trim();
          else if (line.startsWith('Date Due:')) dateDue = line.replace('Date Due:', '').trim();
          else if (line.startsWith('Points:')) points = parseFloat(line.replace('Points:', '').trim());
          else if (line.startsWith('Weight:')) weight = parseFloat(line.replace('Weight:', '').trim());
          else if (line.startsWith('Score:')) {
            const sText = line.replace('Score:', '').trim();
            score = sText && !isNaN(parseFloat(sText)) ? parseFloat(sText) : null;
          }
        });
        const cleanCourse = courseRaw.replace(/^\S+\s+/, '').trim().toLowerCase();
        const cleanAssign = assignName.replace(/\*/g, '').trim().toLowerCase();
        dialogDetails[`${cleanCourse}_${cleanAssign}`] = { weight, score, totalPoints: points, dateDue, category };
      }
    }
  });

  const registration = regHtml ? scrapeRegistration(regHtml) : null;
  let classes = weekHtml ? scrapeWeekView(weekHtml, dialogDetails) : (classesHtml ? scrapeClasses(classesHtml) : []);

  if (assignHtml && classes.length > 0) {
    scrapeAssignments(assignHtml, classes);
  }

  const transcript = transHtml ? scrapeTranscript(transHtml) : { years: [], gpa: { weighted: null, unweighted: null, rank: null, classSize: null } };
  const attendance = attHtml ? scrapeAttendance(attHtml) : [];

  return buildStudentProfile({ registration, classes, transcript, attendance });
}

// ── Main Scraper ──

// ── Cookie Jar Helper for HTTP Scraping ──
class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  setFromHeaders(headers) {
    if (!headers) return;
    if (typeof headers.getSetCookie === 'function') {
      const list = headers.getSetCookie();
      if (Array.isArray(list)) {
        for (const cookieStr of list) {
          this._parseCookie(cookieStr);
        }
      }
    } else {
      const raw = headers.get ? headers.get('set-cookie') : null;
      if (raw) {
        const parts = raw.split(/,(?=\s*[A-Za-z0-9_.-]+=)/);
        for (const cookieStr of parts) {
          this._parseCookie(cookieStr);
        }
      }
    }
  }

  _parseCookie(cookieStr) {
    if (!cookieStr) return;
    const [pair] = cookieStr.split(';');
    const eqIdx = pair.indexOf('=');
    if (eqIdx > 0) {
      const name = pair.slice(0, eqIdx).trim();
      const val = pair.slice(eqIdx + 1).trim();
      this.cookies.set(name, val);
    }
  }

  getCookieHeader() {
    const list = [];
    for (const [k, v] of this.cookies.entries()) {
      list.push(`${k}=${v}`);
    }
    return list.join('; ');
  }
}

// ── Main Lightweight HTTP Scraper ──
export async function scrapeHac(username, password, customDistrictUrl = null) {
  const LOGIN_URL = customDistrictUrl || process.env.HAC_URL || 'https://accesscenter.roundrockisd.org/HomeAccess/Account/LogOn';
  const urlObj = new URL(LOGIN_URL);
  const basePath = urlObj.pathname.replace(/\/Account\/LogOn.*$/i, '');
  const BASE_URL = `${urlObj.origin}${basePath}`;

  const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
  const jar = new CookieJar();

  console.log(`[HAC Scraper] Connecting to ${LOGIN_URL}...`);

  // Step 1: GET LogOn page to capture session & verification tokens
  let logonHtml = '';
  try {
    const logonRes = await fetch(LOGIN_URL, {
      headers: { 'User-Agent': userAgent },
      redirect: 'follow'
    });
    jar.setFromHeaders(logonRes.headers);
    logonHtml = await logonRes.text();
  } catch (err) {
    throw new Error(`Unable to reach district HAC portal: ${err.message}`);
  }

  const $logon = cheerio.load(logonHtml);

  const formParams = new URLSearchParams();

  // Gather all form inputs (e.g. __RequestVerificationToken, Type, LocalLogin, SiteCode, Database, VerificationOption)
  $logon('form input').each((_, el) => {
    const name = $logon(el).attr('name');
    const val = $logon(el).attr('value') || '';
    if (name && !['tempUN', 'tempPW', 'LogOnDetails.UserName', 'LogOnDetails.Password'].includes(name)) {
      formParams.append(name, val);
    }
  });

  // Gather select inputs inside form if any
  $logon('form select').each((_, el) => {
    const name = $logon(el).attr('name');
    const val = $logon(el).find('option[selected]').val() || $logon(el).find('option').first().val() || '';
    if (name) formParams.set(name, val);
  });

  // Resolve exact real username and password field names (skipping decoy tempUN / tempPW)
  let userField = $logon('input[name="LogOnDetails.UserName"]').attr('name');
  if (!userField) {
    userField = $logon('input[name*="UserName" i]:not(#tempUN)').attr('name') || 'LogOnDetails.UserName';
  }

  let passField = $logon('input[name="LogOnDetails.Password"]').attr('name');
  if (!passField) {
    passField = $logon('input[type="password"]:not(#tempPW)').attr('name') || 'LogOnDetails.Password';
  }

  formParams.set(userField, username);
  formParams.set(passField, password);

  console.log(`[HAC Scraper] Authenticating student credentials...`);

  // Step 2: POST credentials
  let postRes;
  try {
    postRes = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'User-Agent': userAgent,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': jar.getCookieHeader(),
        'Referer': LOGIN_URL
      },
      body: formParams.toString(),
      redirect: 'manual'
    });
    jar.setFromHeaders(postRes.headers);
  } catch (err) {
    throw new Error(`Authentication request failed: ${err.message}`);
  }

  // Check login response
  if (postRes.status === 200) {
    const postHtml = await postRes.text();
    const $post = cheerio.load(postHtml);
    const errorMsg = $post('.validation-summary-errors, .field-validation-error, #LogOnDetails_ValidationSummary').text().trim();
    if (errorMsg || postHtml.includes('LogOnDetails') || postHtml.includes('incorrect') || postHtml.includes('Invalid')) {
      throw new Error(errorMsg || 'Invalid HAC username or password.');
    }
  } else if (postRes.status >= 400) {
    throw new Error(`HAC server returned error code ${postRes.status}`);
  }

  const redirectLocation = postRes.headers.get('location');
  if (redirectLocation) {
    const followUrl = new URL(redirectLocation, LOGIN_URL).toString();
    try {
      const followRes = await fetch(followUrl, {
        headers: {
          'User-Agent': userAgent,
          'Cookie': jar.getCookieHeader(),
          'Referer': LOGIN_URL
        },
        redirect: 'follow'
      });
      jar.setFromHeaders(followRes.headers);
    } catch (e) {
      console.warn('[HAC Scraper] Follow redirect warning:', e.message);
    }
  }

  console.log(`[HAC Scraper] Login verified. Fetching academic records...`);

  const fetchHacPage = async (pageSubpath, maxAttempts = 3, initialDelayMs = 800) => {
    const targetUrl = `${BASE_URL}/${pageSubpath.replace(/^\//, '')}`;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`[HAC Scraper] Fetching ${pageSubpath} (attempt ${attempt}/${maxAttempts})...`);
        const res = await fetch(targetUrl, {
          headers: {
            'User-Agent': userAgent,
            'Cookie': jar.getCookieHeader(),
            'Referer': `${BASE_URL}/Home/WeekView`
          },
          redirect: 'follow'
        });

        if (res.headers) {
          jar.setFromHeaders(res.headers);
        }

        if (res.ok) {
          const text = await res.text();
          // Check if session timed out or bounced to logon
          const isLogOnBounced = text.includes('LogOnDetails.UserName') || 
                                 text.includes('id="tempUN"') || 
                                 text.includes('id="tempPW"') ||
                                 (res.url && res.url.includes('/Account/LogOn'));

          if (!isLogOnBounced && text.trim().length > 100) {
            return text;
          }

          console.warn(`[HAC Scraper] ${pageSubpath} returned logon bounce or empty body (attempt ${attempt}/${maxAttempts}).`);
        } else {
          console.warn(`[HAC Scraper] ${pageSubpath} returned HTTP status ${res.status} (attempt ${attempt}/${maxAttempts}).`);
        }
      } catch (e) {
        console.warn(`[HAC Scraper] Error fetching ${pageSubpath} (attempt ${attempt}/${maxAttempts}):`, e.message);
      }

      if (attempt < maxAttempts) {
        const backoffMs = Math.round(initialDelayMs * Math.pow(1.5, attempt - 1));
        console.log(`[HAC Scraper] Waiting ${backoffMs}ms before retrying ${pageSubpath}...`);
        await new Promise(r => setTimeout(r, backoffMs));
      }
    }

    console.warn(`[HAC Scraper] ⚠️ Failed to fetch ${pageSubpath} after ${maxAttempts} attempts.`);
    return '';
  };

  // Staggered batches to avoid ASP.NET session state locking collisions
  console.log('[HAC Scraper] Fetching Core Academics...');
  const [weekHtml, classesHtml, assignHtml] = await Promise.all([
    fetchHacPage('Home/WeekView'),
    fetchHacPage('Content/Student/Classes.aspx'),
    fetchHacPage('Content/Student/Assignments.aspx')
  ]);

  await new Promise(r => setTimeout(r, 350));

  console.log('[HAC Scraper] Fetching Student Records & History...');
  const [regHtml, transHtml, attHtml] = await Promise.all([
    fetchHacPage('Content/Student/Registration.aspx'),
    fetchHacPage('Content/Student/Transcript.aspx'),
    fetchHacPage('Content/Attendance/MonthlyView.aspx')
  ]);

  const registration = regHtml ? scrapeRegistration(regHtml) : null;
  let classes = weekHtml ? scrapeWeekView(weekHtml) : [];
  if (classesHtml) {
    const schedClasses = scrapeClasses(classesHtml);
    if (classes.length === 0) {
      classes = schedClasses;
    } else {
      schedClasses.forEach(sc => {
        const match = classes.find(c => c.id === sc.id || c.name.toLowerCase() === sc.name.toLowerCase());
        if (match) {
          match.teacher = sc.teacher || match.teacher;
          match.room = sc.room || match.room;
          match.period = sc.period || match.period;
          match.days = sc.days || match.days;
          match.markingPeriods = sc.markingPeriods || match.markingPeriods;
        } else {
          classes.push(sc);
        }
      });
    }
  }

  if (assignHtml && classes.length > 0) {
    scrapeAssignments(assignHtml, classes);
  }

  const transcript = transHtml ? scrapeTranscript(transHtml) : { years: [], gpa: { weighted: null, unweighted: null, rank: null, classSize: null } };
  const attendance = attHtml ? scrapeAttendance(attHtml) : [];

  const warnings = [];
  if (!registration || !registration.studentId) {
    warnings.push({ section: 'Registration', message: 'Failed to pull registration details.' });
  }
  if (!transcript || !transcript.years || transcript.years.length === 0) {
    warnings.push({ section: 'Transcript', message: 'Failed to pull transcript records.' });
  }
  if (!attendance || attendance.length === 0) {
    warnings.push({ section: 'Attendance', message: 'Failed to pull attendance records.' });
  }

  return buildStudentProfile({
    registration,
    classes,
    transcript,
    attendance,
    warnings
  });
}

// Exports for unit testing without live network
export { scrapeWeekView, scrapeClasses, scrapeAssignments, scrapeTranscript, scrapeAttendance, scrapeRegistration, gradeToLetter, parseHacFromHar, withGracefulRetry };
