import React from 'react';
import { useStore } from '../store/useStore';
import { getTheme } from '../utils/themeConfig';
import { Award, GraduationCap, TrendingUp, BookOpen } from 'lucide-react';

export default function GPA() {
  const { hacData, activeTheme } = useStore();
  const theme = getTheme(activeTheme);
  const transcript = hacData?.transcript;
  const gpa = transcript?.gpa || {};
  const years = transcript?.years || [];

  const totalCredits = years.reduce((acc, y) => acc + (parseFloat(y.totalCredits || y.totalCredit || 0) || 0), 0);

  return (
    <div className={`${theme.appBg} min-h-screen flex flex-col transition-colors duration-200`}>
      {/* Header */}
      <div className={`${theme.bgClass} px-6 pt-12 pb-6 text-white w-full`}>
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-bold mb-1">GPA & Transcript</h1>
          <p className="text-sm font-medium opacity-90 mb-6">Cumulative academic history & performance</p>
          
          {/* GPA & Rank Stats Card */}
          <div className="bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center shadow-sm">
            <div>
              <p className="text-[11px] font-bold opacity-80 uppercase tracking-wide">Weighted GPA</p>
              <p className="text-3xl font-extrabold mt-0.5">
                {gpa.weighted ?? '—'}
              </p>
            </div>
            <div className="border-l border-white/20">
              <p className="text-[11px] font-bold opacity-80 uppercase tracking-wide">Unweighted GPA</p>
              <p className="text-3xl font-extrabold mt-0.5">
                {gpa.unweighted ?? '—'}
              </p>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-white/20 pt-3 sm:pt-0">
              <p className="text-[11px] font-bold opacity-80 uppercase tracking-wide">Class Rank</p>
              <p className="text-3xl font-extrabold mt-0.5">
                {gpa.rank ? `#${gpa.rank}${gpa.classSize ? ` / ${gpa.classSize}` : ''}` : '—'}
              </p>
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-white/20 pt-3 sm:pt-0">
              <p className="text-[11px] font-bold opacity-80 uppercase tracking-wide">Total Credits</p>
              <p className="text-3xl font-extrabold mt-0.5">
                {totalCredits > 0 ? totalCredits.toFixed(2) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Multi-Year Transcript History */}
      <div className={`${theme.appBg} flex-1 px-4 py-6 w-full shadow-inner transition-colors duration-200`}>
        <div className="max-w-5xl mx-auto space-y-6">
          {years.length === 0 && (
            <div className={`text-center ${theme.textMuted} py-16 ${theme.cardBg} rounded-3xl border ${theme.cardBorder} p-8`}>
              <GraduationCap size={40} className="mx-auto text-gray-400 mb-2" />
              <p className={`font-bold ${theme.textPrimary}`}>No Transcript Records Found</p>
              <p className={`text-xs ${theme.textSecondary} mt-1`}>Transcript entries will populate here once posted by your district.</p>
            </div>
          )}

          {years.map((yr, i) => {
            const yrCredits = parseFloat(yr.totalCredits || yr.totalCredit || 0) || 0;
            return (
              <div key={i} className={`${theme.cardBg} rounded-2xl shadow-sm border ${theme.cardBorder} overflow-hidden transition-colors duration-200`}>
                <div className={`px-5 py-4 ${theme.isDark ? 'bg-slate-900/60' : 'bg-black/[0.02]'} border-b ${theme.cardBorder} flex justify-between items-center`}>
                  <div>
                    <h2 className={`font-bold ${theme.textPrimary} text-base`}>{yr.year}</h2>
                    <p className={`text-xs ${theme.textSecondary} font-medium`}>
                      {yr.grade ? `Grade ${yr.grade}` : ''} {yr.building ? `· ${yr.building}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-bold ${theme.lightBgClass} ${theme.textClass} px-3 py-1 rounded-xl`}>
                    {yrCredits.toFixed(2)} Credits
                  </span>
                </div>
                <div className={`divide-y ${theme.divideColor}`}>
                  {yr.courses.map((course, j) => (
                    <div key={j} className={`px-5 py-3.5 flex items-center justify-between hover:${theme.lightBgClass} transition`}>
                      <div className="min-w-0 pr-4">
                        <p className={`font-bold ${theme.textPrimary} text-sm truncate`}>{course.description}</p>
                        <p className={`text-xs ${theme.textSecondary} font-medium`}>{course.courseId} {course.credit ? `· ${course.credit} CR` : ''}</p>
                      </div>
                      <div className="text-right text-xs shrink-0">
                        <div className={`flex items-center gap-3 ${theme.textSecondary} font-medium`}>
                          {course.sem1 !== null && (
                            <span>
                              S1:{' '}
                              <strong className={theme.textPrimary}>
                                {course.sem1}
                              </strong>
                            </span>
                          )}
                          {course.sem2 !== null && (
                            <span>
                              S2:{' '}
                              <strong className={theme.textPrimary}>
                                {course.sem2}
                              </strong>
                            </span>
                          )}
                          <span>
                            Final:{' '}
                            <strong className={`${theme.textClass} font-bold text-sm`}>
                              {course.finalGrade || course.final || '—'}
                            </strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
