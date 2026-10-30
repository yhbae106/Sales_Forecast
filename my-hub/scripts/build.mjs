import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
export const tracked=['src/Hub.tsx','src/data.ts','src/main.tsx','src/storage.js','src/storage.test.js','scripts/build.mjs','scripts/verify.mjs','catalog.json','styles.css','index.html','package.json'];
export async function build(engine){
 await engine.build({absWorkingDir:root,entryPoints:['src/main.tsx'],bundle:true,minify:true,jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},outfile:'hub.js'});
 const hashes=Object.fromEntries([...tracked,'hub.js'].map(name=>[name,createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex')]));
 fs.writeFileSync(path.join(root,'build-meta.json'),JSON.stringify({version:1,hashes},null,2)+'\n');
 console.log('MY HUB build and integrity metadata complete');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await build(await import('esbuild'));
