import {parseHostRanking} from "./catalog-v6.js";
import {calculatePhrase} from "./phrase-tools.js";
import {calculateRanking} from "./rank-tools-v5.js";
import {createPartyGame} from "./party-game-v5.js";
const $=s=>document.querySelector(s), app=$('#app');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,' ').trim().replace(/\s+/g,' ');
const random=n=>{const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n};
const pick=a=>a[random(a.length)];
const code=()=>Array.from({length:6},()=> 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[random(32)]).join('');
const btn=(label,action,cls='',disabled=false)=>`<button class="btn ${cls}" data-action="${action}" ${disabled?'disabled title="Salas online indisponíveis"':''}>${label}</button>`;
const wrap=(html)=>`<div class="hero"><div class="eyebrow">RIVIERA SHOWDOWN • JOGOS COM AMIGOS</div><h1>Seu grupo. <span class="purple">Seu jogo.</span></h1><p class="lead">Entre com um nick, compartilhe o convite e jogue em tempo real. Cinco rodadas, respostas privadas e um pódio para decidir a revanche.</p></div>${html}`;
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
let renderedScreen='',roundLimitChoice=5,importFormOpen=false,importStatus="",importedRankId="",phraseOverrideReason="";
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
  return wrap(`<div class="grid modes"><button class="panel mode ${modeChoice==="letters"?"selected":""}" data-action="choose-letters"><div class="emoji">🧩</div><h2>Decifre a Frase</h2><p>Descubra expressões e curiosidades com números e iniciais. Duas dicas e revelação da resposta.</p></button><button class="panel mode orange ${modeChoice==="rank"?"selected":""}" data-action="choose-rank"><div class="emoji">🏆</div><h2>Estimativa de Ranking</h2><p>Acerte posições em rankings reais: países, filmes e economias. Dispute pontos com seu grupo.</p></button><button class="panel mode ${modeChoice==="mixed"?"selected":""}" data-action="choose-mixed"><div class="emoji">🎲</div><h2>Modo Misturado</h2><p>Alterne rodadas de frases e rankings, com um placar compartilhado.</p></button></div>
<section class="panel homejoin" aria-label="Jogar neste aparelho"><div class="row between"><div><div class="eyebrow">PRÉVIA LOCAL • SEM CADASTRO</div><h2>Jogar neste aparelho</h2></div><span class="pill">🎲 Três modos</span></div><p>Experimente os três modos. Você pode jogar frases, estimar posições e alternar jogos com placar simulado, sem internet.</p><div class="actions"><label class="stack" style="max-width:320px"><span class="label">Rodadas por partida</span><select class="field" id="round-limit-local"><option value="3" ${roundLimitChoice===3?"selected":""}>3 rodadas</option><option value="5" ${roundLimitChoice===5?"selected":""}>5 rodadas · padrão</option><option value="10" ${roundLimitChoice===10?"selected":""}>10 rodadas</option></select></label>${btn("▶ Jogar neste aparelho","demo","lime")}${btn("👑 Testar lobby e placar","demo-lobby","ghost")}${dataProblem?btn("↻ Tentar carregar conteúdo","retry-data","ghost"):""}</div>${dataProblem?`<p class="notice" role="status">${esc(dataProblem)}. Uma rodada de reserva está disponível.</p>`:""}</section>
<section class="panel homejoin"><div class="row between"><div><div class="eyebrow">CURADORIA DA COMUNIDADE</div><h2>Importar um ranking próprio</h2></div><span class="pill">Lista não verificada</span></div>
<p class="tiny">Experimente seu Top 10–1000 na prévia local, com fonte e edição. Não será distribuído aos amigos como catálogo oficial sem revisão.</p>
${btn(importFormOpen?"Ocultar importador":"📥 Importar lista para testar","toggle-import","ghost")}
${importFormOpen?`<div class="stack cardline">
<div class="grid"><label><span class="label">Título</span><input class="field" id="import-title" placeholder="Ex.: Top 10 jogadores"></label>
<label><span class="label">Nome da fonte</span><input class="field" id="import-source" placeholder="Ex.: Dados fornecidos pelo grupo"></label></div>
<label><span class="label">URL de referência HTTPS</span><input class="field" id="import-url" placeholder="https://..."></label>
<div class="grid"><label><span class="label">Edição / período</span><input class="field" id="import-snapshot" placeholder="Edição novembro 2026"></label>
<label><span class="label">Data da observação (AAAA-MM-DD)</span><input class="field" id="import-observed" placeholder="2026-11-10"></label></div>
<label><span class="label">Critério e metodologia</span><input class="field" id="import-method" placeholder="Ordem por quantidade de..."></label>
<label><span class="label">Itens ordenados (um por linha)</span><textarea class="field" id="import-items" rows="7" placeholder="1. Primeiro item&#10;2. Segundo item&#10;..."></textarea></label>
${btn("Validar e usar em ranking local","import-user","lime")}</div>`:""}
${importStatus?`<p class="notice" role="status">${esc(importStatus)}</p>`:""}</section>
<section class="panel homejoin" aria-label="Salas online"><div class="row between"><div><div class="eyebrow">SALA ONLINE</div><h2>Crie ou entre com um convite</h2></div><span class="pill">${online?"● Disponível":"○ Indisponível"}</span></div><p class="tiny" role="status">${esc(help)}</p>${connectionProblem?`<p class="notice tiny">${esc(connectionProblem)}</p>`:""}
<div class="grid"><div class="stack"><label><span class="label">Seu nick</span><input class="field" id="nick" maxlength="28" placeholder="Como quer aparecer?" value="${esc(nick)}"></label><label><span class="label">Modo da sala</span><select class="field" id="mode"><option value="letters" ${modeChoice==="letters"?"selected":""}>🧩 Decifre a Frase</option><option value="rank" ${modeChoice==="rank"?"selected":""}>🏆 Ranking</option><option value="mixed" ${modeChoice==="mixed"?"selected":""}>🎲 Misturado</option></select></label><label><span class="label">Rodadas por partida</span><select class="field" id="round-limit"><option value="3" ${roundLimitChoice===3?"selected":""}>3 rodadas</option><option value="5" ${roundLimitChoice===5?"selected":""}>5 rodadas · padrão</option><option value="10" ${roundLimitChoice===10?"selected":""}>10 rodadas</option></select></label>${btn("Criar sala e gerar convite →","create","lime",!online)}</div>
<div class="stack"><label><span class="label">Código de convite</span><input class="field" id="join-code" maxlength="10" placeholder="Ex.: TRV7XK" value="${esc(pendingJoinCode||new URLSearchParams(location.search).get("room")||"")}"></label><p class="tiny">Quem recebe o link abre o site, escolhe um nick e entra na sala.</p>${btn("Entrar na sala →","join","primary",!online)}</div></div></section>
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
<div class="cardline stack">${room.closed?'<p class="notice">Esta sala foi encerrada.</p>':isHost()?`${btn(canStart?'▶ Iniciar partida':'Modo disponível em breve','start-game','primary',!canStart)}<p class="tiny">Depois de começar, novos jogadores não entram. ${room.roundLimit||5} rodadas por partida. O anfitrião controla as dicas e a revelação; a pontuação é automática, com revisão de aproximações.</p>${btn('Encerrar sala','close-room','ghost')}`:'<p class="tiny">Aguardando o anfitrião iniciar a partida…</p>'}
${btn('← Voltar ao início','leave-room','ghost')}</div></section>`;
}
function members(){return Object.values(room?.members||{}).sort((a,b)=>(a.joined||0)-(b.joined||0));}
function isHost(){return localDemo||room?.host===uid}
function roster(){return `<div class="roster">${members().map(m=>`<div class="player"><b>${esc(m.nick)} ${m.uid===room.host?'👑':''}</b><span>${m.online?'● Conectado':'○ Desconectado'} · ${room?.scores?.[m.uid]||0} ponto(s)</span></div>`).join('')}</div>`}
function roomHeader(){
  if(localDemo)return `<div class="row between" style="margin-bottom:20px"><div><div class="eyebrow">JOGAR NESTE APARELHO • RODADA ${room?.number||1} DE ${room?.roundLimit||5}</div><h2>Demonstração: ${room.mode==="rank"?"Estimativa de Ranking":room.mode==="mixed"?"Modo Misturado":"Decifre a Frase"}</h2></div>${btn("← Sair da prévia","stop-demo","ghost")}</div>`;
  return `<div class="row between" style="margin-bottom:20px"><div><div class="eyebrow">SALA ${esc(roomId)} • RODADA ${room?.number||0} DE ${room?.roundLimit||5}</div><h2>${room?.mode==="mixed"?"Modo misturado":room?.mode==="rank"?"Estimativa de Ranking":"Decifre a Frase"}</h2></div>${btn("📋 Convidar","copy","ghost")}</div>`;
}
function letters(){
const r=room.round,p=r.content||DATA.puzzles[r.index];
if(!p)return roomHeader()+'<p>Desafio não encontrado. Atualize a página.</p>';
const hints=r.hints>0?`<div class="status" role="status"><b>💡 Dica 1:</b> ${esc(p.hints?.[0]||'Sem dica')}${r.hints>1?`<p><b>💡 Dica 2:</b> ${esc(p.hints?.[1]||'Sem dica')}</p>`:''}</div>`:'<p class="tiny muted" style="text-align:center">Aguardando a primeira dica do anfitrião.</p>';
const answer=`<div class="result" role="status"><div class="eyebrow">RESPOSTA REVELADA</div><strong>${esc(p.answer)}</strong><p>${esc(p.explain||'')}</p></div>`;
const host=isHost()?`<div class="actions">${btn('💡 Liberar dica '+Math.min(2,r.hints+1)+'/2','hint','ghost',r.hints>=2||r.revealed)}${btn('👁 Revelar resposta','reveal','primary',r.revealed)}</div>`:'<p class="tiny">O anfitrião controla as dicas e a revelação.</p>';
const own=localDemo?room.localGuesses?.local||"":ownGuess;
const guess=guessDrafts[`${roomId}:${r.id}`]??own;
const sent=localDemo?Object.keys(room.localGuesses||{}).length:Object.values(submitted||{}).filter(Boolean).length;
const input=`<label class="stack"><span class="label">Sua resposta</span><input class="field" id="guess" maxlength="120" autocomplete="off" placeholder="Decifre os números e as iniciais" value="${esc(guess)}"></label>${btn(own?'✓ Atualizar minha resposta':'Enviar minha resposta →','guess','lime')}<p class="tiny" role="status">🔒 ${sent}/${members().length} jogadores enviaram. Respostas privadas até a revelação. ${own?'Sua resposta salva: '+esc(own):''}</p>`;
const scoring=r.revealed?`<div class="cardline"><h3>Resultado da rodada</h3>${r.resultReady?Object.values(r.review||{}).map(row=>`<div class="history-row"><span>${esc(room.members?.[row.uid]?.nick||'Jogador')}: ${esc(row.guess||'Sem resposta')}</span><b>${row.points===1?'✓ +1 ponto':row.points===0.5?'≈ +0,5 ponto':'Sem ponto'}${row.reason?' · '+esc(row.reason):''}</b></div>`).join(''):'<p>Preparando resultado…</p>'}${isHost()?(r.resultReady?phraseReviewControls()+advanceButtons():btn('Atualizar apuração','reveal','primary')):''}</div>`:'';
return `${roomHeader()}<div class="game-layout"><section class="panel round-panel stack"><div class="row between"><span class="pill">🧩 RODADA ${room.number}</span><span class="pill">${r.hints}/2 dicas</span></div>
<div class="options"><span class="pill">${esc(p.topic||'Cultura geral')}</span><span class="pill">${esc(p.level||'Geral')}</span></div>
<div class="largecode">${esc(p.code)}</div><p class="muted" style="text-align:center">O que significam os números e as iniciais?</p>
${r.revealed?answer:hints}${!r.revealed?input+host:''}${scoring}
${!localDemo&&!room.members?.[room.host]?.online?'<div class="notice">⚠ O anfitrião está offline. A rodada continuará quando ele voltar.</div>':''}
</section>${localDemo&&Object.keys(room.members||{}).length<2?'':`<aside class="panel scoreboard"><div class="eyebrow">PLACAR</div><h3>Quem está liderando?</h3>${roster()}<p class="tiny">${Object.keys(room.roundHistory||{}).length} rodada(s) concluída(s).</p></aside>`}</div>`;
}
function rankData(r){return r.catalog||DATA.rankings.find(x=>x.id===r.categoryId)}

function localRankScore(r){
 return calculateRanking({list:rankData(r),limit:r.limit,target:r.target,guesses:room.localGuesses||{},members:Object.keys(room.members||{}),overrides:r.overrides||{}});
}
function phraseReviewControls(){
 const r=room.round;
 return `<div class="round-decision"><div class="eyebrow">REVISAR RESPOSTA APROXIMADA</div><p class="tiny">Respostas exatamente equivalentes recebem +1 automaticamente. Quando o sentido principal está certo mas faltam detalhes, o anfitrião pode dar +0,5 com justificativa visível.</p>
 <label class="label" for="phrase-override-player">Jogador</label><select class="field" id="phrase-override-player">${members().map(m=>`<option value="${esc(m.uid)}">${esc(m.nick)}</option>`).join("")}</select>
 <label class="label" for="phrase-override-points">Pontuação</label><select class="field" id="phrase-override-points"><option value="0.5">≈ Aproximação aceita (+0,5)</option><option value="1">✓ Resposta correta (+1)</option><option value="0">✕ Resposta incorreta (0)</option></select>
 <label class="label" for="phrase-override-reason">Justificativa</label><input class="field" id="phrase-override-reason" maxlength="180" value="${esc(phraseOverrideReason)}" placeholder="Ex.: acertou a ideia, mas faltou o contexto histórico">
 ${btn("Salvar revisão antes da próxima rodada","correct-phrase","ghost")}</div>`;
}
function advanceButtons(){
 return `<div class="actions">${btn(room.number>=(room.roundLimit||5)?"🏆 Ver pódio":"Próxima rodada →","next","lime")}${room.number<(room.roundLimit||5)?btn("🏁 Finalizar partida","finish-game","ghost"):""}</div>`;
}

function rankReview(r){
 if(!r.resultReady||!r.review)return `<div class="notice" role="status">🔎 ${isHost()?"Preparando resultado. Se necessário, toque em Revelar novamente.":"O anfitrião está calculando as distâncias."}</div>${isHost()?btn("Atualizar apuração","reveal","ghost"):""}`;
 const ordered=Object.values(r.review).sort((a,b)=>(a.delta??Infinity)-(b.delta??Infinity)||a.uid.localeCompare(b.uid));
 const rows=ordered.map(row=>`<tr><td>${row.place?"#"+row.place:"—"}</td><td>${esc(room.members?.[row.uid]?.nick||room.profiles?.[row.uid]?.nick||"Jogador")}</td><td>${esc(row.guess||"Sem palpite")}${row.reason?`<div class="tiny highlight">✎ ${esc(row.reason)}</div>`:""}</td><td>${row.position||"—"}</td><td>${row.delta??"—"}</td><td class="highlight">+${row.points||0}</td></tr>`).join("");
 return `<div class="cardline"><div class="eyebrow">RESULTADOS · DISTÂNCIA ABSOLUTA</div><h3>Quem chegou mais perto?</h3>
 <div class="tablewrap"><table class="board"><thead><tr><th>Lugar</th><th>Jogador</th><th>Palpite</th><th>Posição</th><th>Distância</th><th>Pontos</th></tr></thead><tbody>${rows}</tbody></table></div>
 <p class="tiny">Diferença absoluta da posição-alvo. 1º +5 · 2º +3 · 3º +1. Empates dividem a colocação; respostas inválidas não pontuam.</p>
 ${isHost()?`<div class="round-decision"><div class="eyebrow">AJUSTE MANUAL JUSTIFICADO</div><p class="tiny">Use somente quando uma tradução ou sinônimo for reconhecido. A justificativa ficará visível a todos.</p>
 <div class="grid"><label class="stack"><span class="label">Jogador</span><select class="field" id="override-player">${ordered.map(x=>`<option value="${esc(x.uid)}">${esc(room.members?.[x.uid]?.nick||"Jogador")}</option>`).join("")}</select></label>
 <label class="stack"><span class="label">Posição (0 = inválido)</span><input class="field" id="override-pos" type="number" min="0" max="${r.limit}" placeholder="Ex.: 12"></label></div>
 <label class="stack"><span class="label">Por que corrigiu?</span><textarea class="field" id="override-reason" maxlength="180" placeholder="Ex.: nome alternativo do item na 12ª posição"></textarea></label>
 ${btn("Salvar correção antes da pontuação","override","ghost")}</div>
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
 <div class="rank-source"><b>${esc(d.source||"Fonte")}</b> · ${esc(d.snapshot||"Data não informada")} · ${sourceLink}</div>
 ${locked?`<div class="result" role="status"><div class="eyebrow">RESPOSTA DA POSIÇÃO ${r.target}º</div><strong>${esc(d.items[r.target-1])}</strong><p>Referência: ${esc(d.source||"")}</p></div>${rankReview(r)}`:
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
<div class="cardline"><h3>Resumo das ${rounds.length} rodadas</h3>${rounds.map(x=>`<div class="history-row"><span>${x.type==="rank"?"🏆":"🧩"} Rodada ${x.number} · ${esc(x.type==="rank"?(x.catalog?.title||DATA.rankings.find(d=>d.id===x.categoryId)?.title||"Ranking")+" · alvo "+x.target+"º / Top "+x.limit:x.content?.code||DATA.puzzles[x.index]?.code||"")}</span><b>${x.awarded?esc(Object.entries(x.awarded||{}).map(([key,points])=>(room.members?.[key]?.nick||"Jogador")+": +"+points).join(" · ")):esc(x.winner?room.members?.[x.winner]?.nick||"Jogador":"Sem vencedor")}</b></div>`).join("")}</div>
<div class="actions cardline">${btn('← Voltar ao início','leave-room','primary')}${isHost()?btn('↻ Jogar revanche','rematch','lime',room.closed):''}${isHost()&&!localDemo?btn('Encerrar sala','close-room','ghost',room.closed):''}</div></section>`;
}
function render(){
 status();const active=document.activeElement,focusId=active?.id||null;
 const value=focusId?active.value:null;
 const previousRound=app.dataset?.round;
 const banner=err?`<div role="alert" class="status error">${esc(err)}</div>`:'';
 err='';
 app.innerHTML=banner+(!room?home():room.phase==='finished'?finishedGame():room.round?(room.round.type==='letters'?letters():ranking()):waiting());
 const screen=`${roomId||'home'}:${room?.phase||''}:${room?.round?.id||''}`;
 if(screen!==renderedScreen){renderedScreen=screen;window.scrollTo?.(0,0)}
 const sameRound=previousRound===room?.round?.id;if(app.dataset)app.dataset.round=room?.round?.id||"";
 if(focusId&&sameRound){const el=document.getElementById(focusId);if(el&&!el.disabled){if(value!==null&&el.tagName!=='SELECT'&&focusId!=='invite')el.value=value;el.focus({preventScroll:true})}}
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
 const localLists=importedRankId&&room.mode==="rank"?DATA.rankings.filter(l=>l.id===importedRankId).map(l=>({...l,status:"verified-reference"})):DATA.rankings;
 const chooser=createPartyGame({api:{},getPuzzles:()=>DATA.puzzles,getRankings:()=>localLists,randomIndex:random});
 Object.assign(room,chooser.chooseRound(room));
 room.phase="playing";
 room.localGuesses={};ownGuess="";submitted={};guessDrafts={};
 // O adversário é explicitamente simulado e nunca é um jogador conectado.
 if(room.members.guest){
   const r=room.round;
   room.localGuesses.guest=r.type==="letters"?(r.content||DATA.puzzles[r.index]).answer:rankData(r).items[Math.min(r.limit-1,r.target+1)];
   submitted.guest=true;
 }
 render();
}
function nextLocalRound(){localAdvance(false)}

function startDemoLobby(){
 currentRoomSubscription?.();currentRoomSubscription=null;clearPresence();stopGuess();stopSubmissions();currentGuessRound="";
 localDemo=true;roomId="DEMO45";
 room={host:"local",mode:modeChoice,phase:"lobby",number:0,match:1,roundLimit:roundLimitChoice,localGame:true,
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
 if(finish||room.number>=(room.roundLimit||5)){room.phase="finished";render();return}
 localChooseRound();
}

function finishLocalDemo(){localAdvance(true)}

function localSubmitGuess(guess){
 const text=String(guess||"").trim();
 if(!text||text.length>120)throw Error("Digite um palpite entre 1 e 120 caracteres.");
 room.localGuesses??={};
 room.localGuesses.local=text;ownGuess=text;submitted.local=true;
 render();
}

function localReveal(){
 const r=room.round;
 if(r.revealed){render();return}
 r.revealed=true;
 if(r.type==="rank"){
   r.guesses={...(room.localGuesses||{})};
   r.review=localRankScore(r);
   r.resultReady=true;
 }else{
   r.review=calculatePhrase({puzzle:r.content||DATA.puzzles[r.index],guesses:room.localGuesses||{},members:Object.keys(room.members)});
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
function localCorrectPhrase({player,points,reason}){
 const r=room.round;const score=Number(points),note=String(reason||"").trim();
 if(r.type!=="letters"||!r.resultReady||r.scored)throw Error("Frase indisponível para revisão.");
 if(!room.members[player]||![0,0.5,1].includes(score))throw Error("Jogador ou pontuação inválida.");
 if(score===0.5&&note.length<8)throw Error("Justifique a aproximação em pelo menos 8 caracteres.");
 const previous=r.review[player];if(!previous)throw Error("Resposta não encontrada.");
 r.review[player]={...previous,points:score,correct:score===1,approximate:score===0.5,...(note?{reason:note}:{})};
 r.overrides??={};r.overrides[player]={points:score,reason:note||"Avaliação do anfitrião"};render();
}
async function handle(action){if(busy)return;busy=true;try{if(action==="demo"){startDemo()}
else if(action==="demo-lobby"){startDemoLobby()}
else if(action==="stop-demo"){localDemo=false;room=null;roomId=null;guessDrafts={};render()}
else if(action==="leave-room"){
  currentRoomSubscription?.();currentRoomSubscription=null;clearPresence();stopGuess();stopSubmissions();currentGuessRound="";
  localDemo=false;room=null;roomId=null;const q=new URLSearchParams(location.search);q.delete("room");
  history.replaceState(null,"",location.pathname+(q.size?"?"+q.toString():""));render()
}
else if(action==="close-room"){if(!isHost()||!roomGateway)throw Error("Apenas o anfitrião pode encerrar.");await roomGateway.closeRoom(roomId)}
else if(action==="retry-data"){await loadData()}
else if(action==="hint"&&localDemo){if(room.round?.type==='letters'){room.round.hints=Math.min(2,room.round.hints+1);render()}}
else if(action==="reveal"&&localDemo){localReveal()}
else if(['choose-letters','choose-rank','choose-mixed'].includes(action)){modeChoice=action.replace('choose-','').replace('rank','rank');render();const field=$('#mode');if(field)field.value=modeChoice;$('#nick')?.focus()}
else if(action==='create'){if(!onlineReady()||!roomGateway)throw Error('Salas online indisponíveis. Use Jogar neste aparelho ou configure o Firebase.');const name=getNick();const result=await roomGateway.createRoom({nick:name,mode:selectedMode(),roundLimit:Number($('#round-limit')?.value||roundLimitChoice)});connectRoom(result.code)}
else if(action==='join'){if(!onlineReady())throw Error('Salas online indisponíveis. Use Jogar neste aparelho.');const name=getNick();const id=($('#join-code')?.value||pendingJoinCode||new URLSearchParams(location.search).get('room')||'').toUpperCase().replace(/[^A-Z0-9]/g,'');if(id.length!==6)throw Error('Digite um código de sala válido com 6 caracteres.');await joinRoom(id,name)}
else if(action==='copy'){
 const url=location.origin+location.pathname+'?room='+roomId+(emulatorMode?'&emulator=1':'');
 try{if(!navigator.clipboard?.writeText)throw Error('Clipboard indisponível');await navigator.clipboard.writeText(url);const b=$('[data-action="copy"]');if(b)b.textContent='✓ Link copiado'}
 catch{const field=$('#invite');if(field){field.focus();field.select()}else throw Error('Copie o convite manualmente: '+url)}
}
else if(action==='toggle-import'){importFormOpen=!importFormOpen;render()}
else if(action==='import-user'){const candidate=parseHostRanking({title:$('#import-title')?.value,source:$('#import-source')?.value,url:$('#import-url')?.value,snapshot:$('#import-snapshot')?.value,observedAt:$('#import-observed')?.value,methodology:$('#import-method')?.value,items:$('#import-items')?.value});DATA.rankings=DATA.rankings.filter(l=>l.id!==candidate.id);DATA.rankings.push(candidate);importedRankId=candidate.id;modeChoice='rank';importStatus='Lista validada para demonstração local: '+candidate.items.length+' itens. Escolha Testar lobby e placar.';importFormOpen=false;render()}
else if(action==='import'&&isHost()){throw Error('Importação em salas reais requer validação editorial. Use prévia local.')}
else if(action==='start-game'&&localDemo){startDemoFromLobby()}
else if(action==='start-game'){if(!isHost()||!partyGame)throw Error('Somente o anfitrião pode iniciar.');await partyGame.start(roomId)}
else if(action==='next'&&localDemo){nextLocalRound()}
else if(action==='next'){if(!partyGame||!isHost())throw Error('Somente o anfitrião avança.');await partyGame.advance(roomId)}
else if(action==='finish-game'&&localDemo){finishLocalDemo()}
else if(action==='finish-game'){if(!partyGame||!isHost())throw Error('Somente o anfitrião encerra.');await partyGame.advance(roomId,{finish:true})}
else if(action==='rematch'&&isHost()){
 if(localDemo){room.match++;room.phase="lobby";room.number=0;room.scores={local:0,guest:0};room.roundHistory={};delete room.round;render()}
 else await partyGame.rematch(roomId);
}
else if(action==='correct-phrase'&&isHost()&&room?.round?.type==='letters'){
 const player=$('#phrase-override-player')?.value,points=Number($('#phrase-override-points')?.value),reason=($('#phrase-override-reason')?.value||phraseOverrideReason||'').trim();
 if(localDemo)localCorrectPhrase({player,points,reason});
 else await partyGame.correctPhrase(roomId,{player,points,reason});
 phraseOverrideReason='';
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
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)handle(b.dataset.action)});
document.addEventListener('change',e=>{if(e.target.id==='mode')modeChoice=e.target.value;if(['round-limit','round-limit-local'].includes(e.target.id))roundLimitChoice=Number(e.target.value)});
document.addEventListener('input',e=>{if(e.target.id==='nick')nick=e.target.value;if(e.target.id==='join-code')pendingJoinCode=e.target.value;if(e.target.id==='guess'&&room?.round)guessDrafts[roomId+':'+room.round.id]=e.target.value;if(e.target.id==='override-reason')rankOverrideReason=e.target.value;if(e.target.id==='phrase-override-reason')phraseOverrideReason=e.target.value});
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
