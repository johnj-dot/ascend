import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Helper: Merges newly scraped HAC data with previous data if any section was not found or failed
function mergeWithPrevious(newData, prevData) {
  if (!prevData) return newData;
  const merged = { ...newData };

  // If classes are empty in new data, fallback to previous classes
  if (!merged.classes || merged.classes.length === 0) {
    if (prevData.classes && prevData.classes.length > 0) {
      merged.classes = prevData.classes;
      merged._fallbackClasses = true;
    }
  } else if (prevData.classes && prevData.classes.length > 0) {
    // Preserve previously scraped assignments if newly scraped class has 0 assignments
    merged.classes = merged.classes.map(newClass => {
      if (!newClass.assignments || newClass.assignments.length === 0) {
        const prevClass = prevData.classes.find(pc =>
          pc.name === newClass.name ||
          (pc.id && newClass.id && pc.id.split(' ')[0] === newClass.id.split(' ')[0])
        );
        if (prevClass?.assignments && prevClass.assignments.length > 0) {
          return { ...newClass, assignments: prevClass.assignments };
        }
      }
      return newClass;
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
    if (prevData.attendance && prevData.attendance.length > 0) {
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
      savedAccounts: [], // [{ username, password, studentName, school }]
      activeTheme: 'green',
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
        const currentData = get().hacData;
        const currentSaved = get().savedAccounts || [];
        const mergedData = mergeWithPrevious(data, currentData);

        // Update or add saved account record
        let newSaved = [...currentSaved];
        if (creds?.username) {
          const idx = newSaved.findIndex(a => a.username === creds.username);
          const accObj = {
            username: creds.username,
            password: creds.password,
            studentName: mergedData.studentName || 'Student',
            school: mergedData.school || 'School District',
            lastLogin: new Date().toISOString(),
          };
          if (idx >= 0) newSaved[idx] = accObj;
          else newSaved.push(accObj);
        }

        set({
          previousHacData: currentData,
          hacData: mergedData,
          credentials: creds,
          savedAccounts: newSaved,
          syncWarnings: data.warnings && data.warnings.length > 0 ? data.warnings : null,
        });
      },
      
      logout: () => set({ hacData: null, previousHacData: null, credentials: null, completedItemIds: [], syncWarnings: null, syncNotification: null, isSyncing: false }),

      clearSyncWarnings: () => set({ syncWarnings: null }),
      setSyncNotification: (notif) => set({ syncNotification: notif }),
      clearSyncNotification: () => set({ syncNotification: null }),

      removeAccount: (username) => set((state) => ({
        savedAccounts: (state.savedAccounts || []).filter(a => a.username !== username)
      })),

      setTheme: (themeId) => set({ activeTheme: themeId }),
      
      syncHacData: async () => {
        const { credentials } = get();
        set({ 
          isSyncing: true,
          syncNotification: { type: 'syncing', title: 'Syncing...', message: 'Connecting to Home Access Center' } 
        });

        try {
          if (!credentials?.username || !credentials?.password) {
            // Offline / demo sync fallback
            const latestRes = await fetch('http://localhost:3001/api/hac/latest');
            const latestData = await latestRes.json();
            if (latestData.success && latestData.data) {
              const currentData = get().hacData;
              const mergedData = mergeWithPrevious(latestData.data, currentData);
              set({
                previousHacData: currentData,
                hacData: mergedData,
                syncNotification: {
                  type: 'success',
                  title: 'Sync successful',
                  message: 'Latest grades & attendance updated.',
                  timestamp: Date.now()
                }
              });
              return { success: true };
            }
            throw new Error('No saved credentials for live sync.');
          }

          const res = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
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
                title: 'Attendance failed',
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

          return { success: true };
        } catch (err) {
          const currentData = get().hacData;
          set({
            syncNotification: {
              type: 'error',
              title: 'Sync failed',
              message: err.message || 'Could not reach Home Access Center. Using last saved data.',
              failedSection: 'network',
              timestamp: Date.now()
            }
          });
          throw err;
        } finally {
          set({ isSyncing: false });
        }
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

        return {
          completedItemIds: nextList,
          localOverrides: {
            ...state.localOverrides,
            plannerTasks: updatedPlannerTasks,
          }
        };
      }),

      toggleSetting: (key) => set((state) => ({
        localOverrides: {
          ...state.localOverrides,
          settings: {
            ...state.localOverrides.settings,
            [key]: !state.localOverrides.settings?.[key]
          }
        }
      })),

      // Planner Tasks
      addPlannerTask: (task) => set((state) => ({
        localOverrides: {
          ...state.localOverrides,
          plannerTasks: [
            ...(state.localOverrides.plannerTasks || []),
            { ...task, id: task.id || Date.now().toString(), completed: false }
          ]
        }
      })),

      removePlannerTask: (id) => set((state) => ({
        localOverrides: {
          ...state.localOverrides,
          plannerTasks: (state.localOverrides.plannerTasks || []).filter(t => t.id !== id)
        }
      })),

      togglePlannerTaskCompleted: (id, forceComplete = null) => set((state) => {
        const tasks = state.localOverrides.plannerTasks || [];
        return {
          localOverrides: {
            ...state.localOverrides,
            plannerTasks: tasks.map(t => {
              if (t.id !== id) return t;
              const newCompleted = forceComplete !== null ? !forceComplete : !t.completed;
              return { ...t, completed: newCompleted };
            })
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

        return {
          completedItemIds: updatedCompletedIds,
          localOverrides: {
            ...state.localOverrides,
            plannerTasks: updatedPlannerTasks,
          }
        };
      }),

      updateCustomWeights: (classId, weight) => set((state) => ({
        localOverrides: {
          ...state.localOverrides,
          customWeights: {
            ...state.localOverrides.customWeights,
            [classId]: weight
          }
        }
      })),
      
      setGpaScale: (scale) => set((state) => ({
        localOverrides: {
          ...state.localOverrides,
          gpaScale: scale
        }
      })),
    }),
    {
      name: 'ascend-storage',
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
