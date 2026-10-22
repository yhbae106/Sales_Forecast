(()=>{'use strict';
const STORE='sales_forecast_v16',CLOSE_KEY='sales_forecast_vendor_closed_v66',RAW_API='https://raw.githubusercontent.com/yhbae106/Sales_Forecast/main/shared-data/sales-history.json',CONTENTS_API='https://api.github.com/repos/yhbae106/Sales_Forecast/contents/shared-data/sales-history.json',EXPECT_KEY='sales_forecast_expected_shared_v98';
const reliability=window.SFDataReliability,controller=new AbortController(),generation=window.__sfBootstrapGeneration=(window.__sfBootstrapGeneration||0)+1;
window.addEventListener('pagehide',()=>controller.abort(),{once:true});
const $=s=>document.querySelector(s),status=m=>{const e=$('#status');if(e)e.textContent=m};
const setBrand=()=>{const e=$('.eyebrow'),h=$('.top h1');if(e)e.textContent='SCM SALES Forecast CONTROL TOWER';if(h)h.textContent='종합도매 매출 · MBO 운영 대시보드';document.title='SCM SALES Forecast CONTROL TOWER | 종합도매 매출 · MBO 운영 대시보드'};
const short=d=>d?Number(d.slice(5,7))+'/'+Number(d.slice(8))+'까지 반영 완료':'공용 데이터 대기';
const asofText=d=>d?Number(d.slice(5,7))+'/'+Number(d.slice(8))+' 실적 기준':'실적 기준일 확인 필요';
const load=src=>window.__sfLoadScript(src);
const waitSeed=(max=15000)=>new Promise((resolve,reject)=>{if(window.SEED_DATA?.dailyRecords?.length)return resolve(true);const started=Date.now(),id=setInterval(()=>{if(window.SEED_DATA?.dailyRecords?.length){clearInterval(id);resolve(true)}else if(controller.signal.aborted||Date.now()-started>=max){clearInterval(id);reject(new Error('기준 매출 자료를 불러오지 못했습니다. 다시 확인해 주세요.'))}},40)});
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
function displayDate(shared,dataLast){return dataLast||''}
function applyDisplayDate(){const d=window.__SF_DISPLAY_DATE||window.__SF_SHARED_LAST||'';if(d){if(reliability.getView().kind==='live')status(short(d));const a=$('#asof');if(a)a.textContent=asofText(d)}}
function readLocal(){try{return JSON.parse(localStorage.getItem(STORE)||localStorage.getItem('sales_forecast_v15')||'{}')}catch(e){return{}}}
async function hydrate(){
  const shared=await readSharedApi();
  if(controller.signal.aborted||generation!==window.__sfBootstrapGeneration){const error=new Error('이전 자료 확인을 취소했습니다.');error.name='AbortError';throw error}
  const up=shared.uploads;window.__SF_SHARED_UPLOADS=up;window.__sfSharedMeta=shared;window.__SF_UI_TEXT=shared.uiText&&typeof shared.uiText==='object'?shared.uiText:{};window.__SF_DASHBOARD_THEME='default';document.documentElement.dataset.sfTheme='default';window.__SF_LAST_UPLOAD_DIFF=shared.lastUploadDiff||null;window.__sfReadShared=window.__sfReadShared||readSharedApi;
  const local=readLocal();let localClosed={};try{localClosed=JSON.parse(localStorage.getItem(CLOSE_KEY)||'{}')}catch(e){}
  const lean={mbo:shared.mbo??local.mbo??{},gmbo:shared.gmbo??local.gmbo??local.groupMbo??{},sched:shared.sched??local.sched??{},up};
  window.__SF_BOOTSTRAP_LEAN=lean;window.__SF_SHARED_CLOSED=shared.closedVendors??localClosed;
  try{localStorage.setItem(STORE,JSON.stringify(lean));localStorage.setItem(CLOSE_KEY,JSON.stringify(window.__SF_SHARED_CLOSED));window.__SF_SHARED_STORAGE_FAILED=false}catch(e){window.__SF_SHARED_STORAGE_FAILED=true}
  const last=lastDate(shared);window.__SF_SHARED_LAST=last;window.__SF_DISPLAY_DATE=displayDate(shared,last);
  reliability.setView({kind:'live',shared,checkedAt:new Date().toISOString(),message:window.__SF_SHARED_STORAGE_FAILED?'현재 공용 자료를 표시합니다. 브라우저 저장 공간이 부족해 오프라인 사본은 갱신하지 못했습니다.':''});applyDisplayDate();return last;
}
function installMemoryStore(){if(!window.__SF_SHARED_STORAGE_FAILED)return()=>{};const orig=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(this===localStorage&&(k===STORE||k==='sales_forecast_v15'))return JSON.stringify(window.__SF_BOOTSTRAP_LEAN||{});if(this===localStorage&&k===CLOSE_KEY)return JSON.stringify(window.__SF_SHARED_CLOSED||{});return orig.call(this,k)};return()=>{Storage.prototype.getItem=orig}}
function useCached(error){
  const local=readLocal();let cached=null;
  try{cached=validateShared({uploads:local.up||local.uploadRows||local.uploads||[],sourceFiles:[]})}catch(e){window.__SF_BOOTSTRAP_LEAN={mbo:{},gmbo:{},sched:{},up:[]};window.__SF_SHARED_STORAGE_FAILED=true}
  const hasCached=!!cached?.uploads.length;
  window.__SF_DISPLAY_DATE=hasCached?lastDate(cached):'';window.__SF_SHARED_LAST=window.__SF_DISPLAY_DATE;
  reliability.setView({kind:hasCached?'cached':'unavailable',shared:cached,checkedAt:'',message:error.message});
  status(hasCached?'이전 저장 자료를 표시합니다. 최신 공용 자료 확인에 실패했습니다.':'최신 공용 자료 확인에 실패했습니다. 내장 기준자료를 불러옵니다.');
}
(async()=>{
  setBrand();try{await hydrate()}catch(error){if(error.name==='AbortError')return;useCached(error)}
  const restoreStore=installMemoryStore();
  try{await load('v16-legacy.js?v=122');await waitSeed()}finally{restoreStore()}
  if(reliability.getView().kind==='unavailable'){
    const seed={uploads:window.SEED_DATA?.dailyRecords||[],sourceFiles:[]};window.__SF_DISPLAY_DATE=lastDate(seed);reliability.setView({shared:seed});
  }
  await load('shared-v31.js?v=122');await load('master-upload-v34.js?v=122');await load('upload-diff-v99.js?v=122');await load('kpi-layout-v37.js?v=122');await load('upper-history-v39.js?v=122');await load('vendor-mbo-gap-v43.js?v=122');await load('vendor-close-ui-v67.js?v=122');await load('boundary-forecast-v113.js?v=122');await load('forecast-progress-v81.js?v=122');await load('group-info-no-mbo-v82.js?v=122');
  setBrand();applyDisplayDate();setTimeout(applyDisplayDate,100);setTimeout(applyDisplayDate,800);
  await load('group-no-mbo-final-v87.js?v=122');window.__sfCoreReady=true;window.dispatchEvent(new Event('sf-core-ready'));
})().catch(error=>{status('대시보드 로딩 오류: '+error.message);window.__sfShowLoadError(error.message)});
})();
