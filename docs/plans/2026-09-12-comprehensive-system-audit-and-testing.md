# Comprehensive System Audit, Universal Account Compatibility, and MCP Verification Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use .agent/workflows/execute-plan.md to execute this plan in single-flow mode.

**Goal:** Ensure Ascend has zero user-specific hardcoded data, works flawlessly for any new student account, functions seamlessly on desktop and mobile, and is verified via both Chrome DevTools MCP and Render MCP.

**Architecture:** 
1. Perform static analysis across frontend and backend to identify and eliminate any lingering hardcoded student data, fallback names, or mock data.
2. Fortify empty states and error boundaries across all pages so fresh accounts render gracefully with zero crashes or NaN values.
3. Align GPA Calculator average resolution with official HAC averages to eliminate grade discrepancies.
4. Execute comprehensive browser testing across desktop (1280x800) and mobile (390x844) viewports via Chrome DevTools MCP.
5. Query Render MCP to verify service health, live deploys, container logs, and cloud performance.

**Tech Stack:** React 19, Vite, Tailwind CSS, Cheerio, Express, Chrome DevTools MCP, Render MCP.

---

### Task 1: Audit & Eliminate Hardcoded User Data and Harden New-Account States
- Search for student IDs, names, counselor names, and hardcoded grades across backend and frontend.
- Harden empty states when classes, assignments, or transcript years are empty.
- Align GPA Calculator to prioritize official HAC average.

### Task 2: Responsive Desktop & Mobile Browser Testing via Chrome DevTools MCP
- Test Desktop viewport (1280x800).
- Test Mobile viewport (390x844).
- Inspect console errors via list_console_messages.

### Task 3: Render Cloud Deployment Audit via Render MCP
- Check services, deploys, and container logs.
- Verify memory and CPU health.

### Task 4: Final Verification, Build, and Git Deployment
- Run scraper tests, verify clean frontend build, and push to main.
