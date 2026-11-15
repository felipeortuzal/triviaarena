import test from "node:test";
import assert from "node:assert/strict";
import {normalizeAnswer,chooseQuestion,finalizeRoom,matchAnswer} from "./worker.mjs";
const make=(mode="rounds",target=5)=>({players:{a:{nick:"A",points:0},b:{nick:"B",points:0}},answers:{},mode,target,round:0,used:[],phase:"lobby"});
test("normaliza acentos, espaços e maiúsculas",()=>assert.equal(normalizeAnswer(" SÃO  PAULO! "),"sao paulo"));
test("perguntas não se repetem",()=>{const r=make();const keys=new Set();for(let i=0;i<20;i++){chooseQuestion(r);assert.ok(!keys.has(r.question.key));keys.add(r.question.key)}});
test("em andamento não revela antes do prazo",()=>{const r=make();chooseQuestion(r);r.deadline=Date.now()+60000;assert.equal(finalizeRoom(r,Date.now()),false);assert.equal(r.phase,"playing")});
test("no modo rodadas, primeiro recebe 2 e segundo 1",()=>{const r=make();chooseQuestion(r);r.question.position=10;r.answers={a:{answer:"exato",rank:10,at:100},b:{answer:"perto",rank:11,at:200}};assert.equal(finalizeRoom(r,Date.now()),true);assert.equal(r.players.a.points,2);assert.equal(r.players.b.points,1);assert.equal(r.phase,"reveal")});
test("desempate favorece a primeira resposta recebida",()=>{const r=make();chooseQuestion(r);r.question.position=10;r.answers={a:{answer:"um",rank:9,at:200},b:{answer:"outro",rank:11,at:100}};finalizeRoom(r,Date.now());assert.equal(r.players.b.points,2);assert.equal(r.players.a.points,1)});
test("corrida concede só 1 ponto ao primeiro e termina na meta",()=>{const r=make("race",1);chooseQuestion(r);r.question.position=10;r.answers={a:{answer:"exato",rank:10,at:100},b:{answer:"perto",rank:11,at:200}};finalizeRoom(r,Date.now());assert.equal(r.players.a.points,1);assert.equal(r.players.b.points,0);assert.equal(r.phase,"finished")});
test("passar e ausência de palpite valem zero",()=>{const r=make();chooseQuestion(r);r.deadline=1;r.answers={a:{answer:"Passou",rank:null,at:10}};finalizeRoom(r,Date.now());assert.equal(r.players.a.points,0);assert.equal(r.players.b.points,0);assert.equal(r.phase,"reveal")});

test("oito listas com tamanho e alvo válidos",()=>{const r=make();const seen=new Set();for(let i=0;i<70;i++){chooseQuestion(r);assert.ok(r.question.position<=r.question.limit);assert.ok(!seen.has(r.question.key));seen.add(r.question.key)}});
test("aceita sinônimos de países e estados",()=>{assert.equal(matchAnswer("EUA",["Brasil","Estados Unidos"]),1);assert.equal(matchAnswer("SP",["Minas Gerais","São Paulo"]),1)});
test("aceita erros pequenos, mas não aceita resposta aleatória",()=>{assert.equal(matchAnswer("Hidrogenio",["Hidrogênio","Hélio"]),0);assert.equal(matchAnswer("Hidrognio",["Hidrogênio","Hélio"]),0);assert.equal(matchAnswer("zxxx",(Array(26).fill(0).map((_,i)=>String(i+1)))),-1)});
test("distingue Nidoran fêmea de Nidoran macho",()=>{assert.notEqual(normalizeAnswer("Nidoran♀"),normalizeAnswer("Nidoran♂"))});
