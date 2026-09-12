// Web Audio Chime generator for guaranteed instant audio feedback
export function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    // Two-tone pleasant chime (520Hz -> 659Hz -> 784Hz)
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.12); // E5
    osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.24); // G5

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  } catch (e) {
    console.warn('Audio chime could not play:', e);
  }
}

// Request permission & send system desktop notification without blocking alert popups
export async function requestAndSendTestNotification() {
  playNotificationSound();

  if (!('Notification' in window)) {
    return { success: true, mode: 'audio_only', reason: 'unsupported' };
  }

  let perm = Notification.permission;
  if (perm === 'default') {
    try {
      const permPromise = Notification.requestPermission();
      const timeoutPromise = new Promise((res) => setTimeout(() => res('timeout'), 3500));
      const result = await Promise.race([permPromise, timeoutPromise]);
      if (result !== 'timeout') {
        perm = result;
      }
    } catch (e) {
      console.warn('Notification.requestPermission error:', e);
    }
  }

  if (perm === 'granted') {
    const delivered = await fireNotification(
      '🔔 Ascend Notifications Active',
      'System & audio notifications are working! Grade updates and study alerts are active.'
    );
    return { success: true, permission: 'granted', delivered };
  } else if (perm === 'denied') {
    return { 
      success: true, 
      mode: 'audio_only', 
      reason: 'denied',
      message: 'System alerts blocked by browser. In-app audio alerts active.' 
    };
  } else {
    return { 
      success: true, 
      mode: 'audio_only', 
      reason: 'pending',
      message: 'Permission prompt pending. In-app audio alerts active.' 
    };
  }
}

// Fire notification helper with ServiceWorker & Web Notification fallback
export async function fireNotification(title, body, options = {}) {
  playNotificationSound();
  let sent = false;

  // Try Service Worker registration first (standard for PWAs & Android/iOS)
  if ('serviceWorker' in navigator) {
    try {
      let reg = null;
      if (navigator.serviceWorker.ready) {
        reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise(res => setTimeout(() => res(null), 2500))
        ]);
      }
      if (!reg) {
        reg = await navigator.serviceWorker.getRegistration();
      }

      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          tag: options.tag || 'ascend-alert',
          renotify: true,
          ...options
        });
        sent = true;
      }
    } catch (err) {
      console.warn('Service Worker notification failed:', err);
    }
  }

  // Fallback to Window Notification constructor if SW didn't trigger
  if (!sent && 'Notification' in window) {
    try {
      if (Notification.permission === 'granted') {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.svg',
          tag: options.tag || 'ascend-alert',
          ...options
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
        sent = true;
      }
    } catch (err) {
      console.warn('Standard Notification fallback failed:', err);
    }
  }

  return sent;
}

// Schedule notification after a delay (in seconds)
export async function scheduleNotificationInSeconds(seconds, customMessage = 'Your scheduled reminder has arrived!') {
  if (!('Notification' in window)) {
    return { success: false, reason: 'unsupported' };
  }

  let perm = Notification.permission;
  if (perm === 'default') {
    try {
      const permPromise = Notification.requestPermission();
      const timeoutPromise = new Promise(res => setTimeout(() => res('timeout'), 3000));
      const res = await Promise.race([permPromise, timeoutPromise]);
      if (res !== 'timeout') perm = res;
    } catch {
      // ignore
    }
  }

  setTimeout(() => {
    fireNotification('⏰ Ascend Reminder', customMessage);
  }, seconds * 1000);

  return { success: true, delaySeconds: seconds, permission: perm };
}
