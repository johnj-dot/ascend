import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getTheme } from '../utils/themeConfig';
import { 
  ChevronRight, AlertCircle, Calendar, BookOpen, 
  ChevronLeft, X, CheckCircle2, MapPin, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ScheduleModal from '../components/ScheduleModal';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function codeInfo(code) {
  if (!code || typeof code !== 'string' || !code.trim()) return null;
  const c = code.toLowerCase();
  if (c.includes('absent') || c.includes('unexcused') || c.includes('abs')) return { label: 'Absent', color: 'bg-red-500', text: 'text-red-500' };
  if (c.includes('tardy') || c.includes('late')) return { label: 'Tardy', color: 'bg-amber-400', text: 'text-amber-500' };
  if (c.includes('excused')) return { label: 'Excused', color: 'bg-blue-400', text: 'text-blue-500' };
  if (c.includes('present')) return { label: 'Present', color: 'bg-emerald-500', text: 'text-emerald-500' };
  return null;
}

function isWeekend(d, month, year) {
  const cellDate = new Date(year, month, d);
  const dayOfWeek = cellDate.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function isFutureDate(d, month, year, today) {
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const cellDate = new Date(year, month, d);
  return cellDate > todayStart;
}

function parseAttendancePeriods(codeStr) {
  if (!codeStr || typeof codeStr !== 'string') return [];
  const periods = [];
  
  // Regex to extract each period block, e.g. "period: 01 Attendance: Present", "period: 01, Attendance: Present", "period: 01Attendance: Present"
  const regex = /(?:period|per)[\s:#]*([0-9a-zA-Z]+)[,\s]*(?:Attendance\s*[:\s]*)?([^,\r\n;]+?)(?=(?:,\s*)?(?:period|per)|\r|\n|;|$)/gi;
  let match;
  while ((match = regex.exec(codeStr)) !== null) {
    const periodNum = match[1].trim();
    let rawStatus = match[2].trim();
    rawStatus = rawStatus.replace(/^[:\-–—]\s*/, '').replace(/[,\r\n]/g, '').trim();
    if (!rawStatus) continue;

    const info = codeInfo(rawStatus);
    periods.push({
      period: periodNum,
      rawStatus,
      label: info?.label || (rawStatus.toLowerCase().includes('present') ? 'Present' : rawStatus),
      color: info?.color || (rawStatus.toLowerCase().includes('present') ? 'bg-emerald-500' : 'bg-gray-400'),
    });
  }

  // Fallback: If no periods were matched but codeStr has text, provide single breakdown
  if (periods.length === 0 && codeStr.trim()) {
    const info = codeInfo(codeStr);
    if (info) {
      periods.push({
        period: 'All',
        rawStatus: codeStr,
        label: info.label,
        color: info.color,
      });
    }
  }

  return periods;
}

// ── Exact Attendance Tab Calendar Component ───────────────────────────────────
function AttendanceOverviewCalendar({ attendance = [], classes = [], theme }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const viewMonthName = MONTHS[month].toLowerCase();
  const viewYearStr = String(year);

  const dayMap = {};
  attendance.forEach((rec) => {
    const d = parseInt(rec.day, 10);
    if (isNaN(d)) return;

    const rMonth = String(rec.month || '').toLowerCase().trim();
    const rYear = String(rec.year || '').trim();

    const matchesMonth = !rMonth || rMonth === viewMonthName || rMonth.startsWith(viewMonthName.slice(0, 3));
    const matchesYear = !rYear || rYear === viewYearStr;

    if (matchesMonth && matchesYear) {
      dayMap[d] = rec.code || rec.raw || '';
    }
  });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const absents = Object.entries(dayMap).filter(([d, code]) => {
    const dayNum = parseInt(d, 10);
    return !isFutureDate(dayNum, month, year, today) && !isWeekend(dayNum, month, year) && codeInfo(code)?.label === 'Absent';
  }).length;

  const tardies = Object.entries(dayMap).filter(([d, code]) => {
    const dayNum = parseInt(d, 10);
    return !isFutureDate(dayNum, month, year, today) && !isWeekend(dayNum, month, year) && codeInfo(code)?.label === 'Tardy';
  }).length;

  const excused = Object.entries(dayMap).filter(([d, code]) => {
    const dayNum = parseInt(d, 10);
    return !isFutureDate(dayNum, month, year, today) && !isWeekend(dayNum, month, year) && codeInfo(code)?.label === 'Excused';
  }).length;

  return (
    <div className="space-y-4">
      {/* Day Detail Modal (Exact Popup from Attendance Tab) */}
      {selectedDay && (() => {
        const periods = parseAttendancePeriods(selectedDay.code);
        const dayInfo = codeInfo(selectedDay.code) || { label: 'Recorded', color: 'bg-emerald-500' };

        return (
          <div onClick={() => setSelectedDay(null)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div onClick={e => e.stopPropagation()} className={`${theme.cardBg} rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border ${theme.cardBorder} animate-in fade-in zoom-in duration-200`}>
              {/* Modal Top Banner */}
              <div className={`px-6 pt-6 pb-4 ${theme.bgClass} text-white flex justify-between items-center`}>
                <div>
                  <h3 className="font-bold text-lg leading-tight">
                    {MONTHS[month]} {selectedDay.day}, {year}
                  </h3>
                  <p className="text-xs opacity-90 mt-0.5">Daily Attendance Record</p>
                </div>
                <button onClick={() => setSelectedDay(null)} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {/* Overall Day Status Card */}
                <div className={`flex items-center justify-between p-3.5 rounded-2xl ${theme.isDark ? 'bg-slate-900/90' : 'bg-gray-50'} border ${theme.cardBorder}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${dayInfo.color}`} />
                    <span className={`font-bold ${theme.textPrimary} text-sm`}>Day Status</span>
                  </div>
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full text-white ${dayInfo.color} shadow-xs`}>
                    {dayInfo.label}
                  </span>
                </div>

                {/* Period by Period List */}
                {periods.length > 0 ? (
                  <div className="space-y-2">
                    <label className={`block text-[11px] font-bold ${theme.textSecondary} uppercase tracking-wider`}>
                      Period Breakdown ({periods.length} Periods)
                    </label>
                    <div className={`divide-y ${theme.divideColor} rounded-2xl border ${theme.cardBorder} overflow-hidden ${theme.isDark ? 'bg-slate-900/50' : 'bg-gray-50/50'}`}>
                      {periods.map((p, idx) => {
                        const matchedClass = classes.find(c =>
                          c.period === p.period ||
                          c.period?.replace(/^0+/, '') === p.period?.replace(/^0+/, '')
                        );
                        return (
                          <div key={idx} className="px-4 py-2.5 flex items-center justify-between">
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className={`text-xs font-bold ${theme.textPrimary}`}>
                                {p.period === 'All' ? 'Full Day' : `Period ${p.period}`}
                                {matchedClass?.name && <span className={`font-normal ${theme.textSecondary}`}> · {matchedClass.name}</span>}
                              </span>
                            </div>
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full text-white ${p.color} shrink-0`}>
                              {p.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className={`p-3 rounded-2xl ${theme.isDark ? 'bg-slate-900/50' : 'bg-gray-50'} border ${theme.cardBorder} text-xs ${theme.textSecondary}`}>
                    All periods recorded present.
                  </div>
                )}

                {/* Footer Info */}
                <div className={`p-3 rounded-2xl ${theme.isDark ? 'bg-slate-900/50' : 'bg-gray-50'} border ${theme.cardBorder} text-xs ${theme.textSecondary} flex items-center justify-between`}>
                  <span>Verified Source:</span>
                  <strong className={theme.textPrimary}>HAC Attendance Records</strong>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Main Calendar Card */}
      <div className={`${theme.cardBg} rounded-2xl shadow-sm border ${theme.cardBorder} p-5 transition-colors duration-200`}>
        
        {/* Month Navigation & Attendance Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className={`p-1.5 rounded-lg hover:${theme.lightBgClass} transition cursor-pointer`}
            >
              <ChevronLeft size={20} className={theme.textSecondary} />
            </button>
            <h2 className={`font-bold text-base ${theme.textPrimary}`}>{MONTHS[month]} {year}</h2>
            <button
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className={`p-1.5 rounded-lg hover:${theme.lightBgClass} transition cursor-pointer`}
            >
              <ChevronRight size={20} className={theme.textSecondary} />
            </button>
            <button
              onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg ${theme.lightBgClass} ${theme.textClass} hover:opacity-80 transition cursor-pointer ml-1`}
            >
              Today
            </button>
          </div>

          {/* Attendance Stats Badges */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
              theme.isDark
                ? 'bg-red-950/40 text-red-400 border border-red-700/60 shadow-2xs'
                : 'bg-red-50 text-red-600 border border-red-200 shadow-2xs'
            }`}>
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>{absents} Absent</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
              theme.isDark
                ? 'bg-amber-950/40 text-amber-400 border border-amber-700/60 shadow-2xs'
                : 'bg-amber-50 text-amber-600 border border-amber-200 shadow-2xs'
            }`}>
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{tardies} Tardy</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
              theme.isDark
                ? 'bg-blue-950/40 text-blue-400 border border-blue-700/60 shadow-2xs'
                : 'bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs'
            }`}>
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>{excused} Excused</span>
            </div>
          </div>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-2">
          {DAYS.map(d => (
            <div key={d} className={`text-center text-[10px] font-bold ${theme.textMuted}`}>{d}</div>
          ))}
        </div>

        {/* Calendar Grid with Round Circles */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const isFuture = isFutureDate(d, month, year, today);
            const isWknd = isWeekend(d, month, year);
            const rawCode = dayMap[d];
            // Only highlight if ACTUAL attendance data exists for this specific day
            const info = (!isFuture && !isWknd && rawCode) ? codeInfo(rawCode) : null;
            const today_ = isToday(d);

            return (
              <div key={i} className="relative group flex flex-col items-center justify-center p-1">
                <button
                  disabled={!info}
                  onClick={() => info && setSelectedDay({ day: d, code: rawCode })}
                  className={`flex flex-col items-center justify-center outline-none ${info ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition
                    ${today_ ? `ring-2 ${theme.ringClass} ring-offset-1` : ''}
                    ${info ? `${info.color} text-white group-hover:scale-110 shadow-sm` : (isWknd || isFuture ? theme.textMuted : `${theme.textPrimary} group-hover:bg-black/5 dark:group-hover:bg-white/5`)}`}>
                    {d}
                  </div>
                </button>

                {/* Sleek Themed Interactive Hover Tooltip (Only for days with verified attendance entries) */}
                {!isFuture && !isWknd && info && (
                  <div className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-hover:-translate-y-1 transition-all duration-200 ease-out min-w-[130px] max-w-[190px]">
                    <div className={`${theme.cardBg} border ${theme.cardBorder} p-2.5 rounded-2xl shadow-xl text-center flex flex-col items-center gap-1 backdrop-blur-md`}>
                      <div className="flex items-center justify-between w-full border-b border-black/5 dark:border-white/10 pb-1 px-0.5">
                        <span className={`text-[10px] font-bold ${theme.textSecondary}`}>
                          {MONTHS[month].slice(0, 3)} {d}, {year}
                        </span>
                        {today_ && (
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full ${theme.lightBgClass} ${theme.textClass}`}>
                            Today
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`w-2 h-2 rounded-full ${info.color}`} />
                        <span className={`text-xs font-extrabold ${theme.textPrimary}`}>{info.label}</span>
                      </div>

                      <span className={`text-[9px] ${theme.textMuted} font-semibold leading-tight`}>
                        Click for period breakdown
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className={`flex flex-wrap gap-4 mt-4 pt-3 border-t ${theme.divideColor} justify-center text-xs font-semibold ${theme.textSecondary}`}>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-red-500 shrink-0" />
            <span>Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shrink-0" />
            <span>Tardy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-blue-400 shrink-0" />
            <span>Excused</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Present</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function Overview() {
  const { hacData, activeTheme, localOverrides, completedItemIds, toggleItemCompleted } = useStore();
  const theme = getTheme(activeTheme);
  const navigate = useNavigate();
  const [showSchedule, setShowSchedule] = useState(false);

  // Helper to filter out ASP.NET summary footer rows like "99", "Course Average", etc.
  const isInvalidOrSummaryRow = (a) => {
    if (!a || !a.name) return true;
    const nameStr = String(a.name).trim();
    if (!nameStr) return true;
    if (/^\d+(\.\d+)?$/.test(nameStr)) return true;
    if (/^(Course\s*Average|Overall\s*Average|Total\s*Average|Average|Total|Summary)$/i.test(nameStr)) return true;
    if (/Course\s*Average|Overall\s*Average/i.test(nameStr)) return true;
    return false;
  };

  // Extract all valid assignments across classes safely
  const classesList = Array.isArray(hacData?.classes) ? hacData.classes : [];
  const allAssignments = classesList.flatMap(c => {
    const className = String(c?.name || 'Course');
    const assignList = Array.isArray(c?.assignments) ? c.assignments : [];
    return assignList
      .filter(a => !isInvalidOrSummaryRow(a))
      .map(a => ({ ...a, class: className }));
  });

  const missingList = allAssignments.filter(a => a?.missing);

  // 1. Gather all graded assignment names to filter out any custom tasks that are now graded
  const gradedKeys = new Set();
  classesList.forEach(c => {
    const cName = String(c?.name || '').toLowerCase().trim();
    const assignList = Array.isArray(c?.assignments) ? c.assignments : [];
    assignList.forEach(a => {
      if (a && a.name && a.score !== null && a.score !== undefined && a.score !== '' && !a.missing) {
        const aName = String(a.name).toLowerCase().trim();
        if (cName && aName) gradedKeys.add(`${cName}_${aName}`);
        if (aName) gradedKeys.add(aName);
      }
    });
  });

  const completedSet = new Set(Array.isArray(completedItemIds) ? completedItemIds : []);

  // 2. Gather HAC upcoming assignments (ungraded only)
  const hacUpcoming = allAssignments
    .filter(a => a && !a.missing && (a.score === null || a.score === undefined || a.score === '') && !a.exempt)
    .map(a => {
      const cls = String(a.class || 'HAC Assignment');
      const name = String(a.name || 'Assignment');
      const dateVal = a.dateDue || a.date || '';
      return {
        id: `hac-${cls}-${name}-${dateVal}`,
        name,
        class: cls,
        category: a.category || 'Assignment',
        dateDue: dateVal,
        time: '',
        source: 'hac',
      };
    })
    .filter(item => !completedSet.has(item.id));

  // 3. Gather custom created tasks from planner (exclude if already graded)
  const customTasksList = Array.isArray(localOverrides?.plannerTasks) ? localOverrides.plannerTasks : [];
  const customUpcoming = customTasksList
    .filter(t => {
      if (!t || !t.dueDate) return false;
      if (completedSet.has(t.id)) return false;
      const taskName = String(t.name || '').toLowerCase().trim();
      const courseName = String(t.course || '').toLowerCase().trim();
      const courseKey = courseName ? `${courseName}_${taskName}` : '';
      if (gradedKeys.has(taskName) || (courseKey && gradedKeys.has(courseKey))) return false;
      return true;
    })
    .map(t => ({
      id: t.id || String(Date.now()),
      name: t.name || 'Task',
      class: t.course || 'General Task',
      category: t.type || 'Homework',
      dateDue: t.dueDate,
      time: t.dueTime || '',
      source: 'custom',
    }));

  // 4. Combine & sort upcoming assignments chronologically
  const upcomingList = [...hacUpcoming, ...customUpcoming].sort((a, b) => {
    const parseDate = (dStr) => {
      if (!dStr) return Infinity;
      const t = new Date(dStr).getTime();
      return isNaN(t) ? Infinity : t;
    };
    return parseDate(a.dateDue) - parseDate(b.dateDue);
  });

  return (
    <div className={`${theme.appBg} w-full flex flex-col transition-colors duration-200`}>
      {/* Schedule Modal */}
      {showSchedule && <ScheduleModal classes={hacData?.classes} onClose={() => setShowSchedule(false)} />}

      {/* Header */}
      <div className={`${theme.bgClass} px-6 pt-12 pb-6 text-white w-full shadow-md`}>
        <div className="max-w-5xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Overview</h1>
            <p className="text-xs font-medium opacity-90 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${theme.appBg} flex-1 px-6 py-6 w-full shadow-inner transition-colors duration-200`}>
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Quick Menu */}
          <div className={`${theme.cardBg} rounded-2xl shadow-sm border ${theme.cardBorder} overflow-hidden transition-colors duration-200`}>
            <button
              onClick={() => setShowSchedule(true)}
              className={`w-full px-4 py-3.5 flex justify-between items-center hover:${theme.lightBgClass} transition cursor-pointer`}
            >
              <span className={`font-bold ${theme.textPrimary} flex items-center gap-3 text-sm`}>
                <span className={`w-8 h-8 rounded-2xl ${theme.lightBgClass} ${theme.textClass} flex items-center justify-center font-bold`}>
                  <Calendar size={16} />
                </span>
                Class Schedule & Teachers
              </span>
              <ChevronRight size={18} className={theme.isDark ? 'text-slate-500' : 'text-gray-400'} />
            </button>
          </div>

          {/* Exact Attendance Tab Calendar */}
          <AttendanceOverviewCalendar 
            attendance={hacData?.attendance || []} 
            classes={hacData?.classes || []}
            theme={theme} 
          />

          {/* Missing Assignments */}
          {missingList.length > 0 && (
            <div>
              <h2 className={`text-xs font-black ${theme.textSecondary} uppercase tracking-wider mb-3`}>Missing Assignments</h2>
              <div className="space-y-3">
                {missingList.map((miss, idx) => (
                  <div key={idx} className={`${theme.cardBg} p-4 rounded-2xl shadow-sm border ${theme.cardBorder} flex items-center gap-4 transition-colors duration-200`}>
                    <div className="bg-red-500/10 text-red-500 px-2.5 py-3 rounded-xl font-bold text-xs text-center leading-tight shrink-0">
                      <AlertCircle size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold ${theme.textPrimary} text-sm truncate`}>{miss.name}</h3>
                      <p className={`text-xs ${theme.textSecondary}`}>{miss.class}</p>
                    </div>
                    {miss.dateDue && (
                      <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-lg shrink-0">
                        {miss.dateDue}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Assignments */}
          <div>
            <h2 className={`text-xs font-black ${theme.textSecondary} uppercase tracking-wider mb-3`}>Upcoming & Due Soon</h2>
            {upcomingList.length === 0 ? (
              <div className={`${theme.cardBg} p-8 rounded-2xl shadow-sm border ${theme.cardBorder} text-center space-y-2 transition-colors duration-200`}>
                <p className={`font-bold text-sm ${theme.textPrimary}`}>No upcoming assignments due</p>
                <p className={`text-xs ${theme.textSecondary}`}>You're all caught up on your coursework!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingList.slice(0, 8).map(item => {
                  const isDone = (completedItemIds || []).includes(item.id);
                  return (
                    <div key={item.id} className={`${theme.cardBg} p-4 rounded-2xl shadow-sm border ${theme.cardBorder} flex items-center gap-4 transition-colors duration-200`}>
                      <button
                        type="button"
                        onClick={() => toggleItemCompleted(item.id)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : `${theme.lightBgClass} ${theme.textClass} hover:opacity-80`
                        }`}
                        title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {isDone ? <CheckCircle2 size={20} /> : <BookOpen size={18} />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold ${theme.textPrimary} text-sm truncate ${isDone ? 'line-through opacity-60' : ''}`}>{item.name}</h3>
                        <p className={`text-xs ${theme.textSecondary}`}>{item.class} · {item.category}</p>
                      </div>
                      {item.dateDue && (
                        <span className={`text-xs font-bold ${theme.textClass} ${theme.lightBgClass} px-2.5 py-1 rounded-lg shrink-0`}>
                          {item.dateDue}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
