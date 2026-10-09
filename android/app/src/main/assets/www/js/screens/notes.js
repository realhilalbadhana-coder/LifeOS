/* LifeOS — Notes (list + editor) */
var L = window.L;
const notesState = { q: '', filter: 'all' };

function noteFolders() { return [...new Set(L.store.data.notes.map(n => n.folder).filter(Boolean))]; }
function noteSnippet(n) {
  if (n.checklist && n.checklist.length) return `${n.checklist.filter(c => c.done).length}/${n.checklist.length} done`;
  return (n.body || '').replace(/\n/g, ' ').slice(0, 80) || 'Empty note';
}

L.register('notes', {
  title: 'Notes',
  sub: () => `${L.store.data.notes.length} note${L.store.data.notes.length === 1 ? '' : 's'}`,
  bar: () => [{ id: 'add', icon: 'plus', label: 'New note', on: () => L.newNote() }],
  render(root) {
    root.innerHTML = `
      <div class="row" style="gap:10px;margin-bottom:12px">
        <div class="grow" style="position:relative">
          <input class="field" id="n-q" placeholder="Search notes…" value="${L.esc(notesState.q)}" style="margin:0;padding-left:42px">
          <span style="position:absolute;left:13px;top:12px;color:var(--muted)">${L.icon('search')}</span>
        </div>
      </div>
      <div class="chips" id="n-filters" style="margin-bottom:14px"></div>
      <div class="list" id="n-list"></div>
      <button class="fab" data-add>${L.icon('plus')}</button>`;

    const filters = [{ id: 'all', label: 'All' }, { id: 'pinned', label: 'Pinned' }, { id: 'fav', label: 'Favourites' }, ...noteFolders().map(f => ({ id: 'f:' + f, label: f }))];
    L.$('#n-filters', root).innerHTML = filters.map(f => `<button class="chip ${notesState.filter === f.id ? 'active' : ''}" data-f="${L.esc(f.id)}">${L.esc(f.label)}</button>`).join('');
    L.$$('[data-f]', root).forEach(b => b.onclick = () => { notesState.filter = b.dataset.f; L.refresh(); });

    L.$('#n-q', root).oninput = (e) => { notesState.q = e.target.value; renderList(root); };
    L.$('[data-add]', root).onclick = () => L.newNote();
    renderList(root);
  }
});

function renderList(root) {
  let list = L.store.data.notes.slice();
  const q = notesState.q.toLowerCase().trim();
  if (q) list = list.filter(n => (n.title || '').toLowerCase().includes(q) || (n.body || '').toLowerCase().includes(q) || (n.checklist || []).some(c => (c.text || '').toLowerCase().includes(q)));
  if (notesState.filter === 'pinned') list = list.filter(n => n.pinned);
  else if (notesState.filter === 'fav') list = list.filter(n => n.fav);
  else if (notesState.filter.startsWith('f:')) { const f = notesState.filter.slice(2); list = list.filter(n => n.folder === f); }
  list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || (b.updated || 0) - (a.updated || 0));

  const el = L.$('#n-list', root);
  if (!list.length) { el.innerHTML = `<div class="card flat center muted sm">${q ? 'No notes match your search' : 'No notes yet — tap + to write one'}</div>`; return; }
  el.innerHTML = list.map(n => `
    <div class="item-card" data-note="${n.id}" style="align-items:flex-start">
      <span class="ico-badge ${n.fav ? 'g' : ''}">${L.icon(n.checklist && n.checklist.length ? 'check' : 'notes')}</span>
      <div class="grow" style="min-width:0">
        <div class="row between" style="gap:6px"><div style="font-weight:600" class="ellipsis">${L.esc(n.title || 'Untitled')}</div>
        ${n.pinned ? L.icon('pin', 'muted') : ''}</div>
        <div class="muted tiny ellipsis" style="margin-top:2px">${L.esc(noteSnippet(n))}</div>
        <div class="tiny" style="color:#6d7259;margin-top:5px">${n.folder ? L.esc(n.folder) + ' · ' : ''}${L.fmtDateShort(n.updated || n.created || Date.now())}</div>
      </div>
    </div>`).join('');
  L.$$('[data-note]', root).forEach(b => b.onclick = () => L.go('note-edit', { id: b.dataset.note }));
}

L.newNote = () => {
  const n = L.store.add('notes', { title: '', body: '', checklist: [], folder: '', pinned: false, fav: false, created: Date.now(), updated: Date.now() });
  L.go('note-edit', { id: n.id });
};

L.register('note-edit', {
  title: (p) => (L.store.get('notes', p.id)?.title || 'New Note'),
  sub: () => 'Auto-saves as you type',
  bar: (p) => {
    const n = L.store.get('notes', p.id) || {};
    return [
      { id: 'pin', icon: 'pin', label: 'Pin', on: () => { L.store.update('notes', p.id, { pinned: !n.pinned }); L.refresh(); } },
      { id: 'fav', icon: 'star', label: 'Favourite', on: () => { L.store.update('notes', p.id, { fav: !n.fav }); L.refresh(); } },
      { id: 'del', icon: 'trash', label: 'Delete', on: () => L.confirm('Delete this note?', () => { L.store.remove('notes', p.id); L.back(); }) },
    ];
  },
  render(root, p) {
    const n = L.store.get('notes', p.id);
    if (!n) { root.innerHTML = '<div class="empty">Note not found</div>'; return; }
    const isChecklist = n.checklist && n.checklist.length;
    root.innerHTML = `
      <input class="field" id="ne-title" placeholder="Title" value="${L.esc(n.title)}" style="font-size:18px;font-weight:700">
      <div class="row between" style="margin:2px 2px 12px">
        <select class="chip" id="ne-folder" style="border:1px solid var(--line-2)">
          <option value="">No folder</option>
          ${noteFolders().concat(n.folder && !noteFolders().includes(n.folder) ? [n.folder] : []).map(f => `<option value="${L.esc(f)}" ${n.folder === f ? 'selected' : ''}>${L.esc(f)}</option>`).join('')}
          <option value="__new">+ New folder…</option>
        </select>
        <button class="chip ${isChecklist ? 'active' : ''}" id="ne-mode">${isChecklist ? 'Checklist' : 'Text'}</button>
      </div>
      <div id="ne-body"></div>
      <div class="divider"></div>
      <p class="tiny muted center">Created ${L.fmtDate(n.created)} · Updated ${L.fmtTime(n.updated)}</p>`;

    const bodyWrap = L.$('#ne-body', root);
    if (isChecklist) renderChecklist(bodyWrap, n, p.id);
    else {
      const ta = L.h(`<textarea class="field" id="ne-text" placeholder="Start writing…" style="min-height:44vh">${L.esc(n.body || '')}</textarea>`);
      bodyWrap.appendChild(ta);
      ta.oninput = () => autosave(p.id, { body: ta.value });
    }

    L.$('#ne-title', root).oninput = (e) => { autosave(p.id, { title: e.target.value }); };
    L.$('#ne-mode', root).onclick = () => {
      if (isChecklist) { const txt = (n.checklist || []).map(c => (c.done ? '[x] ' : '[ ] ') + c.text).join('\n'); autosave(p.id, { checklist: [], body: txt }); }
      else autosave(p.id, { checklist: (n.body || '').split('\n').filter(Boolean).map(t => ({ text: t, done: false })) });
      L.refresh();
    };
    L.$('#ne-folder', root).onchange = (e) => {
      let v = e.target.value;
      if (v === '__new') {
        const name = prompt('Folder name'); if (!name) { e.target.value = n.folder || ''; return; } v = name.trim();
      }
      autosave(p.id, { folder: v });
    };
  }
});

function renderChecklist(wrap, n, id) {
  wrap.innerHTML = `<div class="list" id="cl"></div><button class="btn soft sm mt" id="cl-add">+ Add item</button>`;
  const cl = L.$('#cl', wrap);
  cl.innerHTML = n.checklist.map((c, i) => `
    <div class="item-card" data-i="${i}">
      <span class="check ${c.done ? 'on' : ''}" data-t>${c.done ? L.icon('check') : ''}</span>
      <div class="grow ${c.done ? 'muted' : ''}" style="${c.done ? 'text-decoration:line-through' : ''}">${L.esc(c.text)}</div>
      <button class="iconbtn" data-x style="width:32px;height:32px">${L.icon('x')}</button>
    </div>`).join('');
  L.$$('[data-i]', cl).forEach(row => {
    const i = +row.dataset.i;
    L.$('[data-t]', row).onclick = () => { const list = n.checklist.slice(); list[i].done = !list[i].done; autosave(id, { checklist: list }); renderChecklist(wrap, L.store.get('notes', id), id); };
    L.$('[data-x]', row).onclick = () => { const list = n.checklist.filter((_, j) => j !== i); autosave(id, { checklist: list }); renderChecklist(wrap, L.store.get('notes', id), id); };
  });
  L.$('#cl-add', wrap).onclick = () => { const list = (n.checklist || []).concat([{ text: '', done: false }]); autosave(id, { checklist: list }); renderChecklist(wrap, L.store.get('notes', id), id); setTimeout(() => { const last = L.$$('#cl .item-card').pop(); if (last) { const inp = document.createElement('input'); inp.className = 'field'; inp.style.margin = '0'; inp.placeholder = 'Item text'; last.replaceChildren(inp); inp.focus(); inp.onblur = () => { const list2 = L.store.get('notes', id).checklist.slice(); list2[list2.length - 1].text = inp.value; autosave(id, { checklist: list2 }); renderChecklist(wrap, L.store.get('notes', id), id); }; } }, 0); };
}

let autosaveT;
function autosave(id, patch) {
  clearTimeout(autosaveT);
  autosaveT = setTimeout(() => { L.store.update('notes', id, Object.assign({ updated: Date.now() }, patch)); }, 350);
}
