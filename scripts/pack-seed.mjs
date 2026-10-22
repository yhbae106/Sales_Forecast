// Lossless column/dictionary encoding. Run after replacing data.js from source exports.
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const filename=new URL('../data.js',import.meta.url);
const before=fs.readFileSync(filename,'utf8');
const read=code=>{const context={window:{}};vm.runInNewContext(code,context);return JSON.parse(JSON.stringify(context.window.SEED_DATA));};
const original=read(before),meta={...original},tables={};
for(const [name,rows] of Object.entries(original)){
 if(!Array.isArray(rows)||!rows.length||!rows.every(r=>r&&typeof r==='object'&&!Array.isArray(r)))continue;
 const keys=Object.keys(rows[0]);
 if(!rows.every(r=>JSON.stringify(Object.keys(r))===JSON.stringify(keys)))continue;
 const dicts=keys.map(k=>rows.every(r=>typeof r[k]==='string')?[...new Set(rows.map(r=>r[k]))]:null);
 const indexes=dicts.map(d=>d&&new Map(d.map((v,i)=>[v,i])));
 tables[name]={keys,dicts,rows:rows.map(r=>keys.map((k,i)=>indexes[i]?indexes[i].get(r[k]):r[k]))};
 delete meta[name];
}
const output=`// Generated losslessly by scripts/pack-seed.mjs; runtime SEED_DATA schema is unchanged.\n(()=>{const data=${JSON.stringify(meta)},tables=${JSON.stringify(tables)};for(const [name,t] of Object.entries(tables)){data[name]=t.rows.map(values=>Object.fromEntries(t.keys.map((key,i)=>[key,t.dicts[i]?t.dicts[i][values[i]]:values[i]])));}window.SEED_DATA=data;})();\n`;
assert.deepStrictEqual(read(output),original,'Every seed field and record must survive encoding');
if(Buffer.byteLength(output)<Buffer.byteLength(before))fs.writeFileSync(filename,output);
console.log(JSON.stringify({before:Buffer.byteLength(before),after:fs.statSync(filename).size,rows:Object.fromEntries(Object.entries(tables).map(([k,v])=>[k,v.rows.length]))}));
