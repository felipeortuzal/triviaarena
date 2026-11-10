import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFileSync,existsSync} from "node:fs";
import {resolve,dirname,extname} from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright-core";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const chrome=["/usr/bin/google-chrome","/usr/bin/chromium","/opt/google/chrome/chrome"].find(existsSync);
assert.ok(chrome,"Chrome indisponível para os testes");
const browser=await chromium.launch({headless:true,executablePath:chrome,args:["--no-sandbox"]});
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml"};
let server;
const errors=[];
async function syncRound(page,num){
  await page.waitForFunction(n=>!!document.querySelector(".round-panel")&&document.querySelector(".round-panel").textContent.includes("RODADA "+n),num,{timeout:20000});
}
async function hasPlayers(page,count){
  await page.waitForFunction(n=>document.querySelectorAll(".player").length>=n,count,{timeout:20000});
}
try{
  server=createServer((req,res)=>{
    const path=new URL(req.url,"http://127.0.0.1").pathname;
    if(!path.startsWith("/triviaarena/")){res.writeHead(404);res.end();return}
    const name=path.slice("/triviaarena/".length)||"index.html";
    const allow=["index.html","app.js","rooms-v2.js","phrases-v3.js","party-game-v5.js","rank-tools-v5.js","catalog-v6.js","catalog-v6.js","data.json","logo.svg","firebase-config.js"];
    if(!allow.includes(name)){res.writeHead(404);res.end();return}
    const file=resolve(root,name);
    res.writeHead(200,{"content-type":mime[extname(file)]||"text/plain"});
    res.end(readFileSync(file));
  });
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const base="http://127.0.0.1:"+server.address().port+"/triviaarena/?emulator=1";
  const [hostCtx,guestCtx,otherCtx]=await Promise.all([
    browser.newContext({viewport:{width:1280,height:860}}),
    browser.newContext({viewport:{width:390,height:844}}),
    browser.newContext({viewport:{width:375,height:812}})
  ]);
  const host=await hostCtx.newPage(),guest=await guestCtx.newPage(),other=await otherCtx.newPage();
  host.on("pageerror",e=>errors.push("host: "+e.message));
  guest.on("pageerror",e=>errors.push("guest: "+e.message));
  other.on("pageerror",e=>errors.push("stranger: "+e.message));
  await host.goto(base,{waitUntil:"domcontentloaded"});
  await host.locator("#connection").filter({hasText:"Online"}).waitFor({timeout:30000});
  await host.locator("#nick").fill("Felipe");
  await host.locator('[data-action="create"]').click();
  await host.locator(".invite-code").waitFor({timeout:20000});
  const invite=await host.locator("#invite").inputValue();
  assert.match(invite,/^http:\/\/127\.0\.0\.1:\d+\/triviaarena\/\?room=[A-HJ-NP-Z2-9]{6}&emulator=1$/);
  await guest.goto(invite,{waitUntil:"domcontentloaded"});
  await guest.locator("#connection").filter({hasText:"Online"}).waitFor({timeout:30000});
  await guest.locator("#nick").fill("Amigo");
  await guest.locator('[data-action="join"]').click();
  await guest.locator(".invite-code").waitFor({timeout:20000});
  await hasPlayers(host,2);await hasPlayers(guest,2);
  assert.match(await host.locator(".roster").innerText(),/Felipe/);
  assert.match(await host.locator(".roster").innerText(),/Amigo/);
  assert.equal(await guest.locator('[data-action="start-game"]').count(),0,"Convidado não pode iniciar");
  await host.locator('[data-action="start-game"]').click();
  await syncRound(host,1);await syncRound(guest,1);
  assert.equal(await host.locator(".largecode").innerText(),await guest.locator(".largecode").innerText());
  await host.locator('[data-action="reveal"]').click();
  await guest.getByText("RESPOSTA REVELADA").waitFor();
  const winner=await host.locator('#letter-winner option').evaluateAll(items=>items.find(e=>e.textContent.includes("Amigo"))?.value);
  assert.ok(winner,"nick do convidado não está selecionável");
  await host.locator("#letter-winner").selectOption(winner);
  await host.locator('[data-action="next"]').click();
  await syncRound(host,2);await syncRound(guest,2);
  await guest.reload({waitUntil:"domcontentloaded"});
  await syncRound(guest,2);
  await host.locator('[data-action="hint"]').click();
  await guest.getByText("Dica 1:",{exact:false}).first().waitFor();
  await host.locator('[data-action="reveal"]').click();
  await host.locator('[data-action="next"]').click();
  await syncRound(host,3);await syncRound(guest,3);
  await host.locator('[data-action="hint"]').click();
  await host.locator('[data-action="hint"]').click();
  await guest.getByText("Dica 2:",{exact:false}).first().waitFor();
  await host.locator('[data-action="reveal"]').click();
  await host.locator('[data-action="finish-game"]').click();
  await host.getByText("Fim de jogo!").waitFor();
  await guest.getByText("Fim de jogo!").waitFor();
  await host.getByText("Resumo das 3 rodadas").waitFor();
  assert.equal(await host.locator(".podium").innerText(),await guest.locator(".podium").innerText());
  const guestWidth=await guest.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(guestWidth<=1,"overflow mobile: "+guestWidth);
  await host.locator('[data-action="close-room"]').click();
  await other.goto(invite,{waitUntil:"domcontentloaded"});
  await other.locator("#connection").filter({hasText:"Online"}).waitFor({timeout:30000});
  await other.locator("#nick").fill("Intruso");
  await other.locator('[data-action="join"]').click();
  await other.locator('[role="alert"]').getByText("encerrada",{exact:false}).waitFor();
  assert.deepEqual(errors,[],"Exceções do navegador: "+errors.join("\n"));
  await Promise.all([hostCtx.close(),guestCtx.close(),otherCtx.close()]);
  console.log("PASS: dois browsers isolados, convite real, 3 rodadas, placar, refresh, segurança e celular 390px");
}finally{
  if(server)await new Promise(resolve=>server.close(resolve));
  await browser.close();
}
