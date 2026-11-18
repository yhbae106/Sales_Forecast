(()=>{'use strict';
const STORE='sales_forecast_v16',CLOSE_KEY='sales_forecast_vendor_closed_v66',RAW_API='https://raw.githubusercontent.com/yhbae106/Sales_Forecast/main/shared-data/sales-history.json',CONTENTS_API='https://api.github.com/repos/yhbae106/Sales_Forecast/contents/shared-data/sales-history.json',EXPECT_KEY='sales_forecast_expected_shared_v98';
const reliability=window.SFDataReliability,controller=new AbortController(),generation=window.__sfBootstrapGeneration=(window.__sfBootstrapGeneration||0)+1;
window.addEventListener('pagehide',()=>controller.abort(),{once:true});
const $=s=>document.querySelector(s),status=m=>{const e=$('#status');if(e)e.textContent=m};
const setBrand=()=>{const e=$('.eyebrow'),h=$('.top h1');if(e)e.textContent='SCM SALES Forecast CONTROL TOWER';if(h)h.textContent='종합도매 매출 · MBO 운영 대시보드';document.title='SCM SALES Forecast CONTROL TOWER | 종합도매 매출 · MBO 운영 대시보드'};
const load=src=>window.__sfLoadScript(src);
function loadSeed() {
  if (window.SEED_DATA?.dailyRecords?.length) return Promise.resolve();
  return load('data.js?v=123').then(() => {
    if (!window.SEED_DATA?.dailyRecords?.length) throw new Error('기준 매출 자료를 확인할 수 없습니다.');
  });
}
function monthTotal(shared,month){return reliability.monthSummary(shared,month).total}
function expectedShared(){try{return JSON.parse(sessionStorage.getItem(EXPECT_KEY)||'null')}catch(e){return null}}
function matchesExpected(shared,expected){if(!expected)return true;const last=lastDate(shared);if(expected.updatedAt&&shared?.updatedAt&&String(shared.updatedAt)>String(expected.updatedAt))return !expected.last||last>=expected.last;if(expected.updatedAt&&shared?.updatedAt!==expected.updatedAt)return false;if(expected.last&&last!==expected.last)return false;if(expected.month&&Number.isFinite(Number(expected.total))&&Math.abs(monthTotal(shared,expected.month)-Number(expected.total))>.5)return false;return true}
function validateShared(shared){return reliability.validateShared(shared)}
async function readRawShared(){return reliability.requestJson(RAW_API+'?t='+Date.now(),{cache:'no-store',signal:controller.signal})}
async function readContentsShared(){return reliability.requestJson(CONTENTS_API+'?ref=main&t='+Date.now(),{headers:{Accept:'application/vnd.github.raw+json','X-GitHub-Api-Version':'2022-11-28'},cache:'no-store',signal:controller.signal})}
async function readSharedApi(){
  const expected=expectedShared();let lastError;
  // Both a network error and an older raw CDN response can use the authoritative API.
  for(const read of [readRawShared,readContentsShared]){
    try{const shared=validateShared(await read());if(matchesExpected(shared,expected)){if(expected)try{sessionStorage.removeItem(EXPECT_KEY)}catch(e){}return shared}lastError=new Error('방금 저장한 공용 자료의 반영을 아직 확인하지 못했습니다. 새로고침하여 다시 확인해 주세요.')}
    catch(error){if(error.name==='AbortError')throw error;lastError=error}
  }
  throw lastError||new Error('공용 자료를 확인하지 못했습니다.');
}
function lastDate(shared){return reliability.lastDataDate(shared)}
function displayDate(shared,dataLast){const month=String(dataLast||'').slice(0,7),hasSource=!!(shared?.sourceFiles||[]).some(s=>(s.month||String(s.lastDate||s.date||'').slice(0,7))===month);window.__SF_DATE_BASIS=hasSource?'upload':'sales';return hasSource?reliability.sourceAsOfDate(shared,month,dataLast):(dataLast||'')}
function readLocal(){try{return JSON.parse(localStorage.getItem(STORE)||localStorage.getItem('sales_forecast_v15')||'{}')}catch(e){return{}}}
async function hydrate(){
  const shared=await readSharedApi();
  if(controller.signal.aborted||generation!==window.__sfBootstrapGeneration){const error=new Error('이전 자료 확인을 취소했습니다.');error.name='AbortError';throw error}
  const up=shared.uploads;window.__SF_SHARED_UPLOADS=up;window.__sfSharedMeta=shared;window.__SF_UI_TEXT=shared.uiText&&typeof shared.uiText==='object'?shared.uiText:{};window.__SF_DASHBOARD_THEME='default';document.documentElement.dataset.sfTheme='default';window.__SF_LAST_UPLOAD_DIFF=shared.lastUploadDiff||null;window.__sfReadShared=window.__sfReadShared||readSharedApi;
  const local = shared.mbo != null && shared.gmbo != null && shared.sched != null ? {} : readLocal();
  let localClosed = {};
  if (shared.closedVendors == null) try { localClosed = JSON.parse(localStorage.getItem(CLOSE_KEY) || '{}'); } catch {}
  const lean={mbo:shared.mbo??local.mbo??{},gmbo:shared.gmbo??local.gmbo??local.groupMbo??{},sched:shared.sched??local.sched??{},up,sourceFiles:shared.sourceFiles||[]};
  window.__SF_BOOTSTRAP_LEAN=lean;window.__SF_SHARED_CLOSED=shared.closedVendors??localClosed;
  try{localStorage.setItem(STORE,JSON.stringify(lean));localStorage.setItem(CLOSE_KEY,JSON.stringify(window.__SF_SHARED_CLOSED));window.__SF_SHARED_STORAGE_FAILED=false}catch(e){window.__SF_SHARED_STORAGE_FAILED=true}
  const last=lastDate(shared);window.__SF_SHARED_LAST=last;window.__SF_DISPLAY_DATE=displayDate(shared,last);
  reliability.setView({kind:'live',shared,checkedAt:new Date().toISOString(),message:window.__SF_SHARED_STORAGE_FAILED?'현재 공용 자료를 표시합니다. 브라우저 저장 공간이 부족해 오프라인 사본은 갱신하지 못했습니다.':''});return last;
}
function installMemoryStore(){if(!window.__SF_SHARED_STORAGE_FAILED)return()=>{};const orig=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(this===localStorage&&(k===STORE||k==='sales_forecast_v15'))return JSON.stringify(window.__SF_BOOTSTRAP_LEAN||{});if(this===localStorage&&k===CLOSE_KEY)return JSON.stringify(window.__SF_SHARED_CLOSED||{});return orig.call(this,k)};return()=>{Storage.prototype.getItem=orig}}
function useCached(error){
  const local=readLocal();let cached=null;
  try{cached=validateShared({uploads:local.up||local.uploadRows||local.uploads||[],sourceFiles:local.sourceFiles||[]})}catch(e){window.__SF_BOOTSTRAP_LEAN={mbo:{},gmbo:{},sched:{},up:[]};window.__SF_SHARED_STORAGE_FAILED=true}
  const hasCached=!!cached?.uploads.length;
  window.__SF_SHARED_LAST=hasCached?lastDate(cached):'';window.__SF_DISPLAY_DATE=hasCached?displayDate(cached,window.__SF_SHARED_LAST):'';
  reliability.setView({kind:hasCached?'cached':'unavailable',shared:cached,checkedAt:'',message:error.message});
}
(async()=>{
  setBrand();
  const shared = hydrate().catch(error => {
    if (error.name === 'AbortError') throw error;
    useCached(error);
  });
  try { await Promise.all([shared, loadSeed()]); }
  catch (error) { if (error.name === 'AbortError') return; throw error; }
  if (controller.signal.aborted || generation !== window.__sfBootstrapGeneration) return;
  const restoreStore=installMemoryStore();
  try{await load('v16-legacy.js?v=134')}finally{restoreStore()}
  if(reliability.getView().kind==='unavailable'){
    const seed={uploads:window.SEED_DATA?.dailyRecords||[],sourceFiles:[]};window.__SF_SHARED_LAST=lastDate(seed);window.__SF_DISPLAY_DATE=displayDate(seed,window.__SF_SHARED_LAST);reliability.setView({shared:seed});
  }
  await load('shared-v31.js?v=134');await load('master-upload-v34.js?v=134');await load('upload-diff-v99.js?v=134');await load('kpi-layout-v37.js?v=134');await load('upper-history-v39.js?v=134');await load('vendor-mbo-gap-v43.js?v=134');await load('vendor-close-ui-v67.js?v=134');await load('boundary-forecast-v113.js?v=134');await load('forecast-progress-v81.js?v=134');await load('group-info-no-mbo-v82.js?v=134');
  setBrand();reliability.renderProof();
  await load('group-no-mbo-final-v87.js?v=134');window.__sfCoreReady=true;window.dispatchEvent(new Event('sf-core-ready'));
})().catch(error=>{status('대시보드 로딩 오류: '+error.message);window.__sfShowLoadError(error.message)});
})();
