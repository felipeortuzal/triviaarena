import test from "node:test";
import assert from "node:assert/strict";
import {normalizeAnswer,chooseQuestion,finalizeRoom,matchAnswer,normalizeRoomConfig,getPlayerStats,calculateAwards} from "./worker.mjs";
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

test("configuração personalizada restringe duração e rankings",()=>{
 const c=normalizeRoomConfig({durationSeconds:20,categoryIds:["pokemon","pokemon"],turbo:true});
 assert.deepEqual(c,{durationSeconds:20,categoryIds:["pokemon"],turbo:true});
 assert.equal(normalizeRoomConfig({durationSeconds:200}).durationSeconds,30);
 assert.throws(()=>normalizeRoomConfig({categoryIds:[]}),/categoria/);
});
test("sorteio respeita categoria exclusiva e duração 45s",()=>{
 const r=make();r.config={durationSeconds:45,categoryIds:["pokemon"],turbo:false};const before=Date.now();chooseQuestion(r);
 assert.equal(r.question.bi,6);
 assert.ok(r.deadline-before>=44990&&r.deadline-before<=45050);
 assert.equal(r.special,false);
});
test("a terceira rodada Turbo multiplica pontos sem alterar regras básicas",()=>{
 const r=make("rounds",3);r.config={durationSeconds:20,categoryIds:["elementos"],turbo:true};
 for(let n=1;n<=3;n++){
   chooseQuestion(r);assert.equal(r.special,n===3);r.question.position=5;
   r.answers={a:{answer:"Carbono",rank:5,at:Date.now()},b:{answer:"Oxigênio",rank:6,at:Date.now()+1}};
   assert.equal(finalizeRoom(r,Date.now()),true);
   assert.equal(r.lastResults.special,n===3);
 }
 assert.equal(r.phase,"finished");assert.equal(r.players.a.points,8);assert.equal(r.players.b.points,4);
 assert.equal(r.matchesPlayed,1);assert.equal(r.history.length,3);
 assert.equal(r.players.a.stats.wins,1);assert.equal(r.players.b.stats.wins,0);
 assert.equal(r.players.a.stats.exact,3);
 assert.equal(getPlayerStats(r.players.a).career.averageDistance,0);
 assert.equal(r.awards.some(x=>x.title==="Sniper"),true);
 assert.equal(r.awards.some(x=>x.title==="Rei do Turbo"),true);
});
test("desafio especial desligado não ativa em rodadas seguintes",()=>{
 const r=make("race",5);r.config={durationSeconds:30,categoryIds:["br-area"],turbo:false};
 for(let i=0;i<5;i++){chooseQuestion(r);assert.equal(r.special,false)}
});
test("premiações empatadas aceitam múltiplos jogadores",()=>{
 const r=make();r.players.a.matchStats={played:1,exact:1,valid:1,distanceSum:0,fastestExactMs:100,turboWins:0};
 r.players.b.matchStats={played:1,exact:1,valid:1,distanceSum:0,fastestExactMs:200,turboWins:0};
 const a=calculateAwards(r);assert.deepEqual(a.find(x=>x.title==="Sniper").nicks,["A","B"]);
});
