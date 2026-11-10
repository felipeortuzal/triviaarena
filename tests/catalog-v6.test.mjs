import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {validateCatalog,parseHostRanking,allowedCuts} from "../catalog-v6.js";
const data=JSON.parse(readFileSync(new URL("../data.json",import.meta.url),"utf8"));
test("104 IDs estáveis e catálogo válido; 8 duplicatas inativas preservam índices",()=>{
 assert.equal(data.puzzles.length,104);
 assert.deepEqual(validateCatalog(data),[]);
 assert.equal(data.puzzles.filter(x=>x.status==="active").length,96);
 assert.equal(data.puzzles.filter(x=>x.status==="inactive").length,8);
 assert.equal(data.puzzles[90].id,"frase-0091");
 assert.equal(data.puzzles[90].code,"4 C no C H");
 assert.equal(data.puzzles[90].duplicateOf,data.puzzles[44].id);
 assert.equal(data.puzzles[99].duplicateOf,data.puzzles[67].id);
 assert.match(data.puzzles[67].explain,/NOAA/);
});
test("dicas distintas e duas por frase; edições de ranking",()=>{
 for(const x of data.puzzles.filter(p=>p.status==="active")){
   assert.equal(x.hints.length,2);
   assert.notEqual(x.hints[0],x.hints[1]);
   assert.ok(x.explain&&x.topic&&x.level);
 }
 for(const list of data.rankings){
   assert.equal(list.items.length,100);
   assert.equal(list.itemIds.length,100);
   assert.equal(new Set(list.itemIds).size,100);
   assert.match(list.url,/^https:/);
   assert.ok(list.edition&&list.snapshot&&list.observedAt&&list.methodology);
   assert.deepEqual(list.allowedCuts,[10,25,50,100]);
 }
});
const base={title:"Top 10 Filmes do Grupo",source:"Fonte da comunidade",url:"https://example.org/source",
 snapshot:"Edição novembro 2026",methodology:"Avaliação por voto registrado",observedAt:"2026-11-10",
 items:["1. O Poderoso Chefão","2. 12 Angry Men","3. Filme Três","4. Filme Quatro","5. Filme Cinco","6. Filme Seis","7. Filme Sete","8. Filme Oito","9. Filme Nove","10. Filme Dez"]};
test("importador preserva nome começando por algarismo",()=>{
 const imported=parseHostRanking(base);
 assert.equal(imported.items[0],"O Poderoso Chefão");
 assert.equal(imported.items[1],"12 Angry Men");
 assert.deepEqual(imported.allowedCuts,[10]);
 assert.equal(imported.status,"candidate-unverified");
});
test("importador rejeita metadados faltantes e posição incompleta",()=>{
 assert.throws(()=>parseHostRanking({...base,source:""}),/fonte|edição|critério/i);
 assert.throws(()=>parseHostRanking({...base,url:"http://insecure"}),/HTTPS/);
 assert.throws(()=>parseHostRanking({...base,observedAt:"10/11/26"}),/data/);
 assert.throws(()=>parseHostRanking({...base,items:base.items.slice(0,9)}),/10 a 1.000/);
 assert.throws(()=>parseHostRanking({...base,items:[...base.items.slice(0,9),"1. O Poderoso Chefão"]}),/repetidos/);
});
test("importador rejeita conflito entre aliases e outros itens",()=>{
 assert.throws(()=>parseHostRanking({...base,aliases:{"O Poderoso Chefão":["12 Angry Men"]}}),/Alias conflita/);
});
test("recortes só excedem limites reais quando verificados",()=>{
 assert.deepEqual(allowedCuts(9),[]);
 assert.deepEqual(allowedCuts(10),[10]);
 assert.deepEqual(allowedCuts(255),[10,25,50,75,100,250]);
 assert.deepEqual(allowedCuts(1000),[10,25,50,75,100,250,500,1000]);
});
