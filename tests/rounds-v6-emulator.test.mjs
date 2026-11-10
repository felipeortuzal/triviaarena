import test from "node:test";
import assert from "node:assert/strict";
import {initializeApp,deleteApp} from "firebase/app";
import {initializeAuth,connectAuthEmulator,signInAnonymously,inMemoryPersistence,signOut} from "firebase/auth";
import {getDatabase,connectDatabaseEmulator,goOffline,ref,get,set,onValue,runTransaction,onDisconnect,serverTimestamp} from "firebase/database";
import {makeRoomGateway} from "../rooms-v2.js";
import {createPartyGame} from "../party-game-v5.js";
const base={apiKey:"demo-riviera-web",projectId:"demo-riviera-showdown",authDomain:"demo-riviera-showdown.firebaseapp.com",databaseURL:"https://demo-riviera-showdown-default-rtdb.firebaseio.com",appId:"1:123456789:web:demo"};
const api={ref,get,set,onValue,runTransaction,onDisconnect,serverTimestamp};
const puzzles=[
 {id:"test-fact-01",code:"4 C no C H",answer:"4 Câmaras no Coração Humano",hints:["Anatomia","Dois átrios e dois ventrículos"],topic:"Biologia",level:"Médio",explain:"Quatro cavidades do coração."},
 {id:"test-fact-02",code:"12 M em um A",answer:"12 Meses em um Ano",hints:["Calendário","Janeiro a dezembro"],topic:"Tempo",level:"Fácil",explain:"Ano comum no calendário gregoriano."}
];
const ranking={id:"fixture-30",title:"Ranking sintético de teste",source:"Fonte de teste",url:"https://example.com/fixture",snapshot:"Edição de teste 2026",about:"Itens numerados em ordem crescente de posições para os testes e sem empates.",items:Array.from({length:30},(_,i)=>"Item "+(i+1)),aliases:{}};
const active=[];
async function client(name,code,lists=[ranking]){
 const app=initializeApp(base,"v6-"+name+"-"+active.length);
 const auth=initializeAuth(app,{persistence:inMemoryPersistence});
 connectAuthEmulator(auth,"http://127.0.0.1:9099",{disableWarnings:true});
 const db=getDatabase(app);connectDatabaseEmulator(db,"127.0.0.1",9000);
 const uid=(await signInAnonymously(auth)).user.uid;
 const gateway=makeRoomGateway({db,uid,api,...(code?{generateCode:()=>code}:{})});
 const game=createPartyGame({db,uid,api,getPuzzles:()=>puzzles,getRankings:()=>lists,randomIndex:n=>Math.min(n-1,1)});
 active.push({app,auth,db});
 return {uid,db,gateway,game};
}
test.after(async()=>{
 for(const c of active){try{goOffline(c.db)}catch{};try{await signOut(c.auth)}catch{};await deleteApp(c.app).catch(()=>{})}
});
test("partida completa de cinco rodadas termina sozinha, pontua frase exata e aproximada",async()=>{
 const host=await client("finite-host","RVFN56"),guest=await client("finite-guest");
 const code="RVFN56";
 await host.gateway.createRoom({nick:"Felipe",mode:"mixed",totalRounds:5});
 await guest.gateway.joinRoom({code,nick:"Amigo"});
 let state=await host.game.start(code);
 assert.equal(state.totalRounds,5);
 assert.equal(state.number,1);
 assert.equal(state.round.type,"letters");
 const correct=state.round.puzzleSnapshot.answer;
 await host.game.submitGuess(code,correct);
 const approx=correct.startsWith("4")?"4 camaras no coracao":"12 meses ano";
 await guest.game.submitGuess(code,approx);
 await assert.rejects(get(ref(guest.db,`roomPrivateGuesses/${code}/${state.round.id}/${host.uid}`)),/permission/i);
 state=await host.game.revealPhrase(code);
 assert.equal(state.round.resultReady,true);
 assert.equal(state.round.review[host.uid].points,2);
 assert.equal(state.round.review[guest.uid].points,1);
 await assert.rejects(guest.game.submitGuess(code,"4 câmaras"),/não aceita|permission/i);
 state=await host.game.correctPhrase(code,{player:guest.uid,points:2,reason:"Sinônimo aprovado pelo anfitrião"});
 assert.equal(state.round.review[guest.uid].points,2);
 const snap=state.round.puzzleSnapshot;
 assert.ok(snap.answer&&snap.id&&snap.code);
 state=await host.game.advance(code);
 assert.equal(state.number,2);
 assert.equal(state.round.type,"rank");
 assert.equal(state.scores[host.uid],2);
 assert.equal(state.scores[guest.uid],2);
 assert.equal(state.round.listSnapshot.id,ranking.id);
 await host.game.submitGuess(code,"Item 2");
 await guest.game.submitGuess(code,"Item 1");
 state=await host.game.revealRanking(code);
 assert.equal(state.round.review[host.uid].points,5);
 assert.equal(state.round.review[guest.uid].points,3);
 state=await host.game.advance(code);
 assert.equal(state.number,3);
 assert.equal(state.round.type,"letters");
 await host.game.revealPhrase(code);
 state=await host.game.advance(code,{winner:guest.uid});
 assert.equal(state.number,4);
 assert.equal(state.round.type,"rank");
 // Sem envio: ambos recebem zero, nunca pontos por chute inválido.
 await host.game.revealRanking(code);
 state=await host.game.advance(code);
 assert.equal(state.number,5);
 assert.equal(state.round.type,"letters");
 const answer=state.round.puzzleSnapshot.answer;
 await host.game.submitGuess(code,answer);
 await host.game.revealPhrase(code);
 const final=await Promise.all([host.game.advance(code),host.game.advance(code)]);
 state=(await get(ref(host.db,"roomPublic/"+code))).val();
 assert.equal(state.phase,"finished");
 assert.equal(state.number,5);
 assert.equal(Object.keys(state.roundHistory).length,5);
 assert.equal(state.scores[host.uid],9);
 assert.equal(state.scores[guest.uid],6);
 assert.ok(final.every(x=>x.phase==="finished"));
 assert.equal(state.round.scored,true);
 assert.deepEqual((await get(ref(guest.db,"roomPublic/"+code))).val().scores,state.scores);
});
test("importador de 10 itens valida fonte, isola autoria e mantém gabarito após troca de catálogo",async()=>{
 const host=await client("custom-host","RVCU56",[]);
 const guest=await client("custom-guest");
 const code="RVCU56";
 await host.gateway.createRoom({nick:"Host",mode:"rank",totalRounds:3});
 await guest.gateway.joinRoom({code,nick:"Convidado"});
 const fields={title:"Filmes favoritos do grupo",source:"Registro editorial do grupo",
   url:"https://example.org/ranking",snapshot:"2026-11-10",
   about:"Ordem declarada pela equipe com empate desfeito por ordem de votação.",
   rawItems:Array.from({length:10},(_,i)=>i===0?"1. 12 Angry Men":`${i+1}. Filme ${i+1}`).join("\n")};
 await assert.rejects(guest.game.addCustomRanking(code,fields),/Somente/);
 const list=await host.game.addCustomRanking(code,fields);
 assert.equal(list.origin,"host");
 assert.equal(list.items[0],"12 Angry Men");
 let state=await host.game.start(code);
 assert.equal(state.round.type,"rank");
 assert.equal(state.round.limit,10);
 assert.equal(state.round.listSnapshot.items[0],"12 Angry Men");
 assert.equal(state.round.listSnapshot.origin,"host");
 await assert.rejects(host.game.addCustomRanking(code,{...fields,title:"Outra lista do grupo"}),/antes de iniciar/);
 await host.game.submitGuess(code,"12 Angry Men");
 await host.game.revealRanking(code);
 state=await host.game.advance(code,{finish:true});
 assert.equal(state.phase,"finished");
 assert.equal(state.roundHistory["ranking-1"].listSnapshot?.items?.[0]||state.round.listSnapshot.items[0],"12 Angry Men");
});
