# GPA Calculator & Rank Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Add a new "GPA Calculator" tab on the left sidebar featuring a Gradeway-style UI with Unweighted GPA on the left (4.0 scale), Weighted GPA on the right (6.0 scale for Round Rock ISD), HAC rank extraction, and interactive course grade breakdowns.

**Architecture:** Create a dedicated, thoroughly tested `gpaEngine.js` module in `frontend/src/utils` that encodes Round Rock ISD course weighting rules (AP & Advanced = 6.0 max, On-Level Weighted = 5.0 max, Unweighted Only = 4.0 only, PE/Exempt = Non-GPA). Connect backend HAC transcript rank data in `backend/server.js`. Implement a sleek Gradeway-styled `frontend/src/pages/GPA.jsx` with bounded dual-stat cards, live "What-If" grade sliders, tier selector dropdowns, and prior transcript toggle.

**Tech Stack:** React 19, Vite, Tailwind CSS, Lucide React, Node.js Express backend, Cheerio.

---

### Task 1: GPA Calculation Engine & Unit Test

**Files:**
- Create: `frontend/src/utils/gpaEngine.js`
- Test: `frontend/src/utils/gpaEngine.test.js`

**Step 1: Write test file**
Test course classification, 4.0 unweighted bracket mapping (90-100 = 4.0), 6.0 weighted continuous mapping (AP & Advanced = (G-40)/10, On-level = (G-50)/10), and elective exclusions.

**Step 2: Run test to verify failure**
Run: `node frontend/src/utils/gpaEngine.test.js`

**Step 3: Implement `gpaEngine.js`**
Write `classifyCourse`, `getUnweightedPoints`, `getWeightedPoints`, and `calculateGPA`.

**Step 4: Run test to verify pass**
Run: `node frontend/src/utils/gpaEngine.test.js`

**Step 5: Commit**
`git add frontend/src/utils/gpaEngine.js frontend/src/utils/gpaEngine.test.js`
`git commit -m "feat: add Round Rock ISD GPA calculation engine with unit tests"`

---

### Task 2: Backend Rank & Transcript Data Enrichment

**Files:**
- Modify: `backend/server.js`
- Test: `backend/scraper/hacScraper.test.js`

**Step 1: Update `backend/server.js`**
Ensure `loadLatestHarData` merges transcript and rank from `testData/Transcript_2.html` and `testData/Registration_2.html` if `cached_student_profile.json` transcript years are empty.

**Step 2: Run backend tests**
Run: `npm test` in `backend`

**Step 3: Commit**
`git add backend/server.js`
`git commit -m "feat(backend): expose transcript and rank data to student profile"`

---

### Task 3: Sidebar Navigation Tab & Routing

**Files:**
- Modify: `frontend/src/components/Layout.jsx`
- Modify: `frontend/src/App.jsx`

**Step 1: Update tab name to "GPA Calculator"**
In `Layout.jsx`, update the tab label from "GPA" to "GPA Calculator" with `Calculator` / `GraduationCap` icon. Verify routing in `App.jsx` maps `/gpa` cleanly.

**Step 2: Commit**
`git add frontend/src/components/Layout.jsx frontend/src/App.jsx`
`git commit -m "feat(navigation): add GPA Calculator tab to sidebar"`

---

### Task 4: Gradeway-Style GPA Calculator UI

**Files:**
- Modify: `frontend/src/pages/GPA.jsx`

**Step 1: Build Top Header Dual-Card Summary**
- Left Card: Unweighted GPA (4.000 max, letter grade, grade bracket indicator).
- Right Card: Weighted GPA (6.000 max, glowing accent, weight differential badge).
- Stat Pill: Class Rank (`#Rank of ClassSize` from backend, or "Official Rank Pending (Grade 09)").

**Step 2: Build Course Breakdown List (Below Header)**
- Card per class with title, period, teacher.
- Weighting pill dropdown: `AP / Advanced (6.0)`, `On-Level Weighted (5.0)`, `Unweighted Only (4.0)`, `Non-GPA`.
- Interactive What-If grade input / slider for live recalculation.
- Individual point contribution (`UW: 4.0 · W: 6.0`).
- Toggle for including historical transcript credits from middle school.

**Step 3: Commit**
`git add frontend/src/pages/GPA.jsx`
`git commit -m "feat(gpa): implement Gradeway-style GPA calculator with What-If simulations"`

---

### Task 5: End-to-End Build & Verification

**Files:**
- Verify: Full project build

**Step 1: Run frontend build**
Run: `npm run build` in `frontend`

**Step 2: Run backend tests**
Run: `npm test` in `backend`

**Step 3: Update task tracker**
Update `docs/plans/task.md` with all completed items.

**Step 4: Commit**
`git add -A; git commit -m "chore: verify build and update task tracker"`
