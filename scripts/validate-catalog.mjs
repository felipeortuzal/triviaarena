import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {validatePuzzle,validateRanking,canon} from "../catalog-v6.js";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const data=JSON.parse(readFileSync(resolve(root,"data.json"),"utf8"));
const errors=[];
if(!Array.isArray(data.puzzles)||!Array.isArray(data.rankings))errors.push("Formato raiz inválido");
const facts=new Map(),ids=new Set(),topics=new Map();
for(let i=0;i<(data.puzzles||[]).length;i++){
 const p=data.puzzles[i],active=p.enabled!==false;
 if(ids.has(p.id))errors.push("ID repetido: "+p.id);
 ids.add(p.id);
 topics.set(p.topic,(topics.get(p.topic)||0)+Number(active));
 if(!active)continue;
 for(const err of validatePuzzle(p))errors.push(p.id+": "+err);
 const k=canon(p.answer);
 if(facts.has(k))errors.push("Fato semanticamente repetido: "+p.id+" e "+facts.get(k));
 facts.set(k,p.id);
}
for(const ranking of data.rankings||[]){
 for(const err of validateRanking(ranking,{minimum:10}))errors.push(ranking.id+": "+err);
 if(!ranking.edition||!ranking.observedAt||!ranking.revision)errors.push(ranking.id+": metadados de edição ausentes");
 if(!Array.isArray(ranking.itemIds)||ranking.itemIds.length!==ranking.items.length)errors.push(ranking.id+": itemIds incompletos");
 if(!(ranking.verifiedPrefix>=1&&ranking.verifiedPrefix<=ranking.items.length))errors.push(ranking.id+": prefixo de fonte não documentado");
}
const total=data.puzzles.length,active=data.puzzles.filter(x=>x.enabled!==false).length;
console.log(JSON.stringify({puzzles:total,playable:active,excluded:total-active,rankings:data.rankings.length,
  topics:Object.fromEntries([...topics].sort((a,b)=>a[0].localeCompare(b[0],"pt-BR"))),errors},null,2));
if(errors.length)process.exitCode=1;
