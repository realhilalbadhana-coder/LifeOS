# LifeOS

A premium, all-in-one daily-life and student productivity app for Android —
habit tracking, calendar, notes, reminders, a progress tracker and 12 built-in
utility tools, in a polished dark theme with a neon-lime accent.

## What's inside

**Five main sections (bottom navigation)**

- **Home** — greeting, today's progress ring, quick tools, today's tasks,
  habit cards, upcoming events and reminders.
- **Calendar** — month grid, day/agenda views, event creation (exam /
  assignment / deadline types), persistent storage.
- **Notes** — create, edit, delete, search, folders, pin, favourites,
  checklists, auto-save and timestamps.
- **Tracker** — habits with streaks and weekly grids, study-time logging,
  workout logging, custom goals, weekly charts.
- **Tools** — the 12 multitools below, with search and recents.

**The 12 multitools**

1. PDF Maker (text → PDF) 2. PDF Merge 3. Image to PDF 4. PDF Split
5. PDF Compressor 6. Image Compressor 7. Image Resizer 8. QR Scanner (camera)
9. QR Generator 10. Unit Converter 11. Stopwatch 12. Countdown Timer

Also included: a Reminders section (with notifications), an Alarm section, and
Settings with backup export/import and privacy info.

## Design

The visual language follows the supplied reference: near-black olive background
(`#0A0B00`), neon-lime accent (`#EAFF55`), rounded cards with subtle borders,
soft gradients, minimal outline icons and a lime-highlighted bottom navigation.

## How it's built

- The interface is a self-contained web app (plain HTML/CSS/JS) in
  `android/app/src/main/assets/www`, with all libraries vendored locally so it
  works fully offline.
- An Android WebView shell (`MainActivity.java`) serves those assets over a
  virtual https origin (WebViewAssetLoader) so the camera and modern web APIs
  work, and bridges native file save / share and the camera permission.
- All user data is stored locally on the device (`localStorage`). Nothing is
  uploaded anywhere.

## Building the APK

The APK is built by GitHub Actions — no Android Studio needed.

1. Push to `main` (or run the workflow manually from the **Actions** tab).
2. Open the latest **Build Android APK** run.
3. Download the **lifeos-debug-apk** artifact.

### Installing on your phone

1. Download `app-debug.apk` from the workflow artifact (unzip the artifact).
2. Open it on the phone and allow "Install unknown apps" for your browser /
   file manager if prompted.
3. Install and open LifeOS.

> This is a debug build for personal testing, not a Play Store release.

## Limitations

- Reminders and alarms fire notifications while the app is running (a web
  layer cannot schedule background alarms without a native service).
- PDF "compression" re-optimises the file and reports the real size change
  honestly; it cannot rasterise every PDF.
- Release signing is not configured — the workflow produces a debug APK only.
