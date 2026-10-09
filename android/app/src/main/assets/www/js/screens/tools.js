/* LifeOS — Tools hub (the 12 multitools) */
var L = window.L;
const toolsState = { q: '' };

const TOOLS = [
  { id: 'pdf-maker', name: 'PDF Maker', desc: 'Turn text into a PDF', icon: 'pdf', cat: 'PDF', screen: 'tool-pdf-maker' },
  { id: 'pdf-merge', name: 'PDF Merge', desc: 'Combine PDFs into one', icon: 'layers', cat: 'PDF', screen: 'tool-pdf-merge' },
  { id: 'img-pdf', name: 'Image to PDF', desc: 'Photos into a PDF', icon: 'image', cat: 'PDF', screen: 'tool-img-pdf' },
  { id: 'pdf-split', name: 'PDF Split', desc: 'Extract page ranges', icon: 'split', cat: 'PDF', screen: 'tool-pdf-split' },
  { id: 'pdf-compress', name: 'PDF Compressor', desc: 'Shrink a PDF file', icon: 'wand', cat: 'PDF', screen: 'tool-pdf-compress' },
  { id: 'img-compress', name: 'Image Compressor', desc: 'Reduce image size', icon: 'image', cat: 'Image', screen: 'tool-img-compress' },
  { id: 'img-resize', name: 'Image Resizer', desc: 'Resize by width/height', icon: 'layers', cat: 'Image', screen: 'tool-img-resize' },
  { id: 'qr-scan', name: 'QR Scanner', desc: 'Scan codes with camera', icon: 'camera', cat: 'QR', screen: 'tool-qr-scan' },
  { id: 'qr-gen', name: 'QR Generator', desc: 'Make a QR code', icon: 'qr', cat: 'QR', screen: 'tool-qr-gen' },
  { id: 'unit-convert', name: 'Unit Converter', desc: 'Length, weight, temp', icon: 'convert', cat: 'Utility', screen: 'tool-unit-convert' },
  { id: 'stopwatch', name: 'Stopwatch', desc: 'Time with laps', icon: 'clock', cat: 'Utility', screen: 'tool-stopwatch' },
  { id: 'timer', name: 'Countdown', desc: 'Custom countdown timer', icon: 'timer', cat: 'Utility', screen: 'tool-timer' },
];
L.TOOLS = TOOLS;
L.openTool = (id) => {
  const t = TOOLS.find(x => x.id === id); if (!t) return;
  const r = L.store.data.recentTools.filter(x => x !== id); r.unshift(id);
  L.store.data.recentTools = r.slice(0, 4); L.store.save();
  L.go(t.screen, {});
};

L.register('tools', {
  title: 'Tools',
  sub: () => '12 multitools',
  bar: () => [{ id: 'set', icon: 'settings', label: 'Settings', on: () => L.go('settings') }],
  render(root) {
    const recent = L.store.data.recentTools.map(id => TOOLS.find(t => t.id === id)).filter(Boolean);
    root.innerHTML = `
      <div style="position:relative;margin-bottom:14px">
        <input class="field" id="t-q" placeholder="Search tools…" value="${L.esc(toolsState.q)}" style="margin:0;padding-left:42px">
        <span style="position:absolute;left:13px;top:12px;color:var(--muted)">${L.icon('search')}</span>
      </div>
      ${recent.length && !toolsState.q ? `<div class="sec-title"><h2>Recent</h2></div><div class="scroll-x" id="recent"></div>` : ''}
      <div class="sec-title"><h2>All tools</h2></div>
      <div class="toolgrid" id="grid"></div>`;
    if (recent.length && !toolsState.q) {
      L.$('#recent', root).innerHTML = recent.map(t => `<button class="card" style="margin:0;min-width:120px;text-align:left" data-t="${t.id}"><span class="ico-badge">${L.icon(t.icon)}</span><div style="font-weight:700;margin-top:8px" class="sm">${t.name}</div></button>`).join('');
    }
    renderGrid(root);
    L.$('#t-q', root).oninput = (e) => { toolsState.q = e.target.value; renderGrid(root); };
    L.$$('[data-t]', root).forEach(b => b.onclick = () => L.openTool(b.dataset.t));
  }
});

function renderGrid(root) {
  const q = toolsState.q.toLowerCase().trim();
  const list = TOOLS.filter(t => !q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.cat.toLowerCase().includes(q));
  const grid = L.$('#grid', root);
  if (!list.length) { grid.innerHTML = `<div class="card flat center muted sm" style="grid-column:1/-1">No tools match “${L.esc(toolsState.q)}”</div>`; return; }
  grid.innerHTML = list.map(t => `<button class="tool" data-t="${t.id}"><span class="ic">${L.icon(t.icon)}</span><span class="t">${t.name}</span><span class="d">${t.desc}</span></button>`).join('');
  L.$$('[data-t]', grid).forEach(b => b.onclick = () => L.openTool(b.dataset.t));
}

/* shared small helper for tool screens */
L.toolShell = (root, title, subtitle, body) => {
  root.innerHTML = `
    <button class="btn ghost sm" id="t-back" style="margin-bottom:14px">${L.icon('back')} All tools</button>
    <div class="card raised"><div style="font-weight:700;font-size:16px">${L.esc(title)}</div>
    <div class="muted sm" style="margin-top:3px">${L.esc(subtitle || '')}</div></div>
    ${body}`;
  L.$('#t-back', root).onclick = () => L.go('tools');
};
