import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
let html=read('index.html');
const included=new Set();
function bundle(name){
  if(included.has(name))return '';
  included.add(name);
  let source=read(name),dependencies='';
  source=source.replace(/^import .* from ["']\.\/([^"']+)["'];?$/gm,(_,file)=>{dependencies+=bundle(file)+'\n';return ''});
  return dependencies+source.replace(/^export /gm,'');
}
const code=bundle('app.js');
const data=JSON.parse(read('data.json'));
const logo='data:image/svg+xml,'+encodeURIComponent(read('logo.svg'));
const escapedData=JSON.stringify(data).replace(/</g,'\\u003c');
const boot='<script>window.RIVIERA_STANDALONE=true;window.RIVIERA_EMBEDDED_DATA='+escapedData+';<\/script>';
const inline='<script type="module">\n'+code.replace(/<\/script/gi,'<\\/script')+'\n<\/script>';
const external='<script type="module" src="app.js"><\/script>';
if(!html.includes(external))throw new Error('Tag app.js não encontrada');
html=html.replace(/href="logo\.svg"/g,()=>`href="${logo}"`);
html=html.replace(/src="logo\.svg"/g,()=>`src="${logo}"`);
html=html.replace(external,boot+'\n'+inline);
const out=path.join(root,'riviera-showdown.html');
fs.writeFileSync(out,html);
console.log('Gerado '+out+' ('+Buffer.byteLength(html)+' bytes)');
