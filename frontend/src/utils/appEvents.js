// Lightweight, 100% fail-safe pure JavaScript event bus + optional cross-tab BroadcastChannel
// Zero external dependencies, ultra-fast in-memory execution

const listeners = new Map();
let broadcastChannel = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('gradeforge_events');
    broadcastChannel.onmessage = (event) => {
      if (event?.data?.type) {
        const list = listeners.get(event.data.type);
        if (list) {
          list.forEach(fn => {
            try { fn(event.data.payload); } catch (e) { console.error('Broadcast event error:', e); }
          });
        }
      }
    };
  }
} catch {
  // BroadcastChannel unavailable in sandboxed environments, graceful fallback to memory bus
}

export const APP_EVENTS = {
  TASK_ADDED: 'gradeforge:task_added',
  TASK_COMPLETED: 'gradeforge:task_completed',
  TASK_DELETED: 'gradeforge:task_deleted',
  DOC_ADDED: 'gradeforge:doc_added',
  DOC_DELETED: 'gradeforge:doc_deleted',
  GRADE_UPDATED: 'gradeforge:grade_updated',
  THEME_CHANGED: 'gradeforge:theme_changed',
  DATA_SYNCED: 'gradeforge:data_synced',
};

/**
 * Dispatch an app event locally and broadcast across tabs with zero latency.
 */
export function emitAppEvent(type, payload = {}) {
  try {
    const list = listeners.get(type);
    if (list) {
      list.forEach(fn => {
        try { fn(payload); } catch (e) { console.error('Local event handler error:', e); }
      });
    }
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type, payload });
    }
  } catch (err) {
    console.warn('Event emit failed:', err);
  }
}

/**
 * Subscribe a component or callback to real-time events.
 * Returns an unsubscribe cleanup function.
 */
export function onAppEvent(type, callback) {
  if (!listeners.has(type)) {
    listeners.set(type, new Set());
  }
  listeners.get(type).add(callback);
  return () => {
    const list = listeners.get(type);
    if (list) {
      list.delete(callback);
      if (list.size === 0) listeners.delete(type);
    }
  };
}
