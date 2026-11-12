import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');

async function browserChecks(){
  const options=["/usr/bin/google-chrome","/usr/bin/chromium","/opt/google/chrome/chrome"];
  const chrome=options.find(existsSync);
  assert.ok(chrome,"Chrome/Chromium não encontrado no runner");
  const browser=await chromium.launch({headless:true,executablePath:chrome,args:["--no-sandbox"]});
  let server;
  const failures=[];
  async function verifyDemo(page){
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.locator('[data-action="demo"]').waitFor({state:"visible",timeout:10000});
    assert.equal(await page.title(),"Riviera Showdown — Jogue com seus amigos");
    await page.locator('[data-action="demo"]').click();
    await page.getByText("Demonstração: Estimativa de Ranking").waitFor();
    assert.equal(await page.locator('[data-action="choose-letters"], [data-action="choose-mixed"]').count(),0);
    assert.ok(await page.locator('[data-action="reveal"]').isDisabled());
    // HUD regression: progress labels must never inherit neon bars; score names and statuses stay aligned.
    for(const width of [320,375,768,1280]){
      await page.setViewportSize({width,height:900});
      const hud=await page.evaluate(()=>{
        const meter=document.querySelector('.round-meter');
        const label=meter?.querySelector('.round-meter-label');
        const bars=meter?.querySelectorAll('span[aria-hidden="true"]')||[];
        const card=document.querySelector('.round-panel');
        const board=document.querySelector('.scoreboard');
        const name=board?.querySelector('.player b');
        const state=board?.querySelector('.player span');
        const bound=el=>el?.getBoundingClientRect();
        return {bars:bars.length,labelBorder:label&&getComputedStyle(label).borderTopWidth,
          labelHeight:bound(label)?.height||0,
          meterLeft:bound(meter)?.left,meterRight:bound(meter)?.right,
          cardLeft:bound(card)?.left,cardRight:bound(card)?.right,
          boardLeft:bound(board)?.left,boardRight:bound(board)?.right,
          nameLeft:bound(name)?.left,stateLeft:bound(state)?.left,
          nameTop:bound(name)?.top,stateTop:bound(state)?.top,
          horizontalOverflow:Math.max(0,document.documentElement.scrollWidth-innerWidth)};
      });
      assert.equal(hud.bars,5,"HUD deve mostrar cinco barras de rodada");
      assert.equal(hud.labelBorder,'0px',"legenda do progresso não pode ganhar borda neon");
      assert.ok(hud.labelHeight>=11,"legenda do progresso deve permanecer legível");
      assert.ok(hud.stateLeft>=hud.nameLeft-1,"status do jogador deve estar sob o nome, não sob a medalha");
      assert.ok(hud.stateTop>=hud.nameTop,"status do jogador deve ficar após o nome");
      for(const edge of ['meter','card','board']){
        assert.ok(hud[edge+'Left']>=-1&&hud[edge+'Right']<=width+1,edge+' fora da viewport '+width+': '+JSON.stringify(hud));
      }
      assert.ok(hud.horizontalOverflow<=1,"overflow horizontal no HUD "+width+"px: "+JSON.stringify(hud));
    }
    await page.locator('#guess').fill('Brasil');
    await page.locator('[data-action="guess"]').click();
    await page.locator('[data-action="reveal"]').click();
    await page.getByText("Quem chegou mais perto?",{exact:true}).waitFor();
    await page.locator('[data-action="next"]').click();
    await page.getByText("RODADA 2",{exact:false}).first().waitFor();
    await page.locator('[data-action="stop-demo"]').click();
    await page.locator('[data-action="demo"]').waitFor();
    const extraWidth=await page.evaluate(()=>Math.max(0,document.documentElement.scrollWidth-window.innerWidth));
    const overflowNodes=await page.evaluate(()=>Array.from(document.querySelectorAll("*"))
      .map(el=>({tag:el.tagName,cls:el.className,txt:el.textContent?.slice(0,45),left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right}))
      .filter(el=>el.right>window.innerWidth+1||el.left<-1).slice(0,12));
    assert.ok(extraWidth<=1,"overflow horizontal na tela móvel: "+extraWidth+"px; nós: "+JSON.stringify(overflowNodes));
    assert.deepEqual(errors,[],"exceções fatais no console");
  }
  try{
    // Uma rota com prefixo /triviaarena/ reproduz o caminho do GitHub Pages.
    server=createServer((req,res)=>{
      const pathname=new URL(req.url,"http://127.0.0.1").pathname;
      if(!pathname.startsWith("/triviaarena/")){res.writeHead(404);res.end();return}
      const relative=pathname.slice("/triviaarena/".length)||"index.html";
      const allowed=["index.html","app.js","data.json","logo.svg","assets/riviera-reference-beach.jpg","assets/riviera-logo-transparent.png","firebase-config.js","party-game-v5.js","rank-tools-v5.js","phrase-tools.js"];
      if(!allowed.includes(relative)){res.writeHead(404);res.end();return}
      const filename=resolve(ROOT,relative);
      if(relative==="firebase-config.js"&&req.headers["x-test-firebase"]==="configured"){
        res.writeHead(200,{"content-type":"text/javascript"});
        res.end('export const firebaseConfig={apiKey:"test",databaseURL:"https://fake.firebaseio.com",projectId:"test",authDomain:"test",appId:"test"};');
        return;
      }
      const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".jpg":"image/jpeg",".png":"image/png"};
      res.writeHead(200,{"content-type":mime[extname(filename)]||"text/plain"});
      res.end(readFileSync(filename));
    });
    await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
    const port=server.address().port;
    const base="http://127.0.0.1:"+port+"/triviaarena/";
    const ctx=await browser.newContext({viewport:{width:375,height:812}});
    const page=await ctx.newPage();
    await page.goto(base);
    await page.locator(".online-options > summary").click();
    await page.locator('[data-action="create"]').waitFor();
    assert.equal(await page.locator('[data-action="create"]').isDisabled(),true,"salas devem ficar inativas sem configuração");
    await verifyDemo(page);
    await ctx.close();
    // Arquivo único por file://, com a rede desativada no navegador.
    const offlineCtx=await browser.newContext({viewport:{width:375,height:812}});
    await offlineCtx.setOffline(true);
    const offlinePage=await offlineCtx.newPage();
    if(process.env.RIVIERA_INLINE_OFFLINE==='1'){
      await offlinePage.route(base+'offline.html',route=>route.fulfill({contentType:'text/html',body:readFileSync(resolve(ROOT,'riviera-showdown.html'),'utf8')}));
      await offlinePage.goto(base+'offline.html');
    }else await offlinePage.goto(pathToFileURL(resolve(ROOT,"riviera-showdown.html")).href);
    await verifyDemo(offlinePage);
    await offlineCtx.close();
    // Simula falha de conteúdo: a tela inicial e uma rodada-reserva continuam disponíveis.
    const fallbackCtx=await browser.newContext({viewport:{width:375,height:812}});
    const fallback=await fallbackCtx.newPage();
    await fallback.route("**/data.json",route=>route.abort());
    await fallback.goto(base);
    await fallback.getByText("Recarregue o conteúdo para jogar Ranking",{exact:false}).waitFor();
    assert.ok(await fallback.locator('[data-action="demo"]').isDisabled());
    assert.ok(await fallback.locator('[data-action="travel-start"]').isDisabled());
    await fallback.unroute('**/data.json');
    await fallback.locator('[data-action="retry-data"]').click();
    await verifyDemo(fallback);
    await fallbackCtx.close();
    // Configuração válida, mas CDN indisponível: o bootstrap não trava.
    const cdnCtx=await browser.newContext({viewport:{width:375,height:812}});
    const cdnPage=await cdnCtx.newPage();
    await cdnPage.route("**/firebase-config.js",route=>route.fulfill({
      status:200,contentType:"text/javascript",
      body:'export const firebaseConfig={apiKey:"test",databaseURL:"https://fake.firebaseio.com",projectId:"test",authDomain:"test",appId:"test"};'
    }));
    await cdnPage.route("https://www.gstatic.com/**",route=>route.abort());
    await cdnPage.goto(base);
    await cdnPage.getByText("Não foi possível conectar às salas.",{exact:false}).waitFor({state:"attached"});
    await cdnPage.locator(".online-options > summary").click();
    await cdnPage.getByText("Não foi possível conectar às salas.",{exact:false}).waitFor();
    await verifyDemo(cdnPage);
    await cdnCtx.close();
    console.log("PASS: HTTP prefixado, "+(process.env.RIVIERA_INLINE_OFFLINE==='1'?'HTML interceptado offline':'file:// offline')+", Ranking, espera por todos, revelação/avanço, mobile 375px, falha de dados e falha de CDN");
  }catch(error){failures.push(error);throw error}
  finally{
    if(server)await new Promise(resolve=>server.close(resolve));
    await browser.close();
  }
}
await browserChecks();
