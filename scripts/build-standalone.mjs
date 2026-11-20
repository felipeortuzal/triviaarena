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
const imageFiles={beach:'assets/riviera-reference-beach.jpg',logo:'assets/riviera-logo-transparent.png'};
const images={};
let offlineCode=code;
for(const [key,file] of Object.entries(imageFiles)){
  const mime=file.endsWith('.png')?'image/png':'image/jpeg';
  images[key]='data:'+mime+';base64,'+fs.readFileSync(path.join(root,file)).toString('base64');
  html=html.replaceAll('src="'+file+'"','data-riviera-image="'+key+'"');
  html=html.replaceAll("url('"+file+"')","var(--offline-"+key+")");
  // The home screen renders these image URLs in an HTML template literal.
  offlineCode=offlineCode.replaceAll(file,()=>'${window.RIVIERA_OFFLINE_IMAGES.'+key+'}');
}
const escapedData=JSON.stringify(data).replace(/</g,'\\u003c');
const boot=`<script>
window.RIVIERA_STANDALONE=true;
window.RIVIERA_EMBEDDED_DATA=${escapedData};
window.RIVIERA_OFFLINE_IMAGES=${JSON.stringify(images)};
for(const node of document.querySelectorAll('[data-riviera-image]'))node.src=window.RIVIERA_OFFLINE_IMAGES[node.dataset.rivieraImage];
for(const [key,uri] of Object.entries(window.RIVIERA_OFFLINE_IMAGES))document.documentElement.style.setProperty('--offline-'+key,'url("'+uri+'")');
</script>`;
const inline='<script type="module">\n'+offlineCode.replace(/<\/script/gi,'<\\/script')+'\n</script>';
const external='<script type="module" src="app.js"></script>';
if(!html.includes(external))throw new Error('Tag app.js não encontrada');
html=html.replaceAll('href="logo.svg"',()=>`href="${logo}"`);
html=html.replaceAll('src="logo.svg"',()=>`src="${logo}"`);
html=html.replace(external,()=>boot+'\n'+inline);
for(const file of Object.values(imageFiles)){
  if(html.includes(file))throw new Error('Asset offline não embutido: '+file);
}
const out=path.join(root,'riviera-showdown.html');
fs.writeFileSync(out,html);
console.log('Gerado '+out+' ('+Buffer.byteLength(html)+' bytes)');
