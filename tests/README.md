# LifeOS — web test suite

Headless tests for the web layer (`android/app/src/main/assets/www`). They run in
[jsdom](https://github.com/jsdom/jsdom), with a real canvas backend
(`@napi-rs/canvas`) so the image tools and QR generator are actually exercised —
no browser or device needed.

## Run

```bash
cd tests
npm install
npm test
```

## What is covered

| File | Checks |
|------|--------|
| `libs.test.js` | pdf-lib create / reload / merge / split; jsQR export; qrcode SVG render |
| `app.test.js` | boot; 19 screens registered; exactly 12 tools; exactly 5 nav items; navigation across every screen; unit converter (length / temp / mass); notes; habits; calendar; reminders; stopwatch; countdown; **real PDF generation** (jsPDF) |
| `canvas.test.js` | Image Resizer → real JPEG at the requested size; Image Compressor → real full-size JPEG; QR Generator → real PNG that **decodes back to the exact input text** (jsQR) |
| `data.test.js` | localStorage persistence; export → import round-trip; calendar month navigation and per-day event filtering; QR scanner graceful fallback when there is no camera |

These same tests run in CI via `.github/workflows/tests.yml` on every push.
