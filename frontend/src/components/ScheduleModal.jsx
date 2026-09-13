import React from 'react';
import { X, User, MapPin, Mail, BookOpen } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getTheme } from '../utils/themeConfig';

function getTeacherEmail(teacherName) {
  if (!teacherName || typeof teacherName !== 'string') return null;
  const parts = teacherName.split(',').map(s => s.trim().toLowerCase());
  if (parts.length > 1) {
    return `${parts[1]}_${parts[0]}@roundrockisd.org`;
  }
  return `${parts[0]}@roundrockisd.org`;
}

function resolveScheduleDay(cls, idx) {
  if (cls?.days && typeof cls.days === 'string' && cls.days.trim()) {
    const d = cls.days.trim().toUpperCase();
    if (d === 'A' || d.includes('A DAY')) return 'A Day';
    if (d === 'B' || d.includes('B DAY')) return 'B Day';
    if (d !== 'A/B' && d !== 'A, B' && d !== 'A,B') return cls.days.trim();
  }
  // Determine from period number: RRISD block schedule P01-P04 = A Day, P05-P08 = B Day
  const perStr = String(cls?.period || idx + 1).replace(/^P/i, '').trim();
  const perNum = parseInt(perStr, 10);
  if (!isNaN(perNum)) {
    if (perNum >= 1 && perNum <= 4) return 'A Day';
    if (perNum >= 5 && perNum <= 8) return 'B Day';
  }
  return 'A/B';
}

export default function ScheduleModal({ classes, onClose }) {
  const activeThemeId = useStore(state => state.activeTheme);
  const theme = getTheme(activeThemeId);

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div onClick={e => e.stopPropagation()} className={`${theme.cardBg} rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border ${theme.cardBorder} animate-slide-up`}>
        {/* Header */}
        <div className={`px-6 pt-6 pb-4 ${theme.bgClass} text-white flex justify-between items-center`}>
          <div>
            <h2 className="text-2xl font-bold">Class Schedule & Teachers</h2>
            <p className="text-xs opacity-90 mt-0.5">Periods, Rooms & Direct Teacher Contact</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Schedule List */}
        <div className={`p-6 max-h-[70vh] overflow-y-auto divide-y ${theme.divideColor}`}>
          {(classes || []).map((cls, idx) => {
            const email = getTeacherEmail(cls.teacher);
            const resolvedDay = resolveScheduleDay(cls, idx);
            return (
              <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl ${theme.lightBgClass} ${theme.textClass} font-bold flex items-center justify-center text-sm shrink-0 shadow-xs`}>
                    P{cls.period || idx + 1}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`font-bold ${theme.textPrimary} text-sm leading-tight truncate`}>
                      {cls.name}
                    </h3>
                    <div className={`flex flex-wrap items-center gap-2.5 text-xs ${theme.textSecondary} mt-1`}>
                      <span className="flex items-center gap-1">
                        <User size={12} className="opacity-70" /> {cls.teacher || 'Staff'}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={12} className="opacity-70" /> Room {cls.room || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {email && (
                    <a
                      href={`mailto:${email}`}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs ${theme.lightBgClass} ${theme.textClass} hover:${theme.bgClass} hover:text-white cursor-pointer`}
                      title={`Email ${cls.teacher}`}
                    >
                      <Mail size={13} />
                      <span>Email</span>
                    </a>
                  )}

                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                    resolvedDay === 'A Day'
                      ? theme.isDark ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : resolvedDay === 'B Day'
                      ? theme.isDark ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200'
                      : theme.isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}>
                    {resolvedDay}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

