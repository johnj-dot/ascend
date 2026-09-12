import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { DISTRICTS, DEFAULT_DISTRICT } from '../utils/districts';
import { LogIn, User, Loader2, ChevronRight, ChevronDown, Plus, Trash2, ArrowLeft, Building2, Search, Check, X, Eye, EyeOff } from 'lucide-react';
import OnboardingModal from '../components/OnboardingModal';
import { API_BASE_URL } from '../utils/apiConfig';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(DEFAULT_DISTRICT);
  const [districtSearch, setDistrictSearch] = useState('');
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Onboarding modal states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState('theme');
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Logging into Home Access Center...');
  const [warnings, setWarnings] = useState([]);
  const [pendingProfile, setPendingProfile] = useState(null);

  const [pendingLogin, setPendingLogin] = useState(null);

  const currentStepRef = useRef(0);
  const progressTimerRef = useRef(null);

  const savedAccounts = useStore(state => state.savedAccounts) || [];
  const login = useStore(state => state.login);
  const removeAccount = useStore(state => state.removeAccount);
  const navigate = useNavigate();

  const filteredDistricts = DISTRICTS.filter(d =>
    d.name.toLowerCase().includes(districtSearch.toLowerCase()) ||
    d.domain.toLowerCase().includes(districtSearch.toLowerCase())
  );

  const startSyncProcess = async (userToAuth, passToAuth, districtObj) => {
    setLoading(true);
    setError('');
    setWarnings([]);
    setPendingProfile(null);
    currentStepRef.current = 0;
    setShowOnboarding(true);
    setOnboardingStep('progress');
    setProgress(15);
    setStatusText(`Connecting to ${districtObj?.name || 'Home Access Center'}...`);

    const steps = [
      { progress: 15, text: `Connecting to ${districtObj?.name || 'Home Access Center'}...`, delay: 2500 },
      { progress: 35, text: 'Authenticating student credentials...', delay: 2500 },
      { progress: 55, text: 'Extracting student registration & profile...', delay: 2500 },
      { progress: 75, text: 'Fetching active classes & course averages...', delay: 2500 },
      { progress: 88, text: 'Scraping assignments & due dates...', delay: 2500 },
      { progress: 95, text: 'Retrieving multi-year transcript & attendance...', delay: 2500 },
      { progress: 98, text: 'Finalizing sync & preparing dashboard...', delay: 0 },
    ];

    const advanceProgress = (idx) => {
      if (idx < steps.length) {
        currentStepRef.current = idx;
        setProgress(steps[idx].progress);
        setStatusText(steps[idx].text);
        if (steps[idx].delay > 0) {
          progressTimerRef.current = setTimeout(() => advanceProgress(idx + 1), steps[idx].delay);
        }
      }
    };

    advanceProgress(0);

    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: userToAuth,
          password: passToAuth,
          districtUrl: districtObj?.url
        })
      });

      const data = await response.json();
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current);

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please check credentials and district.');
      }

      // Fast-forward through any remaining steps rapidly (150ms each)
      const startIdx = currentStepRef.current;
      for (let s = startIdx + 1; s < steps.length; s++) {
        setProgress(steps[s].progress);
        setStatusText(steps[s].text);
        await new Promise(r => setTimeout(r, 150));
      }

      setProgress(100);
      setStatusText('Sync complete! Loading dashboard...');
      await new Promise(r => setTimeout(r, 350));

      // Save to store with district name
      const profileData = {
        ...data.data,
        school: districtObj?.name || data.data.school || 'Home Access Center'
      };

      const credsObj = { username: userToAuth, password: passToAuth, districtUrl: districtObj?.url };

      // If partial warnings occurred, display warning modal before dashboard
      if (data.data?.warnings && data.data.warnings.length > 0) {
        setWarnings(data.data.warnings);
        setPendingProfile({ profileData, creds: credsObj });
        setOnboardingStep('warning');
        setLoading(false);
      } else {
        login(profileData, credsObj);
        setTimeout(() => {
          setShowOnboarding(false);
          navigate('/overview');
        }, 350);
      }

    } catch (err) {
      if (progressTimerRef.current) clearTimeout(progressTimerRef.current);
      setShowOnboarding(false);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleWarningRetry = () => {
    if (pendingProfile?.creds) {
      const { username: u, password: p, districtUrl } = pendingProfile.creds;
      const matchedDist = DISTRICTS.find(d => d.url === districtUrl) || selectedDistrict;
      startSyncProcess(u, p, matchedDist);
    }
  };

  const handleWarningContinue = () => {
    if (pendingProfile) {
      login(pendingProfile.profileData, pendingProfile.creds);
      setShowOnboarding(false);
      navigate('/overview');
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setPendingLogin({ username, password, district: selectedDistrict });
    setShowOnboarding(true);
    setOnboardingStep('theme');
  };

  const handleSavedAccountClick = (acc) => {
    const matchedDist = DISTRICTS.find(d => d.name === acc.school || d.url === acc.districtUrl) || selectedDistrict;
    startSyncProcess(acc.username, acc.password, matchedDist);
  };

  const hasSavedAccounts = savedAccounts.length > 0 && !showAddForm;

  return (
    <div className="min-h-screen bg-emerald-600 flex flex-col items-center justify-center p-4 relative">
      {/* Onboarding / Sync Progress / Warning Overlay */}
      {showOnboarding && (
        <OnboardingModal
          step={onboardingStep}
          progress={progress}
          statusText={statusText}
          warnings={warnings}
          onRetry={handleWarningRetry}
          onContinue={handleWarningContinue}
          onCompleteTheme={() => {
            if (pendingLogin) {
              startSyncProcess(pendingLogin.username, pendingLogin.password, pendingLogin.district);
            }
          }}
        />
      )}

      {/* ── Custom District Picker Modal ── */}
      {showDistrictModal && (
        <div
          onClick={() => setShowDistrictModal(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 p-6 space-y-4 animate-in fade-in zoom-in duration-150 flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-800 text-base">Select School District</h3>
                  <p className="text-[11px] text-gray-400 font-medium">Choose your Texas school district portal</p>
                </div>
              </div>
              <button
                onClick={() => setShowDistrictModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search district name or domain..."
                value={districtSearch}
                onChange={(e) => setDistrictSearch(e.target.value)}
                className="w-full pl-10 pr-9 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs font-bold text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition"
              />
              {districtSearch && (
                <button
                  onClick={() => setDistrictSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* District List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
              {filteredDistricts.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs font-semibold">
                  No districts matching "{districtSearch}"
                </div>
              ) : (
                filteredDistricts.map(d => {
                  const isSelected = selectedDistrict?.domain === d.domain && selectedDistrict?.name === d.name;
                  return (
                    <button
                      key={d.id || d.domain}
                      type="button"
                      onClick={() => {
                        setSelectedDistrict(d);
                        setShowDistrictModal(false);
                        setDistrictSearch('');
                      }}
                      className={`w-full px-4 py-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer group ${
                        isSelected
                          ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950 shadow-sm ring-1 ring-emerald-500'
                          : 'bg-white border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/20 text-gray-800'
                      }`}
                    >
                      <div className="min-w-0 pr-3">
                        <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-emerald-900 font-extrabold' : 'text-gray-800'}`}>
                          {d.name}
                        </h4>
                        <p className={`text-[11px] font-medium truncate mt-0.5 ${isSelected ? 'text-emerald-700/80' : 'text-gray-400'}`}>
                          {d.domain}
                        </p>
                      </div>
                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Check size={13} strokeWidth={3} />
                        </div>
                      ) : (
                        <ChevronRight size={15} className="text-gray-300 group-hover:text-emerald-600 transition shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-emerald-600 mb-2">Ascend</h1>
          <p className="text-gray-500">Student Dashboard & AI Canvas</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-6 text-sm font-medium border border-red-100 flex items-center justify-between">
            <span>{error}</span>
          </div>
        )}

        {/* ── Saved Accounts Mode ── */}
        {hasSavedAccounts ? (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Saved Accounts</h3>
            <div className="space-y-3">
              {savedAccounts.map((acc, idx) => (
                <div
                  key={idx}
                  className="group bg-gray-50 border border-gray-100 hover:border-emerald-500 rounded-2xl p-4 flex items-center justify-between transition cursor-pointer hover:shadow-md"
                  onClick={() => handleSavedAccountClick(acc)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 font-bold flex items-center justify-center shrink-0">
                      <User size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-800 text-sm truncate">{acc.studentName || acc.username}</h4>
                      <p className="text-xs text-gray-400 truncate">{acc.school || 'School District'} · {acc.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAccount(acc.username);
                      }}
                      className="text-gray-300 hover:text-red-500 transition p-2 rounded-xl"
                      title="Remove Account"
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronRight size={18} className="text-gray-400 group-hover:text-emerald-600 transition" />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowAddForm(true)}
              className="w-full mt-4 py-3.5 rounded-2xl border border-dashed border-gray-300 hover:border-emerald-500 text-gray-500 hover:text-emerald-600 font-bold text-sm flex items-center justify-center gap-2 transition"
            >
              <Plus size={18} />
              Add Another Account
            </button>
          </div>
        ) : (
          /* ── Login Form Mode ── */
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {savedAccounts.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs font-bold text-emerald-600 flex items-center gap-1 mb-2 hover:underline"
              >
                <ArrowLeft size={14} /> Back to Saved Accounts
              </button>
            )}

            {/* Custom Interactive District Picker Trigger */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                School District
              </label>
              <button
                type="button"
                onClick={() => setShowDistrictModal(true)}
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 hover:border-emerald-500 bg-gray-50/60 hover:bg-white flex items-center justify-between transition text-left group shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold">
                    <Building2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{selectedDistrict.name}</p>
                    <p className="text-[11px] text-gray-400 font-medium truncate">{selectedDistrict.domain}</p>
                  </div>
                </div>
                <ChevronDown size={18} className="text-gray-400 group-hover:text-emerald-600 transition shrink-0 ml-2" />
              </button>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                HAC Username / Student ID
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. s123456"
                className="w-full px-4 py-3 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm font-medium"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                HAC Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-11 py-3 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition text-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-2xl transition duration-200 shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 mt-6 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
