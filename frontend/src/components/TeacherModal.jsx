import React from 'react';
import { X, Mail, MapPin, BookOpen } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getTheme } from '../utils/themeConfig';

export default function TeacherModal({ classes, onClose }) {
  const activeThemeId = useStore(state => state.activeTheme);
  const theme = getTheme(activeThemeId);

  // Deduplicate teachers
  const teachers = [];
  const seen = new Set();
  (classes || []).forEach(cls => {
    if (cls.teacher && !seen.has(cls.teacher)) {
      seen.add(cls.teacher);
      // Generate mailto from teacher name (e.g. "Vudayagiri, Madhavi" → madhavi_vudayagiri@roundrockisd.org)
      const parts = cls.teacher.split(',').map(s => s.trim().toLowerCase());
      const email = parts.length > 1 ? `${parts[1]}_${parts[0]}@roundrockisd.org` : `${parts[0]}@roundrockisd.org`;
      teachers.push({
        name: cls.teacher,
        course: cls.name,
        room: cls.room,
        email,
      });
    }
  });

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div onClick={e => e.stopPropagation()} className={`${theme.cardBg} rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border ${theme.cardBorder} animate-in fade-in zoom-in duration-200`}>
        <div className={`px-6 pt-6 pb-4 ${theme.bgClass} text-white flex justify-between items-center`}>
          <div>
            <h2 className="text-2xl font-bold">Contact Teachers</h2>
            <p className="text-xs opacity-90 mt-0.5">Teacher Directory & Email Links</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition text-white">
            <X size={20} />
          </button>
        </div>

        <div className={`p-6 max-h-[70vh] overflow-y-auto divide-y ${theme.divideColor}`}>
          {teachers.map((teacher, idx) => (
            <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
              <div className="flex-1 pr-3">
                <h3 className={`font-bold ${theme.textPrimary} text-base`}>{teacher.name}</h3>
                <p className={`text-xs ${theme.textSecondary} flex items-center gap-1.5 mt-0.5`}>
                  <BookOpen size={12} className={theme.textClass} /> {teacher.course} · Room {teacher.room}
                </p>
              </div>
              <a
                href={`mailto:${teacher.email}`}
                className={`flex items-center gap-2 ${theme.lightBgClass} ${theme.textClass} hover:${theme.bgClass} hover:text-white transition px-4 py-2 rounded-xl text-xs font-bold shrink-0`}
              >
                <Mail size={14} /> Email
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
