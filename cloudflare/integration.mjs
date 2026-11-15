import assert from "node:assert/strict";
const base=process.env.RIVIERA_URL||"http://127.0.0.1:8787";
async function call(path,method="GET",data,token){
 const resp=await fetch(base+path,{method,headers:{"content-type":"application/json",...(token?{authorization:"Bearer "+token}:{})},body:data?JSON.stringify(data):undefined});
 return {status:resp.status,data:await resp.json()};
}
const code=(await call("/api/status")).data;assert.equal(code.online,true);
const {status:createdStatus,data:host}=await call("/api/room","POST",{nick:"Player 1",mode:"rounds",target:1});
assert.equal(createdStatus,200);
assert.match(host.code,/^[A-HJ-NP-Z2-9]{6}$/);
const {status:joinStatus,data:guest}=await call("/api/room/"+host.code+"/join","POST",{nick:"Player 2"});
assert.equal(joinStatus,200);
assert.notEqual(host.token,guest.token);
const p="/api/room/"+host.code;
assert.equal((await call(p,"GET",null,"wrong-token")).status,403);
assert.equal((await call(p+"/start","POST",{},guest.token)).status,403);
assert.equal((await call(p+"/start","POST",{},host.token)).status,200);
const {data:start}=await call(p,"GET",null,host.token);
assert.equal(start.phase,"playing");
assert.equal(start.players.length,2);
assert.ok(start.deadline-start.serverNow>24000&&start.deadline-start.serverNow<=30000);
assert.ok(start.question.options.length===start.question.limit);
const options=start.question.options.map(x=>x.name);
const [answerA,answerB]=await Promise.all([
 call(p+"/guess","POST",{answer:options[0]},host.token),
 call(p+"/guess","POST",{answer:options[0]},guest.token)
]);
assert.equal([answerA.status,answerB.status].filter(x=>x===200).length,1,"Guess duplicate must have one winner");
assert.equal([answerA.status,answerB.status].filter(x=>x===409).length,1,"Duplicate must be rejected");
const {data:before}=await call(p,"GET",null,host.token);
assert.equal(before.phase,"playing");
assert.equal(JSON.stringify(before).includes('"answers"'),false,"Guesses not in private state snapshot");
const loserToken=answerA.status===409?host.token:guest.token;
assert.equal((await call(p+"/guess","POST",{answer:options[1]},loserToken)).status,200);
const {data:revealed}=await call(p,"GET",null,host.token);
assert.equal(revealed.phase,"finished");
assert.equal(revealed.lastResults.results.length,2);
assert.equal(revealed.players.reduce((s,x)=>s+x.points,0),3);
assert.equal((await call(p+"/restart","POST",{},guest.token)).status,403);
assert.equal((await call(p+"/restart","POST",{},host.token)).status,200);
const {data:again}=await call(p,"GET",null,guest.token);
assert.equal(again.phase,"playing");assert.equal(again.round,1);
console.log("INTEGRAÇÃO REAL CLOUDFLARE OK: dois clientes, token, lobby, simultaneidade, duplicados, reveal, pontos, revanche.");
