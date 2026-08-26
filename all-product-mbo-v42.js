(()=>{'use strict';
const ALL='__ALL_PRODUCTS__',KEY=['백제약품영등포지점','백제약품(주)영남본부','대전백제약품','백제약품(주)원주지점','(주)인천약품','(주)복산나이스','유진약품(주)','아이팜코리아(주)'];
const $=s=>document.querySelector(s),N=v=>Number(v||0),W=v=>(N(v)/1e8).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:1}),P=v=>(N(v)*100).toFixed(1)+'%',X=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function stored(){try{const z=JSON.parse(localStorage.getItem('sales_forecast_v16')||localStorage.getItem('sales_forecast_v15')||'{}');return z.up||z.uploadRows||z.uploads||[]}catch(e){return window.__SF_SHARED_UPLOADS||[]}}
function seed(){return (window.SEED_DATA?.dailyRecords||[]).map(r=>({d:r.date,v:r.vendor||'',a:N(r.amount)}))}
function allRows(){const up=stored().map(r=>({d:r.d||r.date,v:r.v||r.vendor||'',a:N(r.a??r.amount)})),rep=new Set(up.map(r=>r.d));return seed().filter(r=>!rep.has(r.d)).concat(up)}
function active(){return $('#month')?.value||''}
function bucket(v){return KEY.includes(v)?v:'권역 외 업체'}
function monthlyByVendor(month){const mp={};allRows().filter(r=>r.d?.slice(0,7)===month).forEach(r=>{const b=bucket(r.v);mp[b]=(mp[b]||0)+N(r.a)});return mp}
function historicalShares(cur){const months=[...new Set(allRows().map(r=>r.d?.slice(0,7)).filter(m=>m&&m<cur))].sort();const sums={},counts={};[...KEY,'권역 외 업체'].forEach(v=>{sums[v]=0;counts[v]=0});months.forEach(m=>{const mp=monthlyByVendor(m),tot=Object.values(mp).reduce((s,a)=>s+N(a),0);if(!tot)return;Object.keys(sums).forEach(v=>{sums[v]+=N(mp[v])/tot;counts[v]++})});let out={};Object.keys(sums).forEach(v=>out[v]=counts[v]?sums[v]/counts[v]:0);const total=Object.values(out).reduce((s,a)=>s+a,0)||1;Object.keys(out).forEach(v=>out[v]/=total);return{shares:out,months}}
function addOption(){const sel=$('#groupTarget');if(!sel)return false;if(!sel.querySelector(`option[value="${ALL}"]`)){const o=document.createElement('option');o.value=ALL;o.textContent='전체 제품';sel.insertBefore(o,sel.firstChild)}return true}
function render(){if(!addOption())return;const sel=$('#groupTarget');if(sel.value!==ALL)return;const cur=active(),mbo=N($('#mbo')?.value)*1e8,gmbo=$('#groupMbo'),current=$('#groupCurrent'),rate=$('#groupRate'),need=$('#groupNeed'),table=$('#groupTargetTable');if(!cur||!table)return;
 if(gmbo){gmbo.value=$('#mbo')?.value||'';gmbo.disabled=true;gmbo.placeholder='월 MBO 자동 적용'}
 const mp=monthlyByVendor(cur),curTotal=Object.values(mp).reduce((s,a)=>s+N(a),0),h=historicalShares(cur),target=mbo||0,totalNeed=Math.max(0,target-curTotal);
 if(current)current.textContent=W(curTotal)+'억';if(rate)rate.textContent=target?P(curTotal/target):'-';if(need)need.textContent=target?W(totalNeed)+'억':'-';
 const rows=[...KEY,'권역 외 업체'].map(v=>{const share=N(h.shares[v]),goal=target*share,now=N(mp[v]),gap=Math.max(0,goal-now);return[v,share,goal,now,gap]}).sort((a,b)=>b[4]-a[4]);
 table.innerHTML=`<thead><tr><th>업체</th><th>과거 평균 구성비</th><th>MBO 배분 목표</th><th>현재 누계</th><th>추가 필요액</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${X(r[0])}</td><td>${P(r[1])}</td><td>${W(r[2])}</td><td>${W(r[3])}</td><td class="${r[4]>0?'bad':'good'}">${W(r[4])}</td></tr>`).join('')}<tr class="subtotal"><td>합계</td><td>100.0%</td><td>${W(target)}</td><td>${W(curTotal)}</td><td class="${totalNeed>0?'bad':'good'}">${W(totalNeed)}</td></tr></tbody>`;
 const sec=table.closest('section.panel'),p=sec?.querySelector('.head p');if(p)p.textContent=`전체 제품 · 월 MBO ${target?W(target)+'억':'입력 필요'}을 과거 확정월(${h.months[0]||'-'} ~ ${h.months.at(-1)||'-'}) 업체별 평균 구성비로 배분한 필요 매출입니다.`;
}
function resetSpecific(){const sel=$('#groupTarget'),gmbo=$('#groupMbo');if(sel&&sel.value!==ALL&&gmbo){gmbo.disabled=false}}
document.addEventListener('change',e=>{if(e.target?.id==='groupTarget'){setTimeout(()=>{resetSpecific();render()},20)}if(['month','mbo'].includes(e.target?.id))setTimeout(render,30)});document.addEventListener('input',e=>{if(e.target?.id==='mbo'&&$('#groupTarget')?.value===ALL)setTimeout(render,30)});
let timer;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(()=>{addOption();if($('#groupTarget')?.value===ALL)render()},180)}).observe(document.body,{subtree:true,childList:true});setTimeout(()=>{addOption();},900);
})();