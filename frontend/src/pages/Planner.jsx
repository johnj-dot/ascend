import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getTheme } from '../utils/themeConfig';
import { 
  CheckCircle2, Circle, Plus, Trash2, Edit3, X, BookOpen, UserCheck, AlertCircle, Bell 
} from 'lucide-react';
import TaskAdderModal from '../components/TaskAdderModal';

export default function Planner() {
  const { hacData, localOverrides, addPlannerTask, removePlannerTask, completedItemIds, toggleItemCompleted, activeTheme } = useStore();
  const theme = getTheme(activeTheme);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Helper for 12-hour time format
  const formatTime12 = (tStr) => {
    if (!tStr) return '';
    const [h, m] = tStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return tStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m < 10 ? '0' : ''}${m} ${ampm}`;
  };

  // 1. Build a registry of already-graded assignments
  const gradedKeys = new Set();
  const cleanStr = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  (hacData?.classes || []).forEach(c => {
    (c.assignments || []).forEach(a => {
      const hasGrade = a.score !== null && a.score !== undefined && a.score !== '' && !a.missing;
      if (hasGrade) {
        gradedKeys.add(cleanStr(`${c.name}_${a.name}`));
        gradedKeys.add(cleanStr(a.name));
      }
    });
  });

  // 2. Gather only UNGRADED / pending HAC items directly from classes + missing
  const seenHacIds = new Set();
  const hacItems = [];

  (hacData?.classes || []).forEach(c => {
    (c.assignments || []).forEach(a => {
      if (!a.name) return;
      const nameStr = a.name.trim();
      if (/^(Course\s*Average|Overall\s*Average|Average|Total)$/i.test(nameStr)) return;
      if (/^\d+(\.\d+)?$/.test(nameStr) && !a.dateDue && (a.score === null || a.score === undefined)) return;

      // If student already has a grade for it, automatically exclude from planner
      const hasGrade = a.score !== null && a.score !== undefined && a.score !== '';
      if (hasGrade && !a.missing) return;
      if (a.exempt) return;

      const dateVal = a.dateDue || a.dateAssigned || a.date || '';
      const uniqueId = `hac-${c.name}-${a.name}-${dateVal}`;
      if (!seenHacIds.has(uniqueId)) {
        seenHacIds.add(uniqueId);
        hacItems.push({
          id: uniqueId,
          title: a.name,
          subtitle: `${c.name} · ${a.category || 'Assignment'}`,
          date: dateVal,
          time: '',
          type: (a.category || '').toLowerCase(),
          typeId: (a.category || '').toLowerCase(),
          course: c.name,
          source: 'hac',
          missing: false,
        });
      }
    });
  });

  (hacData?.missingAssignments || []).forEach(m => {
    const dateVal = m.dateDue || m.date || '';
    const uniqueId = `missing-${m.class}-${m.assignment}-${dateVal}`;
    if (!seenHacIds.has(uniqueId)) {
      seenHacIds.add(uniqueId);
      hacItems.push({
        id: uniqueId,
        title: m.assignment,
        subtitle: `${m.class} · Missing Assignment`,
        date: dateVal,
        time: '',
        type: 'assignment',
        typeId: 'assignment',
        course: m.class,
        source: 'hac',
        missing: true,
      });
    }
  });

  // 3. Gather user created / planner tasks (exclude any that match already graded assignments)
  const customTasks = (localOverrides?.plannerTasks || [])
    .filter(t => {
      // Check if task itself has a score / grade recorded
      if (t.score !== null && t.score !== undefined && t.score !== '') return false;
      
      // Check if title, type, or subtitle contains score patterns like (100/100) or similar
      if (/\(\s*\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?\s*\)/.test(t.name || '') || 
          /\(\s*\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?\s*\)/.test(t.type || '') ||
          /\(\s*\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?\s*\)/.test(t.subtitle || '')) {
        return false;
      }

      // Match normalized string against graded assignments registry
      const rawName = t.name || '';
      const normName = cleanStr(rawName);
      const normCourseKey = t.course ? cleanStr(`${t.course}_${rawName}`) : '';
      if (gradedKeys.has(normName) || (normCourseKey && gradedKeys.has(normCourseKey))) {
        return false;
      }
      return true;
    })
    .map(t => ({
      id: t.id,
      title: t.name,
      subtitle: `${t.course ? t.course + ' · ' : ''}${t.type || 'Task'}${t.dueTime ? ' due at ' + formatTime12(t.dueTime) : ''}`,
      date: t.dueDate || '',
      time: t.dueTime || '',
      type: (t.type || '').toLowerCase(),
      typeId: t.typeId || (t.type || '').toLowerCase(),
      course: t.course,
      source: 'custom',
      missing: false,
    }));

  // Combine and sort
  const allItems = [...hacItems, ...customTasks];

  const grouped = {};
  allItems.forEach(item => {
    const key = item.date ? item.date : 'No Due Date';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });

  const buckets = Object.entries(grouped).sort(([a], [b]) => {
    if (a === 'No Due Date') return 1;
    if (b === 'No Due Date') return -1;
    return new Date(a) - new Date(b);
  });

  const formatDateHeaderDisplay = (dStr) => {
    if (!dStr || dStr === 'No Due Date') return 'NO DUE DATE';
    try {
      const parts = dStr.split(/[-/]/);
      let d;
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
          d = new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]));
        }
      } else {
        d = new Date(dStr);
      }
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
      }
    } catch {}
    return dStr.toUpperCase();
  };

  const getCardStyling = (item, isCompleted) => {
    const isDark = !!theme.isDark;

    // 1. Completed state (Slight white/grey, more visible)
    if (isCompleted) {
      return {
        cardBg: isDark
          ? 'bg-slate-900/60 border-slate-800/80 opacity-75 shadow-2xs'
          : 'bg-gray-50/90 border-gray-200/70 opacity-75 shadow-2xs',
        textStyle: isDark
          ? 'line-through text-slate-400 font-semibold'
          : 'line-through text-gray-500 font-semibold',
        subtextStyle: isDark ? 'text-slate-500 font-medium' : 'text-gray-400 font-medium',
        circleColor: isDark ? 'text-emerald-400' : 'text-emerald-500',
        badgeBg: isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-200/80 text-gray-600',
      };
    }

    // 2. Urgent Missing Assignments (Red)
    if (item.missing) {
      return {
        cardBg: isDark
          ? 'bg-[#200d11]/85 border-[#881337] shadow-xs hover:border-red-500'
          : 'bg-red-50/80 border-red-200/90 shadow-xs hover:border-red-400',
        textStyle: isDark ? 'text-[#fda4af] font-bold' : 'text-red-950 font-bold',
        subtextStyle: isDark ? 'text-[#f43f5e]/90 font-medium' : 'text-red-700/80 font-medium',
        circleColor: isDark ? 'text-[#f43f5e]' : 'text-red-500 hover:text-red-600',
        badgeBg: isDark ? 'bg-red-950/70 text-red-300' : 'bg-red-100 text-red-700 border border-red-200',
      };
    }

    const t = (item.type || item.typeId || '').toLowerCase();
    
    // 3. Quiz / Test / Exam / Summative (Purple)
    if (t.includes('test') || t.includes('quiz') || t.includes('exam') || t.includes('assessment') || t.includes('summative')) {
      return {
        cardBg: isDark
          ? 'bg-[#1a0f28]/90 border-[#581c87] shadow-xs hover:border-[#7e22ce]'
          : 'bg-purple-50/80 border-purple-200/90 shadow-xs hover:border-purple-400',
        textStyle: isDark ? 'text-[#e9d5ff] font-bold' : 'text-purple-950 font-bold',
        subtextStyle: isDark ? 'text-[#c084fc]/90 font-medium' : 'text-purple-800/80 font-medium',
        circleColor: isDark ? 'text-[#c084fc]' : 'text-purple-500 hover:text-purple-600',
        badgeBg: isDark ? 'bg-purple-950/70 text-purple-300' : 'bg-purple-100/90 text-purple-800 border border-purple-200',
      };
    }

    // 4. Projects & Essays (Vibrant Cyan / Teal)
    if (t.includes('project') || t.includes('essay')) {
      return {
        cardBg: isDark
          ? 'bg-[#061e24]/90 border-[#0891b2] shadow-xs hover:border-[#06b6d4]'
          : 'bg-cyan-50/80 border-cyan-200/90 shadow-xs hover:border-cyan-400',
        textStyle: isDark ? 'text-[#67e8f9] font-bold' : 'text-cyan-950 font-bold',
        subtextStyle: isDark ? 'text-[#22d3ee]/90 font-medium' : 'text-cyan-800/80 font-medium',
        circleColor: isDark ? 'text-[#22d3ee]' : 'text-cyan-500 hover:text-cyan-600',
        badgeBg: isDark ? 'bg-cyan-950/70 text-cyan-300' : 'bg-cyan-100/90 text-cyan-800 border border-cyan-200',
      };
    }

    // 5. Labs & Activities (Indigo / Royal Blue)
    if (t.includes('lab') || t.includes('activity')) {
      return {
        cardBg: isDark
          ? 'bg-[#0c1527]/90 border-[#1e3a8a] shadow-xs hover:border-[#2563eb]'
          : 'bg-indigo-50/80 border-indigo-200/90 shadow-xs hover:border-indigo-400',
        textStyle: isDark ? 'text-[#93c5fd] font-bold' : 'text-indigo-950 font-bold',
        subtextStyle: isDark ? 'text-[#60a5fa]/90 font-medium' : 'text-indigo-800/80 font-medium',
        circleColor: isDark ? 'text-[#60a5fa]' : 'text-indigo-500 hover:text-indigo-600',
        badgeBg: isDark ? 'bg-indigo-950/70 text-indigo-300' : 'bg-indigo-100/90 text-indigo-800 border border-indigo-200',
      };
    }

    // 6. Study / Review / Notes / Reading (Fresh Emerald / Mint Green)
    if (t.includes('study') || t.includes('review') || t.includes('reading') || t.includes('notes') || t.includes('prep')) {
      return {
        cardBg: isDark
          ? 'bg-[#071f18]/90 border-[#065f46] shadow-xs hover:border-[#059669]'
          : 'bg-emerald-50/80 border-emerald-200/90 shadow-xs hover:border-emerald-400',
        textStyle: isDark ? 'text-[#34d399] font-bold' : 'text-emerald-950 font-bold',
        subtextStyle: isDark ? 'text-[#10b981]/90 font-medium' : 'text-emerald-800/80 font-medium',
        circleColor: isDark ? 'text-[#34d399]' : 'text-emerald-500 hover:text-emerald-600',
        badgeBg: isDark ? 'bg-emerald-950/70 text-emerald-300' : 'bg-emerald-100/90 text-emerald-800 border border-emerald-200',
      };
    }

    // 7. HAC Assignments, Homework, Formative, Worksheet, Syllabus, & Default Tasks (Warm Amber/Yellow)
    return {
      cardBg: isDark
        ? 'bg-[#1f1309]/90 border-[#78350f] shadow-xs hover:border-[#b45309]'
        : 'bg-amber-50/80 border-amber-200/90 shadow-xs hover:border-amber-400',
      textStyle: isDark ? 'text-white font-bold' : 'text-amber-950 font-bold',
      subtextStyle: isDark ? 'text-[#facc15]/90 font-medium' : 'text-amber-800/80 font-medium',
      circleColor: isDark ? 'text-[#facc15]' : 'text-amber-500 hover:text-amber-600',
      badgeBg: isDark ? 'bg-amber-950/70 text-amber-300' : 'bg-amber-100/90 text-amber-800 border border-amber-200',
    };
  };

  return (
    <div className={`${theme.appBg} w-full flex flex-col relative transition-colors duration-200`}>
      {/* Task Creation & Editing Modal */}
      {showModal && (
        <TaskAdderModal
          onClose={() => {
            setShowModal(false);
            setEditingTask(null);
          }}
          initialTask={editingTask}
        />
      )}

      {/* Header */}
      <div className={`${theme.bgClass} px-6 pt-12 pb-6 text-white w-full shadow-md`}>
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Planner</h1>
            <p className="text-sm font-medium opacity-90 mt-1">Organized Day-by-Day</p>
          </div>
          
          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                setEditingTask(null);
                setShowModal(true);
              }}
              className="bg-white/20 hover:bg-white/30 transition px-4 py-2.5 rounded-2xl flex items-center gap-1.5 font-bold text-xs shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              <span>New Item</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${theme.appBg} flex-1 px-4 py-6 w-full shadow-inner transition-colors duration-200`}>
        <div className="max-w-5xl mx-auto space-y-6">

          {buckets.length === 0 ? (
            <div className={`text-center ${theme.textMuted} py-16 space-y-3`}>
              <p className={`font-bold text-base ${theme.textPrimary}`}>Planner is clear!</p>
              <p className={`text-sm ${theme.textSecondary}`}>No pending tasks or upcoming deadlines. Click below to add a new item.</p>
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowModal(true);
                }}
                className={`inline-flex items-center gap-2 ${theme.bgClass} text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-md cursor-pointer`}
              >
                <Plus size={16} /> Add Item
              </button>
            </div>
          ) : (
            buckets.map(([dateHeader, items]) => (
              <div key={dateHeader}>
                {/* Date Bucket Card Header */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`${theme.lightBgClass} ${theme.textClass} px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide`}>
                    {formatDateHeaderDisplay(dateHeader)}
                  </span>
                  <span className={`text-xs ${theme.textSecondary} font-semibold`}>{items.length} item{items.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Items in bucket */}
                <div className="space-y-2.5">
                  {items.map(item => {
                    const isCompleted = (completedItemIds || []).includes(item.id);
                    const { cardBg, textStyle, subtextStyle, circleColor } = getCardStyling(item, isCompleted);

                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleItemCompleted(item.id)}
                        className={`p-4 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer select-none hover:opacity-95 active:scale-[0.99] ${cardBg}`}
                      >
                        {/* Interactive Checkbox Circle */}
                        <div
                          className="shrink-0 transition transform"
                          title={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {isCompleted ? (
                            <CheckCircle2 size={22} className={circleColor} />
                          ) : (
                            <Circle size={22} className={circleColor} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className={`text-sm truncate transition-all ${textStyle}`}>
                            {item.title}
                          </h3>
                          <p className={`text-xs flex items-center gap-1.5 mt-0.5 ${subtextStyle}`}>
                            {item.missing ? (
                              <AlertCircle size={12} className="text-red-600 shrink-0" />
                            ) : item.source === 'hac' ? (
                              <BookOpen size={12} className="shrink-0 opacity-80" />
                            ) : (
                              <UserCheck size={12} className="shrink-0 opacity-80" />
                            )}
                            <span className="truncate">{item.subtitle}</span>
                          </p>
                        </div>

                        {item.source === 'custom' && (
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => {
                                const rawTask = (localOverrides?.plannerTasks || []).find(t => t.id === item.id) || item;
                                setEditingTask(rawTask);
                                setShowModal(true);
                              }}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                theme.isDark
                                  ? 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/80'
                                  : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title="Edit task"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removePlannerTask(item.id)}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                theme.isDark
                                  ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/40'
                                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              }`}
                              title="Delete task"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

        </div>
      </div>
    </div>
  );
}
