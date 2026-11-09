const $=s=>document.querySelector(s), app=$('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,' ').trim().replace(/\s+/g,' ');
const random=n=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n};
const pick=a=>a[random(a.length)];
const code=()=>Array.from({length:6},()=> 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[random(32)]).join('');
const btn=(label,action,cls='',disabled=false)=>`<button class="btn ${cls}" data-action="${action}" ${disabled?'disabled title="Salas online indisponíveis"':''}>${label}</button>`;
const wrap=(html)=>`<div class="hero"><div class="eyebrow">RIVIERA SHOWDOWN • JOGOS COM AMIGOS</div><h1>Seu grupo. <span class="purple">Seu jogo.</span></h1><p class="lead">Entre com um nick, compartilhe o convite e jogue em tempo real. Temas sorteados, rodadas sem repetição e rankings de diferentes tamanhos.</p></div>${html}`;
// A interface é independente de CDN, Firebase e leitura da base completa.
let initializeApp,getAuth,signInAnonymously,onAuthStateChanged,getDatabase,ref,set,update,onValue,get,remove;
const STANDALONE=window.RIVIERA_STANDALONE===true;
const FALLBACK_PUZZLE={code:'7 M D M',answer:'7 Maravilhas do Mundo',level:'Demonstração',explain:'Sete monumentos famosos para experimentar o jogo.',hints:['São construções ou monumentos mundialmente conhecidos.','O número indica a quantidade de maravilhas.']};
const safeNick=()=>{try{return localStorage.getItem('riviera-nick')||localStorage.getItem('trivia-nick')||''}catch{return ''}};
const saveNick=n=>{try{localStorage.setItem('riviera-nick',n)}catch{}};
let DATA={puzzles:[FALLBACK_PUZZLE],rankings:[]},db=null,auth=null,uid=null,roomId=null,room=null,unsubRoom=null,modeChoice='mixed',nick=safeNick(),view='home',busy=false,err='',imported=[],localHints=0;
let localDemo=false,configured=false,dataReady=false,dataProblem='',connectionState=STANDALONE?'local':'checking',connectionProblem='';
let roomGateway=null,clearPresence=()=>{},currentRoomSubscription=null,emulatorMode=false;
const onlineReady=()=>!!(uid&&db&&dataReady&&!localDemo);
function error(e){err=typeof e==='string'?e:e?.message||'Ocorreu um erro';render();}
function status(){
  const node=$("#connection");
  if(node)node.textContent=localDemo||STANDALONE?"● Modo local":uid?"● Online":connectionState==="connecting"||connectionState==="checking"?"◌ Conectando":"○ Offline";
}
function home(){
  const online=onlineReady();
  const help=STANDALONE
    ?"Esta cópia funciona sem internet. Para criar salas, use a versão online do site."
    :connectionState==="unconfigured"
    ?"As salas online ainda precisam da configuração do Firebase e de regras de segurança."
    :connectionState==="unavailable"
    ?"Não foi possível conectar às salas. A demonstração local continua disponível."
    :connectionState==="connecting"||connectionState==="checking"
    ?"Verificando a conexão. Você já pode experimentar a demonstração local."
    :"Conexão pronta para criar uma sala e compartilhar convites.";
  return wrap(`<div class="grid"><button class="panel mode" data-action="choose-letters"><div class="emoji">🧩</div><h2>Decifre a Frase</h2><p>Descubra expressões e curiosidades com números e iniciais. Duas dicas e revelação da resposta.</p></button><button class="panel mode orange" data-action="choose-rank"><div class="emoji">🏆</div><h2>Estimativa de Ranking</h2><p>Estime posições em listas de diferentes tamanhos. O modo multiplayer precisa da conexão online.</p></button></div>
<section class="panel homejoin" aria-label="Jogar neste aparelho"><div class="row between"><div><div class="eyebrow">PRÉVIA LOCAL • SEM CADASTRO</div><h2>Jogar neste aparelho</h2></div><span class="pill">🧩 Demonstração</span></div><p>Experimente <strong>Decifre a Frase</strong> agora: abra duas dicas, revele a resposta e avance. Funciona mesmo sem internet ou Firebase.</p><div class="actions">${btn("▶ Jogar neste aparelho","demo","lime")}${dataProblem?btn("↻ Tentar carregar conteúdo","retry-data","ghost"):""}</div>${dataProblem?`<p class="notice" role="status">${esc(dataProblem)}. Uma rodada de reserva está disponível.</p>`:""}</section>
<section class="panel homejoin" aria-label="Salas online"><div class="row between"><div><div class="eyebrow">SALA ONLINE</div><h2>Crie ou entre com um convite</h2></div><span class="pill">${online?"● Disponível":"○ Indisponível"}</span></div><p class="tiny" role="status">${esc(help)}</p>${connectionProblem?`<p class="notice tiny">${esc(connectionProblem)}</p>`:""}
<div class="grid"><div class="stack"><label><span class="label">Seu nick</span><input class="field" id="nick" maxlength="28" placeholder="Como quer aparecer?" value="${esc(nick)}"></label><label><span class="label">Modo da sala</span><select class="field" id="mode"><option value="mixed" ${modeChoice==="mixed"?"selected":""}>🎲 Misturado (alternando jogos)</option><option value="letters" ${modeChoice==="letters"?"selected":""}>🧩 Só frases</option><option value="rank" ${modeChoice==="rank"?"selected":""}>🏆 Só rankings</option></select></label>${btn("Criar sala e gerar convite →","create","lime",!online)}</div>
<div class="stack"><label><span class="label">Código de convite</span><input class="field" id="join-code" maxlength="10" placeholder="Ex.: TRV7XK" value="${esc(new URLSearchParams(location.search).get("room")||"")}"></label><p class="tiny">Quem recebe o link abre o site, escolhe um nick e entra na sala.</p>${btn("Entrar na sala →","join","primary",!online)}</div></div></section>
<p class="footer">🎲 Desafios com sorteio sem repetição • 📱 Celular e computador • 🔒 Sem cadastro pessoal</p>`);
}
function waiting(){
  const count=members().length;
  const modeName=room.mode==="mixed"?"🎲 Modo misturado":room.mode==="letters"?"🧩 Decifre a Frase":"🏆 Estimativa de Ranking";
  return `<section class="panel lobby">
    <div class="row between"><div><div class="eyebrow">SEU LOBBY PRIVADO</div><h2>Reúna sua equipe</h2><p class="muted tiny">Até 20 participantes • Cada pessoa entra com seu próprio apelido.</p></div><span class="pill lobby-count">${count}/20 jogadores</span></div>
    <div class="invite-card"><div><div class="eyebrow">CÓDIGO DA SALA</div><div class="invite-code" aria-label="Código da sala">${esc(roomId)}</div><p class="tiny">Compartilhe este código ou envie o convite.</p></div><div class="actions"><input class="field" id="invite" aria-label="Link de convite" readonly value="${esc(location.origin+location.pathname+'?room='+roomId+(emulatorMode?'&emulator=1':''))}">${btn("Copiar convite","copy","lime")}</div></div>
    <div class="cardline row between"><div><h3>Jogadores conectados</h3><p class="tiny">${count} participante(s) registrado(s)</p></div><span class="pill">● Lobby</span></div>
    ${roster()}
    <div class="cardline"><h3>${modeName}</h3><p class="tiny">${room.closed?"Esta sala foi encerrada pelo anfitrião.":"Sala criada com segurança. As partidas online serão habilitadas após a etapa de jogo e pontuação."}</p>
    ${isHost()?`${btn("Iniciar partida — em desenvolvimento","next","primary",true)} ${btn(room.closed?"Sala encerrada":"Encerrar sala","close-room","ghost",room.closed)}`:"<p class='tiny'>Aguardando o anfitrião preparar a partida…</p>"}
    <div class="row" style="margin-top:16px">${btn("Voltar ao início","leave-room","ghost")}</div></div></section>`;
}
function members(){return Object.values(room?.members||{}).sort((a,b)=>(a.joined||0)-(b.joined||0));}
function isHost(){return localDemo||room?.host===uid}
function roster(){return `<div class="roster">${members().map(m=>`<div class="player"><b>${esc(m.nick)} ${m.uid===room.host?'👑':''}</b><span>${m.online?'● Conectado':'○ Desconectado'} · ${room?.scores?.[m.uid]||0} ponto(s)</span></div>`).join('')}</div>`}
function roomHeader(){
  if(localDemo)return `<div class="row between" style="margin-bottom:20px"><div><div class="eyebrow">JOGAR NESTE APARELHO • RODADA ${room?.number||1}</div><h2>Demonstração: Decifre a Frase</h2></div>${btn("← Sair da prévia","stop-demo","ghost")}</div>`;
  return `<div class="row between" style="margin-bottom:20px"><div><div class="eyebrow">SALA ${esc(roomId)} • RODADA ${room?.number||0}</div><h2>${room?.mode==="mixed"?"Modo misturado":room?.mode==="rank"?"Estimativa de Ranking":"Decifre a Frase"}</h2></div>${btn("📋 Convidar","copy","ghost")}</div>`;
}
function letters(){
  const r=room.round,p=DATA.puzzles[r.index];
  if(!p)return "<p>Desafio não encontrado.</p>";
  const hints=r.hints>0?`<div class="status">💡 Dica 1: ${esc(p.hints?.[0]||"Sem dica")}${r.hints>1?`<p>💡 Dica 2: ${esc(p.hints?.[1]||"Sem dica")}</p>`:""}</div>`:"";
  const answer=`<div class="result"><div class="eyebrow">RESPOSTA</div><strong>${esc(p.answer)}</strong><p>${esc(p.explain||"")}</p></div>`;
  const host=isHost()?`<div class="actions">${btn("💡 Dica "+Math.min(2,r.hints+1)+"/2","hint","ghost",r.hints>=2||r.revealed)}${btn("👁 Revelar resposta","reveal","primary",r.revealed)}</div>`:"<p class='tiny'>O anfitrião controla as dicas e a revelação.</p>";
  const next=r.revealed&&isHost()?(localDemo?btn("Próximo desafio →","next","lime"):`<label><span class="label">Quem acertou?</span><select class="field" id="letter-winner"><option value="">Ninguém / pular pontuação</option>${members().map(m=>`<option value="${esc(m.uid)}">${esc(m.nick)}</option>`).join("")}</select></label>${btn("Registrar e próxima frase →","next","lime")}`):"";
  return `${roomHeader()}<div class="panel stack"><div class="row between"><span class="pill">🧩 DECIFRE A FRASE</span><span class="pill">${esc(p.level||"Geral")}</span></div><div class="largecode">${esc(p.code)}</div><p style="text-align:center">O que significam as letras?</p>${r.revealed?answer:hints}${host}${next}</div>${localDemo?"":`<div class="panel" style="margin-top:18px"><h3>Placar da sala</h3>${roster()}</div>`}`;
}
function rankData(r){if(r.custom)return r.custom;return DATA.rankings.find(x=>x.id===r.categoryId)}
function rankPos(guess,items){const n=norm(guess);if(!n)return null;let exact=items.findIndex(s=>norm(s)===n);if(exact>=0)return exact+1;return null}
function scoreRank(r){const data=rankData(r),items=data.items.slice(0,r.limit);const results=members().map(m=>{const g=room.guesses?.[r.id]?.[m.uid]||'';const override=r.overrides?.[m.uid];const pos=override===0?null:(override||rankPos(g,items));return {...m,guess:g,pos,delta:pos?Math.abs(pos-r.target):null}});results.sort((a,b)=>(a.delta??Infinity)-(b.delta??Infinity));let place=0,prev=null;results.forEach((v,i)=>{if(v.delta!==null){if(v.delta!==prev)place=i+1;v.place=place;prev=v.delta}});return results}
function ranking(){const r=room.round,d=rankData(r);if(!d)return '<p>Ranking não encontrado.</p>';const guess=room.guesses?.[r.id]?.[uid]||'';const locked=!!r.revealed;return `${roomHeader()}<div class="panel stack"><div class="row between"><span class="pill">🏆 ESTIMATIVA DE RANKING</span><span class="pill">TOP ${r.limit}</span></div><div class="eyebrow" style="text-align:center">${esc(d.title)}</div><div class="big-num" style="text-align:center">${r.target}º</div><p style="text-align:center">Qual item ocupa essa posição?</p><p class="tiny" style="text-align:center">${esc(d.description||'')}${d.source?` · <a href="${esc(d.source)}" target="_blank" rel="noopener noreferrer">Fonte</a>`:''}</p>${locked?`<div class="result"><div class="eyebrow">RESPOSTA CORRETA</div><strong>${esc(d.items[r.target-1])}</strong><p>${r.target}º lugar no Top ${r.limit}</p></div>${results(r)}`:`<label><span class="label">Seu palpite (um item)</span><input class="field" id="guess" maxlength="120" placeholder="Ex.: Brasil" value="${esc(guess)}"></label>${btn(guess?'Atualizar palpite ✓':'Enviar meu palpite →','guess','lime')}<p class="tiny">${Object.keys(room.guesses?.[r.id]||{}).length} de ${members().length} palpites enviados. Os nomes ficam ocultos até a revelação.</p>${isHost()?btn('Revelar ranking e resultado','reveal','primary'):'<p class="tiny">Aguardando o anfitrião revelar o ranking.</p>'}`}${locked&&isHost()?btn('Próxima rodada →','next','lime'):''}</div><div class="panel" style="margin-top:18px"><h3>Jogadores</h3>${roster()}</div>`}
function results(r){const a=scoreRank(r);return `<h3 style="margin-top:24px">Resultado da rodada</h3><div class="tablewrap"><table class="board"><thead><tr><th>Lugar</th><th>Jogador</th><th>Palpite</th><th>Posição</th><th>Distância</th></tr></thead><tbody>${a.map(x=>`<tr><td>${x.place||'—'}</td><td>${esc(x.nick)}</td><td>${esc(x.guess||'—')}</td><td>${x.pos||'—'}</td><td>${x.delta??'—'}</td></tr>`).join('')}</tbody></table></div><p class="tiny">Nomes não reconhecidos podem ser traduções ou itens fora do recorte. O anfitrião pode corrigir a posição antes da próxima rodada.</p>${isHost()?`<div class="row"><select class="field" style="flex:1 1 140px" id="override-player">${a.map(x=>`<option value="${esc(x.uid)}">${esc(x.nick)}</option>`).join('')}</select><input class="field" style="flex:1 1 140px" type="number" min="0" max="${r.limit}" id="override-pos" placeholder="Posição (0 = fora)">${btn('Corrigir','override','ghost')}</div>`:''}`}
function render(){
  status();
  const banner=err?`<div role="alert" class="status error">${esc(err)}</div>`:"";
  err="";
  app.innerHTML=banner+(!room?home():room.round?(room.round.type==="letters"?letters():ranking()):waiting());
}
function connectRoom(id){
  if(!roomGateway)throw Error("A conexão da sala ainda não está pronta.");
  currentRoomSubscription?.();clearPresence();
  roomId=id;room=null;
  currentRoomSubscription=roomGateway.watchRoom(id,value=>{room=value;render()},error);
  clearPresence=roomGateway.markPresence(id,error);
  const params=new URLSearchParams(location.search);
  params.set("room",id);
  history.replaceState(null,"",location.pathname+"?"+params.toString());
}
async function joinRoom(id,name){
  if(!roomGateway)throw Error("Salas indisponíveis.");
  await roomGateway.joinRoom({code:id,nick:name});
  connectRoom(id);
}
function selectedMode(){return $('#mode')?.value||modeChoice}
function getNick(){const v=($('#nick')?.value||nick).trim().slice(0,28);if(!v)throw Error('Escolha um nick antes de entrar.');nick=v;saveNick(v);return v}
function usedKey(type){return type==='letters'?'usedLetters':'usedRanks'}
function nextChoice(){const current=room.round;let type=room.mode==='mixed'?(current?.type==='letters'?'rank':'letters'):room.mode;if(type==='letters'){const used=room.usedLetters||[];let available=DATA.puzzles.map((_,i)=>i).filter(i=>!used.includes(i));if(!available.length)available=DATA.puzzles.map((_,i)=>i);const index=pick(available);return {type:'letters',index,hints:0,revealed:false,usedLetters:available.length===DATA.puzzles.length&&used.length? [index]:[...used,index]}}
 const pool=[...DATA.rankings,...(room.customRankings||[])];if(!pool.length)throw Error('Não há rankings cadastrados.');const used=room.usedRanks||[];let choices=pool.filter(x=>!used.includes(x.id));if(!choices.length)choices=pool;let c=pick(choices);const limits=[25,50,75,100,250,500,1000].filter(n=>n<=c.items.length);if(!limits.includes(c.items.length))limits.push(c.items.length);const limit=pick(limits);const history=room.targetHistory?.[c.id+'-'+limit]||[];let positions=Array.from({length:limit},(_,i)=>i+1).filter(i=>!history.includes(i));if(!positions.length)positions=Array.from({length:limit},(_,i)=>i+1);const target=pick(positions);const id='r'+Date.now().toString(36)+random(9999);return {type:'rank',categoryId:c.id,custom:room.customRankings?.find(x=>x.id===c.id)||null,limit,target,id,revealed:false,usedRanks:choices.length===pool.length&&used.length?[c.id]:[...used,c.id],targetHistory:{...(room.targetHistory||{}),[c.id+'-'+limit]:positions.length===limit&&history.length?[target]:[...history,target]}}}
async function nextRound(){if(localDemo){nextLocalRound();return}throw Error('Partidas online serão habilitadas na etapa 3.');if(!isHost())return;let add=nextChoice();const updateData={number:(room.number||0)+1,round:add};if(add.usedLetters)updateData.usedLetters=add.usedLetters;if(add.usedRanks)updateData.usedRanks=add.usedRanks;if(add.targetHistory)updateData.targetHistory=add.targetHistory;delete add.usedLetters;delete add.usedRanks;delete add.targetHistory;if(room.round?.type==='letters'&&room.round.revealed){const winner=$('#letter-winner')?.value;if(winner){updateData[`scores/${winner}`]=(room.scores?.[winner]||0)+1}}if(room.round?.type==='rank'&&room.round.revealed&&!room.round.scored){const ranked=scoreRank(room.round);const scores={...room.scores};ranked.forEach(x=>{if(x.place&&x.place<=3)scores[x.uid]=(scores[x.uid]||0)+({1:5,2:3,3:1}[x.place]||0)});updateData.scores=scores}await update(ref(db,'rooms/'+roomId),updateData)}
function startDemo(){
  currentRoomSubscription?.();currentRoomSubscription=null;clearPresence();
  unsubRoom?.();unsubRoom=null;
  localDemo=true;roomId="LOCAL";
  const index=DATA.puzzles.length>1?random(DATA.puzzles.length):0;
  room={host:"local",mode:"letters",number:1,members:{local:{uid:"local",nick:"Jogador",joined:Date.now()}},scores:{local:0},usedLetters:[index],round:{type:"letters",index,hints:0,revealed:false}};
  render();
}
function nextLocalRound(){
  if(!localDemo||!room?.round?.revealed)return;
  const used=room.usedLetters||[],all=DATA.puzzles.map((_,i)=>i);
  let available=all.filter(i=>!used.includes(i));
  if(!available.length)available=all;
  const index=available[random(available.length)];
  room.usedLetters=available.length===all.length&&used.length?[index]:[...used,index];
  room.number++;
  room.round={type:"letters",index,hints:0,revealed:false};
  render();
}
async function handle(action){if(busy)return;busy=true;try{if(action==="demo"){startDemo()}
else if(action==="stop-demo"){localDemo=false;room=null;roomId=null;render()}
else if(action==="leave-room"){
  currentRoomSubscription?.();currentRoomSubscription=null;clearPresence();
  room=null;roomId=null;const q=new URLSearchParams(location.search);q.delete("room");
  history.replaceState(null,"",location.pathname+(q.size?"?"+q.toString():""));render()
}
else if(action==="close-room"){if(!isHost()||!roomGateway)throw Error("Apenas o anfitrião pode encerrar.");await roomGateway.closeRoom(roomId)}
else if(action==="retry-data"){await loadData()}
else if(action==="hint"&&localDemo){room.round.hints=Math.min(2,room.round.hints+1);render()}
else if(action==="reveal"&&localDemo){room.round.revealed=true;render()}
else if(action==='choose-letters'||action==='choose-rank'){modeChoice=action==='choose-letters'?'letters':'rank';render();$('#mode').value=modeChoice;$('#nick').focus()}
else if(action==='create'){if(!onlineReady()||!roomGateway)throw Error('Salas online indisponíveis. Use Jogar neste aparelho ou configure o Firebase.');const name=getNick();const result=await roomGateway.createRoom({nick:name,mode:selectedMode()});connectRoom(result.code)}
else if(action==='join'){if(!onlineReady())throw Error('Salas online indisponíveis. Use Jogar neste aparelho.');const name=getNick();const id=($('#join-code')?.value||new URLSearchParams(location.search).get('room')||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(id.length!==6)throw Error('Digite um código de sala válido com 6 caracteres.');await joinRoom(id,name)}
else if(action==='copy'){const url=location.origin+location.pathname+'?room='+roomId+(emulatorMode?'&emulator=1':'');await navigator.clipboard.writeText(url);const b=$('[data-action="copy"]');if(b)b.textContent='✓ Link copiado'}
else if(action==='import'&&isHost()){const title=$('#custom-title')?.value.trim();const source=$('#custom-source')?.value.trim();const items=$('#custom-items')?.value.split('\n').map(x=>x.trim().replace(/^\d+[º.)-]?\s*/, '')).filter(Boolean)||[];if(!title||items.length<10||items.length>1000)throw Error('Informe um título e de 10 a 1.000 itens, um por linha.');if(source&&!/^https:\/\//i.test(source))throw Error('A fonte precisa começar com https://');const c={id:'custom-'+Date.now(),title,description:'Ranking personalizado fornecido pelo anfitrião',source:source||'',items};await update(ref(db,'rooms/'+roomId),{customRankings:[...(room.customRankings||[]),c]});}
else if(action==='next'&&localDemo){nextLocalRound()}
else if(action==='next')await nextRound();
else if(action==='hint'&&isHost()){await update(ref(db,'rooms/'+roomId+'/round'),{hints:Math.min(2,(room.round.hints||0)+1)})}
else if(action==='reveal'&&isHost()){await update(ref(db,'rooms/'+roomId+'/round'),{revealed:true})}
else if(action==='guess'){const g=$('#guess')?.value.trim();if(!g)throw Error('Escreva seu palpite.');await set(ref(db,`rooms/${roomId}/guesses/${room.round.id}/${uid}`),g)}
else if(action==='override'&&isHost()){const id=$('#override-player').value;const v=Number($('#override-pos').value);if(!Number.isInteger(v)||v<0||v>room.round.limit)throw Error('Digite uma posição entre 0 e '+room.round.limit);await update(ref(db,'rooms/'+roomId+'/round/overrides'),{[id]:v})}
}catch(e){error(e)}finally{busy=false}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)handle(b.dataset.action)});
document.addEventListener('change',e=>{if(e.target.id==='mode')modeChoice=e.target.value});
async function loadData(){
  if(STANDALONE){
    const embedded=window.RIVIERA_EMBEDDED_DATA;
    if(embedded&&Array.isArray(embedded.puzzles)&&embedded.puzzles.length&&Array.isArray(embedded.rankings)){
      DATA=embedded;dataReady=true;dataProblem="";
    }else{
      DATA={puzzles:[FALLBACK_PUZZLE],rankings:[]};dataReady=false;dataProblem="Não foi possível ler os dados da prévia";
    }
    render();return;
  }
  dataProblem="";
  try{
    const response=await fetch("./data.json");
    if(!response.ok)throw Error("HTTP "+response.status);
    const data=await response.json();
    if(!Array.isArray(data.puzzles)||!data.puzzles.length||!Array.isArray(data.rankings))throw Error("Catálogo inválido");
    DATA=data;dataReady=true;
  }catch(e){
    DATA={puzzles:[FALLBACK_PUZZLE],rankings:[]};
    dataReady=false;dataProblem="Os desafios completos não carregaram ("+(e?.message||"erro desconhecido")+")";
  }
  render();
}
async function bootNetwork(){
  if(STANDALONE){connectionState="local";render();return}
  emulatorMode=(location.hostname==="localhost"||location.hostname==="127.0.0.1")&&new URLSearchParams(location.search).get("emulator")==="1";
  let config;
  try{
    config=(await import("./firebase-config.js")).firebaseConfig;
  }catch(e){connectionState="unavailable";connectionProblem="Falha ao carregar as configurações do Firebase.";render();return}
  if(emulatorMode){
    config={apiKey:"demo-riviera-web",authDomain:"demo-riviera-showdown.firebaseapp.com",
      databaseURL:"https://demo-riviera-showdown-default-rtdb.firebaseio.com",
      projectId:"demo-riviera-showdown",appId:"1:123456789:web:demo"};
  }
  configured=!!(config&&config.apiKey&&config.apiKey!=="COLE_AQUI"&&config.databaseURL?.startsWith("https://"));
  if(!configured){connectionState="unconfigured";render();return}
  connectionState="connecting";render();
  try{
    const [fa,au,da,gatewayModule]=await Promise.all([
      import("https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js"),
      import("./rooms-v2.js")
    ]);
    ({initializeApp}=fa);
    ({getAuth,signInAnonymously,onAuthStateChanged}=au);
    ({getDatabase,ref,set,update,onValue,get,remove}=da);
    const fapp=initializeApp(config);
    db=getDatabase(fapp);auth=getAuth(fapp);
    if(emulatorMode){
      // Só localhost + ?emulator=1. Nunca aponta a produção para um emulador.
      au.connectAuthEmulator(auth,"http://127.0.0.1:9099",{disableWarnings:true});
      da.connectDatabaseEmulator(db,"127.0.0.1",9000);
    }
    onAuthStateChanged(auth,async user=>{
      try{
        if(!user){uid=null;roomGateway=null;connectionState="unavailable";connectionProblem="Autenticação indisponível.";render();return}
        uid=user.uid;
        roomGateway=gatewayModule.makeRoomGateway({
          db,uid,api:{ref:da.ref,get:da.get,set:da.set,runTransaction:da.runTransaction,
            onValue:da.onValue,onDisconnect:da.onDisconnect,serverTimestamp:da.serverTimestamp}
        });
        connectionState="online";connectionProblem="";
        const pending=new URLSearchParams(location.search).get("room")?.toUpperCase();
        if(pending&&roomGateway.validateCode(pending)&&!roomId&&!localDemo){
          if(await roomGateway.resumeRoom(pending)){connectRoom(pending);return}
        }
        render();
      }catch(e){connectionProblem="Falha ao recuperar a sala: "+e.message;render()}
    });
    await signInAnonymously(auth);
  }catch(e){
    uid=null;db=null;roomGateway=null;connectionState="unavailable";
    connectionProblem="Serviço de salas indisponível: "+(e?.message||"erro de rede");
    render();
  }
}
async function init(){
  render(); // mostra a interface antes de acessar a rede
  await loadData();
  await bootNetwork();
}
init();
