# Rise & Rep

A phone/iPad-first morning fitness game based on the supplied Mini Room Calisthenics Plan.

## Run it

The app is plain HTML, CSS, and JavaScript. No build step is required.

For local use, run a small web server from this folder:

```sh
python3 -m http.server 4173
```

Then open `http://localhost:4173` on the device or simulator.

## Host it

Upload this entire folder to any static host such as Netlify, Vercel, GitHub Pages, Cloudflare Pages, or an ordinary web server. HTTPS is required for offline/PWA installation on a real device.

## Daily behavior

- Monday, Wednesday, Friday, Saturday: full calisthenics circuit.
- Tuesday, Thursday, Sunday: short recovery quest.
- Every active movement includes a looping inline SVG demonstration, and rest screens preview the next movement.
- Training targets progress after every 4 completed full circuits: Foundation, Build, Strong, then Control. Missed days do not advance or reset the training block.
- Standard push-ups progress 8 → 10 → 12 reps; other movements follow smaller capped increases. Rest progresses 45 → 40 → 35 → 30 seconds.
- Progress, XP, streaks, paused workout state, and trophies are saved in browser `localStorage`.
- The service worker precaches the full app shell, poster, icons, and locally hosted fonts after the first successful load.
- Workout guidance, timers, streaks, and saved progress continue to work offline. A small header badge appears when the device loses its connection.
- When the app comes back online, its runtime cache refreshes automatically.

Progress currently stays on one browser/device. Add an account/database later if cross-device sync becomes useful.
