import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useDocStore } from '../store/useDocStore';
import { getTheme } from '../utils/themeConfig';
import { 
  ChevronDown, ChevronUp, CheckCircle2, AlertCircle, 
  Clock, BookOpen, Plus, FileText
} from 'lucide-react';
import ClassDocsModal from '../components/docs/ClassDocsModal';
import DocAdderModal from '../components/docs/DocAdderModal';

function gradeToLetter(avg) {
  if (avg === null || avg === undefined || isNaN(avg)) return null;
  if (avg >= 90) return 'A';
  if (avg >= 80) return 'B';
  if (avg >= 70) return 'C';
  if (avg >= 60) return 'D';
  return 'F';
}

function getEffectiveClassGrade(cls) {
  const assignments = cls.assignments || [];
  const graded = assignments.filter(a => a.score !== null && a.totalPoints !== null && !isNaN(a.score) && !isNaN(a.totalPoints) && !a.exempt);
  
  if (assignments.length > 0 && graded.length === 0) {
    return { average: null, letterGrade: null };
  }
  
  const weightedGraded = graded.filter(a => {
    const w = a.weight !== undefined && a.weight !== null ? parseFloat(a.weight) : 1;
    return !isNaN(w) && w > 0;
  });

  if (weightedGraded.length > 0) {
    const totalEarned = weightedGraded.reduce((s, a) => {
      const w = a.weight !== undefined && a.weight !== null ? parseFloat(a.weight) : 1;
      return s + (parseFloat(a.score) * w);
    }, 0);
    const totalPossible = weightedGraded.reduce((s, a) => {
      const w = a.weight !== undefined && a.weight !== null ? parseFloat(a.weight) : 1;
      return s + (parseFloat(a.totalPoints) * w);
    }, 0);
    if (totalPossible > 0) {
      const avg = parseFloat(((totalEarned / totalPossible) * 100).toFixed(1));
      return { average: avg, letterGrade: gradeToLetter(avg) };
    }
  }

  // If class has only 0-weight graded assignments, course grade is null (no grade yet)
  if (graded.length > 0 && graded.every(a => (parseFloat(a.weight) || 0) === 0)) {
    return { average: null, letterGrade: null };
  }
  
  if (cls.average !== null && cls.average !== undefined && !isNaN(cls.average) && cls.average > 0) {
    return { average: cls.average, letterGrade: cls.letterGrade || gradeToLetter(cls.average) };
  }
  return { average: null, letterGrade: null };
}

function gradeColor(avg, isDark = false) {
  if (avg === null || avg === undefined || isNaN(avg)) return isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-200 text-gray-500';
  if (avg >= 90) return 'bg-emerald-500 text-white';
  if (avg >= 80) return 'bg-blue-500 text-white';
  if (avg >= 70) return 'bg-yellow-500 text-white';
  return 'bg-red-500 text-white';
}

function getActiveMP() {
  const month = new Date().getMonth();
  if (month >= 7 && month <= 9) return 'MP1';
  if (month >= 10 || month === 0) return 'MP2';
  if (month >= 1 && month <= 2) return 'MP3';
  return 'MP4';
}

function AssignmentRow({ a, theme, isIncognito }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = a.dateDue ? new Date(a.dateDue) : null;
  if (dueDate) dueDate.setHours(0, 0, 0, 0);

  const scored = a.score !== null && a.score !== undefined && a.score !== '';
  const isFuture = dueDate && dueDate > today;
  const isPast = dueDate && dueDate < today;

  let badgeType = 'pending';

  if (a.missing || (isPast && !scored && !a.exempt)) {
    badgeType = 'missing';
  } else if (a.exempt) {
    badgeType = 'exempt';
  } else if (scored) {
    badgeType = 'scored';
  } else if (isFuture) {
    badgeType = 'upcoming';
  } else if (isPast && !scored) {
    badgeType = 'submitted';
  }

  const pct = scored && a.totalPoints ? ((parseFloat(a.score) / a.totalPoints) * 100).toFixed(1) : null;

  return (
    <div className={`flex items-start justify-between py-3 px-4 border-b ${theme.divideColor} last:border-0`}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="mt-0.5 shrink-0">
          {badgeType === 'missing' && <AlertCircle size={16} className="text-red-400" />}
          {badgeType === 'scored' && <CheckCircle2 size={16} className={theme.textClass} />}
          {badgeType === 'submitted' && <Send size={16} className="text-blue-400" />}
          {badgeType === 'upcoming' && <Clock size={16} className={theme.textMuted} />}
          {badgeType === 'pending' && <Clock size={16} className={theme.textMuted} />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold ${theme.textPrimary} text-sm leading-tight truncate`}>{a.name}</p>
            {a.weight === 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">
                0% Weight
              </span>
            )}
            {a.weight > 0 && a.weight !== 1 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${theme.lightBgClass} ${theme.textClass}`}>
                {(a.weight * 100).toFixed(0)}% Weight
              </span>
            )}
          </div>
          <p className={`text-xs ${theme.textSecondary} mt-0.5`}>
            {a.category} · Due {a.dateDue || 'N/A'}
            {a.weight === 0 ? ' · Not counted towards grade' : (a.weight !== 1 && a.weight ? ` · Weight ${a.weight}` : '')}
          </p>
        </div>
      </div>

      <div className="ml-3 shrink-0 text-right">
        {badgeType === 'missing' && (
          <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-lg">Missing</span>
        )}
        {badgeType === 'submitted' && (
          <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg">Submitted</span>
        )}
        {badgeType === 'upcoming' && (
          <span className={`text-xs font-bold ${theme.textMuted} ${theme.lightBgClass} px-2 py-1 rounded-lg`}>Upcoming</span>
        )}
        {badgeType === 'exempt' && (
          <span className={`text-xs font-bold ${theme.textMuted} ${theme.lightBgClass} px-2 py-1 rounded-lg`}>Exempt</span>
        )}
        {badgeType === 'scored' && (
          <div>
            <span className={`font-bold ${theme.textPrimary} text-sm`}>{a.score}/{a.totalPoints}</span>
            <p className={`text-xs ${theme.textSecondary}`}>{pct}%</p>
          </div>
        )}
        {badgeType === 'pending' && (
          <span className={`text-xs ${theme.textMuted} ${theme.lightBgClass} px-2 py-1 rounded-lg`}>Not Graded</span>
        )}
      </div>
    </div>
  );
}

export default function Grades() {
  const { hacData, activeTheme } = useStore();
  const { documents } = useDocStore();
  const theme = getTheme(activeTheme);
  const [activeTab, setActiveTab] = useState(getActiveMP());
  const [expandedId, setExpandedId] = useState(null);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [showViewDocsModal, setShowViewDocsModal] = useState(false);
  const tabs = ['MP1', 'MP2', 'MP3', 'MP4'];

  const classes = hacData?.classes || [];

  return (
    <div className={`${theme.appBg} min-h-screen flex flex-col transition-colors duration-200`}>
      
      {/* Add Document Modal */}
      {showAddDocModal && (
        <DocAdderModal onClose={() => setShowAddDocModal(false)} />
      )}

      {/* View Course Documents Modal */}
      {showViewDocsModal && (
        <ClassDocsModal onClose={() => setShowViewDocsModal(false)} />
      )}

      {/* Header */}
      <div className={`${theme.bgClass} px-6 pt-12 pb-6 text-white w-full`}>
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold">Grades</h1>
              <p className="text-sm font-medium opacity-90 mt-1">Class averages, assignments & course knowledge</p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => setShowViewDocsModal(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 transition cursor-pointer shadow-sm"
              >
                <BookOpen size={15} />
                <span>Documents ({documents.length})</span>
              </button>
              <button
                onClick={() => setShowAddDocModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-extrabold text-xs flex items-center gap-2 border border-white/20 transition cursor-pointer shadow-sm"
              >
                <Plus size={16} />
                <span>Add Documents</span>
              </button>
            </div>
          </div>

          {/* MP Tabs */}
          <div className="flex justify-between bg-white/20 rounded-xl p-1">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab ? `bg-white ${theme.textClass} shadow-sm` : 'text-white/80 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Class List */}
      <div className={`${theme.appBg} flex-1 px-4 py-6 w-full shadow-inner transition-colors duration-200`}>
        <div className="max-w-5xl mx-auto space-y-3">
          {classes.map(cls => {
            const isOpen = expandedId === cls.id;
            const assignments = cls.assignments || [];
            const classDocCount = documents.filter(d => d.classId === cls.id).length;

            return (
              <div
                key={cls.id}
                className={`${theme.cardBg} rounded-2xl shadow-sm border ${theme.cardBorder} overflow-hidden transition-colors duration-200`}
              >
                {/* Class Header Row */}
                <button
                  onClick={() => setExpandedId(isOpen ? null : cls.id)}
                  className={`w-full flex items-center justify-between p-4 text-left hover:${theme.lightBgClass} transition cursor-pointer`}
                >
                  <div className="flex-1 pr-3 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold ${theme.textPrimary} leading-tight truncate`}>{cls.name}</h3>
                      {classDocCount > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${theme.lightBgClass} ${theme.textClass} border ${theme.borderClass}`}>
                          {classDocCount} Doc{classDocCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <p className={`text-[10px] ${theme.textSecondary} tracking-wider uppercase mt-0.5`}>
                      {cls.teacher} · Period {cls.period}
                    </p>
                  </div>
                  {(() => {
                    const { average: classAvg, letterGrade: classLetter } = getEffectiveClassGrade(cls);
                    return (
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Average pill */}
                        <div
                          className={`w-14 h-10 flex items-center justify-center rounded-xl font-bold text-base shadow-xs ${gradeColor(classAvg, theme.isDark)}`}
                          title={classAvg !== null ? undefined : 'Not Graded Yet'}
                        >
                          {classAvg !== null ? `${Math.round(classAvg)}` : '—'}
                        </div>
                        {/* Letter grade */}
                        <span className={`text-xs font-bold ${theme.textMuted} w-4`}>
                          {classLetter ?? ''}
                        </span>
                        {/* Expand chevron */}
                        <div className={`${theme.textMuted} ml-1`}>
                          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    );
                  })()}
                </button>

                {/* Assignment Curtain & Action Bar */}
                {isOpen && (
                  <div className={`border-t ${theme.cardBorder} ${theme.isDark ? 'bg-slate-900/60' : 'bg-black/[0.02]'}`}>
                    
                    {/* Course Header Info */}
                    <div className="px-4 py-2 bg-gray-50/60 dark:bg-slate-800/40 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                        {assignments.length} total assignment{assignments.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {assignments.length === 0 ? (
                      <p className={`text-center ${theme.textMuted} text-sm py-6`}>No assignments yet.</p>
                    ) : (
                      <>
                        {/* Category summary bar */}
                        {(() => {
                          const validCategories = [...new Set(assignments.map(a => a.category))].filter(Boolean).map(cat => {
                            const catAssigns = assignments.filter(a => a.category === cat && a.score !== null && a.totalPoints && !isNaN(a.score) && !isNaN(a.totalPoints));
                            const catAvg = catAssigns.length > 0
                              ? (catAssigns.reduce((s, a) => s + (parseFloat(a.score) / a.totalPoints) * 100, 0) / catAssigns.length).toFixed(0)
                              : null;
                            return { cat, catAvg };
                          });

                          return validCategories.length > 0 ? (
                            <div className={`px-4 py-3 border-b ${theme.divideColor} flex gap-3 flex-wrap`}>
                              {validCategories.map(({ cat, catAvg }) => (
                                <span key={cat} className={`text-xs font-semibold ${theme.lightBgClass} ${theme.textClass} px-2.5 py-1 rounded-lg`}>
                                  {cat}{catAvg !== null ? `: ${catAvg}%` : ''}
                                </span>
                              ))}
                            </div>
                          ) : null;
                        })()}

                        {/* Assignment rows */}
                        <div>
                          {assignments
                            .sort((a, b) => new Date(b.dateDue) - new Date(a.dateDue))
                            .map((a, i) => (
                              <AssignmentRow key={i} a={a} theme={theme} isIncognito={isIncognito} />
                            ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
