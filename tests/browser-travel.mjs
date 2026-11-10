import assert from 'node:assert/strict';
import {readFileSync,existsSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
const root=resolve(import.meta.dirname,'..');
const html=readFileSync(resolve(root,'riviera-showdown.html'),'utf8');
const data=JSON.parse(readFileSync(resolve(root,'data.json'),'utf8'));
const base=process.env.RIVIERA_INLINE_OFFLINE==='1'?'http://127.0.0.1:8766/triviaarena/offline.html':pathToFileURL(resolve(root,'riviera-showdown.html')).href;
const browser=await chromium.launch({headless:true,executablePath:['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync),args:['--no-sandbox']});
const errors=[];
async function send(page,text){await page.locator('#guess').fill(text);await page.locator('#guess').press('Enter')}
async function correctAnswer(page){
 if(await page.locator('.largecode').count()){
  const code=await page.locator('.largecode').innerText();return data.puzzles.find(p=>p.code===code).answer;
 }
 const title=await page.locator('.rank-category h2').innerText(),position=parseInt(await page.locator('.rank-target strong').innerText());
 return data.rankings.find(d=>d.title===title).items[position-1];
}
try{
 mkdirSync(resolve(root,'test-results'),{recursive:true});
 for(const mode of ['letters','rank','mixed']){
  const ctx=await browser.newContext({viewport:{width:375,height:812}});await ctx.setOffline(true);
  if(process.env.RIVIERA_INLINE_OFFLINE==='1')await ctx.route(base,r=>r.fulfill({contentType:'text/html',body:html}));
  let page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
  await page.locator(`[data-action="choose-${mode}"]`).click();
  await page.locator('#travel-name-0').fill('Felipe');await page.locator('#travel-name-1').fill('Bia');
  await page.locator('[data-action="travel-add"]').click();await page.locator('#travel-name-2').fill('Rafa');
  await page.locator('[data-action="travel-start"]').click();
  for(let round=1;round<=5;round++){
   await page.getByText(`RODADA ${round} DE 5`,{exact:false}).waitFor();
   for(const name of ['Felipe','Bia','Rafa']){
    await page.locator('.handoff h1').filter({hasText:name}).waitFor();
    assert.equal(await page.locator('#guess').count(),0,'handoff must remove all answer fields');
    assert.equal(await page.locator('[data-action="reveal"]').count(),0,'no early reveal');
    await page.locator('[data-action="travel-open"]').click();
    assert.equal(await page.locator('#guess').inputValue(),'','no prior player draft');
    if(name==='Bia'&&round===1){
     await page.locator('#guess').fill('rascunho privado');
     await page.locator('[data-action="travel-pause"]').click();
     await page.locator('[data-action="travel-resume"]').click();
     await page.locator('.handoff h1').filter({hasText:'Bia'}).waitFor();
     assert.ok(!(await page.locator('body').innerText()).includes('rascunho privado'));
     await page.locator('[data-action="travel-open"]').click();
    }
    if(name==='Rafa')await page.locator('[data-action="travel-skip"]').click();
    else await send(page,await correctAnswer(page));
    if(name==='Felipe'&&round===2){
     await page.close();page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
     await page.goto(base);await page.locator('[data-action="travel-resume"]').click();
    }
   }
   await page.getByText('Todos já responderam',{exact:false}).waitFor();
   await page.locator('[data-action="reveal"]').click();
   await page.locator('[data-action="next"]').dblclick();
  }
  await page.getByText('Resumo das 5 rodadas').waitFor();
  const expected=mode==='letters'?5:mode==='rank'?25:13;
  const scores=await page.locator('.podium-item').allInnerTexts();
  assert.ok(scores[0].includes(expected+' pontos'));assert.ok(scores[1].includes(expected+' pontos'));assert.ok(scores[2].includes('0 pontos'));
  assert.equal((await page.locator('.podium').innerText()).includes('Amigo simulado'),false);
  assert.equal((await page.locator('.podium-item span').allInnerTexts()).filter(s=>s==='🥇').length,2);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1);
  await page.screenshot({path:resolve(root,`test-results/travel-${mode}-mobile.png`),fullPage:true});
  await page.locator('[data-action="rematch"]').click();
  await page.locator('.handoff h1').filter({hasText:'Felipe'}).waitFor();await page.getByText('0 de 3 respostas enviadas').waitFor();
  const beforeHome=page.url();await page.getByRole('link',{name:'Riviera Showdown — início',exact:true}).click();
  assert.equal(page.url(),beforeHome,'logo deve voltar à tela inicial sem abrir uma pasta local');
  await page.locator('[data-action="travel-resume"]').click();
  await page.getByText('RODADA 1 DE 5',{exact:false}).waitFor();
  await ctx.close();console.log(`PASS viagem ${mode}: 3 participantes locais no mesmo aparelho, cinco rodadas offline, privacidade na troca, passar vez, pausa, nova página, placar e revanche`);
 }
 const ctx=await browser.newContext({viewport:{width:360,height:800}});
 if(process.env.RIVIERA_INLINE_OFFLINE==='1')await ctx.route(base,r=>r.fulfill({contentType:'text/html',body:html}));
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);
 await page.locator('#travel-name-1').fill('Você');await page.locator('[data-action="travel-start"]').click();await page.getByRole('alert').filter({hasText:'nomes diferentes'}).waitFor();
 await page.locator('#travel-name-1').fill('');await page.locator('[data-action="travel-start"]').click();await page.getByRole('alert').filter({hasText:'Preencha'}).waitFor();
 for(let i=2;i<8;i++)await page.locator('[data-action="travel-add"]').click();
 assert.equal(await page.locator('[data-player]').count(),8);assert.ok(await page.locator('[data-action="travel-add"]').isDisabled());
 await page.locator('[data-action="travel-remove"]').click();assert.equal(await page.locator('[data-player]').count(),7);
 await page.evaluate(()=>localStorage.setItem('riviera-travel-v1','{invalid'));await page.reload();assert.equal(await page.locator('[data-action="travel-resume"]').count(),0);
 await page.evaluate(()=>scrollTo(0,0));
 await page.screenshot({path:resolve(root,'test-results/travel-home-mobile.png'),fullPage:true});
 await ctx.close();
 // Storage denial must never prevent a local party game.
 const denied=await browser.newContext();if(process.env.RIVIERA_INLINE_OFFLINE==='1')await denied.route(base,r=>r.fulfill({contentType:'text/html',body:html}));
 await denied.addInitScript(()=>{Storage.prototype.setItem=function(){throw Error('storage blocked')}});
 const d=await denied.newPage();d.on('pageerror',e=>errors.push(e.message));await d.goto(base);await d.locator('[data-action="travel-start"]').click();await d.getByText('Não foi possível salvar neste navegador.',{exact:false}).waitFor();
 await denied.close();assert.deepEqual(errors,[]);
 console.log('PASS nomes vazios/duplicados, limite de 8 pessoas, save inválido e armazenamento bloqueado');
}finally{await browser.close()}
