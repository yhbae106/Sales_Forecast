(()=>{'use strict';
const $=s=>document.querySelector(s);
function addStyle(){if($('#kpiLayoutV37Style'))return;const s=document.createElement('style');s.id='kpiLayoutV37Style';s.textContent=`#cards{grid-template-columns:repeat(4,1fr)}.kpi-flow-summary{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px 16px;margin-top:-2px}.kpi-flow-row{background:#081827;border:1px solid #203a55;border-radius:11px;padding:12px 14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}.kpi-flow-title{font-size:12px;font-weight:800;color:#4fd1c5;min-width:120px}.kpi-flow-main{font-size:14px;color:#eef6ff;line-height:1.55}.kpi-flow-main strong{font-size:16px;color:#fff}.kpi-flow-gap{margin-left:auto;font-size:13px;color:#91a9c1}.kpi-flow-gap strong{color:#ffb454;font-size:15px}@media(max-width:900px){.kpi-flow-summary{grid-template-columns:1fr}.kpi-flow-gap{margin-left:0}}`;document.head.appendChild(s)}
function num(txt){const m=String(txt||'').replace(/,/g,'').match(/-?[\d.]+/);return m?Number(m[0]):null}
function cardMap(){const o={};document.querySelectorAll('#cards .card').forEach(c=>{const l=c.querySelector('.label')?.textContent?.trim();if(l)o[l]=c});return o}
function cloneCard(c,label,sub){if(!c)return null;const x=c.cloneNode(true);if(label)x.querySelector('.label').textContent=label;if(sub!=null)x.querySelector('.sub').textContent=sub;return x}
function makeGapCard(label,value,sub,good){const c=document.createElement('div');c.className='card';c.innerHTML=`<div class="label">${label}</div><div class="value ${good?'good':'bad'}">${value}</div><div class="sub">${sub}</div>`;return c}
let busy=false;
function apply(){if(busy)return;const cards=$('#cards');if(!cards)return;const m=cardMap();
 // Only transform a fresh render from the calculation engine. Once transformed,
 // 기준일 달성률/기준일 부족액 disappear, which prevents a MutationObserver loop.
 if(!m['MBO 목표']||!m['현재 누계']||!m['현재 MBO 달성률']||!m['예상 마감']||!m['예상 MBO 달성률']||!m['기준일 목표 누계']||!m['기준일 달성률']||!m['기준일 부족액'])return;
 busy=true;try{
 const mbo=num(m['MBO 목표'].querySelector('.value')?.textContent),cur=num(m['현재 누계'].querySelector('.value')?.textContent),target=num(m['기준일 목표 누계'].querySelector('.value')?.textContent);
 const mboGap=(mbo!=null&&cur!=null)?Math.max(0,mbo-cur):null,paceGap=(target!=null&&cur!=null)?Math.max(0,target-cur):null;
 const mboRate=(mbo&&cur!=null)?(cur/mbo*100).toFixed(1)+'%':'-',paceRate=(target&&cur!=null)?(cur/target*100).toFixed(1)+'%':'-';
 const order=[cloneCard(m['MBO 목표']),cloneCard(m['현재 누계']),cloneCard(m['현재 MBO 달성률']),makeGapCard('MBO Gap',mboGap==null?'계산 대기':mboGap.toFixed(1)+'억',mboGap!=null&&mboGap>0?'현재 누계 대비 부족액':'MBO 이상 달성',mboGap===0),cloneCard(m['기준일 목표 누계'],null,'순도 기준 오늘까지 있어야 하는 금액'),makeGapCard('기준일 Gap',paceGap==null?'계산 대기':paceGap.toFixed(1)+'억',paceGap!=null&&paceGap>0?'현재 누계 대비 부족액':'기준 이상 확보',paceGap===0),cloneCard(m['예상 마감']),cloneCard(m['예상 MBO 달성률'])].filter(Boolean);
 cards.replaceChildren(...order);
 let sum=$('#kpiFlowSummary');if(!sum){sum=document.createElement('section');sum.id='kpiFlowSummary';sum.className='panel kpi-flow-summary';cards.insertAdjacentElement('afterend',sum)}
 sum.innerHTML=`<div class="kpi-flow-row"><span class="kpi-flow-title">MBO 기준</span><span class="kpi-flow-main">${mbo==null?'-':mbo.toFixed(1)+'억'} → 현재 ${cur==null?'-':cur.toFixed(1)+'억'} → <strong>${mboRate}</strong></span><span class="kpi-flow-gap">Gap <strong>${mboGap==null?'-':mboGap.toFixed(1)+'억'}</strong></span></div><div class="kpi-flow-row"><span class="kpi-flow-title">오늘 기준 순도 목표</span><span class="kpi-flow-main">${target==null?'-':target.toFixed(1)+'억'} → 현재 ${cur==null?'-':cur.toFixed(1)+'억'} → <strong>${paceRate}</strong></span><span class="kpi-flow-gap">Gap <strong>${paceGap==null?'-':paceGap.toFixed(1)+'억'}</strong></span></div>`;
 const oldHelp=sum.nextElementSibling;if(oldHelp?.querySelector?.('.help'))oldHelp.style.display='none';
 }finally{busy=false}}
addStyle();const obs=new MutationObserver(()=>setTimeout(apply,0));const start=()=>{const c=$('#cards');if(c){obs.observe(c,{childList:true,subtree:true,characterData:true});apply()}else setTimeout(start,100)};start();document.addEventListener('input',e=>{if(['mbo','first','second'].includes(e.target?.id))setTimeout(apply,30)});document.addEventListener('change',()=>setTimeout(apply,30));
})();