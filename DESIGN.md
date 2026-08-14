# Design lock

## Brief

Designing a daily calisthenics game for one person on phone and iPad. The goal is to turn a supplied room-workout poster into an inviting morning ritual. The tone is energetic, direct, and athletic. The main risks are making habit tracking feel like admin and increasing volume too quickly. The hooks are a “streak fuse” that lights up one segment per completed set and a looping SVG coach that demonstrates the active movement.

## Reference synthesis

- Primary direction: the supplied Mini Room Calisthenics Plan poster.
- Preserve: white canvas, saturated cobalt structure, hot orange action/reward accent, condensed athletic headlines, numbered movement sequence, strong outlined panels.
- Borrow only: Duolingo’s milestone-as-power-up framing; Seven’s small daily quests and achievements; Nike Training Club’s simple activity record and trophies.
- Role rules: orange is reserved for primary actions, XP, and active rewards; cobalt owns navigation, structure, and workout mode; green only means complete.
- Media: use the supplied poster as the original routine reference. Use a consistent code-native SVG figure system for movement coaching, sequence, and fuse graphics. Each movement gets a distinct animation cycle and remains available offline.
- Reject: dark mode, purple gradients, soft wellness styling, decorative emoji, and rounded cards around every section.

## Decision ledger

| Decision | Source | Role | Why |
| --- | --- | --- | --- |
| White/cobalt/orange palette | User poster | Canvas/structure/reward | Makes the app unmistakably related to the source routine. |
| Condensed all-caps display type | User poster | Headlines and compact labels | Keeps the athletic, poster-like voice at phone sizes. |
| Daily workout/recovery split | User poster schedule | Journey logic | Preserves a daily ritual without scheduling the same full circuit every day. |
| Streak fuse | User goal + poster numbering | Primary progress graphic | Makes each completed set physically visible and game-like. |
| Milestone trophies | Duolingo/Nike/Seven research | Long-term reward | Adds reasons to return beyond a single streak number. |
| Full-screen guided mode | Mobile-first constraint | Workout journey | Removes navigation and keeps one large action under the thumb. |
| Local-first persistence | Hostable static constraint | Data | Works without an account or backend and can be deployed anywhere. |
| 13 animated inline SVG demonstrations | User request + existing poster style | Active movement and next-move preview | Makes form easier to understand while staying crisp, lightweight, and fully offline. |
| Progress after 4 completed circuits | User request + official gradual-progression guidance | Training targets | Rewards consistency without increasing load every calendar day or punishing missed sessions. |
| 8→10→12 push-up ladder | NHS 8–12 rep guidance + supplied routine | Rep prescription | Starts at the lower end and moves in small completed-week steps. |
| 45→40→35→30 second rest ladder | User preference | Density progression | Keeps the morning circuit brisk and increases work density as consistency improves. |
| Control block at the top range | User goal + progressive-overload principle | Long-term mastery | Stops endless rep inflation and shifts the challenge toward cleaner 3-count lowering phases. |
