// Four independent browser profiles play the same invite from lobby to rematch.
import assert from "node:assert/strict";
import {existsSync} from "node:fs";
import {chromium} from "playwright-core";

const base=process.env.RIVIERA_URL||"http://127.0.0.1:8787/";
const executablePath=["/usr/bin/google-chrome","/usr/bin/chromium"].find(existsSync);
const browser=await chromium.launch({executablePath,headless:true,args:["--no-sandbox"]});
const pages=[];
const problems=[];
let host,invite;
async function submit(page,answer){
 await page.locator("#guess").fill(answer);
 await page.locator('#guess-form button[type="submit"]').click();
}
try{
 for(const width of [1280,375,390,768]){
  const page=await browser.newPage({viewport:{width,height:850},reducedMotion:"reduce"});
  page.on("pageerror",error=>problems.push(error.message));
  pages.push(page);
 }
 host=pages[0];
 await host.goto(base,{waitUntil:"domcontentloaded"});
 await host.locator('[data-op="create"]').first().click();
 await host.locator('#create-form [name="nick"]').fill("Mesa de teste");
 await host.locator('[data-op="wizard-next"]').click();
 await host.locator("#auto-next").uncheck();
 await host.locator("#advanced-options > summary").click();
 await host.locator('[data-op="categories-none"]').click();
 const category=host.locator('.category-group').filter({has:host.locator('[value="pokemon"]')});
 await category.locator("summary").click();
 await category.locator('[value="pokemon"]').check();
 await host.locator('[data-op="wizard-next"]').click();
 await host.locator('#create-form button[type="submit"]').click();
 await host.locator(".roomcode").waitFor();
 invite=host.url();
 assert.match(invite,/\?room=[A-HJ-NP-Z2-9]{6}$/);
 await Promise.all(pages.slice(1).map(async(page,i)=>{
  await page.goto(invite,{waitUntil:"domcontentloaded"});
  await page.locator('#join-form [name="nick"]').fill("Pessoa de teste "+(i+2));
  await page.locator('#join-form button[type="submit"]').click();
  await page.locator(".roomcode").waitFor();
 }));
 await Promise.all(pages.map(page=>page.locator('[data-op="ready"]').click()));
 await host.locator('[data-op="start"]:enabled').click();
 const answers=["Bulbassaur","Ivysaur","Venusaur","Charmander"];
 for(let round=1;round<=5;round++){
  await Promise.all(pages.map(page=>page.locator('#guess').waitFor()));
  if(round===1){
   await submit(host,answers[0]);
   await host.locator(".rv27-answer-confirm").waitFor();
   await host.reload({waitUntil:"domcontentloaded"});
   await host.locator(".rv27-answer-confirm").waitFor();
   assert.match(await host.locator(".rv27-answer-confirm").innerText(),/Bulbasaur/);
   await submit(pages[1],"Bulbasaur");
   await pages[1].getByText(/Outro jogador já escolheu/).waitFor();
   await Promise.all(pages.slice(1).map((page,i)=>submit(page,answers[i+1])));
  }else{
   await Promise.all(pages.map((page,i)=>submit(page,answers[i])));
  }
  const scene=round===5?"finished":"reveal";
  await Promise.all(pages.map(async page=>{
   await page.locator('[data-scene="'+scene+'"]').waitFor();
   assert.equal(await page.locator(".result-row").count(),4);
   const points=await page.locator(".board .points").allTextContents();
   assert.equal(points.reduce((sum,t)=>sum+parseInt(t,10),0),round*3);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }));
  if(round<5)await host.locator('[data-op="next"]').click();
 }
 await host.locator('[data-op="restart"]').click();
 await Promise.all(pages.map(async page=>{
  await page.locator("#guess").waitFor();
  const scores=await page.locator(".board .points").allTextContents();
  assert.ok(scores.every(text=>parseInt(text,10)===0));
 }));
 assert.deepEqual(problems,[]);
 console.log("PARTIDA VERIFICADA em "+new URL(base).origin+" · 4 navegadores · 5 rodadas · 15 pontos · convite, duplicata, autocorreção, recarga, pódio e revanche.");
}finally{
 if(invite)await host.evaluate(async()=>{
  const s=JSON.parse(localStorage.getItem("riviera-cloudflare-session-v1"));
  if(s)await fetch("/api/room/"+s.code+"/close",{method:"POST",headers:{authorization:"Bearer "+s.token,"content-type":"application/json"},body:"{}"});
 }).catch(()=>{});
 await browser.close();
}
