const PREFIX='yhbae106.myhub.v1.';
export function validateBoard(b){
 if(!b||typeof b!=='object')throw Error('업무 형식이 올바르지 않습니다.');
 for(const [k,max] of Object.entries({id:100,name:60,url:2000,category:30,description:180,note:2000,due:10}))if(typeof b[k]!=='string'||b[k].length>max)throw Error('업무 정보의 형식이나 길이를 확인해주세요.');
 let u;try{u=new URL(b.url)}catch{throw Error('사이트 주소를 확인해주세요.')}
 if(!['http:','https:'].includes(u.protocol)||u.username||u.password||!b.id||!b.name.trim()||!b.category.trim()||!['blue','teal','purple','orange'].includes(b.color)||!['진행 중','대기','완료'].includes(b.status)||b.due&&!/^\d{4}-\d{2}-\d{2}$/.test(b.due))throw Error('업무 정보가 올바르지 않습니다.');
 return {...b,name:b.name.trim(),category:b.category.trim(),url:u.href,favorite:b.favorite?1:0,revision:Number(b.revision)||0,visited:Number(b.visited)||0,created:Number(b.created)||Date.now()};
}
export function readBoards(storage,base){
 const map=new Map(base.map(b=>[b.id,{...b}]));
 for(let i=0;i<storage.length;i++){const k=storage.key(i);if(!k?.startsWith(PREFIX))continue;let b;try{b=JSON.parse(storage.getItem(k));}catch{throw Error('저장된 업무 정보를 읽을 수 없습니다. 브라우저 데이터를 삭제하지 말고 백업을 확인해주세요.');}
 if(b.deleted){map.delete(b.id);continue;}const v=validateBoard(b);map.set(v.id,v);}
 return [...map.values()].sort((a,b)=>a.created-b.created);
}
export function changeBoard(storage,base,action,input){const current=readBoards(storage,base).find(b=>b.id===input.id);
 if(action==='visit'){if(current)storage.setItem(PREFIX+current.id,JSON.stringify({...current,visited:Date.now()}));return;}
 if(current&&current.revision!==input.revision||!current&&input.revision!==0)throw Error('다른 창에서 변경된 업무입니다. 목록을 새로고침해주세요.');
 if(action==='delete'){storage.setItem(PREFIX+input.id,JSON.stringify({id:input.id,deleted:true}));return;}
 const b=validateBoard(input);storage.setItem(PREFIX+b.id,JSON.stringify({...b,visited:current?.visited||b.visited,revision:(current?.revision||0)+1}));
}
export function restoreBoards(storage,base,payload){const rows=Array.isArray(payload)?payload:payload?.boards;if(!Array.isArray(rows)||rows.length>500)throw Error('업무 백업 JSON 파일을 선택해주세요.');const valid=rows.map(validateBoard);const present=readBoards(storage,base);const ids=new Set(present.map(b=>b.id));const urls=new Set(present.map(b=>b.url));let count=0;for(const b of valid){if(urls.has(b.url))continue;const next={...b,id:ids.has(b.id)?(crypto.randomUUID?.()||'board-'+Date.now()+'-'+Math.random().toString(36).slice(2)):b.id,revision:0};changeBoard(storage,base,'save',next);ids.add(next.id);urls.add(next.url);count++;}return count;}
