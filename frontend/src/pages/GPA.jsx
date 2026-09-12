import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { getTheme } from '../utils/themeConfig';
import {
  classifyCourse,
  cleanCourseName,
  getUnweightedPoints,
  getWeightedPoints,
  calculateGPA,
  estimateClassRank,
  getExactCourseDetails,
  calculateCourseAverageFromAssignments,
  filterValidAssignments,
  WEIGHT_TIERS,
} from '../utils/gpaEngine';
import {
  Award,
  GraduationCap,
  TrendingUp,
  RotateCcw,
  Info,
  Sliders,
  Sparkles,
  ChevronDown,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';

export default function GPA() {
  const { hacData, activeTheme } = useStore();
  const theme = getTheme(activeTheme);

  // Extract raw HAC classes and transcript data
  const rawClasses = hacData?.classes || [];
  const rawTranscript = hacData?.transcript || { years: [], gpa: {} };
  const officialGpa = rawTranscript.gpa || {};

  // Interactive state for courses: allows "What-If" grade edits, individual assignment changes, and tier overrides
  const [editedGrades, setEditedGrades] = useState({});
  const [editedAssignments, setEditedAssignments] = useState({}); // { [courseId]: { [assignmentIndex]: number } }
  const [tierOverrides, setTierOverrides] = useState({});
  const [expandedCourseId, setExpandedCourseId] = useState(null);
  const [includeTranscript, setIncludeTranscript] = useState(false);
  const [activeTierDropdown, setActiveTierDropdown] = useState(null);

  // Reset interactive overrides back to live HAC values
  const handleReset = () => {
    setEditedGrades({});
    setEditedAssignments({});
    setTierOverrides({});
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleGlobalClick = () => setActiveTierDropdown(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Update a single assignment score and recalculate that course's GPA contribution
  const handleAssignmentScoreChange = (courseId, assignmentIndex, newScore, courseObj) => {
    setEditedAssignments(prev => {
      const courseEdits = { ...(prev[courseId] || {}) };
      if (newScore === '' || newScore === null || isNaN(parseFloat(newScore))) {
        delete courseEdits[assignmentIndex];
      } else {
        courseEdits[assignmentIndex] = parseFloat(newScore);
      }

      // Automatically compute updated course average from assignment scores
      const updatedAvg = calculateCourseAverageFromAssignments(courseObj, courseEdits);
      setEditedGrades(prevG => ({ ...prevG, [courseId]: updatedAvg }));

      return {
        ...prev,
        [courseId]: courseEdits,
      };
    });
  };

  // Format current classes with overrides and auto-classification
  const activeCourses = useMemo(() => {
    return rawClasses.map(c => {
      const courseId = c.id || c.name;
      const cleanName = cleanCourseName(c.name);
      const initialTier = classifyCourse(cleanName).id;
      const tier = tierOverrides[courseId] || initialTier;
      
      // Calculate exact 4-decimal course details from category weights
      const details = getExactCourseDetails(c);
      const liveGrade = details.exactAverage !== null && details.exactAverage !== undefined ? details.exactAverage : (c.average !== null && c.average !== undefined ? c.average : 100);
      const currentGrade = editedGrades[courseId] !== undefined ? editedGrades[courseId] : liveGrade;

      return {
        id: courseId,
        name: cleanName,
        period: c.period || '',
        teacher: c.teacher || '',
        grade: currentGrade,
        liveGrade,
        isEdited: (editedGrades[courseId] !== undefined && editedGrades[courseId] !== liveGrade) ||
                  (editedAssignments[courseId] && Object.keys(editedAssignments[courseId]).length > 0),
        tier,
        credits: 1.0,
        enabled: true,
        assignments: filterValidAssignments(c.assignments || []),
        categories: c.categories || [],
        rawCourse: c,
      };
    });
  }, [rawClasses, editedGrades, editedAssignments, tierOverrides]);

  // Only show Include Prior Years if student has high school credits (9th grade or above)
  const hasHighSchoolPriorYears = useMemo(() => {
    return (rawTranscript?.years || []).some(yr => {
      const g = parseInt(yr.grade, 10);
      return !isNaN(g) && g >= 9;
    });
  }, [rawTranscript]);

  // Format historical transcript courses if student enables cumulative calculation
  const historicalCourses = useMemo(() => {
    if (!includeTranscript || !rawTranscript?.years) return [];
    const courses = [];
    (rawTranscript.years || []).forEach(yr => {
      (yr.courses || []).forEach(c => {
        const finalGrade = parseFloat(c.finalGrade || c.sem1 || c.sem2 || 100);
        const tier = classifyCourse(c.description || '').id;
        courses.push({
          id: `hist-${c.courseId}-${yr.year}`,
          name: `${c.description} (${yr.year})`,
          period: yr.grade ? `Gr ${yr.grade}` : '',
          teacher: yr.building || 'Middle School',
          grade: finalGrade,
          liveGrade: finalGrade,
          isEdited: false,
          tier,
          credits: parseFloat(c.credit) || 1.0,
          enabled: true,
          isHistorical: true,
        });
      });
    });
    return courses;
  }, [includeTranscript, rawTranscript]);

  const allSelectedCourses = useMemo(() => {
    return [...activeCourses, ...historicalCourses];
  }, [activeCourses, historicalCourses]);

  // Compute live GPAs via GPA Engine
  const gpaResult = useMemo(() => {
    return calculateGPA(allSelectedCourses);
  }, [allSelectedCourses]);

  // Calculate class rank & cohort standing
  const rankInfo = useMemo(() => {
    const classSize = officialGpa.classSize || 650;
    if (officialGpa.rank) {
      return {
        rank: officialGpa.rank,
        classSize,
        quartile: officialGpa.quartile || '1st Quartile',
        isOfficial: true,
        label: `#${officialGpa.rank} of ${classSize}`,
      };
    }
    const estimate = estimateClassRank(gpaResult.weighted, classSize);
    return {
      rank: estimate.estimatedRank,
      classSize,
      quartile: estimate.quartile,
      isOfficial: false,
      label: estimate.status,
      percentile: estimate.percentile,
    };
  }, [officialGpa, gpaResult.weighted]);

  const hasAnyEdits = Object.keys(editedGrades).length > 0 ||
    Object.keys(editedAssignments).length > 0 ||
    Object.keys(tierOverrides).length > 0;

  return (
    <div className={`min-h-screen ${theme.appBg} flex flex-col transition-colors duration-200`}>
      {/* Top Header Section */}
      <header className="px-4 sm:px-8 pt-8 pb-6 border-b border-black/[0.05] dark:border-white/[0.05]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-xl ${theme.bgClass} flex items-center justify-center text-white shadow-sm`}>
                  <GraduationCap size={18} />
                </div>
                <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${theme.isDark ? 'text-white' : theme.textClass}`}>
                  GPA Calculator
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  RRISD 6.0 / 4.0
                </span>
              </div>
              <p className={`text-xs ${theme.textSecondary} font-medium mt-1`}>
                Round Rock High School grading scale · Interactive What-If simulation
              </p>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-2.5">
              {hasHighSchoolPriorYears && (
                <button
                  type="button"
                  onClick={() => setIncludeTranscript(prev => !prev)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
                    includeTranscript
                      ? `${theme.bgClass} text-white shadow-md border-transparent`
                      : `${theme.cardBg} ${theme.cardBorder} ${theme.textSecondary} hover:${theme.textPrimary}`
                  }`}
                >
                  <BookOpen size={14} />
                  <span>Include Prior Years ({rawTranscript.years?.length || 0})</span>
                </button>
              )}

              {hasAnyEdits && (
                <button
                  type="button"
                  onClick={handleReset}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 cursor-pointer animate-in fade-in`}
                >
                  <RotateCcw size={13} />
                  <span>Reset What-If</span>
                </button>
              )}
            </div>
          </div>

          {/* DUAL STAT CARDS: Unweighted Left, Weighted Right (Bounded, never overflows) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-6">
            
            {/* 1. LEFT CARD: Unweighted GPA (4.0 Scale) */}
            <div className={`${theme.cardBg} rounded-3xl p-6 border ${theme.cardBorder} shadow-sm relative overflow-hidden flex flex-col justify-between transition-all`}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                    Unweighted GPA
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl sm:text-5xl font-black tracking-tight text-emerald-500">
                      {gpaResult.unweighted !== null ? gpaResult.unweighted.toFixed(4) : '—'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">/ 4.0000</span>
                  </div>
                </div>
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-sm">
                  4.0
                </div>
              </div>

              {/* Progress track */}
              <div className="mt-5 space-y-2">
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ((gpaResult.unweighted || 0) / 4.0) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium">
                  <span>90–100 Bracket = 4.0000 Max</span>
                  <span>{gpaResult.totalCredits.toFixed(1)} Total Credits</span>
                </div>
              </div>
            </div>

            {/* 2. RIGHT CARD: Weighted GPA (6.0 Scale) */}
            <div className={`${theme.cardBg} rounded-3xl p-6 border ${theme.cardBorder} shadow-sm relative overflow-hidden flex flex-col justify-between transition-all border-emerald-500/20`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                      Weighted GPA
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400">
                      Top Tier
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl sm:text-5xl font-black tracking-tight text-emerald-400 drop-shadow-sm">
                      {gpaResult.weighted !== null ? gpaResult.weighted.toFixed(4) : '—'}
                    </span>
                    <span className="text-xs font-bold text-slate-400">/ 6.0000</span>
                  </div>
                </div>
                <div className={`w-11 h-11 rounded-2xl ${theme.bgClass} text-white flex items-center justify-center font-black text-sm shadow-md shadow-emerald-500/20`}>
                  6.0
                </div>
              </div>

              {/* Progress track */}
              <div className="mt-5 space-y-2">
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, ((gpaResult.weighted || 0) / 6.0) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium">
                  <span>
                    {gpaResult.weighted && gpaResult.unweighted
                      ? `+${(gpaResult.weighted - gpaResult.unweighted).toFixed(4)} Weight Boost`
                      : 'AP / Advanced Weighted'}
                  </span>
                  <span>{gpaResult.weightedCredits.toFixed(1)} Weighted Credits</span>
                </div>
              </div>
            </div>

          </div>

          {/* CLASS RANK & COHORT STANDING PILL */}
          <div className={`mt-4 p-4 rounded-2xl border ${theme.cardBorder} ${theme.cardBg} flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Award size={16} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-extrabold ${theme.isDark ? 'text-slate-200' : 'text-slate-900'}`}>Class Rank:</span>
                  <span className="font-black text-amber-500">{rankInfo.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${theme.isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'} border`}>
                    {rankInfo.quartile}
                  </span>
                </div>
                <p className={`text-[11px] ${theme.textSecondary} mt-0.5`}>
                  {rankInfo.isOfficial
                    ? 'Official district class rank verified from HAC transcript.'
                    : 'Round Rock ISD releases official ranks in 10th/11th grade. Current standing is dynamically computed.'}
                </p>
              </div>
            </div>

            <div className={`shrink-0 flex items-center gap-1.5 text-[11px] ${theme.textSecondary}`}>
              <Info size={13} className="text-slate-400" />
              <span>RRISD Top 10% Auto-Admit Policy</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area - Grade Information & Breakdown List */}
      <main className="flex-1 px-4 sm:px-8 py-6 max-w-5xl mx-auto w-full space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-emerald-500" />
            <h2 className={`text-base font-bold ${theme.isDark ? 'text-white' : theme.textClass}`}>
              Class Breakdown & What-If Simulator
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {allSelectedCourses.length} Classes · Drag slider or edit grade to simulate
          </span>
        </div>

        {/* Course Cards List */}
        <div className="space-y-3">
          {allSelectedCourses.map((c) => {
            const currentTier = WEIGHT_TIERS[c.tier] || WEIGHT_TIERS.unweighted_only;
            const uwPoint = getUnweightedPoints(c.grade);
            const wPoint = getWeightedPoints(c.grade, c.tier);

            return (
              <div
                key={c.id}
                className={`${theme.cardBg} rounded-3xl p-5 border ${theme.cardBorder} shadow-sm hover:border-emerald-500/30 transition-all space-y-4`}
              >
                {/* Course Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div
                    className="flex items-start gap-3 flex-1 cursor-pointer select-none"
                    onClick={() => setExpandedCourseId(expandedCourseId === c.id ? null : c.id)}
                  >
                    {c.period && (
                      <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                        {c.period}
                      </span>
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-bold text-sm sm:text-base ${theme.isDark ? 'text-white' : 'text-slate-900'}`}>
                          {c.name}
                        </h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${theme.isDark ? 'bg-slate-800 text-slate-300 border border-slate-700' : 'bg-slate-100 text-slate-700'}`}>
                          Avg: {Math.round(c.grade)}%
                        </span>
                        {c.isEdited && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Simulated
                          </span>
                        )}
                        {c.isHistorical && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Prior Credit
                          </span>
                        )}
                        <ChevronDown size={14} className={`transition-transform duration-200 ${expandedCourseId === c.id ? 'rotate-180 text-emerald-500' : 'text-slate-500'}`} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                        {c.teacher && <span>{c.teacher} ·</span>}
                        <span>Exact: <strong className="text-emerald-500 font-mono font-bold">{c.grade.toFixed(4)}%</strong></span>
                        {c.assignments?.length > 0 && (
                          <span className="text-[11px] text-slate-500 hover:text-emerald-400 underline cursor-pointer">
                            ({c.assignments.length} assignments · click to edit)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Weighting Tier Dropdown Pill */}
                  <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setActiveTierDropdown(activeTierDropdown === c.id ? null : c.id)}
                      className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${
                        c.tier === 'ap_advanced'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : c.tier === 'on_level_weighted'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
                          : c.tier === 'unweighted_only'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                          : 'bg-slate-500/10 text-slate-400 border-slate-500/30 hover:bg-slate-500/20'
                      }`}
                    >
                      <span>{currentTier.badge}</span>
                      <ChevronDown size={12} className="opacity-70" />
                    </button>

                    {/* Tier Selection Dropdown */}
                    {activeTierDropdown === c.id && (
                      <div className="absolute right-0 mt-2 w-56 bg-[#131b2e] border border-slate-700 rounded-2xl p-1.5 shadow-2xl z-30 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                        {Object.values(WEIGHT_TIERS).map(tierOpt => (
                          <button
                            key={tierOpt.id}
                            type="button"
                            onClick={() => {
                              setTierOverrides(prev => ({ ...prev, [c.id]: tierOpt.id }));
                              setActiveTierDropdown(null);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                              c.tier === tierOpt.id
                                ? 'bg-emerald-600 text-white font-bold'
                                : 'text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <span>{tierOpt.label}</span>
                            {c.tier === tierOpt.id && <CheckCircle2 size={13} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Grade Slider & What-If Interactive Row */}
                <div className="pt-2 border-t border-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  
                  {/* Slider Control */}
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-400 w-12 shrink-0">
                      Grade:
                    </span>
                    <input
                      type="range"
                      min="50"
                      max="100"
                      step="0.1"
                      value={c.grade || 100}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setEditedGrades(prev => ({ ...prev, [c.id]: val }));
                      }}
                      className="w-full accent-emerald-500 h-2 bg-slate-700 rounded-lg cursor-pointer transition-all"
                    />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="105"
                        step="0.01"
                        value={c.grade !== null && c.grade !== undefined ? (typeof c.grade === 'number' ? Math.round(c.grade * 10000) / 10000 : c.grade) : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? null : parseFloat(e.target.value);
                          setEditedGrades(prev => ({ ...prev, [c.id]: val }));
                        }}
                        className={`w-16 px-2 py-1 rounded-xl ${theme.isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-100 border-slate-300 text-slate-900'} border text-center font-black text-xs sm:text-sm focus:border-emerald-500 focus:outline-none`}
                      />
                      <span className="text-xs font-bold text-slate-400">%</span>
                    </div>
                  </div>

                  {/* Point Breakdown Pill */}
                  <div className="flex items-center gap-2 text-xs shrink-0 self-end sm:self-auto">
                    <div className={`px-3 py-1.5 rounded-xl ${theme.isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'} border flex items-center gap-2`}>
                      <span>UW: <strong className="text-emerald-500 font-bold">{uwPoint !== null ? uwPoint.toFixed(4) : '—'}</strong> pts</span>
                      <span className="opacity-30">|</span>
                      <span>
                        W:{' '}
                        {wPoint !== null ? (
                          <strong className="text-teal-500 font-bold">{wPoint.toFixed(4)} pts</strong>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Excluded (Unweighted)</span>
                        )}
                      </span>
                    </div>

                    {c.isEdited && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditedGrades(prev => {
                            const next = { ...prev };
                            delete next[c.id];
                            return next;
                          });
                          setEditedAssignments(prev => {
                            const next = { ...prev };
                            delete next[c.id];
                            return next;
                          });
                        }}
                        className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
                        title="Revert to live grade"
                      >
                        <RotateCcw size={12} />
                      </button>
                    )}
                  </div>

                </div>

                {/* Individual Assignments What-If Section */}
                {expandedCourseId === c.id && (
                  <div className="pt-3 border-t border-slate-800/60 space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <span>Individual Assignments ({c.assignments?.length || 0})</span>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Change individual grades to simulate exact GPA
                      </span>
                    </div>

                    {c.assignments && c.assignments.length > 0 ? (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {c.assignments.map((a, aIdx) => {
                          const editedScore = editedAssignments[c.id]?.[aIdx];
                          const currentScore = editedScore !== undefined ? editedScore : (a.score !== null && a.score !== undefined ? a.score : '');
                          const isScoreEdited = editedScore !== undefined && editedScore !== a.score;

                          return (
                            <div
                              key={aIdx}
                              className={`px-3 py-2 rounded-xl border flex items-center justify-between gap-2 text-xs transition ${
                                isScoreEdited
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                  : theme.isDark ? 'bg-slate-900/50 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="truncate font-semibold text-xs text-slate-200" title={a.name}>
                                  {a.name}
                                </span>
                                {a.category && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-400 shrink-0 border border-slate-700">
                                    {a.category}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <input
                                  type="number"
                                  min="0"
                                  max="150"
                                  step="0.5"
                                  value={currentScore}
                                  placeholder="—"
                                  onChange={(e) => handleAssignmentScoreChange(c.id, aIdx, e.target.value, c.rawCourse)}
                                  className={`w-14 px-1.5 py-0.5 rounded-lg border text-center font-bold text-xs focus:border-emerald-500 focus:outline-none ${
                                    isScoreEdited
                                      ? 'border-amber-500 text-amber-400 bg-amber-950/20'
                                      : theme.isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-900'
                                  }`}
                                />
                                <span className="text-slate-400 text-[11px] font-medium">
                                  / {a.totalPoints ?? 100}
                                </span>

                                {isScoreEdited && (
                                  <button
                                    type="button"
                                    onClick={() => handleAssignmentScoreChange(c.id, aIdx, null, c.rawCourse)}
                                    className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
                                    title="Revert assignment score"
                                  >
                                    <RotateCcw size={10} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-2">
                        No individual assignments recorded for this course. Use the grade slider above to simulate.
                      </p>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}
