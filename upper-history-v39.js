(()=>{'use strict';
const $=s=>document.querySelector(s),N=v=>Number(v||0),W=v=>(N(v)/1e8).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1}),P=v=>Number.isFinite(v)?`(${(v*100).toFixed(1)}%)`:'-',X=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY=[['수도권2,3','백제약품영등포지점'],['경남','백제약품(주)영남본부'],['충청','대전백제약품'],['강원','백제약품(주)원주지점'],['수도권1','(주)인천약품'],['수도권4,부산','(주)복산나이스'],['전라','유진약품(주)'],['대구','아이팜코리아(주)']],KN=KEY.map(x=>x[1]),BK=KEY.slice(0,4).map(x=>x[1]);
let upperVendor='',busy=false,lastViewMonth='';
function style(){if($('#upperHistoryV39Style'))return;const s=document.createElement('style');s.id='upperHistoryV39Style';s.textContent=`#vendorTable.v39-history th,#vendorTable.v39-history td{padding:8px 9px}#vendorTable.v39-history th:not(:first-child):not(:nth-child(2)),#vendorTable.v39-history td:not(:first-child):not(:nth-child(2)){text-align:right}.v39-current{background:linear-gradient(180deg,rgba(34,211,238,.13),rgba(20,184,166,.09))!important;color:#D5FFF8!important;border-left:2px solid rgba(34,211,238,.72)!important;border-right:2px solid rgba(34,211,238,.72)!important;font-size:13.2px!important;font-weight:950!important;letter-spacing:.01em!important;text-shadow:0 1px 0 #06131f,0 0 10px rgba(45,212,191,.20)!important}.v39-current-head{background:linear-gradient(180deg,#15364d,#123047)!important;color:#DDFBFF!important;border-left:2px solid rgba(34,211,238,.82)!important;border-right:2px solid rgba(34,211,238,.82)!important;border-top:2px solid rgba(34,211,238,.82)!important;font-weight:950!important;box-shadow:inset 0 0 0 1px rgba(125,211,252,.08)!important}.v39-overview .v39-current{border-bottom:2px solid rgba(34,211,238,.92)!important;background:linear-gradient(180deg,#15506b,#0f4058)!important;color:#E7FFFC!important}.v39-overview td{background:linear-gradient(90deg,#164e6e,#0e334d)!important;border-top:2px solid #4fd1c5!important;border-bottom:2px solid #4fd1c5!important;font-weight:900!important}.v39-click{cursor:pointer}.v39-click:hover td{background:rgba(79,209,197,.08)}.v39-selected td{background:rgba(79,209,197,.11)!important}.v39-cta{display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;background:#4fd1c5;color:#062033;font-size:10px;font-weight:900}.v39-month-note{color:#91a9c1;font-size:11px}.v39-pos{color:#59d98e!important}.v39-neg{color:#ff7285!important}.v39-rate-good{color:#59d98e!important}.v39-rate-bad{color:#ff7285!important}.sf-ratebar{position:relative;display:inline-flex;justify-content:flex-end;align-items:center;min-width:78px;height:20px;padding:0 6px;border-radius:6px;overflow:hidden;background:rgba(148,163,184,.08)}.sf-ratebar i{position:absolute;inset:0 auto 0 0;width:var(--rate);opacity:.18}.v39-rate-good .sf-ratebar i{background:#34D399}.v39-rate-bad .sf-ratebar i{background:#FB7185}.v39-rate-neutral{color:#9CAFC3!important}.v39-rate-neutral .sf-ratebar{background:rgba(148,163,184,.06)}.v39-comparison{white-space:nowrap}.v39-benchmark{color:#C2DAE7!important;font-weight:800!important}.sf-ratebar b{position:relative;z-index:1;font-size:10px}.v39-history{min-width:var(--v39-min-width,1280px)}.v39-scroll-note{display:inline-flex;align-items:center;gap:4px;margin-left:6px;padding:2px 6px;border:1px solid rgba(148,163,184,.18);border-radius:999px;color:#9fb2c5;background:rgba(15,23,42,.26);font-size:9.5px;font-weight:800;white-space:nowrap}`;document.head.appendChild(s)}
let dataCache=null,dataSig='';
function stored(){try{const z=JSON.parse(localStorage.getItem('sales_forecast_v16')||localStorage.getItem('sales_forecast_v15')||'{}');const a=z.up||z.uploadRows||z.uploads;return Array.isArray(a)&&a.length?a:(window.__SF_SHARED_UPLOADS||[])}catch(e){return window.__SF_SHARED_UPLOADS||[]}}
function data(){const up=stored(),seedRaw=window.SEED_DATA?.dailyRecords||[],sig=seedRaw.length+'|'+up.length+'|'+(window.__SF_SHARED_LAST||'');if(dataCache&&dataSig===sig)return dataCache;const normUp=up.map(r=>({d:r.d||r.date,v:r.v||r.vendor||'',a:N(r.a??r.amount)})),rep=new Set(normUp.map(r=>r.d)),all=seedRaw.map(r=>({d:r.date,v:r.vendor||'',a:N(r.amount)})).filter(r=>r.d&&!rep.has(r.d)).concat(normUp),byMonth={},vendor={};all.forEach(r=>{const m=r.d?.slice(0,7);if(!m)return;(byMonth[m]||(byMonth[m]=[])).push(r);const vm=vendor[m]||(vendor[m]={__total:0,__outside:0,__bk:0});vm.__total+=r.a;if(KN.includes(r.v))vm[r.v]=(vm[r.v]||0)+r.a;else vm.__outside+=r.a;if(BK.includes(r.v))vm.__bk+=r.a});dataCache={byMonth,vendor,months:Object.keys(byMonth).sort()};dataSig=sig;return dataCache}
const active=()=>$('#month')?.value||'';
function monthList(){const cur=active();return data().months.filter(m=>m<=cur)}
function rows(m){return data().byMonth[m]||[]}
function sum(rs){return rs.reduce((s,r)=>s+N(r.a),0)}
function amount(v,m){const vm=data().vendor[m]||{};if(v==='백제약품 전체 합계')return N(vm.__bk);if(v==='권역 외 업체')return N(vm.__outside);if(!v)return N(vm.__total);return N(vm[v])}

const DEFAULT_S={'2026-04':['2026-04-21','2026-04-24'],'2026-05':['2026-05-20','2026-05-26'],'2026-06':['2026-06-19','2026-06-24'],'2026-07':['2026-07-22','2026-07-27'],'2026-08':['2026-08-20','2026-08-25']};
let paceCache=null,paceSig='';
function holidays(m){const out=new Set(),kr=window.SEED_DATA?.krHolidays2026||{},custom=window.SEED_DATA?.customHolidaysByMonth||{};Object.keys(kr).forEach(d=>{if(d.slice(0,7)===m)out.add(d)});const x=custom[m];if(Array.isArray(x))x.forEach(d=>out.add(String(d)));else if(x&&typeof x==='object')Object.keys(x).forEach(d=>out.add(d));return out}
function biz(m){const [y,mo]=m.split('-').map(Number),out=[],hol=holidays(m);for(let d=new Date(Date.UTC(y,mo-1,1));d.getUTCMonth()===mo-1;d.setUTCDate(d.getUTCDate()+1)){const wd=d.getUTCDay(),ds=y+'-'+String(mo).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');if(wd!==0&&wd!==6&&!hol.has(ds))out.push(ds)}return out}
function schedule(){let s={};try{const z=JSON.parse(localStorage.getItem('sales_forecast_v16')||localStorage.getItem('sales_forecast_v15')||'{}');s=z.sched||{}}catch(e){}return {...DEFAULT_S,...(window.__sfSharedMeta?.sched||{}),...s}}
function schedIndex(m,date){if(!date)return null;const b=biz(m);return Math.max(0,Math.min(b.length-1,b.filter(d=>d<=date).length-1))}
function inferredBounds(m,hist,sched){const b=biz(m),den=Math.max(1,b.length-1),a=[[],[]];hist.forEach(h=>{const hb=biz(h),s=sched[h]||[];[0,1].forEach(k=>{const ix=schedIndex(h,s[k]);if(ix!=null&&hb.length>1)a[k].push(ix/(hb.length-1))})});const avg=x=>x.length?x.reduce((u,v)=>u+v,0)/x.length:null;let f=avg(a[0])??.55,g=avg(a[1])??.75,i=Math.round(den*f),j=Math.round(den*g);i=Math.max(1,Math.min(Math.max(1,b.length-3),i));j=Math.max(i+1,Math.min(Math.max(i+1,b.length-2),j));return[i,j]}
function bounds(m,hist,sched){const s=sched[m]||[],a=schedIndex(m,s[0]),b=schedIndex(m,s[1]);return a!=null&&b!=null&&b>a?[a,b]:inferredBounds(m,hist,sched)}
function phase(m,date,bnd){const b=biz(m),i=Math.max(0,b.filter(d=>d<=date).length-1),[a,c]=bnd;return i<=a?[0,a?i/a:0]:i<=c?[1,(i-a)/Math.max(1,c-a)]:[2,(i-c)/Math.max(1,b.length-1-c)]}
function equivalent(m,ph,bnd){const b=biz(m),[a,c]=bnd,i=ph[0]===0?Math.round(a*ph[1]):ph[0]===1?Math.round(a+(c-a)*ph[1]):Math.round(c+(b.length-1-c)*ph[1]);return b[Math.max(0,Math.min(b.length-1,i))]||''}
function sameDateMap(m,cut){const mp={__total:0,__outside:0,__bk:0};for(const r of rows(m)){if(r.d>cut)continue;mp.__total+=r.a;if(KN.includes(r.v))mp[r.v]=(mp[r.v]||0)+r.a;else mp.__outside+=r.a;if(BK.includes(r.v))mp.__bk+=r.a}return mp}
function paceContext(cur,hist){
 const d=data(),currentRows=d.byMonth[cur]||[],last=currentRows.reduce((s,r)=>!s||r.d>s?r.d:s,''),raw=window.SFDataReliability?.sourceAsOfDate(window.__sfSharedMeta||{},cur,last)||last,asOf=raw?.slice(0,7)===cur?raw:last;
 const sched=schedule(),sig=dataSig+'|'+cur+'|'+hist.join(',')+'|'+asOf+'|'+JSON.stringify(sched);
 if(paceCache&&paceSig===sig)return paceCache;
 const currentBiz=biz(cur),elapsed=currentBiz.filter(x=>x<=asOf).length,cuts={},aligned={};
 if(asOf&&hist.length&&elapsed>0){const ph=phase(cur,asOf,bounds(cur,hist,sched));for(const m of hist){cuts[m]=equivalent(m,ph,bounds(m,hist,sched));aligned[m]=sameDateMap(m,cuts[m])}}
 paceCache={month:cur,asOf,last,elapsed,totalBiz:currentBiz.length,cuts,aligned,available:!!(asOf&&hist.length&&elapsed>0)};paceSig=sig;return paceCache
}
function alignedAmount(v,m,context){const mp=context.aligned[m]||{};if(v==='백제약품 전체 합계')return N(mp.__bk);if(v==='권역 외 업체')return N(mp.__outside);if(!v)return N(mp.__total);return N(mp[v])}
function metrics(v,cur,hist,show,pace=paceContext(cur,hist)){
 const avg=hist.length?hist.reduce((s,m)=>s+amount(v,m),0)/hist.length:0,now=amount(v,cur),
 expected=pace.available?hist.reduce((s,m)=>s+alignedAmount(v,m,pace),0)/hist.length:null,
 previous=pace.available?alignedAmount(v,hist.at(-1),pace):null,
 prevDiff=previous==null?null:now-previous,avgDiff=expected==null?null:now-expected,
 rate=expected>0?now/expected:null;
 return{months:Object.fromEntries(show.map(m=>[m,amount(v,m)])),avg,now,expected,previous,prevDiff,avgDiff,rate};
}
function RB(v){if(v==null)return '<span class="sf-ratebar"><b>—</b></span>';const pct=Math.max(0,Math.min(140,N(v)*100))/140*100;return`<span class="sf-ratebar" style="--rate:${pct.toFixed(1)}%"><i></i><b>${P(v)}</b></span>`}
function signed(v){return v==null?'—':(v>0?'+':'')+W(v)}
function tone(v){return v==null?'v39-rate-neutral':v>=1?'v39-rate-good':'v39-rate-bad'}
function deltaTone(v){return v==null?'v39-rate-neutral':v>=0?'v39-pos':'v39-neg'}
function comparisonCells(x){
 const title=x.expected==null?'비교 가능한 기준일 정보가 없습니다.':x.expected>0?'진행월 누계 ÷ 과거 확정월 동일 수금 진행위치 평균 누계':'동일 진행위치 과거 매출이 없어 달성률을 판정하지 않습니다.';
 return`<td class="v39-benchmark">${x.expected==null?'—':W(x.expected)}</td><td class="${deltaTone(x.prevDiff)} v39-comparison">${signed(x.prevDiff)}</td><td class="${deltaTone(x.avgDiff)} v39-comparison">${signed(x.avgDiff)}</td><td class="${tone(x.rate)}" title="${title}">${RB(x.rate)}</td>`;
}
function row(region,v,cur,hist,show,pace,cls=''){const x=metrics(v,cur,hist,show,pace),sel=upperVendor===v?' v39-selected':'';return`<tr class="${cls}v39-click${sel}" data-v39="${X(v)}"><td>${X(region)}</td><td>${X(v)}</td>${show.map(m=>`<td>${W(x.months[m])}</td>`).join('')}<td>${W(x.avg)}</td><td class="v39-current">${W(x.now)}</td>${comparisonCells(x)}</tr>`}
function renderVendor(){
 const t=$('#vendorTable'),cur=active();if(!t||!cur)return;const ms=monthList(),hist=ms.filter(m=>m<cur),show=hist;if(!ms.length)return;
 const pace=paceContext(cur,hist);let body='';
 KEY.forEach((kv,i)=>{body+=row(kv[0],kv[1],cur,hist,show,pace);if(i===3)body+=row('백제약품 전체 합계','백제약품 전체 합계',cur,hist,show,pace,'subtotal ')});
 body+=row('권역 외 업체','권역 외 업체',cur,hist,show,pace,'subtotal ');
 const total=metrics('',cur,hist,show,pace);
 body+=`<tr class="v39-overview" data-v39-reset="1"><td>총합계</td><td><span class="v39-cta">↺ 전체 현황 보기</span></td>${show.map(m=>`<td>${W(amount('',m))}</td>`).join('')}<td>${W(total.avg)}</td><td class="v39-current">${W(total.now)}</td>${comparisonCells(total)}</tr>`;
 t.classList.add('v39-history');t.dataset.v39=cur;
 t.style.setProperty('--v39-min-width',Math.max(1350,850+show.length*88)+'px');
 const mm=String(Number(cur.slice(5,7)))+'월',dateLabel=pace.asOf?pace.asOf.replaceAll('-','.'):'확인 필요';
 t.innerHTML=`<thead><tr><th>권역</th><th>업체</th>${show.map(m=>`<th>${m.slice(2).replace('-','.')}</th>`).join('')}<th>확정월 평균</th><th class="v39-current-head">${mm} 누계</th><th>기준일 기대 누계</th><th>전월 동일시점 대비 증감</th><th>확정월 동일시점 대비 증감</th><th>기준일 대비 매출률</th></tr></thead><tbody>${body}</tbody>`;
 const p=t.closest('section.panel')?.querySelector('.head p'),range=show.length?(show[0].slice(2).replace('-','.')+'~'+show.at(-1).slice(2).replace('-','.')):'-';
 if(p)p.innerHTML=`업체 클릭 → 2단계 제품군 · <span class="v39-month-note">기준일 ${dateLabel}(업로드 기준) · 확정월 ${range} · 동일 수금 진행위치 누계 평균 대비 100% 이상 초록 / 미만 빨강 · 확정월 평균은 월 전체 실적</span>${show.length>5?'<span class="v39-scroll-note">← 좌우 스크롤로 이전월 확인 →</span>':''}`;
 const box=t.closest('.table');if(box&&lastViewMonth!==cur){lastViewMonth=cur;requestAnimationFrame(()=>{box.scrollLeft=box.scrollWidth})}
 window.__SF_VENDOR_PACE_META={asOf:pace.asOf,range};window.dispatchEvent(new CustomEvent('sf-vendor-table-rendered',{detail:{month:cur,asOf:pace.asOf}}))
}
window.__sfVendorPaceContext=paceContext;
window.__sfVendorPaceMetrics=metrics;

function render(){if(busy)return;busy=true;try{style();renderVendor();window.__SF_UPPER_VENDOR=upperVendor}finally{busy=false}}
document.addEventListener('click',e=>{if(e.target.closest('.v67-close-btn,[data-v67-close]'))return;const r=e.target.closest('#vendorTable [data-v39]');if(r){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();upperVendor=r.dataset.v39;render();window.dispatchEvent(new CustomEvent('sf-vendor-scope-change',{detail:{vendor:upperVendor}}));return}const reset=e.target.closest('#vendorTable [data-v39-reset]');if(reset){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();upperVendor='';render();window.dispatchEvent(new CustomEvent('sf-vendor-scope-change',{detail:{vendor:''}}))}},true);
document.addEventListener('change',e=>{if(e.target?.id==='month')setTimeout(render,20)});
window.addEventListener('sf-core-ready',()=>setTimeout(render,60));
window.addEventListener('sf-radar-vendor-select',e=>{upperVendor=e.detail?.vendor||'';render();window.dispatchEvent(new CustomEvent('sf-vendor-scope-change',{detail:{vendor:upperVendor}}))});
window.addEventListener('sf-data-refreshed',()=>{dataCache=null;dataSig='';paceCache=null;paceSig='';setTimeout(render,20)});
setTimeout(render,650);
})();