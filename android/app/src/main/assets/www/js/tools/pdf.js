/* LifeOS — PDF tools (real processing: jsPDF + pdf-lib) */
var L = window.L;
const { jsPDF } = window.jspdf;

function pdfBusy(root, on) {
  let ov = L.$('#busy', root);
  if (on) {
    if (!ov) { ov = L.h(`<div id="busy" class="overlay"><div class="sheet" style="text-align:center"><div class="handle"></div><p class="sm muted">Working…</p></div></div>`); document.body.appendChild(ov); }
  } else if (ov) ov.remove();
}
function downloadPdf(doc, filename) {
  const blob = doc.output('blob');
  L.saveBlob(blob, filename);
}

/* 1 — Text to PDF */
L.register('tool-pdf-maker', {
  title: 'PDF Maker', sub: 'Text to PDF',
  render(root) {
    L.toolShell(root, 'PDF Maker', 'Type or paste text and export a clean PDF',
      `<div class="card">
        <input class="field" id="pm-name" placeholder="File name" value="document">
        <textarea class="field" id="pm-text" style="min-height:40vh" placeholder="Type your text here…">${L.esc(L.store.data._lastPdfText || '')}</textarea>
        <div class="row" style="gap:10px"><select class="field grow" id="pm-size" style="margin:0"><option>A4</option><option>Letter</option></select>
        <select class="field grow" id="pm-font" style="margin:0"><option value="12">12 pt</option><option value="14">14 pt</option><option value="16">16 pt</option></select></div>
        <button class="btn block mt" id="pm-go">${L.icon('pdf')} Create PDF</button>
      </div>`);
    L.$('#pm-go', root).onclick = () => {
      const text = L.$('#pm-text', root).value; if (!text.trim()) return L.toast('Enter some text');
      const name = (L.$('#pm-name', root).value.trim() || 'document') + '.pdf';
      const size = L.$('#pm-size', root).value, fs = +L.$('#pm-font', root).value;
      const doc = new jsPDF({ unit: 'pt', format: size.toLowerCase() });
      const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 48;
      doc.setFontSize(fs);
      const lines = doc.splitTextToSize(text, W - M * 2);
      let y = M;
      lines.forEach(line => {
        if (y > H - M) { doc.addPage(); y = M; }
        doc.text(line, M, y); y += fs * 1.5;
      });
      downloadPdf(doc, name); L.toast('PDF created', 'ok');
    };
  }
});

/* 2 — Merge */
L.register('tool-pdf-merge', {
  title: 'PDF Merge', sub: 'Combine multiple PDFs',
  render(root) {
    L.toolShell(root, 'PDF Merge', 'Select two or more PDFs and merge them in order',
      `<div class="card"><button class="btn block" id="mg-pick">${L.icon('plus')} Select PDF files</button>
      <div class="list mt" id="mg-list"></div>
      <button class="btn block mt hide" id="mg-go">${L.icon('layers')} Merge &amp; Save</button></div>`);
    let files = [];
    const listEl = L.$('#mg-list', root);
    const redraw = () => {
      listEl.innerHTML = files.map((f, i) => `<div class="item-card"><span class="ico-badge">${L.icon('pdf')}</span>
        <div class="grow"><div style="font-weight:600" class="ellipsis">${L.esc(f.name)}</div><div class="muted tiny">${L.fmtBytes(f.size)}</div></div>
        <div class="row" style="gap:4px"><button class="iconbtn" data-up="${i}" style="width:32px;height:32px;transform:rotate(-90deg)">${L.icon('chev')}</button>
        <button class="iconbtn" data-down="${i}" style="width:32px;height:32px;transform:rotate(90deg)">${L.icon('chev')}</button>
        <button class="iconbtn" data-rm="${i}" style="width:32px;height:32px">${L.icon('x')}</button></div></div>`).join('');
      L.$$('[data-rm]', listEl).forEach(b => b.onclick = () => { files.splice(+b.dataset.rm, 1); redraw(); });
      L.$$('[data-up]', listEl).forEach(b => b.onclick = () => { const i = +b.dataset.up; if (i > 0) { [files[i - 1], files[i]] = [files[i], files[i - 1]]; redraw(); } });
      L.$$('[data-down]', listEl).forEach(b => b.onclick = () => { const i = +b.dataset.down; if (i < files.length - 1) { [files[i + 1], files[i]] = [files[i], files[i + 1]]; redraw(); } });
      L.$('#mg-go', root).classList.toggle('hide', files.length < 2);
    };
    L.$('#mg-pick', root).onclick = async () => { const picked = await L.pickFiles('application/pdf', true); files = files.concat(picked); redraw(); };
    L.$('#mg-go', root).onclick = async () => {
      try {
        pdfBusy(root, true);
        const out = await PDFLib.PDFDocument.create();
        for (const f of files) { const buf = await L.readArrayBuffer(f); const src = await PDFLib.PDFDocument.load(buf, { ignoreEncryption: true }); const pages = await out.copyPages(src, src.getPageIndices()); pages.forEach(p => out.addPage(p)); }
        const bytes = await out.save();
        L.saveBlob(new Blob([bytes], { type: 'application/pdf' }), 'merged.pdf');
        L.toast('Merged ' + files.length + ' files', 'ok');
      } catch (e) { L.toast('Merge failed: ' + e.message, 'err'); }
      finally { pdfBusy(root, false); }
    };
  }
});

/* 3 — Image to PDF */
L.register('tool-img-pdf', {
  title: 'Image to PDF', sub: 'Photos into a PDF',
  render(root) {
    L.toolShell(root, 'Image to PDF', 'Select images, reorder, and export as a PDF',
      `<div class="card"><button class="btn block" id="ip-pick">${L.icon('image')} Select images</button>
      <div class="list mt" id="ip-list"></div>
      <button class="btn block mt hide" id="ip-go">${L.icon('pdf')} Create PDF</button></div>`);
    let imgs = [];
    const listEl = L.$('#ip-list', root);
    const redraw = () => {
      listEl.innerHTML = imgs.map((f, i) => `<div class="item-card"><img src="${f._url}" style="width:42px;height:42px;object-fit:cover;border-radius:10px">
        <div class="grow"><div style="font-weight:600" class="ellipsis">${L.esc(f.name)}</div><div class="muted tiny">${L.fmtBytes(f.size)}</div></div>
        <div class="row" style="gap:4px"><button class="iconbtn" data-up="${i}" style="width:32px;height:32px;transform:rotate(-90deg)">${L.icon('chev')}</button>
        <button class="iconbtn" data-rm="${i}" style="width:32px;height:32px">${L.icon('x')}</button></div></div>`).join('');
      L.$$('[data-rm]', listEl).forEach(b => b.onclick = () => { imgs.splice(+b.dataset.rm, 1); redraw(); });
      L.$$('[data-up]', listEl).forEach(b => b.onclick = () => { const i = +b.dataset.up; if (i > 0) { [imgs[i - 1], imgs[i]] = [imgs[i], imgs[i - 1]]; redraw(); } });
      L.$('#ip-go', root).classList.toggle('hide', !imgs.length);
    };
    L.$('#ip-pick', root).onclick = async () => { const picked = await L.pickFiles('image/*', true); for (const f of picked) f._url = await L.readDataURL(f); imgs = imgs.concat(picked); redraw(); };
    L.$('#ip-go', root).onclick = async () => {
      try {
        pdfBusy(root, true);
        let doc = null;
        for (const f of imgs) {
          const dataUrl = await L.readDataURL(f); const img = await L.loadImage(dataUrl);
          const orient = img.width > img.height ? 'l' : 'p';
          if (!doc) doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: orient });
          else doc.addPage('a4', orient);
          const W = doc.internal.pageSize.getWidth(), H = doc.internal.pageSize.getHeight(), M = 24;
          const scale = Math.min((W - M * 2) / img.width, (H - M * 2) / img.height);
          const w = img.width * scale, h = img.height * scale;
          doc.addImage(dataUrl, 'JPEG', (W - w) / 2, (H - h) / 2, w, h);
        }
        downloadPdf(doc, 'images.pdf'); L.toast('PDF created from ' + imgs.length + ' images', 'ok');
      } catch (e) { L.toast('Failed: ' + e.message, 'err'); }
      finally { pdfBusy(root, false); }
    };
  }
});

/* 4 — Split */
L.register('tool-pdf-split', {
  title: 'PDF Split', sub: 'Extract pages',
  render(root) {
    L.toolShell(root, 'PDF Split', 'Select a PDF, choose pages, export a new PDF',
      `<div class="card"><button class="btn block" id="sp-pick">${L.icon('pdf')} Select a PDF</button>
      <div id="sp-info" class="mt"></div></div>`);
    let file = null, count = 0;
    L.$('#sp-pick', root).onclick = async () => {
      const picked = await L.pickFiles('application/pdf', false); if (!picked.length) return;
      file = picked[0];
      try { const buf = await L.readArrayBuffer(file); const doc = await PDFLib.PDFDocument.load(buf, { ignoreEncryption: true }); count = doc.getPageCount(); }
      catch (e) { return L.toast('Could not read PDF: ' + e.message, 'err'); }
      L.$('#sp-info', root).innerHTML = `<div class="item-card"><span class="ico-badge">${L.icon('pdf')}</span><div class="grow"><div style="font-weight:600" class="ellipsis">${L.esc(file.name)}</div><div class="muted tiny">${count} pages · ${L.fmtBytes(file.size)}</div></div></div>
        <label class="lbl mt">Pages to extract (e.g. 1-3,5)</label>
        <input class="field" id="sp-range" value="1-${count}">
        <button class="btn block" id="sp-go">${L.icon('split')} Extract &amp; Save</button>`;
      L.$('#sp-go', root).onclick = async () => {
        try {
          pdfBusy(root, true);
          const idx = parseRange(L.$('#sp-range', root).value, count);
          if (!idx.length) { pdfBusy(root, false); return L.toast('Enter valid pages'); }
          const buf = await L.readArrayBuffer(file); const src = await PDFLib.PDFDocument.load(buf, { ignoreEncryption: true });
          const out = await PDFLib.PDFDocument.create(); const pages = await out.copyPages(src, idx); pages.forEach(p => out.addPage(p));
          const bytes = await out.save(); L.saveBlob(new Blob([bytes], { type: 'application/pdf' }), 'extracted.pdf');
          L.toast('Exported ' + idx.length + ' pages', 'ok');
        } catch (e) { L.toast('Failed: ' + e.message, 'err'); }
        finally { pdfBusy(root, false); }
      };
    };
  }
});
function parseRange(str, max) {
  const set = new Set();
  str.split(',').forEach(part => {
    part = part.trim(); if (!part) return;
    const m = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (m) { let a = +m[1], b = +m[2]; if (a > b) [a, b] = [b, a]; for (let i = a; i <= b; i++) if (i >= 1 && i <= max) set.add(i - 1); }
    else if (/^\d+$/.test(part)) { const n = +part; if (n >= 1 && n <= max) set.add(n - 1); }
  });
  return [...set].sort((a, b) => a - b);
}

/* 5 — Compress */
L.register('tool-pdf-compress', {
  title: 'PDF Compressor', sub: 'Reduce file size',
  render(root) {
    L.toolShell(root, 'PDF Compressor', 'Re-optimises the PDF. The result is reported honestly.',
      `<div class="card"><button class="btn block" id="cp-pick">${L.icon('pdf')} Select a PDF</button>
      <div id="cp-info" class="mt"></div></div>`);
    let file = null;
    L.$('#cp-pick', root).onclick = async () => {
      const picked = await L.pickFiles('application/pdf', false); if (!picked.length) return;
      file = picked[0];
      L.$('#cp-info', root).innerHTML = `<div class="item-card"><span class="ico-badge">${L.icon('pdf')}</span><div class="grow"><div style="font-weight:600" class="ellipsis">${L.esc(file.name)}</div><div class="muted tiny">Original: ${L.fmtBytes(file.size)}</div></div></div>
        <button class="btn block mt" id="cp-go">${L.icon('wand')} Compress</button>`;
      L.$('#cp-go', root).onclick = async () => {
        try {
          pdfBusy(root, true);
          const buf = await L.readArrayBuffer(file);
          const doc = await PDFLib.PDFDocument.load(buf, { ignoreEncryption: true, updateMetadata: false });
          const bytes = await doc.save({ useObjectStreams: true, addDefaultPage: false });
          const newSize = bytes.byteLength;
          const saved = file.size - newSize;
          const out = `<div class="card"><div class="row between"><span class="muted sm">Original</span><b>${L.fmtBytes(file.size)}</b></div>
            <div class="row between mt"><span class="muted sm">Optimised</span><b>${L.fmtBytes(newSize)}</b></div>
            <div class="divider"></div>
            <div class="center ${saved > 0 ? '' : 'muted'}">${saved > 0 ? `Saved ${L.fmtBytes(saved)} (${Math.round(saved / file.size * 100)}% smaller)` : 'This PDF could not be made smaller — it is already optimised.'}</div>
            <button class="btn block mt" id="cp-save">${L.icon('download')} Save optimised PDF</button></div>`;
          L.$('#cp-info', root).innerHTML = out;
          L.$('#cp-save', root).onclick = () => L.saveBlob(new Blob([bytes], { type: 'application/pdf' }), file.name.replace(/\.pdf$/i, '') + '-optimised.pdf');
          L.toast(saved > 0 ? 'Compressed' : 'No size reduction', saved > 0 ? 'ok' : '');
        } catch (e) { L.toast('Failed: ' + e.message, 'err'); }
        finally { pdfBusy(root, false); }
      };
    };
  }
});
