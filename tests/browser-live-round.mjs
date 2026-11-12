import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFileSync,existsSync} from "node:fs";
import {resolve,extname} from "node:path";
import {chromium} from "playwright-core";

const root=resolve(import.meta.dirname,"..");
const data=JSON.parse(readFileSync(resolve(root,"data.json")));
const browser=await chromium.launch({headless:true,executablePath:["/usr/bin/google-chrome","/usr/bin/chromium"].find(existsSync),args:["--no-sandbox"]});
const allowed=new Set(["index.html","app.js","firebase-config.js","logo.svg","data.json","rooms-v2.js","phrases-v3.js","party-game-v5.js","rank-tools-v5.js","phrase-tools.js"]);
const server=createServer((req,res)=>{
 const name=new URL(req.url,"http://localhost").pathname.replace(/^\/triviaarena\//,"")||"index.html";
 if(!allowed.has(name)){res.writeHead(404);res.end();return}
 res.setHeader("content-type",({".html":"text/html",".js":"text/javascript",".json":"application/json",".svg":"image/svg+xml"})[extname(name)]);
 res.end(readFileSync(resolve(root,name)));
});
await new Promise(r=>server.listen(0,"127.0.0.1",r));
const base="http://127.0.0.1:"+server.address().port+"/triviaarena/?emulator=1";
const errors=[];
try{
 const contexts=await Promise.all([browser.newContext({viewport:{width:1280,height:880}}),browser.newContext({viewport:{width:390,height:844}})]);
 const host=await contexts[0].newPage(),guest=await contexts[1].newPage();
 for(const p of [host,guest])p.on("pageerror",e=>errors.push(e.message));
 await host.goto(base);
 await host.locator("#connection").filter({hasText:"Online"}).waitFor({state:"attached",timeout:45000});
 await host.locator("#nick").fill("Host Ao Vivo");
 await host.locator('[data-action="create-live"]').click();
 await host.locator("#invite").waitFor();
 const invite=await host.locator("#invite").inputValue();
 await guest.goto(invite);
 await guest.locator("#connection").filter({hasText:"Online"}).waitFor({state:"attached",timeout:45000});
 await guest.locator("#nick").fill("Guest Ao Vivo");
 await guest.locator('[data-action="join"]').click();
 await guest.locator("#invite").waitFor();
 await host.locator('[data-action="start-game"]').click();
 for(const p of [host,guest]){
   await p.locator("#round-countdown").waitFor();
   assert.match(await p.locator("#round-countdown").innerText(),/^\d{2}s$/);
   assert.equal(await p.locator(".guess-wall").count(),0);
 }
 const category=await host.locator(".rank-category h2").innerText();
 assert.equal(category,await guest.locator(".rank-category h2").innerText());
 const target=parseInt(await host.locator(".rank-target strong").innerText());
 const list=data.rankings.find(v=>v.title===category);
 assert.ok(list,"categoria sorteada deve existir");
 const first=list.items[target-1],second=list.items[target===1?1:target-2];
 await host.locator("#guess").fill(first);
 await host.locator('[data-action="guess"]').click();
 await host.getByText("Seu palpite está registrado.",{exact:false}).waitFor();
 await guest.locator("#guess").fill(first);
 await guest.locator('[data-action="guess"]').click();
 await guest.getByText("Esse palpite já foi usado",{exact:false}).waitFor();
 assert.equal(await guest.locator(".guess-wall").count(),0,"palpites não podem aparecer em andamento");
 await guest.locator("#guess").fill(second);
 await guest.locator('[data-action="guess"]').click();
 await guest.getByText("Seu palpite está registrado.",{exact:false}).waitFor();
 await host.locator('[data-action="reveal"]').click();
 for(const p of [host,guest]){
  await p.locator(".guess-card").first().waitFor();
  assert.equal(await p.locator(".guess-card").count(),2);
  assert.match(await p.locator(".guess-wall").innerText(),/Host Ao Vivo|Guest Ao Vivo/);
 }
 await host.locator('[data-action="next"]').click();
 await guest.locator("#round-countdown").waitFor();
 assert.deepEqual(errors,[]);
 console.log("PASS live: two Chromes, same challenge, countdown, duplicate rejection, privacy, shared guess scoreboard");
 await Promise.all(contexts.map(c=>c.close()));
}finally{await browser.close();await new Promise(r=>server.close(r))}
