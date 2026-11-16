import test from "node:test";
import assert from "node:assert/strict";
import {BANKS,PHRASES,evaluatePhrase,normalizeAnswer,chooseQuestion,finalizeRoom,matchAnswer,normalizeRoomConfig,getPlayerStats,calculateAwards} from "./worker.mjs";
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
 assert.deepEqual(c,{durationSeconds:20,categoryIds:["pokemon"],turbo:true,autoNext:false});
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

test("41 rankings com fontes, snapshot, perguntas válidas e IDs únicos",()=>{
 assert.equal(BANKS.length,41);
 assert.equal(new Set(BANKS.map(b=>b.id)).size,41);
 for(const b of BANKS){assert.ok(b.items.length>=6,b.id+" deve ter ao menos 6 posições");assert.ok(b.title);assert.ok(b.snapshot);assert.ok(b.source);assert.equal(new Set(b.items).size,b.items.length,b.id+" contém respostas repetidas");}
 assert.ok(BANKS.some(b=>b.id==="epl-2025-26"));
 assert.ok(BANKS.some(b=>b.id==="f1-2025"));
 assert.ok(BANKS.some(b=>b.id==="movies-2010s"));
});
test("sorteio alterna categorias e não repete a mesma pergunta",()=>{
 const r=make();r.config={durationSeconds:30,categoryIds:BANKS.map(b=>b.id),turbo:false};
 let previous=null;const used=new Set();
 for(let i=0;i<100;i++){chooseQuestion(r);assert.notEqual(r.question.bi,previous,"não deve repetir categoria consecutiva");assert.equal(used.has(r.question.key),false,"não deve repetir pergunta");used.add(r.question.key);previous=r.question.bi;}
});
test("recortes regionais preservam a ordem do ranking mundial original",()=>{
 for(const id of ["area","population","gdp"]){
  const original=BANKS.find(b=>b.id===id);
  for(const region of ["americas","europa","africa","asia"]){
   const b=BANKS.find(b=>b.id===id+"-"+region);
   assert.ok(b&&b.items.length>=8);
   let prev=-1;
   for(const name of b.items){const pos=original.items.indexOf(name);assert.ok(pos>prev);prev=pos;}
  }
 }
});
test("rankings antigos funcionam após novas perguntas",()=>{
 const r=make();r.config={durationSeconds:20,categoryIds:["pokemon"],turbo:false};
 chooseQuestion(r);assert.equal(BANKS[r.question.bi].id,"pokemon");
});

test("Frases: 55 ditados únicos com respostas e alternativas",()=>{
 assert.equal(PHRASES.length,55);
 assert.equal(new Set(PHRASES.map(q=>q.id)).size,55);
 for(const q of PHRASES){assert.ok(q.lead&&q.answer);assert.ok(Array.isArray(q.alternatives));assert.ok(q.answer.length>=4)}
});
test("Frases: avaliação exata, sinônimos cadastrados e erros ortográficos",()=>{
 const q=PHRASES[0];
 assert.equal(evaluatePhrase("TANTO bate ATÉ que FURA!!!",q),100);
 assert.equal(evaluatePhrase("tanto bate que fura",q),100);
 assert.equal(evaluatePhrase("tanto bate ate que furra",q),90);
 assert.equal(evaluatePhrase("fura",q),0);
 assert.equal(evaluatePhrase("nunca bate ate que fura",q),0);
 assert.equal(evaluatePhrase("",q),0);
});
test("Frases: sorteio seguro e sem perguntas repetidas na partida",()=>{
 const r=make();r.gameType="phrases";r.config={durationSeconds:20,turbo:true,categoryIds:["pokemon"]};
 const seen=new Set();
 for(let n=1;n<=10;n++){chooseQuestion(r);assert.equal(r.question.type,"phrase");assert.ok(!seen.has(r.question.key));seen.add(r.question.key);assert.equal(r.round,n);assert.equal(r.special,n%3===0)}
});
test("Frases: pontuação por qualidade e desempate por envio no backend",()=>{
 const r=make("rounds",1);r.gameType="phrases";r.config={durationSeconds:20,turbo:false,categoryIds:["area"]};
 chooseQuestion(r);
 const q=PHRASES[r.question.index];
 r.answers={a:{answer:q.answer,rank:null,quality:100,at:100},b:{answer:"resposta sem relação",rank:null,quality:0,at:99}};
 assert.equal(finalizeRoom(r,Date.now()),true);
 assert.equal(r.phase,"finished");assert.equal(r.lastResults.type,"phrase");
 assert.equal(r.lastResults.target,q.answer);assert.equal(r.lastResults.prefix,q.lead);
 assert.equal(r.lastResults.results.find(x=>x.pid==="a").earned,2);
 assert.equal(r.lastResults.results.find(x=>x.pid==="b").earned,0);
 assert.equal(r.players.a.matchStats.exact,1);
 const tie=make("rounds",1);tie.gameType="phrases";tie.config=r.config;chooseQuestion(tie);
 tie.answers={a:{answer:"variante 1",quality:90,rank:null,at:100},b:{answer:"variante 2",quality:90,rank:null,at:200}};
 finalizeRoom(tie,Date.now());assert.equal(tie.players.a.points,2);assert.equal(tie.players.b.points,1);
});

test("2.5: modo festa é opt-in e não altera configurações antigas",()=>{
 const legacy=normalizeRoomConfig({durationSeconds:30,categoryIds:["pokemon"],turbo:false});
 assert.equal(legacy.autoNext,false);
 const party=normalizeRoomConfig({durationSeconds:20,categoryIds:["pokemon"],autoNext:true,turbo:false});
 assert.equal(party.autoNext,true);
});
test("2.5: próxima rodada automática agenda revelação e não antecipa gabarito",()=>{
 const r=make("rounds",2);r.config=normalizeRoomConfig({autoNext:true,durationSeconds:20,categoryIds:["pokemon"]});
 chooseQuestion(r);assert.equal(r.nextAt,null);
 const started=Date.now();r.answers={a:{answer:"um",rank:1,at:started},b:{answer:"dois",rank:2,at:started+1}};
 assert.equal(finalizeRoom(r,started),true);
 assert.equal(r.phase,"reveal");
 assert.ok(r.nextAt>=started+8900&&r.nextAt<=started+9100);
 assert.equal(r.round,1);assert.equal(r.history.length,1);
 chooseQuestion(r);
 assert.equal(r.round,2);assert.equal(r.phase,"playing");assert.equal(r.nextAt,null);
 r.answers={a:{answer:"um",rank:1,at:started},b:{answer:"dois",rank:2,at:started+1}};
 finalizeRoom(r,Date.now());
 assert.equal(r.phase,"finished");assert.equal(r.nextAt,null);
});
test("2.5: formato manual continua com revelação sem timer automático",()=>{
 const r=make("rounds",3);r.config=normalizeRoomConfig({autoNext:false,categoryIds:["pokemon"]});chooseQuestion(r);
 r.answers={a:{answer:"um",rank:1,at:1},b:{answer:"dois",rank:2,at:2}};
 assert.equal(finalizeRoom(r,Date.now()),true);
 assert.equal(r.phase,"reveal");assert.equal(r.nextAt,null);
});
