import React, { useEffect } from 'react';
import { X, Award, Percent, Layers, Sparkles, CheckCircle2, TrendingUp } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getTheme } from '../utils/themeConfig';
import {
  cleanCourseName,
  classifyCourse,
  getUnweightedPoints,
  getWeightedPoints,
  getExactCourseDetails,
  WEIGHT_TIERS,
} from '../utils/gpaEngine';

export default function ExactGradeModal({ course, onClose }) {
  const activeThemeId = useStore(state => state.activeTheme);
  const theme = getTheme(activeThemeId);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!course) return null;

  const cleanedName = cleanCourseName(course.name);
  const tierInfo = classifyCourse(cleanedName);
  const details = getExactCourseDetails(course);

  const rawAvg = details.exactAverage !== null && details.exactAverage !== undefined
    ? details.exactAverage
    : (course.average ?? 100);

  const exactAvgFormatted = rawAvg.toFixed(4);
  const uwPoints = getUnweightedPoints(rawAvg);
  const wPoints = getWeightedPoints(rawAvg, tierInfo.id);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${theme.cardBg} rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border ${theme.cardBorder} flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200`}
      >
        {/* Modal Header */}
        <div className={`px-6 py-5 ${theme.bgClass} text-white flex justify-between items-start`}>
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white backdrop-blur-md">
                Period {course.period || '01'}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                tierInfo.id === 'ap_advanced' ? 'bg-emerald-400 text-slate-950' : 'bg-white/20 text-white'
              }`}>
                {tierInfo.badge}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black mt-1.5 leading-tight">
              {cleanedName}
            </h2>
            {course.teacher && (
              <p className="text-xs opacity-90 mt-0.5">
                Instructor: {course.teacher}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition text-white cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Exact Unrounded Average Stat Card */}
          <div className={`p-5 rounded-2xl border ${theme.isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} flex items-center justify-between`}>
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Exact Course Average
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl sm:text-4xl font-black text-emerald-500">
                  {exactAvgFormatted}%
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  (unrounded)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Calculated from weighted category totals
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black text-lg shrink-0">
              <Percent size={22} />
            </div>
          </div>

          {/* GPA Quality Points Breakdown */}
          <div>
            <h3 className={`text-xs font-black uppercase tracking-wider ${theme.textSecondary} mb-2.5 flex items-center gap-1.5`}>
              <Award size={14} className="text-amber-500" />
              <span>GPA Quality Points Contribution</span>
            </h3>
            <div className="grid grid-cols-2 gap-3">
              
              {/* Unweighted Points */}
              <div className={`p-3.5 rounded-2xl border ${theme.isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Unweighted (4.0 Scale)
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-emerald-500">
                    {uwPoints !== null ? uwPoints.toFixed(4) : '0.0000'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold">/ 4.0000</span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {rawAvg >= 90 ? '90–100 Bracket = Max 4.0' : 'Standard Bracket'}
                </span>
              </div>

              {/* Weighted Points */}
              <div className={`p-3.5 rounded-2xl border ${theme.isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'}`}>
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Weighted (6.0 Scale)
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  {wPoints !== null ? (
                    <>
                      <span className="text-2xl font-black text-teal-400">
                        {wPoints.toFixed(4)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-bold">
                        / {tierInfo.maxPoints ? tierInfo.maxPoints.toFixed(4) : '6.0000'}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-amber-500 mt-1 block">
                      Excluded (4.0 Only)
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {wPoints !== null ? tierInfo.label : 'Does not dilute 6.0 weighted GPA'}
                </span>
              </div>

            </div>
          </div>

          {/* Category Point Breakdown */}
          <div>
            <h3 className={`text-xs font-black uppercase tracking-wider ${theme.textSecondary} mb-2.5 flex items-center gap-1.5`}>
              <Layers size={14} className="text-blue-500" />
              <span>Category Weight & Point Breakdown</span>
            </h3>

            {details.categories && details.categories.length > 0 ? (
              <div className="space-y-2.5">
                {details.categories.map((cat, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-2xl border ${theme.isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'} space-y-1.5`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${theme.isDark ? 'text-white' : 'text-slate-900'}`}>
                        {cat.name}
                      </span>
                      <div className="flex items-center gap-2">
                        {cat.weight !== null && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {cat.weight}% Weight
                          </span>
                        )}
                        <span className="font-black text-emerald-500">
                          {cat.pct.toFixed(4)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        Points: <strong className="text-slate-300 font-semibold">{cat.earned.toFixed(4)}</strong> / {cat.possible.toFixed(2)}
                      </span>
                      {cat.weightedPts !== undefined && (
                        <span>
                          Grade Contrib: <strong className="text-teal-400 font-bold">{cat.weightedPts.toFixed(4)} pts</strong>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-4 rounded-2xl border ${theme.isDark ? 'bg-slate-900/30 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'} text-xs text-center`}>
                Individual category weights not published by instructor. Course average reflects total points.
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-4 border-t ${theme.isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'} flex items-center justify-between text-xs`}>
          <span className="text-[11px] text-slate-400">
            Round Rock ISD EIC (Local) Policy
          </span>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold ${theme.bgClass} text-white shadow-sm hover:opacity-90 transition cursor-pointer`}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
