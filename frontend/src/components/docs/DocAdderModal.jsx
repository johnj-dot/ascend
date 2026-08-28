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
  const initialClass = classes.find(c => c.id === preselectedClassId) || classes[0] || null;

  const [title, setTitle] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(initialClass);
  const [selectedType, setSelectedType] = useState(DOCUMENT_TYPES[0]); // Default: Syllabus & Pacing
  const [unit, setUnit] = useState('');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(null);
  const fileInputRef = useRef(null);

  // Sub-drawers: 'main' | 'course' | 'type'
  const [pickerView, setPickerView] = useState('main');

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFileSize(file.size);
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
    const finalTitle = title.trim() || fileName.replace(/\.[^/.]+$/, '') || 'Course Document';
    const finalContent = content.trim() || `Course document for ${selectedCourse?.name || 'General Academic'}: ${finalTitle}.`;

    addDocument({
      classId: selectedCourse?.id || 'general',
      className: selectedCourse?.name || 'General Academic',
      title: finalTitle,
      unit: unit.trim() || 'General',
      type: selectedType ? selectedType.id : 'syllabus',
      content: finalContent,
      fileName: fileName || `${finalTitle.toLowerCase().replace(/\s+/g, '_')}.txt`
    });

    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-xl md:max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100 flex flex-col my-auto max-h-[92vh] overflow-hidden"
      >
        
        {/* Top Header Bar */}
        <div className={`${theme.bgClass} px-6 pt-5 pb-5 text-white flex items-center justify-between relative shadow-sm shrink-0`}>
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
          <div className="p-5 md:p-6 overflow-y-auto space-y-3 flex-1 bg-gray-50/50">
            
            {/* Section Header */}
            <div className="bg-gray-100 py-2.5 px-4 rounded-xl text-center">
              <span className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Current Courses</span>
            </div>

            {/* General / No Course Option */}
            <button
              type="button"
              onClick={() => { setSelectedCourse(null); setPickerView('main'); }}
              className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                !selectedCourse ? `${theme.borderClass} ${theme.lightBgClass} font-bold shadow-sm` : 'border-gray-200/80 bg-white hover:bg-gray-50'
              }`}
            >
              <div>
                <h4 className="font-bold text-gray-800 text-sm">General / All Classes</h4>
                <p className="text-xs text-gray-400 mt-0.5">School-wide or multi-class reference document</p>
              </div>
              {!selectedCourse ? <Check size={18} className={theme.textClass} /> : <ChevronRight size={18} className="text-gray-300" />}
            </button>

            {/* Course Cards List */}
            {classes.map(cls => {
              const isSel = selectedCourse?.id === cls.id;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => { setSelectedCourse(cls); setPickerView('main'); }}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                    isSel ? `${theme.borderClass} ${theme.lightBgClass} shadow-sm` : 'border-gray-200/80 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{cls.name}</h4>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">
                      {cls.id || 'Course'} · Period {cls.period || '1'} {cls.teacher ? `· ${cls.teacher}` : ''}
                    </p>
                  </div>
                  {isSel ? <Check size={18} className={theme.textClass} /> : <ChevronRight size={18} className="text-gray-300" />}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Sub-View 2: Select Document Type Drawer (Gradeway UI Clone) ── */}
        {pickerView === 'type' && (
          <div className="p-5 md:p-6 overflow-y-auto space-y-2.5 flex-1 bg-gray-50/50">
            {DOCUMENT_TYPES.map(t => {
              const isSel = selectedType.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setSelectedType(t); setPickerView('main'); }}
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                    isSel ? `${theme.borderClass} ${theme.lightBgClass} shadow-sm font-bold` : 'border-gray-200/80 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-2">
                    <div className={`w-10 h-10 rounded-xl ${theme.bgClass} text-white flex items-center justify-center font-bold shadow-sm shrink-0`}>
                      {t.icon}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-extrabold text-gray-800 block truncate">{t.label}</span>
                      <span className="text-xs text-gray-400 font-medium block truncate">{t.desc}</span>
                    </div>
                  </div>
                  {isSel ? <Check size={18} className={theme.textClass} /> : <ChevronRight size={18} className="text-gray-300" />}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Main Form View (Gradeway UI Clone) ── */}
        {pickerView === 'main' && (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto space-y-5 flex-1 flex flex-col justify-between">
            <div className="space-y-5">
              
              {/* Document Title Field */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. AP CSP Syllabus, Unit 3 Genetics Objectives"
                  className={`w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:${theme.ringClass} focus:border-transparent outline-none text-sm font-semibold transition bg-gray-50/50 hover:bg-white`}
                />
              </div>

              {/* Course Selector Button */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Course</label>
                <button
                  type="button"
                  onClick={() => setPickerView('course')}
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100/80 transition flex items-center justify-between text-left shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl ${theme.bgClass} text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm`}>
                      HAC
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-gray-800 block truncate">
                        {selectedCourse ? selectedCourse.name : 'General / All Classes'}
                      </span>
                      {selectedCourse && (
                        <span className="text-xs text-gray-400 block truncate">
                          {selectedCourse.id} · Period {selectedCourse.period || '1'}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 shrink-0" />
                </button>
              </div>

              {/* Document Type Selector Button */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Document Type</label>
                  <span className={`text-[10px] font-bold ${theme.textClass}`}>Required</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPickerView('type')}
                  className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100/80 transition flex items-center justify-between text-left shadow-sm cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl ${theme.bgClass} text-white flex items-center justify-center font-bold shadow-sm shrink-0`}>
                      {selectedType.icon}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-bold text-gray-800 block truncate">{selectedType.label}</span>
                      <span className="text-xs text-gray-400 block truncate">{selectedType.desc}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 shrink-0" />
                </button>
              </div>

              {/* Unit / Topic Tag Field (Optional) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Unit / Module Tag</label>
                  <span className="text-[10px] font-bold text-gray-400">Optional</span>
                </div>
                <input
                  type="text"
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="e.g. Unit 1, Fall Semester, Exam Prep"
                  className={`w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:${theme.ringClass} focus:border-transparent outline-none text-sm font-semibold transition bg-gray-50/50 hover:bg-white`}
                />
              </div>

              {/* Upload & Content Section */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  File Upload & Content
                </label>

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
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 hover:border-emerald-400 bg-gray-50/60 hover:bg-emerald-50/30 rounded-2xl p-5 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 group"
                  >
                    <div className={`w-10 h-10 rounded-2xl ${theme.lightBgClass} ${theme.textClass} flex items-center justify-center group-hover:scale-105 transition`}>
                      <Upload size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        Click to upload syllabus or notes file
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        PDF, DOCX, TXT, Markdown, CSV, or JSON
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <File size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold truncate">{fileName}</p>
                        {fileSize && (
                          <p className="text-[10px] text-emerald-700 font-medium">
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
                    onChange={e => setContent(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:${theme.ringClass} outline-none text-xs font-medium text-gray-800 bg-gray-50/50 hover:bg-white transition resize-none`}
                  />
                </div>
              </div>

            </div>

            {/* Prominent Large Done Button */}
            <div className="pt-6 pb-2">
              <button
                type="submit"
                className={`w-full ${theme.bgClass} text-white font-extrabold h-14 rounded-2xl hover:opacity-95 transition-all shadow-xl text-base flex items-center justify-center gap-2 transform active:scale-[0.99] cursor-pointer`}
              >
                <Check size={22} strokeWidth={3} />
                <span>Done</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
