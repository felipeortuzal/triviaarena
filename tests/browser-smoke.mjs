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
    await page.getByText("Demonstração: Decifre a Frase").waitFor();
    await page.locator('[data-action="hint"]').click();
    await page.getByText("Dica 1:",{exact:false}).waitFor();
    await page.locator('[data-action="hint"]').click();
    await page.getByText("Dica 2:",{exact:false}).waitFor();
    await page.locator('[data-action="reveal"]').click();
    await page.getByText("RESPOSTA REVELADA",{exact:true}).waitFor();
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
      const allowed=["index.html","app.js","data.json","logo.svg","firebase-config.js","party-game-v5.js","rank-tools-v5.js"];
      if(!allowed.includes(relative)){res.writeHead(404);res.end();return}
      const filename=resolve(ROOT,relative);
      if(relative==="firebase-config.js"&&req.headers["x-test-firebase"]==="configured"){
        res.writeHead(200,{"content-type":"text/javascript"});
        res.end('export const firebaseConfig={apiKey:"test",databaseURL:"https://fake.firebaseio.com",projectId:"test",authDomain:"test",appId:"test"};');
        return;
      }
      const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml"};
      res.writeHead(200,{"content-type":mime[extname(filename)]||"text/plain"});
      res.end(readFileSync(filename));
    });
    await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
    const port=server.address().port;
    const base="http://127.0.0.1:"+port+"/triviaarena/";
    const ctx=await browser.newContext({viewport:{width:375,height:812}});
    const page=await ctx.newPage();
    await page.goto(base);
    await page.locator('[data-action="create"]').waitFor();
    assert.equal(await page.locator('[data-action="create"]').isDisabled(),true,"salas devem ficar inativas sem configuração");
    await verifyDemo(page);
    await ctx.close();
    // Arquivo único por file://, com a rede desativada no navegador.
    const offlineCtx=await browser.newContext({viewport:{width:375,height:812}});
    await offlineCtx.setOffline(true);
    const offlinePage=await offlineCtx.newPage();
    await offlinePage.goto(pathToFileURL(resolve(ROOT,"riviera-showdown.html")).href);
    await verifyDemo(offlinePage);
    // Prévia completa do lobby até o pódio, com amigo simulado, offline.
    await offlinePage.locator('[data-action="demo-lobby"]').click();
    await offlinePage.getByText("Sua sala está pronta.").waitFor();
    await offlinePage.locator('[data-action="start-game"]').click();
    await offlinePage.locator('[data-action="reveal"]').click();
    await offlinePage.locator('#letter-winner').selectOption('guest');
    await offlinePage.locator('[data-action="next"]').click();
    await offlinePage.locator('[data-action="hint"]').click();
    await offlinePage.locator('[data-action="reveal"]').click();
    await offlinePage.locator('[data-action="finish-game"]').click();
    await offlinePage.getByText("Fim de jogo!").waitFor();
    await offlinePage.getByText("Resumo das 2 rodadas").waitFor();
    await offlinePage.locator('[data-action="leave-room"]').click();
    await offlinePage.locator('[data-action="demo"]').waitFor();
    // Ranking jogável offline: envio, resolução com fonte e placar final.
    await offlinePage.locator('[data-action="choose-rank"]').click();
    await offlinePage.locator('[data-action="demo-lobby"]').click();
    await offlinePage.locator('[data-action="start-game"]').click();
    await offlinePage.locator(".rank-target strong").waitFor();
    await offlinePage.locator("#guess").fill("Brasil");
    await offlinePage.locator('[data-action="guess"]').click();
    await offlinePage.locator('[data-action="reveal"]').click();
    await offlinePage.getByText("Quem chegou mais perto?").waitFor({timeout:8000}).catch(async e=>{console.error("DEBUG OFFLINE RANK:",(await offlinePage.locator("body").innerText()).slice(-5500));throw e});
    await offlinePage.locator('[data-action="finish-game"]').click();
    await offlinePage.getByText("Fim de jogo!").waitFor();
    await offlinePage.locator('[data-action="leave-room"]').click();
    // Misto alterna Frase → Ranking → Frase com placar e histórico únicos.
    await offlinePage.locator('[data-action="choose-mixed"]').click();
    await offlinePage.locator('[data-action="demo-lobby"]').click();
    await offlinePage.locator('[data-action="start-game"]').click();
    await offlinePage.locator(".largecode").waitFor();
    await offlinePage.locator('[data-action="reveal"]').click();
    await offlinePage.locator('[data-action="next"]').click();
    await offlinePage.locator(".rank-target strong").waitFor();
    await offlinePage.locator("#guess").fill("Brasil");
    await offlinePage.locator('[data-action="guess"]').click();
    await offlinePage.locator('[data-action="reveal"]').click();
    await offlinePage.getByText("Quem chegou mais perto?").waitFor();
    await offlinePage.locator('[data-action="next"]').click();
    await offlinePage.locator(".largecode").waitFor();
    await offlinePage.locator('[data-action="reveal"]').click();
    await offlinePage.locator('[data-action="finish-game"]').click();
    await offlinePage.getByText("Resumo das 3 rodadas").waitFor();
    assert.equal(await offlinePage.locator(".history-row").count(),3);
    const mobileWidth=await offlinePage.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    assert.ok(mobileWidth<=1,"overflow horizontal nos três modos: "+mobileWidth);
    await offlineCtx.close();
    // Simula falha de conteúdo: a tela inicial e uma rodada-reserva continuam disponíveis.
    const fallbackCtx=await browser.newContext({viewport:{width:375,height:812}});
    const fallback=await fallbackCtx.newPage();
    await fallback.route("**/data.json",route=>route.abort());
    await fallback.goto(base);
    await fallback.getByText("rodada de reserva",{exact:false}).waitFor();
    await fallback.locator('[data-action="demo"]').click();
    await fallback.getByText("7 M D M",{exact:true}).waitFor();
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
    await cdnPage.getByText("Não foi possível conectar às salas.",{exact:false}).waitFor();
    await verifyDemo(cdnPage);
    await cdnCtx.close();
    console.log("PASS: HTTP prefixado, file:// offline, dicas/revelação/avanço, mobile 375px, falha de dados e falha de CDN");
  }catch(error){failures.push(error);throw error}
  finally{
    if(server)await new Promise(resolve=>server.close(resolve));
    await browser.close();
  }
}
await browserChecks();
