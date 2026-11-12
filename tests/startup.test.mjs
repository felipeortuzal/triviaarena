import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import vm from 'node:vm';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const code=['phrase-tools.js','rank-tools-v5.js','party-game-v5.js','app.js'].map(name=>readFileSync(resolve(ROOT,name),'utf8').replace(/^import .* from .*;$/gm,'').replace(/^export /gm,'')).join('\n');

function harness({embedded=true,fetchFails=false}={}){
  const main={innerHTML:""},connection={textContent:""};
  const handlers={},problems=[];
  const puzzle={code:"4 E do A",answer:"4 Estações do Ano",explain:"Primavera, verão, outono e inverno.",hints:["Tempo e clima","Primavera, verão, outono, inverno"],level:"Fácil"};
  const data={puzzles:[puzzle,{...puzzle,code:"2 D do S"}],rankings:[{id:"test",title:"Ranking de teste",url:"https://example.org/test",source:"Fixture",snapshot:"Teste",items:Array.from({length:25},(_,i)=>"Item "+(i+1))}]};
  const document={
    querySelector(selector){
      if(selector==="#app")return main;
      if(selector==="#connection")return connection;
      if(selector==="#nick")return {value:"Teste",focus(){}};
      if(selector==="#guess")return {value:"Item 5"};
      if(selector==="#letter-winner")return {value:""};
      return null;
    },
    addEventListener(type,fn){handlers[type]=fn}
  };
  const context={
    window:{RIVIERA_STANDALONE:embedded,RIVIERA_EMBEDDED_DATA:embedded?data:null},
    document,
    localStorage:{getItem(){return null},setItem(){}},
    crypto:{getRandomValues(array){array[0]=7;return array}},
    URLSearchParams,
    location:{search:"",pathname:"/triviaarena/index.html",origin:"https://example.github.io"},
    history:{replaceState(){}},
    navigator:{clipboard:{writeText:async()=>{}}},
    fetch:async()=>{if(fetchFails)throw new Error("Offline");return {ok:true,json:async()=>data}},
    console:{error:message=>problems.push(String(message))},
    setTimeout,
    clearTimeout,
    Date
  };
  vm.runInNewContext(code,context,{timeout:3000});
  const click=action=>handlers.click({target:{closest(){return {dataset:{action}}}}});
  return {main,connection,click,problems};
}

test('app.js compila e o HTML contém recursos locais',function shouldCompile(){
  execFileSync(process.execPath,["--check",resolve(ROOT,"app.js")]);
  const html=readFileSync(resolve(ROOT,"riviera-showdown.html"),"utf8");
  assert.match(html,/RIVIERA_STANDALONE=true/);
  assert.match(html,/RIVIERA_EMBEDDED_DATA=/);
  assert.match(html,/Riviera Showdown/);
  assert.ok(!html.includes('src="app.js"'));
  assert.ok(!html.includes('src="logo.svg"'));
});
test('prévia oferece apenas Ranking e espera o palpite antes de revelar',()=>{
 const a=harness({embedded:true});
 assert.match(a.main.innerHTML,/Estimativa de Ranking|ESTIMATIVA DE RANKING/);
 assert.doesNotMatch(a.main.innerHTML,/data-action="choose-letters"|data-action="choose-mixed"/);
 a.click('demo');
 assert.match(a.main.innerHTML,/rank-target/);
 a.click('reveal');assert.match(a.main.innerHTML,/Espere todos enviarem/);
 assert.doesNotMatch(a.main.innerHTML,/Quem chegou mais perto/);
 a.click('guess');a.click('reveal');assert.match(a.main.innerHTML,/Quem chegou mais perto/);
 a.click('next');assert.match(a.main.innerHTML,/RODADA 2/);
 a.click('stop-demo');assert.match(a.main.innerHTML,/Jogar neste aparelho/);
});
test('falha de data.json mantém início e prévia acessíveis',async function shouldFallback(){
  const a=harness({embedded:false,fetchFails:true});
  assert.match(a.main.innerHTML,/Jogar neste aparelho/);
  await new Promise(resolve=>setImmediate(resolve));
  assert.match(a.main.innerHTML,/Os desafios completos não carregaram/);
  assert.match(a.main.innerHTML,/Criar sala clássica/);
  assert.match(a.main.innerHTML,/data-action="create-live"/);
  assert.match(a.main.innerHTML,/disabled title=/);
  assert.match(a.main.innerHTML,/data-action="demo" disabled/);
  assert.match(a.main.innerHTML,/Recarregue o conteúdo para jogar Ranking/);
});
