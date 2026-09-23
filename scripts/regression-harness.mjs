import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const failures = [];
const notes = [];

const fail = (msg) => failures.push(msg);
const ok = (msg) => notes.push('PASS  ' + msg);
const cleanRef = (ref) => ref.split('?')[0].split('#')[0];

function read(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    fail('missing file: ' + rel);
    return '';
  }
  return fs.readFileSync(p, 'utf8');
}

const html = read('index.html');
if (html) {
  const requiredIds = [
    'month','mbo','first','second','upload','asof','status','cards',
    'groupTarget','groupMbo','groupNeed','vendorTable','groupTable',
    'dailyTable','detailTable','compareTable'
  ];
  for (const id of requiredIds) {
    if (!new RegExp('id=["\\\']' + id + '["\\\']').test(html)) fail('required DOM id missing: #' + id);
  }
  if (!failures.some(x => x.startsWith('required DOM id'))) ok('critical dashboard DOM anchors');
}

const queue = [];
const seen = new Set();
const scriptRe = /<script\b[^>]*\bsrc=["']([^"']+)["']/gi;
for (const m of html.matchAll(scriptRe)) {
  const ref = m[1];
  if (!/^https?:\/\//i.test(ref)) queue.push(cleanRef(ref));
}

while (queue.length) {
  const rel = queue.shift();
  if (seen.has(rel)) continue;
  seen.add(rel);
  const src = read(rel);
  if (!src) continue;

  try {
    new vm.Script(src, { filename: rel });
  } catch (err) {
    fail('syntax error in ' + rel + ': ' + err.message);
    continue;
  }

  const localJsRef = /["'`]([^"'\`\n]+\.js(?:\?[^"'\`\n]*)?)["'`]/g;
  for (const m of src.matchAll(localJsRef)) {
    const ref = m[1];
    if (/^https?:\/\//i.test(ref)) continue;
    const child = cleanRef(ref);
    if (child && !seen.has(child)) queue.push(child);
  }
}

if (seen.size) ok('recursive local script graph: ' + seen.size + ' files');
if (!failures.some(x => x.startsWith('syntax error'))) ok('JavaScript syntax');

const v16 = read('v16.js');
for (const anchor of ['bootstrap-v36.js','forecast-progress-v81.js','group-no-mbo-final-v87.js','export-v21.js']) {
  if (!v16.includes(anchor)) fail('active loader anchor missing: ' + anchor);
}
if (v16 && !failures.some(x => x.startsWith('active loader anchor'))) ok('active loader regression anchors');

const bootstrap = read('bootstrap-v36.js');
if (bootstrap) {
  if (!bootstrap.includes("timeZone:'Asia/Seoul'")) fail('Korea timezone guard missing in bootstrap');
  if (!bootstrap.includes('displayDate(shared,dataLast)')) fail('display-date resolver missing');
  if (!bootstrap.includes('shared?.updatedAt')) fail('updatedAt is not considered for display date');
  if (!bootstrap.includes('window.__SF_DISPLAY_DATE')) fail('display date is not exposed to UI');
  if (!failures.some(x => /timezone guard|display-date resolver|updatedAt|display date is not exposed/.test(x))) {
    ok('as-of/display-date regression guard');
  }
}

const exportSrc = read('export-v21.js');
if (exportSrc) {
  for (const anchor of ['vendorAOA','productGap','권역_업체현황','제품군_MBO_업체별_필요매출']) {
    if (!exportSrc.includes(anchor)) fail('export regression anchor missing: ' + anchor);
  }
  if (!failures.some(x => x.startsWith('export regression anchor'))) ok('Excel export regression anchors');
}

console.log('\nSales_Forecast regression harness');
console.log('=================================');
for (const line of notes) console.log(line);
if (failures.length) {
  console.error('\nFAILURES');
  for (const line of failures) console.error('FAIL  ' + line);
  process.exit(1);
}
console.log('\nRESULT: PASS');
