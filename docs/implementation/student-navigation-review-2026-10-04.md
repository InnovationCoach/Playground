# Student navigation review — October 4, 2026

Live local review using Mia's disposable student account, desktop 1440×900 and mobile 375×812. This is an expert walkthrough, not a study with actual learners.

## Working paths

- Sidebar links opened My Courses, portfolio, community, and messages.
- Portfolio loaded its settings and audience controls after the local services restarted.
- Personalize dashboard was discoverable; Forest color preview, Alt+ArrowUp widget reordering, and Discard preview worked.
- School Calendar rendered twelve months.
- Activity search found Solar Car; Enter opened the activity.
- Mobile menu closed after selection and Escape. Mobile document width equaled viewport width (375px).

## Findings

1. **Session reliability needs investigation.** Initially Auth/Firestore/backend were stopped and the portfolio showed an opaque UNAVAILABLE error. Restarted local services and reseeded disposable accounts, then signed in again. Portfolio/customization loaded. Later, after repeated navigation and reload, dashboard customization reported “Your session has expired. Please sign in again.” This occurred during the same walkthrough; do not count authenticated persistence as passing. A local emulator reset may contribute, but the final error needs investigation rather than an assumed cause.
2. **Messages is a dead end for a new student.** “No conversations yet” and “Select a conversation to start” appear without a conversation or student compose action. Explain how to contact the assigned coach or provide the appropriate action.
3. **Navigation destinations overlap.** My Courses, sidebar PBL Studio, home PBL Programs, and program-card studio links create several entry points without explaining their differences. All three My Courses program cards linked to #/pbl. Sustainable Futures advertised eight activities while its attached list counted nine, including Junior Explorers.
4. **Home is crowded.** Join another class precedes the dashboard; the home includes encouragement, next-step tasks, pace controls, curiosity, quest planning, programs, information, project goals, private notes, and personal goals. Make the next assigned action prominent and move optional sections behind disclosure controls.
5. **Multiple goal destinations need clearer wording.** Sidebar Goal setting, school Learning Goals, project goals, and private personal goals have different meanings. Explain who sees each type and which task the learner should use.
6. **Home routing deserves cleanup.** Returning via the sidebar clears the home hash; one inspected home snapshot included legacy activity launch cards after the dashboard, whereas explicit #/home used the dedicated dashboard branch. Make both paths consistent.

## Limits

No real learner usability participants, image upload, microphone capture, sending messages/posts, or production testing. Calendar had no seeded events. Preview changes were discarded. Restored the normal browser viewport and left the student on home. No product source changes were made during this review.
