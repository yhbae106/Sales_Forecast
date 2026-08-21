(()=>{'use strict';
let applied=false;
function applyDefaults(){if(applied)return;const group=document.querySelector('.tabs .tab[data-tab="groups"]');if(!group)return;document.querySelectorAll('.tabs .tab').forEach(x=>x.classList.remove('active'));group.classList.add('active');group.click();setTimeout(()=>{const avg=document.querySelector('#compareTable th[data-sort="avg"]');if(avg&&!avg.classList.contains('active'))avg.click();applied=true},120)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(applyDefaults,950),{once:true});else setTimeout(applyDefaults,950);
})();