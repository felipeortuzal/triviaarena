import test from "node:test";
import assert from "node:assert/strict";
import {normalizeItem,isEligibleRanking,resolveGuess,calculateRanking} from "../rank-tools-v5.js";

const fixture={
  id:"test-fixture",title:"Fixture sintética — NÃO publicar",
  source:"Dados sintéticos do teste",snapshot:"Fixture 2026",url:"https://example.org/testing-only",
  items:Array.from({length:30},(_,i)=>"Item "+(i+1)),
  aliases:{"Item 4":["Quarto"],"Item 6":["Sexto"],"Item 30":["Último item"],"Item 7":["Mesmo nome"],"Item 8":["Mesmo nome"]}
};
test("fonte, data, ordem e duplicatas obrigatórias",()=>{
  assert.equal(isEligibleRanking(fixture),true);
  assert.equal(isEligibleRanking({...fixture,source:""}),false);
  assert.equal(isEligibleRanking({...fixture,items:["A","a"]}),false);
  assert.equal(isEligibleRanking({...fixture,url:"javascript:alert(1)"}),false);
  assert.equal(normalizeItem("  São   Paulo  "),"sao paulo");
});
test("alvo 5 e posições 5/4/6: distância 0,1,1; lugares 1,2,2 e 5/3/3",()=>{
  const guesses={a:"item 5",b:"quarto",c:"Sexto"};
  const rows=calculateRanking({list:fixture,limit:25,target:5,guesses,members:["a","b","c"]});
  assert.deepEqual(["a","b","c"].map(uid=>rows[uid].delta),[0,1,1]);
  assert.deepEqual(["a","b","c"].map(uid=>rows[uid].place),[1,2,2]);
  assert.deepEqual(["a","b","c"].map(uid=>rows[uid].points),[5,3,3]);
  assert.equal(rows.b.position,4);
});
test("posição 1, última posição e palpite fora do recorte",()=>{
  assert.equal(resolveGuess("Item 1",fixture,25).position,1);
  assert.equal(resolveGuess("Item 25",fixture,25).position,25);
  assert.equal(resolveGuess("Último item",fixture,25).status,"out-of-cut");
  assert.equal(resolveGuess("Último item",fixture,30).position,30);
});
test("vazio, ausente, ambíguo e desconhecido não pontuam",()=>{
  const guesses={a:"",b:"",c:"mesmo nome",d:"País inventado"};
  const rows=calculateRanking({list:fixture,limit:25,target:5,guesses,members:["a","b","c","d","e"]});
  assert.deepEqual(["a","b","c","d","e"].map(u=>rows[u].points),[0,0,0,0,0]);
  assert.equal(rows.c.status,"ambiguous");
  assert.equal(rows.e.status,"empty");
});
test("correção justificada recalcula todas as posições, sem duplicar pontos",()=>{
  const guesses={a:"Item 5",b:"não cadastrado",c:"Item 4"};
  const overrides={b:{position:6,reason:"É um sinônimo do Item 6"}};
  const rows=calculateRanking({list:fixture,limit:25,target:5,guesses,members:["a","b","c"],overrides});
  assert.deepEqual(["a","b","c"].map(u=>rows[u].points),[5,3,3]);
  assert.equal(rows.b.reason,overrides.b.reason);
  const rejected=calculateRanking({list:fixture,limit:25,target:5,guesses,members:["a","b","c"],overrides:{b:{position:0,reason:"É inválido"}}});
  assert.equal(rejected.b.points,0);
});
test("empate integral: todos recebem pontuação de primeiro",()=>{
  const rows=calculateRanking({list:fixture,limit:25,target:5,guesses:{a:"Item 5",b:"Item 5",c:"Item 5"},members:["a","b","c"]});
  assert.deepEqual(["a","b","c"].map(u=>rows[u].place),[1,1,1]);
  assert.deepEqual(["a","b","c"].map(u=>rows[u].points),[5,5,5]);
});
