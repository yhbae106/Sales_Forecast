(()=>{'use strict';
const ID='groupMbo';
function apply(){const el=document.getElementById(ID);if(!el)return;if(el.dataset.decimalV41==='1')return;el.dataset.decimalV41='1';el.type='text';el.inputMode='decimal';el.autocomplete='off';el.placeholder='예: 12.5';el.setAttribute('aria-label','제품군 MBO(억) 소수점 입력 가능');
 const clean=()=>{let v=String(el.value||'').trim().replace(/,/g,'.').replace(/[^0-9.]/g,'');const p=v.indexOf('.');if(p>=0)v=v.slice(0,p+1)+v.slice(p+1).replace(/\./g,'');if(v&&v!=='.'){const n=Number(v);if(Number.isFinite(n)&&n>=0)v=v}el.value=v};
 el.addEventListener('input',()=>{const before=el.value;clean();if(el.value!==before)el.dispatchEvent(new Event('change',{bubbles:true}))});
 el.addEventListener('blur',()=>{clean();el.dispatchEvent(new Event('input',{bubbles:true}))});
}
apply();new MutationObserver(apply).observe(document.documentElement,{subtree:true,childList:true});setTimeout(apply,500);setTimeout(apply,1500);
})();