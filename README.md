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

Deploy the repository to Vercel. HTTPS is required for offline/PWA installation and Web Push on a real device.

## Morning push reminders

Rise & Rep can send a real push at **6:30 AM Africa/Lagos time** while the installed PWA is closed. The Vercel cron runs at `05:30 UTC` once a day, so it is compatible with Vercel's daily cron allowance.

The notification UI is safe to deploy before the service is configured: it will explain that reminders are not ready instead of creating a broken subscription.

### One-time Vercel setup

1. In the Vercel project, open **Storage**, create an Upstash Redis database, and connect it to Rise & Rep.
2. Confirm the integration created `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. If it used different names, add these two aliases in **Settings → Environment Variables**.
3. Generate Web Push keys locally:

   ```sh
   npx web-push generate-vapid-keys
   ```

4. Add the following Production environment variables in Vercel:

   - `VAPID_PUBLIC_KEY`: the generated public key
   - `VAPID_PRIVATE_KEY`: the generated private key
   - `VAPID_SUBJECT`: a contact URI such as `mailto:you@example.com`
   - `CRON_SECRET`: a long random value; generate one with `openssl rand -base64 32`

5. Redeploy once so the functions and cron receive the new environment variables.
6. Open the installed Home Screen app, tap **Enable** in the Morning Reminder card, and allow notifications. A confirmation notification appears immediately.

Keep the VAPID private key, Redis token, and cron secret out of Git. `.env*` files are ignored by default.

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
- The Morning Reminder card registers or removes a Web Push subscription for the current device.
- The scheduled reminder uses a Vercel Function and Redis because iOS cannot reliably run an offline web timer after the PWA closes.
- Workout screens remain offline-capable. The device needs an internet connection when a push is delivered.

Progress currently stays on one browser/device. Add an account/database later if cross-device sync becomes useful.
