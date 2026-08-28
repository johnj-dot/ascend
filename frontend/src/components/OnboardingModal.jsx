import React, { useState, useEffect } from 'react';
import { THEMES, getTheme } from '../utils/themeConfig';
import { useStore } from '../store/useStore';
import { Check, Sparkles, ChevronRight, BookOpen, Award, Calendar, Layers, AlertTriangle, RefreshCw, ArrowRight } from 'lucide-react';

function OnboardingThemeSwatch({ themeData, isSelected }) {
  const clipId = `onboarding-clip-${themeData.id}`;
  return (
    <div
      className={`w-13 h-13 rounded-full flex items-center justify-center relative transition-all duration-150 transform group-hover:scale-105 ${
        isSelected ? `ring-3 ${themeData.ringClass} ring-offset-2 ring-offset-white scale-105` : 'border border-black/15'
      }`}
    >
      <svg width="52" height="52" viewBox="0 0 52 52" className="rounded-full overflow-hidden block">
        <defs>
          <clipPath id={clipId}>
            <circle cx="26" cy="26" r="26" />
          </clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          <rect width="52" height="52" fill={themeData.splitBottom} />
          <polygon points="0,0 52,0 0,52" fill={themeData.splitTop} />
        </g>
      </svg>

      {isSelected && (
        <div className={`absolute inset-0 m-auto w-6 h-6 ${themeData.id === 'midnight' ? 'bg-emerald-500' : themeData.bgClass} text-white rounded-full shadow-md flex items-center justify-center pointer-events-none`}>
          <Check size={14} strokeWidth={3.5} />
        </div>
      )}
    </div>
  );
}

export default function OnboardingModal({
  step,
  progress,
  statusText,
  warnings,
  onCompleteTheme,
  onRetry,
  onContinue
}) {
  const activeThemeId = useStore(state => state.activeTheme);
  const setTheme = useStore(state => state.setTheme);
  const [selectedThemeId, setSelectedThemeId] = useState(activeThemeId || 'green');
  const [mode, setMode] = useState(step || 'theme'); // 'theme' | 'progress' | 'warning'

  useEffect(() => {
    if (step) setMode(step);
  }, [step]);

  const currentTheme = getTheme(selectedThemeId);

  const handleSelectTheme = (tId) => {
    setSelectedThemeId(tId);
    setTheme(tId);
  };

  const handleFinishTheme = () => {
    setMode('progress');
    if (onCompleteTheme) onCompleteTheme(selectedThemeId);
  };

  const failedSections = (warnings && warnings.length > 0)
    ? warnings.map(w => w.section || 'Records').filter(Boolean)
    : ['Academic Records'];

  const failedTitle = failedSections.length === 1
    ? `Failed to get ${failedSections[0]}`
    : `Failed to get ${failedSections.join(' & ')}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100 flex flex-col md:flex-row min-h-[500px]">

        {/* ── Mode 1: Theme Selection ── */}
        {mode === 'theme' && (
          <>
            {/* Left Column: Theme Questionnaire */}
            <div className="flex-1 p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-gray-100">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold uppercase tracking-wider mb-4">
                  <Sparkles size={14} className="text-amber-500" /> Account Setup · Step 1
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">
                  Choose Your App Theme
                </h2>
                <p className="text-sm text-gray-500 mt-2">
                  Select a color style for Ascend. You can change this anytime in Settings.
                </p>

                {/* Theme Circles */}
                <div className="mt-8 space-y-4">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Available Color Styles</label>
                  <div className="flex flex-wrap gap-4">
                    {THEMES.map(t => {
                      const isSelected = selectedThemeId === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleSelectTheme(t.id)}
                          className={`relative flex flex-col items-center gap-2 group outline-none cursor-pointer`}
                          title={t.name}
                        >
                          <OnboardingThemeSwatch themeData={t} isSelected={isSelected} />
                          <span className={`text-xs font-bold transition-colors ${
                            isSelected ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {t.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Continue Button */}
              <button
                onClick={handleFinishTheme}
                className={`w-full ${currentTheme.bgClass} text-white font-bold py-4 rounded-2xl transition shadow-lg flex items-center justify-center gap-2 text-base mt-8 hover:opacity-90 cursor-pointer`}
              >
                <span>Continue Setup</span>
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Right Column: Live Sample UI Preview */}
            <div className="w-full md:w-[400px] bg-gray-50 p-6 flex flex-col justify-center items-center relative overflow-hidden border-t md:border-t-0">
              <div className={`w-full max-w-[320px] rounded-2xl shadow-xl overflow-hidden border border-gray-200/80 ${currentTheme.previewBg} transform transition-all duration-300`}>
                <div className={`${currentTheme.bgClass} p-4 text-white`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] opacity-80 uppercase font-semibold">August 23</span>
                    <div className="w-4 h-4 rounded-full bg-white/20" />
                  </div>
                  <h4 className="font-bold text-lg leading-tight">Overview</h4>
                  <p className="text-xs opacity-90">Sample Student UI</p>
                </div>

                <div className="p-4 space-y-3">
                  <div className={`flex items-center justify-between p-2.5 rounded-xl ${currentTheme.cardBg} border border-black/5`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg ${currentTheme.lightBgClass} ${currentTheme.textClass} flex items-center justify-center font-bold text-xs`}>
                        <BookOpen size={14} />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${currentTheme.previewText}`}>AP Comp Sci</p>
                        <p className={`text-[10px] ${currentTheme.previewSubtext}`}>Period 01</p>
                      </div>
                    </div>
                    <span className={`text-xs font-extrabold ${currentTheme.bgClass} text-white px-2 py-0.5 rounded-lg`}>
                      96.5
                    </span>
                  </div>

                  <div className={`flex items-center justify-between p-2.5 rounded-xl ${currentTheme.cardBg} border border-black/5`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg ${currentTheme.lightBgClass} ${currentTheme.textClass} flex items-center justify-center font-bold text-xs`}>
                        <Award size={14} />
                      </div>
                      <div>
                        <p className={`text-xs font-bold ${currentTheme.previewText}`}>TAG English I</p>
                        <p className={`text-[10px] ${currentTheme.previewSubtext}`}>Period 06</p>
                      </div>
                    </div>
                    <span className={`text-xs font-extrabold ${currentTheme.bgClass} text-white px-2 py-0.5 rounded-lg`}>
                      88.3
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4">Live Theme Preview</p>
            </div>
          </>
        )}

        {/* ── Mode 2: Progress Bar ── */}
        {mode === 'progress' && (
          <div className="w-full flex-1 p-12 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-6 animate-bounce">
              <Layers size={32} />
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Syncing Your Account</h2>
            <p className="text-sm text-gray-500 max-w-sm mb-8">
              Fetching complete academic profile, grades, assignments, and attendance from Home Access Center.
            </p>

            {/* 60% Width Progress Bar Container */}
            <div className="w-full max-w-[60%] bg-gray-100 rounded-full h-4 overflow-hidden p-0.5 shadow-inner border border-gray-200 mb-4">
              <div
                className={`h-full rounded-full ${currentTheme.bgClass} transition-all duration-500 ease-out shadow-sm`}
                style={{ width: `${Math.max(10, Math.min(100, progress || 25))}%` }}
              />
            </div>

            {/* Live Action Status Text */}
            <p className="text-sm font-bold text-gray-700 animate-pulse">
              {statusText || 'Logging into Home Access Center...'}
            </p>
          </div>
        )}

        {/* ── Mode 3: Warning / Partial Sync View (Same Full Modal Size) ── */}
        {mode === 'warning' && (
          <div className="w-full flex-1 p-8 md:p-12 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mb-5 shadow-sm">
              <AlertTriangle size={32} />
            </div>

            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
              {failedTitle}
            </h2>
            <p className="text-sm text-gray-500 max-w-md mb-6">
              Home Access Center did not return complete records for the sections below. Your previously saved data has been kept safe.
            </p>

            {/* Missing Sections List */}
            <div className="w-full max-w-md space-y-2.5 mb-8 text-left">
              {(warnings && warnings.length > 0 ? warnings : [
                { section: 'Academic Records', message: 'Some course or attendance records were temporarily unavailable on HAC.' }
              ]).map((w, idx) => (
                <div key={idx} className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-3">
                  <span className="text-amber-500 font-bold text-base leading-none shrink-0 mt-0.5">•</span>
                  <div className="min-w-0 flex-1">
                    {w.section && (
                      <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide mb-0.5">
                        {w.section}
                      </h4>
                    )}
                    <p className="text-xs text-amber-900 font-medium leading-snug">
                      {w.message || w}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="w-full max-w-md flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={onRetry}
                className={`w-full sm:flex-1 ${currentTheme.bgClass} hover:opacity-90 text-white font-bold py-3.5 px-5 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg text-sm cursor-pointer`}
              >
                <RefreshCw size={16} />
                <span>Retry</span>
              </button>

              <button
                type="button"
                onClick={onContinue}
                className="w-full sm:flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3.5 px-5 rounded-2xl transition flex items-center justify-center gap-2 text-sm cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
