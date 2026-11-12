import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFileSync,existsSync} from "node:fs";
import {resolve,dirname,extname} from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright-core";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const executable=["/usr/bin/google-chrome","/usr/bin/chromium","/opt/google/chrome/chrome"].find(existsSync);
assert.ok(executable,"Chrome necessário");
const browser=await chromium.launch({headless:true,executablePath:executable,args:["--no-sandbox"]});
const failures=[];
let server;
async function online(page){
  await page.locator("#connection").filter({hasText:"Online"}).waitFor({state:"attached",timeout:30000});
}
async function newRoom(page,mode,nick){
  await page.goto(url,{waitUntil:"domcontentloaded"});
  await online(page);

  await page.locator("#nick").fill(nick);
  await page.locator('[data-action="create"]').click();
  await page.locator(".invite-code").waitFor({timeout:20000});
  return await page.locator("#invite").inputValue();
}
async function enter(page,invite,nick){
  await page.goto(invite,{waitUntil:"domcontentloaded"});
  await online(page);
  await page.locator("#nick").fill(nick);
  await page.locator('[data-action="join"]').click();
  await page.locator(".invite-code").waitFor({timeout:20000});
}
async function waitRank(page){
  await page.locator(".rank-target strong").waitFor({timeout:20000});
}
let url;
try{
 server=createServer((req,res)=>{
   const pathname=new URL(req.url,"http://127.0.0.1").pathname;
   if(!pathname.startsWith("/triviaarena/")){res.writeHead(404);res.end();return}
   const name=pathname.slice("/triviaarena/".length)||"index.html";
   if(!["index.html","app.js","rooms-v2.js","phrases-v3.js","party-game-v5.js","rank-tools-v5.js","phrase-tools.js","data.json","logo.svg","firebase-config.js"].includes(name)){res.writeHead(404);res.end();return}
   const full=resolve(root,name);
   const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml"};
   res.writeHead(200,{"content-type":mime[extname(full)]||"text/plain"});
   res.end(readFileSync(full));
 });
 await new Promise(r=>server.listen(0,"127.0.0.1",r));
 url="http://127.0.0.1:"+server.address().port+"/triviaarena/?emulator=1";
 const hostCtx=await browser.newContext({viewport:{width:1365,height:860}});
 const guestCtx=await browser.newContext({viewport:{width:390,height:844}});
 const host=await hostCtx.newPage(),guest=await guestCtx.newPage();
 for(const [name,page] of [["host",host],["guest",guest]])page.on("pageerror",e=>failures.push(name+": "+e.message));
 const invite=await newRoom(host,"rank","Felipe");
 await enter(guest,invite,"Amigo");
 await host.locator('[data-action="start-game"]').click();
 await waitRank(host);await waitRank(guest);
 const number=await host.locator(".rank-target strong").innerText();
 assert.equal(number,await guest.locator(".rank-target strong").innerText());
 await guest.locator("#guess").fill("Rússia");
 await host.locator("#guess").fill("Brasil");
 await host.locator('[data-action="guess"]').click();
 await guest.getByText("1/2 jogadores enviaram.",{exact:false}).waitFor({timeout:15000});
 assert.equal(await guest.locator("#guess").inputValue(),"Rússia","status alheio não apaga texto em edição");
 await guest.locator('[data-action="guess"]').click();
 await host.getByText("2/2 jogadores enviaram.",{exact:false}).waitFor({timeout:15000});
 assert.ok(!(await host.locator(".rank-category").innerText()).includes("Rússia"));
 await host.locator('[data-action="reveal"]').click();
 await host.getByText("Quem chegou mais perto?").waitFor({timeout:18000});
 await guest.getByText("Quem chegou mais perto?").waitFor({timeout:18000});
 await host.locator("#override-player").selectOption({label:"Amigo"});
 await host.locator("#override-pos").fill("5");
 await host.locator("#override-reason").fill("Tradução alternativa confirmada na fonte");
 await host.locator('[data-action="override"]').click();
 await guest.getByText("Tradução alternativa confirmada na fonte").waitFor({timeout:15000});
 await host.locator('[data-action="next"]').click();
 await host.getByText("RODADA 2",{exact:false}).first().waitFor({timeout:15000});
 await guest.getByText("RODADA 2",{exact:false}).first().waitFor({timeout:15000});
 await waitRank(host);await waitRank(guest);
 assert.ok(await host.locator('[data-action="reveal"]').isDisabled());
 await host.locator('[data-action="skip-guess"]').click();
 await guest.locator('[data-action="skip-guess"]').click();
 await host.getByText('2/2 jogadores enviaram.',{exact:false}).waitFor();
 await host.locator('[data-action="reveal"]').click();
 await host.getByText("Quem chegou mais perto?").waitFor({timeout:18000});
 await host.locator('[data-action="finish-game"]').click();
 await host.getByText("Fim de jogo!").waitFor({timeout:18000});
 await guest.getByText("Fim de jogo!").waitFor({timeout:18000});
 assert.equal(await host.locator(".podium").innerText(),await guest.locator(".podium").innerText());
 await host.locator('[data-action="leave-room"]').click();
 await guest.locator('[data-action="leave-room"]').click();
 const width=await guest.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
 assert.ok(width<=1,"overflow mobile: "+width);
 assert.deepEqual(failures,[],"erros JS do navegador: "+failures.join("; "));
 await Promise.all([hostCtx.close(),guestCtx.close()]);
 console.log("PASS V5: Ranking em 2 navegadores isolados, privados, correção e mobile");
}finally{
 if(server)await new Promise(resolve=>server.close(resolve));
 await browser.close();
}
