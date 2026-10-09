/* LifeOS — Settings */
var L = window.L;
const VERSION = '1.0.0';

L.register('settings', {
  title: 'Settings',
  sub: 'LifeOS v' + VERSION,
  render(root) {
    const s = L.store.data.settings;
    const usage = (() => { try { return new Blob([L.store.export()]).size; } catch (e) { return 0; } })();
    root.innerHTML = `
      <div class="card raised">
        <div class="row"><span class="avatar" style="width:52px;height:52px;font-size:20px">${L.esc((s.name || 'U').charAt(0).toUpperCase())}</span>
        <div class="grow"><div style="font-weight:700;font-size:16px">${L.esc(s.name || 'You')}</div>
        <div class="muted tiny">LifeOS v${VERSION}</div></div></div>
        <button class="btn ghost block mt" id="st-name">Edit name</button>
      </div>

      <div class="sec-title"><h2>Notifications</h2></div>
      <div class="card">
        <div class="row between"><div class="grow"><div style="font-weight:600">Reminders &amp; alarms</div><div class="muted tiny">Show notifications for due reminders</div></div>
        <span class="switch ${s.remindersNotify ? 'on' : ''}" id="st-notif"><i></i></span></div>
        <div class="divider"></div>
        <button class="btn ghost block sm" id="st-perm">Request notification permission</button>
      </div>

      <div class="sec-title"><h2>Data</h2></div>
      <div class="card">
        <div class="row between"><span class="sm muted">Local storage used</span><b>${L.fmtBytes(usage)}</b></div>
        <div class="divider"></div>
        <button class="btn ghost block" id="st-export">${L.icon('download')} Export backup (.json)</button>
        <button class="btn ghost block mt" id="st-import">${L.icon('share')} Import backup</button>
        <button class="btn danger block mt" id="st-reset">Reset all data</button>
      </div>

      <div class="sec-title"><h2>Privacy</h2></div>
      <div class="card"><p class="sm muted">${L.icon('shield')} Your notes, tasks, habits and files stay on this device. LifeOS does not upload your personal data anywhere. Files you create with the tools are processed locally.</p></div>

      <div class="sec-title"><h2>About</h2></div>
      <div class="card"><div class="row between"><span class="sm muted">App</span><b>LifeOS</b></div>
        <div class="row between mt"><span class="sm muted">Version</span><b>${VERSION}</b></div>
        <div class="row between mt"><span class="sm muted">Platform</span><b>Android</b></div></div>
      <div style="height:10px"></div>`;

    L.$('#st-name', root).onclick = () => L.sheet('Your name', `<input class="field" id="nm" value="${L.esc(s.name)}" autofocus><button class="btn block" id="nm-s">Save</button>`, (ov, close) => {
      L.$('#nm-s', ov).onclick = () => { L.store.data.settings.name = L.$('#nm', ov).value.trim() || 'You'; L.store.save(); close(); L.refresh(); };
    });
    L.$('#st-notif', root).onclick = (e) => { s.remindersNotify = !s.remindersNotify; e.currentTarget.classList.toggle('on', s.remindersNotify); L.store.save(); };
    L.$('#st-perm', root).onclick = () => L.askNotify();
    L.$('#st-export', root).onclick = () => {
      const blob = new Blob([L.store.export()], { type: 'application/json' });
      L.saveBlob(blob, `lifeos-backup-${L.todayYmd()}.json`);
    };
    L.$('#st-import', root).onclick = async () => {
      const f = await L.pickFiles('application/json', false); if (!f.length) return;
      try { const txt = await L.readText(f[0]); L.store.import(txt); L.refresh(); L.toast('Backup restored', 'ok'); }
      catch (e) { L.toast('Invalid backup file', 'err'); }
    };
    L.$('#st-reset', root).onclick = () => L.confirm('Erase all LifeOS data on this device? This cannot be undone.', () => { L.store.reset(); L.go('home', {}, false); L.toast('All data reset'); });
  }
});
