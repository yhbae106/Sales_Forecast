(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],N=v=>Number(v||0),W=v=>(N(v)/1e8).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1}),P=v=>Number.isFinite(v)?`(${(v*100).toFixed(1)}%)`:'-',X=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),RB=v=>{const pct=Math.max(0,Math.min(140,N(v)*100))/140*100;return`<span class="sf-ratebar" style="--rate:${pct.toFixed(1)}%"><i></i><b>${P(v)}</b></span>`};
const STORE='sales_forecast_v16',CLOSE_KEY='sales_forecast_vendor_closed_v66',KEY=['백제약품영등포지점','백제약품(주)영남본부','대전백제약품','백제약품(주)원주지점','(주)인천약품','(주)복산나이스','유진약품(주)','아이팜코리아(주)'];let upperVendor='',gSort='avg',gDir='desc',cSort='avg',cDir='desc',mSort='avg',mDir='desc',busy=false,inputTm,allCache=null,allSig='';
window.__SF_UNIFIED_FINAL_ACTIVE=true;upperVendor=window.__SF_UPPER_VENDOR||'';
function state(){try{return JSON.parse(localStorage.getItem(STORE)||localStorage.getItem('sales_forecast_v15')||'{}')}catch(e){return{}}}
function saveState(z){try{localStorage.setItem(STORE,JSON.stringify(z))}catch(e){}}
function closeState(){let local={};try{local=JSON.parse(localStorage.getItem(CLOSE_KEY)||'{}')}catch(e){}const shared=window.__SF_SHARED_CLOSED;return shared&&typeof shared==='object'?{...local,...shared}:local}
function closedSet(){return new Set(closeState()[cur()]||[])}
function stored(){const z=state(),a=z.up||z.uploadRows||z.uploads;return Array.isArray(a)&&a.length?a:(window.__SF_SHARED_UPLOADS||[])}
function all(){const raw=window.SEED_DATA?.dailyRecords||[],storedRows=stored(),sig=raw.length+'|'+storedRows.length+'|'+(window.__SF_SHARED_LAST||'');if(allCache&&sig===allSig)return allCache;const up=storedRows.map(r=>({d:r.d||r.date,v:r.v||r.vendor||'',g:r.g||r.productGroup||'미분류',m:r.m||r.material||'미분류',a:N(r.a??r.amount)})),rep=new Set(up.map(r=>r.d)),seed=raw.map(r=>({d:r.date,v:r.vendor||'',g:r.productGroup||'미분류',m:r.material||'미분류',a:N(r.amount)}));allCache=seed.filter(r=>!rep.has(r.d)).concat(up);allSig=sig;return allCache}
const cur=()=>$('#month')?.value||'';
function months(){return[...new Set(all().map(r=>r.d?.slice(0,7)).filter(m=>m&&m<=cur()))].sort()}
function history(){const ms=months(),hist=ms.filter(m=>m<cur()),show=hist;return{ms,hist,show,last:hist.at(-1)||''}}
function scope(rs,v){if(!v)return rs;if(v==='권역 외 업체')return rs.filter(r=>!KEY.includes(r.v));if(v==='백제약품 전체 합계')return rs.filter(r=>KEY.slice(0,4).includes(r.v));return rs.filter(r=>r.v===v)}
function map(rs,key){const o={};rs.forEach(r=>{const k=r[key]||'미분류';o[k]=(o[k]||0)+N(r.a)});return o}
function style(){if($('#unifiedFinalV73Style'))return;const s=document.createElement('style');s.id='unifiedFinalV73Style';s.textContent=`#groupTable th[data-v61],#v51CompareTable th[data-v61],#groupTargetTable th[data-v61]{cursor:pointer;user-select:none}#groupTable th[data-v61]:hover,#v51CompareTable th[data-v61]:hover,#groupTargetTable th[data-v61]:hover{color:#4fd1c5!important;background:#173752!important}.v61-active{color:#4fd1c5!important;background:#173752!important}.v61-pos{color:#59d98e!important}.v61-neg{color:#ff7285!important}.v61-current{background:rgba(79,209,197,.07)!important;color:#9df4e7!important}.v61-target{color:#66a7ff!important;font-weight:800}.v61-need{color:#ffb454!important;font-weight:800}.v61-context{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0 11px;padding:8px 11px;border:1px solid #4fd1c5;border-radius:10px;background:rgba(79,209,197,.08);font-size:11px;color:#cfe9ec}.v61-context strong{color:#fff;background:rgba(79,209,197,.14);border:1px solid rgba(79,209,197,.45);border-radius:999px;padding:3px 9px}.v61-context .arr{color:#4fd1c5;font-weight:900}.v61-mbo-summary{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:8px 0}.v61-mbo-summary .label{font-size:10px;color:#91a9c1;font-weight:800}.v61-chip{font-size:10px;padding:4px 8px;border:1px solid #315a75;border-radius:999px;background:#0d2b42;color:#d7edf5}.v61-chip b{color:#4fd1c5}.v73-closed td{opacity:.62;background:rgba(120,135,150,.05)!important}.v73-closed td:first-child,.v73-closed td.v61-current{opacity:1}.v73-badge{display:inline-block;margin-left:6px;padding:2px 6px;border-radius:999px;border:1px solid #738397;background:rgba(115,131,151,.16);color:#c7d2df;font-size:9px;font-weight:900;white-space:nowrap}.v52-group-banner,.v54-context,.v58-context{display:none!important}.sf-ratebar{position:relative;display:inline-flex;justify-content:flex-end;align-items:center;min-width:78px;height:20px;padding:0 6px;border-radius:6px;overflow:hidden;background:rgba(148,163,184,.08)}.sf-ratebar i{position:absolute;inset:0 auto 0 0;width:var(--rate);background:currentColor;opacity:.16}.sf-ratebar b{position:relative;z-index:1;font-size:10px}`;document.head.appendChild(s)}
function fitHistory(t,count){if(!t)return;t.style.minWidth=Math.max(1180,700+count*88)+'px';const box=t.closest('.table'),m=cur();if(box&&t.dataset.historyViewMonth!==m){t.dataset.historyViewMonth=m;requestAnimationFrame(()=>{box.scrollLeft=box.scrollWidth})}}
function th(k,l,sk,sd){return`<th data-v61="${X(k)}" class="${sk===k?'v61-active':''}">${l} ${sk===k?(sd==='asc'?'▲':'▼'):'↕'}</th>`}
function sortRows(rows,k,d){const val=(r,key)=>key==='name'?r.name:key.startsWith('m:')?N(r.months[key.slice(2)]):N(r[key]);rows.sort((a,b)=>k==='name'?(d==='asc'?1:-1)*String(a.name).localeCompare(String(b.name),'ko'):(d==='asc'?1:-1)*(val(a,k)-val(b,k)));return rows}
function metrics(kind,vendor='',group=''){const {ms,hist,show,last}=history(),maps={};ms.forEach(m=>{let rs=scope(all().filter(r=>r.d?.slice(0,7)===m),vendor);if(group)rs=rs.filter(r=>r.g===group);maps[m]=map(rs,kind)});const names=[...new Set(ms.flatMap(m=>Object.keys(maps[m]||{})))],cm=maps[cur()]||{};return{show,rows:names.map(name=>{const mo=Object.fromEntries(show.map(m=>[m,N(maps[m]?.[name])])),avg=hist.length?hist.reduce((s,m)=>s+N(maps[m]?.[name]),0)/hist.length:0,now=N(cm[name]),prev=N(maps[last]?.[name]);return{name,months:mo,avg,now,prevDiff:now-prev,avgDiff:now-avg,rate:avg?now/avg:0}})}}
function renderGroup(){const t=$('#groupTable');if(!t||!cur())return;const r=metrics('g',upperVendor);sortRows(r.rows,gSort,gDir);t.innerHTML=`<thead><tr>${th('name','제품군',gSort,gDir)}${r.show.map(m=>th('m:'+m,m.slice(2).replace('-','.'),gSort,gDir)).join('')}${th('avg','확정월 평균',gSort,gDir)}${th('now','진행월 현재',gSort,gDir)}${th('prevDiff','직전월 대비 현재 증감',gSort,gDir)}${th('avgDiff','확정월 평균 대비 현재 증감',gSort,gDir)}${th('rate','확정월 평균 대비 현재 매출율',gSort,gDir)}</tr></thead><tbody>${r.rows.map(x=>`<tr data-v61-group="${X(x.name)}"><td>${X(x.name)}</td>${r.show.map(m=>`<td>${W(x.months[m])}</td>`).join('')}<td>${W(x.avg)}</td><td class="v61-current">${W(x.now)}</td><td class="${x.prevDiff>=0?'v61-pos':'v61-neg'}">${x.prevDiff>=0?'+':''}${W(x.prevDiff)}</td><td class="${x.avgDiff>=0?'v61-pos':'v61-neg'}">${x.avgDiff>=0?'+':''}${W(x.avgDiff)}</td><td class="${x.rate>=1?'v61-pos':'v61-neg'}">${RB(x.rate)}</td></tr>`).join('')}</tbody>`;fitHistory(t,r.show.length)}
function syncSkuVendor(v){const s=$('#v51Vendor');if(!s)return;const wanted=[...s.options].some(o=>o.value===v)?v:'';if(s.value!==wanted){s.value=wanted;s.dispatchEvent(new Event('change',{bubbles:true}))}}

let lastSkuMatrixGroup='';
function buildSkuMatrix(source,group,vendor,selected,hist,show,last){
 const skuMap=new Map(),total=Object.create(null),seenVendors=new Set();
 const add=(o,m,a)=>o[m]=(o[m]||0)+N(a);
 const filtered=scope(source.filter(r=>r.g===group&&r.d&&r.d.slice(0,7)<=selected),vendor);
 for(const r of filtered){
  const sku=String(r.m||'미분류'),v=String(r.v||'미분류'),mo=r.d.slice(0,7);
  if(!skuMap.has(sku))skuMap.set(sku,{name:sku,month:Object.create(null),vendors:new Map()});
  const x=skuMap.get(sku);
  if(!x.vendors.has(v))x.vendors.set(v,{name:v,month:Object.create(null)});
  add(x.month,mo,r.a);add(x.vendors.get(v).month,mo,r.a);add(total,mo,r.a);seenVendors.add(v);
 }
 function metric(name,mo){
  const months=Object.fromEntries(show.map(m=>[m,N(mo[m])]));
  const now=N(mo[selected]),prev=N(mo[last]);
  const avg=hist.length?hist.reduce((s,m)=>s+N(mo[m]),0)/hist.length:0;
  return{name,months,now,prev,avg,prevDiff:now-prev,avgDiff:now-avg,rate:avg?now/avg:0};
 }
 const skus=[...skuMap.values()].map(s=>{const subtotal=metric(s.name,s.month);
  const details=[...s.vendors.values()].map(v=>({...metric(v.name,v.month),share:subtotal.now>0?N(v.month[selected])/subtotal.now:null}));
  return{name:s.name,subtotal,details};
 });
 return{skus,grand:metric('제품군 합계',total),skuCount:skus.length,vendorCount:seenVendors.size};
}
function matrixOrder(a,b,key,dir){
 const sign=dir==='asc'?1:-1;
 if(key==='name'||key==='vendor')return sign*String(a.name).localeCompare(String(b.name),'ko');
 const num=r=>key.startsWith('m:')?N(r.months[key.slice(2)]):N(r[key]);
 return sign*(num(a)-num(b))||String(a.name).localeCompare(String(b.name),'ko');
}
const matrixW=v=>{const n=Math.round(N(v)/1e6)/100;return(Object.is(n,-0)?0:n).toLocaleString('ko-KR',{minimumFractionDigits:2,maximumFractionDigits:2})};
const matrixExcel=v=>Number((N(v)/1e8).toFixed(4));
const matrixPercent=r=>Number.isFinite(r)?(r*100).toFixed(1)+'%':'-';
function matrixStyle(){
 if($('#skuVendorMatrixStyleV115'))return;
 const s=document.createElement('style');s.id='skuVendorMatrixStyleV115';
 s.textContent=`#v51CompareTable.sku-v115-matrix{border-collapse:separate;border-spacing:0}
 #v51CompareTable.sku-v115-matrix th:first-child,#v51CompareTable.sku-v115-matrix td:first-child{position:sticky;left:0;width:300px;min-width:300px;max-width:300px;overflow:hidden;text-overflow:ellipsis;z-index:4}
 #v51CompareTable.sku-v115-matrix th:nth-child(2),#v51CompareTable.sku-v115-matrix td:nth-child(2){position:sticky;left:300px;width:195px;min-width:195px;max-width:195px;overflow:hidden;text-overflow:ellipsis;text-align:left;z-index:4}
 #v51CompareTable.sku-v115-matrix thead th:first-child,#v51CompareTable.sku-v115-matrix thead th:nth-child(2){background:#173752!important;z-index:8}
 #v51CompareTable.sku-v115-matrix tbody td:first-child,#v51CompareTable.sku-v115-matrix tbody td:nth-child(2){background:#19293e!important}
 #v51CompareTable.sku-v115-matrix tr.sku-v115-subtotal td{background:#123650!important;font-weight:850;border-top:1px solid #436984}
 #v51CompareTable.sku-v115-matrix tr.sku-v115-grand td{background:#0e4450!important;font-weight:900;border-top:2px solid #4fd1c5}
 #v51CompareTable.sku-v115-matrix tr.sku-v115-detail td:first-child{color:#92a9c1;font-weight:400}
 #v51CompareTable.sku-v115-matrix tr.sku-v115-detail:hover td{background:#243b53!important}
 #v51CompareTable.sku-v115-matrix .sku-v115-now{color:#9df4e7!important;font-weight:850}
 #v51CompareTable.sku-v115-matrix .sku-v115-share{color:#b9d9ec}
 #v51CompareTable.sku-v115-matrix .sku-v115-fold{border:1px solid #42738c;background:#12334c;color:#aaf4eb;border-radius:5px;padding:2px 6px;font-size:10px;margin-right:8px;cursor:pointer}
 #v51CompareTable.sku-v115-matrix .sku-v115-fold:focus-visible{outline:2px solid #4fd1c5}
 #v51CompareTable.sku-v115-matrix tr[hidden]{display:none!important}
 #v51CompareTable.sku-v115-single thead th:nth-child(2),#v51CompareTable.sku-v115-single tbody td:nth-child(2){position:static!important;left:auto!important;min-width:105px!important;max-width:none!important;width:auto!important;text-align:right!important}#v51CompareTable.sku-v115-single tbody tr.sku-v115-single-row td:first-child{font-weight:750;color:#e7f8ff}#v51CompareTable.sku-v115-single tbody tr.sku-v115-single-row:hover td{background:#233b52!important}
 .sku-v115-summary{display:flex;flex-wrap:wrap;gap:11px;align-items:center;padding:10px 12px;margin:6px 0 12px;border:1px solid #264d63;border-radius:10px;background:#0e273b;font-size:11px;color:#adc7dc}
 .sku-v115-summary strong{font-size:13px;color:#eefaff;margin-left:6px}
 .sku-v115-summary small{flex-basis:100%;color:#90b1c8;font-size:10px}`;
 document.head.appendChild(s);
}
function renderSkuMatrix(t,vendor,group){
 matrixStyle();const singleVendor=!!vendor&&vendor!=='백제약품 전체 합계'&&vendor!=='권역 외 업체';t.classList.add('sku-v115-matrix');t.classList.toggle('sku-v115-single',singleVendor);
 if(lastSkuMatrixGroup!==group){cSort='now';cDir='desc';lastSkuMatrixGroup=group}if(singleVendor&&(cSort==='vendor'||cSort==='share')){cSort='now';cDir='desc'}
 const {hist,show,last}=history(),r=buildSkuMatrix(all(),group,vendor,cur(),hist,show,last);
 const mm=String(Number(cur().slice(5,7)))+'월',prevName=last?String(Number(last.slice(5,7)))+'월 마감':'직전월';
 const headings=singleVendor?['SKU / 상세 제품명','진행월 현재',prevName,'직전월 대비 현재 증감','확정월 평균','확정월 평균 대비 현재 증감',...show.map(m=>m.slice(2).replace('-','.'))]:['SKU / 상세 제품명','업체','진행월 현재','SKU 내 업체 비중',prevName,'직전월 대비 현재 증감','확정월 평균','확정월 평균 대비 현재 증감',...show.map(m=>m.slice(2).replace('-','.'))];
 const head='<thead><tr>'+(singleVendor?[th('name',headings[0],cSort,cDir),th('now',headings[1],cSort,cDir),th('prev',headings[2],cSort,cDir),th('prevDiff',headings[3],cSort,cDir),th('avg',headings[4],cSort,cDir),th('avgDiff',headings[5],cSort,cDir)].join(''):[th('name',headings[0],cSort,cDir),th('vendor',headings[1],cSort,cDir),th('now',headings[2],cSort,cDir),th('share',headings[3],cSort,cDir),th('prev',headings[4],cSort,cDir),th('prevDiff',headings[5],cSort,cDir),th('avg',headings[6],cSort,cDir),th('avgDiff',headings[7],cSort,cDir)].join(''))+show.map(m=>th('m:'+m,m.slice(2).replace('-','.'),cSort,cDir)).join('')+'</tr></thead>';
 const skuKey=cSort==='vendor'||cSort==='share'?'now':cSort;
 const ordered=r.skus.sort((a,b)=>matrixOrder(a.subtotal,b.subtotal,skuKey,cDir));
 const rows=[],excel=[headings.map((h,i)=>singleVendor?(i===0?h:h+' (억 원)'):(i===3?h+' (%)':i===0||i===1?h:h+' (억 원)'))];
 function cols(p,share){
  const signed=x=>x>0?'+':'';
  if(singleVendor)return `<td class="sku-v115-now">${matrixW(p.now)}</td><td>${matrixW(p.prev)}</td><td class="${p.prevDiff>=0?'v61-pos':'v61-neg'}">${signed(p.prevDiff)}${matrixW(p.prevDiff)}</td><td>${matrixW(p.avg)}</td><td class="${p.avgDiff>=0?'v61-pos':'v61-neg'}">${signed(p.avgDiff)}${matrixW(p.avgDiff)}</td>${show.map(m=>`<td>${matrixW(p.months[m])}</td>`).join('')}`;
  return `<td class="sku-v115-now">${matrixW(p.now)}</td><td class="sku-v115-share">${matrixPercent(share)}</td><td>${matrixW(p.prev)}</td><td class="${p.prevDiff>=0?'v61-pos':'v61-neg'}">${signed(p.prevDiff)}${matrixW(p.prevDiff)}</td><td>${matrixW(p.avg)}</td><td class="${p.avgDiff>=0?'v61-pos':'v61-neg'}">${signed(p.avgDiff)}${matrixW(p.avgDiff)}</td>${show.map(m=>`<td>${matrixW(p.months[m])}</td>`).join('')}`;
 }
 function exportRow(sku,v,p,share){
  if(singleVendor)return[sku,matrixExcel(p.now),matrixExcel(p.prev),matrixExcel(p.prevDiff),matrixExcel(p.avg),matrixExcel(p.avgDiff),...show.map(m=>matrixExcel(p.months[m]))];
  return[sku,v,matrixExcel(p.now),Number.isFinite(share)?Number((share*100).toFixed(2)):'',matrixExcel(p.prev),matrixExcel(p.prevDiff),matrixExcel(p.avg),matrixExcel(p.avgDiff),...show.map(m=>matrixExcel(p.months[m]))];
 }
 ordered.forEach((node,i)=>{
  const sum=node.subtotal,n=node.details.length,vendorKey=cSort==='name'?'now':cSort;
  if(singleVendor){
   rows.push(`<tr class="sku-v115-single-row"><td title="${X(node.name)}">${X(node.name)}</td>${cols(sum,null)}</tr>`);
   excel.push(exportRow(node.name,vendor,sum,null));
   return;
  }
  node.details.sort((a,b)=>matrixOrder(a,b,vendorKey,cDir));
  rows.push(`<tr class="sku-v115-subtotal"><td title="${X(node.name)}"><button type="button" class="sku-v115-fold" data-sku-v115-fold="${i}" aria-expanded="false" aria-label="${X(node.name)} 업체 상세 펼치기">▸</button>${X(node.name)} <span style="font-size:10px;color:#9dbfd3">${n}개 업체</span></td><td>SKU 소계</td>${cols(sum,sum.now>0?1:null)}</tr>`);
  excel.push(exportRow(node.name,'SKU 소계',sum,sum.now>0?1:null));
  node.details.forEach(d=>{
   rows.push(`<tr hidden class="sku-v115-detail" data-sku-v115-parent="${i}"><td title="${X(node.name)}">↳ ${X(node.name)}</td><td title="${X(d.name)}">${X(d.name)}</td>${cols(d,d.share)}</tr>`);
   excel.push(exportRow(node.name,d.name,d,d.share));
  });
 });
 if(ordered.length){
  if(!singleVendor||ordered.length>1){
  rows.push(`<tr class="sku-v115-grand"><td>제품군 합계</td><td>${X(vendor||'전체 업체')}</td>${cols(r.grand,r.grand.now>0?1:null)}</tr>`);
  excel.push(exportRow('제품군 합계',vendor||'전체 업체',r.grand,r.grand.now>0?1:null));
  }
 }else rows.push(`<tr><td colspan="${headings.length}" style="text-align:center;padding:22px">선택 조건의 SKU·업체별 매출이 없습니다.</td></tr>`);
 t.innerHTML=head+'<tbody>'+rows.join('')+'</tbody>';
 t.style.minWidth=Math.max(singleVendor?1100:1500,(singleVendor?740:1080)+show.length*100)+'px';
 const signature=[cur(),group,vendor].join('|'),scroller=t.closest('.table');
 if(scroller&&t.dataset.skuV115Signature!==signature)scroller.scrollLeft=0;
 t.dataset.skuV115Signature=signature;
 const panel=t.closest('section.panel');
 let summary=panel?.querySelector('.sku-v115-summary');
 if(!summary&&panel){summary=document.createElement('div');summary.className='sku-v115-summary';t.closest('.table')?.insertAdjacentElement('beforebegin',summary)}
 if(summary){summary.hidden=false;summary.innerHTML=singleVendor
  ?`<span>제품군<strong>${X(group)}</strong></span><span>선택 업체<strong>${X(vendor)}</strong></span><span>SKU<strong>${r.skuCount}종</strong></span><span>${mm} 누계<strong>${matrixW(r.grand.now)}억</strong></span><span>${prevName} 대비<strong>${r.grand.prevDiff>0?'+':''}${matrixW(r.grand.prevDiff)}억</strong></span><small>선택한 업체의 SKU별 매출만 표시합니다. 중복되는 SKU 소계·업체 상세 행과 접기 버튼은 제외했습니다. 금액 단위: 억 원.</small>`
  :`<span>제품군<strong>${X(group)}</strong></span><span>SKU<strong>${r.skuCount}종</strong></span><span>업체<strong>${r.vendorCount}개</strong></span><span>${mm} 누계<strong>${matrixW(r.grand.now)}억</strong></span><span>${prevName} 대비<strong>${r.grand.prevDiff>0?'+':''}${matrixW(r.grand.prevDiff)}억</strong></span><small>처음에는 SKU 소계만 표시됩니다. SKU 왼쪽 ▸를 누르면 업체별 매출·비중을 펼쳐 볼 수 있습니다. 과거 월별 실적은 오른쪽에서 확인하세요. 단위: 억 원.</small>`}
 window.__SF_SKU_VENDOR_EXPORT={month:cur(),group,vendor,rows:excel,count:r.skuCount};
}

function renderSku(){const t=$('#v51CompareTable');if(!t||!cur())return;const vendor=$('#v51Vendor')?.value||'',group=$('#v51Group')?.value||'';if(group){renderSkuMatrix(t,vendor,group);return}window.__SF_SKU_VENDOR_EXPORT=null;t.classList.remove('sku-v115-matrix');const oldSummary=t.closest('section.panel')?.querySelector('.sku-v115-summary');if(oldSummary)oldSummary.hidden=true;const r=metrics('m',vendor,group);sortRows(r.rows,cSort,cDir);const cols=1+r.show.length+5,body=r.rows.length?r.rows.slice(0,180).map(x=>`<tr><td>${X(x.name)}</td>${r.show.map(m=>`<td>${W(x.months[m])}</td>`).join('')}<td>${W(x.avg)}</td><td class="v61-current">${W(x.now)}</td><td class="${x.prevDiff>=0?'v61-pos':'v61-neg'}">${x.prevDiff>=0?'+':''}${W(x.prevDiff)}</td><td class="${x.avgDiff>=0?'v61-pos':'v61-neg'}">${x.avgDiff>=0?'+':''}${W(x.avgDiff)}</td><td class="${x.rate>=1?'v61-pos':'v61-neg'}">${RB(x.rate)}</td></tr>`).join(''):`<tr><td colspan="${cols}">선택 조건에 조회 가능한 SKU가 없습니다.</td></tr>`;t.innerHTML=`<thead><tr>${th('name','SKU / 상세 제품명',cSort,cDir)}${r.show.map(m=>th('m:'+m,m.slice(2).replace('-','.'),cSort,cDir)).join('')}${th('avg','확정월 평균',cSort,cDir)}${th('now','진행월 현재',cSort,cDir)}${th('prevDiff','직전월 대비 현재 증감',cSort,cDir)}${th('avgDiff','확정월 평균 대비 현재 증감',cSort,cDir)}${th('rate','확정월 평균 대비 현재 매출율',cSort,cDir)}</tr></thead><tbody>${body}</tbody>`;fitHistory(t,r.show.length)}
function mboValue(){const g=$('#groupTarget')?.value||'',raw=String($('#groupMbo')?.value??'').trim().replace(',','.'),z=state(),o=(z.gmbo||z.groupMbo||{})[cur()]||{};let v=/^\d+(?:\.\d+)?$/.test(raw)?Number(raw):Number(o[g]);return{g,v:Number.isFinite(v)?v:null}}
function saveMbo(){const input=$('#groupMbo'),g=$('#groupTarget')?.value,m=cur();if(!input||!g||!m)return;const raw=String(input.value||'').trim().replace(',','.');if(!/^\d+(?:\.\d+)?$/.test(raw))return;const z=state();z.gmbo=z.gmbo||z.groupMbo||{};z.gmbo[m]=z.gmbo[m]||{};z.gmbo[m][g]=Number(raw);saveState(z);window.dispatchEvent(new Event('sf-group-mbo-committed'));renderMboSummary();renderMbo()}
function renderMboSummary(){const t=$('#groupTargetTable'),panel=t?.closest('section.panel');if(!panel)return;let box=panel.querySelector('.v61-mbo-summary');if(!box){box=document.createElement('div');box.className='v61-mbo-summary';const controls=panel.querySelector('.controls');controls?.insertAdjacentElement('afterend',box)}const z=state(),o=(z.gmbo||z.groupMbo||{})[cur()]||{},es=Object.entries(o).filter(([g,v])=>g&&Number.isFinite(Number(v))).sort((a,b)=>a[0].localeCompare(b[0],'ko'));box.innerHTML=`<span class="label">입력된 제품군 MBO</span>${es.length?es.map(([g,v])=>`<span class="v61-chip">${X(g)} <b>${Number(v).toLocaleString('ko-KR',{maximumFractionDigits:2})}억</b></span>`).join(''):'<span class="label">없음</span>'}`}
function renderMbo(){const t=$('#groupTargetTable'),input=$('#groupMbo');if(!t||!input||!cur())return;const {g,v}=mboValue();if(!g||v==null){t.innerHTML='<tbody><tr><td>제품군을 선택하고 MBO를 입력하세요.</td></tr></tbody>';return}const target=v*1e8,{hist,show,last}=history(),allRows=all(),maps={};[...show,cur()].forEach(m=>maps[m]=map(allRows.filter(r=>r.d?.slice(0,7)===m&&r.g===g),'v'));const monthMap=m=>map(allRows.filter(r=>r.d?.slice(0,7)===m&&r.g===g),'v'),avg={},now=maps[cur()]||{};KEY.forEach(k=>avg[k]=hist.length?hist.reduce((s,m)=>s+N(monthMap(m)[k]),0)/hist.length:0);const outsideHist=hist.map(m=>{const mp=monthMap(m);return Object.keys(mp).filter(k=>!KEY.includes(k)).reduce((s,k)=>s+N(mp[k]),0)}),outsideAvg=outsideHist.length?outsideHist.reduce((a,b)=>a+b,0)/outsideHist.length:0,outsideNow=Object.keys(now).filter(k=>!KEY.includes(k)).reduce((s,k)=>s+N(now[k]),0),curTotal=KEY.reduce((s,k)=>s+N(now[k]),0)+outsideNow,totalNeed=Math.max(0,target-curTotal),closed=closedSet(),open=KEY.filter(k=>!closed.has(k)),openAvg=open.reduce((s,k)=>s+N(avg[k]),0);let remain=totalNeed;const alloc={};open.forEach((k,i)=>{const share=openAvg?N(avg[k])/openAvg:1/Math.max(1,open.length);const add=i===open.length-1?remain:Math.round(totalNeed*share);alloc[k]=add;if(i!==open.length-1)remain-=add});let rows=KEY.map(k=>{const mo=Object.fromEntries(show.map(m=>[m,N(maps[m]?.[k])])),current=N(now[k]),prev=N(maps[last]?.[k]),isClosed=closed.has(k),add=isClosed?0:N(alloc[k]);return{name:k,months:mo,avg:N(avg[k]),now:current,prevDiff:current-prev,avgDiff:current-N(avg[k]),rate:avg[k]?current/avg[k]:0,target:current+add,need:add,closed:isClosed}});sortRows(rows,mSort,mDir);const outsideMo=Object.fromEntries(show.map(m=>{const mp=maps[m]||{};return[m,Object.keys(mp).filter(k=>!KEY.includes(k)).reduce((s,k)=>s+N(mp[k]),0)]}));const current=$('#groupCurrent'),rate=$('#groupRate'),need=$('#groupNeed');if(current)current.textContent=W(curTotal)+'억';if(rate)rate.textContent=target?`${(curTotal/target*100).toFixed(1)}%`:'-';if(need)need.textContent=W(totalNeed)+'억';t.innerHTML=`<thead><tr>${th('name','업체',mSort,mDir)}${show.map(m=>th('m:'+m,m.slice(2).replace('-','.'),mSort,mDir)).join('')}${th('avg','확정월 평균',mSort,mDir)}${th('now','진행월 현재',mSort,mDir)}${th('prevDiff','직전월 대비 현재 증감',mSort,mDir)}${th('avgDiff','확정월 평균 대비 현재 증감',mSort,mDir)}${th('rate','확정월 평균 대비 현재 매출율',mSort,mDir)}${th('target','업체 목표',mSort,mDir)}${th('need','추가 필요',mSort,mDir)}</tr></thead><tbody>${rows.map(r=>`<tr class="${r.closed?'v73-closed':''}"><td>${X(r.name)}${r.closed?'<span class="v73-badge">마감 완료</span>':''}</td>${show.map(m=>`<td>${W(r.months[m])}</td>`).join('')}<td>${W(r.avg)}</td><td class="v61-current">${W(r.now)}</td><td class="${r.prevDiff>=0?'v61-pos':'v61-neg'}">${r.prevDiff>=0?'+':''}${W(r.prevDiff)}</td><td class="${r.avgDiff>=0?'v61-pos':'v61-neg'}">${r.avgDiff>=0?'+':''}${W(r.avgDiff)}</td><td class="${r.rate>=1?'v61-pos':'v61-neg'}">${RB(r.rate)}</td><td class="v61-target">${W(r.target)}</td><td class="${r.closed?'v61-pos':'v61-need'}">${W(r.need)}</td></tr>`).join('')}<tr class="subtotal"><td>권역 외 업체</td>${show.map(m=>`<td>${W(outsideMo[m])}</td>`).join('')}<td>${W(outsideAvg)}</td><td>${W(outsideNow)}</td><td>-</td><td>${outsideNow-outsideAvg>=0?'+':''}${W(outsideNow-outsideAvg)}</td><td class="${outsideAvg&&outsideNow/outsideAvg>=1?'v61-pos':'v61-neg'}">${RB(outsideAvg?outsideNow/outsideAvg:0)}</td><td>${W(outsideNow)}</td><td class="v61-pos">0.0</td></tr><tr class="subtotal"><td>합계</td>${show.map(m=>`<td>${W(KEY.reduce((s,k)=>s+N(maps[m]?.[k]),0)+N(outsideMo[m]))}</td>`).join('')}<td>${W(KEY.reduce((s,k)=>s+N(avg[k]),0)+outsideAvg)}</td><td>${W(curTotal)}</td><td colspan="3"></td><td class="v61-target">${W(target)}</td><td class="v61-need">${W(totalNeed)}</td></tr></tbody>`;const p=t.closest('section.panel')?.querySelector('.head p');if(p)p.textContent=`${g} · 마감 완료 업체는 추가 필요 0, 남은 추가 필요액은 미마감 업체의 확정월 평균 비중으로 재배분합니다.`;fitHistory(t,show.length)}
function context(){const sec=$('#groupTable')?.closest('section.panel');if(!sec)return;sec.querySelectorAll('.v52-group-banner,.v54-context,.v58-context,.v61-context').forEach((x,i)=>{if(i||!x.classList.contains('v61-context'))x.remove()});let b=sec.querySelector('.v61-context');if(!b){b=document.createElement('div');b.className='v61-context';sec.querySelector('.head')?.insertAdjacentElement('afterend',b)}const name=upperVendor||sec.querySelector('.scope-badge strong')?.textContent?.trim()||'전체 업체';b.innerHTML=`<span>선택 업체</span><strong>${X(name)}</strong><span class="arr">→</span><span>제품군 월별 현황</span>`}
function run(){if(busy)return;busy=true;try{style();renderGroup();renderSku();renderMboSummary();renderMbo();context()}finally{busy=false}}
document.addEventListener('click',e=>{const b=e.target.closest('#v51CompareTable [data-sku-v115-fold]');if(b){e.preventDefault();e.stopPropagation();const t=$('#v51CompareTable'),id=b.dataset.skuV115Fold,collapsed=b.getAttribute('aria-expanded')==='true';t?.querySelectorAll('tr[data-sku-v115-parent="'+id+'"]')?.forEach(x=>x.hidden=collapsed);b.setAttribute('aria-expanded',String(!collapsed));b.textContent=collapsed?'▸':'▾';return}const gh=e.target.closest('#groupTable th[data-v61]');if(gh){e.preventDefault();e.stopPropagation();const k=gh.dataset.v61;if(gSort===k)gDir=gDir==='asc'?'desc':'asc';else{gSort=k;gDir=k==='name'?'asc':'desc'}renderGroup();return}const sh=e.target.closest('#v51CompareTable th[data-v61]');if(sh){const k=sh.dataset.v61;if(cSort===k)cDir=cDir==='asc'?'desc':'asc';else{cSort=k;cDir=k==='name'?'asc':'desc'}renderSku();return}const mh=e.target.closest('#groupTargetTable th[data-v61]');if(mh){const k=mh.dataset.v61;if(mSort===k)mDir=mDir==='asc'?'desc':'asc';else{mSort=k;mDir=k==='name'?'asc':'desc'}renderMbo();return}const vr=e.target.closest('#vendorTable tr');if(vr){const reset=vr.matches('[data-v39-reset],.v39-overview,.overview-row')||e.target.closest('.overview-cta');upperVendor=reset?'':(vr.dataset.v39||vr.dataset.v||vr.cells?.[1]?.innerText?.trim()||'');setTimeout(()=>{renderGroup();context()},20)}const gr=e.target.closest('#groupTable [data-v61-group]');if(gr){window.__sfPopulateSkuGroups?.();const s=$('#v51Group'),g=gr.dataset.v61Group||'';if(s){if(![...s.options].some(o=>o.value===g)){const o=document.createElement('option');o.value=g;o.textContent=g;s.appendChild(o)}s.value=g;s.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(renderSku,20)}}},true);
document.addEventListener('input',e=>{if(e.target?.id==='groupMbo'){clearTimeout(inputTm);inputTm=setTimeout(saveMbo,220)}},true);
document.addEventListener('change',e=>{if(e.target?.id==='month'){setTimeout(run,20)}else if(['groupTarget','v51Vendor','v51Group'].includes(e.target?.id)){setTimeout(run,20)}},true);
document.addEventListener('blur',e=>{if(e.target?.id==='groupMbo'){let v=String(e.target.value||'').trim().replace(',','.');if(/^\d+\.$/.test(v))e.target.value=v.slice(0,-1);saveMbo()}},true);
window.addEventListener('sf-vendor-close-change',()=>setTimeout(renderMbo,20));window.addEventListener('sf-data-refreshed',()=>{allCache=null;allSig='';setTimeout(run,20)});
window.addEventListener('sf-vendor-scope-change',e=>{upperVendor=e.detail?.vendor||'';window.__SF_UPPER_VENDOR=upperVendor;syncSkuVendor(upperVendor);setTimeout(()=>{renderGroup();context();renderSku()},30)});
window.addEventListener('sf-detail-shell-ready',()=>{syncSkuVendor(upperVendor);setTimeout(renderSku,20)});
setTimeout(run,80);setTimeout(run,500);window.__SF_V61_READY=true;window.__SF_V73_READY=true;window.dispatchEvent(new Event('sf-v61-ready'));
})();