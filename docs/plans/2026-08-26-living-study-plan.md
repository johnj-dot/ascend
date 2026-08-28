# Living Master Study Plan & Auto-Sorting Knowledge Base Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Single-flow task execution.

**Goal:** Implement the complete study plan intake flow, 4–5 question conversational assessment, direct chat document upload with automatic class sorting, daily learning notes, and spaced repetition review schedule.

**Architecture:** 
- Gemini 3.6/3.7 proxy in Node.js with intelligent document-to-course classification and study plan generation.
- Zustand stores (\useDocStore\, \useAiStore\) for persistent knowledge documents, daily notes, and living study routines.
- Seamless navigation between \/study-plan\ and \/ai\ with pre-populated prompts and artifact syncing.

---

### Task 1: Store Enhancement (Daily Notes & Study Plan Artifact Sync)
- Update \rontend/src/store/useDocStore.js\ to support daily notes.
- Update \rontend/src/store/useAiStore.js\ to support direct study plan artifact injection.

### Task 2: Backend Prompt & Auto-Classification Endpoint
- Update \ackend/server.js\ with the 4–5 question assessment instructions.
- Add document auto-classification logic matching files to user classes.
- Update \/api/ai/study-plan\ with spaced repetition support.

### Task 3: In-Chat File Upload & Automatic Sorting
- Update \rontend/src/pages/AscendAI.jsx\ with multiple file upload support via paperclip.
- Auto-tag and save documents into \useDocStore\ per class.
- Handle navigation state with \initialPrompt\.
- Render \study_plan\ artifact card with 'Open in Study Plan' action.

### Task 4: Study Plan Empty State & Living Schedule View
- Update \rontend/src/pages/StudyPlan.jsx\ with empty state and 'Let Ascend AI make your plan' button.
- Render day-by-day roadmap with spaced review tags and planner sync.

### Task 5: Verification & End-to-End Testing
- Test backend endpoints with \
ode -e\.
- Test frontend production build (\
pm run build\).
