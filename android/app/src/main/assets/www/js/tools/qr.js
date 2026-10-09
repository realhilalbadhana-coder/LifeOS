/* LifeOS — QR tools (jsQR for scanning, qrcode for generation) */
var L = window.L;

/* 8 — Scanner */
L.register('tool-qr-scan', {
  title: 'QR Scanner', sub: 'Scan with the camera',
  render(root) {
    L.toolShell(root, 'QR Scanner', 'Point the camera at a QR code',
      `<div class="card">
        <div id="qs-stage" style="position:relative;border-radius:18px;overflow:hidden;background:#000;aspect-ratio:1">
          <video id="qs-video" playsinline muted style="width:100%;height:100%;object-fit:cover"></video>
          <div style="position:absolute;inset:16%;border:3px solid var(--accent);border-radius:20px;box-shadow:0 0 0 100vmax rgba(0,0,0,.35)"></div>
        </div>
        <button class="btn block mt" id="qs-start">${L.icon('camera')} Start camera</button>
        <button class="btn ghost block mt hide" id="qs-stop">Stop</button>
        <div id="qs-result" class="mt"></div>
      </div>`);
    const video = L.$('#qs-video', root);
    let stream = null, raf = null, canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });

    const stop = () => {
      if (raf) cancelAnimationFrame(raf), raf = null;
      if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
      L.$('#qs-stop', root).classList.add('hide');
      L.$('#qs-start', root).classList.remove('hide');
    };
    L._cleanup = stop;

    const tick = () => {
      if (!stream) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const d = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = window.jsQR(d.data, d.width, d.height, { inversionAttempts: 'dontInvert' });
        if (code && code.data) { showResult(code.data); stop(); return; }
      }
      raf = requestAnimationFrame(tick);
    };

    const showResult = (data) => {
      const isUrl = /^https?:\/\//i.test(data);
      L.$('#qs-result', root).innerHTML = `<div class="divider"></div>
        <div class="lbl">Scanned content</div>
        <div class="card raised" style="word-break:break-all">${L.esc(data)}</div>
        <div class="row" style="gap:10px"><button class="btn ghost grow" id="qr-copy">Copy</button>
        ${isUrl ? `<button class="btn grow" id="qr-open">Open link</button>` : ''}</div>`;
      L.$('#qr-copy', root).onclick = () => { navigator.clipboard?.writeText(data); L.toast('Copied', 'ok'); };
      if (isUrl) L.$('#qr-open', root).onclick = () => { if (confirm('Open this link?\n' + data)) window.open(data, '_blank'); };
    };

    L.$('#qs-start', root).onclick = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream; await video.play();
        L.$('#qs-stop', root).classList.remove('hide');
        L.$('#qs-start', root).classList.add('hide');
        raf = requestAnimationFrame(tick);
      } catch (e) { L.toast('Camera unavailable: ' + (e.message || e.name), 'err'); }
    };
    L.$('#qs-stop', root).onclick = stop;
  }
});

/* 9 — Generator */
L.register('tool-qr-gen', {
  title: 'QR Generator', sub: 'Make a QR code',
  render(root) {
    L.toolShell(root, 'QR Generator', 'Create a QR code from any text or URL',
      `<div class="card">
        <textarea class="field" id="qg-text" placeholder="Text or URL…" style="min-height:90px"></textarea>
        <button class="btn block" id="qg-go">${L.icon('qr')} Generate</button>
        <div id="qg-out" class="center mt"></div>
      </div>`);
    let blob = null;
    L.$('#qg-go', root).onclick = async () => {
      const text = L.$('#qg-text', root).value.trim(); if (!text) return L.toast('Enter text or a URL');
      try {
        const canvas = document.createElement('canvas');
        await window.QRCodeLib.toCanvas(canvas, text, { width: 260, margin: 2, color: { dark: '#0A0B00', light: '#EAFF55' } });
        const url = canvas.toDataURL('image/png');
        L.$('#qg-out', root).innerHTML = `<img src="${url}" style="border-radius:16px;margin-top:6px">
          <div class="row mt" style="gap:10px"><button class="btn ghost grow" id="qg-dl">${L.icon('download')} Save</button>
          <button class="btn grow" id="qg-sh">${L.icon('share')} Share</button></div>`;
        blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
        L.$('#qg-dl', root).onclick = () => L.saveBlob(blob, 'qrcode.png');
        L.$('#qg-sh', root).onclick = () => L.shareBlob(blob, 'qrcode.png');
        L.toast('QR generated', 'ok');
      } catch (e) { L.toast('Failed: ' + e.message, 'err'); }
    };
  }
});
