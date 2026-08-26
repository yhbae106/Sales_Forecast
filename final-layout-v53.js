(()=>{'use strict';
const $=s=>document.querySelector(s);let busy=false,tm;
function css(){if($('#finalLayoutV53Style'))return;const s=document.createElement('style');s.id='finalLayoutV53Style';s.textContent=`
.v53-full{width:100%!important;grid-column:1/-1!important}.v53-full .table{max-height:540px}.v53-full table{font-size:12px}.v53-vendor .table{max-height:none}.v53-vendor th,.v53-vendor td{padding:10px 12px}.v53-group .table{max-height:480px}.v53-order-note{display:inline-flex;align-items:center;gap:6px;margin-left:8px;color:#91a9c1;font-size:10px}.v53-hidden{display:none!important}.grid2.v53-empty{display:none!important}
`;document.head.appendChild(s)}
function panel(id){return $(id)?.closest('section.panel')}
function arrange(){if(busy)return;const vendor=panel('#vendorTable'),group=panel('#groupTable'),daily=panel('#dailyTable'),mbo=panel('#groupTargetTable'),detail=panel('#detailTable'),compare=panel('#compareTable');if(!vendor||!group||!daily||!mbo)return;busy=true;try{css();const wrap=$('.wrap');if(!wrap)return;
 // Pull vendor/product panels out of the legacy two-column grid.
 const grid=vendor.parentElement?.classList.contains('grid2')?vendor.parentElement:(group.parentElement?.classList.contains('grid2')?group.parentElement:null);if(grid){const anchor=grid;anchor.parentElement.insertBefore(vendor,anchor);anchor.parentElement.insertBefore(group,anchor);if(!grid.children.length){grid.classList.add('v53-empty');grid.style.display='none'}}
 vendor.classList.add('v53-full','v53-vendor');group.classList.add('v53-full','v53-group');
 // Daily pace must sit immediately before product-group MBO.
 if(daily.nextElementSibling!==mbo)mbo.parentElement.insertBefore(daily,mbo);
 // Vendor then product group should follow product-group MBO, never side-by-side.
 if(mbo.nextElementSibling!==vendor)mbo.insertAdjacentElement('afterend',vendor);
 if(vendor.nextElementSibling!==group)vendor.insertAdjacentElement('afterend',group);
 // Consolidated SKU panel follows product group. Separate compare panel stays hidden.
 if(detail&&group.nextElementSibling!==detail)group.insertAdjacentElement('afterend',detail);
 if(compare)compare.classList.add('v53-hidden');
 const vh=vendor.querySelector('.head h3');if(vh&&!vh.querySelector('.hierarchy-level'))vh.innerHTML='<span class="hierarchy-level">1단계</span>권역 · 업체 현황';
 const gh=group.querySelector('.head h3');if(gh&&!gh.querySelector('.hierarchy-level'))gh.innerHTML='<span class="hierarchy-level">2단계</span>제품군 월별 현황';
 }finally{busy=false}}
function schedule(){clearTimeout(tm);tm=setTimeout(arrange,80)}
new MutationObserver(schedule).observe(document.body,{subtree:true,childList:true});window.addEventListener('load',schedule);setTimeout(arrange,600);setTimeout(arrange,1500);setTimeout(arrange,3000);
})();