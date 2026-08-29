import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronRight, ChevronDown, ChevronLeft, BookOpen, Clock, Calendar, Bell, Check, Edit3, Award, FileText, FlaskConical, FolderKanban, MessageSquare } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getTheme } from '../utils/themeConfig';

export const ASSIGNMENT_TYPES = [
  { id: 'homework', label: 'Homework', icon: <Edit3 size={18} />, color: 'bg-amber-500' },
  { id: 'test', label: 'Quiz / Test', icon: <Award size={18} />, color: 'bg-purple-500' },
  { id: 'study', label: 'Study', icon: <BookOpen size={18} />, color: 'bg-emerald-500' },
  { id: 'reading', label: 'Reading', icon: <BookOpen size={18} />, color: 'bg-emerald-500' },
  { id: 'project', label: 'Project', icon: <FolderKanban size={18} />, color: 'bg-cyan-500' },
  { id: 'essay', label: 'Essay', icon: <FileText size={18} />, color: 'bg-cyan-500' },
  { id: 'lab', label: 'Lab', icon: <FlaskConical size={18} />, color: 'bg-indigo-500' },
  { id: 'other', label: 'Other', icon: <MessageSquare size={18} />, color: 'bg-amber-500' },
];

export const WEEK_DAYS = [
  { id: 'mon', letter: 'M', name: 'Monday' },
  { id: 'tue', letter: 'T', name: 'Tuesday' },
  { id: 'wed', letter: 'W', name: 'Wednesday' },
  { id: 'thu', letter: 'T', name: 'Thursday' },
  { id: 'fri', letter: 'F', name: 'Friday' },
  { id: 'sat', letter: 'S', name: 'Saturday' },
  { id: 'sun', letter: 'S', name: 'Sunday' },
];

export const REPEAT_NOTIFICATION_OPTIONS = [
  { id: 'weekly', label: 'Weekly', desc: 'Every week on selected days' },
  { id: 'none', label: 'This Week Only', desc: 'Alerts on selected days this week' },
];

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function CustomThemedTimePicker({ value, onChange, theme, isDark }) {
  const parseVal = (v) => {
    if (!v) return { hour12: 6, minute: '00', ampm: 'PM' };
    const [hStr, mStr] = v.split(':');
    let h = parseInt(hStr, 10);
    if (isNaN(h)) h = 18;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    const minute = mStr || '00';
    return { hour12, minute, ampm };
  };

  const { hour12, minute, ampm } = parseVal(value || '18:00');

  const updateTime = (h12, min, ap) => {
    let h24 = (parseInt(h12, 10) % 12);
    if (ap === 'PM') h24 += 12;
    const hStr = String(h24).padStart(2, '0');
    const mStr = String(min).padStart(2, '0');
    onChange(`${hStr}:${mStr}`);
  };

  const presets = [
    { label: '8:00 AM', desc: 'Morning', h12: 8, min: '00', ap: 'AM' },
    { label: '3:00 PM', desc: 'After School', h12: 3, min: '00', ap: 'PM' },
    { label: '6:00 PM', desc: 'Evening', h12: 6, min: '00', ap: 'PM' },
    { label: '9:00 PM', desc: 'Night', h12: 9, min: '00', ap: 'PM' },
  ];

  return (
    <div className="space-y-4">
      {/* Current Selection & AM/PM Toggle Header */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
        isDark ? 'bg-slate-900 border-slate-700/80' : `${theme.lightBgClass} ${theme.borderClass}`
      }`}>
        <div>
          <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Alert Time
          </span>
          <span className={`text-2xl font-black tracking-tight ${isDark ? 'text-emerald-400' : theme.textClass}`}>
            {hour12}:{minute} <span className="text-base font-bold opacity-80">{ampm}</span>
          </span>
        </div>

        {/* AM / PM Segmented Toggle */}
        <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-200/70 border-gray-300/60'}`}>
          {['AM', 'PM'].map(ap => (
            <button
              key={ap}
              type="button"
              onClick={() => updateTime(hour12, minute, ap)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                ampm === ap
                  ? isDark
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : `${theme.bgClass} text-white shadow-sm`
                  : isDark
                    ? 'text-slate-400 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {ap}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Preset Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {presets.map(p => {
          const isActive = hour12 === p.h12 && minute === p.min && ampm === p.ap;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => updateTime(p.h12, p.min, p.ap)}
              className={`px-2.5 py-2 rounded-xl text-left border transition cursor-pointer ${
                isActive
                  ? isDark
                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500'
                    : `${theme.lightBgClass} ${theme.borderClass} ${theme.textClass} ring-1 ring-emerald-500 font-bold`
                  : isDark
                    ? 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xs font-bold block truncate">{p.label}</span>
              <span className={`text-[10px] block truncate ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>{p.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Sliders Container */}
      <div className={`p-4 rounded-2xl border space-y-4 ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-gray-50 border-gray-200'
      }`}>
        {/* Hour Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>Hour</span>
            <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-black ${
              isDark ? 'bg-slate-800 text-emerald-400' : `${theme.lightBgClass} ${theme.textClass}`
            }`}>
              {hour12}
            </span>
          </div>
          <div className="relative py-1">
            <input
              type="range"
              min="1"
              max="12"
              step="1"
              value={hour12}
              onChange={(e) => updateTime(parseInt(e.target.value, 10), minute, ampm)}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-700/40 rounded-lg block"
            />
          </div>
          <div className="relative w-full h-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => {
              const showLabel = [1, 3, 6, 9, 12].includes(h);
              const isSelected = hour12 === h;
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => updateTime(h, minute, ampm)}
                  style={{ left: `calc(8px + (100% - 16px) * ${(h - 1) / 11})` }}
                  className={`absolute -translate-x-1/2 flex flex-col items-center cursor-pointer transition-colors ${
                    isSelected
                      ? isDark ? 'text-emerald-400 font-black' : `${theme.textClass} font-black`
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <span className={`w-1 h-1 rounded-full mb-0.5 ${isSelected ? 'bg-emerald-400' : 'bg-slate-600/60'}`} />
                  {showLabel && (
                    <span className="text-[10px] font-mono leading-none">
                      {h}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Minute Slider */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className={isDark ? 'text-slate-300' : 'text-gray-700'}>Minute</span>
            <span className={`px-2 py-0.5 rounded-md font-mono text-xs font-black ${
              isDark ? 'bg-slate-800 text-emerald-400' : `${theme.lightBgClass} ${theme.textClass}`
            }`}>
              :{minute}
            </span>
          </div>
          <div className="relative py-1">
            <input
              type="range"
              min="0"
              max="55"
              step="5"
              value={parseInt(minute, 10) || 0}
              onChange={(e) => updateTime(hour12, String(e.target.value).padStart(2, '0'), ampm)}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-700/40 rounded-lg block"
            />
          </div>
          <div className="relative w-full h-4">
            {[
              { val: 0, label: ':00', show: true },
              { val: 5, label: ':05', show: false },
              { val: 10, label: ':10', show: false },
              { val: 15, label: ':15', show: true },
              { val: 20, label: ':20', show: false },
              { val: 25, label: ':25', show: false },
              { val: 30, label: ':30', show: true },
              { val: 35, label: ':35', show: false },
              { val: 40, label: ':40', show: false },
              { val: 45, label: ':45', show: true },
              { val: 50, label: ':50', show: false },
              { val: 55, label: ':55', show: true },
            ].map(m => {
              const isSelected = (parseInt(minute, 10) || 0) === m.val;
              return (
                <button
                  key={m.label}
                  type="button"
                  onClick={() => updateTime(hour12, String(m.val).padStart(2, '0'), ampm)}
                  style={{ left: `calc(8px + (100% - 16px) * ${m.val / 55})` }}
                  className={`absolute -translate-x-1/2 flex flex-col items-center cursor-pointer transition-colors ${
                    isSelected
                      ? isDark ? 'text-emerald-400 font-black' : `${theme.textClass} font-black`
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <span className={`w-1 h-1 rounded-full mb-0.5 ${isSelected ? 'bg-emerald-400' : 'bg-slate-600/60'}`} />
                  {m.show && (
                    <span className="text-[10px] font-mono leading-none">
                      {m.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeekDaySelector({ selectedDays, onToggleDay, isRepeating, onToggleRepeat, theme, isDark }) {
  return (
    <div className="space-y-3 pt-3 border-t border-slate-700/60 dark:border-slate-700">
      {/* Week Day Pills */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            Alert Days (This Week)
          </label>
          <span className="text-[11px] text-gray-400 font-medium">
            {selectedDays.length === 7
              ? 'Every day'
              : selectedDays.length === 5 && !selectedDays.includes('sun') && !selectedDays.includes('sat')
              ? 'Weekdays'
              : `${selectedDays.length} day${selectedDays.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* 7 single-letter day pills going from left to right */}
        <div className="grid grid-cols-7 gap-1.5">
          {WEEK_DAYS.map(day => {
            const isSelected = selectedDays.includes(day.id);
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => onToggleDay(day.id)}
                title={day.name}
                className={`h-11 rounded-2xl flex flex-col items-center justify-center font-black text-sm transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400'
                      : `${theme.bgClass} text-white shadow-md ring-1 ${theme.ringClass}`
                    : isDark
                      ? 'bg-slate-800 text-slate-400 hover:bg-slate-750 hover:text-white border border-slate-700/80'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                <span className="leading-none">{day.letter}</span>
                <span className="text-[8px] font-bold uppercase leading-tight mt-0.5 opacity-60">{day.id}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Repeat Every Week Switch */}
      <div className="pt-2 flex items-center justify-between">
        <div>
          <span className={`text-xs font-bold block ${isDark ? 'text-slate-200' : 'text-gray-800'}`}>
            Repeat Every Week
          </span>
          <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {isRepeating ? 'Alerts repeat on selected days each week' : 'Alerts on selected days for this week only'}
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isRepeating}
          onClick={onToggleRepeat}
          className={`w-12 h-7 rounded-full p-1 transition-all duration-200 outline-none border cursor-pointer relative shrink-0 ${
            isRepeating
              ? (isDark || theme.id === 'midnight'
                  ? 'bg-emerald-500 border-emerald-400 shadow-sm'
                  : `${theme.bgClass} border-transparent shadow-sm`)
              : (isDark
                  ? 'bg-slate-800 border-slate-700/80'
                  : 'bg-gray-200 border-gray-300')
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
              isRepeating ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export default function TaskAdderModal({ onClose, initialTask = null }) {
  const { hacData, addPlannerTask, updatePlannerTask, activeTheme, localOverrides, toggleSetting } = useStore();
  const theme = getTheme(activeTheme);
  const notificationsEnabled = localOverrides?.settings?.notifications !== false;
  const classes = hacData?.classes || [];

  const [mode, setMode] = useState(() => {
    if (initialTask?.mode) return initialTask.mode;
    if (initialTask?.type?.toLowerCase() === 'reminder' || initialTask?.typeId === 'reminder') return 'reminder';
    return 'task';
  });

  const [name, setName] = useState(initialTask?.name || initialTask?.title || '');
  const [selectedCourse, setSelectedCourse] = useState(() => {
    if (!initialTask) return null;
    return classes.find(c => c.name === initialTask.course || c.id === initialTask.courseId) || (initialTask.course ? { name: initialTask.course, id: initialTask.courseId } : null);
  });
  const [selectedType, setSelectedType] = useState(() => {
    if (!initialTask) return ASSIGNMENT_TYPES[0];
    return ASSIGNMENT_TYPES.find(t => t.id === initialTask.typeId || t.label.toLowerCase() === (initialTask.type || '').toLowerCase()) || ASSIGNMENT_TYPES[0];
  });
  
  // Date State
  const [dueDateObj, setDueDateObj] = useState(() => {
    if (!initialTask?.dueDate && !initialTask?.date) return null;
    const dStr = initialTask.dueDate || initialTask.date;
    const [y, m, d] = dStr.split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
    const parsed = new Date(dStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  });
  const [openDateAccordion, setOpenDateAccordion] = useState(false);
  const today = new Date();
  const [viewYear, setViewYear] = useState(() => (dueDateObj ? dueDateObj.getFullYear() : today.getFullYear()));
  const [viewMonth, setViewMonth] = useState(() => (dueDateObj ? dueDateObj.getMonth() : today.getMonth()));

  // Time State
  const [dueTime, setDueTime] = useState(initialTask?.dueTime || initialTask?.time || '');
  const [openTimeAccordion, setOpenTimeAccordion] = useState(false);

  // Notification State
  const [notificationTime, setNotificationTime] = useState(initialTask?.notificationTime || (initialTask?.typeId === 'reminder' ? '18:00' : ''));
  const [notificationRepeat, setNotificationRepeat] = useState(
    initialTask?.notificationRepeat || initialTask?.repeat || 'none'
  );
  const [isRepeating, setIsRepeating] = useState(
    !!(initialTask?.notificationRepeat && initialTask.notificationRepeat !== 'none') ||
    !!(initialTask?.repeat && initialTask.repeat !== 'none') ||
    !!initialTask?.isRepeating
  );
  const [selectedDays, setSelectedDays] = useState(() => {
    if (initialTask?.selectedDays && Array.isArray(initialTask.selectedDays) && initialTask.selectedDays.length > 0) {
      return initialTask.selectedDays;
    }
    const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDayId = dayMap[new Date().getDay()] || 'mon';
    return [currentDayId];
  });
  const [openNotifyAccordion, setOpenNotifyAccordion] = useState(false);

  const toggleDay = (dayId) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter(d => d !== dayId));
      }
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

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

    const isReminderMode = mode === 'reminder';
    const activeNotifyTime = isReminderMode ? (notificationTime || '18:00') : notificationTime;

    if (activeNotifyTime) {
      handleRequestNotificationPermission();
    }

    const finalRepeat = isRepeating ? 'weekly' : 'none';

    const payload = {
      name: name.trim(),
      mode,
      course: selectedCourse ? selectedCourse.name : null,
      courseId: selectedCourse ? selectedCourse.id : null,
      type: isReminderMode ? 'Reminder' : (selectedType ? selectedType.label : 'Homework'),
      typeId: isReminderMode ? 'reminder' : (selectedType ? selectedType.id : 'homework'),
      dueDate: isReminderMode ? (dateValueYMD || new Date().toISOString().split('T')[0]) : dateValueYMD,
      dueTime: isReminderMode ? (dueTime || activeNotifyTime) : dueTime,
      notificationTime: activeNotifyTime,
      notificationRepeat: finalRepeat,
      repeat: finalRepeat,
      isRepeating,
      selectedDays,
      createdAt: new Date().toISOString(),
    };

    if (initialTask?.id) {
      updatePlannerTask(initialTask.id, payload);
    } else {
      addPlannerTask(payload);
    }

    onClose();
  };

  // Calendar math
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const isDark = !!theme.isDark;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`${
          isDark ? 'bg-[#0f172a] text-white border-slate-800' : 'bg-white text-gray-900 border-gray-100'
        } rounded-3xl w-full max-w-xl md:max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 border flex flex-col my-auto max-h-[92vh] overflow-hidden`}
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
          
          {/* Center Title - Perfectly Centered */}
          <div className="flex-1 text-center">
            <h2 className="text-xl font-extrabold tracking-tight">
              {pickerView === 'course' ? 'Select Course' :
               pickerView === 'type' ? 'Select Type' :
               initialTask ? (mode === 'reminder' ? 'Edit Reminder' : 'Edit Task') : (mode === 'reminder' ? 'New Reminder' : 'New Item')}
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
          <div className={`p-5 md:p-6 overflow-y-auto space-y-3 flex-1 ${isDark ? 'bg-[#0b1120]' : 'bg-gray-50/50'}`}>
            <div className={`${isDark ? 'bg-slate-800/80 text-slate-300' : 'bg-gray-100 text-gray-600'} py-2.5 px-4 rounded-xl text-center`}>
              <span className="text-xs font-extrabold uppercase tracking-wider">Choose Course</span>
            </div>

            {classes.map(cls => {
              const isSel = selectedCourse?.id === cls.id;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => { setSelectedCourse(cls); setPickerView('main'); }}
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

        {/* ── Sub-View 2: Select Assignment Type Drawer (Gradeway UI Clone) ── */}
        {pickerView === 'type' && (
          <div className={`p-5 md:p-6 overflow-y-auto space-y-2.5 flex-1 ${isDark ? 'bg-[#0b1120]' : 'bg-gray-50/50'}`}>
            {ASSIGNMENT_TYPES.map(t => {
              const isSel = selectedType.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { setSelectedType(t); setPickerView('main'); }}
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

        {/* ── Main Form View ── */}
        {pickerView === 'main' && (
          <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-6">

              {/* Segmented Top Control (Assignment vs Reminder) */}
              <div className={`flex p-1.5 rounded-2xl border ${
                isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-gray-100/80 border-gray-200/60'
              }`}>
                <button
                  type="button"
                  onClick={() => setMode('task')}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
                    mode === 'task'
                      ? isDark
                        ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-700'
                        : 'bg-white text-gray-900 shadow-sm'
                      : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <BookOpen size={14} />
                  <span>Assignment / Task</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reminder');
                    if (!notificationTime) setNotificationTime('18:00');
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-2 ${
                    mode === 'reminder'
                      ? isDark
                        ? 'bg-slate-800 text-emerald-400 shadow-sm ring-1 ring-emerald-500/50'
                        : `${theme.bgClass} text-white shadow-sm`
                      : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Bell size={14} />
                  <span>Reminder</span>
                </button>
              </div>

              {/* Title Field */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                  {mode === 'reminder' ? 'Reminder Title' : 'Task Title'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={mode === 'reminder' ? 'e.g. Study for Biology exam, Submit permission slip' : 'e.g. Chapter 4 Review, Read pages 40-55, Math Worksheet'}
                  className={`w-full px-5 py-3.5 rounded-2xl border outline-none text-sm font-semibold transition ${
                    isDark
                      ? 'bg-slate-800/60 border-slate-700 text-white placeholder-slate-500 focus:bg-slate-800 focus:ring-2 focus:ring-emerald-500'
                      : `bg-gray-50/70 border-gray-200 text-gray-900 placeholder-gray-400 hover:bg-white focus:bg-white focus:ring-2 focus:${theme.ringClass}`
                  }`}
                />
              </div>

              {/* Course Drawer Selector */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    Course {mode === 'reminder' && <span className="lowercase font-normal opacity-70">(optional)</span>}
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => setPickerView('course')}
                  className={`w-full px-5 py-3.5 rounded-2xl border transition flex items-center justify-between text-left shadow-xs cursor-pointer ${
                    isDark
                      ? 'border-slate-700/80 bg-slate-800/50 hover:bg-slate-800 text-white'
                      : 'border-gray-200/80 bg-gray-50/60 hover:bg-gray-100/80 text-gray-900'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl ${isDark ? 'bg-slate-700 text-emerald-400' : `${theme.bgClass} text-white`} font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs`}>
                      HAC
                    </div>
                    <div className="min-w-0">
                      <span className={`text-sm font-bold block truncate ${!selectedCourse ? (isDark ? 'text-slate-400' : 'text-gray-400') : (isDark ? 'text-white' : 'text-gray-800')}`}>
                        {selectedCourse ? selectedCourse.name : (mode === 'reminder' ? 'General (No course)' : 'Select Course...')}
                      </span>
                      <span className={`text-xs block truncate ${!selectedCourse ? (isDark ? 'text-slate-500' : 'text-gray-400') : (isDark ? 'text-slate-400' : 'text-gray-400')}`}>
                        {selectedCourse ? `${selectedCourse.id} · Period ${selectedCourse.period || '1'}` : 'Assign to an enrolled HAC class'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
                </button>
              </div>

              {/* ── MODE 1: REMINDER (Push notification + Week view is primary & open by default) ── */}
              {mode === 'reminder' ? (
                <div className="space-y-4">
                  <div className={`p-4 md:p-5 rounded-3xl border shadow-lg space-y-4 ${
                    isDark ? 'bg-slate-850 border-slate-700' : 'bg-white border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl ${isDark ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : `${theme.lightBgClass} ${theme.textClass}`} flex items-center justify-center font-bold shrink-0`}>
                          <Bell size={18} />
                        </div>
                        <div>
                          <span className={`text-xs font-bold block ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Reminder Schedule
                          </span>
                          <span className={`text-[11px] block mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                            {isRepeating
                              ? `Repeats weekly on ${selectedDays.map(d => d.toUpperCase()).join(', ')}`
                              : `Alerts this week on ${selectedDays.map(d => d.toUpperCase()).join(', ')}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <CustomThemedTimePicker
                      value={notificationTime || '18:00'}
                      onChange={(newTime) => setNotificationTime(newTime)}
                      theme={theme}
                      isDark={isDark}
                    />

                    <WeekDaySelector
                      selectedDays={selectedDays}
                      onToggleDay={toggleDay}
                      isRepeating={isRepeating}
                      onToggleRepeat={() => setIsRepeating(!isRepeating)}
                      theme={theme}
                      isDark={isDark}
                    />
                  </div>
                </div>
              ) : (
                /* ── MODE 2: ASSIGNMENT / TASK ── */
                <>
                  {/* Assignment Type Drawer Selector */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Type</label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPickerView('type')}
                      className={`w-full px-5 py-3.5 rounded-2xl border transition flex items-center justify-between text-left shadow-xs cursor-pointer ${
                        isDark
                          ? 'border-slate-700/80 bg-slate-800/50 hover:bg-slate-800 text-white'
                          : 'border-gray-200/80 bg-gray-50/60 hover:bg-gray-100/80 text-gray-900'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl ${isDark ? 'bg-slate-700 text-emerald-400' : `${theme.bgClass} text-white`} flex items-center justify-center font-bold shadow-xs shrink-0`}>
                          {selectedType.icon}
                        </div>
                        <div className="min-w-0">
                          <span className={`text-sm font-bold block truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedType.label}</span>
                          <span className={`text-xs block truncate ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>{selectedType.desc}</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className={isDark ? 'text-slate-500' : 'text-gray-400'} />
                    </button>
                  </div>

                  {/* Date & Time Field Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Date Button & Calendar Dropdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Due Date</label>
                      </div>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenDateAccordion(!openDateAccordion);
                            setOpenTimeAccordion(false);
                            setOpenNotifyAccordion(false);
                          }}
                          className={`w-full px-5 py-3.5 rounded-2xl border transition flex items-center justify-between text-left shadow-xs cursor-pointer ${
                            openDateAccordion
                              ? isDark
                                ? 'border-emerald-500 bg-slate-800 ring-2 ring-emerald-500'
                                : `${theme.borderClass} bg-white ring-2 ${theme.ringClass}`
                              : isDark
                                ? 'border-slate-700/80 bg-slate-800/50 hover:bg-slate-800 text-white'
                                : 'border-gray-200/80 bg-gray-50/60 hover:bg-gray-100/80 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl ${isDark ? 'bg-slate-700 text-emerald-400' : `${theme.lightBgClass} ${theme.textClass}`} flex items-center justify-center font-bold shrink-0`}>
                              <Calendar size={18} />
                            </div>
                            <span className={`text-sm font-bold ${!dueDateObj ? (isDark ? 'text-slate-400' : 'text-gray-400') : (isDark ? 'text-white' : 'text-gray-800')}`}>
                              {formattedDateString}
                            </span>
                          </div>
                          <ChevronDown size={18} className={`transition-transform duration-200 ${isDark ? 'text-slate-400' : 'text-gray-400'} ${openDateAccordion ? `rotate-180 ${isDark ? 'text-emerald-400' : theme.textClass}` : ''}`} />
                        </button>

                        {/* Calendar Dropdown */}
                        {openDateAccordion && (
                          <div ref={dateAccordionRef} className={`mt-2 ${isDark ? 'bg-slate-850 border-slate-700 text-white' : 'bg-white border-gray-200'} rounded-3xl p-4 md:p-5 shadow-lg border animate-in fade-in zoom-in duration-150 space-y-4`}>
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => {
                                  if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
                                  else { setViewMonth(viewMonth - 1); }
                                }}
                                className={`p-1.5 rounded-xl ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-gray-100 text-gray-600'} shadow-sm cursor-pointer`}
                              >
                                <ChevronLeft size={18} />
                              </button>

                              <span className={`font-extrabold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                {MONTH_NAMES[viewMonth]} {viewYear}
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
                                  else { setViewMonth(viewMonth + 1); }
                                }}
                                className={`p-1.5 rounded-xl ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-white hover:bg-gray-100 text-gray-600'} shadow-sm cursor-pointer`}
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
                                      isSel
                                        ? isDark
                                          ? 'bg-emerald-600 text-white shadow-md font-extrabold ring-2 ring-emerald-400 scale-105'
                                          : `${theme.bgClass} text-white shadow-md font-extrabold ring-2 ${theme.ringClass} scale-105`
                                        : isDark
                                          ? 'text-slate-200 hover:bg-slate-700 bg-slate-800/40'
                                          : 'text-gray-700 hover:bg-gray-100 bg-gray-50/50'
                                    }`}
                                  >
                                    {dayNum}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Quick Presets */}
                            <div className={`flex gap-2 pt-3 pb-1 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
                              <button type="button" onClick={() => handleQuickPresetDate(0)} className={`flex-1 py-2.5 text-xs font-bold rounded-xl ${isDark ? 'bg-slate-800 text-emerald-400 hover:bg-slate-750' : `${theme.lightBgClass} ${theme.textClass} hover:opacity-90`} transition shadow-xs cursor-pointer`}>Today</button>
                              <button type="button" onClick={() => handleQuickPresetDate(1)} className={`flex-1 py-2.5 text-xs font-bold rounded-xl ${isDark ? 'bg-slate-800 text-emerald-400 hover:bg-slate-750' : `${theme.lightBgClass} ${theme.textClass} hover:opacity-90`} transition shadow-xs cursor-pointer`}>Tomorrow</button>
                              <button type="button" onClick={() => handleQuickPresetDate(7)} className={`flex-1 py-2.5 text-xs font-bold rounded-xl ${isDark ? 'bg-slate-800 text-emerald-400 hover:bg-slate-750' : `${theme.lightBgClass} ${theme.textClass} hover:opacity-90`} transition shadow-xs cursor-pointer`}>Next Week</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Time Button & Time Dropdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Due Time</label>
                      </div>
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenTimeAccordion(!openTimeAccordion);
                            setOpenDateAccordion(false);
                            setOpenNotifyAccordion(false);
                          }}
                          className={`w-full px-5 py-3.5 rounded-2xl border transition flex items-center justify-between text-left shadow-xs cursor-pointer ${
                            openTimeAccordion
                              ? isDark
                                ? 'border-emerald-500 bg-slate-800 ring-2 ring-emerald-500'
                                : `${theme.borderClass} bg-white ring-2 ${theme.ringClass}`
                              : isDark
                                ? 'border-slate-700/80 bg-slate-800/50 hover:bg-slate-800 text-white'
                                : 'border-gray-200/80 bg-gray-50/60 hover:bg-gray-100/80 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl ${isDark ? 'bg-slate-700 text-emerald-400' : `${theme.lightBgClass} ${theme.textClass}`} flex items-center justify-center font-bold shrink-0`}>
                              <Clock size={18} />
                            </div>
                            <span className={`text-sm font-bold ${!dueTime ? (isDark ? 'text-slate-400' : 'text-gray-400') : (isDark ? 'text-white' : 'text-gray-800')}`}>
                              {formatTime24to12(dueTime)}
                            </span>
                          </div>
                          <ChevronDown size={18} className={`transition-transform duration-200 ${isDark ? 'text-slate-400' : 'text-gray-400'} ${openTimeAccordion ? `rotate-180 ${isDark ? 'text-emerald-400' : theme.textClass}` : ''}`} />
                        </button>

                        {/* Custom Themed Time Picker Accordion */}
                        {openTimeAccordion && (
                          <div ref={timeAccordionRef} className={`${isDark ? 'bg-slate-850 border-slate-700 text-white' : 'bg-white border-gray-200'} rounded-3xl p-4 md:p-5 shadow-lg border animate-in fade-in zoom-in duration-150 space-y-4`}>
                            <CustomThemedTimePicker
                              value={dueTime || '17:00'}
                              onChange={(newTime) => setDueTime(newTime)}
                              theme={theme}
                              isDark={isDark}
                            />
                            <div className="flex justify-between items-center pt-2 border-t border-slate-700/60 dark:border-slate-700">
                              <button
                                type="button"
                                onClick={() => { setDueTime(''); setOpenTimeAccordion(false); }}
                                className="text-xs font-bold text-red-500 hover:text-red-400 transition cursor-pointer"
                              >
                                Clear Time
                              </button>
                              <button
                                type="button"
                                onClick={() => setOpenTimeAccordion(false)}
                                className={`${isDark ? 'bg-emerald-600' : theme.bgClass} text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition cursor-pointer`}
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Push Notification Section for Tasks */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Push Notification</label>
                    </div>
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenNotifyAccordion(!openNotifyAccordion);
                          setOpenDateAccordion(false);
                          setOpenTimeAccordion(false);
                        }}
                        className={`w-full px-5 py-3.5 rounded-2xl border transition flex items-center justify-between text-left shadow-xs cursor-pointer ${
                          openNotifyAccordion
                            ? isDark
                              ? 'border-emerald-500 bg-slate-800 ring-2 ring-emerald-500'
                              : `${theme.borderClass} bg-white ring-2 ${theme.ringClass}`
                            : isDark
                              ? 'border-slate-700/80 bg-slate-800/50 hover:bg-slate-800 text-white'
                              : 'border-gray-200/80 bg-gray-50/60 hover:bg-gray-100/80 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl ${isDark ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60' : `${theme.lightBgClass} ${theme.textClass}`} flex items-center justify-center font-bold shrink-0`}>
                            <Bell size={18} />
                          </div>
                          <span className={`text-sm font-bold ${!notificationTime ? (isDark ? 'text-slate-400' : 'text-gray-400') : (isDark ? 'text-white' : 'text-gray-800')}`}>
                            {notificationTime
                              ? `${formatTime24to12(notificationTime)} · ${isRepeating ? `Repeats (${selectedDays.map(d => d.toUpperCase()).join(', ')})` : `This Week (${selectedDays.map(d => d.toUpperCase()).join(', ')})`}`
                              : 'Select A Time'}
                          </span>
                        </div>
                        <ChevronDown size={18} className={`transition-transform duration-200 ${isDark ? 'text-slate-400' : 'text-gray-400'} ${openNotifyAccordion ? `rotate-180 ${isDark ? 'text-emerald-400' : theme.textClass}` : ''}`} />
                      </button>

                      {/* Push Notification Custom Time Picker Accordion */}
                      {openNotifyAccordion && (
                        <div ref={notifyAccordionRef} className={`mt-2 ${isDark ? 'bg-slate-850 border-slate-700 text-white' : 'bg-white border-gray-200'} rounded-3xl p-4 md:p-5 shadow-xl border animate-in fade-in zoom-in duration-150 space-y-4 mb-2`}>
                          {!notificationsEnabled ? (
                            <div className={`${isDark ? 'bg-amber-950/40 border-amber-800/70 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'} border rounded-2xl p-4 text-center space-y-2.5`}>
                              <div className="flex items-center justify-center gap-2 font-bold text-xs">
                                <Bell size={16} className="text-amber-500" />
                                <span>Push Notifications Disabled in Settings</span>
                              </div>
                              <p className={`text-[11px] font-medium leading-relaxed ${isDark ? 'text-amber-300/80' : 'text-amber-700'}`}>
                                To schedule task alerts, push notifications must be enabled in your Settings.
                              </p>
                              <button
                                type="button"
                                onClick={() => toggleSetting('notifications')}
                                className={`${isDark ? 'bg-amber-600' : theme.bgClass} text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:opacity-90 transition cursor-pointer`}
                              >
                                Enable in Settings
                              </button>
                            </div>
                          ) : (
                            <>
                              <CustomThemedTimePicker
                                value={notificationTime || '18:00'}
                                onChange={(newTime) => setNotificationTime(newTime)}
                                theme={theme}
                                isDark={isDark}
                              />

                              <WeekDaySelector
                                selectedDays={selectedDays}
                                onToggleDay={toggleDay}
                                isRepeating={isRepeating}
                                onToggleRepeat={() => setIsRepeating(!isRepeating)}
                                theme={theme}
                                isDark={isDark}
                              />

                              <div className="flex justify-between items-center pt-2 border-t border-slate-700/60 dark:border-slate-700">
                                <button
                                  type="button"
                                  onClick={() => { setNotificationTime(''); setOpenNotifyAccordion(false); }}
                                  className="text-xs font-bold text-red-500 hover:text-red-400 transition cursor-pointer"
                                >
                                  No Notification
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setOpenNotifyAccordion(false)}
                                  className={`${isDark ? 'bg-emerald-600' : theme.bgClass} text-white px-5 py-2 rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition cursor-pointer`}
                                >
                                  Done
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

            </div>
          </form>
        )}

      </div>
    </div>
  );
}
