(()=>{'use strict';
const setBrand=()=>{const e=document.querySelector('.eyebrow'),h=document.querySelector('.top h1');if(e)e.textContent='SCM SALES Forecast CONTROL TOWER';if(h)h.textContent='종합도매 매출 · MBO 운영 대시보드';document.title='SCM SALES Forecast CONTROL TOWER | 종합도매 매출 · MBO 운영 대시보드'};
setBrand();
try{if('serviceWorker'in navigator)navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});if(window.caches)caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('sales-forecast-static-')).map(k=>caches.delete(k)))).catch(()=>{})}catch(e){}
const load=src=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=()=>reject(new Error(src+' 로드 실패'));document.body.appendChild(s)});
load('v16-legacy.js?v=30').then(()=>load('upload-v29.js?v=30')).then(()=>{setBrand();window.__sfCoreReady=true;window.dispatchEvent(new Event('sf-core-ready'))}).catch(err=>{const s=document.getElementById('status');if(s)s.textContent='대시보드 로딩 오류: '+err.message});
})();