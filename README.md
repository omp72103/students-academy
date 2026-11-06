# Students Academy, Grant Road: Official Website + LMS/ERP + Android App

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

## Go live (shared database)

Demo mode keeps data in each browser separately. For real use, connect Supabase:

1. Create a Supabase project. In the **SQL Editor**, run `supabase/schema.sql`, then `supabase/seed.sql` (institute settings + all saiphy.com material).
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
