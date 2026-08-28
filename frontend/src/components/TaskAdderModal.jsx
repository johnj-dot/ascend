import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronRight, ChevronDown, ChevronLeft, BookOpen, Clock, Calendar as CalendarIcon, Bell, Check, Edit3, Award, FileText, FlaskConical, FolderKanban, MessageSquare, Plus } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getTheme } from '../utils/themeConfig';

export const ASSIGNMENT_TYPES = [
  { id: 'homework', label: 'Homework', icon: <Edit3 size={18} />, color: 'bg-emerald-500' },
  { id: 'study', label: 'Study', icon: <BookOpen size={18} />, color: 'bg-emerald-500' },
  { id: 'test', label: 'Test', icon: <Award size={18} />, color: 'bg-emerald-500' },
  { id: 'notes', label: 'Notes', icon: <FileText size={18} />, color: 'bg-emerald-500' },
  { id: 'reading', label: 'Reading', icon: <BookOpen size={18} />, color: 'bg-emerald-500' },
  { id: 'project', label: 'Project', icon: <FolderKanban size={18} />, color: 'bg-emerald-500' },
  { id: 'lab', label: 'Lab', icon: <FlaskConical size={18} />, color: 'bg-emerald-500' },
  { id: 'other', label: 'Other', icon: <MessageSquare size={18} />, color: 'bg-emerald-500' },
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function TaskAdderModal({ onClose }) {
  const { hacData, addPlannerTask, activeTheme, localOverrides, toggleSetting } = useStore();
  const theme = getTheme(activeTheme);
  const notificationsEnabled = localOverrides?.settings?.notifications !== false;

  const [tab, setTab] = useState('homework'); // 'homework' | 'reminder'
  const [name, setName] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedType, setSelectedType] = useState(ASSIGNMENT_TYPES[0]); // Default: Homework
  
  // Date State - Defaults to null / unset ("Select A Date")
  const [dueDateObj, setDueDateObj] = useState(null);
  const [openDateAccordion, setOpenDateAccordion] = useState(false);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Time State - Defaults to empty / unset ("Select A Time")
  const [dueTime, setDueTime] = useState('');
  const [openTimeAccordion, setOpenTimeAccordion] = useState(false);
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customTimeVal, setCustomTimeVal] = useState('17:00');

  // Notification State - Defaults to empty / unset ("Select A Time")
  const [notificationTime, setNotificationTime] = useState('');
  const [customNotifyVal, setCustomNotifyVal] = useState('08:00');
  const [openNotifyAccordion, setOpenNotifyAccordion] = useState(false);

  // Sub-drawers only for Course and Assignment Type
  const [pickerView, setPickerView] = useState('main'); // 'main' | 'course' | 'type'

  // Scroll references
  const dateAccordionRef = useRef(null);
  const timeAccordionRef = useRef(null);
  const notifyAccordionRef = useRef(null);

  useEffect(() => {
    if (openDateAccordion && dateAccordionRef.current) {
      setTimeout(() => {
        dateAccordionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [openDateAccordion]);

  useEffect(() => {
    if (openTimeAccordion && timeAccordionRef.current) {
      setTimeout(() => {
        timeAccordionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [openTimeAccordion]);

  useEffect(() => {
    if (openNotifyAccordion && notifyAccordionRef.current) {
      setTimeout(() => {
        notifyAccordionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, [openNotifyAccordion]);

  const classes = hacData?.classes || [];

  // Helper formatting
  const formattedDateString = dueDateObj
    ? dueDateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
    : 'Select A Date';

  const formatTime24to12 = (tStr) => {
    if (!tStr) return 'Select A Time';
    const [h, m] = tStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return tStr;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m < 10 ? '0' : ''}${m} ${ampm}`;
  };

  const dateValueYMD = dueDateObj ? dueDateObj.toISOString().split('T')[0] : '';

  const handleSelectDateDay = (dayNum) => {
    const newD = new Date(viewYear, viewMonth, dayNum);
    setDueDateObj(newD);
  };

  const handleQuickPresetDate = (daysToAdd) => {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    setDueDateObj(d);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  };

  // Request browser notification permission if user sets push notification
  const handleRequestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      try {
        await Notification.requestPermission();
      } catch (err) {
        console.warn('Notification permission request failed', err);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (notificationTime) {
      handleRequestNotificationPermission();
    }

    const finalTime = isCustomTime ? customTimeVal : dueTime;

    addPlannerTask({
      name: name.trim(),
      tab,
      course: tab === 'homework' && selectedCourse ? selectedCourse.name : null,
      courseId: tab === 'homework' && selectedCourse ? selectedCourse.id : null,
      type: tab === 'homework' ? (selectedType ? selectedType.label : 'Homework') : 'Reminder',
      typeId: tab === 'homework' ? (selectedType ? selectedType.id : 'homework') : 'reminder',
      dueDate: dateValueYMD,
      dueTime: finalTime,
      notificationTime,
      createdAt: new Date().toISOString(),
    });

    onClose();
  };

  // Calendar math
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

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
                className="p-1.5 rounded-full hover:bg-white/20 transition flex items-center justify-center"
                title="Go back"
              >
                <ChevronLeft size={24} strokeWidth={2.5} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="text-sm font-bold opacity-90 hover:opacity-100 transition"
              >
                Cancel
              </button>
            )}
          </div>
          
          {/* Center Title - Perfectly Centered */}
          <div className="flex-1 text-center">
            <h2 className="text-xl font-extrabold tracking-tight">
              {pickerView === 'course' ? 'Select Course' :
               pickerView === 'type' ? 'Select Type' : 'New Task'}
            </h2>
          </div>

          {/* Right Slot */}
          <div className="w-20 flex justify-end items-center">
            {pickerView === 'main' ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="text-sm font-extrabold opacity-95 hover:opacity-100 transition"
              >
                Done
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition shadow-sm"
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
            
            {/* Section Header: Current Courses */}
            <div className="bg-gray-100 py-2.5 px-4 rounded-xl text-center">
              <span className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Current Courses</span>
            </div>

            {/* General / No Course Option */}
            <button
              type="button"
              onClick={() => { setSelectedCourse(null); setPickerView('main'); }}
              className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition ${
                !selectedCourse ? `${theme.borderClass} ${theme.lightBgClass} font-bold shadow-sm` : 'border-gray-200/80 bg-white hover:bg-gray-50'
              }`}
            >
              <div>
                <h4 className="font-bold text-gray-800 text-sm">General / No Specific Course</h4>
                <p className="text-xs text-gray-400 mt-0.5">Non-class personal reminder or task</p>
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
                  className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition ${
                    isSel ? `${theme.borderClass} ${theme.lightBgClass} shadow-sm` : 'border-gray-200/80 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <h4 className="font-bold text-gray-900 text-sm truncate">{cls.name}</h4>
                    <p className="text-xs text-gray-400 font-semibold mt-0.5">
                      {cls.id || 'Course'} · Period {cls.period || '1'}
                    </p>
                  </div>
                  {isSel ? <Check size={18} className={theme.textClass} /> : <ChevronRight size={18} className="text-gray-300" />}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Sub-View 2: Select Assignment Type Drawer (Gradeway UI Clone) ── */}
        {pickerView === 'type' && (
          <div className="p-5 md:p-6 overflow-y-auto space-y-2.5 flex-1 bg-gray-50/50">
            {ASSIGNMENT_TYPES.map(t => {
              const isSel = selectedType.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setSelectedType(t); setPickerView('main'); }}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition ${
                    isSel ? `${theme.borderClass} ${theme.lightBgClass} shadow-sm font-bold` : 'border-gray-200/80 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl ${theme.bgClass} text-white flex items-center justify-center font-bold shadow-sm shrink-0`}>
                      {t.icon}
                    </div>
                    <span className="text-sm font-extrabold text-gray-800">{t.label}</span>
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
              {/* Tab Switcher: Homework vs Reminder */}
              <div className="bg-gray-100 p-1.5 rounded-2xl flex shadow-inner">
                <button
                  type="button"
                  onClick={() => setTab('homework')}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs md:text-sm transition-all ${
                    tab === 'homework' ? `${theme.bgClass} text-white shadow-md` : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Homework
                </button>
                <button
                  type="button"
                  onClick={() => setTab('reminder')}
                  className={`flex-1 py-3 rounded-xl font-bold text-xs md:text-sm transition-all ${
                    tab === 'reminder' ? `${theme.bgClass} text-white shadow-md` : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  Reminder
                </button>
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  {tab === 'homework' ? 'Name' : 'What is this reminder about?'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={tab === 'homework' ? 'e.g. Read Chapter 4, Math Homework' : 'e.g. Bring permission slip, Bring charger'}
                  className={`w-full px-5 py-3.5 rounded-2xl border border-gray-200 focus:ring-2 focus:${theme.ringClass} focus:border-transparent outline-none text-sm font-semibold transition bg-gray-50/50 hover:bg-white`}
                />
              </div>

              {/* Only show Course & Assignment Type when Tab is 'homework' */}
              {tab === 'homework' && (
                <>
                  {/* Course Selector Button */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Course</label>
                    <button
                      type="button"
                      onClick={() => setPickerView('course')}
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100/80 transition flex items-center justify-between text-left shadow-sm"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl ${theme.bgClass} text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm`}>
                          HAC
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-bold text-gray-800 block truncate">
                            {selectedCourse ? selectedCourse.name : 'Select A Course'}
                          </span>
                          {selectedCourse && (
                            <span className="text-xs text-gray-400 block truncate">
                              {selectedCourse.id} · Period {selectedCourse.period}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-gray-400 shrink-0" />
                    </button>
                  </div>

                  {/* Assignment Type Button */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Assignment Type</label>
                      <span className={`text-[10px] font-bold ${theme.textClass}`}>Optional</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPickerView('type')}
                      className="w-full px-5 py-3.5 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100/80 transition flex items-center justify-between text-left shadow-sm"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-8 h-8 rounded-xl ${theme.bgClass} text-white flex items-center justify-center font-bold shadow-sm`}>
                          {selectedType.icon}
                        </div>
                        <span className="text-sm font-bold text-gray-800">{selectedType.label}</span>
                      </div>
                      <ChevronRight size={18} className="text-gray-400 shrink-0" />
                    </button>
                  </div>
                </>
              )}

              {/* Due Date & Time Section (Full-Width Responsive Inline Accordions) */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {tab === 'homework' ? 'Due Date & Time' : 'Date & Time'}
                </label>
                
                {/* 2 Top Buttons Side by Side */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Date Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDateAccordion(!openDateAccordion);
                      setOpenTimeAccordion(false);
                      setOpenNotifyAccordion(false);
                    }}
                    className={`w-full px-4 py-3.5 rounded-2xl border transition flex items-center justify-between text-left shadow-sm ${
                      openDateAccordion ? `${theme.borderClass} bg-white ring-2 ${theme.ringClass}` : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl ${theme.lightBgClass} ${theme.textClass} flex items-center justify-center font-bold shrink-0`}>
                        <CalendarIcon size={18} />
                      </div>
                      <span className="text-xs md:text-sm font-bold text-gray-800 truncate">{formattedDateString}</span>
                    </div>
                    <ChevronDown size={18} className={`text-gray-400 shrink-0 transition-transform duration-200 ${openDateAccordion ? `rotate-180 ${theme.textClass}` : ''}`} />
                  </button>

                  {/* Time Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpenTimeAccordion(!openTimeAccordion);
                      setOpenDateAccordion(false);
                      setOpenNotifyAccordion(false);
                    }}
                    className={`w-full px-4 py-3.5 rounded-2xl border transition flex items-center justify-between text-left shadow-sm ${
                      openTimeAccordion ? `${theme.borderClass} bg-white ring-2 ${theme.ringClass}` : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-xl ${theme.lightBgClass} ${theme.textClass} flex items-center justify-center font-bold shrink-0`}>
                        <Clock size={18} />
                      </div>
                      <span className="text-xs md:text-sm font-bold text-gray-800 truncate">
                        {isCustomTime ? formatTime24to12(customTimeVal) : formatTime24to12(dueTime)}
                      </span>
                    </div>
                    <ChevronDown size={18} className={`text-gray-400 shrink-0 transition-transform duration-200 ${openTimeAccordion ? `rotate-180 ${theme.textClass}` : ''}`} />
                  </button>
                </div>

                {/* Full-Width Calendar Expanded View with Extra Bottom Space */}
                {openDateAccordion && (
                  <div ref={dateAccordionRef} className="bg-white rounded-3xl p-5 md:p-6 pb-6 shadow-xl border border-gray-200 animate-in fade-in zoom-in duration-150 space-y-4 mb-3">
                    {/* Month Year Navigator */}
                    <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
                          else { setViewMonth(viewMonth - 1); }
                        }}
                        className="p-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-600 shadow-sm cursor-pointer"
                      >
                        <ChevronLeft size={18} />
                      </button>

                      <span className="font-extrabold text-sm text-gray-800">
                        {MONTH_NAMES[viewMonth]} {viewYear}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
                          else { setViewMonth(viewMonth + 1); }
                        }}
                        className="p-1.5 rounded-xl bg-white hover:bg-gray-100 text-gray-600 shadow-sm cursor-pointer"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>

                    {/* Day Names */}
                    <div className="grid grid-cols-7 text-center text-[11px] font-bold text-gray-400 uppercase">
                      {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => (
                        <span key={i}>{d}</span>
                      ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarCells.map((dayNum, i) => {
                        if (!dayNum) return <div key={i} />;
                        const isSel = dueDateObj && dayNum === dueDateObj.getDate() && viewMonth === dueDateObj.getMonth() && viewYear === dueDateObj.getFullYear();
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleSelectDateDay(dayNum)}
                            className={`h-8 w-8 md:h-9 md:w-9 mx-auto rounded-xl flex items-center justify-center text-xs md:text-sm font-bold transition cursor-pointer ${
                              isSel ? `${theme.bgClass} text-white shadow-md font-extrabold ring-2 ${theme.ringClass} scale-105` : 'text-gray-700 hover:bg-gray-100 bg-gray-50/50'
                            }`}
                          >
                            {dayNum}
                          </button>
                        );
                      })}
                    </div>

                    {/* Quick Presets - Stays Open on Click */}
                    <div className="flex gap-2 pt-3 pb-1 border-t border-gray-100">
                      <button type="button" onClick={() => handleQuickPresetDate(0)} className={`flex-1 py-2.5 text-xs font-bold rounded-xl ${theme.lightBgClass} ${theme.textClass} hover:opacity-90 transition shadow-xs cursor-pointer`}>Today</button>
                      <button type="button" onClick={() => handleQuickPresetDate(1)} className={`flex-1 py-2.5 text-xs font-bold rounded-xl ${theme.lightBgClass} ${theme.textClass} hover:opacity-90 transition shadow-xs cursor-pointer`}>Tomorrow</button>
                      <button type="button" onClick={() => handleQuickPresetDate(7)} className={`flex-1 py-2.5 text-xs font-bold rounded-xl ${theme.lightBgClass} ${theme.textClass} hover:opacity-90 transition shadow-xs cursor-pointer`}>Next Week</button>
                    </div>
                  </div>
                )}

                {/* Full-Width Time Picker Expanded View */}
                {openTimeAccordion && (
                  <div ref={timeAccordionRef} className="bg-white rounded-3xl p-4 md:p-5 shadow-lg border border-gray-200 animate-in fade-in zoom-in duration-150 space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Presets</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {[
                        { label: '8:00 AM (Morning)', val: '08:00' },
                        { label: '12:00 PM (Noon)', val: '12:00' },
                        { label: '3:30 PM (After School)', val: '15:30' },
                        { label: '5:00 PM (Evening)', val: '17:00' },
                        { label: '8:00 PM (Night)', val: '20:00' },
                        { label: '11:59 PM (End Day)', val: '23:59' },
                      ].map(t => (
                        <button
                          key={t.val}
                          type="button"
                          onClick={() => {
                            setDueTime(t.val);
                            setIsCustomTime(false);
                            setOpenTimeAccordion(false);
                          }}
                          className={`p-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer ${
                            !isCustomTime && dueTime === t.val ? `${theme.bgClass} text-white shadow-sm font-extrabold ring-2 ${theme.ringClass}` : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {/* Custom Time Option */}
                    <div className="pt-2.5 border-t border-gray-100">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Custom Time</h4>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={customTimeVal}
                          onChange={(e) => {
                            setCustomTimeVal(e.target.value);
                            setIsCustomTime(true);
                          }}
                          className={`flex-1 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:${theme.ringClass}`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setDueTime(customTimeVal);
                            setIsCustomTime(true);
                            setOpenTimeAccordion(false);
                          }}
                          className={`${theme.bgClass} text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition cursor-pointer`}
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Push Notification Button */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider">Push Notification</label>
                  <span className={`text-[10px] font-bold ${theme.textClass}`}>Optional</span>
                </div>
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenNotifyAccordion(!openNotifyAccordion);
                      setOpenDateAccordion(false);
                      setOpenTimeAccordion(false);
                    }}
                    className={`w-full px-5 py-3.5 rounded-2xl border transition flex items-center justify-between text-left shadow-sm ${
                      openNotifyAccordion ? `${theme.borderClass} bg-white ring-2 ${theme.ringClass}` : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl ${theme.lightBgClass} ${theme.textClass} flex items-center justify-center font-bold shrink-0`}>
                        <Bell size={18} />
                      </div>
                      <span className="text-sm font-bold text-gray-800">
                        {notificationTime ? formatTime24to12(notificationTime) : 'Select A Time'}
                      </span>
                    </div>
                    <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${openNotifyAccordion ? `rotate-180 ${theme.textClass}` : ''}`} />
                  </button>

                  {/* Inline Expandable Notification Options */}
                  {openNotifyAccordion && (
                    <div ref={notifyAccordionRef} className="mt-2 bg-white rounded-3xl p-4 md:p-5 shadow-xl border border-gray-200 animate-in fade-in zoom-in duration-150 space-y-3 mb-2">
                      {!notificationsEnabled ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center space-y-2.5">
                          <div className="flex items-center justify-center gap-2 text-amber-900 font-bold text-xs">
                            <Bell size={16} className="text-amber-600" />
                            <span>Push Notifications Disabled in Settings</span>
                          </div>
                          <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                            To schedule task & reminder alerts, push notifications must be enabled in your Settings.
                          </p>
                          <button
                            type="button"
                            onClick={() => toggleSetting('notifications')}
                            className={`${theme.bgClass} text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-90 transition cursor-pointer`}
                          >
                            Enable in Settings
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {[
                              { label: 'No Notification', val: '' },
                              { label: 'Morning of (8:00 AM)', val: '08:00' },
                              { label: 'Evening before (6:00 PM)', val: '18:00' },
                              { label: '1 Hour Before Due', val: '16:00' },
                            ].map(t => (
                              <button
                                key={t.label}
                                type="button"
                                onClick={() => {
                                  setNotificationTime(t.val);
                                  setOpenNotifyAccordion(false);
                                }}
                                className={`p-3 rounded-2xl text-xs font-bold text-left transition flex items-center justify-between cursor-pointer ${
                                  notificationTime === t.val ? `${theme.bgClass} text-white shadow-sm font-extrabold ring-2 ${theme.ringClass}` : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'
                                }`}
                              >
                                <span>{t.label}</span>
                                {notificationTime === t.val && <Check size={16} />}
                              </button>
                            ))}
                          </div>

                          {/* Custom Notification Time Option */}
                          <div className="pt-2.5 border-t border-gray-100">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Custom Notification Time</h4>
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                value={customNotifyVal}
                                onChange={(e) => setCustomNotifyVal(e.target.value)}
                                className={`flex-1 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:${theme.ringClass}`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setNotificationTime(customNotifyVal);
                                  setOpenNotifyAccordion(false);
                                }}
                                className={`${theme.bgClass} text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition cursor-pointer`}
                              >
                                Set
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Prominent Large Done Button */}
            <div className="pt-6 pb-4">
              <button
                type="submit"
                className={`w-full ${theme.bgClass} text-white font-extrabold h-14 rounded-2xl hover:opacity-95 transition-all shadow-xl text-base flex items-center justify-center gap-2 transform active:scale-[0.99]`}
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
