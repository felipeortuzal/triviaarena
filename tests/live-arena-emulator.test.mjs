import test from "node:test";
import assert from "node:assert/strict";
import {initializeApp,deleteApp} from "firebase/app";
import {initializeAuth,connectAuthEmulator,signInAnonymously,inMemoryPersistence,signOut} from "firebase/auth";
import {getDatabase,connectDatabaseEmulator,goOffline,ref,get,set,runTransaction,onValue,onDisconnect,serverTimestamp} from "firebase/database";
import {createPartyGame} from "../party-game-v5.js";
import {makeRoomGateway} from "../rooms-v2.js";

const base={apiKey:"demo-riviera-web",projectId:"demo-riviera-showdown",authDomain:"demo-riviera-showdown.firebaseapp.com",databaseURL:"https://demo-riviera-showdown-default-rtdb.firebaseio.com",appId:"1:123456789:web:demo"};
const api={ref,get,set,runTransaction,onValue,onDisconnect,serverTimestamp};
const fixture={id:"live-fixture",title:"Ranking de teste",source:"Teste",snapshot:"2026",url:"https://example.org/live-ranking",items:Array.from({length:30},(_,i)=>"Item "+(i+1)),aliases:{"Item 5":["Quinto","Quínto"]}};
const clients=[];
async function open(name,code){
 const app=initializeApp(base,"live-"+name+"-"+clients.length),auth=initializeAuth(app,{persistence:inMemoryPersistence});
 connectAuthEmulator(auth,"http://127.0.0.1:9099",{disableWarnings:true});
 const db=getDatabase(app);connectDatabaseEmulator(db,"127.0.0.1",9000);
 const uid=(await signInAnonymously(auth)).user.uid;
 clients.push({app,auth,db});
 return {uid,db,gateway:makeRoomGateway({db,uid,api,...(code?{generateCode:()=>code}:{})}),game:createPartyGame({db,uid,api,getPuzzles:()=>[],getRankings:()=>[fixture],randomIndex:()=>4})};
}
test.after(async()=>{
 for(const c of clients){try{goOffline(c.db)}catch{};try{await signOut(c.auth)}catch{};await deleteApp(c.app).catch(()=>{});}
});
test("Arena ao vivo: 30s, unicidade por alias, privacidade e ausentes",async()=>{
 const code="RVLA3K";
 const host=await open("host",code),guest=await open("guest"),silent=await open("silent"),outsider=await open("outsider");
 await host.gateway.createRoom({nick:"Host",mode:"rank",live:true});
 await guest.gateway.joinRoom({code,nick:"Guest"});
 await silent.gateway.joinRoom({code,nick:"Sem resposta"});
 const begin=Date.now();
 let state=await host.game.start(code);
 assert.equal(state.live,true);
 assert.equal(state.round.type,"rank");
 assert.ok(state.round.deadlineAt-begin>22000&&state.round.deadlineAt-begin<36000);
 const id=state.round.id,secret=(who)=>"roomPrivateGuesses/"+code+"/"+id+"/"+who;
 await host.game.submitGuess(code,"Item 5");
 await assert.rejects(guest.game.submitGuess(code,"quínto"),/já foi usado|escolha outro/i);
 await assert.rejects(guest.game.submitGuess(code,"ITEM 5"),/já foi usado|escolha outro/i);
 await guest.game.submitGuess(code,"Item 4");
 await assert.rejects(guest.game.submitGuess(code,"Item 6"),/já confirmou/i);
 assert.equal((await get(ref(host.db,"roomGuessStatus/"+code+"/"+id))).val()[guest.uid],true);
 await assert.rejects(get(ref(guest.db,secret(host.uid))),/permission/i);
 await assert.rejects(get(ref(outsider.db,"roomGuessStatus/"+code+"/"+id)),/permission/i);
 await assert.rejects(host.game.revealRanking(code),/Espere todos/);
 await assert.rejects(set(ref(host.db,"roomPublic/"+code+"/round/revealed"),true),/permission/i);
 await new Promise(resolve=>setTimeout(resolve,Math.max(0,state.round.deadlineAt-Date.now()+1500)));
 await assert.rejects(set(ref(silent.db,secret(silent.uid)),"Item 6"),/permission/i);
 state=await host.game.revealRanking(code);
 assert.equal(state.round.resultReady,true);
 assert.equal(state.round.review[host.uid].guess,"Item 5");
 assert.equal(state.round.review[host.uid].points,5);
 assert.equal(state.round.review[guest.uid].points,3);
 assert.equal(state.round.review[silent.uid].points,0);
 state=await host.game.advance(code);
 assert.equal(state.number,2);
 assert.equal(state.round.revealed,false);
 assert.ok(state.round.deadlineAt>Date.now()+22000);
});
