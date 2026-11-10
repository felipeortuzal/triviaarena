import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
const root=resolve(import.meta.dirname,'..');
const data=JSON.parse(readFileSync(resolve(root,'data.json')));
const browser=await chromium.launch({headless:true,executablePath:['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync),args:['--no-sandbox']});
const errors=[];
const allowed=['index.html','app.js','firebase-config.js','logo.svg','data.json','rooms-v2.js','phrases-v3.js','party-game-v5.js','rank-tools-v5.js','phrase-tools.js'];
const server=createServer((req,res)=>{
 const name=new URL(req.url,'http://localhost').pathname.replace(/^\/triviaarena\//,'')||'index.html';
 if(!allowed.includes(name)){res.writeHead(404);res.end();return}
 res.setHeader('content-type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml'})[extname(name)]);
 res.end(readFileSync(resolve(root,name)));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.RIVIERA_PUBLIC_URL||`http://127.0.0.1:${server.address().port}/triviaarena/?emulator=1`;
async function ready(page){await page.locator('#connection').filter({hasText:'Online'}).waitFor({timeout:45000})}
async function submitCorrect(page){
 const phrase=await page.locator('.largecode').count();
 let text;
 if(phrase){const code=await page.locator('.largecode').innerText();text=data.puzzles.find(p=>p.code===code).answer;}
 else{const title=await page.locator('.rank-category h2').innerText(),target=parseInt(await page.locator('.rank-target strong').innerText());text=data.rankings.find(x=>x.title===title).items[target-1];}
 await page.locator('#guess').fill(text);
 await page.locator('[data-action="guess"]').click();
}
async function reveal(host,guest){
 await host.locator('[data-action="reveal"]').click();
 for(const p of [host,guest])await p.getByText('Resultado da rodada',{exact:true}).or(p.getByText('Quem chegou mais perto?',{exact:true})).waitFor();
 await host.locator('[data-action="next"]').waitFor();
}
try{
 mkdirSync(resolve(root,'test-results'),{recursive:true});
 for(const mode of ['letters','rank','mixed']){
  const hc=await browser.newContext({viewport:{width:1365,height:900}}),gc=await browser.newContext({viewport:{width:390,height:844}});
  const host=await hc.newPage(),guest=await gc.newPage();
  for(const p of [host,guest])p.on('pageerror',e=>errors.push(e.message));
  await host.goto(base);await ready(host);
  await host.locator(`[data-action="choose-${mode}"]`).click();await host.locator('#nick').fill('Felipe');
  await host.locator('[data-action="create"]').click();await host.locator('#invite').waitFor();
  const invite=await host.locator('#invite').inputValue();
  await guest.goto(invite);await ready(guest);await guest.locator('#nick').fill('Amigo');await guest.locator('[data-action="join"]').click();await guest.locator('#invite').waitFor();
  assert.equal(await guest.locator('[data-action="start-game"]').count(),0);
  await host.locator('[data-action="start-game"]').click();
  for(let round=1;round<=5;round++){
   for(const p of [host,guest])await p.getByText(`RODADA ${round} DE 5`,{exact:false}).first().waitFor();
   if(round===2){await guest.reload();await guest.getByText('RODADA 2 DE 5',{exact:false}).first().waitFor();}
   await submitCorrect(host);await submitCorrect(guest);
   await host.getByText('2/2 jogadores enviaram.',{exact:false}).waitFor();
   if(round===2){await host.reload();await host.getByText('2/2 jogadores enviaram.',{exact:false}).waitFor();}
   await reveal(host,guest);
   assert.ok(await host.locator('[data-action="next"]').isVisible());
   assert.equal(await guest.locator('[data-action="next"]').count(),0);
   await host.locator('[data-action="next"]').dblclick();
  }
  for(const p of [host,guest])await p.getByText('Resumo das 5 rodadas').waitFor();
  assert.equal(await host.locator('.podium').innerText(),await guest.locator('.podium').innerText());
  const expected=mode==='letters'?5:mode==='rank'?25:13;
  assert.ok((await host.locator('.podium').innerText()).includes(`${expected} pontos`));
  assert.equal(await host.locator('.history-row').count(),5);
  assert.ok(await guest.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1);
  await guest.screenshot({path:resolve(root,`test-results/${mode}-mobile.png`),fullPage:true});
  await host.locator('[data-action="rematch"]').click();
  for(const p of [host,guest])await p.getByText('Sua sala está pronta.').waitFor();
  assert.match(await guest.locator('.roster').innerText(),/0 ponto/);
  await host.locator('[data-action="start-game"]').click();
  await guest.getByText('0/2 jogadores enviaram.',{exact:false}).waitFor();
  await reveal(host,guest);
  await host.locator('[data-action="finish-game"]').click();
  await guest.getByText('Fim de jogo!').waitFor();
  await host.locator('[data-action="close-room"]').click();
  await host.locator('[data-action="rematch"][disabled]').waitFor();
  await hc.close();await gc.close();
  console.log(`PASS ${mode}: 5 rodadas, 2 sessões, resposta privada, refresh, pontos ${expected}, clique duplo, pódio e revanche`);
 }
 // Exact delivered artifact: all three modes offline, five rounds and rematch.
 const ctx=await browser.newContext({viewport:{width:375,height:812}});await ctx.setOffline(true);
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
 for(const mode of ['letters','rank','mixed']){
  if(process.env.RIVIERA_INLINE_OFFLINE==='1'){
   const offlineUrl=`http://127.0.0.1:${server.address().port}/triviaarena/offline.html`;
   await page.route(offlineUrl,route=>route.fulfill({contentType:'text/html',body:readFileSync(resolve(root,'riviera-showdown.html'),'utf8')}));
   await page.goto(offlineUrl);
  }else await page.goto(pathToFileURL(resolve(root,'riviera-showdown.html')).href);
  await page.locator(`[data-action="choose-${mode}"]`).click();await page.locator('[data-action="demo"]').click();
  for(let round=1;round<=5;round++){
   await submitCorrect(page);await page.locator('[data-action="reveal"]').click();await page.locator('[data-action="next"]').click();
  }
  await page.getByText('Resumo das 5 rodadas').waitFor();await page.locator('[data-action="rematch"]').click();await page.getByText('Sua sala está pronta.').waitFor();
  console.log(`PASS HTML ${process.env.RIVIERA_INLINE_OFFLINE==='1'?'interceptado':'file://'} offline ${mode}: cinco rodadas e revanche`);
 }
 await ctx.close();assert.deepEqual(errors,[],'erros fatais de JavaScript');
}finally{await browser.close();await new Promise(r=>server.close(r))}
