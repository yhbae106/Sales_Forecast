export const LEGACY_PREFIX = 'yhbae106.myhub.v1.';
export const STORAGE_KEY = 'yhbae106.myhub.v2';
const MAX_BOARDS = 500;
const invalid = () => new Error('업무 정보의 형식이나 값을 확인해주세요.');

export function validateBoard(b) {
  if (!b || typeof b !== 'object' || Array.isArray(b)) throw invalid();
  for (const [key, max] of Object.entries({id:100,name:60,url:2000,category:30,description:180,note:2000,due:10})) {
    if (typeof b[key] !== 'string' || b[key].length > max) throw invalid();
  }
  let url;
  try { url = new URL(b.url); } catch { throw invalid(); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || !b.id.trim() ||
      !b.name.trim() || !b.category.trim() || b.category.trim() === '전체' ||
      !['blue','teal','purple','orange'].includes(b.color) || !['진행 중','대기','완료'].includes(b.status)) throw invalid();
  if (b.due) {
    const date = new Date(b.due + 'T00:00:00Z');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(b.due) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== b.due) throw invalid();
  }
  for (const key of ['revision','visited','created']) {
    if (b[key] !== undefined && (typeof b[key] !== 'number' || !Number.isSafeInteger(b[key]) || b[key] < 0)) throw invalid();
  }
  if (b.favorite !== undefined && ![0,1,false,true].includes(b.favorite)) throw invalid();
  return {id:b.id,name:b.name.trim(),url:url.href,category:b.category.trim(),description:b.description,
    color:b.color,favorite:b.favorite?1:0,status:b.status,due:b.due,note:b.note,
    visited:b.visited??0,revision:b.revision??0,created:b.created??Date.now()};
}

export function validateCatalog(rows) {
  if (!Array.isArray(rows) || rows.length > MAX_BOARDS) throw invalid();
  const valid = rows.map(validateBoard);
  if (new Set(valid.map(b=>b.id)).size !== valid.length || new Set(valid.map(b=>b.url)).size !== valid.length) throw invalid();
  return valid;
}

function readOverrides(storage) {
  const raw = storage.getItem(STORAGE_KEY);
  let rows;
  try {
    if (raw !== null) {
      const data = JSON.parse(raw);
      if (data.version !== 2 || !Array.isArray(data.entries)) throw invalid();
      rows = data.entries;
    } else {
      rows = [];
      for (let i=0;i<storage.length;i++) {
        const key=storage.key(i);
        if (key?.startsWith(LEGACY_PREFIX)) {
          const b=JSON.parse(storage.getItem(key));
          if (b?.id !== key.slice(LEGACY_PREFIX.length)) throw invalid();
          rows.push(b);
        }
      }
    }
    const result=new Map();
    for (const b of rows) {
      if (b?.deleted === true) {
        if (typeof b.id !== 'string' || !b.id.trim() || b.id.length>100) throw invalid();
        result.set(b.id,{id:b.id,deleted:true});
      } else {
        const valid=validateBoard(b);
        result.set(valid.id,valid);
      }
    }
    if (result.size !== rows.length) throw invalid();
    return result;
  } catch {
    throw new Error('저장된 업무 정보가 손상되었습니다. 브라우저 데이터를 삭제하지 말고 백업 파일을 확인해주세요.');
  }
}

function combine(base, overrides) {
  const map=new Map(validateCatalog(base).map(b=>[b.id,b]));
  for (const b of overrides.values()) { if(b.deleted) map.delete(b.id); else map.set(b.id,b); }
  return [...map.values()].sort((a,b)=>a.created-b.created || a.id.localeCompare(b.id));
}
export function readBoards(storage, base) { return combine(base,readOverrides(storage)); }
function writeOverrides(storage, entries) {
  // One setItem is atomic: a quota error leaves the entire prior snapshot intact.
  try { storage.setItem(STORAGE_KEY,JSON.stringify({version:2,entries:[...entries.values()]})); }
  catch { throw new Error('저장 공간을 사용할 수 없어 반영하지 않았습니다. 기존 데이터와 입력 내용은 유지됩니다. 백업 후 저장 공간을 확인해주세요.'); }
}

export function changeBoard(storage, base, action, input) {
  if (!['save','visit','delete'].includes(action)) throw invalid();
  const overrides=readOverrides(storage), all=combine(base,overrides);
  const current=all.find(b=>b.id===input.id);
  if (action==='visit') {
    if (current) { overrides.set(current.id,{...current,visited:Date.now()});writeOverrides(storage,overrides); }
    return;
  }
  if ((current && current.revision!==input.revision) || (!current && input.revision!==0)) {
    throw new Error('다른 창에서 변경된 업무입니다. 목록을 새로고침한 뒤 다시 수정해주세요.');
  }
  if (action==='delete') {
    if (!current) throw invalid();
    overrides.set(current.id,{id:current.id,deleted:true});
  } else {
    const b=validateBoard(input);
    if (all.some(other=>other.id!==b.id && other.url===b.url)) throw new Error('이미 등록된 주소입니다. 기존 업무를 수정해주세요.');
    if (!current && all.length>=MAX_BOARDS) throw new Error('업무는 최대 500개까지 등록할 수 있습니다.');
    overrides.set(b.id,{...b,visited:current?.visited??b.visited,created:current?.created??b.created,revision:(current?.revision??0)+1});
  }
  writeOverrides(storage,overrides);
}

function restorePlan(storage,base,payload) {
  if (payload?.version !== undefined && payload.version !== 1) throw new Error('지원하지 않는 백업 버전입니다.');
  const rows=validateCatalog(Array.isArray(payload)?payload:payload?.boards);
  const overrides=readOverrides(storage), present=combine(base,overrides);
  const result=new Map(present.map(b=>[b.id,b]));
  let added=0,updated=0,unchanged=0;
  for (const b of rows) {
    const byId=result.get(b.id);
    const byUrl=[...result.values()].find(item=>item.url===b.url);
    if (byId && byUrl && byId.id!==byUrl.id) throw new Error('백업의 업무 ID와 주소가 다른 업무와 충돌합니다. 기존 데이터는 변경하지 않았습니다.');
    const current=byId||byUrl;
    const next={...b,id:current?.id??b.id,created:current?.created??b.created,visited:Math.max(current?.visited??0,b.visited),revision:(current?.revision??0)+1};
    const fields=['name','url','category','description','color','favorite','status','due','note','visited'];
    if (current && fields.every(k=>current[k]===next[k])) { unchanged++;continue; }
    result.set(next.id,next);overrides.set(next.id,next);
    if(current)updated++;else added++;
  }
  if(result.size>MAX_BOARDS)throw new Error('복원 후 업무가 500개를 초과합니다. 기존 데이터는 변경하지 않았습니다.');
  return {overrides,added,updated,unchanged};
}
export function previewRestore(storage,base,payload) {
  const {added,updated,unchanged}=restorePlan(storage,base,payload);return {added,updated,unchanged};
}
export function restoreBoards(storage,base,payload) {
  const {overrides,added,updated,unchanged}=restorePlan(storage,base,payload);
  if(added||updated)writeOverrides(storage,overrides);
  return {added,updated,unchanged};
}
