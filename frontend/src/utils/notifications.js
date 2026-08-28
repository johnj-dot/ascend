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

// Request permission & send system desktop notification
export async function requestAndSendTestNotification() {
  playNotificationSound();

  if (!('Notification' in window)) {
    alert('This browser does not support desktop notifications.');
    return { success: false, reason: 'unsupported' };
  }

  let perm = Notification.permission;
  if (perm === 'default') {
    try {
      perm = await Notification.requestPermission();
    } catch (e) {
      console.warn('Notification.requestPermission error:', e);
    }
  }

  if (perm === 'granted') {
    await fireNotification('🔔 GradeForge Test Reminder', 'Desktop notifications are working! Your study & task alerts are active.');
    return { success: true, permission: 'granted' };
  } else if (perm === 'denied') {
    alert('Notification permission is blocked by your browser.\n\nTo enable notifications:\n1. Click the lock/settings icon on the left of the URL bar\n2. Set "Notifications" to "Allow"\n3. Refresh and try again.');
    return { success: false, reason: 'denied' };
  } else {
    return { success: false, reason: 'dismissed' };
  }
}

// Fire notification helper
async function fireNotification(title, body) {
  playNotificationSound();
  let sent = false;

  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'gradeforge-alert',
          renotify: true,
          requireInteraction: true,
        });
        sent = true;
      }
    } catch (err) {
      console.warn('Service Worker notification failed:', err);
    }
  }

  if (!sent) {
    try {
      const notif = new Notification(title, {
        body,
        icon: '/icon-192.png',
        requireInteraction: true,
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (err) {
      console.warn('Standard Notification fallback failed:', err);
    }
  }
}

// Schedule notification after a delay (in seconds) so user can switch tabs/minimize
export async function scheduleNotificationInSeconds(seconds, customMessage = 'Your scheduled reminder has arrived!') {
  if (!('Notification' in window)) {
    alert('This browser does not support desktop notifications.');
    return { success: false };
  }

  let perm = Notification.permission;
  if (perm === 'default') {
    perm = await Notification.requestPermission();
  }

  if (perm !== 'granted') {
    alert('Notification permission not granted. Please allow notifications in browser settings.');
    return { success: false, reason: perm };
  }

  setTimeout(() => {
    fireNotification('⏰ GradeForge Scheduled Reminder', customMessage);
  }, seconds * 1000);

  return { success: true, delaySeconds: seconds };
}
