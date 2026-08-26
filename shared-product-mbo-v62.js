(()=>{'use strict';
const STORE='sales_forecast_v16',$=s=>document.querySelector(s);let tm=null,changing=false;
function read(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')}catch(e){return{}}}
function write(z){try{localStorage.setItem(STORE,JSON.stringify(z))}catch(e){}}
function shared(){return window.__SF_SHARED_GMBO||window.__sfSharedMeta?.gmbo||{}}
function currentSharedValue(){const m=$('#month')?.value||'',g=$('#groupTarget')?.value||'';const v=shared()?.[m]?.[g];return Number.isFinite(Number(v))?String(v):''}
function restoreSharedStore(){if(window.__sfMasterToken)return;const z=read();z.gmbo=JSON.parse(JSON.stringify(shared()||{}));delete z.groupMbo;write(z)}
function updateModeHint(){const panel=$('#groupTargetTable')?.closest('section.panel');if(!panel)return;let n=panel.querySelector('.v62-mode-note');if(!n){n=document.createElement('div');n.className='v62-mode-note';const controls=panel.querySelector('.controls');controls?.insertAdjacentElement('afterend',n)}if(window.__sfMasterToken)n.innerHTML='<b>마스터 공용 설정</b> · 입력한 제품군 MBO는 GitHub에 저장되어 모든 사용자에게 적용됩니다.';else n.innerHTML='<b>개인 시뮬레이션</b> · 제품군/MBO를 자유롭게 입력해 계산할 수 있으며 공용값은 변경되지 않습니다.'}
function style(){if($('#v62Style'))return;const s=document.createElement('style');s.id='v62Style';s.textContent='.v62-mode-note{margin:6px 0 8px;font-size:10px;color:#91a9c1}.v62-mode-note b{color:#4fd1c5}.v62-saving{color:#ffb454!important}';document.head.appendChild(s)}
function loadSharedIntoInput(){if(changing)return;const input=$('#groupMbo');if(!input)return;changing=true;input.value=currentSharedValue();input.placeholder='예: 25.5';changing=false;setTimeout(()=>input.dispatchEvent(new Event('change',{bubbles:true})),0)}
async function persistMaster(){if(!window.__sfMasterToken||typeof window.__sfPublishSettings!=='function')return;const status=$('#status');try{status?.classList.add('v62-saving');if(status)status.textContent='제품군 MBO 공용 설정 저장 중...';const got=await window.__sfPublishSettings();window.__SF_SHARED_GMBO=got?.gmbo||read().gmbo||{};window.__sfSharedMeta=got||window.__sfSharedMeta;if(status)status.textContent='제품군 MBO 공용 설정 저장 완료'}catch(e){if(status)status.textContent='제품군 MBO 저장 오류: '+e.message}finally{status?.classList.remove('v62-saving')}}
function onInput(){if(changing)return;clearTimeout(tm);tm=setTimeout(()=>{if(window.__sfMasterToken){persistMaster()}else{restoreSharedStore()}},360)}
document.addEventListener('input',e=>{if(e.target?.id==='groupMbo')onInput()},true);
document.addEventListener('change',e=>{if(e.target?.id==='groupTarget'||e.target?.id==='month')setTimeout(loadSharedIntoInput,30)},true);
window.addEventListener('sf-master-mode-change',e=>{updateModeHint();if(!e.detail?.on){restoreSharedStore();loadSharedIntoInput()}else{const z=read();z.gmbo=z.gmbo||{};write(z)}});
window.addEventListener('sf-group-mbo-committed',()=>{if(window.__sfMasterToken){clearTimeout(tm);tm=setTimeout(persistMaster,120)}else restoreSharedStore()});
new MutationObserver(()=>{style();updateModeHint()}).observe(document.body,{subtree:true,childList:true});style();updateModeHint();restoreSharedStore();setTimeout(loadSharedIntoInput,250);
})();