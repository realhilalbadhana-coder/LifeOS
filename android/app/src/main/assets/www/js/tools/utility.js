/* LifeOS — Utility tools */
var L = window.L;

/* 10 — Unit converter */
const UNITS = {
  Length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 },
  Weight: { kg: 1, g: 0.001, mg: 1e-6, t: 1000, lb: 0.45359237, oz: 0.028349523125 },
  Temperature: 'special',
};
L.register('tool-unit-convert', {
  title: 'Unit Converter', sub: 'Length · Weight · Temperature',
  render(root) {
    L.toolShell(root, 'Unit Converter', 'Accurate conversions across common units',
      `<div class="card">
        <div class="seg" id="uc-cat" style="margin-bottom:14px">
          ${Object.keys(UNITS).map((c, i) => `<button class="${i === 0 ? 'active' : ''}" data-c="${c}">${c}</button>`).join('')}
        </div>
        <input class="field" id="uc-in" type="number" inputmode="decimal" placeholder="Value" value="1">
        <div class="row" style="gap:10px">
          <select class="field grow" id="uc-from"></select>
          <button class="iconbtn" id="uc-swap" style="flex:none">${L.icon('convert')}</button>
          <select class="field grow" id="uc-to"></select>
        </div>
        <div class="card lime center" style="margin:6px 0 0"><div class="tiny" style="opacity:.7">Result</div><div class="big" id="uc-out">1</div></div>
      </div>`);
    let cat = 'Length';
    const from = L.$('#uc-from', root), to = L.$('#uc-to', root), inEl = L.$('#uc-in', root), out = L.$('#uc-out', root);
    const fill = () => {
      const keys = cat === 'Temperature' ? ['C', 'F', 'K'] : Object.keys(UNITS[cat]);
      from.innerHTML = keys.map(k => `<option>${k}</option>`).join('');
      to.innerHTML = keys.map(k => `<option>${k}</option>`).join('');
      to.selectedIndex = Math.min(1, keys.length - 1);
      convert();
    };
    const convert = () => {
      const v = parseFloat(inEl.value); if (isNaN(v)) { out.textContent = '—'; return; }
      let res;
      if (cat === 'Temperature') {
        let c = from.value === 'C' ? v : from.value === 'F' ? (v - 32) * 5 / 9 : v - 273.15;
        res = to.value === 'C' ? c : to.value === 'F' ? c * 9 / 5 + 32 : c + 273.15;
      } else {
        const f = UNITS[cat][from.value], t = UNITS[cat][to.value];
        res = v * f / t;
      }
      out.textContent = (+res.toPrecision(8)).toString();
    };
    L.$$('[data-c]', root).forEach(b => b.onclick = () => { cat = b.dataset.c; L.$$('[data-c]', root).forEach(x => x.classList.toggle('active', x === b)); fill(); });
    inEl.oninput = convert; from.onchange = convert; to.onchange = convert;
    L.$('#uc-swap', root).onclick = () => { const a = from.value; from.value = to.value; to.value = a; convert(); };
    fill();
  }
});

/* 11 — Stopwatch */
L.register('tool-stopwatch', {
  title: 'Stopwatch', sub: 'Start · pause · laps',
  render(root) {
    L.toolShell(root, 'Stopwatch', 'Precise timing that stays accurate in the background',
      `<div class="card center"><div class="big mono" id="sw-time" style="font-size:44px;letter-spacing:-1px">00:00.00</div>
      <div class="row mt2" style="gap:10px"><button class="btn grow" id="sw-main">${L.icon('play')} Start</button>
      <button class="btn ghost" id="sw-lap">Lap</button></div>
      <div class="list mt" id="sw-laps"></div></div>`);
    const sw = { start: 0, acc: 0, running: false, laps: [] };
    L._cleanup = () => { clearInterval(sw.timer); };
    const fmt = (ms) => { const cs = Math.floor(ms / 10) % 100, s = Math.floor(ms / 1000) % 60, m = Math.floor(ms / 60000); return `${L.pad(m)}:${L.pad(s)}.${L.pad(cs)}`; };
    const elapsed = () => sw.acc + (sw.running ? performance.now() - sw.start : 0);
    const draw = () => {
      L.$('#sw-time', root).textContent = fmt(elapsed());
      const m = L.$('#sw-main', root);
      m.innerHTML = sw.running ? L.icon('pause') + ' Pause' : (sw.acc > 0 ? L.icon('play') + ' Resume' : L.icon('play') + ' Start');
      m.classList.toggle('soft', sw.running);
    };
    L.$('#sw-main', root).onclick = () => {
      if (sw.running) { sw.acc += performance.now() - sw.start; sw.running = false; clearInterval(sw.timer); }
      else { sw.start = performance.now(); sw.running = true; sw.timer = setInterval(draw, 31); }
      draw();
    };
    L.$('#sw-lap', root).onclick = () => {
      if (!sw.running && sw.acc === 0) return;
      sw.laps.push(elapsed()); drawLaps();
    };
    const drawLaps = () => {
      const laps = sw.laps; const list = L.$('#sw-laps', root);
      list.innerHTML = laps.map((t, i) => `<div class="item-card"><span class="ico-badge">${i + 1}</span><div class="grow mono">${fmt(t - (laps[i - 1] || 0))}</div><span class="muted mono">${fmt(t)}</span></div>`).join('');
    };
    // long-press reset via double tap on the time
    L.$('#sw-time', root).ondblclick = () => { sw.running = false; clearInterval(sw.timer); sw.acc = 0; sw.laps = []; draw(); drawLaps(); L.toast('Reset'); };
    draw();
  }
});

/* 12 — Countdown timer */
L.register('tool-timer', {
  title: 'Countdown', sub: 'Custom timer',
  render(root) {
    L.toolShell(root, 'Countdown Timer', 'Set a duration — you get a sound and notification when it ends',
      `<div class="card center">
        <div class="big mono" id="tm-time" style="font-size:46px;letter-spacing:-1px">00:00</div>
        <div class="row" style="gap:8px;justify-content:center;margin:14px 0">
          ${[1, 3, 5, 10, 15, 25].map(m => `<button class="chip" data-min="${m}">${m}m</button>`).join('')}
        </div>
        <div class="row" style="gap:10px">
          <input class="field grow" id="tm-m" type="number" placeholder="min" value="5" style="margin:0">
          <input class="field grow" id="tm-s" type="number" placeholder="sec" value="0" style="margin:0">
        </div>
        <div class="row mt" style="gap:10px"><button class="btn grow" id="tm-main">${L.icon('play')} Start</button>
        <button class="btn ghost" id="tm-reset">Reset</button></div>
      </div>`);
    const tm = { end: 0, remaining: 0, running: false };
    L._cleanup = () => clearInterval(tm.timer);
    const fmt = (ms) => { ms = Math.max(0, ms); const s = Math.ceil(ms / 1000); return `${L.pad(Math.floor(s / 60))}:${L.pad(s % 60)}`; };
    const draw = () => {
      L.$('#tm-time', root).textContent = fmt(tm.running ? tm.end - Date.now() : tm.remaining);
      const m = L.$('#tm-main', root);
      m.innerHTML = tm.running ? L.icon('pause') + ' Pause' : (tm.remaining > 0 ? L.icon('play') + ' Resume' : L.icon('play') + ' Start');
      m.classList.toggle('soft', tm.running);
    };
    const beep = () => {
      try {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        [0, 0.25, 0.5].forEach((t, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ac.destination); g.gain.setValueAtTime(0.001, ac.currentTime + t); g.gain.exponentialRampToValueAtTime(0.3, ac.currentTime + t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + 0.2); o.start(ac.currentTime + t); o.stop(ac.currentTime + t + 0.22); });
      } catch (e) { }
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      if ('Notification' in window && Notification.permission === 'granted') { try { new Notification('LifeOS', { body: 'Timer finished' }); } catch (e) { } }
      L.toast('Timer finished', 'ok');
    };
    const finish = () => { tm.running = false; clearInterval(tm.timer); tm.remaining = 0; draw(); beep(); };
    L.$('#tm-main', root).onclick = () => {
      if (tm.running) { tm.remaining = tm.end - Date.now(); tm.running = false; clearInterval(tm.timer); }
      else {
        if (tm.remaining <= 0) { tm.remaining = ((+L.$('#tm-m', root).value || 0) * 60 + (+L.$('#tm-s', root).value || 0)) * 1000; }
        if (tm.remaining <= 0) return L.toast('Set a duration');
        tm.end = Date.now() + tm.remaining; tm.running = true;
        tm.timer = setInterval(() => { if (Date.now() >= tm.end) finish(); else draw(); }, 200);
      }
      draw();
    };
    L.$('#tm-reset', root).onclick = () => { tm.running = false; clearInterval(tm.timer); tm.remaining = 0; draw(); };
    L.$$('[data-min]', root).forEach(b => b.onclick = () => { L.$('#tm-m', root).value = b.dataset.min; L.$('#tm-s', root).value = 0; tm.remaining = 0; draw(); });
    draw();
  }
});
