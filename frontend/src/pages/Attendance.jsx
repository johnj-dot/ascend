import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getTheme } from '../utils/themeConfig';
import { ChevronLeft, ChevronRight, X, Clock, Info, CheckCircle2, AlertCircle } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function codeInfo(code) {
  if (!code || typeof code !== 'string' || !code.trim()) return null;
  const c = code.toLowerCase();
  if (c.includes('absent') || c.includes('unexcused') || c.includes('abs')) return { label: 'Absent', color: 'bg-red-500' };
  if (c.includes('tardy') || c.includes('late')) return { label: 'Tardy', color: 'bg-amber-400' };
  if (c.includes('excused')) return { label: 'Excused', color: 'bg-blue-400' };
  if (c.includes('present')) return { label: 'Present', color: 'bg-emerald-500' };
  return null;
}

function isWeekend(d, month, year) {
  const cellDate = new Date(year, month, d);
  const dayOfWeek = cellDate.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
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

export default function Attendance() {
  const { hacData, activeTheme } = useStore();
  const theme = getTheme(activeTheme);
  const rawAttendance = hacData?.attendance || [];

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(null);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const viewMonthName = MONTHS[month].toLowerCase();
  const viewYearStr = String(year);

  const dayMap = {};
  rawAttendance.forEach((rec) => {
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
    <div className={`${theme.appBg} w-full flex flex-col transition-colors duration-200`}>
      {/* Day Detail Modal */}
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

                {/* Period by Period List if available */}
                {periods.length > 0 ? (
                  <div className="space-y-2">
                    <label className={`block text-[11px] font-bold ${theme.textSecondary} uppercase tracking-wider`}>
                      Period Breakdown ({periods.length} Periods)
                    </label>
                    <div className={`divide-y ${theme.divideColor} rounded-2xl border ${theme.cardBorder} overflow-hidden ${theme.isDark ? 'bg-slate-900/50' : 'bg-gray-50/50'}`}>
                      {periods.map((p, idx) => {
                        const matchedClass = (hacData?.classes || []).find(c =>
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
                ) : null}

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

      {/* Header */}
      <div className={`${theme.bgClass} px-6 pt-12 pb-6 text-white w-full`}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-4">
            <h1 className="text-4xl font-bold">Attendance</h1>
            <p className="text-sm font-medium opacity-90 mt-1">Calendar & record summary</p>
          </div>

          {/* Quick stats banner */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{absents}</p>
              <p className="text-[10px] uppercase opacity-80 tracking-wide">Absences</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{tardies}</p>
              <p className="text-[10px] uppercase opacity-80 tracking-wide">Tardies</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-bold">{excused}</p>
              <p className="text-[10px] uppercase opacity-80 tracking-wide">Excused</p>
            </div>
          </div>
        </div>
      </div>

      <div className={`${theme.appBg} flex-1 px-4 py-6 w-full shadow-inner transition-colors duration-200`}>
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Calendar */}
          <div className={`${theme.cardBg} rounded-2xl shadow-sm border ${theme.cardBorder} p-5 transition-colors duration-200`}>
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className={`p-1 rounded-lg hover:${theme.lightBgClass} transition cursor-pointer`}
              >
                <ChevronLeft size={20} className={theme.textSecondary} />
              </button>
              <h2 className={`font-bold ${theme.textPrimary}`}>{MONTHS[month]} {year}</h2>
              <button
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className={`p-1 rounded-lg hover:${theme.lightBgClass} transition cursor-pointer`}
              >
                <ChevronRight size={20} className={theme.textSecondary} />
              </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className={`text-center text-[10px] font-bold ${theme.textMuted}`}>{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (!d) return <div key={i} />;
                const isFuture = isFutureDate(d, month, year, today);
                const isWknd = isWeekend(d, month, year);
                const rawCode = dayMap[d];
                // Never color future dates or weekends
                const info = (!isFuture && !isWknd && rawCode) ? codeInfo(rawCode) : null;
                const today_ = isToday(d);

                return (
                  <button
                    key={i}
                    disabled={!info}
                    onClick={() => info && setSelectedDay({ day: d, code: rawCode })}
                    className={`flex flex-col items-center gap-0.5 group outline-none ${info ? 'cursor-pointer' : 'cursor-default'}`}
                    title={info ? rawCode : ''}
                  >
                    <div className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold transition
                      ${today_ ? `ring-2 ${theme.ringClass} ring-offset-1` : ''}
                      ${info ? `${info.color} text-white group-hover:scale-110 shadow-sm` : (isWknd || isFuture ? theme.textMuted : theme.textPrimary)}`}>
                      {d}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className={`${theme.cardBg} rounded-2xl shadow-sm border ${theme.cardBorder} p-4 transition-colors duration-200`}>
            <h3 className={`text-sm font-bold ${theme.textPrimary} mb-3`}>Legend</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Absent',  color: 'bg-red-500' },
                { label: 'Tardy',   color: 'bg-amber-400' },
                { label: 'Excused', color: 'bg-blue-400' },
                { label: 'Present', color: 'bg-emerald-500' },
              ].map(({ label, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full ${color} shrink-0`} />
                  <span className={`text-sm ${theme.textSecondary}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Log list — ONLY show Absences, Tardies, Excused for past weekdays */}
          {(() => {
            const alertEntries = Object.entries(dayMap).filter(([d, code]) => {
              const dayNum = parseInt(d, 10);
              if (isFutureDate(dayNum, month, year, today) || isWeekend(dayNum, month, year)) return false;
              const info = codeInfo(code);
              return info && (info.label === 'Absent' || info.label === 'Tardy' || info.label === 'Excused');
            });

            if (alertEntries.length === 0) {
              return (
                <div className={`text-center ${theme.textMuted} py-10 ${theme.cardBg} rounded-2xl border ${theme.cardBorder} shadow-sm`}>
                  <p className="font-semibold">No attendance alerts for {MONTHS[month]}.</p>
                  <p className="text-sm">Clean attendance record for this month.</p>
                </div>
              );
            }

            return (
              <div className={`${theme.cardBg} rounded-2xl shadow-sm border ${theme.cardBorder} overflow-hidden transition-colors duration-200`}>
                <div className={`px-4 py-3 border-b ${theme.cardBorder}`}>
                  <h3 className={`font-bold ${theme.textPrimary}`}>{MONTHS[month]} Attendance Alerts</h3>
                </div>
                <div className={`divide-y ${theme.divideColor}`}>
                  {alertEntries.map(([d, code]) => {
                    const info = codeInfo(code);
                    return (
                      <button
                        key={d}
                        onClick={() => setSelectedDay({ day: d, code })}
                        className={`w-full flex items-center justify-between px-4 py-3 hover:${theme.lightBgClass} transition text-left cursor-pointer`}
                      >
                        <span className={`${theme.textPrimary} font-medium`}>{MONTHS[month]} {d}</span>
                        <span className={`text-xs font-bold text-white px-3 py-1 rounded-full ${info.color}`}>
                          {info.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
