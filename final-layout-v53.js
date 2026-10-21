(()=>{'use strict';
const $=s=>document.querySelector(s);let busy=false;
function css(){if($('#finalLayoutV53Style'))return;const s=document.createElement('style');s.id='finalLayoutV53Style';s.textContent=`
.v53-full{width:100%!important;grid-column:1/-1!important}.v53-full .table{max-height:540px}.v53-full table{font-size:12px}.v53-vendor .table{max-height:none}.v53-vendor th,.v53-vendor td{padding:10px 12px}.v53-group .table{max-height:480px}.v53-hidden,.grid2.v53-empty{display:none!important}.hierarchy-level{margin-right:7px}
.sf-section-nav{position:sticky;top:8px;z-index:40;display:flex;align-items:center;gap:5px;padding:7px 9px;margin:0 0 16px;border:1px solid #35516e;border-radius:12px;background:rgba(11,24,41,.96);box-shadow:0 6px 18px rgba(2,6,23,.25);backdrop-filter:blur(10px);overflow-x:auto;scrollbar-width:thin}
.sf-section-nav .sf-nav-label{flex:0 0 auto;color:#9fb4c9;font-size:11px;font-weight:750;padding:0 8px 0 3px}.sf-section-nav button{flex:0 0 auto;border:1px solid transparent;border-radius:8px;background:transparent;color:#dce9f5;padding:8px 11px;min-height:36px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:700;white-space:nowrap}.sf-section-nav button:hover{background:#203952;border-color:#466984;color:#fff}
.sf-section-nav button:focus-visible,.sf-group-filter input:focus-visible,.sf-group-filter button:focus-visible{outline:2px solid #67e8f9;outline-offset:2px}.sf-section-nav button[hidden]{display:none!important}.sf-jump-target{scroll-margin-top:84px}.sf-jump-target:focus{outline:none}.sf-jump-target:focus-visible{outline:2px solid #67e8f9;outline-offset:3px}
.sf-group-filter{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:10px 0 11px}.sf-group-filter label{display:flex;align-items:center;gap:8px;color:#bfcede;font-size:12px;font-weight:750}.sf-group-filter input{width:230px;max-width:100%;border:1px solid #3c5770;border-radius:9px;padding:9px 11px;background:#0b182a;color:#f1f5f9;font:inherit}.sf-group-filter input::placeholder{color:#90a6bd}.sf-group-filter button{border:1px solid #354e67;border-radius:8px;background:#13263d;color:#c9dbea;padding:8px 10px;font:inherit;font-size:11px;cursor:pointer}.sf-group-filter button[hidden],#groupTable tr[hidden]{display:none!important}.sf-group-count{color:#9db3c9;font-size:11px}.sf-group-filter-note{font-size:11px;color:#afc2d4;line-height:1.6;margin:6px 0 10px}
@media(max-width:760px){.sf-section-nav{top:4px;padding:5px;gap:2px}.sf-section-nav .sf-nav-label{display:none}.sf-section-nav button{min-height:42px;padding:8px 10px}.sf-jump-target{scroll-margin-top:74px}.sf-group-filter label{width:100%}.sf-group-filter input{flex:1;min-width:0}section.panel:has(#groupTargetTable)>.controls{grid-template-columns:repeat(2,minmax(0,1fr))!important}section.panel:has(#groupTargetTable)>.controls>label:first-child{grid-column:1/-1}}
@media(max-width:430px){section.panel:has(#groupTargetTable)>.controls{grid-template-columns:1fr!important}}@media print{.sf-section-nav,.sf-group-filter{display:none!important}}
`;document.head.appendChild(s)}
function panel(id){return $(id)?.closest('section.panel')}
function arrange(){if(busy)return;const vendor=panel('#vendorTable'),group=panel('#groupTable'),mbo=panel('#groupTargetTable'),detail=panel('#detailTable'),compare=panel('#compareTable');if(!vendor||!group||!mbo)return;busy=true;try{css();const grid=vendor.parentElement?.classList.contains('grid2')?vendor.parentElement:(group.parentElement?.classList.contains('grid2')?group.parentElement:null);if(grid){const parent=grid.parentElement;parent.insertBefore(vendor,grid);parent.insertBefore(group,grid);if(!grid.children.length){grid.classList.add('v53-empty');grid.style.display='none'}}vendor.classList.add('v53-full','v53-vendor');group.classList.add('v53-full','v53-group','sf-defer-render');mbo.classList.add('sf-defer-render');if(detail)detail.classList.add('sf-defer-render');mbo.insertAdjacentElement('beforebegin',vendor);vendor.insertAdjacentElement('afterend',group);group.insertAdjacentElement('afterend',mbo);if(detail)mbo.insertAdjacentElement('afterend',detail);if(compare)compare.classList.add('v53-hidden');const vh=vendor.querySelector('.head h3');if(vh&&!vh.querySelector('.hierarchy-level'))vh.innerHTML='<span class="hierarchy-level">1단계</span>권역 · 업체 현황';const gh=group.querySelector('.head h3');if(gh&&!gh.querySelector('.hierarchy-level'))gh.innerHTML='<span class="hierarchy-level">2단계</span>제품군 월별 현황';const mh=mbo.querySelector('.head h3');if(mh)mh.textContent='제품군 MBO · 조치 시뮬레이션';window.dispatchEvent(new Event('sf-layout-updated'))}finally{busy=false}}
const destinations=[
  ['overview','매출 요약',()=>$('#cards')],
  ['radar','운영 판단',()=>$('#decisionRadarV93')],
  ['vendor','1단계 업체',()=>panel('#vendorTable')],
  ['group','2단계 제품군',()=>panel('#groupTable')],
  ['mbo','제품군 MBO',()=>panel('#groupTargetTable')],
  ['sku','3단계 SKU',()=>panel('#v51CompareTable')]
];
function navigation(){
  const cards=$('#cards');if(!cards)return;let nav=$('#sfSectionNav');
  if(!nav){nav=document.createElement('nav');nav.id='sfSectionNav';nav.className='sf-section-nav';nav.setAttribute('aria-label','대시보드 구역 바로가기');const label=document.createElement('span');label.className='sf-nav-label';label.textContent='바로가기';nav.appendChild(label);for(const[key,text]of destinations){const b=document.createElement('button');b.type='button';b.dataset.sfJump=key;b.textContent=text;nav.appendChild(b)}cards.insertAdjacentElement('beforebegin',nav)}
  for(const[key,,resolve]of destinations){const target=resolve(),button=nav.querySelector('[data-sf-jump="'+key+'"]');if(button)button.hidden=!target;if(target){target.classList.add('sf-jump-target');target.setAttribute('tabindex','-1')}}
}
function applyGroupSearch(){
  const input=$('#sfGroupSearch'),count=$('#sfGroupSearchCount'),clear=$('#sfGroupSearchClear'),note=$('#sfGroupSearchEmpty');if(!input)return;
  const query=input.value.trim().normalize('NFKC').toLocaleLowerCase('ko-KR'),rows=[...document.querySelectorAll('#groupTable tbody tr[data-v61-group]')];let visible=0;
  for(const row of rows){const name=(row.dataset.v61Group||'').normalize('NFKC').toLocaleLowerCase('ko-KR'),match=!query||name.includes(query);row.hidden=!match;row.dataset.sfSearchHidden=String(!match);if(match)visible++}
  if(count)count.textContent=query?`${visible} / ${rows.length}개 제품군 · 검색 결과만 Excel로 저장`:`${rows.length}개 제품군`;
  if(clear)clear.hidden=!input.value;if(note){note.hidden=!query||visible>0;note.textContent='검색 결과가 없습니다. 제품군명을 확인하거나 검색을 지우세요.'}
}
function groupSearch(){
  const sec=panel('#groupTable'),table=sec?.querySelector('.table');if(!sec||!table)return;
  if(!$('#sfGroupSearch')){const bar=document.createElement('div');bar.className='sf-group-filter';bar.innerHTML='<label for="sfGroupSearch">제품군 찾기 <input id="sfGroupSearch" type="search" placeholder="예: 릭시아나" autocomplete="off" aria-controls="groupTable" aria-describedby="sfGroupSearchCount"></label><button id="sfGroupSearchClear" type="button" hidden>검색 지우기</button><span id="sfGroupSearchCount" class="sf-group-count" role="status" aria-live="polite"></span>';table.insertAdjacentElement('beforebegin',bar);const note=document.createElement('p');note.id='sfGroupSearchEmpty';note.className='sf-group-filter-note';note.hidden=true;bar.insertAdjacentElement('afterend',note)}applyGroupSearch();
}
document.addEventListener('click',e=>{const jump=e.target.closest('[data-sf-jump]');if(jump){const target=destinations.find(([key])=>key===jump.dataset.sfJump)?.[2]();if(target){target.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});target.focus({preventScroll:true})}return}if(e.target.closest('#sfGroupSearchClear')){const input=$('#sfGroupSearch');if(input){input.value='';applyGroupSearch();input.focus()}}});
document.addEventListener('input',e=>{if(e.target?.id==='sfGroupSearch')applyGroupSearch()});
window.addEventListener('sf-product-table-rendered',groupSearch);
window.addEventListener('sf-radar-rendered',navigation);
window.addEventListener('sf-layout-updated',()=>{navigation();groupSearch()});
window.addEventListener('sf-detail-shell-ready',()=>requestAnimationFrame(arrange));
arrange();window.addEventListener('sf-core-ready',()=>requestAnimationFrame(arrange),{once:true});window.addEventListener('sf-v61-ready',()=>requestAnimationFrame(arrange),{once:true});document.addEventListener('change',e=>{if(e.target?.id==='month')requestAnimationFrame(arrange)});
})();
