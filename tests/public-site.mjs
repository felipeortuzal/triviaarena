// Só leitura: verifica a publicação real, os assets e a inicialização do app.
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {chromium} from 'playwright-core';
const base=process.env.RIVIERA_PUBLIC_URL||'https://felipeortuzal.github.io/triviaarena/';
const assets=['','app.js','data.json','logo.svg','firebase-config.js','rooms-v2.js','party-game-v5.js','rank-tools-v5.js','phrase-tools.js','catalog-v6.js','riviera-showdown.html','release.json'];
for(const name of assets){
 const response=await fetch(new URL(name,base));
 assert.equal(response.status,200,`${name||'index.html'}: HTTP ${response.status}`);
 const body=await response.text();assert.ok(body.length>0,name);
 if(name==='release.json'){
  const release=JSON.parse(body);
  if(process.env.GITHUB_SHA)assert.equal(release.revision,process.env.GITHUB_SHA);
  console.log('RELEASE',JSON.stringify(release));
 }
}
const browser=await chromium.launch({headless:true,executablePath:['/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync),args:['--no-sandbox']});
try{
 for(const width of [1365,390]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);
  await page.locator('[data-action="demo"]').waitFor();
  for(const mode of ['letters','rank','mixed'])await page.locator(`[data-action="choose-${mode}"]`).click();
  await page.locator('[data-action="demo"]').click();await page.locator('.largecode').waitFor();
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)<=1);
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('PASS site público: HTML, JavaScript, CSS inline, SVG, dados, prévia e viewports desktop/mobile. Multiplayer de produção exige teste separado.');
}finally{await browser.close()}
