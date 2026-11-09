import test from "node:test";
import assert from "node:assert/strict";
import {initializeApp,deleteApp} from "firebase/app";
import {initializeAuth,connectAuthEmulator,signInAnonymously,inMemoryPersistence,signOut} from "firebase/auth";
import {getDatabase,connectDatabaseEmulator,goOffline,ref,get,set,update,runTransaction,onValue,onDisconnect,serverTimestamp} from "firebase/database";
import {makeRoomGateway} from "../rooms-v2.js";

// Um erro de conexão nunca pode deixar o CI preso indefinidamente.
const watchdog=setTimeout(()=>{console.error("EMULATOR_TEST_WATCHDOG: execução excedeu 150 s");process.exit(1)},150000);
watchdog.unref();
console.log("EMULATOR_TEST_START");
const projectId="demo-riviera-showdown";
const base={apiKey:"demo-riviera-web",projectId,authDomain:projectId+".firebaseapp.com",databaseURL:"https://demo-riviera-showdown-default-rtdb.firebaseio.com",appId:"1:123456789:web:demo"};
const sdk={ref,get,set,update,runTransaction,onValue,onDisconnect,serverTimestamp};
const clients=[];
async function client(label,generateCode){
  const app=initializeApp(base,"test-"+label+"-"+clients.length);
  const auth=initializeAuth(app,{persistence:inMemoryPersistence});
  connectAuthEmulator(auth,"http://127.0.0.1:9099",{disableWarnings:true});
  const db=getDatabase(app);
  connectDatabaseEmulator(db,"127.0.0.1",9000);
  const user=await signInAnonymously(auth);
  const uid=user.user.uid;
  const gateway=makeRoomGateway({db,uid,api:sdk, ...(generateCode?{generateCode}: {})});
  const result={app,auth,db,uid,gateway};
  clients.push(result);
  return result;
}
async function unauthenticated(){
  const app=initializeApp(base,"test-unauth-"+clients.length);
  const db=getDatabase(app);
  connectDatabaseEmulator(db,"127.0.0.1",9000);
  const result={app,db};
  clients.push(result);
  return result;
}
const rejected=async promise=>assert.rejects(promise,/permission|denied|PERMISSION|rejeitad/i);
test.after(async ()=>{
  console.log("EMULATOR_TEST_CLEANUP");
  for(const c of clients){try{if(c.db)goOffline(c.db)}catch{};try{if(c.auth)await signOut(c.auth)}catch{};await deleteApp(c.app).catch(()=>{})}
  console.log("EMULATOR_TEST_CLEANUP_DONE");
});

test('isolamento, 2 usuários, permissões, palpites privados e reconexão',async function testMain(){
  console.log("TEST_MAIN_START");
  const h=await client("host",()=> "RVAB23");
  const g=await client("guest");
  const out=await client("outsider");
  const unauth=await unauthenticated();
  console.log("MAIN_CLIENTS_READY");
  const created=await h.gateway.createRoom({mode:"letters",nick:"Anfitrião"});
  console.log("MAIN_ROOM_CREATED");
  assert.equal(created.code,"RVAB23");
  const url="roomRegistry/RVAB23";
  await rejected(get(ref(unauth.db,url)));
  await rejected(get(ref(out.db,"roomPublic/RVAB23")));
  await rejected(get(ref(g.db,"roomPublic/RVAB23")));
  const invite=await get(ref(g.db,url));
  assert.equal(invite.val().phase,"open");
  assert.equal(JSON.stringify(invite.val()).includes("Anfitrião"),false,"convite não revela apelidos");
  const first=await g.gateway.joinRoom({code:"RVAB23",nick:"Convidado"});
  console.log("MAIN_GUEST_JOINED");
  assert.equal(first.alreadyMember,false);
  const rejoined=await g.gateway.joinRoom({code:"RVAB23",nick:"Convidado"});
  assert.equal(rejoined.alreadyMember,true);
  const snap=await get(ref(h.db,"roomMembers/RVAB23"));
  assert.equal(Object.keys(snap.val()).length,2,"reentrada mesma identidade não duplica vaga");
  const board=await get(ref(g.db,"roomPublic/RVAB23"));
  assert.equal(board.val().profiles[g.uid].nick,"Convidado");
  assert.equal(await g.gateway.resumeRoom("RVAB23"),true);
  await rejected(get(ref(unauth.db,"roomPublic/RVAB23")));
  await rejected(get(ref(out.db,"roomPrivateGuesses/RVAB23/r1/"+g.uid)));
  await rejected(set(ref(g.db,"roomPublic/RVAB23/host"),g.uid));
  await rejected(set(ref(g.db,"roomPublic/RVAB23/scores/"+g.uid),500));
  await rejected(set(ref(g.db,"roomPublic/RVAB23/profiles/"+h.uid+"/nick"),"Ataque"));
  await rejected(set(ref(g.db,"roomPublic/RVAB23/profiles/"+g.uid+"/nick"),42));
  await rejected(set(ref(g.db,"roomMembers/RVAB23/another-id"),{slot:10,joined:Date.now()}));
  await rejected(set(ref(g.db,"roomSeats/RVAB23/10"),"another-id"));
  await rejected(set(ref(g.db,"roomRegistry/RVAB23/host"),g.uid));
  await rejected(set(ref(g.db,"roomMembers/RVAB23/"+g.uid),null));
  await rejected(get(ref(g.db,"roomPrivateGuesses/RVAB23")));
  await update(ref(h.db,"roomPublic/RVAB23"),{phase:"playing",number:1,round:{id:"r1",type:"rank",revealed:false}});
  await set(ref(g.db,"roomPrivateGuesses/RVAB23/r1/"+g.uid),"Meu palpite");
  assert.equal((await get(ref(g.db,"roomPrivateGuesses/RVAB23/r1/"+g.uid))).val(),"Meu palpite");
  await rejected(get(ref(h.db,"roomPrivateGuesses/RVAB23/r1/"+g.uid)));
  await rejected(set(ref(out.db,"roomPrivateGuesses/RVAB23/r1/"+out.uid),"Espiando"));
  await rejected(set(ref(g.db,"roomPrivateGuesses/RVAB23/r1/"+h.uid),"Forjado"));
  await rejected(set(ref(g.db,"roomPrivateGuesses/RVAB23/r1/"+g.uid),123));
  await update(ref(h.db,"roomPublic/RVAB23/round"),{revealed:true});
  assert.equal((await get(ref(h.db,"roomPrivateGuesses/RVAB23/r1/"+g.uid))).val(),"Meu palpite");
  await rejected(set(ref(g.db,"roomPrivateGuesses/RVAB23/r1/"+g.uid),"Depois"));
  await set(ref(h.db,"roomPublic/RVAB23/scores/"+g.uid),5);
  assert.equal(await g.gateway.resumeRoom("RVAB23"),true);
  assert.equal((await get(ref(g.db,"roomPublic/RVAB23/scores/"+g.uid))).val(),5);
  await rejected(set(ref(out.db,"roomPublic/RVAB23/round/revealed"),true));
  await rejected(get(ref(g.db,"roomPublic")));
  await h.gateway.closeRoom("RVAB23");
  console.log("MAIN_AUTHORIZATION_PASSED");
  await assert.rejects(out.gateway.joinRoom({code:"RVAB23",nick:"Intruso"}),/encerrada/);
  assert.equal((await get(ref(g.db,"roomRegistry/RVAB23/phase"))).val(),"closed");
});
test('colisão de código preserva a sala original',async function testCollision(){
  console.log("TEST_COLLISION_START");
  const first=await client("creator1",()=> "RVCD34");
  const second=await client("creator2",()=> "RVCD34");
  await first.gateway.createRoom({mode:"mixed",nick:"Criador A"});
  await assert.rejects(second.gateway.createRoom({mode:"rank",nick:"Criador B"}),/código livre/);
  assert.equal((await get(ref(first.db,"roomRegistry/RVCD34/host"))).val(),first.uid);
  assert.equal((await get(ref(first.db,"roomPublic/RVCD34/mode"))).val(),"mixed");
});
test('disputa pela vigésima vaga admite somente um',async function testRace(){
  console.log("TEST_RACE_START");
  const host=await client("racehost",()=> "RVEF56");
  const code="RVEF56";
  await host.gateway.createRoom({mode:"letters",nick:"Host"});
  for(let i=0;i<18;i++){ if(i%5===0)console.log("RACE_FILL_"+i);
    const c=await client("seed"+i);
    await c.gateway.joinRoom({code,nick:"P"+i});
  }
  const before=await get(ref(host.db,"roomMembers/"+code));
  assert.equal(Object.keys(before.val()).length,19);
  const a=await client("race-a"),b=await client("race-b");
  const results=await Promise.allSettled([
    a.gateway.joinRoom({code,nick:"Última A"}),
    b.gateway.joinRoom({code,nick:"Última B"})
  ]);
  const successes=results.filter(r=>r.status==="fulfilled").length;
  assert.equal(successes,1,"apenas um reivindica a última vaga");
  const after=await get(ref(host.db,"roomMembers/"+code));
  assert.equal(Object.keys(after.val()).length,20);
  const admitted=[a.uid,b.uid].filter(x=>after.val()[x]!==undefined);
  assert.equal(admitted.length,1);
  const denied=results.find(r=>r.status==="rejected");
  assert.match(denied.reason.message,/cheia|recusada|possível entrar/i);
});

test('duas solicitações simultâneas do mesmo UID ocupam só um slot',async function testDuplicateTabs(){
  console.log("TEST_DUPLICATE_TABS_START");
  const host=await client("tabs-host",()=> "RVGH67");
  const player=await client("tabs-player");
  await host.gateway.createRoom({nick:"Host",mode:"letters"});
  const two=await Promise.allSettled([
    player.gateway.joinRoom({code:"RVGH67",nick:"Mesmo UID"}),
    player.gateway.joinRoom({code:"RVGH67",nick:"Mesmo UID"})
  ]);
  assert.equal(two.filter(r=>r.status==="fulfilled").length,2,"duas abas reutilizam a mesma admissão");
  const seats=(await get(ref(host.db,"roomSeats/RVGH67"))).val();
  assert.equal(Object.values(seats).filter(v=>v===player.uid).length,1,"o mesmo UID não consome duas vagas");
  const members=(await get(ref(host.db,"roomMembers/RVGH67"))).val();
  assert.equal(Object.keys(members).length,2);
});
