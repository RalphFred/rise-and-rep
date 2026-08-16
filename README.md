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

## Progress-key cloud sync

Firebase Authentication and Cloud Firestore provide the small cloud layer. The workout remains local-first: it opens and records progress without a connection, then merges durable progress after the signed-in device reconnects.

Cloud sync includes completed days, XP, total checkpoints, levels, streak history, and earned trophies. Active workout timers and notification subscriptions remain device-specific.

### One-time Firebase setup

1. In the [Firebase console](https://console.firebase.google.com/project/rise-and-rep/authentication/providers), open **Authentication → Sign-in method**, choose **Email/Password**, enable the first **Email/Password** switch, and save. Email-link sign-in is not needed. Google can stay disabled.
2. Open **Firestore Database**, create the database in Production mode, and choose the region you prefer.
3. Add these values under **Vercel → Rise & Rep → Settings → Environment Variables**. Use the fields from Firebase's web-app configuration, and apply them to Production and Preview:

   - `FIREBASE_API_KEY`
   - `FIREBASE_AUTH_DOMAIN`
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_STORAGE_BUCKET`
   - `FIREBASE_MESSAGING_SENDER_ID`
   - `FIREBASE_APP_ID`
   - `FIREBASE_MEASUREMENT_ID` (optional)

4. Redeploy Rise & Rep so Vercel Functions receive the environment variables.
5. Publish the included `firestore.rules`. Either paste [firestore.rules](firestore.rules) into **Firestore Database → Rules**, or deploy from this folder:

   ```sh
   npx firebase-tools login
   npx firebase-tools use rise-and-rep
   npx firebase-tools deploy --only firestore:rules
   ```

Each progress key creates a Firebase Email/Password account using a one-way SHA-256-derived internal address. The readable key is the password. It is never stored in Firestore and the internal address is not shown to the player. Each account can only read and write its own `users/{uid}` document. Firebase web configuration is returned to the browser at runtime—as required by the Firebase web SDK—but it is kept out of the tracked source and Git commits. Private progress is protected by Authentication and the Firestore rules.

There is no key-recovery flow. The player must save the generated key in a password manager. Anyone with the key can connect to that progress, so it should not be shared publicly.

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
- Progress-key sign-in has no popup or redirect, so it works consistently from the installed PWA and ordinary Safari/Chrome tabs.
- Connected progress is merged transactionally, so adding a second device does not overwrite completed history already saved on either device.

Without a progress key, progress stays on the current browser/device. After creating or entering a key, durable progress follows that key across devices. Signing out removes the saved key and cloud access from that device while leaving its existing local progress intact.
