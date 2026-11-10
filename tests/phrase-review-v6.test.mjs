import test from "node:test";
import assert from "node:assert/strict";
import {gradePhrase,reviewPhrase} from "../phrase-review-v6.js";
const puzzle={answer:"4 Câmaras no Coração Humano",acceptedAnswers:["4 cavidades do coração humano"]};
test("exata +2, aproximada +1 e sem acentos",()=>{
 assert.deepEqual([gradePhrase("4 Câmaras no Coração Humano",puzzle).points,
   gradePhrase("4 camaras no coracao",puzzle).points,
   gradePhrase("4 cavidades do coração humano",puzzle).points],[2,1,1]);
});
test("número errado, substantivo errado, frase incompleta e era histórica não pontuam automaticamente",()=>{
 assert.equal(gradePhrase("5 câmaras no coração humano",puzzle).points,0);
 assert.equal(gradePhrase("4 cavaleiros no coração humano",puzzle).points,0);
 assert.equal(gradePhrase("4 câmaras",puzzle).points,0);
 assert.equal(gradePhrase("7 Maravilhas do Mundo",{answer:"7 Maravilhas do Mundo Antigo"}).points,0);
 assert.equal(gradePhrase("",puzzle).points,0);
});
test("avaliador permite empate exato e aproximação em rodada de múltiplos usuários",()=>{
 const review=reviewPhrase({puzzle,guesses:{a:puzzle.answer,b:"4 camaras no coracao",c:"4 cavalos"},members:["a","b","c","d"]});
 assert.equal(review.a.points,2);
 assert.equal(review.b.points,1);
 assert.equal(review.c.points,0);
 assert.equal(review.d.points,0);
});
test("revisão com justificativa pode aprovar semanticamente, preservando escrita original",()=>{
 const revision=reviewPhrase({puzzle,guesses:{a:"4 corações humanos"},members:["a"],
   overrides:{a:{points:1,reason:"Equivalência confirmada pelo anfitrião"}}});
 assert.equal(revision.a.points,1);
 assert.equal(revision.a.status,"reviewed");
 assert.equal(revision.a.guess,"4 corações humanos");
 assert.match(revision.a.reason,/anfitrião/);
});
