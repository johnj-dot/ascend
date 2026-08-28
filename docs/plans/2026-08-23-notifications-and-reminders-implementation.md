# Notifications & Repeated Reminders Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build a robust client-side Notification Scheduler supporting multi-select offsets (e.g. 1 day before, 1 hour before, at due time) and repeat cadences (Daily, Weekdays, Weekly, Intervals) for homework and reminders.

**Architecture:** A centralized scheduler daemon (`notificationScheduler.js`) listens for active tasks from `useStore.js`, evaluates timing offsets and recurrence rules, and dispatches rich browser notifications when permission is granted and settings are enabled. `TaskAdderModal.jsx` provides multi-select offset buttons and repeat options.

**Tech Stack:** React, Zustand with localStorage persistence, Web Notifications API, Service Worker.

---

### Task 1: Notification Engine & Recurrence Engine (`frontend/src/utils/notificationScheduler.js`)

**Files:**
- Create: `frontend/src/utils/notificationScheduler.js`

**Step 1: Write scheduler logic**
- Calculates offset timestamps: `at_time` (0m), `15m`, `30m`, `1h`, `2h`, `1d` (1440m or 8am day before), and `custom`.
- Dispatches notifications with title, course/category subtitle, badge, and sound/vibrate.
- Tracks `notifiedOffsets` array and `lastNotifiedAt` to prevent duplicate firing.
- Handles recurrence rules (*Daily*, *Weekdays Mon–Fri*, *Weekly*, *Intervals*).

---

### Task 2: Mount Scheduler in Global App Layout (`frontend/src/components/Layout.jsx`)

**Files:**
- Modify: `frontend/src/components/Layout.jsx`

**Step 1: Mount interval daemon**
- Hooks into `useStore` to initialize `startNotificationScheduler()` on layout mount.
- Runs every 20 seconds cleanly with cleanup on unmount.

---

### Task 3: Multi-Select Offsets & Repeat Cadence UI (`frontend/src/components/TaskAdderModal.jsx`)

**Files:**
- Modify: `frontend/src/components/TaskAdderModal.jsx`

**Step 1: Update task creator UI**
- Add Multi-Select pill toggles for notification timings:
  - ⏱️ `At Due Time`
  - 🔔 `15 Mins Before`
  - 🔔 `30 Mins Before`
  - ⏰ `1 Hour Before`
  - ⏰ `2 Hours Before`
  - 📅 `1 Day Before`
  - ⚙️ `Custom Time`
- Add Repeat Cadence selector:
  - 🔄 `Never (One-Time)`
  - 📅 `Daily`
  - 🏢 `Weekdays (Mon - Fri)`
  - 📆 `Weekly`
  - ⏱️ `Interval (Every 30m / 1h / 2h / Custom)`
- Live Summary Badge preview.

---

### Task 4: Verification & Automated Build

**Step 1: Verify frontend build**
- `npm run build` in `frontend/`
- `node scraper/hacScraper.test.js` in `backend/`
