# LifeOS

A premium, offline-first personal operating system for Android — habits, calendar,
notes, reminders, a progress tracker and 12 real built-in utility tools, in a
near-black / deep-olive theme with a neon-lime accent.

Built as a from-scratch rebuild: the interface is a self-contained web app that
runs inside a native Android WebView shell.

## Main navigation (5 sections)

- **Home** — greeting, today's progress, overview stats, today's tasks, upcoming
  reminders and quick access.
- **Calendar** — month grid with event dots, day selection, and event creation
  (event / exam / assignment / deadline).
- **Notes** — create, edit, delete, search and pin notes.
- **Tracker** — habits with streaks and a 7-day grid, plus add/reset.
- **Tools** — the 12 multitools below, with search and recents.

Also included: a **Reminders** screen (with notifications) and **Settings**
(name, notification/haptic toggles, backup export/import, clear data, permissions
explained).

## The 12 tools — all real, all offline

1. **PDF Maker** — text to a paginated PDF (jsPDF)
2. **PDF Merge** — combine several PDFs in order (pdf-lib)
3. **Image to PDF** — turn photos into a PDF (jsPDF)
4. **PDF Split** — extract page ranges (pdf-lib)
5. **PDF Compressor** — re-optimise a PDF and report the real size change (pdf-lib)
6. **Image Compressor** — Canvas JPEG re-encode with a quality slider
7. **Image Resizer** — Canvas resize with optional aspect-ratio lock
8. **QR Scanner** — live camera scanning with runtime permission handling (jsQR)
9. **QR Generator** — text/URL to a shareable QR image (qrcode)
10. **Unit Converter** — length, mass/weight and temperature
11. **Stopwatch** — with laps
12. **Countdown Timer** — with a completion chime and notification

All processing happens on the device; nothing is uploaded.

## How it's built

- The interface is plain HTML/CSS/JS in `android/app/src/main/assets/www`, with
  every library vendored under `www/vendor` so it works fully offline.
- A single-screen Android WebView shell (`MainActivity.java`) serves the assets
  over a virtual https origin via `WebViewAssetLoader` — which is what lets the
  camera and modern web APIs work — and bridges native file save/share plus the
  camera and notification permissions.
- All user data is stored locally on the device (`localStorage`).

### Web asset layout

```
www/
  index.html        app shell
  css/app.css       design system (near-black + deep olive + neon lime)
  js/app.js         core: helpers, icons, persistence, router, native bridge
  js/screens.js     Home, Calendar, Notes, Tracker, Tools hub, Reminders, Settings
  js/tools.js       the 12 tools
  vendor/           jspdf · pdf-lib · qrcode · jsQR (bundled locally)
```

## Building the APK

The APK is built by GitHub Actions — no Android Studio needed.

1. Push to `main`, or run the workflow manually from the **Actions** tab.
2. Open the latest **Build Android APK** run.
3. Download the **lifeos-debug-apk** artifact (unzip it to get `app-debug.apk`).

### Installing on your phone

1. Download and unzip the artifact to get `app-debug.apk`.
2. Open it on the phone and allow "Install unknown apps" for your browser / file
   manager if prompted.
3. Install and open LifeOS.

> This is a debug build for personal testing, not a Play Store release.

## Permissions

- **Camera** — requested only while the QR Scanner is open.
- **Notifications** — requested only when you set a reminder.
- **Internet** — declared for the WebView asset loader origin; the app itself
  works offline.

## Limitations

- Reminders and the countdown chime fire while the app is running (a web layer
  cannot schedule background alarms without a native service).
- PDF "compression" re-optimises the file and reports the real size change
  honestly; it cannot rasterise every PDF.
- Release signing is not configured — the workflow produces a debug APK only.
