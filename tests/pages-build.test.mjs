import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {spawnSync} from "node:child_process";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const file=name=>resolve(root,"dist",name);
test("exportação do Pages contém só os recursos essenciais",()=>{
  for(const path of ["index.html","app.js","data.json","logo.svg","assets/riviera-logo.jpg","firebase-config.js","rooms-v2.js","phrases-v3.js","party-game-v5.js","rank-tools-v5.js","phrase-tools.js","riviera-showdown.html","release.json",".nojekyll"]){
    assert.ok(existsSync(file(path)),path+" não encontrado");
  }
  const html=readFileSync(file("index.html"),"utf8");
  assert.match(html,/src="app\.js"/);
  assert.match(html,/src="assets\/riviera-logo\.jpg"/);
  const code=readFileSync(file("app.js"),"utf8");
  assert.match(code,/import\("\.\/firebase-config\.js"\)/);
  assert.match(code,/import\("\.\/rooms-v2\.js"\)/);
  assert.match(code,/import\("\.\/phrases-v3\.js"\)/);
  assert.doesNotMatch(html,/\/(?:src|assets)\//);
  const version=JSON.parse(readFileSync(file("release.json"),"utf8"));
  assert.ok(version.revision.length>0);
  assert.equal(version.name,"Riviera Showdown");
});
test("build aceita configuração pública Firebase da região correta",()=>{
  const sample={apiKey:"test-web-key",authDomain:"demo-riviera.firebaseapp.com",projectId:"demo-riviera",databaseURL:"https://demo-riviera-default-rtdb.us-central1.firebasedatabase.app",appId:"1:123:web:test"};
  let run=spawnSync(process.execPath,["scripts/prepare-pages.mjs"],{cwd:root,env:{...process.env,RIVIERA_FIREBASE_WEB_CONFIG:JSON.stringify(sample)},encoding:"utf8"});
  assert.equal(run.status,0,run.stderr);
  const code=readFileSync(file("firebase-config.js"),"utf8");
  assert.ok(code.includes(sample.databaseURL));
  assert.doesNotMatch(code,/COLE_AQUI/);
  run=spawnSync(process.execPath,["scripts/prepare-pages.mjs"],{cwd:root,env:{...process.env,RIVIERA_FIREBASE_WEB_CONFIG:""},encoding:"utf8"});
  assert.equal(run.status,0,run.stderr);
});
test("recusa URLs estranhas e nunca incorpora configuração insegura",()=>{
  const bad={apiKey:"web",authDomain:"example.invalid",projectId:"demo",databaseURL:"https://attacker.invalid",appId:"test"};
  const run=spawnSync(process.execPath,["scripts/prepare-pages.mjs"],{cwd:root,env:{...process.env,RIVIERA_FIREBASE_WEB_CONFIG:JSON.stringify(bad)},encoding:"utf8"});
  assert.notEqual(run.status,0,"deveria recusar o domínio do banco");
  assert.match(run.stderr,/databaseURL não aponta/);
  const reset=spawnSync(process.execPath,["scripts/prepare-pages.mjs"],{cwd:root,env:{...process.env,RIVIERA_FIREBASE_WEB_CONFIG:""},encoding:"utf8"});
  assert.equal(reset.status,0,reset.stderr);
});
