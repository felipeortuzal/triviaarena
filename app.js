import {calculatePhrase} from "./phrase-tools.js";
import {calculateRanking} from "./rank-tools-v5.js";
import {createPartyGame} from "./party-game-v5.js";
const $=s=>document.querySelector(s), app=$('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,' ').trim().replace(/\s+/g,' ');
const random=n=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n};
const pick=a=>a[random(a.length)];
const code=()=>Array.from({length:6},()=> 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[random(32)]).join('');
const btn=(label,action,cls='',disabled=false)=>`<button class="btn ${cls}" data-action="${action}" ${disabled?'disabled title="Ação indisponível neste momento"':''}>${label}</button>`;
const wrap=(html)=>`<div class="hero"><div class="eyebrow">RIVIERA SHOWDOWN • JOGOS COM AMIGOS</div><h1>Seu grupo. <span class="purple">Seu jogo.</span></h1><p class="lead">Na viagem, na mesa ou no sofá: um aparelho, a turma toda e cinco rodadas para decidir o vencedor.</p></div>${html}`;
// A interface é independente de CDN, Firebase e leitura da base completa.
let initializeApp,getAuth,signInAnonymously,onAuthStateChanged,getDatabase,ref,set,update,onValue,get,remove;
const STANDALONE=window.RIVIERA_STANDALONE===true;
const FALLBACK_PUZZLE={code:'7 M D M',answer:'7 Maravilhas do Mundo',level:'Demonstração',explain:'Sete monumentos famosos para experimentar o jogo.',hints:['São construções ou monumentos mundialmente conhecidos.','O número indica a quantidade de maravilhas.']};
const safeNick=()=>{try{return localStorage.getItem('riviera-nick')||localStorage.getItem('trivia-nick')||''}catch{return ''}};
const saveNick=n=>{try{localStorage.setItem('riviera-nick',n)}catch{}};
let DATA={puzzles:[FALLBACK_PUZZLE],rankings:[]},db=null,auth=null,uid=null,roomId=null,room=null,unsubRoom=null,modeChoice='letters',nick=safeNick(),view='home',busy=false,err='',imported=[],localHints=0;
let localDemo=false,configured=false,dataReady=false,dataProblem='',connectionState=STANDALONE?'local':'checking',connectionProblem='';
let roomGateway=null,phraseGame=null,partyGame=null,clearPresence=()=>{},currentRoomSubscription=null,emulatorMode=false,pendingJoinCode='';
let stopGuess=()=>{},stopSubmissions=()=>{},currentGuessRound='',ownGuess='',submitted={},guessDrafts={},rankOverrideReason='';
let renderedScreen='';
let travelNames=['Você','Amigo'],travelTurnOpen=false,storageUnavailable=false;
const TRAVEL_SAVE='riviera-travel-v1';
function savedTravel(){
 try{
  const raw=localStorage.getItem(TRAVEL_SAVE);
  if(!raw||raw.length>200000)return null;
  const save=JSON.parse(raw),r=save.room,players=Object.values(r?.members||{});
  if(save.version!==1||!r.localShared||!['letters','rank','mixed'].includes(r.mode)||!['playing','finished'].includes(r.phase)||!Number.isInteger(r.number)||r.number<1||r.number>5||players.length<2||players.length>8)return null;
  if(players.some(m=>!/^p[0-7]$/.test(m.uid)||typeof m.nick!=='string'||!m.nick.trim()||m.nick.length>20||!Number.isFinite(r.scores?.[m.uid])))return null;
  if(!r.round||!['letters','rank'].includes(r.round.type)||typeof r.round.id!=='string'||!r.roundHistory||typeof r.roundHistory!=='object'||!r.localGuesses||typeof r.localGuesses!=='object')return null;
  if(r.round.type==='letters'&&(!Number.isInteger(r.round.index)||r.round.index<0||r.round.index>=DATA.puzzles.length))return null;
  if(r.round.type==='rank'&&!DATA.rankings.some(d=>d.id===r.round.categoryId&&r.round.limit<=d.items.length&&r.round.target>=1&&r.round.target<=r.round.limit))return null;
  return r;
 }catch{return null}
}
function saveTravel(){
 if(!room?.localShared)return;
 try{localStorage.setItem(TRAVEL_SAVE,JSON.stringify({version:1,room}));storageUnavailable=false}catch{storageUnavailable=true}
}
function travelPlayer(){return room?.localShared?members().find(m=>!Object.hasOwn(room.localGuesses||{},m.uid)):null}
function travelSetup(){
 const saved=savedTravel();
 return `<section class="panel homejoin travel-setup" aria-label="Jogar neste aparelho"><div class="eyebrow">MODO VIAGEM · 2 A 8 PESSOAS</div><h2>Jogar neste aparelho</h2><p>Escolham o modo acima, coloquem os nomes e passem o aparelho. Cada um responde na sua vez. O jogo conta os pontos.</p>
 ${saved?`<div class="resume-card"><span>Partida salva · ${Object.keys(saved.members).length} pessoas · ${saved.phase==='finished'?'pódio':'rodada '+saved.number+' de 5'}</span>${btn('↻ Retomar partida','travel-resume','lime')}</div>`:''}
 <div class="grid travel-players">${travelNames.map((name,i)=>`<label><span class="label">Jogador ${i+1}</span><input class="field" id="travel-name-${i}" data-player="${i}" maxlength="20" autocomplete="off" value="${esc(name)}"></label>`).join('')}</div>
 <div class="actions">${btn('+ Adicionar pessoa','travel-add','ghost',travelNames.length>=8)}${travelNames.length>2?btn('− Remover última','travel-remove','ghost'):''}</div>
 <div class="actions cardline">${btn(saved?'▶ Começar nova partida':'▶ Começar com a turma','travel-start','lime')}</div>
 <p class="tiny">Sem conta, sem cronômetro e sem jogadores simulados. ${STANDALONE?'Este arquivo funciona sem internet.':'Para levar sem internet, baixe o HTML antes de sair.'}</p>
 ${!STANDALONE?'<a class="download-link" href="./riviera-showdown.html" download>↓ Baixar jogo para a viagem</a>':''}
 ${dataProblem?`<p class="notice">${esc(dataProblem)}. Uma rodada de reserva está disponível.</p>${btn('↻ Recarregar conteúdo','retry-data','ghost')}`:''}
 <details class="how-to"><summary>Como jogar?</summary><p>1. Passe o aparelho para a pessoa indicada.<br>2. Ela responde sem mostrar a tela e passa para a próxima.<br>3. Quando todos enviarem, revelem juntos. Frase vale +1 por acerto; Ranking vale 5/3/1 pela proximidade. Depois de cinco rodadas, vejam o pódio e joguem a revanche.</p></details>
 <div class="cardline"><p class="tiny">Quer conhecer primeiro? Estas opções usam um amigo simulado.</p><div class="actions">${btn('▶ Experimentar sozinho','demo','ghost')}${btn('Testar lobby e placar','demo-lobby','ghost')}</div></div></section>`;
}
function startTravel(){
 const names=travelNames.map(n=>n.trim());
 if(names.some(n=>!n))throw Error('Preencha o nome de cada pessoa.');
 if(new Set(names.map(norm)).size!==names.length)throw Error('Use nomes diferentes para identificar cada pessoa.');
 if(modeChoice!=='letters'&&!DATA.rankings.length)throw Error('Os rankings não carregaram. Escolha Frase ou recarregue o conteúdo.');
 currentRoomSubscription?.();currentRoomSubscription=null;clearPresence();stopGuess();stopSubmissions();currentGuessRound='';
 localDemo=true;roomId='VIAGEM';travelTurnOpen=false;
 const now=Date.now();
 room={host:'p0',mode:modeChoice,phase:'lobby',number:0,match:1,roundLimit:5,localGame:true,localShared:true,
 members:Object.fromEntries(names.map((name,i)=>['p'+i,{uid:'p'+i,nick:name,joined:now+i,online:true}])),
 scores:Object.fromEntries(names.map((_,i)=>['p'+i,0])),roundHistory:{},usedLetters:[],usedRanks:[]};
 localChooseRound();
}
function travelHandoff(){
 const player=travelPlayer(),sent=Object.keys(room.localGuesses||{}).length;
 return `${roomHeader()}<section class="panel handoff" aria-live="polite"><div class="handoff-icon">${player?'📱':'🙌'}</div><div class="eyebrow">${player?'PASSE O APARELHO':'TODOS JÁ RESPONDERAM'}</div><h1>${player?esc(player.nick):'Hora de revelar!'}</h1><p>${player?'Só você deve ver a próxima tela. As respostas anteriores estão escondidas.':'Juntem a turma para conferir as respostas e os pontos.'}</p><div class="turn-progress">${sent} de ${members().length} respostas enviadas</div>${player?btn('Estou com o aparelho →','travel-open','lime'):btn('👁 Revelar para a turma','reveal','lime')}<p class="tiny">${storageUnavailable?'Não foi possível salvar neste navegador. Mantenha esta página aberta.':'Progresso salvo neste navegador.'}</p></section>`;
}
function travelControls(){
 const player=travelPlayer();
 if(!player)return '';
 const r=room.round;
 return `<div class="travel-turn"><div class="eyebrow">VEZ DE ${esc(player.nick)}</div><p class="tiny">Responda sem mostrar a tela para a turma.</p></div><label class="stack"><span class="label">Sua resposta</span><input class="field" id="guess" maxlength="120" autocomplete="off" enterkeyhint="send" placeholder="Escreva aqui" value="${esc(guessDrafts[roomId+':'+r.id]||'')}"></label>${btn('Enviar e passar o aparelho →','guess','lime')}<div class="actions">${r.type==='letters'?btn('💡 Dica '+Math.min(2,r.hints+1)+'/2','hint','ghost',r.hints>=2):''}${btn('Não sei · passar vez','travel-skip','ghost')}</div>`;
}

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
    ?"Salas entre aparelhos ainda indisponíveis. Você já pode jogar com a turma em um só aparelho."
    :connectionState==="unavailable"
    ?"Não foi possível conectar às salas. A demonstração local continua disponível."
    :connectionState==="connecting"||connectionState==="checking"
    ?"Verificando a conexão. Você já pode experimentar a demonstração local."
    :"Conexão pronta para criar uma sala e compartilhar convites.";
  return wrap(`<div class="grid modes"><button class="panel mode ${modeChoice==="letters"?"selected":""}" data-action="choose-letters"><div class="emoji">🧩</div><h2>Decifre a Frase</h2><p>Descubra expressões e curiosidades com números e iniciais. Duas dicas e revelação da resposta.</p></button><button class="panel mode orange ${modeChoice==="rank"?"selected":""}" data-action="choose-rank"><div class="emoji">🏆</div><h2>Estimativa de Ranking</h2><p>Acerte posições em rankings reais: países, filmes e economias. Dispute pontos com seu grupo.</p></button><button class="panel mode ${modeChoice==="mixed"?"selected":""}" data-action="choose-mixed"><div class="emoji">🎲</div><h2>Modo Misturado</h2><p>Alterne rodadas de frases e rankings, com um placar compartilhado.</p></button></div>
${travelSetup()}
<details class="online-options" ${online||pendingJoinCode||new URLSearchParams(location.search).get("room")?'open':''}><summary>Jogar em aparelhos separados ${online?'· disponível':'· online'}</summary><section class="panel homejoin" aria-label="Salas online"><div class="row between"><div><div class="eyebrow">SALA ONLINE</div><h2>Crie ou entre com um convite</h2></div><span class="pill">${online?"● Disponível":"○ Indisponível"}</span></div><p class="tiny" role="status">${esc(help)}</p>${connectionProblem?`<p class="notice tiny">${esc(connectionProblem)}</p>`:""}
<div class="grid"><div class="stack"><label><span class="label">Seu nick</span><input class="field" id="nick" maxlength="28" placeholder="Como quer aparecer?" value="${esc(nick)}"></label><label><span class="label">Modo da sala</span><select class="field" id="mode"><option value="letters" ${modeChoice==="letters"?"selected":""}>🧩 Decifre a Frase</option><option value="rank" ${modeChoice==="rank"?"selected":""}>🏆 Ranking</option><option value="mixed" ${modeChoice==="mixed"?"selected":""}>🎲 Misturado</option></select></label>${btn("Criar sala e gerar convite →","create","lime",!online)}</div>
<div class="stack"><label><span class="label">Código de convite</span><input class="field" id="join-code" maxlength="10" placeholder="Ex.: TRV7XK" value="${esc(pendingJoinCode||new URLSearchParams(location.search).get("room")||"")}"></label><p class="tiny">Quem recebe o link abre o site, escolhe um nick e entra na sala.</p>${btn("Entrar na sala →","join","primary",!online)}</div></div></section></details>
<p class="footer">🎲 Desafios com sorteio sem repetição • 📱 Celular e computador • 🔒 Sem cadastro pessoal</p>`);
}
function waiting(){
const count=members().length, onlineCount=members().filter(m=>m.online).length;
const canStart=!room.closed&&(['letters','rank','mixed'].includes(room.mode));
return `<section class="panel lobby">
<div class="row between"><div><div class="eyebrow">LOBBY PRIVADO</div><h2>Sua sala está pronta.</h2><p>Convide os amigos e comece a disputa!</p></div><span class="pill lobby-count">${count}/20 jogadores</span></div>
<div class="invite-card"><div><div class="eyebrow">CÓDIGO DA SALA</div><div class="invite-code">${esc(roomId)}</div><p class="tiny">Compartilhe o código ou envie um convite.</p></div><div class="stack"><label class="label" for="invite">LINK DO CONVITE</label><input class="field" readonly id="invite" value="${localDemo?'DEMONSTRAÇÃO LOCAL • Convites indisponíveis':esc(location.origin+location.pathname+'?room='+roomId+(emulatorMode?'&emulator=1':''))}">${btn('📋 Copiar convite','copy','lime',localDemo)}</div></div>
<div class="cardline row between"><div><h3>Participantes</h3><p class="tiny">${onlineCount} online · ${count} inscritos</p></div><span class="pill">${esc(room.mode==='letters'?'🧩 Decifre a Frase':room.mode==='mixed'?'🎲 Misturado':'🏆 Ranking')}</span></div>${roster()}
${!room.members?.[room.host]?.online?'<p class="notice">Anfitrião desconectado. Esperando o retorno…</p>':''}
<div class="cardline stack">${room.closed?'<p class="notice">Esta sala foi encerrada.</p>':isHost()?`${btn(canStart?'▶ Iniciar partida':'Modo disponível em breve','start-game','primary',!canStart)}<p class="tiny">Depois de começar, novos jogadores não entram. Cinco rodadas por partida. O anfitrião controla as dicas e a revelação; a pontuação é automática.</p>${!localDemo?btn('Encerrar sala','close-room','ghost'):''}`:'<p class="tiny">Aguardando o anfitrião iniciar a partida…</p>'}
${btn('← Voltar ao início','leave-room','ghost')}</div></section>`;
}
function members(){return Object.values(room?.members||{}).sort((a,b)=>(a.joined||0)-(b.joined||0));}
function isHost(){return localDemo||room?.host===uid}
function roster(){return `<div class="roster">${members().map(m=>`<div class="player"><b>${esc(m.nick)} ${m.uid===room.host?'👑':''}</b><span>${room.localShared?'Neste aparelho':m.online?'● Conectado':'○ Desconectado'} · ${room?.scores?.[m.uid]||0} ponto(s)</span></div>`).join('')}</div>`}
function roomHeader(){
  if(room?.localShared)return `<div class="row between travel-header"><div><div class="eyebrow">MODO VIAGEM · RODADA ${room.number} DE 5</div><h2>${room.mode==='mixed'?'Misturado':room.mode==='rank'?'Estimativa de Ranking':'Decifre a Frase'}</h2></div>${btn('Pausar e sair','travel-pause','ghost')}</div>`;
  if(localDemo)return `<div class="row between" style="margin-bottom:20px"><div><div class="eyebrow">JOGAR NESTE APARELHO • RODADA ${room?.number||1} DE 5</div><h2>Demonstração: ${room.mode==="rank"?"Estimativa de Ranking":room.mode==="mixed"?"Modo Misturado":"Decifre a Frase"}</h2></div>${btn("← Sair da prévia","stop-demo","ghost")}</div>`;
  return `<div class="row between" style="margin-bottom:20px"><div><div class="eyebrow">SALA ${esc(roomId)} • RODADA ${room?.number||0} DE 5</div><h2>${room?.mode==="mixed"?"Modo misturado":room?.mode==="rank"?"Estimativa de Ranking":"Decifre a Frase"}</h2></div>${btn("📋 Convidar","copy","ghost")}</div>`;
}
function letters(){
const r=room.round,p=DATA.puzzles[r.index];
if(!p)return roomHeader()+'<p>Desafio não encontrado. Atualize a página.</p>';
const hints=r.hints>0?`<div class="status" role="status"><b>💡 Dica 1:</b> ${esc(p.hints?.[0]||'Sem dica')}${r.hints>1?`<p><b>💡 Dica 2:</b> ${esc(p.hints?.[1]||'Sem dica')}</p>`:''}</div>`:'<p class="tiny muted" style="text-align:center">Duas dicas disponíveis, se precisar.</p>';
const answer=`<div class="result" role="status"><div class="eyebrow">RESPOSTA REVELADA</div><strong>${esc(p.answer)}</strong><p>${esc(p.explain||'')}</p></div>`;
const host=isHost()?`<div class="actions">${btn('💡 Liberar dica '+Math.min(2,r.hints+1)+'/2','hint','ghost',r.hints>=2||r.revealed)}${btn('👁 Revelar resposta','reveal','primary',r.revealed)}</div>`:'<p class="tiny">O anfitrião controla as dicas e a revelação.</p>';
const own=localDemo?room.localGuesses?.local||"":ownGuess;
const guess=guessDrafts[`${roomId}:${r.id}`]??own;
const sent=localDemo?Object.keys(room.localGuesses||{}).length:Object.values(submitted||{}).filter(Boolean).length;
const input=`<label class="stack"><span class="label">Sua resposta</span><input class="field" id="guess" maxlength="120" autocomplete="off" placeholder="Decifre os números e as iniciais" value="${esc(guess)}"></label>${btn(own?'✓ Atualizar minha resposta':'Enviar minha resposta →','guess','lime')}<p class="tiny" role="status">🔒 ${sent}/${members().length} jogadores enviaram. Respostas privadas até a revelação. ${own?'Sua resposta salva: '+esc(own):''}</p>`;
const scoring=r.revealed?`<div class="cardline"><h3>Resultado da rodada</h3>${r.resultReady?Object.values(r.review||{}).map(row=>`<div class="history-row"><span>${esc(room.members?.[row.uid]?.nick||'Jogador')}: ${esc(row.guess||'Sem resposta')}</span><b>${row.correct?'✓ +1 ponto':'Sem ponto'}</b></div>`).join(''):'<p>Preparando resultado…</p>'}${isHost()?(r.resultReady?advanceButtons():btn('Atualizar apuração','reveal','primary')):''}</div>`:'';
return `${roomHeader()}<div class="game-layout"><section class="panel round-panel stack"><div class="row between"><span class="pill">🧩 RODADA ${room.number}</span><span class="pill">${r.hints}/2 dicas</span></div>
<div class="options"><span class="pill">${esc(p.topic||'Cultura geral')}</span><span class="pill">${esc(p.level||'Geral')}</span></div>
<div class="largecode">${esc(p.code)}</div><p class="muted" style="text-align:center">O que significam os números e as iniciais?</p>
${r.revealed?answer:hints}${!r.revealed?(room.localShared?travelControls():input+host):''}${scoring}
${!localDemo&&!room.members?.[room.host]?.online?'<div class="notice">⚠ O anfitrião está offline. A rodada continuará quando ele voltar.</div>':''}
</section>${localDemo&&Object.keys(room.members||{}).length<2?'':`<aside class="panel scoreboard"><div class="eyebrow">PLACAR</div><h3>Quem está liderando?</h3>${roster()}<p class="tiny">${Object.keys(room.roundHistory||{}).length} rodada(s) concluída(s).</p></aside>`}</div>`;
}
function rankData(r){return DATA.rankings.find(x=>x.id===r.categoryId)}

function localRankScore(r){
 return calculateRanking({list:rankData(r),limit:r.limit,target:r.target,guesses:room.localGuesses||{},members:Object.keys(room.members||{}),overrides:r.overrides||{}});
}
function advanceButtons(){
 return `<div class="actions">${btn(room.number>=5?"🏆 Ver pódio":"Próxima rodada →","next","lime")}${room.number<5?btn("🏁 Finalizar partida","finish-game","ghost"):""}</div>`;
}

function rankReview(r){
 if(!r.resultReady||!r.review)return `<div class="notice" role="status">🔎 ${isHost()?"Preparando resultado. Se necessário, toque em Revelar novamente.":"O anfitrião está calculando as distâncias."}</div>${isHost()?btn("Atualizar apuração","reveal","ghost"):""}`;
 const ordered=Object.values(r.review).sort((a,b)=>(a.delta??Infinity)-(b.delta??Infinity)||a.uid.localeCompare(b.uid));
 const rows=ordered.map(row=>`<tr><td>${row.place?"#"+row.place:"—"}</td><td>${esc(room.members?.[row.uid]?.nick||room.profiles?.[row.uid]?.nick||"Jogador")}</td><td>${esc(row.guess||"Sem palpite")}${row.reason?`<div class="tiny highlight">✎ ${esc(row.reason)}</div>`:""}</td><td>${row.position||"—"}</td><td>${row.delta??"—"}</td><td class="highlight">+${row.points||0}</td></tr>`).join("");
 return `<div class="cardline"><div class="eyebrow">RESULTADOS · DISTÂNCIA ABSOLUTA</div><h3>Quem chegou mais perto?</h3>
 <div class="tablewrap"><table class="board"><thead><tr><th>Lugar</th><th>Jogador</th><th>Palpite</th><th>Posição</th><th>Distância</th><th>Pontos</th></tr></thead><tbody>${rows}</tbody></table></div>
 <p class="tiny">Diferença absoluta da posição-alvo. 1º +5 · 2º +3 · 3º +1. Empates dividem a colocação; respostas inválidas não pontuam.</p>
 ${isHost()?`${room.localShared?'<details class="how-to"><summary>Revisar um palpite</summary>':''}<div class="round-decision"><div class="eyebrow">AJUSTE MANUAL JUSTIFICADO</div><p class="tiny">Use somente quando uma tradução ou sinônimo for reconhecido. A justificativa ficará visível a todos.</p>
 <div class="grid"><label class="stack"><span class="label">Jogador</span><select class="field" id="override-player">${ordered.map(x=>`<option value="${esc(x.uid)}">${esc(room.members?.[x.uid]?.nick||"Jogador")}</option>`).join("")}</select></label>
 <label class="stack"><span class="label">Posição (0 = inválido)</span><input class="field" id="override-pos" type="number" min="0" max="${r.limit}" placeholder="Ex.: 12"></label></div>
 <label class="stack"><span class="label">Por que corrigiu?</span><textarea class="field" id="override-reason" maxlength="180" placeholder="Ex.: nome alternativo do item na 12ª posição"></textarea></label>
 ${btn("Salvar correção antes da pontuação","override","ghost")}</div>${room.localShared?'</details>':''}
 ${advanceButtons()}`:"<p class='tiny'>O anfitrião pode revisar o resultado e confirmar a pontuação.</p>"}</div>`;
}

function ranking(){
 const r=room.round,d=rankData(r);
 if(!d)return `${roomHeader()}<div class="panel"><p>Não foi possível carregar a lista selecionada. Confira sua conexão.</p></div>`;
 const key=`${roomId}:${r.id}`,draft=guessDrafts[key],own=localDemo?room.localGuesses?.local||"":ownGuess,guess=draft!==undefined?draft:own||"";
 const total=members().length,sent=localDemo?Object.keys(room.localGuesses||{}).length:Object.values(submitted||{}).filter(Boolean).length;
 const sourceLink=/^https:\/\//i.test(d.url||"")?`<a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">↗ Conferir ranking original</a>`:"Fonte indisponível";
 const locked=!!r.revealed;
 return `${roomHeader()}<div class="game-layout"><section class="panel round-panel stack">
 <div class="row between"><span class="pill">🏆 ESTIMATIVA DE RANKING</span><span class="pill">TOP ${r.limit}</span></div>
 <div class="rank-category"><div class="eyebrow">${esc(d.eyebrow||"RANKING DO DIA")}</div><h2>${esc(d.title)}</h2><p>${esc(d.about||"")}</p></div>
 <div class="rank-target"><span>QUAL ITEM ESTÁ NA POSIÇÃO</span><strong>${r.target}º</strong><span>NO TOP ${r.limit}?</span></div>
 <div class="rank-source"><b>${esc(d.source||"Fonte")}</b> · ${esc(d.snapshot||"Data não informada")} · ${room.localShared&&!locked?'Lista incluída no jogo · sem internet':sourceLink}</div>
 ${!locked&&room.localShared?travelControls():locked?`<div class="result" role="status"><div class="eyebrow">RESPOSTA DA POSIÇÃO ${r.target}º</div><strong>${esc(d.items[r.target-1])}</strong><p>Referência: ${esc(d.source||"")}</p></div>${rankReview(r)}`:
 `<label class="stack"><span class="label">Seu palpite — escreva o nome de um item</span><input class="field" id="guess" maxlength="120" placeholder="Ex.: Brasil, Japão, O Poderoso Chefão..." value="${esc(guess)}" autocomplete="off"></label>
 <div class="actions">${btn(own?"✓ Atualizar meu palpite":"Enviar meu palpite →","guess","lime")}</div>
 <p class="tiny" role="status">🔒 ${sent}/${total} jogadores enviaram. Os textos ficam privados até a revelação. ${own?"Seu último palpite salvo: "+esc(own):""}</p>
 ${isHost()?btn("👁 Encerrar envios e revelar","reveal","primary"):"<p class='tiny'>Aguardando o anfitrião fechar os palpites…</p>"}`}
 </section><aside class="panel scoreboard"><div class="eyebrow">PARTIDA EM ANDAMENTO</div><h3>Placar acumulado</h3>${roster()}</aside></div>`;
}
function finishedGame(){
const ranked=members().map(m=>({...m,points:room.scores?.[m.uid]||0})).sort((a,b)=>b.points-a.points||a.nick.localeCompare(b.nick));
const rounds=Object.values(room.roundHistory||{}).sort((a,b)=>a.number-b.number);
const best=ranked[0]?.points??0,winners=ranked.filter(x=>x.points===best);
return `<section class="panel final-screen"><div class="eyebrow">🏁 PARTIDA FINALIZADA</div><h1>Fim de jogo!</h1><p class="lead">${winners.length>1?'Empate na liderança!':'Campeão da noite:'} <strong class="highlight">${esc(winners.map(x=>x.nick).join(' & '))}</strong></p>
<div class="podium">${ranked.map((m,i)=>{const place=ranked.findIndex(player=>player.points===m.points)+1;return `<div class="podium-item"><span>${place===1?'🥇':place===2?'🥈':place===3?'🥉':'#'+place}</span><strong>${esc(m.nick)}</strong><b>${m.points} ponto${m.points===1?'':'s'}</b></div>`}).join('')}</div>
<div class="cardline"><h3>Resumo das ${rounds.length} rodadas</h3>${rounds.map(x=>`<div class="history-row"><span>${x.type==="rank"?"🏆":"🧩"} Rodada ${x.number} · ${esc(x.type==="rank"?(DATA.rankings.find(d=>d.id===x.categoryId)?.title||"Ranking")+" · alvo "+x.target+"º / Top "+x.limit:DATA.puzzles[x.index]?.code||"")}</span><b>${x.awarded?esc(Object.entries(x.awarded||{}).map(([key,points])=>(room.members?.[key]?.nick||"Jogador")+": +"+points).join(" · ")):esc(x.winner?room.members?.[x.winner]?.nick||"Jogador":"Sem vencedor")}</b></div>`).join("")}</div>
<div class="actions cardline">${btn('← Voltar ao início','leave-room','primary')}${isHost()?btn('↻ Jogar revanche','rematch','lime',room.closed):''}${isHost()&&!localDemo?btn('Encerrar sala','close-room','ghost',room.closed):''}</div></section>`;
}
function render(){
 status();const active=document.activeElement,focusId=active?.id||null;
 const value=focusId?active.value:null;
 const previousRound=app.dataset?.round;
 const banner=err?`<div role="alert" class="status error">${esc(err)}</div>`:'';
 err='';
 saveTravel();
 app.innerHTML=banner+(!room?home():room.localShared&&room.phase==='playing'&&!room.round.revealed&&!travelTurnOpen?travelHandoff():room.phase==='finished'?finishedGame():room.round?(room.round.type==='letters'?letters():ranking()):waiting());
 const screen=`${roomId||'home'}:${room?.phase||''}:${room?.round?.id||''}:${room?.localShared?travelPlayer()?.uid+':'+travelTurnOpen:''}`;
 const sameScreen=screen===renderedScreen;
 if(!sameScreen){renderedScreen=screen;window.scrollTo?.(0,0)}
 const sameRound=previousRound===room?.round?.id;if(app.dataset)app.dataset.round=room?.round?.id||"";
 if(focusId&&sameRound&&sameScreen){const el=document.getElementById(focusId);if(el&&!el.disabled){if(value!==null&&el.tagName!=='SELECT'&&focusId!=='invite')el.value=value;el.focus({preventScroll:true})}}
}
function watchRankingIfNecessary(id,roomValue){
  const r=roomValue?.round;
  const key=r?.id?id+":"+r.id:"";
  if(key===currentGuessRound)return;
  stopGuess();stopSubmissions();stopGuess=()=>{};stopSubmissions=()=>{};
  currentGuessRound=key;ownGuess="";submitted={};
  if(!key||!partyGame||localDemo)return;
  stopGuess=partyGame.watchMyGuess(id,r.id,value=>{ownGuess=value;if(room?.round?.id===r.id)render()},error);
  stopSubmissions=partyGame.watchSubmissions(id,r.id,value=>{submitted=value;if(room?.round?.id===r.id)render()},error);
}
function connectRoom(id){
  if(!roomGateway)throw Error("A conexão da sala ainda não está pronta.");
  currentRoomSubscription?.();clearPresence();stopGuess();stopSubmissions();currentGuessRound="";
  roomId=id;room=null;
  currentRoomSubscription=roomGateway.watchRoom(id,value=>{room=value;watchRankingIfNecessary(id,value);render()},error);
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
function startDemo(){startDemoLobby();startDemoFromLobby()}
function localChooseRound(){
 const chooser=createPartyGame({api:{},getPuzzles:()=>DATA.puzzles,getRankings:()=>DATA.rankings,randomIndex:random});
 Object.assign(room,chooser.chooseRound(room));
 room.phase="playing";
 room.localGuesses={};ownGuess="";submitted={};guessDrafts={};travelTurnOpen=false;
 // O adversário é explicitamente simulado e nunca é um jogador conectado.
 if(room.members.guest){
   const r=room.round;
   room.localGuesses.guest=r.type==="letters"?DATA.puzzles[r.index].answer:rankData(r).items[Math.min(r.limit-1,r.target+1)];
   submitted.guest=true;
 }
 render();
}
function nextLocalRound(){localAdvance(false)}

function startDemoLobby(){
 currentRoomSubscription?.();currentRoomSubscription=null;clearPresence();stopGuess();stopSubmissions();currentGuessRound="";
 localDemo=true;roomId="DEMO45";
 room={host:"local",mode:modeChoice,phase:"lobby",number:0,match:1,roundLimit:5,localGame:true,
 members:{local:{uid:"local",nick:"Você (demo)",joined:Date.now(),online:true},
 guest:{uid:"guest",nick:"Amigo simulado",joined:Date.now()+1,online:true}},
 scores:{local:0,guest:0},roundHistory:{},usedLetters:[],usedRanks:[]};
 render();
}

function startDemoFromLobby(){
 if(!localDemo||room?.phase!=="lobby")return;
 localChooseRound();
}

function localScoreCurrentRound(){
 if(room.round.scored)return;
 const r=room.round;
 if(r.type==="rank"){
   if(!r.resultReady)throw Error("Revele os palpites antes de pontuar.");
   const awarded={};
   for(const result of Object.values(r.review||{})){
     awarded[result.uid]=result.points||0;
     room.scores[result.uid]=(room.scores[result.uid]||0)+(result.points||0);
   }
   room.roundHistory[r.id]={id:r.id,number:room.number,type:"rank",categoryId:r.categoryId,
     target:r.target,limit:r.limit,review:r.review,awarded,overrides:r.overrides||{}};
 }else{
   const awarded={};
   for(const result of Object.values(r.review||{})){
     awarded[result.uid]=result.points||0;
     room.scores[result.uid]=(room.scores[result.uid]||0)+(result.points||0);
   }
   room.roundHistory[r.id]={id:r.id,number:room.number,type:"letters",index:r.index,hints:r.hints||0,winner:"",review:r.review,awarded};
 }
 r.scored=true;
}

function localAdvance(finish){
 if(!localDemo||!room?.round?.revealed||room.round.scored)return;
 localScoreCurrentRound();
 if(finish||room.number>=5){room.phase="finished";render();return}
 localChooseRound();
}

function finishLocalDemo(){localAdvance(true)}

function localSubmitGuess(guess){
 const text=String(guess||"").trim();
 if(!text||text.length>120)throw Error("Digite um palpite entre 1 e 120 caracteres.");
 room.localGuesses??={};
 if(room.localShared){
  const player=travelPlayer();
  if(!travelTurnOpen||!player)return;
  room.localGuesses[player.uid]=text;travelTurnOpen=false;guessDrafts={};room.round.hints=0;
 }else{room.localGuesses.local=text;ownGuess=text;submitted.local=true;}
 render();
}

function localReveal(){
 const r=room.round;
 if(room.localShared&&travelPlayer())throw Error('Espere todos responderem antes de revelar.');
 if(r.revealed){render();return}
 r.revealed=true;
 if(r.type==="rank"){
   r.guesses={...(room.localGuesses||{})};
   r.review=localRankScore(r);
   r.resultReady=true;
 }else{
   r.review=calculatePhrase({puzzle:DATA.puzzles[r.index],guesses:room.localGuesses||{},members:Object.keys(room.members)});
   r.resultReady=true;
 }
 render();
}

function localCorrectRanking({player,position,reason}){
 const r=room.round;
 if(r.type!=="rank"||!r.resultReady||r.scored)throw Error("Esta rodada não permite correções.");
 const pos=Number(position),explanation=String(reason||"").trim();
 if(!Number.isInteger(pos)||pos<0||pos>r.limit)throw Error("Informe a posição de 0 até "+r.limit);
 if(explanation.length<8)throw Error("Escreva uma justificativa com pelo menos 8 caracteres.");
 if(!room.members[player])throw Error("Jogador não encontrado.");
 r.overrides??={};r.overrides[player]={position:pos,reason:explanation};
 r.review=localRankScore(r);render();
}
async function handle(action){if(busy)return;busy=true;try{if(action==='travel-start'){startTravel()}
else if(action==='travel-add'){if(travelNames.length<8)travelNames.push('Amigo '+(travelNames.length+1));render()}
else if(action==='travel-remove'){if(travelNames.length>2)travelNames.pop();render()}
else if(action==='travel-open'&&room?.localShared&&travelPlayer()){travelTurnOpen=true;render()}
else if(action==='travel-skip'&&room?.localShared&&travelTurnOpen){const player=travelPlayer();if(player){room.localGuesses[player.uid]='';travelTurnOpen=false;guessDrafts={};room.round.hints=0;render()}}
else if(action==='travel-pause'){saveTravel();room=null;roomId=null;localDemo=false;travelTurnOpen=false;guessDrafts={};render()}
else if(action==='travel-resume'){
 const saved=savedTravel();if(!saved)throw Error('A partida salva não está disponível. Comece uma nova.');
 currentRoomSubscription?.();currentRoomSubscription=null;clearPresence();stopGuess();stopSubmissions();currentGuessRound='';
 room=saved;roomId='VIAGEM';localDemo=true;travelTurnOpen=false;guessDrafts={};render();
}
else if(action==="demo"){startDemo()}
else if(action==="demo-lobby"){startDemoLobby()}
else if(action==="stop-demo"){localDemo=false;room=null;roomId=null;guessDrafts={};render()}
else if(action==="leave-room"||action==="home"){
  saveTravel();travelTurnOpen=false;guessDrafts={};
  currentRoomSubscription?.();currentRoomSubscription=null;clearPresence();stopGuess();stopSubmissions();currentGuessRound="";
  localDemo=false;room=null;roomId=null;const q=new URLSearchParams(location.search);q.delete("room");
  history.replaceState(null,"",location.pathname+(q.size?"?"+q.toString():""));render()
}
else if(action==="close-room"){if(!isHost()||!roomGateway)throw Error("Apenas o anfitrião pode encerrar.");await roomGateway.closeRoom(roomId)}
else if(action==="retry-data"){await loadData()}
else if(action==="hint"&&localDemo){if(room.round?.type==='letters'){room.round.hints=Math.min(2,room.round.hints+1);render()}}
else if(action==="reveal"&&localDemo){localReveal()}
else if(['choose-letters','choose-rank','choose-mixed'].includes(action)){modeChoice=action.replace('choose-','').replace('rank','rank');render();const field=$('#mode');if(field)field.value=modeChoice}
else if(action==='create'){if(!onlineReady()||!roomGateway)throw Error('Salas online indisponíveis. Use Jogar neste aparelho ou configure o Firebase.');const name=getNick();const result=await roomGateway.createRoom({nick:name,mode:selectedMode()});connectRoom(result.code)}
else if(action==='join'){if(!onlineReady())throw Error('Salas online indisponíveis. Use Jogar neste aparelho.');const name=getNick();const id=($('#join-code')?.value||pendingJoinCode||new URLSearchParams(location.search).get('room')||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(id.length!==6)throw Error('Digite um código de sala válido com 6 caracteres.');await joinRoom(id,name)}
else if(action==='copy'){
 const url=location.origin+location.pathname+'?room='+roomId+(emulatorMode?'&emulator=1':'');
 try{if(!navigator.clipboard?.writeText)throw Error('Clipboard indisponível');await navigator.clipboard.writeText(url);const b=$('[data-action="copy"]');if(b)b.textContent='✓ Link copiado'}
 catch{const field=$('#invite');if(field){field.focus();field.select()}else throw Error('Copie o convite manualmente: '+url)}
}
else if(action==='import'&&isHost()){throw Error('Importação de rankings estará disponível após a curadoria das fontes.')}
else if(action==='start-game'&&localDemo){startDemoFromLobby()}
else if(action==='start-game'){if(!isHost()||!partyGame)throw Error('Somente o anfitrião pode iniciar.');await partyGame.start(roomId)}
else if(action==='next'&&localDemo){nextLocalRound()}
else if(action==='next'){if(!partyGame||!isHost())throw Error('Somente o anfitrião avança.');await partyGame.advance(roomId)}
else if(action==='finish-game'&&localDemo){finishLocalDemo()}
else if(action==='finish-game'){if(!partyGame||!isHost())throw Error('Somente o anfitrião encerra.');await partyGame.advance(roomId,{finish:true})}
else if(action==='rematch'&&isHost()){
 if(localDemo){room.match++;room.phase="lobby";room.number=0;room.scores=Object.fromEntries(members().map(m=>[m.uid,0]));room.roundHistory={};delete room.round;if(room.localShared)localChooseRound();else render()}
 else await partyGame.rematch(roomId);
}
else if(action==='hint'&&isHost()&&partyGame){await partyGame.hint(roomId)}
else if(action==='reveal'&&isHost()&&partyGame){if(room.round?.type==='rank')await partyGame.revealRanking(roomId);else await partyGame.revealPhrase(roomId)}
else if(action==='guess'&&room?.round&&!room.round.revealed){
 const guess=($('#guess')?.value||guessDrafts[roomId+':'+room.round.id]||'').trim();
 if(localDemo)localSubmitGuess(guess);
 else{if(!partyGame)throw Error('Partida indisponível.');ownGuess=await partyGame.submitGuess(roomId,guess);delete guessDrafts[roomId+':'+room.round.id];render()}
}
else if(action==='override'&&isHost()&&room?.round?.type==='rank'){
 const player=$('#override-player')?.value,position=Number($('#override-pos')?.value);
 const reason=($('#override-reason')?.value||rankOverrideReason||'').trim();
 if(localDemo)localCorrectRanking({player,position,reason});
 else{if(!partyGame)throw Error('Partida indisponível.');await partyGame.correctRanking(roomId,{player,position,reason})}
 rankOverrideReason='';
}
}catch(e){error(e)}finally{busy=false}}
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b){e.preventDefault?.();handle(b.dataset.action)}});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing&&e.target.id==='guess'){e.preventDefault();handle('guess')}});
document.addEventListener('change',e=>{if(e.target.id==='mode')modeChoice=e.target.value});
document.addEventListener('input',e=>{if(e.target.id==='nick')nick=e.target.value;if(e.target.id==='join-code')pendingJoinCode=e.target.value;if(e.target.dataset?.player!==undefined)travelNames[Number(e.target.dataset.player)]=e.target.value;if(e.target.id==='guess'&&room?.round)guessDrafts[roomId+':'+room.round.id]=e.target.value;if(e.target.id==='override-reason')rankOverrideReason=e.target.value});
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
    const [fa,au,da,gatewayModule,phraseModule,partyModule]=await Promise.all([
      import("https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js"),
      import("https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js"),
      import("./rooms-v2.js"),
      import("./phrases-v3.js"),
      import("./party-game-v5.js")
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
        if(!user){uid=null;roomGateway=null;phraseGame=null;partyGame=null;connectionState="unavailable";connectionProblem="Autenticação indisponível.";render();return}
        uid=user.uid;
        roomGateway=gatewayModule.makeRoomGateway({
          db,uid,api:{ref:da.ref,get:da.get,set:da.set,runTransaction:da.runTransaction,
            onValue:da.onValue,onDisconnect:da.onDisconnect,serverTimestamp:da.serverTimestamp}
        });
        phraseGame=phraseModule.makePhraseGame({db,uid,api:{ref:da.ref,get:da.get,runTransaction:da.runTransaction},getPuzzles:()=>DATA.puzzles,randomIndex:random});
        partyGame=partyModule.createPartyGame({db,uid,api:{ref:da.ref,get:da.get,set:da.set,runTransaction:da.runTransaction,onValue:da.onValue},getPuzzles:()=>DATA.puzzles,getRankings:()=>DATA.rankings,randomIndex:random});
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
    uid=null;db=null;roomGateway=null;phraseGame=null;partyGame=null;connectionState="unavailable";
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
