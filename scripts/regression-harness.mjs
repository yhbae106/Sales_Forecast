import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = p => fs.readFileSync(p, 'utf8');
const fail = m => { console.error('HARNESS FAIL:', m); process.exitCode = 1; };
const ok = m => console.log('HARNESS OK:', m);

const shared = JSON.parse(read('shared-data/sales-history.json'));
const uploads = Array.isArray(shared.uploads) ? shared.uploads : [];
const sources = Array.isArray(shared.sourceFiles) ? shared.sourceFiles : [];

if (!uploads.length) fail('shared uploads is empty');
if (!sources.length) fail('sourceFiles is empty');

const byMonth = new Map();
for (const r of uploads) {
  const d = String(r.d ?? r.date ?? '');
  const a = Number(r.a ?? r.amount);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) fail('invalid upload date: ' + d);
  if (!Number.isFinite(a)) fail('invalid amount at ' + d);
  const month = d.slice(0, 7);
  if (!byMonth.has(month)) byMonth.set(month, {dates:new Set(), total:0});
  const x = byMonth.get(month);
  x.dates.add(d);
  x.total += a;
}

for (const src of sources) {
  const month = src.month;
  const x = byMonth.get(month);
  if (!x) { fail('source month missing in uploads: ' + month); continue; }
  const dates = [...x.dates].sort();
  const last = dates.at(-1) || '';
  if (last !== (src.lastDate || src.date)) fail(month + ' latest date mismatch: uploads=' + last + ' source=' + (src.lastDate || src.date));
  if (dates.length !== Number(src.dateCount)) fail(month + ' dateCount mismatch: uploads=' + dates.length + ' source=' + src.dateCount);
  if (Math.abs(x.total - Number(src.total || 0)) > 0.5) fail(month + ' total mismatch: uploads=' + x.total + ' source=' + src.total);
}

const latestUpload = uploads.map(r => String(r.d ?? r.date ?? '')).filter(Boolean).sort().at(-1) || '';
const latestSource = sources.map(r => String(r.lastDate || r.date || '')).filter(Boolean).sort().at(-1) || '';
if (latestUpload !== latestSource) fail('latest shared date mismatch: uploads=' + latestUpload + ' sourceFiles=' + latestSource);
else ok('latest shared date ' + latestUpload);

const index = read('index.html');
const v16 = read('v16.js');
const bootstrap = read('bootstrap-v36.js');
const exportLoader = read('export-v19.js');
const unifiedLoader = read('unified-loader-v74.js');

const m = index.match(/v16\.js\?v=(\d+)/);
if (!m) fail('index runtime version not found');
const version = m?.[1] || '';
const required = [
  ['index bootstrap', index, new RegExp('bootstrap-v36\\.js\\?v=' + version)],
  ['index export', index, new RegExp('export-v19\\.js\\?v=' + version)],
  ['v16 version', v16, new RegExp("const V='" + version + "'")],
  ['bootstrap legacy', bootstrap, new RegExp('v16-legacy\\.js\\?v=' + version)],
  ['bootstrap shared', bootstrap, new RegExp('shared-v31\\.js\\?v=' + version)],
  ['bootstrap upload', bootstrap, new RegExp('master-upload-v34\\.js\\?v=' + version)],
  ['bootstrap upload diff', bootstrap, new RegExp('upload-diff-v99\\.js\\?v=' + version)],
  ['export loader version', exportLoader, new RegExp("const V='" + version + "'")],
  ['unified final version', unifiedLoader, new RegExp('unified-final-v73\\.js\\?v=' + version)],
  ['template loader version', v16, new RegExp('dashboard-templates-v103\\.js\\?v=' + version)]
];
for (const [name, text, re] of required) {
  if (!re.test(text)) fail(name + ' is not aligned to v' + version);
}
ok('runtime asset version v' + version + ' aligned');

if (!bootstrap.includes("cache:'no-store'")) fail('shared bootstrap fetch must use no-store');
if (!bootstrap.includes("?t='+Date.now()")) fail('shared bootstrap fetch must use cache-busting timestamp');
ok('shared data fetch cache guards present');

const masterUpload = read('master-upload-v34.js');
if (!bootstrap.includes("CONTENTS_API='https://api.github.com/repos/yhbae106/Sales_Forecast/contents/shared-data/sales-history.json'")) fail('bootstrap must have GitHub contents API fallback for stale raw data');
if (!bootstrap.includes('matchesExpected(shared,expected)')) fail('bootstrap must validate expected shared version after upload');
if (!bootstrap.includes('sessionStorage.removeItem(EXPECT_KEY)')) fail('bootstrap must clear expected version only after a verified read');
if (!masterUpload.includes('mergeMonth(existing,p)')) fail('master upload must preserve partial-month data safely');
if (!masterUpload.includes("mergeMode:merged.mode")) fail('master upload must record snapshot/date-patch mode');
if (masterUpload.includes("state.up=state.up.filter(r=>String(r.d||r.date||'').slice(0,7)!==p.month)")) fail('master upload must not blindly replace the whole month');
if (!masterUpload.includes("window.dispatchEvent(new CustomEvent('sf-data-refreshed'")) fail('verified upload must refresh the live dashboard without reload');
if (masterUpload.includes("location.replace(location.pathname+'?sync='")) fail('upload flow must not rely on immediate reload after GitHub write');
if (!read('v16-legacy.js').includes("window.addEventListener('sf-data-refreshed'")) fail('legacy KPI state must consume verified refreshed uploads');
ok('shared upload freshness and partial-month merge guards present');

const uploadDiff = read('upload-diff-v99.js');
if (!v16.includes("'upload-diff-v99.js?v=" + version + "'")) fail('core preloader is missing upload diff inspector');
if (!read('shared-v31.js').includes('buildUploadDiff(previousRows,nextRows,sourceFiles)')) fail('shared runtime must calculate upload-to-upload row diffs');
if (!read('shared-v31.js').includes('lastUploadDiff=buildUploadDiff(previous.uploads||[],payload.up||[],sourceFiles)')) fail('sales publisher must compare against the authoritative previous shared upload');
if (!read('shared-v31.js').includes('lastUploadDiff};return putShared')) fail('sales publisher must persist lastUploadDiff with the shared payload');
if (!read('shared-v31.js').includes('window.__SF_LAST_UPLOAD_DIFF=got.lastUploadDiff||null')) fail('verified shared write must expose the latest upload diff');
if (!bootstrap.includes('window.__SF_LAST_UPLOAD_DIFF=shared.lastUploadDiff||null')) fail('bootstrap must hydrate persisted upload diff');
if (!uploadDiff.includes("id='sfUploadDiffBtn'") && !uploadDiff.includes("b.id='sfUploadDiffBtn'")) fail('upload diff inspector button is missing');
if (!uploadDiff.includes('직전 업로드 대비 증감')) fail('upload diff inspector label is missing');
for (const label of ['업체별 순증감','SKU 상세','직전 업로드 누계','현재 업로드 누계','순증감']) {
  if (!uploadDiff.includes(label)) fail('upload diff inspector missing UI label: ' + label);
}
if (!uploadDiff.includes("startsWith('Update shared sales data')")) fail('upload diff fallback must select only sales-data commits');
if (!uploadDiff.includes('per_page=30')) fail('upload diff fallback must scan enough file history to skip settings-only commits');
if (!uploadDiff.includes('sales[1].sha')) fail('upload diff fallback must read the previous sales upload commit');
if (!uploadDiff.includes("window.addEventListener('sf-data-refreshed'")) fail('upload diff inspector must refresh after a verified upload');
const diffBefore=[{d:'2026-09-29',v:'A',g:'G1',m:'SKU1',a:100},{d:'2026-09-29',v:'A',g:'G1',m:'SKU2',a:40},{d:'2026-09-29',v:'B',g:'G2',m:'SKU3',a:70}];
const diffAfter=[{d:'2026-09-29',v:'A',g:'G1',m:'SKU1',a:125},{d:'2026-09-29',v:'A',g:'G1',m:'SKU2',a:30},{d:'2026-09-29',v:'B',g:'G2',m:'SKU3',a:70},{d:'2026-09-29',v:'B',g:'G2',m:'SKU4',a:15}];
const diffKey=r=>[r.d,r.v,r.g,r.m].join('\u0001'),beforeMap=new Map(diffBefore.map(r=>[diffKey(r),r.a])),afterMap=new Map(diffAfter.map(r=>[diffKey(r),r.a])),diffKeys=new Set([...beforeMap.keys(),...afterMap.keys()]);
let testDelta=0,testChanged=0,testVendorA=0,testVendorB=0;
for (const k of diffKeys) { const d=(afterMap.get(k)||0)-(beforeMap.get(k)||0); if(Math.abs(d)<=.5)continue; testDelta+=d; testChanged++; const vendor=k.split('\u0001')[1]; if(vendor==='A')testVendorA+=d; if(vendor==='B')testVendorB+=d; }
if (testDelta!==30 || testChanged!==3 || testVendorA!==15 || testVendorB!==15) fail('upload diff regression model no longer reconciles row and vendor changes');
ok('previous-upload diff persistence, fallback, UI, and reconciliation guards present');


const latestSrc = sources.slice().sort((a,b)=>String(a.lastDate||a.date||'').localeCompare(String(b.lastDate||b.date||''))).at(-1);
if (latestSrc) {
  const x = byMonth.get(latestSrc.month);
  if (!x) fail('latest source month is absent from uploads');
  else {
    const delta = Math.abs(x.total - Number(latestSrc.total || 0));
    if (delta > 0.5) fail('latest source total is not the exact dashboard source total');
    else ok('latest source total reconciles exactly: ' + latestSrc.month + ' ' + x.total);
  }
}



const unifiedFinal = read('unified-final-v73.js');
const exportV21 = read('export-v21.js');
const vendorExcel = read('vendor-excel-format-v48.js');
const vendorGap = read('vendor-mbo-gap-v43.js');
const vendorClose = read('vendor-close-ui-v67.js');

for (const [name, text] of [
  ['unified-final-v73.js', unifiedFinal],
  ['export-v21.js', exportV21],
  ['vendor-excel-format-v48.js', vendorExcel],
  ['vendor-mbo-gap-v43.js', vendorGap],
  ['vendor-close-ui-v67.js', vendorClose]
]) {
  if (!text.includes('window.__SF_SHARED_CLOSED')) fail(name + ' must consume shared closedVendors state');
}
if (!unifiedFinal.includes('isClosed=closed.has(k),add=isClosed?0')) fail('product-group UI must force closed vendor need to zero');
for (const [name, text] of [['export-v21.js', exportV21], ['vendor-excel-format-v48.js', vendorExcel]]) {
  if (!text.includes('open=KEY.filter(v=>!closed.has(v))')) fail(name + ' must allocate product-group need only to open vendors');
  if (!text.includes('KEY.forEach(v=>gap[v]=0)')) fail(name + ' must initialize every managed vendor need to zero');
}
ok('closed vendor product-group MBO exclusion guards present');

const testKey = ['A','B','C'];
const testAvg = {A:50,B:30,C:20};
const testClosed = new Set(['B']);
const testNeed = 100;
const open = testKey.filter(v=>!testClosed.has(v));
const testGap = Object.fromEntries(testKey.map(v=>[v,0]));
const openAvg = open.reduce((s,v)=>s+testAvg[v],0);
let remain = testNeed;
open.forEach((v,i)=>{
  const share = openAvg ? testAvg[v]/openAvg : 1/open.length;
  const add = i===open.length-1 ? remain : Math.round(testNeed*share);
  testGap[v]=add;
  if(i!==open.length-1) remain-=add;
});
if (testGap.B !== 0) fail('closed vendor regression model allocated product-group need');
if (open.reduce((s,v)=>s+testGap[v],0) !== testNeed) fail('open vendor product-group need no longer reconciles to total need');
ok('closed vendor allocation regression model');


const runtimeJs = [
  'v16.js','bootstrap-v36.js','v16-legacy.js','shared-v31.js','master-upload-v34.js','upload-diff-v99.js',
  'upper-history-v39.js','vendor-mbo-gap-v43.js','vendor-close-ui-v67.js',
  'export-v19.js','export-v21.js','ui-streamline-v46.js','detail-shell-v61.js',
  'final-layout-v53.js','unified-loader-v74.js','unified-final-v73.js',
  'group-info-no-mbo-v82.js','group-no-mbo-final-v87.js','vendor-excel-format-v48.js','decision-radar-v93.js','master-text-editor-v95.js'
];
for (const file of runtimeJs) {
  try {
    execFileSync(process.execPath, ['--check', file], {stdio:'pipe'});
  } catch (e) {
    fail(file + ' JavaScript syntax check failed: ' + String(e.stderr || e.message).trim());
  }
  if (read(file).includes('\\nfunction')) fail(file + ' contains a literal \\n before function declaration');
}
ok('runtime JavaScript syntax checks');

const currentMonth = latestUpload.slice(0,7);
const currentRows = uploads.filter(r => String(r.d ?? r.date ?? '').slice(0,7) === currentMonth);
const skuNames = new Set(currentRows.map(r => String(r.m ?? r.material ?? '')).filter(Boolean));
if (!skuNames.size) fail('current month has no SKU/material data for drilldown');
else ok('current month SKU data available: ' + skuNames.size);

const legacy = read('v16-legacy.js');
const upperHistory = read('upper-history-v39.js');
const detailShell = read('detail-shell-v61.js');
const unified = read('unified-final-v73.js');
if (!legacy.includes('if(window.__SF_UNIFIED_FINAL_ACTIVE)return')) fail('legacy product-group renderer is not gated by unified renderer');
if (!upperHistory.includes('sf-vendor-scope-change')) fail('vendor scope handoff event is missing');
if (upperHistory.includes('MutationObserver')) fail('stage-one vendor renderer must remain event-driven');
if (!upperHistory.includes("let dataCache=null,dataSig=''")) fail('stage-one vendor renderer must cache monthly aggregates');
if (upperHistory.includes('show=hist.slice(-5)')) fail('vendor history must not drop older confirmed months as new months arrive');
if (!upperHistory.includes('show=hist;')) fail('vendor history must render the full confirmed-month range');
if (!upperHistory.includes('--v39-min-width')) fail('vendor history must widen cleanly for horizontal scrolling');
if (!upperHistory.includes('scrollLeft=box.scrollWidth')) fail('vendor history must open on the recent-month side while keeping older months scrollable');

for (const label of ['26.','확정월 평균','진행월 현재','직전월 대비 현재 증감','확정월 평균 대비 현재 증감','확정월 평균 대비 현재 매출율']) {
  if (label === '26.') continue;
  if (!upperHistory.includes(label)) fail('stage-one vendor table missing column: ' + label);
}
if (!unified.includes('window.__SF_UNIFIED_FINAL_ACTIVE=true')) fail('unified renderer activation flag is missing');
if (!unified.includes("window.addEventListener('sf-vendor-scope-change'")) fail('unified renderer does not consume vendor scope handoff');
if (!unified.includes("window.addEventListener('sf-detail-shell-ready'")) fail('SKU renderer does not recover when detail shell becomes ready');
if (unified.includes('show=hist.slice(-6)')) fail('product/SKU history must not drop older confirmed months');
if (!unified.includes('show=hist;return{ms,hist,show')) fail('product/SKU history must expose the full confirmed-month range');
if (!unified.includes('function fitHistory(t,count)')) fail('product/SKU tables must support readable horizontal history scrolling');

if (!detailShell.includes("window.dispatchEvent(new Event('sf-detail-shell-ready'))")) fail('detail shell ready event is missing');
if (!detailShell.includes("r.d?.slice(0,7)<=m")) fail('SKU product-group options are limited to current month instead of comparison history');
for (const label of ['확정월 평균','진행월 현재','직전월 대비 현재 증감','확정월 평균 대비 현재 증감','확정월 평균 대비 현재 매출율','업체 목표','추가 필요']) {
  if (!unified.includes(label)) fail('unified product-group MBO table missing column: ' + label);
}
ok('stage-one vendor detail and unified product/SKU drilldown guards present');


const radar = read('decision-radar-v93.js');
const finalLayout = read('final-layout-v53.js');
const forecastProgress = read('forecast-progress-v81.js');
const sharedRuntime = read('shared-v31.js');
if (!v16.includes("'decision-radar-v93.js'")) fail('decision radar is not preloaded by v16');
if (!exportLoader.includes("'decision-radar-v93.js'")) fail('decision radar is not loaded by final UI loader');
for (const label of ['운영 판단 · 이슈 레이더','월마감 전망','남은 MBO','잔여 영업일 필요 일평균','최근 3개월 마감 평균','월 마감 추세','관리업체 전체 현황','제품군 이슈']) {
  if (!radar.includes(label)) fail('decision radar missing decision label: ' + label);
}
if (radar.includes('MutationObserver')) fail('decision radar must remain event-driven and must not add MutationObserver');
if (!radar.includes('vendorStatus=KEY.map')) fail('decision radar must show all eight managed vendors');
if (!radar.includes('sf-radar-scroll')) fail('decision radar must provide scrollable issue tables');
if (radar.includes('slice(0,6)')) fail('product-group issue radar must not truncate issues to six rows');
if (!radar.includes("let renderTimer=null,dataCache=null,dataSig=''")) fail('decision radar must cache source rows');
if (!radar.includes('phase(m,last,bounds(m,hist,sched))') || !radar.includes('cuts[h]=eq(')) fail('decision radar must compare equivalent collection progress positions');
if (!radar.includes('krHolidays2026') || !radar.includes('customHolidaysByMonth')) fail('decision radar business days must exclude holidays');
if (!forecastProgress.includes('krHolidays2026') || !forecastProgress.includes('customHolidaysByMonth')) fail('overall forecast business days must exclude holidays');
if (!legacy.includes('krHolidays2026') || !legacy.includes('customHolidaysByMonth')) fail('legacy daily comparison business days must exclude holidays');
if (!upperHistory.includes('sf-radar-vendor-select')) fail('vendor table does not accept decision-radar drilldown');
if (!vendorClose.includes("th.textContent='마감 체크'")) fail('stage-one vendor table must expose the close check control');
if (!vendorClose.includes('sf-vendor-table-rendered')) fail('close controls must reinstall after stage-one render');
if (!vendorGap.includes("gapHead.textContent='MBO 대비 부족액'")) fail('stage-one vendor table must expose per-vendor MBO gap');
if (!vendorGap.includes('allocateGap(overallGap,mbo,mp,h,closed)')) fail('stage-one vendor gap allocation is missing');
if (!finalLayout.includes("group.insertAdjacentElement('afterend',mbo)")) fail('product-group MBO action panel is not placed after product-group status');
if (index.includes('id="dailyTable"')) fail('retired daily cumulative detail panel is still present in index');
if (legacy.includes('dayTable()')) fail('retired daily detail renderer is still called');
if (!radar.includes('recent3CloseAvg')) fail('decision radar does not calculate recent three-month close average');
if (!radar.includes('forecastVsRecent3')) fail('decision radar does not compare forecast with recent three-month close average');
if (!radar.includes('function trendSvg')) fail('decision radar close-trend visualization is missing');
if (!radar.includes('displayHist=allMonths.filter(x=>x<m&&total(x)>0)')) fail('decision radar must retain the full historical range for display');
if (!radar.includes('hist=displayHist.slice(-5)')) fail('forecast logic must remain limited to the recent five confirmed months');
if (!radar.includes('a.displayHist?.length?a.displayHist:a.hist')) fail('close-trend chart must render the full available history');
if (!radar.includes('sf-radar-trend-scroll')) fail('close-trend chart must provide horizontal access to older months');

if (!radar.includes('allClosed=KEY.every(name=>closed.has(name))')) fail('decision radar must detect all managed vendors closed');
if (!radar.includes("const E1=v=>Math.round((N(v)/1e8)*10)/10")) fail('decision radar must compare MBO status using displayed one-decimal eok values');
if (!radar.includes('mboMetDisplay=mbo?E1(current)>=E1(mbo):false')) fail('closed MBO achievement must use rounded display values');
if (!radar.includes("closeSignal='MBO 달성'")) fail('rounded closed-MBO success label is missing');
if (!radar.includes("const deltaMbo=a.mbo?(E1(a.current)-E1(a.mbo))*1e8:null")) fail('trend MBO delta must use the same one-decimal display basis');

if (!radar.includes('forecast=allClosed?current:rawForecast')) fail('decision radar forecast must collapse to current total when all vendors are closed');
if (!forecastProgress.includes('fc=closed?cur:cur/p')) fail('top forecast cards must collapse forecast to current total when all vendors are closed');
if (!forecastProgress.includes("window.addEventListener('sf-vendor-close-change'")) fail('forecast cards must refresh immediately after vendor close changes');
if (!radar.includes('showForecast=!a.allClosed')) fail('close-trend chart must suppress duplicate forecast marker after full close');
if (!radar.includes('<polyline points=')) fail('month-close visualization must use a time-series trend line');
if (!radar.includes('sf-radar-chart-stats')) fail('month-close visualization must expose compact current/MBO/average comparison stats');
if (!radar.includes('마감 확정')) fail('month-close visualization must surface the finalized close state');

ok('decision radar, vendor control, holiday-aware forecast, and information hierarchy guards present');

if (legacy.includes("$('mbo').oninput=function(){if(this.value==='')delete st.mbo")) fail('MBO typing must not trigger full legacy render');
if (!legacy.includes('sf-settings-committed')) fail('settings must emit a single commit event after editing');
if (vendorGap.includes("document.addEventListener('input',e=>{if(e.target?.id==='mbo')")) fail('vendor gap must not recalculate while MBO is being typed');
if (forecastProgress.includes("document.addEventListener('input',e=>{if(['mbo','first','second']")) fail('forecast must not recalculate while settings are being edited');
if (!sharedRuntime.includes('scheduleSettingsPublish(700)')) fail('shared settings persistence must be debounced');
if (!sharedRuntime.includes("typeof requestIdleCallback==='function'")) fail('shared settings persistence must be idle-scheduled');
ok('master settings edit performance guards present');


const dashboardTemplates = read('dashboard-templates-v103.js');
if (!v16.includes("'dashboard-templates-v103.js'")) fail('dashboard templates are not preloaded by v16');
if (!exportLoader.includes("'dashboard-templates-v103.js'")) fail('dashboard templates are not loaded by final UI loader');
if (!bootstrap.includes('window.__SF_DASHBOARD_THEME')) fail('bootstrap does not hydrate shared dashboardTheme');
if (!bootstrap.includes('document.documentElement.dataset.sfTheme')) fail('bootstrap must apply the saved theme before final UI render');
if (!sharedRuntime.includes('window.__sfPublishDashboardTheme')) fail('shared runtime does not publish dashboard template settings');
if (!sharedRuntime.includes("'Update shared dashboard design template'")) fail('dashboard template changes need a dedicated shared commit');
if (!sharedRuntime.includes("dashboardTheme:theme")) fail('shared runtime must persist dashboardTheme');
if (dashboardTemplates.includes('MutationObserver')) fail('dashboard template selector must remain event-driven');
for (const id of ["id:'default'","id:'a'","id:'b'","id:'c'","id:'d'"]) {
  if (!dashboardTemplates.includes(id)) fail('dashboard template preset missing: ' + id);
}
for (const label of ['현재 디자인','Executive Glass','Modular Control','Light Finance','Operations Focus']) {
  if (!dashboardTemplates.includes(label)) fail('dashboard template label missing: ' + label);
}
if (!dashboardTemplates.includes("b.id='sfTemplateBtn'")) fail('master design-template button is missing');
if (!dashboardTemplates.includes("window.addEventListener('sf-master-mode-change'")) fail('dashboard template selector is not gated by master mode');
if (!dashboardTemplates.includes("typeof window.__sfPublishDashboardTheme!=='function'")) fail('dashboard template selector does not use shared persistence');
if (!dashboardTemplates.includes("apply(before,false)")) fail('template cancel must revert the preview to the previously saved theme');
if (!dashboardTemplates.includes("data-restore")) fail('template selector must expose an explicit default-design restore action');
if (!dashboardTemplates.includes("selected!=='b'")) fail('modular template navigation lifecycle guard is missing');
if (!dashboardTemplates.includes('html[data-sf-theme="c"] body')) fail('light finance template CSS is missing');
if (!dashboardTemplates.includes('html[data-sf-theme="d"] #decisionRadarV93')) fail('operations-focused radar styling is missing');
ok('master-selectable dashboard templates, preview rollback, and shared theme persistence guards present');

const textEditor = read('master-text-editor-v95.js');
const kpiLayout = read('kpi-layout-v37.js');
if (!v16.includes("'master-text-editor-v95.js'")) fail('master text editor is not preloaded by v16');
if (!exportLoader.includes("'master-text-editor-v95.js'")) fail('master text editor is not loaded by final UI loader');
if (!bootstrap.includes('window.__SF_UI_TEXT')) fail('bootstrap does not expose shared uiText');
if (!sharedRuntime.includes('window.__sfPublishUiText')) fail('shared runtime does not publish dashboard text settings');
if (!sharedRuntime.includes("'Update shared dashboard text settings'")) fail('dashboard text settings do not have a dedicated shared commit');
if (textEditor.includes('MutationObserver')) fail('master text editor must remain event-driven');
for (const key of ['dashboard.title','dashboard.subtitle','kpi.mbo','kpi.current','kpi.forecast','section.radar.title','radar.close.label','radar.remaining.label','radar.needDaily.label','radar.recent3.label','radar.trend.title','section.vendor.title','section.group.title','section.mbo.title','section.sku.title']) {
  if (!textEditor.includes(key)) fail('master text editor missing editable field: ' + key);
}
if (!textEditor.includes("id='sfTextEditBtn'") && !textEditor.includes("id=\"sfTextEditBtn\"") && !textEditor.includes("b.id='sfTextEditBtn'")) fail('master text editor button is missing');
if (!textEditor.includes("window.addEventListener('sf-master-mode-change'")) fail('text editor is not gated by master mode changes');
if (!textEditor.includes("typeof window.__sfPublishUiText!=='function'")) fail('text editor does not use shared uiText persistence');
if (!kpiLayout.includes('data.kpiKey') && !kpiLayout.includes('dataset.kpiKey')) fail('KPI cards do not have stable semantic keys');
for (const key of ['mbo','current','mboRate','mboGap','paceTarget','paceGap','forecast','forecastRate']) {
  if (!kpiLayout.includes("'" + key + "'")) fail('KPI stable key missing: ' + key);
}
if (!kpiLayout.includes("sf-kpi-layout-updated")) fail('KPI layout does not notify text overrides after rerender');
if (!radar.includes("sf-radar-rendered")) fail('radar does not notify text overrides after rerender');
if (!finalLayout.includes("sf-layout-updated")) fail('final layout does not notify text overrides after title reset');
ok('master text editor, stable KPI keys, and shared uiText persistence guards present');

const visualPolish = read('visual-polish-v74.js');
if (!upperHistory.includes('sf-ratebar')) fail('stage-one vendor table is missing visual rate bars');
if (!unified.includes('sf-ratebar')) fail('product/SKU tables are missing visual rate bars');
if (!visualPolish.includes('content-visibility:auto')) fail('below-the-fold panels are not using deferred paint');
if (!finalLayout.includes("'sf-defer-render'")) fail('lower analysis panels are not marked for deferred paint');
if (!visualPolish.includes('#vendorTable th:nth-child(2)')) fail('wide vendor table is missing sticky identity columns');
if (!visualPolish.includes('#groupTable th:first-child')) fail('wide product/SKU tables are missing sticky identity columns');
if (!unified.includes("allCache=null,allSig=''")) fail('unified renderer sales-row cache is missing');
if (!legacy.includes('allCache=null')) fail('legacy renderer sales-row cache is missing');
if (legacy.includes('function render(){cards();vendor();groups();detail();compare();groupTarget()}')) fail('legacy renderer still computes hidden detail/compare tables on every render');
if (legacy.includes('function dayTable()')) fail('retired dayTable code is still bundled');
ok('visual readability and initial-render performance guards present');

const noMboFinal = read('group-no-mbo-final-v87.js');
if (noMboFinal.includes('show=hist.slice(-5)')) fail('no-MBO product history must not drop older confirmed months');
if (!noMboFinal.includes('show=hist')) fail('no-MBO product history must keep the full confirmed-month range');
if (!noMboFinal.includes('table.style.minWidth=Math.max(1180,700+show.length*88)')) fail('no-MBO product history must stay readable with horizontal scrolling');
ok('full historical month visibility and horizontal-scroll guards present');

const uiStreamline = read('ui-streamline-v46.js');
if (!radar.includes('3개월 평균 ') || !radar.includes('a.recent3CloseAvg')) fail('month-close chart is missing the three-month average benchmark label');
if (!radar.includes('class="average"')) fail('month-close chart legend is missing the three-month average benchmark');
if (unified.includes('MutationObserver')) fail('unified renderer still contains obsolete MutationObserver logic');
if (unifiedLoader.includes('QuietObserver') || unifiedLoader.includes('window.MutationObserver=')) fail('unified loader still monkeypatches global MutationObserver');
if (uiStreamline.includes('dailyTable') || uiStreamline.includes('collapseDaily')) fail('retired daily-detail UI code is still bundled');
ok('three-month visual benchmark and observer-cleanup guards present');

const seedText = read('data.js');
const seedData = JSON.parse(seedText.replace(/^window\.SEED_DATA\s*=\s*/, '').replace(/;\s*$/, ''));
if (!seedData.krHolidays2026 || !Object.keys(seedData.krHolidays2026).length) fail('KR holiday calendar is missing from seed data');
const currentMbo = Number(shared.mbo?.[currentMonth] || 0);
const currentTotal = currentRows.reduce((s,r)=>s+Number(r.a ?? r.amount ?? 0),0);
const roundEok1 = won => Math.round((Number(won)/1e8)*10)/10;

if (currentMbo > 0 && !Number.isFinite(Math.max(0,currentMbo*1e8-currentTotal))) fail('remaining MBO calculation is not finite');
const managedVendors=['백제약품영등포지점','백제약품(주)영남본부','대전백제약품','백제약품(주)원주지점','(주)인천약품','(주)복산나이스','유진약품(주)','아이팜코리아(주)'];
const currentClosed=new Set(shared.closedVendors?.[currentMonth]||[]);
if (managedVendors.every(v=>currentClosed.has(v))) {
  const closeAwareForecast=currentTotal;
  const roundedCurrent=roundEok1(currentTotal),roundedMbo=Math.round(currentMbo*10)/10;
  if (currentMbo>0 && roundedCurrent>=roundedMbo) ok('rounded closed-MBO status achieved: '+roundedCurrent+' >= '+roundedMbo);
  else if (currentMbo>0 && roundedCurrent<roundedMbo) ok('rounded closed-MBO status below target: '+roundedCurrent+' < '+roundedMbo);
  if (Math.abs(closeAwareForecast-currentTotal) > 0.5) fail('all-closed forecast model must equal the authoritative current total');
  ok('all managed vendors closed: forecast is locked to current total ' + currentTotal);
}

ok('decision input data is available');

if (process.exitCode) process.exit(process.exitCode);
console.log('HARNESS PASS');
