# Notification System Design with Multi-Offset & Repeated Alerts

## Overview
A comprehensive notification and reminder system for GradeForge supporting:
1. Multi-select push notification timing offsets for assignments & tasks (e.g. *1 day before*, *1 hour before*, *30 minutes before*, *at due time*).
2. Repeated / recurring notification cadences (*Daily*, *Weekdays Mon–Fri*, *Weekly*, and *Custom Intervals e.g. every 30m / 1h / 2h*).
3. Foreground & Service Worker background notification scheduler.

## Data Model (`useStore.js`)
Task/Reminder Schema additions:
- `notificationOffsets`: `Array<string>` — Multi-select array of offsets:
  - `'at_time'`: At exact due time
  - `'15m'`: 15 minutes before
  - `'30m'`: 30 minutes before
  - `'1h'`: 1 hour before
  - `'2h'`: 2 hours before
  - `'1d'`: 1 day before (at 8:00 AM or 24h prior)
  - `'custom'`: Specific time of day
- `customNotifyTime`: String (e.g. `'08:00'`)
- `repeatCadence`: `'none' | 'daily' | 'weekdays' | 'weekly' | 'interval'`
- `repeatIntervalMinutes`: Number (e.g. `30`, `60`, `120`, `180`)
- `notifiedOffsets`: `Array<string>` — Records which offsets have fired to prevent duplicate notifications.
- `lastNotifiedAt`: ISO timestamp of the last notification fired.

## Scheduler Engine (`frontend/src/utils/notificationScheduler.js`)
- Runs every 20 seconds.
- Verifies `localOverrides.settings.notifications === true` and Web Notification permission.
- Iterates over active `localOverrides.plannerTasks` (where `completed === false`):
  1. Computes trigger timestamps for each enabled offset in `notificationOffsets`.
  2. If current time >= offset trigger time and not yet in `notifiedOffsets`:
     - Dispatches Native Browser Notification.
     - Appends offset to `notifiedOffsets` and updates `lastNotifiedAt`.
  3. For recurring interval tasks (`repeatCadence === 'interval'`), if time since `lastNotifiedAt` >= `repeatIntervalMinutes`:
     - Dispatches repeated notification.
     - Updates `lastNotifiedAt`.
  4. For calendar recurrences (*Daily*, *Weekdays*, *Weekly*), checks if today matches recurrence rule and scheduled time reached, resetting daily trigger flags.

## UI Components (`TaskAdderModal.jsx`)
- **Multi-Select Notification Timings**:
  - Clickable pill buttons with toggle checkmarks:
    - ⏱️ `At Due Time`
    - 🔔 `15 Mins Before`
    - 🔔 `30 Mins Before`
    - ⏰ `1 Hour Before`
    - ⏰ `2 Hours Before`
    - 📅 `1 Day Before`
    - ⚙️ `Custom Time`
- **Repeat Cadence Selector**:
  - 🔄 `Never (One-Time)`
  - 📅 `Daily`
  - 🏢 `Weekdays (Mon - Fri)`
  - 📆 `Weekly`
  - ⏱️ `Interval (Every 30m / 1h / 2h / Custom)`
- Live Summary Badge: e.g., *"🔔 1 Day Before, 1 Hour Before · Repeats Daily at 8:00 AM"*.
