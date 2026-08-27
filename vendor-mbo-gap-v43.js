(()=>{'use strict';
const $=s=>document.querySelector(s),N=v=>Number(v||0),W=v=>(N(v)/1e8).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1}),ALL='__ALL_PRODUCTS__';
const KEY=['백제약품영등포지점','백제약품(주)영남본부','대전백제약품','백제약품(주)원주지점','(주)인천약품','(주)복산나이스','유진약품(주)','아이팜코리아(주)'],BK=KEY.slice(0,4),OUT='권역 외 업체',ALL_BUCKETS=[...KEY,OUT];
let busy=false,timer=null;
function stored(){try{const z=JSON.parse(localStorage.getItem('sales_forecast_v16')||localStorage.getItem('sales_forecast_v15')||'{}');return z.up||z.uploadRows||z.uploads||[]}catch(e){return window.__SF_SHARED_UPLOADS||[]}}
function seed(){return (window.SEED_DATA?.dailyRecords||[]).map(r=>({d:r.date,v:r.vendor||'',a:N(r.amount)}))}
function allRows(){const up=stored().map(r=>({d:r.d||r.date,v:r.v||r.vendor||'',a:N(r.a??r.amount)})),rep=new Set(up.map(r=>r.d));return seed().filter(r=>!rep.has(r.d)).concat(up)}
function bucket(v){return KEY.includes(v)?v:OUT}
function active(){return $('#month')?.value||''}
function monthly(month){const mp={};ALL_BUCKETS.forEach(v=>mp[v]=0);allRows().filter(r=>r.d?.slice(0,7)===month).forEach(r=>{const b=bucket(r.v);mp[b]=(mp[b]||0)+N(r.a)});return mp}
function shares(cur){const months=[...new Set(allRows().map(r=>r.d?.slice(0,7)).filter(m=>m&&m<cur))].sort(),sum={},cnt={};ALL_BUCKETS.forEach(v=>{sum[v]=0;cnt[v]=0});months.forEach(m=>{const mp=monthly(m),tot=Object.values(mp).reduce((s,a)=>s+N(a),0);if(!tot)return;ALL_BUCKETS.forEach(v=>{sum[v]+=N(mp[v])/tot;cnt[v]++})});const out={};ALL_BUCKETS.forEach(v=>out[v]=cnt[v]?sum[v]/cnt[v]:0);const tot=Object.values(out).reduce((s,a)=>s+a,0)||1;ALL_BUCKETS.forEach(v=>out[v]/=tot);return{out,months}}
function removeAllProductOption(){const sel=$('#groupTarget');if(!sel)return;const opt=sel.querySelector(`option[value="${ALL}"]`);if(opt){const was=sel.value===ALL;opt.remove();if(was){sel.selectedIndex=0;sel.dispatchEvent(new Event('change',{bubbles:true}))}}}
function rowVendor(tr){if(tr.dataset.v39)return tr.dataset.v39;const t0=tr.cells?.[0]?.textContent?.trim(),t1=tr.cells?.[1]?.textContent?.trim();if(t0==='백제약품 전체 합계')return'백제약품 전체 합계';if(t0===OUT)return OUT;if(t0==='총합계')return'총합계';return t1||''}
function allocateGap(overallGap,mbo,mp,h){const result={};KEY.forEach(v=>result[v]=0);if(!mbo||overallGap<=0)return result;const controlledShare=KEY.reduce((s,v)=>s+N(h.out[v]),0)||1;const rawNeed={};KEY.forEach(v=>{const normalizedShare=N(h.out[v])/controlledShare;rawNeed[v]=Math.max(0,mbo*normalizedShare-N(mp[v]))});let weightTotal=KEY.reduce((s,v)=>s+N(rawNeed[v]),0);if(weightTotal<=0){KEY.forEach(v=>rawNeed[v]=N(h.out[v])/controlledShare);weightTotal=1}
 // Allocate in 0.1억 units so the displayed vendor gaps reconcile exactly to the displayed total gap.
 const unit=1e7,totalUnits=Math.max(0,Math.round(overallGap/unit));let remain=totalUnits;
 KEY.forEach((v,i)=>{let units;if(i===KEY.length-1)units=remain;else{units=Math.max(0,Math.round(totalUnits*(N(rawNeed[v])/weightTotal)));units=Math.min(units,remain);remain-=units}result[v]=units*unit});
 return result}
function apply(){if(busy)return;const table=$('#vendorTable'),cur=active();if(!table||!cur)return;busy=true;try{removeAllProductOption();const mbo=N($('#mbo')?.value)*1e8,mp=monthly(cur),h=shares(cur),curTotal=Object.values(mp).reduce((s,a)=>s+N(a),0),overallGap=mbo?Math.max(0,mbo-curTotal):null;
 const allocated=mbo?allocateGap(overallGap,mbo,mp,h):{};
 const head=table.querySelector('thead tr');if(!head)return;let gapHead=head.querySelector('th[data-v43-gap]');if(!gapHead){gapHead=document.createElement('th');gapHead.dataset.v43Gap='1';head.appendChild(gapHead)}gapHead.textContent='MBO 대비 부족액';gapHead.title='전체 MBO Gap을 먼저 확정한 뒤 관리 가능한 8개 권역업체에 부족 정도 기준으로 배분합니다.';
 table.querySelectorAll('tbody tr').forEach(tr=>{let td=tr.querySelector('td[data-v43-gap]');if(!td){td=document.createElement('td');td.dataset.v43Gap='1';tr.appendChild(td)}const v=rowVendor(tr);let gap=null,title='';if(mbo){if(v==='총합계'){gap=Math.round(N(overallGap)/1e7)*1e7;title=`전체 MBO ${W(mbo)}억 - 현재 총누계 ${W(curTotal)}억`}else if(v==='백제약품 전체 합계'){gap=BK.reduce((s,x)=>s+N(allocated[x]),0);title='4개 백제약품의 배분 부족액 합계'}else if(v===OUT){gap=0;title='권역 외 업체는 컨트롤 대상이 아니므로 부족액 0.0억'}else if(KEY.includes(v)){gap=N(allocated[v]);title=`전체 Gap ${W(overallGap)}억 중 ${v}에 배분된 부족액`}}td.textContent=gap==null?'-':W(gap);td.classList.toggle('bad',gap!=null&&gap>0);td.classList.toggle('good',gap===0);td.title=title});
 table.dataset.v43Gap=cur+'|'+($('#mbo')?.value||'');const p=table.closest('section.panel')?.querySelector('.head p');if(p)p.innerHTML=`업체 클릭 → 해당 업체의 제품군 월별 현황 · <span class="v39-month-note">전체 MBO Gap을 8개 관리업체에 배분하여 업체별 부족액 합계와 총 Gap이 일치</span>`;
 }finally{busy=false}}
function schedule(){clearTimeout(timer);timer=setTimeout(apply,160)}
document.addEventListener('input',e=>{if(e.target?.id==='mbo')schedule()});document.addEventListener('change',e=>{if(['mbo','month'].includes(e.target?.id))schedule()});new MutationObserver(m=>{if(busy)return;if(m.some(x=>x.target.closest?.('#vendorTable')||x.target.id==='vendorTable'))schedule()}).observe(document.body,{subtree:true,childList:true});setTimeout(apply,1100);setTimeout(apply,2200);
})();