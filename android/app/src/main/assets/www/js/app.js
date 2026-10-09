/* LifeOS — app shell, router, bottom navigation */
var L = window.L;

const NAV = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'calendar', label: 'Calendar', icon: 'calendar' },
  { id: 'notes', label: 'Notes', icon: 'notes' },
  { id: 'tracker', label: 'Tracker', icon: 'tracker' },
  { id: 'tools', label: 'Tools', icon: 'tools' },
];

const state = { current: 'home', params: {}, stack: [] };
L.state = state;

function buildNav() {
  const nav = L.$('#nav');
  nav.innerHTML = NAV.map(n => `
    <button class="item ${state.current === n.id ? 'active' : ''}" data-nav="${n.id}">
      <span class="dotwrap">${L.icon(n.icon)}</span>
      <span>${n.label}</span>
    </button>`).join('');
  L.$$('[data-nav]', nav).forEach(b => b.onclick = () => L.go(b.dataset.nav));
}

function renderBar(def, params) {
  const bar = L.$('#appbar');
  const title = typeof def.title === 'function' ? def.title(params) : def.title;
  const sub = typeof def.sub === 'function' ? def.sub(params) : def.sub;
  const actions = (def.bar && def.bar(params)) || [];
  bar.innerHTML = `
    <div class="grow">
      <h1>${L.esc(title || '')}</h1>
      ${sub ? `<div class="sub">${L.esc(sub)}</div>` : ''}
    </div>
    ${actions.map(a => a.avatar
      ? `<button class="avatar" data-act="${a.id}">${L.esc((L.store.data.settings.name || 'U').trim().charAt(0).toUpperCase())}</button>`
      : `<button class="iconbtn" data-act="${a.id}" aria-label="${L.esc(a.label || '')}">${L.icon(a.icon)}</button>`).join('')}`;
  L.$$('[data-act]', bar).forEach(b => {
    const a = actions.find(x => x.id === b.dataset.act);
    if (a && a.on) b.onclick = () => a.on();
  });
}

function paint() {
  const def = L.screens[state.current];
  if (!def) return;
  renderBar(def, state.params);
  const root = L.$('#screen');
  root.innerHTML = '';
  root.scrollTop = 0;
  window.scrollTo(0, 0);
  def.render(root, state.params);
}

function cleanup() { if (L._cleanup) { try { L._cleanup(); } catch (e) { } L._cleanup = null; } }

L.go = (name, params = {}, push = true) => {
  if (!L.screens[name]) { L.toast('Screen not found'); return; }
  cleanup();
  if (push && state.current) state.stack.push({ current: state.current, params: state.params });
  state.current = name; state.params = params || {};
  buildNav(); paint();
};

L.back = () => {
  const prev = state.stack.pop();
  if (prev) { state.current = prev.current; state.params = prev.params; buildNav(); paint(); }
  else L.go('home', {}, false);
};

/* re-render current screen in place (used after data changes) */
L.refresh = () => paint();

/* native back button hook (Android WebView calls window.handleBack) */
window.handleBack = () => {
  if (document.querySelector('.overlay')) {
    // close top sheet
    const ov = document.querySelectorAll('.overlay');
    ov[ov.length - 1].click();
    return true;
  }
  if (state.stack.length) { L.back(); return true; }
  if (state.current !== 'home') { L.go('home', {}, false); return true; }
  return false;
};

/* boot */
L.store.on(() => { /* keep screen fresh on data change if it opts in */ });
L.go('home', {}, false);
