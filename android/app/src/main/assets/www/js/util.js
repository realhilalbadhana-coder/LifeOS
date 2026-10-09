/* LifeOS — shared helpers, icons, UI primitives */
var L = window.L || {};
window.L = L;

/* screen registry — must exist before any screen file loads */
L.screens = {};
L.register = (name, def) => { L.screens[name] = def; };

/* ---------- dom ---------- */
L.$ = (sel, root = document) => root.querySelector(sel);
L.$$ = (sel, root = document) => [...root.querySelectorAll(sel)];
L.h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
L.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
L.uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* ---------- icons (feather-ish, stroke=currentColor) ---------- */
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  notes: '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9 12h6M9 16h6"/>',
  tracker: '<path d="M3 20h18"/><rect x="5" y="11" width="3.4" height="6" rx="1"/><rect x="10.3" y="7" width="3.4" height="10" rx="1"/><rect x="15.6" y="13" width="3.4" height="4" rx="1"/>',
  tools: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.3-.6-.6-2.3z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  alarm: '<circle cx="12" cy="13" r="7.5"/><path d="M12 10v3.5l2 1.5"/><path d="M5 3.5 2.5 6M19 3.5 21.5 6"/>',
  timer: '<path d="M12 21a8 8 0 1 0-8-8"/><path d="M12 8v5l3 2"/><path d="M4 4l3 3"/><path d="M18 2v3M16.5 3.5h3"/>',
  pdf: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 13h1.5a1.5 1.5 0 0 1 0 3H9v-3zM9 16v3"/><path d="M14 13h2v6h-2z"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><path d="M14 14h3v3M20 14v.01M14 20h.01M17 20h3v-3"/>',
  convert: '<path d="M4 8h13l-3-3M20 16H7l3 3"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  pin: '<path d="M12 17v4M8 3h8l-1 7 3 3H6l3-3-1-7z"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  chev: '<path d="M9 6l6 6-6 6"/>',
  chevd: '<path d="M6 9l6 6 6-6"/>',
  share: '<path d="M12 16V4M8 8l4-4 4 4"/><path d="M4 14v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"/>',
  download: '<path d="M12 4v12M8 12l4 4 4-4"/><path d="M4 20h16"/>',
  camera: '<path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.5"/>',
  play: '<path d="M7 4.5v15l13-7.5z"/>',
  pause: '<rect x="6.5" y="4.5" width="4" height="15" rx="1"/><rect x="13.5" y="4.5" width="4" height="15" rx="1"/>',
  reset: '<path d="M4 12a8 8 0 1 1 2.5 5.8"/><path d="M4 20v-4h4"/>',
  flag: '<path d="M6 21V4h11l-2 4 2 4H6"/>',
  edit: '<path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  bell2: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
  star: '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.8z"/>',
  fire: '<path d="M12 3c1 3-1 4-1 6a3 3 0 0 0 6 0c0 4-2 5-2 7a4 4 0 0 1-8 0c0-2 1-3 1-5 0-1-1-2-1-3 2 1 3-1 5-5z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
  dumbbell: '<path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M8 3v18"/>',
  heart: '<path d="M12 20s-7-4.3-9-8.5A5 5 0 0 1 12 6a5 5 0 0 1 9 5.5C19 15.7 12 20 12 20z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  layers: '<path d="M12 3 3 8l9 5 9-5z"/><path d="M3 13l9 5 9-5"/>',
  split: '<path d="M12 3v6M12 15v6M7 12H3M21 12h-4"/><circle cx="12" cy="12" r="2.5"/>',
  wand: '<path d="M5 19 17 7"/><path d="M15 3v3M20 8h-3M18 4l-2 2M9 8l1.5 1.5"/>',
  shield: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
};
L.icon = (name, cls = '') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${P[name] || ''}</svg>`;

/* ---------- formatting ---------- */
L.pad = (n) => String(n).padStart(2, '0');
L.fmtBytes = (b) => { if (b == null) return '—'; if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'; return (b / 1048576).toFixed(2) + ' MB'; };
L.fmtTime = (d) => { d = new Date(d); let h = d.getHours(), m = L.pad(d.getMinutes()); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${m} ${ap}`; };
L.fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
L.fmtDateShort = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
L.ymd = (d) => { d = new Date(d); return `${d.getFullYear()}-${L.pad(d.getMonth() + 1)}-${L.pad(d.getDate())}`; };
L.todayYmd = () => L.ymd(new Date());
L.relDay = (ymd) => {
  const t = L.todayYmd();
  const d = new Date(ymd + 'T00:00:00'); const n = new Date(t + 'T00:00:00');
  const diff = Math.round((d - n) / 86400000);
  if (diff === 0) return 'Today'; if (diff === 1) return 'Tomorrow'; if (diff === -1) return 'Yesterday';
  return L.fmtDateShort(d);
};
L.daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
L.startDOW = (y, m) => new Date(y, m, 1).getDay();

/* ---------- toast ---------- */
L.toast = (msg, kind = '') => {
  const t = L.h(`<div class="toast ${kind}">${L.esc(msg)}</div>`);
  document.body.appendChild(t);
  clearTimeout(L._toastT);
  L._toastT = setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .25s'; setTimeout(() => t.remove(), 260); }, 2100);
};

/* ---------- bottom sheet ---------- */
L.sheet = (title, bodyHtml, onMount) => {
  const ov = L.h(`<div class="overlay"><div class="sheet"><div class="handle"></div>${title ? `<h3>${L.esc(title)}</h3>` : ''}<div class="sheet-body">${bodyHtml}</div></div></div>`);
  const close = () => { ov.style.opacity = '0'; ov.style.transition = 'opacity .18s'; setTimeout(() => ov.remove(), 190); };
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  document.body.appendChild(ov);
  onMount && onMount(ov, close);
  return { el: ov, close };
};

L.confirm = (msg, onYes, yesLabel = 'Delete') => {
  L.sheet('', `<p class="sm muted" style="margin-bottom:16px">${L.esc(msg)}</p>
    <div class="row" style="gap:10px"><button class="btn ghost grow" data-no>Cancel</button>
    <button class="btn danger grow" data-yes>${L.esc(yesLabel)}</button></div>`, (ov, close) => {
    L.$('[data-no]', ov).onclick = close;
    L.$('[data-yes]', ov).onclick = () => { close(); onYes(); };
  });
};

/* ---------- file helpers ---------- */
L.pickFiles = (accept, multiple = false) => new Promise(res => {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = accept; inp.multiple = multiple;
  inp.onchange = () => res([...inp.files]);
  inp.click();
});
L.readText = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(file); });
L.readArrayBuffer = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsArrayBuffer(file); });
L.readDataURL = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
L.loadImage = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

/* Save a blob: use the native bridge when present (Android), else browser download. */
L.saveBlob = (blob, filename) => {
  if (window.AndroidBridge && window.AndroidBridge.saveBase64) {
    const r = new FileReader();
    r.onload = () => {
      const b64 = String(r.result).split(',')[1] || '';
      try { window.AndroidBridge.saveBase64(b64, filename, blob.type || 'application/octet-stream'); L.toast('Saved to Downloads', 'ok'); }
      catch (e) { L.toast('Save failed', 'err'); }
    };
    r.readAsDataURL(blob);
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  L.toast('Downloaded ' + filename, 'ok');
};
L.shareBlob = (blob, filename) => {
  if (window.AndroidBridge && window.AndroidBridge.shareBase64) {
    const r = new FileReader();
    r.onload = () => { const b64 = String(r.result).split(',')[1] || ''; try { window.AndroidBridge.shareBase64(b64, filename, blob.type || 'application/octet-stream'); } catch (e) { L.toast('Share failed', 'err'); } };
    r.readAsDataURL(blob);
    return;
  }
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], filename, { type: blob.type })] })) {
    navigator.share({ files: [new File([blob], filename, { type: blob.type })], title: filename }).catch(() => {});
    return;
  }
  L.saveBlob(blob, filename);
};
