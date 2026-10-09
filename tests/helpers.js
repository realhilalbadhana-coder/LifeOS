/* Shared helpers for the LifeOS web test suite. */
const path = require('path');
const fs = require('fs');

/* Locate the web assets: works from the repo root layout or a local working copy. */
const candidates = [
  path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'assets', 'www'),
  path.join(__dirname, '..', 'www'),
  '/scratch/work/LifeOS/www',
];
const WWW = candidates.find(d => fs.existsSync(path.join(d, 'index.html')));
if (!WWW) throw new Error('Could not locate the www assets (index.html not found)');

const INDEX = path.join(WWW, 'index.html');
/* Same origin the Android WebView serves the assets from. */
const ORIGIN = 'https://appassets.androidplatform.net/assets/www/';

/* Collect PASS/FAIL lines and exit non-zero on any failure. */
function reporter(title) {
  const out = [];
  const ok = (name, cond, extra) => out.push((cond ? 'PASS' : 'FAIL') + '  ' + name + (extra ? '  -> ' + extra : ''));
  const finish = () => {
    console.log(out.join('\n'));
    const fails = out.filter(l => l.startsWith('FAIL'));
    console.log('\n[' + title + '] ' + (fails.length ? fails.length + ' FAILURES' : 'ALL CHECKS PASSED'));
    process.exit(fails.length ? 1 : 0);
  };
  return { ok, finish };
}

module.exports = { WWW, INDEX, ORIGIN, reporter };
