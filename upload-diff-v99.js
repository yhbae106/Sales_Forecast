(()=>{'use strict';
const REPO='yhbae106/Sales_Forecast',COMMITS='https://api.github.com/repos/'+REPO+'/commits?path=shared-data/sales-history.json&per_page=30',CONTENT='https://api.github.com/repos/'+REPO+'/contents/shared-data/sales-history.json';
const $=s=>document.querySelector(s),N=v=>Number(v||0),X=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const E=v=>(N(v)/1e8).toLocaleString('ko-KR',{minimumFractionDigits:1,maximumFractionDigits:3})+'억';
const WON=v=>Math.round(N(v)).toLocaleString('ko-KR')+'원';
let open=false,loading=false,selectedVendor='',fallback=null;
function rowKey(r){return[String(r.d||r.date||''),String(r.v||r.vendor||''),String(r.g||r.productGroup||'미분류'),String(r.m||r.material||'미분류')].join('\u0001')}
function latestMonth(shared){const src=[...(shared?.sourceFiles||[])].filter(x=>x?.month).sort((a,b)=>String(a.lastDate||a.date||'').localeCompare(String(b.lastDate||b.date||''))).at(-1);return src?.month||''}
function compute(previous,current,meta={}){const month=meta.month||latestMonth(current);if(!month)return null;const map=rows=>{const o=new Map();for(const r of rows||[]){if(String(r.d||r.date||'').slice(0,7)!==month)continue;const k=rowKey(r);o.set(k,(o.get(k)||0)+N(r.a??r.amount))}return o},a=map(previous?.uploads),b=map(current?.uploads),keys=new Set([...a.keys(),...b.keys()]),rows=[];let previousTotal=0,currentTotal=0;for(const v of a.values())previousTotal+=v;for(const v of b.values())currentTotal+=v;for(const k of keys){const before=a.get(k)||0,after=b.get(k)||0,delta=after-before;if(Math.abs(delta)<=.5)continue;const[d,v,g,m]=k.split('\u0001');rows.push({d,v,g,m,before,after,delta})}rows.sort((x,y)=>Math.abs(y.delta)-Math.abs(x.delta));return{version:1,month,createdAt:meta.createdAt||current?.updatedAt||'',previousTotal,currentTotal,delta:currentTotal-previousTotal,changedRowCount:rows.length,rows,truncated:false,sourceFile:meta.sourceFile||current?.sourceFiles?.find(x=>x.month===month)?.fileName||'',lastDate:meta.lastDate||current?.sourceFiles?.find(x=>x.month===month)?.lastDate||''}}
function style(){if($('#sfUploadDiffStyle'))return;const s=document.createElement('style');s.id='sfUploadDiffStyle';s.textContent=`
#sfUploadDiffBtn{border-color:#4f7ea1!important;color:#d9edf8!important}
#sfUploadDiffBtn.active{border-color:#4fd1c5!important;color:#4fd1c5!important;background:#0a2c32!important}
.sf-upload-diff{display:none;margin-top:12px;border:1px solid #254861;border-radius:14px;background:#091a2a;padding:14px}
.sf-upload-diff.open{display:block}
.sf-upload-diff .sfud-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.sf-upload-diff h3{margin:0;font-size:15px;color:#eef6ff}
.sf-upload-diff .sfud-sub{margin-top:4px;font-size:10px;color:#8ea9bc}
.sfud-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:12px}
.sfud-card{border:1px solid #27465f;border-radius:10px;background:#0c2235;padding:10px}
.sfud-card span{display:block;font-size:9px;color:#8da8ba;margin-bottom:4px}
.sfud-card b{font-size:14px;color:#e9f5fb}
.sfud-pos{color:#59d98e!important}.sfud-neg{color:#ff7285!important}.sfud-zero{color:#b7c9d8!important}
.sfud-grid{display:grid;grid-template-columns:minmax(300px,.8fr) minmax(520px,1.8fr);gap:10px}
.sfud-box{border:1px solid #213d53;border-radius:10px;overflow:hidden;background:#081724}
.sfud-box .title{padding:9px 10px;font-size:10px;font-weight:900;color:#b9d1df;border-bottom:1px solid #213d53;background:#0c2133}
.sfud-table{max-height:390px;overflow:auto}
.sfud-table table{width:100%;border-collapse:collapse;font-size:10px}
.sfud-table th{position:sticky;top:0;z-index:2;background:#10283d;color:#9fb7c8;text-align:right;padding:7px 8px;white-space:nowrap}
.sfud-table td{padding:7px 8px;border-top:1px solid rgba(44,72,92,.55);text-align:right;white-space:nowrap;color:#d6e5ee}
.sfud-table th:first-child,.sfud-table td:first-child{text-align:left}
.sfud-vendor{cursor:pointer}.sfud-vendor:hover{background:rgba(79,209,197,.07)}.sfud-vendor.active{background:rgba(79,209,197,.12)}
.sfud-sku{text-align:left!important;white-space:normal!important;min-width:210px;line-height:1.35}
.sfud-muted{color:#829aaa!important}.sfud-empty{padding:20px;text-align:center;color:#91a9c1;font-size:11px}
.sfud-actions{display:flex;gap:6px;align-items:center}.sfud-actions button{border:1px solid #31506b;background:#0b2237;color:#cfe4f4;border-radius:7px;padding:6px 9px;font-size:10px;font-weight:800;cursor:pointer}
.sfud-actions button:hover{border-color:#4fd1c5;color:#4fd1c5}
@media(max-width:980px){.sfud-grid{grid-template-columns:1fr}.sfud-summary{grid-template-columns:repeat(2,minmax(0,1fr))}}
`;document.head.appendChild(s)}
function vendors(diff){const mp={};for(const r of diff?.rows||[]){const v=r.v||r.vendor||'미분류';mp[v]=(mp[v]||0)+N(r.delta)}return Object.entries(mp).map(([name,delta])=>({name,delta})).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta))}
function cls(v){return v>0?'sfud-pos':v<0?'sfud-neg':'sfud-zero'}
function render(diff){const p=$('#sfUploadDiffPanel');if(!p)return;if(!diff){p.innerHTML='<div class="sfud-empty">비교 가능한 직전 업로드 이력이 없습니다.</div>';return}const vs=vendors(diff),rows=(diff.rows||[]).filter(r=>!selectedVendor||(r.v||r.vendor)===selectedVendor),stamp=diff.createdAt?new Date(diff.createdAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'}):'',changedV=vs.length;
p.innerHTML=`<div class="sfud-head"><div><h3>직전 업로드 대비 증감</h3><div class="sfud-sub">${X(diff.month||'')} · ${X(diff.sourceFile||'')} ${diff.lastDate?'· '+X(diff.lastDate):''} ${stamp?'· '+X(stamp):''}</div></div><div class="sfud-actions">${selectedVendor?'<button type="button" id="sfudAll">전체 업체</button>':''}<button type="button" id="sfudClose">닫기</button></div></div>
<div class="sfud-summary"><div class="sfud-card"><span>직전 업로드 누계</span><b>${E(diff.previousTotal)}</b></div><div class="sfud-card"><span>현재 업로드 누계</span><b>${E(diff.currentTotal)}</b></div><div class="sfud-card"><span>순증감</span><b class="${cls(diff.delta)}">${diff.delta>0?'+':''}${E(diff.delta)}</b></div><div class="sfud-card"><span>변경 범위</span><b>${changedV}개 업체 · ${diff.changedRowCount||diff.rows?.length||0}개 SKU행</b></div></div>
<div class="sfud-grid"><div class="sfud-box"><div class="title">업체별 순증감 · 클릭하면 상세 필터</div><div class="sfud-table"><table><thead><tr><th>업체</th><th>순증감</th></tr></thead><tbody>${vs.map(v=>`<tr class="sfud-vendor ${selectedVendor===v.name?'active':''}" data-v="${X(v.name)}"><td>${X(v.name)}</td><td class="${cls(v.delta)}">${v.delta>0?'+':''}${E(v.delta)}</td></tr>`).join('')||'<tr><td colspan="2">변경 없음</td></tr>'}</tbody></table></div></div>
<div class="sfud-box"><div class="title">${selectedVendor?X(selectedVendor)+' · ':''}SKU 상세</div><div class="sfud-table"><table><thead><tr><th>일자</th><th>제품군</th><th>SKU</th><th>직전</th><th>현재</th><th>증감</th></tr></thead><tbody>${rows.map(r=>`<tr><td class="sfud-muted">${X(r.d||r.date||'')}</td><td>${X(r.g||r.productGroup||'미분류')}</td><td class="sfud-sku">${X(r.m||r.material||'미분류')}</td><td>${WON(r.before)}</td><td>${WON(r.after)}</td><td class="${cls(r.delta)}">${r.delta>0?'+':''}${WON(r.delta)}</td></tr>`).join('')||'<tr><td colspan="6">해당 조건의 변경 내역이 없습니다.</td></tr>'}</tbody></table></div></div></div>`;
p.querySelectorAll('.sfud-vendor').forEach(tr=>tr.onclick=()=>{selectedVendor=tr.dataset.v||'';render(diff)});
$('#sfudAll')?.addEventListener('click',()=>{selectedVendor='';render(diff)});$('#sfudClose')?.addEventListener('click',toggle)}
async function fetchJson(url,raw=false){const h={'X-GitHub-Api-Version':'2022-11-28'};if(raw)h.Accept='application/vnd.github.raw+json';const r=await fetch(url+(url.includes('?')?'&':'?')+'t='+Date.now(),{headers:h,cache:'no-store'});if(!r.ok)throw new Error('GitHub 비교 데이터 조회 실패 ('+r.status+')');return r.json()}
async function fallbackDiff(){if(fallback)return fallback;const commits=await fetchJson(COMMITS),sales=(commits||[]).filter(x=>String(x.commit?.message||'').startsWith('Update shared sales data'));if(sales.length<2)return null;const prev=await fetchJson(CONTENT+'?ref='+encodeURIComponent(sales[1].sha),true),cur=window.__sfSharedMeta||await window.__sfReadShared?.();fallback=compute(prev,cur,{month:latestMonth(cur),createdAt:sales[0].commit?.committer?.date||cur?.updatedAt||''});return fallback}
async function current(){return window.__SF_LAST_UPLOAD_DIFF||window.__sfSharedMeta?.lastUploadDiff||await fallbackDiff()}
async function show(){const p=$('#sfUploadDiffPanel');if(!p)return;if(loading)return;loading=true;p.innerHTML='<div class="sfud-empty">직전 업로드 비교 내역 확인 중...</div>';try{render(await current())}catch(e){p.innerHTML='<div class="sfud-empty">'+X(e.message)+'</div>'}finally{loading=false}}
function toggle(){open=!open;const p=$('#sfUploadDiffPanel'),b=$('#sfUploadDiffBtn');p?.classList.toggle('open',open);b?.classList.toggle('active',open);if(open)show()}
function install(){style();const bar=$('.master-bar'),status=$('#status'),host=status?.parentElement;if(!bar||!host)return false;if(!$('#sfUploadDiffBtn')){const b=document.createElement('button');b.type='button';b.id='sfUploadDiffBtn';b.className='master-btn';b.textContent='직전 업로드 대비 증감';b.onclick=toggle;bar.appendChild(b)}if(!$('#sfUploadDiffPanel')){const p=document.createElement('div');p.id='sfUploadDiffPanel';p.className='sf-upload-diff';host.insertAdjacentElement('afterend',p)}return true}
window.addEventListener('sf-data-refreshed',()=>{fallback=null;selectedVendor='';if(open)setTimeout(show,20)});
window.addEventListener('sf-core-ready',()=>{install();if(open)show()});
if(!install()){setTimeout(install,250);setTimeout(install,900)}
})();