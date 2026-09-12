import React, { useState } from 'react';
import { 
  X, FileText, Trash2, Plus, BookOpen, Award, FolderKanban, 
  FlaskConical, MessageSquare, Layers, Search, File, ChevronRight, ChevronDown, Check
} from 'lucide-react';
import { useDocStore } from '../../store/useDocStore';
import { useStore } from '../../store/useStore';
import { getTheme } from '../../utils/themeConfig';
import DocAdderModal from './DocAdderModal';

const TYPE_CONFIG = {
  syllabus: { label: 'Syllabus', icon: BookOpen, color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' },
  learning_target: { label: 'Learning Targets', icon: Award, color: 'text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800' },
  notes: { label: 'Class Notes', icon: FileText, color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' },
  review_packet: { label: 'Review Packet', icon: FolderKanban, color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' },
  lab: { label: 'Lab Manual', icon: FlaskConical, color: 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800' },
  other: { label: 'Document', icon: MessageSquare, color: 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700' }
};

export default function ClassDocsModal({ onClose, preselectedClassId = null }) {
  const { documents, removeDocument } = useDocStore();
  const { hacData, activeTheme } = useStore();
  const theme = getTheme(activeTheme);

  const classes = hacData?.classes || [];
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId || 'all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCourseMenu, setShowCourseMenu] = useState(false);

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    // Class filter
    if (selectedClassId !== 'all') {
      if (selectedClassId === 'general') {
        if (doc.classId && doc.classId !== 'general') return false;
      } else if (doc.classId !== selectedClassId) {
        return false;
      }
    }

    // Type filter
    if (selectedTypeFilter !== 'all' && doc.type !== selectedTypeFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (doc.title || '').toLowerCase().includes(q);
      const matchClass = (doc.className || '').toLowerCase().includes(q);
      const matchUnit = (doc.unit || '').toLowerCase().includes(q);
      const matchContent = (doc.content || '').toLowerCase().includes(q);
      if (!matchTitle && !matchClass && !matchUnit && !matchContent) return false;
    }

    return true;
  });

  const isDark = !!theme.isDark;

  const selectedClass = selectedClassId === 'all' 
    ? { name: 'All Courses', id: 'all' }
    : classes.find(c => c.id === selectedClassId) || { name: 'All Courses', id: 'all' };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto custom-scrollbar"
      >
        <div
          onClick={e => e.stopPropagation()}
          className={`${
            isDark ? 'bg-[#0f172a] text-white border-slate-800' : 'bg-white text-gray-900 border-gray-100'
          } rounded-3xl max-w-4xl w-full shadow-2xl border overflow-hidden flex flex-col my-auto max-h-[90vh] animate-slide-up`}
        >
          
          {/* ── Top Header Bar ── */}
          <div className={`${
            isDark ? 'bg-slate-900 border-b border-slate-800' : theme.bgClass
          } px-6 py-5 text-white flex items-center justify-between shadow-sm shrink-0`}>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-white shadow-xs">
                <BookOpen size={20} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  Course Documents
                </h2>
                <p className="text-xs opacity-90 font-medium mt-0.5">
                  Manage course syllabi, notes, and study resources
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-2xl bg-white/20 hover:bg-white/30 transition text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus size={15} strokeWidth={3} />
                <span>Add Document</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ── Main Full-Width Workspace (No Sidebar) ── */}
          <div className={`flex-1 flex flex-col overflow-hidden min-h-[440px] ${isDark ? 'bg-[#0f172a]' : 'bg-white'}`}>
            
            {/* Top Controls Bar: Course Selector + Search */}
            <div className={`px-6 py-4 border-b ${
              isDark ? 'border-slate-800 bg-[#0f172a]' : 'border-gray-100 bg-white'
            } flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0`}>
              
              {/* Custom Themed Course Selector Popover */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCourseMenu(prev => !prev)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold border transition flex items-center gap-2.5 cursor-pointer shadow-xs ${
                      isDark
                        ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-750'
                        : `${theme.borderClass} bg-white text-gray-900 hover:bg-gray-50`
                    }`}
                  >
                    <Layers size={14} className={isDark ? 'text-emerald-400' : theme.textClass} />
                    <span className="max-w-[200px] truncate">{selectedClass.name}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      isDark ? 'bg-slate-700 text-slate-300' : `${theme.lightBgClass} ${theme.textClass}`
                    }`}>
                      {selectedClassId === 'all' 
                        ? documents.length 
                        : documents.filter(d => d.classId === selectedClassId).length}
                    </span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${showCourseMenu ? 'rotate-180' : ''} ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                  </button>

                  {/* Floating Popover Menu */}
                  {showCourseMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-20 cursor-default" 
                        onClick={() => setShowCourseMenu(false)} 
                      />
                      <div className={`absolute left-0 top-full mt-2 w-72 rounded-2xl border shadow-xl z-30 py-2 max-h-72 overflow-y-auto custom-scrollbar animate-slide-down ${
                        isDark ? 'bg-[#0b1120] border-slate-700 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-2xl'
                      }`}>
                        <div className={`px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider ${
                          isDark ? 'text-slate-500' : 'text-gray-400'
                        }`}>
                          Filter by Course
                        </div>

                        {/* All Courses Option */}
                        <button
                          type="button"
                          onClick={() => { setSelectedClassId('all'); setShowCourseMenu(false); }}
                          className={`w-full px-3.5 py-2.5 text-left text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                            selectedClassId === 'all'
                              ? isDark
                                ? 'bg-emerald-600/20 text-emerald-400'
                                : `${theme.lightBgClass} ${theme.textClass}`
                              : isDark
                                ? 'text-slate-300 hover:bg-slate-800'
                                : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Layers size={15} />
                            <span className="truncate">All Courses</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                              isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {documents.length}
                            </span>
                            {selectedClassId === 'all' && <Check size={14} className={isDark ? 'text-emerald-400' : theme.textClass} />}
                          </div>
                        </button>

                        <div className={`my-1 border-t ${isDark ? 'border-slate-800' : 'border-gray-100'}`} />

                        {/* Course List */}
                        {classes.map(c => {
                          const count = documents.filter(d => d.classId === c.id).length;
                          const isSelected = selectedClassId === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => { setSelectedClassId(c.id); setShowCourseMenu(false); }}
                              className={`w-full px-3.5 py-2.5 text-left text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                                isSelected
                                  ? isDark
                                    ? 'bg-emerald-600/20 text-emerald-400'
                                    : `${theme.lightBgClass} ${theme.textClass}`
                                  : isDark
                                    ? 'text-slate-300 hover:bg-slate-800'
                                    : 'text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <span className="truncate block">{c.name}</span>
                                <span className={`text-[10px] block font-medium ${
                                  isSelected ? (isDark ? 'text-emerald-400/80' : theme.textClass) : (isDark ? 'text-slate-500' : 'text-gray-400')
                                }`}>
                                  Period {c.period || '1'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {count > 0 && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                                    isSelected ? (isDark ? 'bg-emerald-950 text-emerald-300' : `${theme.lightBgClass} ${theme.textClass}`) : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-600')
                                  }`}>
                                    {count}
                                  </span>
                                )}
                                {isSelected && <Check size={14} className={isDark ? 'text-emerald-400' : theme.textClass} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''} shown
                </span>
              </div>

              {/* Search input */}
              <div className="relative min-w-[220px]">
                <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  className={`w-full pl-8 pr-3 py-2 rounded-2xl border text-xs font-semibold outline-none ${
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500'
                      : `border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:${theme.ringClass}`
                  }`}
                />
              </div>
            </div>

            {/* Type Filter Chips */}
            <div className={`px-6 py-2.5 border-b ${
              isDark ? 'border-slate-800 bg-[#0a0f1d]/50' : 'border-gray-100 bg-gray-50/50'
            } flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0`}>
              {[
                { id: 'all', label: 'All Types' },
                { id: 'syllabus', label: 'Syllabus' },
                { id: 'learning_target', label: 'Learning Targets' },
                { id: 'notes', label: 'Notes' },
                { id: 'review_packet', label: 'Review' },
                { id: 'lab', label: 'Labs' },
              ].map(chip => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedTypeFilter(chip.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedTypeFilter === chip.id
                      ? isDark
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : `${theme.bgClass} text-white shadow-xs`
                      : isDark
                        ? 'text-slate-400 hover:text-white bg-transparent'
                        : 'text-gray-500 hover:text-gray-800 bg-transparent'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Document Cards List (Responsive Multi-Column Grid) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {filteredDocs.length === 0 ? (
                <div className={`text-center py-16 border-2 border-dashed ${
                  isDark ? 'border-slate-800' : 'border-gray-200'
                } rounded-3xl p-8 space-y-3 max-w-lg mx-auto my-6`}>
                  <div className={`w-14 h-14 rounded-3xl ${
                    isDark ? 'bg-slate-800 text-emerald-400 border border-slate-700' : `${theme.lightBgClass} ${theme.textClass}`
                  } flex items-center justify-center mx-auto shadow-xs`}>
                    <FileText size={28} />
                  </div>
                  <h4 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
                    No documents found
                  </h4>
                  <p className={`text-xs max-w-sm mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                    {searchQuery
                      ? `No documents match "${searchQuery}". Try clearing your search.`
                      : `No documents added for this section yet. Upload a syllabus, unit outline, or class notes.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className={`mt-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold ${
                      isDark ? 'bg-emerald-600' : theme.bgClass
                    } text-white inline-flex items-center gap-1.5 shadow-md hover:opacity-90 transition cursor-pointer`}
                  >
                    <Plus size={15} strokeWidth={3} />
                    <span>Upload Document</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredDocs.map(doc => {
                    const typeInfo = TYPE_CONFIG[doc.type] || TYPE_CONFIG.other;
                    const IconComponent = typeInfo.icon;
                    const preview = doc.content && !doc.content.startsWith('%PDF') 
                      ? doc.content 
                      : `Course material for ${doc.className || 'this class'} (${doc.title || doc.fileName}).`;

                    return (
                      <div
                        key={doc.id}
                        className={`p-4 rounded-2xl border shadow-2xs hover:shadow-xs transition space-y-3 flex flex-col justify-between ${
                          isDark ? 'bg-slate-850 border-slate-700 text-white' : 'bg-white border-gray-200/80 text-gray-900'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-2xl ${
                                isDark ? 'bg-slate-800 text-emerald-400 border border-slate-700' : `${theme.lightBgClass} ${theme.textClass}`
                              } flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}>
                                <IconComponent size={18} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeInfo.color}`}>
                                    {typeInfo.label}
                                  </span>
                                  {doc.unit && (
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                      isDark ? 'text-slate-300 bg-slate-700' : 'text-gray-500 bg-gray-100'
                                    }`}>
                                      {doc.unit}
                                    </span>
                                  )}
                                  <span className={`text-[10px] font-semibold truncate ${
                                    isDark ? 'text-slate-400' : 'text-gray-400'
                                  }`}>
                                    {doc.className}
                                  </span>
                                </div>
                                <h4 className={`font-extrabold text-sm mt-1 truncate ${
                                  isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {doc.title}
                                </h4>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeDocument(doc.id);
                              }}
                              className={`transition p-2 rounded-xl cursor-pointer shrink-0 ${
                                isDark ? 'text-slate-400 hover:text-red-400 hover:bg-red-950/40' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                              }`}
                              title="Delete document"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          {/* Content Excerpt */}
                          <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                            isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-gray-50 border-gray-100 text-gray-700'
                          }`}>
                            <p className="line-clamp-2 select-text font-normal">
                              {preview}
                            </p>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className={`flex items-center justify-between text-[11px] font-medium pt-1 border-t ${
                          isDark ? 'border-slate-800 text-slate-400' : 'border-gray-100 text-gray-400'
                        }`}>
                          <span className="truncate max-w-[200px]">File: {doc.fileName || 'Attached file'}</span>
                          <span>Added {doc.dateAdded}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ── Modal Footer ── */}
          <div className={`px-6 py-4 border-t flex items-center justify-between text-xs ${
            isDark ? 'bg-[#0a0f1d] border-slate-800 text-slate-400' : 'bg-gray-50/80 border-gray-100 text-gray-500'
          }`}>
            <span className="font-semibold">
              {documents.length} total document{documents.length !== 1 ? 's' : ''} stored
            </span>
          </div>

        </div>
      </div>

      {showAddModal && (
        <DocAdderModal
          preselectedClassId={selectedClassId !== 'all' ? selectedClassId : null}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </>
  );
}
