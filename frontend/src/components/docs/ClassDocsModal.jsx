import React, { useState, useRef } from 'react';
import { X, FileText, Trash2, Plus, BookOpen, Sparkles, Award, FolderKanban, FlaskConical, MessageSquare } from 'lucide-react';
import { useDocStore } from '../../store/useDocStore';
import { useStore } from '../../store/useStore';
import { getTheme } from '../../utils/themeConfig';
import DocAdderModal from './DocAdderModal';

export default function ClassDocsModal({ onClose, preselectedClassId = null }) {
  const { documents, removeDocument } = useDocStore();
  const { hacData, activeTheme } = useStore();
  const theme = getTheme(activeTheme);
  const sliderRef = useRef(null);

  const classes = hacData?.classes || [];
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId || (classes[0]?.id || ''));
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleScroll = (e) => {
    const el = e.currentTarget;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll > 0) {
      setScrollProgress(Math.min(1, Math.max(0, el.scrollLeft / maxScroll)));
    } else {
      setScrollProgress(0);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId) || { name: 'General / All Classes', id: 'general' };
  const classDocs = selectedClassId 
    ? documents.filter(d => d.classId === selectedClassId || (!d.classId && selectedClassId === 'general'))
    : documents;

  const typeConfig = {
    syllabus: { label: 'Syllabus & Pacing', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    learning_target: { label: 'Learning Targets', icon: Award, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    notes: { label: 'Class Notes', icon: FileText, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    review_packet: { label: 'Review Packet', icon: FolderKanban, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    lab: { label: 'Lab Manual', icon: FlaskConical, color: 'text-teal-600 bg-teal-50 border-teal-200' },
    other: { label: 'Document', icon: MessageSquare, color: 'text-slate-600 bg-slate-50 border-slate-200' }
  };

  return (
    <>
      {showAddModal && (
        <DocAdderModal
          preselectedClassId={selectedClassId}
          onClose={() => setShowAddModal(false)}
        />
      )}

      <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in duration-150">
          
          {/* Header */}
          <div className={`${theme.bgClass} px-6 pt-5 pb-5 text-white flex items-center justify-between shadow-sm shrink-0`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center font-bold text-white shadow-xs">
                <BookOpen size={20} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                  Course Documents
                </h2>
                <p className="text-xs opacity-90 font-medium mt-0.5">
                  Syllabi, learning targets, and notes for Ascend AI knowledge
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3.5 py-2 rounded-2xl bg-white/20 hover:bg-white/30 transition text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus size={15} />
                <span>Add Document</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Class Carousel Tabs */}
          <div className={`px-6 pt-3 pb-3 ${theme.isDark ? 'bg-slate-900/90' : 'bg-gray-50/80'} border-b border-gray-100 dark:border-slate-800 flex flex-col gap-2`}>
            <div 
              ref={sliderRef}
              onScroll={handleScroll}
              onWheel={(e) => {
                if (e.deltaY !== 0) e.currentTarget.scrollLeft += e.deltaY;
              }}
              className="flex items-center gap-2 overflow-x-auto py-1 scroll-smooth cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {classes.map(c => {
                const isSelected = selectedClassId === c.id;
                const docCount = documents.filter(d => d.classId === c.id).length;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClassId(c.id)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 shrink-0 ${
                      isSelected
                        ? `${theme.bgClass} text-white shadow-md ring-2 ${theme.ringClass}`
                        : `${theme.isDark ? 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 border-slate-700/80' : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-200'} border`
                    }`}
                  >
                    <span>{c.name}</span>
                    {docCount > 0 && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                        isSelected ? 'bg-white/20 text-white' : `${theme.lightBgClass} ${theme.textClass} border ${theme.borderClass}`
                      }`}>
                        {docCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Scroll indicator bar */}
            <div className="w-full px-1 pt-1 pb-0.5">
              <div className="w-full h-2.5 bg-gray-200/90 dark:bg-slate-800 rounded-full overflow-hidden relative shadow-inner border border-gray-300/60 dark:border-slate-700 p-0.5">
                <div 
                  className={`h-full ${theme.bgClass} rounded-full transition-all duration-75 shadow-sm`}
                  style={{
                    width: '52%',
                    marginLeft: `${scrollProgress * 48}%`
                  }}
                />
              </div>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-gray-800 dark:text-white">
                {selectedClass.name} ({classDocs.length})
              </h3>
              <button
                onClick={() => setShowAddModal(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${theme.lightBgClass} ${theme.textClass} hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer`}
              >
                <Plus size={14} />
                <span>Add Document</span>
              </button>
            </div>

            {/* Document List */}
            {classDocs.length === 0 ? (
              <div className="text-center py-14 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-3xl p-6 space-y-3">
                <div className={`w-14 h-14 rounded-3xl ${theme.lightBgClass} ${theme.textClass} flex items-center justify-center mx-auto shadow-xs`}>
                  <FileText size={28} />
                </div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200">No documents added for this class yet</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                  Add your course syllabus, unit objectives, or class notes to power AI study planning and assignments.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className={`mt-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold ${theme.bgClass} text-white inline-flex items-center gap-1.5 shadow-md hover:opacity-90 transition cursor-pointer`}
                >
                  <Plus size={15} /> Add Document
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {classDocs.map(doc => {
                  const typeData = typeConfig[doc.type] || typeConfig.other;
                  const Icon = typeData.icon;
                  const previewText = doc.content && !doc.content.startsWith('%PDF') 
                    ? doc.content 
                    : `Course materials for ${doc.className || 'this class'} (${doc.title || doc.fileName}). Indexed in Ascend AI Knowledge Base.`;

                  return (
                    <div
                      key={doc.id}
                      className="p-4 rounded-2xl bg-gray-50/50 dark:bg-slate-800/60 border border-gray-200/80 dark:border-slate-700/80 hover:border-emerald-500/50 shadow-xs transition space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-2xl ${theme.lightBgClass} ${theme.textClass} flex items-center justify-center shrink-0 mt-0.5 shadow-2xs`}>
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${typeData.color}`}>
                                {typeData.label}
                              </span>
                              {doc.unit && (
                                <span className="text-[10px] text-gray-500 bg-gray-200/60 dark:bg-slate-700 px-2 py-0.5 rounded-md font-bold">
                                  {doc.unit}
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400 font-semibold truncate">
                                {doc.className}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mt-1 truncate">
                              {doc.title}
                            </h4>
                          </div>
                        </div>
                        <button
                          onClick={() => removeDocument(doc.id)}
                          className="text-gray-400 hover:text-red-500 transition p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer shrink-0"
                          title="Delete Document"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Clean Document Content Context Box */}
                      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-gray-200/60 dark:border-slate-800 text-xs text-gray-700 dark:text-slate-300 leading-relaxed">
                        <p className="line-clamp-3 select-text">
                          {previewText}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium pt-0.5">
                        <span className="truncate max-w-[250px]">Source: {doc.fileName || 'Document File'}</span>
                        <span>Indexed {doc.dateAdded}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50/80 dark:bg-slate-800/80 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
            <div className={`flex items-center gap-1.5 ${theme.textClass} font-bold`}>
              <Sparkles size={14} />
              <span>Embedded automatically in Ascend AI tutor and planner.</span>
            </div>
            <button
              onClick={onClose}
              className={`px-5 py-2 ${theme.bgClass} text-white font-bold rounded-2xl hover:opacity-90 transition cursor-pointer shadow-xs`}
            >
              Done
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
