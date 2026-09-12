import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { emitAppEvent, APP_EVENTS } from '../utils/appEvents';
import { API_BASE_URL } from '../utils/apiConfig';
import { fireNotification } from '../utils/notifications';

function getActiveMP() {
  const month = new Date().getMonth();
  if (month >= 7 && month <= 9) return 'MP1';
  if (month >= 10 || month === 0) return 'MP2';
  if (month >= 1 && month <= 2) return 'MP3';
  return 'MP4';
}

// Helper: Merges newly scraped HAC data with previous data if any section was not found or failed
function mergeWithPrevious(newData, prevData) {
  if (!prevData || (prevData.studentId && newData.studentId && prevData.studentId !== newData.studentId)) {
    const activeMP = getActiveMP();
    if (newData?.classes) {
      newData.classes = newData.classes.map(c => ({
        ...c,
        mpHistory: {
          [activeMP]: {
            average: c.average ?? null,
            letterGrade: c.letterGrade ?? null,
            assignments: c.assignments || [],
            savedAt: new Date().toISOString(),
          }
        }
      }));
    }
    return newData;
  }

  const merged = { ...newData };
  const activeMP = getActiveMP();

  // If classes are empty in new data, fallback to previous classes
  if (!merged.classes || merged.classes.length === 0) {
    if (prevData.classes && prevData.classes.length > 0) {
      merged.classes = prevData.classes;
      merged._fallbackClasses = true;
    }
  } else if (prevData.classes && prevData.classes.length > 0) {
    merged.classes = merged.classes.map(newClass => {
      const prevClass = prevData.classes.find(pc =>
        pc.name === newClass.name ||
        (pc.id && newClass.id && pc.id.split(' ')[0] === newClass.id.split(' ')[0])
      );

      let assignments = newClass.assignments;
      if (!assignments || assignments.length === 0) {
        if (prevClass?.assignments && prevClass.assignments.length > 0) {
          assignments = prevClass.assignments;
        }
      }

      // Carry forward permanent past marking period history
      const mpHistory = { ...(prevClass?.mpHistory || {}) };
      
      // Update current active MP snapshot
      mpHistory[activeMP] = {
        average: newClass.average !== undefined ? newClass.average : (prevClass?.average ?? null),
        letterGrade: newClass.letterGrade !== undefined ? newClass.letterGrade : (prevClass?.letterGrade ?? null),
        assignments: assignments || [],
        savedAt: new Date().toISOString(),
      };

      return {
        ...newClass,
        assignments,
        mpHistory,
      };
    });
  }

  // If transcript is empty in new data, fallback to previous transcript
  if (!merged.transcript?.years || merged.transcript.years.length === 0) {
    if (prevData.transcript?.years && prevData.transcript.years.length > 0) {
      merged.transcript = prevData.transcript;
      merged._fallbackTranscript = true;
    }
  }

  // If registration is missing in new data, fallback to previous registration
  if (!merged.registration || !merged.registration.studentId) {
    if (prevData.registration?.studentId) {
      merged.registration = prevData.registration;
      merged.studentName = merged.studentName || prevData.studentName;
      merged.school = merged.school || prevData.school;
      merged._fallbackRegistration = true;
    }
  }

  // If attendance is missing/empty in new data, fallback to previous attendance (never wipe to 0)
  if (!merged.attendance || merged.attendance.length === 0) {
    if (prevData?.attendance && prevData.attendance.length > 0) {
      merged.attendance = prevData.attendance;
      merged._fallbackAttendance = true;
    }
  }

  return merged;
}

export const useStore = create(
  persist(
    (set, get) => ({
      // State trees
      hacData: null,
      previousHacData: null,
      credentials: null,
      savedAccounts: [], // [{ username, password, studentName, school, cachedProfile }]
      activeTheme: 'midnight',
      completedItemIds: [],
      syncWarnings: null, // [{ section, message }]
      syncNotification: null, // { type: 'success'|'warning'|'error'|'syncing', title: string, message: string, failedSection?: string }
      isSyncing: false,
      localOverrides: {
        plannerTasks: [],
        gpaScale: '4.0',
        customWeights: {},
        settings: {
          notifications: true,
          offline: true,
        }
      },
      
      // Actions
      login: (data, creds = null) => {
        const currentSaved = get().savedAccounts || [];
        const savedMatch = creds?.username ? currentSaved.find(a => a.username === creds.username) : null;
        const currentData = get().hacData || get().previousHacData || savedMatch?.cachedProfile || null;
        const mergedData = mergeWithPrevious(data, currentData);

        // Update or add saved account record with cached profile
        let newSaved = [...currentSaved];
        if (creds?.username) {
          const idx = newSaved.findIndex(a => a.username === creds.username);
          const accObj = {
            username: creds.username,
            password: creds.password,
            studentName: mergedData.studentName || 'Student',
            school: mergedData.school || 'School District',
            lastLogin: new Date().toISOString(),
            cachedProfile: mergedData,
          };
          if (idx >= 0) newSaved[idx] = accObj;
          else newSaved.push(accObj);
        }

        set({
          previousHacData: currentData || mergedData,
          hacData: mergedData,
          credentials: creds,
          savedAccounts: newSaved,
          syncWarnings: data.warnings && data.warnings.length > 0 ? data.warnings : null,
        });
      },
      
      logout: () => set(() => ({
        previousHacData: null,
        hacData: null,
        credentials: null,
        completedItemIds: [],
        syncWarnings: null,
        syncNotification: null,
        isSyncing: false
      })),

      clearSyncWarnings: () => set({ syncWarnings: null }),
      setSyncNotification: (notif) => set({ syncNotification: notif }),
      clearSyncNotification: () => set({ syncNotification: null }),

      removeAccount: (username) => set((state) => ({
        savedAccounts: (state.savedAccounts || []).filter(a => a.username !== username)
      })),

      syncHacData: async () => {
        const { credentials, savedAccounts, hacData } = get();
        // Resolve active credentials from state or savedAccounts list
        const activeCreds = (credentials?.username && credentials?.password)
          ? credentials
          : (savedAccounts || []).find(a => a.username && a.password) || null;

        if (!activeCreds) {
          set({
            isSyncing: false,
            syncNotification: {
              type: 'error',
              title: 'Sign In Required',
              message: 'Active login credentials needed to sync latest grades from HAC.',
              timestamp: Date.now()
            }
          });
          return { success: false, error: 'Active login credentials needed' };
        }

        set({ 
          isSyncing: true,
          syncNotification: { type: 'syncing', title: 'Syncing...', message: 'Connecting to Home Access Center' } 
        });

        try {
          const res = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: activeCreds.username,
              password: activeCreds.password,
              districtUrl: activeCreds.districtUrl || activeCreds.domain
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Live sync failed');

          const currentData = get().hacData;
          const mergedData = mergeWithPrevious(data.data, currentData);

          // Check if specific sections failed
          const warnings = data.data?.warnings || [];
          const attendanceFailed = mergedData._fallbackAttendance || warnings.some(w => /attendance/i.test(w.message || w));
          const gradesFailed = mergedData._fallbackClasses || warnings.some(w => /classes|grades|assignments/i.test(w.message || w));

          if (attendanceFailed) {
            set({
              previousHacData: currentData,
              hacData: mergedData,
              syncNotification: {
                type: 'warning',
                title: 'Attendance partial',
                message: 'Preserving your last saved attendance records.',
                failedSection: 'attendance',
                timestamp: Date.now()
              }
            });
          } else if (gradesFailed) {
            set({
              previousHacData: currentData,
              hacData: mergedData,
              syncNotification: {
                type: 'warning',
                title: 'Grades sync partial',
                message: 'Preserving previously saved classes & assignments.',
                failedSection: 'grades',
                timestamp: Date.now()
              }
            });
          } else {
            set({
              previousHacData: currentData,
              hacData: mergedData,
              syncNotification: {
                type: 'success',
                title: 'Sync successful',
                message: 'All grades and attendance up to date.',
                timestamp: Date.now()
              }
            });
          }

          // Trigger push notification if enabled
          const currentSettings = get().localOverrides?.settings;
          if (currentSettings?.notifications) {
            fireNotification('Ascend • Data Synchronized', 'All latest grades and attendance records have been updated.');
          }

          emitAppEvent(APP_EVENTS.DATA_SYNCED, mergedData);
          return { success: true };
        } catch (err) {
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
          set({
            syncNotification: {
              type: isOffline ? 'warning' : 'error',
              title: isOffline ? 'Offline Mode' : 'Sync failed',
              message: isOffline
                ? 'Device is offline. Viewing locally cached profile and grades.'
                : (err.message || 'Could not reach Home Access Center. Using last saved data.'),
              failedSection: 'network',
              timestamp: Date.now()
            }
          });
          throw err;
        } finally {
          set({ isSyncing: false });
        }
      },

      setTheme: (themeId) => {
        set({ activeTheme: themeId });
        emitAppEvent(APP_EVENTS.THEME_CHANGED, { themeId });
      },

      toggleItemCompleted: (id) => set((state) => {
        const currentList = state.completedItemIds || [];
        const exists = currentList.includes(id);
        const nextList = exists
          ? currentList.filter(i => i !== id)
          : [...currentList, id];
        
        // Also update plannerTasks if it matches a custom task
        const updatedPlannerTasks = (state.localOverrides?.plannerTasks || []).map(t => {
          if (t.id === id) {
            return { ...t, completed: !exists };
          }
          return t;
        });

        emitAppEvent(APP_EVENTS.TASK_COMPLETED, { id, completed: !exists });

        return {
          completedItemIds: nextList,
          localOverrides: {
            ...state.localOverrides,
            plannerTasks: updatedPlannerTasks,
          }
        };
      }),

      toggleSetting: (key) => set((state) => {
        const currentOverrides = state.localOverrides || {};
        const currentSettings = currentOverrides.settings || {};
        const currentVal = currentSettings[key];
        const nextVal = currentVal === undefined ? false : !currentVal;
        emitAppEvent(APP_EVENTS.THEME_CHANGED, { key, value: nextVal });

        // When offline caching is disabled, immediately scrub cached student profile from persistent storage
        if (key === 'offline' && !nextVal) {
          try {
            const raw = localStorage.getItem('ascend-storage');
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed && parsed.state) {
                parsed.state.hacData = null;
                parsed.state.credentials = null;
                parsed.state.previousHacData = null;
                parsed.state.savedAccounts = [];
                localStorage.setItem('ascend-storage', JSON.stringify(parsed));
              }
            }
          } catch (e) {
            console.warn('Could not clear offline cache from localStorage:', e);
          }
        }

        // When offline caching is re-enabled, immediately snapshot state into persistent storage
        if (key === 'offline' && nextVal) {
          try {
            localStorage.setItem('ascend-storage', JSON.stringify({
              state: {
                ...state,
                localOverrides: {
                  ...currentOverrides,
                  settings: {
                    ...currentSettings,
                    offline: true
                  }
                }
              },
              version: 0
            }));
          } catch (e) {
            console.warn('Could not cache profile to localStorage:', e);
          }
        }

        return {
          localOverrides: {
            ...currentOverrides,
            settings: {
              ...currentSettings,
              [key]: nextVal
            }
          }
        };
      }),

      // Planner Tasks
      addPlannerTask: (task) => set((state) => {
        const newTask = { ...task, id: task.id || Date.now().toString(), completed: false };
        emitAppEvent(APP_EVENTS.TASK_ADDED, newTask);
        return {
          localOverrides: {
            ...state.localOverrides,
            plannerTasks: [
              ...(state.localOverrides.plannerTasks || []),
              newTask
            ]
          }
        };
      }),

      removePlannerTask: (id) => set((state) => {
        emitAppEvent(APP_EVENTS.TASK_DELETED, { id });
        return {
          localOverrides: {
            ...state.localOverrides,
            plannerTasks: (state.localOverrides.plannerTasks || []).filter(t => t.id !== id)
          }
        };
      }),

      updatePlannerTask: (id, updates) => set((state) => {
        const updated = (state.localOverrides?.plannerTasks || []).map(t =>
          t.id === id ? { ...t, ...updates } : t
        );
        emitAppEvent(APP_EVENTS.TASK_ADDED, { id, ...updates });
        return {
          localOverrides: {
            ...state.localOverrides,
            plannerTasks: updated
          }
        };
      }),

      togglePlannerTaskCompleted: (id, forceComplete = null) => set((state) => {
        const tasks = state.localOverrides.plannerTasks || [];
        let newStatus = false;
        const updated = tasks.map(t => {
          if (t.id !== id) return t;
          const newCompleted = forceComplete !== null ? !forceComplete : !t.completed;
          newStatus = newCompleted;
          return { ...t, completed: newCompleted };
        });
        emitAppEvent(APP_EVENTS.TASK_COMPLETED, { id, completed: newStatus });
        return {
          localOverrides: {
            ...state.localOverrides,
            plannerTasks: updated
          }
        };
      }),

      syncPlannerFuzzy: (taskObj, isComplete) => set((state) => {
        const taskTopic = (taskObj.topic || taskObj.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const taskCourse = (taskObj.course || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        
        // Update local planner tasks
        const updatedPlannerTasks = (state.localOverrides.plannerTasks || []).map(t => {
          const tName = (t.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const tCourse = (t.course || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          if ((tName.includes(taskTopic) || taskTopic.includes(tName)) && (!tCourse || !taskCourse || tCourse.includes(taskCourse) || taskCourse.includes(tCourse))) {
            return { ...t, completed: isComplete };
          }
          return t;
        });

        // Also update completedItemIds for matching HAC items
        const matchingHacIds = [];
        (state.hacData?.classes || []).forEach(c => {
          (c.assignments || []).forEach(a => {
            const aName = (a.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            if (aName && taskTopic && (aName.includes(taskTopic) || taskTopic.includes(aName))) {
              const dateVal = a.dateDue || a.dateAssigned || a.date || '';
              matchingHacIds.push(`hac-${c.name}-${a.name}-${dateVal}`);
            }
          });
        });

        let updatedCompletedIds = [...state.completedItemIds];
        if (isComplete) {
          matchingHacIds.forEach(hid => {
            if (!updatedCompletedIds.includes(hid)) updatedCompletedIds.push(hid);
          });
        } else {
          updatedCompletedIds = updatedCompletedIds.filter(hid => !matchingHacIds.includes(hid));
        }

        emitAppEvent(APP_EVENTS.TASK_COMPLETED, { taskTopic, isComplete });

        return {
          completedItemIds: updatedCompletedIds,
          localOverrides: {
            ...state.localOverrides,
            plannerTasks: updatedPlannerTasks,
          }
        };
      }),

      updateCustomWeights: (classId, weight) => set((state) => {
        emitAppEvent(APP_EVENTS.GRADE_UPDATED, { classId, weight });
        return {
          localOverrides: {
            ...state.localOverrides,
            customWeights: {
              ...state.localOverrides.customWeights,
              [classId]: weight
            }
          }
        };
      }),
      
      setGpaScale: (scale) => set((state) => {
        emitAppEvent(APP_EVENTS.GRADE_UPDATED, { scale });
        return {
          localOverrides: {
            ...state.localOverrides,
            gpaScale: scale
          }
        };
      }),
    }),
    {
      name: 'ascend-storage',
      partialize: (state) => {
        const offlineEnabled = state.localOverrides?.settings?.offline ?? true;
        if (!offlineEnabled) {
          // Do NOT persist sensitive student profile or credentials when offline access is disabled
          return {
            activeTheme: state.activeTheme,
            localOverrides: state.localOverrides,
            completedItemIds: state.completedItemIds
          };
        }
        return state;
      },
      // Migrate from old gradeforge-storage if present
      storage: {
        getItem: (name) => {
          const item = localStorage.getItem(name);
          if (item) return JSON.parse(item);
          const legacy = localStorage.getItem('gradeforge-storage');
          if (legacy) {
            localStorage.setItem(name, legacy);
            return JSON.parse(legacy);
          }
          return null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        }
      }
    }
  )
);
