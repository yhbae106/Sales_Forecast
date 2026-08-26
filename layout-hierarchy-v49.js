(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];let moving=false,tm;
function style(){if($('#layoutHierarchyV49Style'))return;const s=document.createElement('style');s.id='layoutHierarchyV49Style';s.textContent=`
.hierarchy-panel{position:relative}.hierarchy-level{display:inline-flex;align-items:center;margin-right:7px;padding:3px 7px;border-radius:999px;border:1px solid #31506b;background:#0a263c;color:#86cfe1;font-size:10px;font-weight:900;vertical-align:2px}.vendor-wide-panel{width:100%;padding:20px}.vendor-wide-panel .table{max-height:none;overflow-x:auto}.vendor-wide-panel table{font-size:13px}.vendor-wide-panel th,.vendor-wide-panel td{padding:11px 12px}.vendor-wide-panel .head h3{font-size:19px}.group-wide-panel{width:100%}.group-wide-panel .table{max-height:460px}.detail-item-only .tabs{display:none!important}.detail-item-only .head{margin-bottom:8px}.detail-item-only .scope-tools{margin-top:8px}.analysis-child-panel{border-color:rgba(79,209,197,.22)}
@media(max-width:900px){.vendor-wide-panel{padding:16px}.vendor-wide-panel table{font-size:12px}.vendor-wide-panel th,.vendor-wide-panel td{padding:9px}}
`;document.head.appendChild(s)}
function title(sec,level,text){const h=sec?.querySelector('.head h3');if(!h)return;const badge=`<span class="hierarchy-level">${level}</span>`;if(!h.querySelector('.hierarchy-level'))h.innerHTML=badge+text;else{const b=h.querySelector('.hierarchy-level')?.outerHTML||badge;h.innerHTML=b+text}}
function forceMaterial(){const tabs=$('.tabs'),mat=tabs?.querySelector('[data-tab="materials"]');if(!tabs||!mat)return;$$('.tabs .tab').forEach(x=>x.classList.remove('active'));mat.classList.add('active');tabs.style.display='none'}
function arrange(){if(moving)return;const vendor=$('#vendorTable')?.closest('section.panel'),group=$('#groupTable')?.closest('section.panel'),daily=$('#dailyTable')?.closest('section.panel'),detail=$('#detailTable')?.closest('section.panel'),compare=$('#compareTable')?.closest('section.panel');if(!vendor||!group||!detail||!compare)return;moving=true;try{style();
 const grid=vendor.parentElement?.classList.contains('grid2')?vendor.parentElement:(group.parentElement?.classList.contains('grid2')?group.parentElement:null);if(grid){const parent=grid.parentElement;parent.insertBefore(vendor,grid);parent.insertBefore(group,grid);if(!grid.children.length)grid.remove()}
 vendor.classList.add('hierarchy-panel','vendor-wide-panel');group.classList.add('hierarchy-panel','group-wide-panel');detail.classList.add('hierarchy-panel','detail-item-only');compare.classList.add('hierarchy-panel','analysis-child-panel');
 title(vendor,'1단계','권역 · 업체 현황');title(group,'2단계','제품군 월별 현황');title(detail,'3단계','품목 상세 현황');title(compare,'4단계','품목별 상세 분석 · 월별 비교');
 const vp=vendor.querySelector('.head p');if(vp)vp.textContent='전체 매출을 권역·관리업체 기준으로 먼저 확인합니다. 업체를 선택하면 아래 제품군 현황이 해당 업체 기준으로 연결됩니다.';
 const gp=group.querySelector('.head p');if(gp)gp.textContent='선택한 업체의 상위 품목 카테고리인 제품군을 월별로 비교합니다.';
 const dp=detail.querySelector('.head p');if(dp&&!dp.querySelector('.scope-badge'))dp.textContent='현재월 기준 품목(상세) 매출과 비중을 확인합니다.';
 const cp=compare.querySelector('.head p');if(cp&&!cp.querySelector('.section-callout'))cp.textContent='위 품목 상세를 과거 확정월과 비교해 추이와 증감을 확인합니다.';
 forceMaterial();
 // Keep the analytical flow contiguous: 업체 → 제품군 → (접힌 일자표) → 품목 현재 → 품목 월별.
 if(daily&&group.nextElementSibling!==daily){group.insertAdjacentElement('afterend',daily)}
 if(daily&&daily.nextElementSibling!==detail)daily.insertAdjacentElement('afterend',detail);else if(!daily&&group.nextElementSibling!==detail)group.insertAdjacentElement('afterend',detail);
 if(detail.nextElementSibling!==compare)detail.insertAdjacentElement('afterend',compare);
 }finally{moving=false}}
function run(){clearTimeout(tm);tm=setTimeout(arrange,80)}
new MutationObserver(run).observe(document.body,{subtree:true,childList:true});document.addEventListener('change',e=>{if(['month','lowerVendor'].includes(e.target?.id))run()});setTimeout(arrange,700);setTimeout(arrange,1700);
})();