# Students Academy, Grant Road: Official Website + LMS/ERP + Android App

**Live:** https://students-academy.vercel.app · **Portal:** https://students-academy.vercel.app/portal
**Android app (latest):** https://github.com/omp72103/students-academy/releases/latest/download/StudentsAcademy.apk

Every push to `main` redeploys the website on Vercel and rebuilds the APK through GitHub Actions.

## Free SMS & WhatsApp: how it works

| Channel | In the Android app | In a browser |
|---|---|---|
| **SMS** | Sent automatically in the background from the phone's own SIM, using the SIM's SMS pack. No gateway and no per-SMS fee. Dual-SIM phones can pick the SIM. Each message's status (queued → sent → delivered / failed) is saved in Portal → SMS & WhatsApp → Message log. | A guided queue opens the phone's SMS app for each message. |
| **WhatsApp** | Free click-to-chat. The app opens each parent's chat with the message ready; you tap **Send**, and when you come back the next chat opens automatically (Open next / Skip / Stop). | The same guided queue, using wa.me links. |

The Android app sends SMS automatically for absentees (optional auto-SMS when attendance is saved; turn it on in Settings), fee reminders, test results, notices and holiday messages.

Things to know:
- Use a SIM with an **unlimited or large SMS pack**. Many Indian prepaid packs allow about 100 SMS a day; after that the operator charges per SMS.
- Android shows a one-time "This app is sending a large number of SMS" prompt after about 30 messages in 30 minutes. Tick **Always allow**.
- WhatsApp has no free API for unattended bulk sending, and automating the Send button breaks WhatsApp's terms and gets numbers banned. That's why each WhatsApp chat needs one tap on Send. It stays free and the academy's number stays safe.

One codebase that serves three things:

| Part | Where | What it does |
|---|---|---|
| **Official website** | `/` | Home, About, Courses, Study Material (121 PDFs from saiphy.com), Sarav Pariksha, Results, Notices, Contact + enquiry form, WhatsApp button |
| **LMS / ERP portal** | `/portal` | Role-based portal for Management, Faculty, Students and Parents |
| **Android app** | `android/` | WebView app that sends SMS through the academy SIM at no extra cost, opens WhatsApp chats, handles downloads/uploads, and has pull-to-refresh + an offline screen |

## Roles (same model as the Educollo ERP)

| Module | Management | Faculty | Student | Parent |
|---|---|---|---|---|
| Dashboard | Fees, attendance, enquiries, batch strength, test performance | Today's lectures, pending attendance, grading | Attendance %, scores, pending tests, fee balance | Same as student, for their child (multi-child switcher) |
| Enquiries / leads | ✔ full | view & update | — | — |
| Students / admissions | ✔ add, edit, CSV import/export; parent login auto-created | view own batches | — | — |
| Parents, Faculty & Staff | ✔ | — | — | — |
| Batches, Timetable | ✔ | own batches (view) | own timetable | child's timetable |
| Attendance | ✔ | mark P/A/L, notify absentees' parents by SMS/WhatsApp | own record | child's record |
| Study material | ✔ upload/link, public (also on website) or batch-only | ✔ | view | — |
| Online tests | ✔ builder, bulk-paste MCQs, negative marking, shuffle | ✔ | timed test, palette, review-later, auto-submit, tab-switch flag, answer review | see scores |
| Results & analytics | leaderboard, question-wise accuracy, CSV, SMS/WhatsApp results to parents | ✔ | subject-wise analysis | ✔ |
| Assignments | ✔ | create, collect, grade | submit text/photo | view |
| Fees | collect, printable receipt, ledger export, defaulter reminders | — | own fees | child's fees |
| Notices | ✔ (+ publish on website) | ✔ | view | view |
| SMS & WhatsApp | ✔ by batch / defaulters / absentees / <75% attendance, templates, log | ✔ | — | — |
| Website content & Settings | ✔ achievers, institute profile, admission banner | — | — | — |

## Run locally

```bash
cd web
npm install
npm run dev          # http://localhost:5173
```

With no environment variables the app runs in **demo mode**: data is seeded into the browser's localStorage. Demo logins (shown on the login page):

| Role | Login | Password |
|---|---|---|
| Management | admin@studentsacademy.in | admin123 |
| Faculty | sai@studentsacademy.in | faculty123 |
| Student | aarav@student.sa | student123 |
| Parent | aarav.parent@sa.in | parent123 |

## Sign-in options

- **Email + password** for every role, with "Forgot?" reset by email.
- **Continue with Google**: the button appears automatically once the Google provider is enabled in Supabase. Only emails already registered in the portal can get in; anyone else is signed out with a message. In the Android app, Google opens in a Chrome Custom Tab and returns through the `studentsacademy://auth` deep link, because Google blocks sign-in inside WebViews.
- **Supabase setup:** Authentication → URL Configuration → Redirect URLs must include `https://students-academy.vercel.app/**` and `studentsacademy://auth`.

## Production setup (already done)

- **Hosting:** Vercel project `students-academy` (root directory `web/`), connected to this repo.
- **Database:** Supabase project `mitk-campus-erp`, in its own `sa_`-prefixed tables with role-based RLS (`sa_role()`), and storage bucket `sa-files`. The free plan allows only 2 active projects; to move to a dedicated project later, run `supabase/schema.sql` there and change the env vars.
- **Vercel env:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_TABLE_PREFIX=sa_`, `VITE_STORAGE_BUCKET=sa-files`
- **APK signing:** add repo secrets `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD` (Settings → Secrets and variables → Actions) so each build is signed with the same release key and updates install over the old app. Without them the build is debug-signed.

## Go live on a fresh Supabase project

Demo mode keeps data in each browser separately. For real use, connect Supabase:

1. Create a Supabase project. In the **SQL Editor**, run `supabase/schema.sql` and load the material from `web/src/data/materials.js`. Set `VITE_TABLE_PREFIX=sa_`.
2. Go to Authentication → Providers → Email and turn **off** "Confirm email".
3. Create the first admin user (instructions are at the bottom of `schema.sql`).
4. Deploy `web/` to Vercel with the env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. `vercel.json` already handles SPA routing.
5. Log in as admin. Under Settings, fill in the **real address, phone and WhatsApp number**; the website updates immediately. Then add batches, faculty and students (or import `students-import-template.csv`).

When Management creates a student, faculty member or parent, a Supabase Auth login is created for them. Passwords are never stored in the database in this mode.

## Android app

`android/` is a Kotlin WebView app (min Android 8.0) that opens `SITE_URL/portal`.

- **Build without Android Studio:** push this repo to GitHub. `.github/workflows/build-apk.yml` builds the APK, which you download from the run's Artifacts. Use "Run workflow" to pass your live URL.
- **Android Studio:** open `android/`, set `SITE_URL` in `app/build.gradle.kts`, then Build → APK.
- The app exposes `window.AndroidBridge` (`sendSMS`, `sendBulkSMS`, `openWhatsApp`), but only to pages on the academy's own domain. Bulk SMS is sent one message every 2.5 seconds from the phone's SIM.
- `SEND_SMS` is a restricted permission on the Play Store, so **install the APK directly** on the office phone(s), i.e. sideload it rather than publishing it. Students and parents can use the website or install the same APK; SMS features are only used by staff.

## Project layout

```
web/src/data/materials.js   121 study materials from saiphy.com (class, subject, chapter, type, PDF link)
web/src/data/site.js        default institute profile, programs, Sai Sir's profile
web/src/lib/db.js           data layer (demo localStorage ↔ Supabase)
web/src/lib/auth.jsx        login + role permissions
web/src/lib/messaging.js    SMS / WhatsApp (Android bridge with browser fallback) + templates
web/src/site/               official website
web/src/portal/             LMS / ERP portal
supabase/                   schema (RLS) + seed
android/                    WebView app
```

## Before launch: details to fill in

- Address, phone, WhatsApp number and timings (Portal → Settings). saiphy.com does not list these, so placeholders are in place.
- Real toppers/results (Portal → Website Content). The current entries are labelled "Sample".
- Final domain, used for `SITE_URL` in the Android app.
