(()=>{'use strict';
if(document.getElementById('sfSemanticColorV109Style'))return;
const TONES=['positive','caution','warning','negative','info','neutral'];
const css=[
':root{--sf-positive:#34D399;--sf-positive-soft:rgba(52,211,153,.11);--sf-caution:#FACC15;--sf-caution-soft:rgba(250,204,21,.10);--sf-warning:#FB923C;--sf-warning-soft:rgba(251,146,60,.11);--sf-negative:#FB7185;--sf-negative-soft:rgba(251,113,133,.11);--sf-info:#60A5FA;--sf-info-soft:rgba(96,165,250,.10);--sf-neutral:#CBD5E1;}',
'.sf-semantic-legend{display:flex;justify-content:flex-end;align-items:center;gap:7px;flex-wrap:wrap;margin:-3px 2px 10px;color:#8194A8;font-size:10px;font-weight:760}',
'.sf-semantic-legend .ttl{margin-right:2px;color:#94A3B8}',
'.sf-semantic-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 7px;border:1px solid rgba(148,163,184,.13);border-radius:999px;background:rgba(15,23,42,.38)}',
'.sf-semantic-chip i{width:7px;height:7px;border-radius:50%;box-shadow:0 0 0 3px rgba(255,255,255,.025)}',
'.sf-semantic-chip.positive i{background:var(--sf-positive)}.sf-semantic-chip.caution i{background:var(--sf-caution)}.sf-semantic-chip.warning i{background:var(--sf-warning)}.sf-semantic-chip.negative i{background:var(--sf-negative)}.sf-semantic-chip.info i{background:var(--sf-info)}',
'.value.sf-tone-positive,.controls .value.sf-tone-positive,.kpi-flow-summary .sf-tone-positive,.sf-radar .sf-tone-positive{color:#6EE7B7!important;text-shadow:0 0 16px rgba(52,211,153,.14)}',
'.value.sf-tone-caution,.controls .value.sf-tone-caution,.kpi-flow-summary .sf-tone-caution,.sf-radar .sf-tone-caution{color:#FDE047!important;text-shadow:0 0 16px rgba(250,204,21,.12)}',
'.value.sf-tone-warning,.controls .value.sf-tone-warning,.kpi-flow-summary .sf-tone-warning,.sf-radar .sf-tone-warning{color:#FDBA74!important;text-shadow:0 0 16px rgba(251,146,60,.13)}',
'.value.sf-tone-negative,.controls .value.sf-tone-negative,.kpi-flow-summary .sf-tone-negative,.sf-radar .sf-tone-negative{color:#FDA4AF!important;text-shadow:0 0 16px rgba(251,113,133,.14)}',
'.value.sf-tone-info,.controls .value.sf-tone-info,.kpi-flow-summary .sf-tone-info,.sf-radar .sf-tone-info{color:#93C5FD!important}',
'.value.sf-tone-neutral,.controls .value.sf-tone-neutral{color:#E2E8F0!important}',
'#cards .card.sf-card-tone-positive{border-color:rgba(52,211,153,.28)!important;background:linear-gradient(180deg,rgba(27,48,57,.96),rgba(18,35,48,.98))!important}',
'#cards .card.sf-card-tone-caution{border-color:rgba(250,204,21,.25)!important;background:linear-gradient(180deg,rgba(48,45,35,.92),rgba(28,34,44,.98))!important}',
'#cards .card.sf-card-tone-warning{border-color:rgba(251,146,60,.28)!important;background:linear-gradient(180deg,rgba(53,40,34,.92),rgba(31,31,42,.98))!important}',
'#cards .card.sf-card-tone-negative{border-color:rgba(251,113,133,.30)!important;background:linear-gradient(180deg,rgba(53,35,44,.94),rgba(31,29,42,.98))!important}',
'#cards .card.sf-card-tone-info{border-color:rgba(96,165,250,.22)!important}',
'#cards .card.sf-card-tone-positive:before{background:var(--sf-positive)!important}#cards .card.sf-card-tone-caution:before{background:var(--sf-caution)!important}#cards .card.sf-card-tone-warning:before{background:var(--sf-warning)!important}#cards .card.sf-card-tone-negative:before{background:var(--sf-negative)!important}#cards .card.sf-card-tone-info:before{background:var(--sf-info)!important}',
'.table td.sf-tone-positive{color:#6EE7B7!important;background:var(--sf-positive-soft)!important;box-shadow:inset 3px 0 rgba(52,211,153,.52);font-weight:780!important}',
'.table td.sf-tone-caution{color:#FDE047!important;background:var(--sf-caution-soft)!important;box-shadow:inset 3px 0 rgba(250,204,21,.50);font-weight:780!important}',
'.table td.sf-tone-warning{color:#FDBA74!important;background:var(--sf-warning-soft)!important;box-shadow:inset 3px 0 rgba(251,146,60,.52);font-weight:790!important}',
'.table td.sf-tone-negative{color:#FDA4AF!important;background:var(--sf-negative-soft)!important;box-shadow:inset 3px 0 rgba(251,113,133,.55);font-weight:800!important}',
'.table td.sf-tone-info{color:#93C5FD!important;background:var(--sf-info-soft)!important;box-shadow:inset 3px 0 rgba(96,165,250,.35)}',
'.table td.sf-tone-neutral{color:#CBD5E1!important}',
'.kpi-flow-gap strong.sf-tone-positive{color:#6EE7B7!important}.kpi-flow-gap strong.sf-tone-caution{color:#FDE047!important}.kpi-flow-gap strong.sf-tone-warning{color:#FDBA74!important}.kpi-flow-gap strong.sf-tone-negative{color:#FDA4AF!important}',
'.sf-radar-kpi .v.sf-tone-positive,.sf-radar-delta-row>b.sf-tone-positive{color:#6EE7B7!important}.sf-radar-kpi .v.sf-tone-caution,.sf-radar-delta-row>b.sf-tone-caution{color:#FDE047!important}.sf-radar-kpi .v.sf-tone-warning,.sf-radar-delta-row>b.sf-tone-warning{color:#FDBA74!important}.sf-radar-kpi .v.sf-tone-negative,.sf-radar-delta-row>b.sf-tone-negative{color:#FDA4AF!important}',
'@media(max-width:650px){.sf-semantic-legend{justify-content:flex-start;margin-top:0}.sf-semantic-chip{padding:3px 6px}.sf-semantic-legend .ttl{width:100%}}'
].join('');
const style=document.createElement('style');style.id='sfSemanticColorV109Style';style.textContent=css;document.head.appendChild(style);

function numberOf(text){const m=String(text||'').replace(/,/g,'').match(/[+-]?\d+(?:\.\d+)?/);return m?Number(m[0]):null}
function percentOf(text){if(!String(text||'').includes('%'))return null;return numberOf(text)}
function rateTone(p){if(!Number.isFinite(p))return'neutral';if(p>=100)return'positive';if(p>=95)return'caution';if(p>=90)return'warning';return'negative'}
function gapTone(gap,target){if(!Number.isFinite(gap))return'neutral';if(gap<=0)return'positive';if(!(target>0))return'warning';const r=gap/target*100;if(r<=5)return'caution';if(r<=10)return'warning';return'negative'}
function clearTone(el){if(!el)return;TONES.forEach(t=>el.classList.remove('sf-tone-'+t))}
function setTone(el,tone){if(!el)return;clearTone(el);el.classList.add('sf-tone-'+(tone||'neutral'));const card=el.closest('#cards .card');if(card){TONES.forEach(t=>card.classList.remove('sf-card-tone-'+t));card.classList.add('sf-card-tone-'+(tone||'neutral'))}}
function cards(){const map={};document.querySelectorAll('#cards .card').forEach(c=>{const label=(c.querySelector('.label')?.textContent||'').trim();const key=c.dataset.kpiKey||label;if(key)map[key]=c});const val=k=>map[k]?.querySelector('.value'),n=k=>numberOf(val(k)?.textContent),p=k=>percentOf(val(k)?.textContent);
setTone(val('mbo')||val('MBO 목표'),'info');setTone(val('current')||val('현재 누계'),'info');setTone(val('paceTarget')||val('기준일 목표 누계'),'info');
const curRate=p('mboRate')??p('현재 MBO 달성률');setTone(val('mboRate')||val('현재 MBO 달성률'),curRate!=null&&curRate>=100?'positive':'info');
const forecastRate=p('forecastRate')??p('예상 MBO 달성률');setTone(val('forecastRate')||val('예상 MBO 달성률'),forecastRate==null?'neutral':rateTone(forecastRate));
const paceRate=p('paceRate')??p('기준일 달성률');setTone(val('paceRate')||val('기준일 달성률'),paceRate==null?'neutral':rateTone(paceRate));
const mbo=n('mbo')??n('MBO 목표'),mboGap=n('mboGap')??n('MBO Gap');setTone(val('mboGap')||val('MBO Gap'),gapTone(mboGap,mbo));
const paceTarget=n('paceTarget')??n('기준일 목표 누계'),paceGap=n('paceGap')??n('기준일 Gap');setTone(val('paceGap')||val('기준일 Gap'),gapTone(paceGap,paceTarget));
const forecast=n('forecast')??n('예상 마감');if(Number.isFinite(forecast)&&Number.isFinite(mbo)&&mbo>0)setTone(val('forecast')||val('예상 마감'),rateTone(forecast/mbo*100));else setTone(val('forecast')||val('예상 마감'),'info');
}
function groupSummary(){const current=document.getElementById('groupCurrent'),rate=document.getElementById('groupRate'),need=document.getElementById('groupNeed'),input=document.getElementById('groupMbo');if(current)setTone(current,'info');if(rate){const p=percentOf(rate.textContent);setTone(rate,p==null?'neutral':rateTone(p))}if(need){const g=numberOf(need.textContent),t=numberOf(input?.value);setTone(need,g==null?'neutral':gapTone(g,t))}}
function flow(){document.querySelectorAll('.kpi-flow-row').forEach(row=>{const nums=row.querySelectorAll('.kpi-flow-gap strong');nums.forEach(el=>{const g=numberOf(el.textContent);const target=numberOf(row.querySelector('.kpi-flow-main')?.textContent);setTone(el,g==null?'neutral':gapTone(g,target))});const main=row.querySelector('.kpi-flow-main strong');if(main){const p=percentOf(main.textContent);setTone(main,p==null?'neutral':rateTone(p))}})}
function tableTone(table){const heads=[...table.querySelectorAll('thead th')].map(x=>(x.textContent||'').trim());if(!heads.length)return;table.querySelectorAll('tbody tr').forEach(tr=>{[...tr.children].forEach((td,i)=>{if(td.tagName!=='TD')return;const h=heads[i]||'',txt=(td.textContent||'').trim(),num=numberOf(txt),pct=percentOf(txt);let tone=null;
if(td.classList.contains('good')||td.classList.contains('v61-pos')||td.classList.contains('sf-radar-up')||td.classList.contains('sf-radar-good'))tone='positive';
if(td.classList.contains('warn')||td.classList.contains('v61-need')||td.classList.contains('sf-radar-warn'))tone='caution';
if(td.classList.contains('bad')||td.classList.contains('v61-neg')||td.classList.contains('sf-radar-bad'))tone='negative';
if(td.classList.contains('info')||td.classList.contains('v61-target')||td.classList.contains('v61-current'))tone='info';
if(/달성률|매출율|순도율|수준/.test(h)&&pct!=null)tone=rateTone(pct);
else if(/증감|편차/.test(h)&&num!=null)tone=num>0?'positive':num<0?'negative':'neutral';
else if(/추가 필요|부족|Gap/i.test(h)&&num!=null)tone=num<=0?'positive':'warning';
else if(/목표/.test(h)&&num!=null&&!/달성/.test(h))tone='info';
if(tone)setTone(td,tone)})})}
function tables(){document.querySelectorAll('table').forEach(tableTone)}
function radar(){document.querySelectorAll('.sf-radar-kpi .v').forEach(el=>{if(el.classList.contains('sf-radar-good'))setTone(el,'positive');else if(el.classList.contains('sf-radar-warn'))setTone(el,'caution');else if(el.classList.contains('sf-radar-bad'))setTone(el,'negative');else if(el.classList.contains('sf-radar-closed'))setTone(el,'info')});document.querySelectorAll('.sf-radar-delta-row>b').forEach(el=>{const n=numberOf(el.textContent);if(n!=null)setTone(el,n>0?'positive':n<0?'negative':'neutral')})}
function legend(){if(document.getElementById('sfSemanticLegend'))return;const cardsEl=document.getElementById('cards');if(!cardsEl)return;const el=document.createElement('div');el.id='sfSemanticLegend';el.className='sf-semantic-legend';el.innerHTML='<span class="ttl">상태 색상</span><span class="sf-semantic-chip positive"><i></i>긍정</span><span class="sf-semantic-chip caution"><i></i>주의</span><span class="sf-semantic-chip warning"><i></i>경고</span><span class="sf-semantic-chip negative"><i></i>부정</span><span class="sf-semantic-chip info"><i></i>기준/정보</span>';cardsEl.insertAdjacentElement('beforebegin',el)}
let queued=false;function apply(){queued=false;legend();cards();groupSummary();flow();tables();radar()}function schedule(){if(queued)return;queued=true;requestAnimationFrame(apply)}
const observer=new MutationObserver(schedule);const start=()=>{if(document.body){observer.observe(document.body,{subtree:true,childList:true,characterData:true});schedule()}else setTimeout(start,50)};start();
['sf-core-ready','sf-settings-committed','sf-data-refreshed','sf-kpi-layout-updated','sf-v61-ready','sf-radar-rendered','sf-group-mbo-committed','sf-vendor-gap-updated'].forEach(e=>window.addEventListener(e,schedule));
document.addEventListener('change',e=>{if(['month','groupTarget','groupMbo','mbo'].includes(e.target?.id))setTimeout(schedule,30)},true);
setTimeout(schedule,200);setTimeout(schedule,900);window.__SF_SEMANTIC_COLOR_V109=true;
})();