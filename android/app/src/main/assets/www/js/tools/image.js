/* LifeOS — Image tools (canvas based) */
var L = window.L;

function canvasToBlob(canvas, type, q) { return new Promise(res => canvas.toBlob(res, type, q)); }

L.register('tool-img-compress', {
  title: 'Image Compressor', sub: 'Reduce image size',
  render(root) {
    L.toolShell(root, 'Image Compressor', 'Choose a quality level and compare the result',
      `<div class="card"><button class="btn block" id="ic-pick">${L.icon('image')} Select an image</button>
      <div id="ic-info" class="mt"></div></div>`);
    let file = null, img = null;
    L.$('#ic-pick', root).onclick = async () => {
      const p = await L.pickFiles('image/*', false); if (!p.length) return;
      file = p[0]; const url = await L.readDataURL(file); img = await L.loadImage(url);
      L.$('#ic-info', root).innerHTML = `
        <img src="${url}" style="width:100%;border-radius:16px;margin-bottom:12px;max-height:240px;object-fit:contain;background:#000">
        <div class="row between"><span class="muted sm">Original</span><b>${L.fmtBytes(file.size)} · ${img.width}×${img.height}</b></div>
        <label class="lbl mt">Quality: <span id="ic-qv">60</span>%</label>
        <input type="range" id="ic-q" min="10" max="95" value="60" style="width:100%">
        <button class="btn block mt" id="ic-go">${L.icon('wand')} Compress</button>
        <div id="ic-res" class="mt"></div>`;
      const qEl = L.$('#ic-q', root);
      qEl.oninput = () => L.$('#ic-qv', root).textContent = qEl.value;
      L.$('#ic-go', root).onclick = async () => {
        const q = +qEl.value / 100;
        const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        const blob = await canvasToBlob(canvas, 'image/jpeg', q);
        const saved = file.size - blob.size;
        L.$('#ic-res', root).innerHTML = `<div class="divider"></div>
          <div class="row between"><span class="muted sm">Compressed</span><b>${L.fmtBytes(blob.size)}</b></div>
          <div class="center ${saved > 0 ? '' : 'muted'} mt">${saved > 0 ? `Saved ${L.fmtBytes(saved)} (${Math.round(saved / file.size * 100)}% smaller)` : 'Already small at this quality.'}</div>
          <div class="row mt" style="gap:10px"><button class="btn ghost grow" id="ic-dl">${L.icon('download')} Save</button>
          <button class="btn grow" id="ic-sh">${L.icon('share')} Share</button></div>`;
        const name = file.name.replace(/\.[^.]+$/, '') + '-compressed.jpg';
        L.$('#ic-dl', root).onclick = () => L.saveBlob(blob, name);
        L.$('#ic-sh', root).onclick = () => L.shareBlob(blob, name);
        L.toast(saved > 0 ? 'Compressed' : 'No reduction', saved > 0 ? 'ok' : '');
      };
    };
  }
});

L.register('tool-img-resize', {
  title: 'Image Resizer', sub: 'Resize by dimensions',
  render(root) {
    L.toolShell(root, 'Image Resizer', 'Set a target width and height (optionally locked ratio)',
      `<div class="card"><button class="btn block" id="ir-pick">${L.icon('image')} Select an image</button>
      <div id="ir-info" class="mt"></div></div>`);
    let file = null, img = null, ratio = 1;
    L.$('#ir-pick', root).onclick = async () => {
      const p = await L.pickFiles('image/*', false); if (!p.length) return;
      file = p[0]; const url = await L.readDataURL(file); img = await L.loadImage(url); ratio = img.width / img.height;
      L.$('#ir-info', root).innerHTML = `
        <img src="${url}" style="width:100%;border-radius:16px;margin-bottom:12px;max-height:220px;object-fit:contain;background:#000">
        <div class="muted sm center">Original: ${img.width}×${img.height}</div>
        <div class="row" style="gap:10px;margin-top:12px">
          <input class="field grow" id="ir-w" type="number" value="${img.width}" placeholder="Width">
          <input class="field grow" id="ir-h" type="number" value="${img.height}" placeholder="Height">
        </div>
        <div class="row between" style="margin:2px 2px 12px"><span class="sm">Lock aspect ratio</span><span class="switch on" id="ir-lock"><i></i></span></div>
        <button class="btn block" id="ir-go">${L.icon('layers')} Resize &amp; Save</button>`;
      const wEl = L.$('#ir-w', root), hEl = L.$('#ir-h', root), lock = L.$('#ir-lock', root);
      lock.onclick = () => lock.classList.toggle('on');
      wEl.oninput = () => { if (lock.classList.contains('on')) hEl.value = Math.round(+wEl.value / ratio) || ''; };
      hEl.oninput = () => { if (lock.classList.contains('on')) wEl.value = Math.round(+hEl.value * ratio) || ''; };
      L.$('#ir-go', root).onclick = async () => {
        const w = +wEl.value, h = +hEl.value; if (w <= 0 || h <= 0) return L.toast('Enter valid dimensions');
        const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, w, h);
        const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
        L.saveBlob(blob, file.name.replace(/\.[^.]+$/, '') + `-${w}x${h}.jpg`);
        L.toast(`Resized to ${w}×${h}`, 'ok');
      };
    };
  }
});
