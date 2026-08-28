# Task Tracker

| Task | Status | Description |
|---|---|---|
| 1. Rebrand to Ascend | Done | Updated all UI, metadata, and storage keys to Ascend |
| 2. Strictly Gemini 2.5 Flash Only | Done | Removed all references to 3.7 / 3.6 / 3.5 / 3.1; active model is strictly gemini-2.5-flash |
| 3. Fast PDF Sanitization & Storage Unbloat | Done | Stripped raw binary stream dumps; capped clean text slices to eliminate localStorage lag |
| 4. Fix Enter Key & Staged Submission | Done | Added onKeyDown listener to trigger submission with staged files or text on Enter |
| 5. Request Timeout Safety & Unblocking | Done | Added 20s AbortController timeout to prevent permanent isLoading locks |
| 6. Staged File Attachments Above Input Box | Done | Files stage above message box with class badge and (x) button; no auto-sending |
| 7. Up to 10 Files Batch Upload Limit | Done | Allows up to 10 files simultaneously with clear toast warning if exceeding |
| 8. Precision Auto-Classifier | Done | Word-splitting and subject scoring correctly categorizes Computer Science, Bio, Alg II, Spanish, English, etc. |
| 9. Sleek Class Carousel & Smooth Wheel Scroll | Done | Removed arrow buttons; added smooth horizontal mouse-wheel scroll |
| 10. 3x Wider & Longer Scroll Indicator Bar | Done | Upgraded to h-3 track with 52% wide dynamic moving pill |
| 11. Clean Document Cards & Preview | Done | Stripped raw %PDF binary headers; formatted structured preview cards with title, course badge, and context summary |
| 12. Disable Auto-Send on Ask AI to Tweak | Done | Removed auto-firing of prompt; opens Ascend AI cleanly with no auto-sent messages |
| 13. 3-Pillar Proactive Study Plan Engine | Done | Enforces Homework + Get Ahead (Tomorrow's Notes/Readings) + Upcoming Quiz/Test Prep review blocks |
| 14. Fixed 3D Card Flip (Zero Mirrored Text) | Done | Added explicit transformStyle, backfaceVisibility, and rotateY inline styles to fix reverse text rendering |
| 15. Dynamic Subject & Level Curriculum Intelligence | Done | Created curriculumEngine.js to parse and ground any course level (Spanish 1/2/3/AP, Calc AB/BC, Physics 1/C, etc.) |
| 16. Verification & Build | Done | Verified clean build (exit 0) |
