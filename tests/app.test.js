/* Boots the app in jsdom and exercises navigation, tools, notes, habits,
   calendar, reminders, the unit converter, and real PDF generation. */
const { JSDOM, VirtualConsole } = require('jsdom');
const { INDEX, reporter } = require('./helpers');
const { ok, finish } = reporter('app');

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => { const m = '' + (e && e.message); if (m.indexOf('scrollTo') < 0 && m.indexOf('getContext') < 0) errors.push(m); });

JSDOM.fromFile(INDEX, {
  runScripts: 'dangerously', resources: 'usable', pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(window) {
    const { TextEncoder, TextDecoder } = require('util');
    window.TextEncoder = TextEncoder; window.TextDecoder = TextDecoder; // present in every real browser
  },
}).then(dom => new Promise(res => dom.window.addEventListener('load', () => setTimeout(() => res(dom.window), 300))))
  .then(window => {
    const L = window.L, doc = window.document;

    ok('L namespace + store', !!(L && L.store && L.store.data));
    const expected = ['home', 'calendar', 'notes', 'tracker', 'tools', 'reminders', 'settings',
      'tool-pdf-maker', 'tool-pdf-merge', 'tool-img-pdf', 'tool-pdf-split', 'tool-pdf-compress',
      'tool-img-compress', 'tool-img-resize', 'tool-qr-scan', 'tool-qr-gen', 'tool-unit-convert',
      'tool-stopwatch', 'tool-timer'];
    ok('all 19 screens registered', expected.every(s => L.screens[s]),
      expected.filter(s => !L.screens[s]).join(',') || 'none missing');
    ok('exactly 12 tools in the hub', L.TOOLS.length === 12, 'count=' + L.TOOLS.length);
    ok('exactly 5 bottom-nav items', doc.querySelectorAll('#nav .item').length === 5,
      'count=' + doc.querySelectorAll('#nav .item').length);

    let navErr = '';
    for (const s of expected) { try { L.go(s); } catch (e) { navErr += s + ':' + e.message + ' '; } }
    ok('navigation across every screen throws nothing', navErr === '', navErr);

    // unit converter
    L.go('tool-unit-convert');
    const set = (id, v) => { const el = doc.getElementById(id); el.value = v; el.dispatchEvent(new window.Event('input')); el.dispatchEvent(new window.Event('change')); };
    set('uc-type', 'length'); set('uc-from', 'km'); set('uc-to', 'm'); set('uc-val', '1');
    ok('unit: 1 km -> 1000 m', /1000/.test(doc.getElementById('uc-out').textContent), doc.getElementById('uc-out').textContent);
    set('uc-type', 'temp'); set('uc-from', 'C'); set('uc-to', 'F'); set('uc-val', '100');
    ok('unit: 100 C -> 212 F', /212/.test(doc.getElementById('uc-out').textContent), doc.getElementById('uc-out').textContent);
    set('uc-type', 'mass'); set('uc-from', 'kg'); set('uc-to', 'lb'); set('uc-val', '1');
    ok('unit: 1 kg -> 2.2046 lb', /2\.204/.test(doc.getElementById('uc-out').textContent), doc.getElementById('uc-out').textContent);

    // notes
    L.store.add('notes', { title: 'Test note', body: 'hello', pinned: true, updated: Date.now() });
    L.go('notes');
    ok('note added + rendered', doc.getElementById('screen').textContent.indexOf('Test note') >= 0);

    // habits
    L.store.add('habits', { name: 'Test habit', icon: 'target', created: Date.now(), log: {} });
    L.go('tracker');
    doc.querySelector('#t-list [data-tick]').click();
    ok('habit toggles to done', !!(L.store.data.habits[0].log && L.store.data.habits[0].log[L.todayYmd()]));

    // calendar + reminders render
    L.store.add('events', { title: 'Exam', date: L.todayYmd(), time: '10:00', type: 'exam' });
    L.go('calendar');
    ok('calendar renders its event', doc.getElementById('screen').textContent.indexOf('Exam') >= 0);
    L.store.add('reminders', { title: 'Ping', datetime: Date.now() + 60000, repeat: 'none', priority: 'high', done: false });
    L.go('reminders');
    ok('reminders render', doc.getElementById('screen').textContent.indexOf('Ping') >= 0);

    // timers
    L.go('tool-stopwatch');
    ok('stopwatch renders', doc.getElementById('screen').textContent.indexOf('00:00:00.00') >= 0);
    L.go('tool-timer');
    ok('countdown timer renders', !!doc.getElementById('cd-d'));

    // real PDF generation
    L.go('tool-pdf-maker');
    doc.getElementById('pm-text').value = 'Hello LifeOS PDF';
    let saved = null;
    L.saveBlob = (blob, name) => { saved = { size: blob.size, name }; };
    doc.getElementById('pm-go').click();
    ok('PDF Maker produces a real PDF blob', !!saved && saved.size > 200 && /\.pdf$/.test(saved.name),
      saved ? saved.name + ' ' + saved.size + 'B' : 'no output');

    if (errors.length) console.log('page errors: ' + errors.slice(0, 4).join(' | '));
    finish();
  }).catch(e => { console.error('CRASH', e); process.exit(2); });
