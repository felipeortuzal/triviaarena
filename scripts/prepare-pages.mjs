// Gera apenas os arquivos públicos e verificáveis do Riviera Showdown.
// Configuração Firebase Web é pública; nunca inclua tokens administrativos aqui.
import {readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync} from "node:fs";
import {resolve, dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const dist=join(root,"dist");
const assets=["index.html","app.js","rooms-v2.js","phrases-v3.js","party-game-v5.js","rank-tools-v5.js","phrase-tools.js","data.json","logo.svg","assets/riviera-logo.jpg","riviera-showdown.html"];
mkdirSync(dist,{recursive:true});
for(const file of assets){
  const from=join(root,file);
  if(!existsSync(from))throw Error("Arquivo de publicação ausente: "+file);
  mkdirSync(dirname(join(dist,file)),{recursive:true});
  copyFileSync(from,join(dist,file));
}
const raw=process.env.RIVIERA_FIREBASE_WEB_CONFIG?.trim();
if(raw){
  let parsed;
  try{parsed=JSON.parse(raw)}catch{throw Error("RIVIERA_FIREBASE_WEB_CONFIG não é JSON válido");}
  const keys=["apiKey","authDomain","databaseURL","projectId","appId"];
  for(const key of keys){
    if(typeof parsed[key]!=="string"||!parsed[key].trim()||parsed[key]==="COLE_AQUI")throw Error("Config Web Firebase sem campo "+key);
  }
  if(!/^https:\/\/(?:[a-z0-9-]+\.)+(?:firebaseio\.com|firebasedatabase\.app)\/?$/i.test(parsed.databaseURL)){
    throw Error("databaseURL não aponta para um Realtime Database Firebase HTTPS");
  }
  const publicConfig=Object.fromEntries(keys.map(key=>[key,parsed[key]]));
  // Importante: esta configuração NÃO é segredo e fica visível no navegador.
  const safe=JSON.stringify(publicConfig,null,2).replace(/</g,"\\u003c");
  writeFileSync(join(dist,"firebase-config.js"),"export const firebaseConfig = "+safe+";\n");
} else {
  copyFileSync(join(root,"firebase-config.js"),join(dist,"firebase-config.js"));
}
writeFileSync(join(dist,".nojekyll"),"");
const revision=(process.env.GITHUB_SHA||"local").trim();
const version={name:"Riviera Showdown",revision,mode:raw?"firebase-web-configured":"offline-preview",createdAt:new Date().toISOString()};
writeFileSync(join(dist,"release.json"),JSON.stringify(version,null,2)+"\n");
const home=readFileSync(join(dist,"index.html"),"utf8");
for(const file of ["logo.svg","app.js"]){
  if(!home.includes(file))throw Error("Index não referencia "+file);
}
if(!home.includes('lang="pt-BR"'))throw Error("index.html sem pt-BR");
console.log("Publicação estática preparada: "+assets.length+" arquivos de frontend; Firebase "+(raw?"Web configurado":"não configurado")+"; commit "+revision.slice(0,12));
