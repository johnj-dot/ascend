import React, { useState, useRef } from 'react';
import { 
  X, ChevronRight, ChevronLeft, BookOpen, Award, FileText, 
  FlaskConical, FolderKanban, MessageSquare, Check, Upload, File, Sparkles 
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { useDocStore } from '../../store/useDocStore';
import { getTheme } from '../../utils/themeConfig';

export const DOCUMENT_TYPES = [
  { id: 'syllabus', label: 'Syllabus & Pacing', icon: <BookOpen size={18} />, color: 'bg-emerald-500', desc: 'Course expectations, grading policy, curriculum map' },
  { id: 'learning_target', label: 'Learning Targets', icon: <Award size={18} />, color: 'bg-emerald-500', desc: 'Standards, objectives, unit essential questions' },
  { id: 'notes', label: 'Class Notes', icon: <FileText size={18} />, color: 'bg-emerald-500', desc: 'Lecture outlines, slides, formulas, summaries' },
  { id: 'review_packet', label: 'Review Packet', icon: <FolderKanban size={18} />, color: 'bg-emerald-500', desc: 'Exam prep, review sheets, study packets' },
  { id: 'lab', label: 'Lab Manual & Handout', icon: <FlaskConical size={18} />, color: 'bg-emerald-500', desc: 'Lab protocols, worksheets, activity guides' },
  { id: 'other', label: 'Other Course Material', icon: <MessageSquare size={18} />, color: 'bg-emerald-500', desc: 'Rubrics, articles, reading passages' },
];

export default function DocAdderModal({ onClose, preselectedClassId = null }) {
  const { hacData, activeTheme } = useStore();
  const { addDocument } = useDocStore();
  const theme = getTheme(activeTheme);

  const classes = hacData?.classes || [];
  const initialClass = preselectedClassId ? (classes.find(c => c.id === preselectedClassId) || null) : null;

  const [title, setTitle] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(initialClass);
  const [selectedType, setSelectedType] = useState(null); // Default: Select Document Type...
  const [unit, setUnit] = useState('');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(null);

  // Validation States
  const [courseError, setCourseError] = useState(false);
  const [typeError, setTypeError] = useState(false);
  const [contentError, setContentError] = useState(false);
  const [shakingField, setShakingField] = useState(null); // 'course' | 'type' | 'content' | null

  const fileInputRef = useRef(null);

  // Sub-drawers: 'main' | 'course' | 'type'
  const [pickerView, setPickerView] = useState('main');

  const triggerError = (field) => {
    setShakingField(field);
    if (field === 'course') setCourseError(true);
    if (field === 'type') setTypeError(true);
    if (field === 'content') setContentError(true);
    setTimeout(() => setShakingField(null), 500);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileSize(file.size);
    setContentError(false);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result || '';
      setContent(text);

      // Auto-match class if unselected or default
      const previewInfo = useDocStore.getState().classifyFileForPreview({
        fileName: file.name,
        title: file.name.replace(/\.[^/.]+$/, ''),
        content: text,
      }, classes);

      if (previewInfo?.matchedClass && previewInfo.matchedClass.id !== 'general' && !selectedCourse) {
        setSelectedCourse(previewInfo.matchedClass);
        setCourseError(false);
      }
    };
    reader.readAsText(file);
  };

  const handleRemoveFile = () => {
    setFileName('');
    setFileSize(null);
    setContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (!selectedCourse) {
      triggerError('course');
      return;
    }

    if (!selectedType) {
      triggerError('type');
      return;
    }

    const hasFile = !!fileName;
    const hasContent = !!content.trim();
    const hasTitle = !!title.trim();

    if (!hasFile && !hasContent && !hasTitle) {
      triggerError('content');
      return;
    }

    const finalTitle = title.trim() || fileName.replace(/\.[^/.]+$/, '') || `${selectedType.label} Document`;
    const finalContent = content.trim() || `Course document for ${selectedCourse.name}: ${finalTitle}.`;

    addDocument({
      classId: selectedCourse.id,
      className: selectedCourse.name,
      title: finalTitle,
      unit: unit.trim() || 'General',
      type: selectedType.id,
      content: finalContent,
      fileName: fileName || `${finalTitle.toLowerCase().replace(/\s+/g, '_')}.txt`
    });

    onClose();
  };

  const isDark = !!theme.isDark;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto custom-scrollbar"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${
          isDark ? 'bg-[#0f172a] text-white border-slate-800' : 'bg-white text-gray-900 border-gray-100'
        } rounded-3xl w-full max-w-xl md:max-w-2xl shadow-2xl animate-slide-up border flex flex-col my-auto max-h-[92vh] overflow-hidden relative`}
      >
        
        {/* Top Header Bar */}
        <div className={`${
          isDark ? 'bg-slate-900 border-b border-slate-800' : theme.bgClass
        } px-6 pt-5 pb-5 text-white flex items-center justify-between relative shadow-sm shrink-0`}>
          {/* Left Slot */}
          <div className="w-20 flex items-center">
            {pickerView !== 'main' ? (
              <button
                type="button"
                onClick={() => setPickerView('main')}
                className="p-1.5 rounded-full hover:bg-white/20 transition flex items-center justify-center cursor-pointer"
                title="Go back"
              >
                <ChevronLeft size={24} strokeWidth={2.5} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-bold opacity-90 hover:opacity-100 transition cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
          
          {/* Center Title */}
          <div className="flex-1 text-center">
            <h2 className="text-xl font-extrabold tracking-tight">
              {pickerView === 'course' ? 'Select Course' :
               pickerView === 'type' ? 'Select Document Type' : 'Add Document'}
            </h2>
          </div>

          {/* Right Slot */}
          <div className="w-20 flex justify-end items-center">
            {pickerView === 'main' ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="text-sm font-extrabold opacity-95 hover:opacity-100 transition cursor-pointer"
              >
                Done
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition shadow-sm cursor-pointer"
                title="Close modal"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* ── Sub-View 1: Select Course Drawer (Gradeway UI Clone) ── */}
        {pickerView === 'course' && (
          <div className={`p-5 md:p-6 overflow-y-auto custom-scrollbar space-y-3 flex-1 animate-slide-in-right ${isDark ? 'bg-[#0b1120]' : 'bg-gray-50/50'}`}>
            
            {/* Section Header */}
            <div className={`${isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-gray-100 text-gray-600'} py-2.5 px-4 rounded-xl text-center`}>
              <span className="text-xs font-extrabold uppercase tracking-wider">Choose Course</span>
            </div>

            {/* Option 1: All Courses */}
            <button
              type="button"
              onClick={() => { setSelectedCourse({ id: 'all', name: 'All Courses' }); setCourseError(false); setPickerView('main'); }}
              className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                selectedCourse?.id === 'all'
                  ? isDark
                    ? 'border-emerald-500/80 bg-emerald-950/30 text-white shadow-sm font-bold'
                    : `${theme.borderClass} ${theme.lightBgClass} shadow-sm font-bold`
                  : isDark
                    ? 'border-slate-800 bg-slate-850 hover:bg-slate-800 text-white'
                    : 'border-gray-200/80 bg-white hover:bg-gray-50 text-gray-900'
              }`}
            >
              <div className="min-w-0 pr-3">
                <h4 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>All Courses</h4>
                <p className={`text-xs font-semibold mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                  Apply document across all enrolled classes
                </p>
              </div>
              {selectedCourse?.id === 'all' ? <Check size={18} className={isDark ? 'text-emerald-400' : theme.textClass} /> : <ChevronRight size={18} className={isDark ? 'text-slate-500' : 'text-gray-300'} />}
            </button>

            {/* Course Cards List */}
            {classes.map(cls => {
              const isSel = selectedCourse?.id === cls.id;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => { setSelectedCourse(cls); setCourseError(false); setPickerView('main'); }}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                    isSel
                      ? isDark
                        ? 'border-emerald-500/80 bg-emerald-950/30 text-white shadow-sm'
                        : `${theme.borderClass} ${theme.lightBgClass} shadow-sm`
                      : isDark
                        ? 'border-slate-800 bg-slate-850 hover:bg-slate-800 text-white'
                        : 'border-gray-200/80 bg-white hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <h4 className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{cls.name}</h4>
                    <p className={`text-xs font-semibold mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                      {cls.id || 'Course'} · Period {cls.period || '1'} {cls.teacher ? `· ${cls.teacher}` : ''}
                    </p>
                  </div>
                  {isSel ? <Check size={18} className={isDark ? 'text-emerald-400' : theme.textClass} /> : <ChevronRight size={18} className={isDark ? 'text-slate-500' : 'text-gray-300'} />}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Sub-View 2: Select Document Type Drawer (Gradeway UI Clone) ── */}
        {pickerView === 'type' && (
          <div className={`p-5 md:p-6 overflow-y-auto custom-scrollbar space-y-2.5 flex-1 animate-slide-in-right ${isDark ? 'bg-[#0b1120]' : 'bg-gray-50/50'}`}>
            {DOCUMENT_TYPES.map(t => {
              const isSel = selectedType?.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setSelectedType(t); setTypeError(false); setPickerView('main'); }}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                    isSel
                      ? isDark
                        ? 'border-emerald-500/80 bg-emerald-950/30 text-white shadow-sm font-bold'
                        : `${theme.borderClass} ${theme.lightBgClass} shadow-sm font-bold`
                      : isDark
                        ? 'border-slate-800 bg-slate-850 hover:bg-slate-800 text-white'
                        : 'border-gray-200/80 bg-white hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-2">
                    <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-slate-800 text-emerald-400 border border-slate-700' : `${theme.bgClass} text-white`} flex items-center justify-center font-bold shadow-sm shrink-0`}>
                      {t.icon}
                    </div>
                    <div className="min-w-0">
                      <span className={`text-sm font-extrabold block truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{t.label}</span>
                      <span className={`text-xs font-medium block truncate ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>{t.desc}</span>
                    </div>
                  </div>
                  {isSel ? <Check size={18} className={isDark ? 'text-emerald-400' : theme.textClass} /> : <ChevronRight size={18} className={isDark ? 'text-slate-500' : 'text-gray-300'} />}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Main Form View (Gradeway UI Clone) ── */}
        {pickerView === 'main' && (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-5">
              
              {/* Document Title Field */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  Document Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => { setTitle(e.target.value); setContentError(false); }}
                  placeholder="e.g. AP CSP Syllabus, Unit 3 Genetics Objectives"
                  className={`w-full px-5 py-3.5 rounded-2xl border outline-none text-sm font-semibold transition ${
                    isDark
                      ? 'bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500'
                      : `bg-gray-50/70 border-gray-200 text-gray-900 placeholder-gray-400 hover:bg-white focus:bg-white focus:ring-2 focus:${theme.ringClass}`
                  }`}
                />
              </div>

              {/* Course Selector Button */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${courseError ? 'text-red-500 font-extrabold' : isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Course
                  </label>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    courseError 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : isDark 
                      ? 'bg-slate-800 text-slate-300 border border-slate-700' 
                      : `${theme.lightBgClass} ${theme.textClass}`
                  }`}>
                    Required
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setCourseError(false); setPickerView('course'); }}
                  className={`w-full px-5 py-3.5 rounded-2xl border transition flex items-center justify-between text-left shadow-xs cursor-pointer ${
                    shakingField === 'course' ? 'animate-shake' : ''
                  } ${
                    courseError
                      ? 'border-red-500 ring-2 ring-red-400/50 bg-red-50/20 text-red-700 dark:text-red-300'
                      : isDark
                      ? 'border-slate-700/80 bg-slate-800/50 hover:bg-slate-800 text-white'
                      : 'border-gray-200/80 bg-gray-50/60 hover:bg-gray-100/80 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl ${
                      courseError ? 'bg-red-500 text-white' : isDark ? 'bg-slate-700 text-emerald-400' : `${theme.bgClass} text-white`
                    } font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs`}>
                      HAC
                    </div>
                    <div className="min-w-0">
                      <span className={`text-sm font-bold block truncate ${
                        !selectedCourse ? (courseError ? 'text-red-500' : 'text-slate-500 dark:text-slate-400') : isDark ? 'text-white' : 'text-gray-800'
                      }`}>
                        {selectedCourse ? selectedCourse.name : 'Select Course...'}
                      </span>
                      <span className={`text-xs block truncate ${
                        !selectedCourse ? 'text-gray-400 dark:text-slate-500' : isDark ? 'text-slate-400' : 'text-gray-400'
                      }`}>
                        {selectedCourse ? (selectedCourse.id === 'all' ? 'Applies to all enrolled courses' : `${selectedCourse.id} · Period ${selectedCourse.period || '1'}`) : 'Choose a course or select (All Courses)'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
                </button>
              </div>

              {/* Document Type Selector Button */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${typeError ? 'text-red-500 font-extrabold' : isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Document Type
                  </label>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    typeError 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : isDark 
                      ? 'bg-slate-800 text-slate-300 border border-slate-700' 
                      : `${theme.lightBgClass} ${theme.textClass}`
                  }`}>
                    Required
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setTypeError(false); setPickerView('type'); }}
                  className={`w-full px-5 py-3.5 rounded-2xl border transition flex items-center justify-between text-left shadow-xs cursor-pointer ${
                    shakingField === 'type' ? 'animate-shake' : ''
                  } ${
                    typeError
                      ? 'border-red-500 ring-2 ring-red-400/50 bg-red-50/20 text-red-700 dark:text-red-300'
                      : isDark
                      ? 'border-slate-700/80 bg-slate-800/50 hover:bg-slate-800 text-white'
                      : 'border-gray-200/80 bg-gray-50/60 hover:bg-gray-100/80 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl ${
                      typeError ? 'bg-red-500 text-white' : isDark ? 'bg-slate-700 text-emerald-400' : `${theme.bgClass} text-white`
                    } flex items-center justify-center font-bold shadow-xs shrink-0`}>
                      {selectedType ? selectedType.icon : <BookOpen size={18} />}
                    </div>
                    <div className="min-w-0">
                      <span className={`text-sm font-bold block truncate ${
                        !selectedType ? (typeError ? 'text-red-500' : 'text-slate-500 dark:text-slate-400') : isDark ? 'text-white' : 'text-gray-800'
                      }`}>
                        {selectedType ? selectedType.label : 'Select Document Type...'}
                      </span>
                      <span className={`text-xs block truncate ${
                        !selectedType ? 'text-gray-400 dark:text-slate-500' : isDark ? 'text-slate-400' : 'text-gray-400'
                      }`}>
                        {selectedType ? selectedType.desc : 'Choose syllabus, notes, review packet, etc.'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
                </button>
              </div>

              {/* Unit / Topic Tag Field */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Unit / Module Tag</label>
                </div>
                <input
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="e.g. Unit 1, Fall Semester, Exam Prep"
                  className={`w-full px-5 py-3.5 rounded-2xl border outline-none text-sm font-semibold transition ${
                    isDark
                      ? 'bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500'
                      : `bg-gray-50/70 border-gray-200 text-gray-900 placeholder-gray-400 hover:bg-white focus:bg-white focus:ring-2 focus:${theme.ringClass}`
                  }`}
                />
              </div>

              {/* Upload & Content Section */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${contentError ? 'text-red-500 font-extrabold' : isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    File Upload & Content
                  </label>
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                    contentError 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : isDark 
                      ? 'bg-slate-800 text-slate-300 border border-slate-700' 
                      : `${theme.lightBgClass} ${theme.textClass}`
                  }`}>
                    Required
                  </span>
                </div>

                {/* Upload Trigger Area */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.json,.csv,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {!fileName ? (
                  <div
                    onClick={() => { setContentError(false); fileInputRef.current?.click(); }}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 group ${
                      shakingField === 'content' ? 'animate-shake' : ''
                    } ${
                      contentError
                        ? 'border-red-500 bg-red-50/20'
                        : isDark
                        ? 'border-slate-700 hover:border-emerald-500 bg-slate-800/40 hover:bg-slate-800/80'
                        : `border-gray-200 hover:border-emerald-400 bg-gray-50/60 hover:bg-emerald-50/30`
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-2xl ${
                      contentError ? 'bg-red-500 text-white' : isDark ? 'bg-slate-700 text-emerald-400' : `${theme.lightBgClass} ${theme.textClass}`
                    } flex items-center justify-center group-hover:scale-105 transition`}>
                      <Upload size={20} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${contentError ? 'text-red-500' : isDark ? 'text-white' : 'text-gray-800'}`}>
                        Click to upload syllabus or notes file
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        PDF, DOCX, TXT, Markdown, CSV, or JSON
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className={`flex items-center justify-between p-3.5 rounded-2xl border ${
                    isDark ? 'bg-emerald-950/40 border-emerald-800/70 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <File size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold truncate">{fileName}</p>
                        {fileSize && (
                          <p className={`text-[10px] font-medium ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                            {(fileSize / 1024).toFixed(1)} KB · Ready to index
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1.5 rounded-lg text-emerald-700 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Remove file"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Optional Text Paste Area */}
                <div>
                  <textarea
                    rows={3}
                    placeholder="Or paste learning objectives, key formulas, or syllabus text here..."
                    value={content}
                    onChange={e => { setContent(e.target.value); setContentError(false); }}
                    className={`w-full px-4 py-3 rounded-2xl border outline-none text-xs font-medium transition resize-none ${
                      contentError ? 'border-red-500 bg-red-50/20' : isDark
                        ? 'border-slate-700 bg-slate-800/60 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500'
                        : `border-gray-200 bg-gray-50/70 text-gray-900 placeholder-gray-400 hover:bg-white focus:bg-white focus:ring-2 focus:${theme.ringClass}`
                    }`}
                  />
                </div>
              </div>

            </div>
          </form>
        )}

      </div>
    </div>
  );
}
