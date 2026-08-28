# Multi-Video Interactive Lessons & Study Plan Launch Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Build a dedicated, multi-video interactive lesson workspace in Ascend Canvas with step-by-step gated progression, curated YouTube tutorial clips, post-concept interactive checkpoints (MCQ + Fill-in-the-blank), cheat sheet notes, and seamless one-click launching from Study Plan task cards.

**Architecture:**
- **Frontend Workspace**: Create `InteractiveLessonCanvas.jsx` in `frontend/src/components/canvas/` supporting multi-module flow, embedded responsive YouTube player with custom URL paste capability, post-concept mastery checkpoints, and celebration summary.
- **Canvas Integration**: Connect `InteractiveLessonCanvas` into `AscendCanvas.jsx` for `type="interactive_lesson"` and `type="lesson"`.
- **Study Plan Launch & Labeling**: Update `StudyPlan.jsx` to render clear task headers (`?? Due Assignment from [Course]: [Topic]`, `?? Lesson on [Course]: [Topic]`, `?? Quiz Prep on [Course]: [Topic]`), and make clicking either the task card OR the launch button immediately open that topic's full interactive video lesson.
- **Backend AI Engine**: Update `backend/server.js` and `backend/curriculumEngine.js` with curated high-yield YouTube educational videos (Khan Academy, Organic Chem Tutor, Señor Jordan, Mr. Sinn, Crash Course) and structured JSON schemas for multi-module interactive lessons.

**Tech Stack:** React 19, Tailwind CSS, Lucide Icons, Canvas Confetti, Groq API (`openai/gpt-oss-120b`), YouTube IFrame API

---

### Task 1: Video Curation Engine in `backend/curriculumEngine.js`
- Modify: `backend/curriculumEngine.js`

### Task 2: Update AI System Prompt & Lesson Generator in `backend/server.js`
- Modify: `backend/server.js`

### Task 3: Build `InteractiveLessonCanvas.jsx` Workspace
- Create: `frontend/src/components/canvas/InteractiveLessonCanvas.jsx`
- Modify: `frontend/src/components/canvas/AscendCanvas.jsx`

### Task 4: Study Plan Task Labeling & One-Click Launch in `frontend/src/pages/StudyPlan.jsx`
- Modify: `frontend/src/pages/StudyPlan.jsx`

### Task 5: End-to-End Build & Verification
