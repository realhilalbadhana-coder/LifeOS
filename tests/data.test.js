/* Persistence, calendar date changes, and the QR scanner's graceful fallback. */
const { JSDOM, VirtualConsole, ResourceLoader } = require('jsdom');
const fs = require('fs');
const path = require('path');
const { INDEX, ORIGIN, reporter } = require('./helpers');
const { ok, finish } = reporter('data');

const vc = new VirtualConsole();
vc.on('jsdomError', e => { const m = '' + (e && e.message); if (m.indexOf('scrollTo') < 0) console.log('  (page) ' + m); });

/* Serve assets from the WebView's https origin so localStorage is available. */
class LocalAssets extends ResourceLoader {
  fetch(url) {
    const p = decodeURIComponent(new URL(url).pathname).replace('/assets/www/', '');
    const file = path.join(path.dirname(INDEX), p);
    return fs.existsSync(file) ? Promise.resolve(fs.readFileSync(file)) : null;
  }
}

Promise.resolve(new JSDOM(fs.readFileSync(INDEX, 'utf8'), {
  url: ORIGIN + 'index.html',
  runScripts: 'dangerously', resources: new LocalAssets(), pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(window) {
    const { TextEncoder, TextDecoder } = require('util');
    window.TextEncoder = TextEncoder; window.TextDecoder = TextDecoder;
  },
})).then(dom => new Promise(res => dom.window.addEventListener('load', () => setTimeout(() => res(dom.window), 300))))
  .then(window => {
    const L = window.L, doc = window.document;

    // persistence round-trip
    L.store.add('notes', { title: 'Persisted', body: 'x', updated: Date.now() });
    let parsed = null; try { parsed = JSON.parse(window.localStorage.getItem('lifeos.v2')); } catch (e) { }
    ok('data written to localStorage', !!parsed && parsed.notes.some(n => n.title === 'Persisted'));
    const backup = L.store.exportJSON();
    L.store.reset();
    ok('reset clears notes', L.store.data.notes.length === 0);
    L.store.importJSON(backup);
    ok('export -> import restores data', L.store.data.notes.some(n => n.title === 'Persisted'));

    // calendar month navigation + date changes
    L.go('calendar');
    const t0 = doc.getElementById('c-title').textContent;
    doc.getElementById('c-next').click(); const t1 = doc.getElementById('c-title').textContent;
    doc.getElementById('c-prev').click(); doc.getElementById('c-prev').click(); const t2 = doc.getElementById('c-title').textContent;
    ok('calendar navigates months', t0 !== t1 && t1 !== t2, t0 + ' / ' + t1 + ' / ' + t2);

    const tomorrow = L.ymd(new Date(Date.now() + 86400000));
    L.store.add('events', { title: 'TomorrowOnly', date: tomorrow, time: '09:00', type: 'exam' });
    L.go('calendar');
    ok('event hidden on the wrong day', doc.getElementById('c-events').textContent.indexOf('TomorrowOnly') < 0);
    doc.querySelector('.day[data-date="' + tomorrow + '"]').click();
    ok('event shows on its own day', doc.getElementById('c-events').textContent.indexOf('TomorrowOnly') >= 0);
    ok('selected-day label updates', doc.getElementById('c-daylabel').textContent === 'Tomorrow',
      doc.getElementById('c-daylabel').textContent);

    // QR scanner graceful fallback (no camera in this environment)
    L.go('tool-qr-scan');
    let crashed = false;
    try { doc.getElementById('qs-start').click(); } catch (e) { crashed = true; }
    const toast = doc.querySelector('.toast');
    ok('QR scanner: no camera -> graceful, no crash', !crashed && !!toast, toast ? toast.textContent : 'no toast');

    finish();
  }).catch(e => { console.error('CRASH', e); process.exit(2); });
