import test from "node:test";
import assert from "node:assert/strict";
import {initializeApp,deleteApp} from "firebase/app";
import {initializeAuth,connectAuthEmulator,signInAnonymously,inMemoryPersistence,signOut} from "firebase/auth";
import {getDatabase,connectDatabaseEmulator,goOffline,goOnline,ref,get,set,onValue,runTransaction,update,onDisconnect,serverTimestamp} from "firebase/database";
import {makeRoomGateway} from "../rooms-v2.js";
import {makePhraseGame} from "../phrases-v3.js";

const base={apiKey:"demo-riviera-web",projectId:"demo-riviera-showdown",authDomain:"demo-riviera-showdown.firebaseapp.com",databaseURL:"https://demo-riviera-showdown-default-rtdb.firebaseio.com",appId:"1:123456789:web:demo"};
const api={ref,get,set,onValue,runTransaction,update,onDisconnect,serverTimestamp};
const active=[];
async function eventually(read,predicate,message){
 for(let attempt=0;attempt<60;attempt++){
   const snap=await read();
   if(predicate(snap))return snap;
   await new Promise(r=>setTimeout(r,50));
 }
 throw Error(message||"Os clientes não sincronizaram a tempo.");
}
const puzzles=[
  {code:"4 E do A",answer:"4 Estações do Ano",level:"Fácil",topic:"Ciência",hints:["Clima e tempo","Primavera, verão, outono e inverno"]},
  {code:"7 M do M",answer:"7 Maravilhas do Mundo",level:"Médio",topic:"História",hints:["Monumentos","Lista famosa"]},
  {code:"12 M do A",answer:"12 Meses do Ano",level:"Fácil",topic:"Geral",hints:["Calendário","De janeiro a dezembro"]},
  {code:"5 C do B",answer:"5 Continentes do Brasil",level:"Geral",topic:"Teste",hints:["Geografia","Revisão"]},
];
async function makeClient(name,codeFn){
  const app=initializeApp(base,"phrases-"+name+"-"+active.length);
  const auth=initializeAuth(app,{persistence:inMemoryPersistence});
  connectAuthEmulator(auth,"http://127.0.0.1:9099",{disableWarnings:true});
  const db=getDatabase(app);connectDatabaseEmulator(db,"127.0.0.1",9000);
  const user=await signInAnonymously(auth);
  const uid=user.user.uid;
  const gateway=makeRoomGateway({db,uid,api,...(codeFn?{generateCode:codeFn}:{})});
  const game=makePhraseGame({db,uid,api,getPuzzles:()=>puzzles,randomIndex:()=>0});
  active.push({app,auth,db});
  return {app,auth,db,uid,gateway,game};
}
test.after(async()=>{
  for(const x of active){try{goOffline(x.db)}catch{};try{await signOut(x.auth)}catch{};try{await deleteApp(x.app)}catch{}}
});
test("3 rodadas compartilhadas, dicas, convite, reconexão e pontos uma vez",async()=>{
  const host=await makeClient("host",()=> "RVJH82");
  const guest=await makeClient("guest");
  const stranger=await makeClient("stranger");
  await host.gateway.createRoom({nick:"Felipe",mode:"letters"});
  const opened=await guest.gateway.joinRoom({code:"RVJH82",nick:"Amigo"});
  assert.equal(opened.alreadyMember,false);
  assert.equal((await get(ref(host.db,"roomRegistry/RVJH82/phase"))).val(),"open");
  let guestUpdates=0,hostUpdates=0;
  const stopGuest=onValue(ref(guest.db,"roomPublic/RVJH82"),()=>guestUpdates++);
  const stopHost=onValue(ref(host.db,"roomPublic/RVJH82"),()=>hostUpdates++);
  const state=await host.game.start("RVJH82");
  assert.equal(state.round.id,"frase-1");
  assert.equal(state.round.hints,0);
  await eventually(()=>get(ref(guest.db,"roomPublic/RVJH82/round/id")),s=>s.val()==="frase-1","convidado não recebeu início de partida");
  assert.equal((await get(ref(host.db,"roomRegistry/RVJH82/phase"))).val(),"locked");
  await assert.rejects(stranger.gateway.joinRoom({code:"RVJH82",nick:"Late"}),/começou/);
  await assert.rejects(guest.game.start("RVJH82"),/Somente/);
  assert.equal(await guest.game.hint("RVJH82"),false);
  await assert.rejects(set(ref(guest.db,"roomPublic/RVJH82/round/revealed"),true),/permission/i);
  assert.equal(await host.game.reveal("RVJH82"),true);
  const advance=await Promise.all([
    host.game.transition("RVJH82",{winner:guest.uid}),
    host.game.transition("RVJH82",{winner:guest.uid})
  ]);
  const afterFirst=await eventually(()=>get(ref(guest.db,"roomPublic/RVJH82")),s=>s.val()?.number===2,"convidado não recebeu a segunda rodada");
  assert.equal(afterFirst.val().number,2,"duas chamadas não pulam rodadas");
  assert.equal(afterFirst.val().scores[guest.uid],1);
  assert.equal(Object.keys(afterFirst.val().roundHistory).length,1);
  assert.equal(await host.game.hint("RVJH82"),true);
  await eventually(()=>get(ref(guest.db,"roomPublic/RVJH82/round/hints")),v=>v.val()===1,"dica não sincronizou com convidado");
  // Mesmo UID retorna, mantendo a mesma vaga e a pontuação; host pode recarregar.
  assert.equal(await guest.gateway.resumeRoom("RVJH82"),true);
  assert.equal((await guest.gateway.joinRoom({code:"RVJH82",nick:"Amigo"})).alreadyMember,true);
  const reloadedHost=makePhraseGame({db:host.db,uid:host.uid,api,getPuzzles:()=>puzzles,randomIndex:()=>0});
  await reloadedHost.reveal("RVJH82");
  await reloadedHost.transition("RVJH82",{winner:""});
  const afterSecond=(await eventually(()=>get(ref(guest.db,"roomPublic/RVJH82")),s=>s.val()?.number===3,"convidado não recebeu a terceira rodada")).val();
  assert.equal(afterSecond.number,3);
  assert.equal(afterSecond.round.hints,0);
  assert.equal(afterSecond.scores[guest.uid],1,"rodada sem vencedor não pontua");
  await reloadedHost.hint("RVJH82");
  await reloadedHost.hint("RVJH82");
  assert.equal(await reloadedHost.hint("RVJH82"),false,"no máximo duas dicas");
  await reloadedHost.reveal("RVJH82");
  await Promise.all([
    reloadedHost.transition("RVJH82",{winner:guest.uid,finish:true}),
    reloadedHost.transition("RVJH82",{winner:guest.uid,finish:true})
  ]);
  const finalHost=(await get(ref(host.db,"roomPublic/RVJH82"))).val();
  const finalGuest=(await eventually(()=>get(ref(guest.db,"roomPublic/RVJH82")),s=>s.val()?.phase==="finished","convidado não recebeu resultado final")).val();
  assert.deepEqual(finalHost,finalGuest,"placar idêntico nos dois clientes");
  assert.equal(finalHost.phase,"finished");
  assert.equal(finalGuest.scores[guest.uid],2);
  assert.equal(Object.keys(finalGuest.roundHistory).length,3);
  assert.equal(finalGuest.roundHistory["frase-1"].hints,0);
  assert.equal(finalGuest.roundHistory["frase-2"].hints,1);
  assert.equal(finalGuest.roundHistory["frase-3"].hints,2);
  assert.notEqual(finalGuest.roundHistory["frase-1"].index,finalGuest.roundHistory["frase-2"].index);
  assert.notEqual(finalGuest.roundHistory["frase-2"].index,finalGuest.roundHistory["frase-3"].index);
  assert.equal(finalGuest.round.scored,true);
  assert.equal(await guest.game.reveal("RVJH82"),false);
  assert.ok(guestUpdates>0&&hostUpdates>0);
  stopGuest();stopHost();
});
test("link inexistente, convidado sem permissão e partida não vira Ranking",async()=>{
 const guest=await makeClient("invalid");
 await assert.rejects(guest.gateway.joinRoom({code:"BAD",nick:"ok"}),/seis caracteres/);
 await assert.rejects(guest.gateway.joinRoom({code:"RVKL23",nick:"ok"}),/não encontrada/);
 const host=await makeClient("rank-host",()=> "RVKM23");
 await host.gateway.createRoom({nick:"Host",mode:"rank"});
 await assert.rejects(host.game.start("RVKM23"),/não pôde|não foi|não/);
});

test("queda e retorno do anfitrião preservam sala e presença",async()=>{
 const host=await makeClient("presence-host",()=> "RVPA56");
 const guest=await makeClient("presence-guest");
 await host.gateway.createRoom({nick:"Host",mode:"letters"});
 await guest.gateway.joinRoom({code:"RVPA56",nick:"Visitante"});
 const stop=host.gateway.markPresence("RVPA56");
 const path="roomPresence/RVPA56/"+host.uid;
 await eventually(()=>get(ref(guest.db,path)),s=>s.val()?.connected===true,"presença não ficou online");
 goOffline(host.db);
 await eventually(()=>get(ref(guest.db,path)),s=>!s.exists(),"presença não foi retirada na desconexão");
 assert.equal(await guest.gateway.resumeRoom("RVPA56"),true);
 goOnline(host.db);
 await eventually(()=>get(ref(guest.db,path)),s=>s.val()?.connected===true,"presença não voltou após reconexão");
 stop();
});