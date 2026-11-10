import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve,dirname} from "node:path";
import {validatePuzzle,validateRanking,importRanking,parseOrderedItems,cutsFor,RANK_CUTS} from "../catalog-v6.js";
const dir=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const data=JSON.parse(readFileSync(resolve(dir,"data.json"),"utf8"));
test("110 fatos: 104 índices originais preservados, duplicatas desativadas, IDs estáveis",()=>{
 assert.equal(data.puzzles.length,110);
 assert.equal(data.puzzles.filter(p=>p.enabled!==false).length,101);
 assert.equal(data.puzzles.filter(p=>p.enabled===false).length,9);
 for(let i=0;i<data.puzzles.length;i++){
  const p=data.puzzles[i];
  assert.equal(p.id,"fact-"+String(i+1).padStart(3,"0"));
  if(p.enabled!==false)assert.deepEqual(validatePuzzle(p),[],p.code);
 }
 assert.equal(data.puzzles[90].code,"4 C no D H");
 assert.equal(data.puzzles[90].enabled,false);
 assert.equal(data.puzzles[90].duplicateOf,"fact-045");
 assert.equal(data.puzzles[99].enabled,false);
 assert.equal(data.puzzles[99].duplicateOf,"fact-068");
 assert.equal(data.puzzles[44].enabled,true);
 assert.equal(data.puzzles[67].enabled,true);
 assert.notEqual(data.puzzles[44].hints[0],data.puzzles[44].hints[1]);
});
test("seis rankings com fontes: quatro Top100 históricos e dois oficiais totalmente conferidos",()=>{
 assert.equal(data.rankings.length,6);
 for(const list of data.rankings){
  assert.ok([10,20,100].includes(list.items.length));
  assert.equal(list.itemIds.length,list.items.length);
  assert.equal(new Set(list.itemIds).size,100);
  assert.ok(list.revision&&list.edition&&list.observedAt);
  assert.ok(list.verifiedPrefix>0&&list.verifiedPrefix<=list.items.length);
  assert.deepEqual(validateRanking(list,{minimum:10}),[],list.id);
 }
 assert.equal(data.rankings.find(x=>x.id==="ifpi-artist-2025").verifiedPrefix,10);
 assert.equal(data.rankings.find(x=>x.id==="wipo-innovation-2026").verifiedPrefix,20);
 assert.deepEqual(cutsFor(10),[10]);
 assert.deepEqual(cutsFor(100),[10,25,50,100]);
 assert.deepEqual(cutsFor(1000),RANK_CUTS);
});
test("importador aceita título iniciado por número e remove só prefixo inequívoco",()=>{
 const items=Array.from({length:10},(_,i)=>i===0?"1. 12 Angry Men":`${i+1}. Item ${i+1}`).join("\n");
 assert.equal(parseOrderedItems(items)[0],"12 Angry Men");
 const list=importRanking({title:"Filmes da minha lista",source:"Planilha pessoal",url:"https://example.com/dados",
  snapshot:"2026-11-10",about:"Dez filmes em ordem de avaliação; empates resolvidos por título.",rawItems:items});
 assert.equal(list.items[0],"12 Angry Men");
 assert.deepEqual(validateRanking(list),[]);
});
test("importador recusa fonte vazia, ordem incompleta, duplicatas e aliases ambíguos",()=>{
 const items=Array.from({length:10},(_,i)=>"Item "+(i+1));
 const valid={title:"Minha lista com dez itens",source:"Minha publicação",url:"https://example.org/a",
 snapshot:"edição 2026",about:"Critério verificável de ordenação, com desempate.",rawItems:items.join("\n")};
 assert.throws(()=>importRanking({...valid,source:""}),/fonte/i);
 assert.throws(()=>importRanking({...valid,url:"javascript:alert(1)"}),/URL/i);
 assert.throws(()=>importRanking({...valid,rawItems:"Item 1\nItem 2"}),/Quantidade/i);
 assert.throws(()=>importRanking({...valid,rawItems:items.slice(0,9).concat("Item 1").join("\n")}),/duplicad/i);
 assert.throws(()=>importRanking({...valid,aliases:{"Item 1":["apelido"],"Item 2":["Apelido"]}}),/Alias/i);
});
