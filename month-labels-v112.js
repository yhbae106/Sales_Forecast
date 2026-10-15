(()=>{
'use strict';
// Presentation-only month labels. Figures and historical-month selection stay in their existing renderers.
const TABLE_IDS=['vendorTable','groupTable','v51CompareTable','groupTargetTable','compareTable'];
const $=s=>document.querySelector(s);
function selectedMonth(){
  const m=$('#month')?.value||'';
  if(/^20\d{2}-(0[1-9]|1[0-2])$/.test(m))return m;
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit'}).formatToParts(new Date()).map(x=>[x.type,x.value]));
  return p.year+'-'+p.month;
}
function historicalMonths(table){
  const cells=table?.tHead?.rows?.[0]?.cells;
  if(!cells)return [];
  const months=new Set();
  [...cells].forEach(th=>{
    const key=th.dataset.v61||'';
    const keyed=/^m:(20\d{2})-(0[1-9]|1[0-2])$/.exec(key);
    if(keyed){months.add(keyed[1]+'-'+keyed[2]);return}
    const raw=(th.dataset.sfPeriodSource||th.textContent||'').replace(/[↕▲▼]\s*$/,'').trim();
    const m=/^(\d{2})\.(0[1-9]|1[0-2])$/.exec(raw);
    if(m)months.add('20'+m[1]+'-'+m[2]);
  });
  return [...months].sort();
}
function monthName(month){return String(Number(month.slice(5)))+'월'}
function periodLabel(months){
  if(!months.length)return '이전월 평균';
  const first=months[0],last=months[months.length-1];
  let label;
  if(first===last)label=monthName(first)+' 평균';
  else if(first.slice(0,4)===last.slice(0,4))label=String(Number(first.slice(5)))+'~'+monthName(last)+' 평균';
  else label=first.slice(2).replace('-','.')+'~'+last.slice(2).replace('-','.')+' 평균';
  const ids=months.map(x=>Number(x.slice(0,4))*12+Number(x.slice(5)));
  const contiguous=ids.every((x,i)=>i===0||x-ids[i-1]===1);
  return label+(!contiguous&&months.length>1?' ('+months.length+'개월)':'');
}
function applyHeaders(table,month,fallback){
  const cells=table?.tHead?.rows?.[0]?.cells;
  if(!cells)return;
  const hist=historicalMonths(table),months=hist.length?hist:fallback,avg=periodLabel(months),cur=monthName(month),last=months.at(-1);
  for(const th of [...cells]){
    const raw=th.dataset.sfPeriodSource||th.textContent||'';
    if(!/(확정월 평균|진행월 현재|직전월 대비 현재 증감)/.test(raw))continue;
    if(!th.dataset.sfPeriodSource)th.dataset.sfPeriodSource=raw;
    let next=raw
      .replace(/확정월 평균 대비 현재 증감/g,avg+' 대비 '+cur+' 증감')
      .replace(/확정월 평균 대비 현재 매출율/g,avg+' 대비 '+cur+' 매출율')
      .replace(/확정월 평균/g,avg)
      .replace(/진행월 현재/g,cur+' 누계')
      .replace(/직전월 대비 현재 증감/g,(last?monthName(last):'직전월')+' 대비 '+cur+' 증감');
    // Keep the current sort arrow when a table updates it without rebuilding the header.
    const arrow=th.textContent.match(/[↕▲▼]\s*$/);
    if(arrow&&/[↕▲▼]\s*$/.test(next))next=next.replace(/[↕▲▼]\s*$/,arrow[0]);
    if(th.textContent!==next)th.textContent=next;
    if(raw.includes('확정월 평균')&&months.length){
      const title='평균 산정 월: '+months.map(x=>x.slice(0,4)+'년 '+monthName(x)).join(', ')+' ('+months.length+'개월)';
      if(th.title!==title)th.title=title;
    }
  }
}
function apply(){
  const month=selectedMonth(),hist=historicalMonths($('#vendorTable')),avg=periodLabel(hist),cur=monthName(month);
  TABLE_IDS.forEach(id=>applyHeaders(document.getElementById(id),month,hist));
  const ui=window.__SF_UI_TEXT||{};
  const base=Object.prototype.hasOwnProperty.call(ui,'dashboard.subtitle')?String(ui['dashboard.subtitle']||''):
    '업로드 데이터 기준 월 자동 확장 · 확정월 평균 · 진행월 순도 · 제품군 MBO 배분';
  const sub=base.replace(/확정월 평균|이전월 평균/g,avg).replace(/진행월|당월/g,cur);
  const top=$('.top .muted');
  if(top&&top.textContent!==sub)top.textContent=sub;
  const title=$('#compareTitle'),comparison=avg+' · '+cur+' 누계 비교';
  if(title&&title.textContent!==comparison)title.textContent=comparison;
  const desc=$('#compareTable')?.closest('section.panel')?.querySelector('.head p');
  const description=avg+'과 '+cur+' 누계를 비교합니다. 직전월 동일 진행위치 대비 증감과 순도율도 표시합니다.';
  if(desc&&desc.textContent!==description)desc.textContent=description;
  const mboDesc=$('#groupTargetTable')?.closest('section.panel')?.querySelector('.head p');
  if(mboDesc){
    if(mboDesc.textContent.includes('확정월 평균'))mboDesc.dataset.sfPeriodRaw=mboDesc.textContent;
    const raw=mboDesc.dataset.sfPeriodRaw;
    if(raw&&(mboDesc.textContent===raw||mboDesc.textContent===mboDesc.dataset.sfPeriodRendered)){
      const rendered=raw.replace(/확정월 평균/g,avg);
      mboDesc.dataset.sfPeriodRendered=rendered;
      if(mboDesc.textContent!==rendered)mboDesc.textContent=rendered;
    }
  }
}
let pending=false;
function schedule(){
  if(pending)return;
  pending=true;
  requestAnimationFrame(()=>{pending=false;apply()});
}
const obs=new MutationObserver(schedule);
function start(){
  if(!document.body){setTimeout(start,40);return}
  obs.observe(document.body,{subtree:true,childList:true,characterData:true});
  schedule();
}
document.addEventListener('change',e=>{if(e.target?.id==='month')schedule()},true);
['sf-core-ready','sf-vendor-table-rendered','sf-v61-ready','sf-data-refreshed','sf-ui-text-updated','sf-layout-updated'].forEach(ev=>window.addEventListener(ev,schedule));
start();
})();
