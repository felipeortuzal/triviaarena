(function clientApp(){
 const root=document.getElementById("app"),notice=document.getElementById("notice");
 const KEY="riviera-cloudflare-session-v1",NICK="riviera-nickname-v1",q=new URLSearchParams(location.search),invite=(q.get("room")||"").trim().toUpperCase();
 let session=null,room=null,ws=null,screen=invite?"join":"home",busy=false,draft="",lastSignature="",serverOffset=0,syncing=false,connectionState="offline",reconnectTimer=null,rankings=[],soundEnabled=false,audioCtx=null,lastReactAt=0;
 const seenReactions=new Set();
 const defaultRankings=[{"id":"area","title":"Maiores países e territórios"},{"id":"population","title":"Mais populosos do planeta"},{"id":"gdp","title":"Maiores economias do mundo"},{"id":"movies","title":"Filmes mais bem avaliados"},{"id":"br-area","title":"Estados por área"},{"id":"br-pop","title":"Estados por população"},{"id":"pokemon","title":"Pokédex Nacional"},{"id":"elementos","title":"Tabela periódica"}];
 try{session=JSON.parse(localStorage.getItem(KEY)||"null")}catch{}
 if(session?.code&&session?.token&&(!invite||session.code===invite))screen="room";
 try{soundEnabled=localStorage.getItem("riviera-sound-v1")==="on"}catch{}
 const e=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 function setNotice(message){notice.textContent=message||"";notice.hidden=!message}
 function updateNetwork(){const n=document.getElementById("net-pill");if(n){const ok=connectionState==="connected"&&navigator.onLine;n.className="net-pill "+(ok?"connected":"disconnected");n.textContent=ok?"● AO VIVO":"○ RECONECTANDO";}}
 async function loadRankings(){if(rankings.length)return;try{const r=await fetch("/api/rankings",{cache:"no-store"});const v=await r.json();if(r.ok&&Array.isArray(v.rankings)){rankings=v.rankings;if(screen==="home")render()}}catch{}}

function renderStatsAndAwards(){
 const players=[...room.players].sort((a,b)=>b.points-a.points||a.nick.localeCompare(b.nick,"pt-BR"));
 const awards=(room.awards||[]).map(a=>`<div class="award-card"><span class="award-emoji">${e(a.emoji)}</span><strong>${e(a.title)}</strong><span>${e((a.nicks||[]).join(", "))}</span></div>`).join("");
 const rows=players.map(p=>{const m=p.stats?.match||{},c=p.stats?.career||{};return `<tr><td>${e(p.nick)}</td><td>${p.points}</td><td>${m.exact||0}</td><td>${m.averageDistance??"—"}</td><td>${c.wins||0}</td></tr>`}).join("");
 const recent=(room.history||[]).slice(-10).reverse().map(h=>`<li><span>R${h.round} · ${e(h.category)}${h.special?" 🚀":""}</span><strong>${e(h.target)}</strong></li>`).join("");
 return `<section class="stats-area"><div class="stats-intro"><span class="kicker">RIVIERA AWARDS</span><h2>QUEM DOMINOU A MESA?</h2><p>Estatísticas válidas apenas nesta sala, preservadas entre revanches.</p></div>${awards?`<div class="awards-grid">${awards}</div>`:""}<div class="stats-table-wrap"><table class="stats-table"><thead><tr><th>JOGADOR</th><th>PTS</th><th>EXATAS</th><th>DESVIO MÉDIO</th><th>VITÓRIAS NA SALA</th></tr></thead><tbody>${rows}</tbody></table></div><p class="stats-footnote">Exatas e desvio: partida atual. Vitórias: histórico de partidas concluídas nesta sala. Empates na liderança contam como vitória para ambos.</p><details class="history"><summary>Histórico recente das rodadas</summary><ol>${recent}</ol></details></section>`;
}

function renderResultScene(){
 const r=room.lastResults;
 const isFinal=room.phase==="finished";
 const leaderboard=[...room.players].sort((a,b)=>b.points-a.points||a.nick.localeCompare(b.nick,"pt-BR"));
 const ranks=[1,0,2];
 const podium=isFinal?`<div class="podium-section"><span class="kicker">OS DONOS DA RIVIERA</span><h2 class="podium-title">PÓDIO DA PARTIDA</h2><div class="podium-places" aria-label="Classificação final">${ranks.map(index=>{const p=leaderboard[index];if(!p)return "";const medal=["🥇","🥈","🥉"][index];return `<div class="podium-place podium-${index+1}" style="--podium-delay:${index*.12}s"><span class="podium-medal" aria-hidden="true">${medal}</span><span class="podium-name">${e(p.nick)}</span><strong>${p.points} <small>PTS</small></strong><span class="podium-position">${index+1}º LUGAR</span></div>`}).join("")}</div>${leaderboard.length>3?`<p class="podium-more">E mais ${leaderboard.length-3} competidores na disputa!</p>`:""}</div>`:"";
 const resultRows=(r?.results||[]).map((p,i)=>`<div class="result-row result-row-animated" style="--reveal-delay:${i*.11}s"><span class="result-symbol">${p.earned>0?"⭐":"•"}</span><div><b>${e(p.nick)}</b><small>${e(p.answer)} ${p.rank?"· posição "+p.rank+" · distância "+p.distance:"· não pontuou"}</small></div><strong>+${p.earned}</strong></div>`).join("");
 return `<section class="game-page reveal-page" data-scene="${isFinal?"finished":"reveal"}"><div class="reveal-header"><span class="kicker">RODADA ${room.round} • RESULTADO ${r?.special?"🚀 TURBO":""}</span><h1>${isFinal?"🏆 FIM DE JOGO":"HORA DA REVELAÇÃO"}</h1><p>${isFinal?"A temporada dessa mesa terminou. Veja quem levou o troféu.":"Quanto menor a distância do ranking, maior a pontuação."}</p></div>${podium}<div class="game-grid"><div class="panel reveal-panel"><span class="kicker">A RESPOSTA CERTA ERA</span><div class="answer-spotlight"><span class="spotlight-stars" aria-hidden="true">✦ ✧ ✦</span><h2 class="revealed">${e(r?.target||"")} <small>(${r?.position}º lugar)</small></h2></div><h3 class="result-subheading">PLACAR DA RODADA ${r?.special?"• PONTOS EM DOBRO":""}</h3><div class="results">${resultRows}</div><div class="actions"><button class="btn ghost" data-op="share-result">📤 COMPARTILHAR RESULTADO</button>${room.isHost?`<button class="btn lime" data-op="${isFinal?"restart":"next"}">${isFinal?"↻ JOGAR REVANCHE":"PRÓXIMA RODADA →"}</button>`:'<p class="waitmsg">Aguardando o anfitrião...</p>'}</div></div>${board()}</div>${isFinal?renderStatsAndAwards():""}</section>`;
}
function renderReactionDock(){
 const emojis=["🔥","😂","👏","🤯","🏆","😎"];
 return `<section class="reaction-dock" aria-label="Reações dos jogadores"><span class="reaction-label">REAGIR À PARTIDA</span><div class="reaction-options">${emojis.map(emoji=>`<button type="button" class="reaction-option" data-op="react" data-emoji="${emoji}" aria-label="Reagir ${emoji}" title="Reagir ${emoji}">${emoji}</button>`).join("")}</div><span class="reaction-tip">Reações visíveis a todos, sem revelar os palpites.</span></section>`;
}
function playSound(kind){
 if(!soundEnabled)return;
 try{
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context)return;
  if(!audioCtx)audioCtx=new Context();
  if(audioCtx.state==="suspended")audioCtx.resume().catch(()=>{});
  const tones=kind==="reveal"?[392,523,784]:kind==="win"?[523,659,880,1046]:kind==="start"?[330,440]:kind==="send"?[660]:[440,550];
  tones.forEach((frequency,i)=>{
   const osc=audioCtx.createOscillator();
   const gain=audioCtx.createGain();
   const at=audioCtx.currentTime+i*.085, duration=kind==="win"?.15:.10;
   osc.type="sine";osc.frequency.setValueAtTime(frequency,at);
   gain.gain.setValueAtTime(.0001,at);gain.gain.exponentialRampToValueAtTime(.028,at+.015);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
   osc.connect(gain);gain.connect(audioCtx.destination);osc.start(at);osc.stop(at+duration+.02);
  });
 }catch{}
}
function showRevealCurtain(previous,next){
 if(!previous||previous.phase!=="playing"||!["reveal","finished"].includes(next.phase))return;
 playSound(next.phase==="finished"?"win":"reveal");
 if(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)return;
 document.querySelectorAll(".reveal-curtain").forEach(node=>node.remove());
 const layer=document.createElement("div");
 layer.className="reveal-curtain";layer.setAttribute("aria-hidden","true");
 layer.innerHTML='<div class="curtain-inner"><span>RIVIERA SHOWDOWN</span><strong>HORA DA<br>VERDADE</strong><span class="curtain-dots">✦ ✦ ✦</span></div>';
 document.body.append(layer);
 setTimeout(()=>{layer.classList.add("curtain-exit");setTimeout(()=>layer.remove(),500)},1350);
}
function paintReactions(events){
 const stage=document.getElementById("reaction-stage");
 if(!stage||!Array.isArray(events))return;
 for(const evt of events){
  if(!evt?.id||seenReactions.has(evt.id))continue;
  seenReactions.add(evt.id);
  const bubble=document.createElement("div");
  bubble.className="reaction-bubble";bubble.setAttribute("role","status");
  const emoji=document.createElement("span");emoji.className="bubble-emoji";emoji.textContent=evt.emoji;
  const nick=document.createElement("span");nick.className="bubble-nick";nick.textContent=evt.nick;
  bubble.append(emoji,nick);stage.append(bubble);
  setTimeout(()=>bubble.remove(),4800);
 }
 if(seenReactions.size>250)seenReactions.clear();
}
function sharingSummary(){
 const rank=[...room.players].sort((a,b)=>b.points-a.points||a.nick.localeCompare(b.nick,"pt-BR"));
 const ranks=rank.map((p,i)=>`${i+1}º ${p.nick}: ${p.points} pts`).join("\n");
 return `🏝️ RIVIERA SHOWDOWN ${room.phase==="finished"?"• RESULTADO FINAL":"• RODADA "+room.round}\n${ranks}\n🎮 ${location.origin}/?room=${session.code}`;
}

function categoryPicker(){
 const all=rankings.length?rankings:defaultRankings;
 const grouped={};
 for(const b of all){const group=b.group||({area:"Geografia",population:"Geografia",gdp:"Economia",movies:"Cinema","br-area":"Brasil","br-pop":"Brasil",pokemon:"Games",elementos:"Ciência"})[b.id]||"Cultura geral";(grouped[group]??=[]).push(b);}
 return '<div class="category-groups">'+Object.entries(grouped).sort((a,b)=>a[0].localeCompare(b[0],"pt-BR")).map(([group,items])=>
 `<details class="category-group"><summary>${e(group)} <small>${items.length} rankings</small></summary><div class="category-picker">${items.map(r=>`<label class="category-check"><input type="checkbox" name="categoryIds" value="${e(r.id)}" checked><span>${e(r.title)}</span></label>`).join("")}</div></details>`).join("")+'</div>';
}
function howToPlayDialog(){
 return `<dialog id="how-dialog" class="how-dialog" aria-labelledby="how-title"><div class="how-panel"><span class="kicker">TUTORIAL DE 1 MINUTO</span><h2 id="how-title">COMO JOGAR</h2><div class="how-steps"><article><span class="step-num">01</span><div><strong>Escolha uma posição</strong><p>O jogo mostra uma categoria e pergunta quem ocupa determinado lugar no ranking. Ex.: qual país aparece em 7º?</p></div></article><article><span class="step-num">02</span><div><strong>Todo mundo responde junto</strong><p>Você tem de 20 a 45 segundos. Cada resposta pertence a um único jogador na rodada; ninguém vê o seu palpite antes do fim.</p></div></article><article><span class="step-num">03</span><div><strong>O mais próximo vence</strong><p>Se o alvo é o 7º e você acertou o 6º, a distância é 1. No modo normal, o 1º ganha 2 pontos e o 2º ganha 1; na corrida até X, só o 1º pontua.</p></div></article></div><p class="how-note">Antes de começar, todos precisam apertar <strong>ESTOU PRONTO</strong>. Em caso de empate na distância, vence quem enviou primeiro. Turbo opcional dobra pontos a cada 3 rodadas.</p><button type="button" class="btn lime how-close" data-op="close-how">ENTENDI, VAMOS JOGAR</button></div></dialog>`;
}
function updateQuickSummary(){
 const form=document.getElementById("create-form"),out=document.getElementById("quick-summary");if(!form||!out)return;
 const n=form.querySelectorAll('[name="categoryIds"]:checked').length;
 out.textContent=`${form.elements.durationSeconds.value}s por rodada · ${n} categorias · ${form.elements.turbo.checked?"Turbo ativado":"Sem Turbo"}`;
}
function updateSuggestions(raw){
 const list=document.getElementById("live-options");if(!list||!room?.question)return;
 const q=String(raw||"").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 if(q.length<2){list.hidden=true;list.innerHTML="";return}
 const values=(room.question.options||[]).map(a=>a.name).filter(n=>n.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(q)).slice(0,6);
 list.innerHTML=values.map(name=>`<button type="button" role="option" class="guess-option" data-op="choose-answer" data-answer="${e(name)}">${e(name)}</button>`).join("");
 list.hidden=!values.length;
}

 function controls(){
  return `<header class="nav"><div class="nav-inner"><img class="brand" src="/assets/riviera-logo-transparent.png" alt="Riviera Showdown"><span class="nav-tag">A ARENA É SUA</span><button type="button" class="sound-toggle" data-op="sound" aria-pressed="${soundEnabled}">${soundEnabled?"🔊 SOM LIGADO":"🔇 SOM DESLIGADO"}</button>${screen==="room"&&session?'<span class="net-pill" id="net-pill">○ CONECTANDO</span>':""}<button class="btn small ghost" data-op="${screen==="room"?"leave":"home"}" type="button">${screen==="room"?"Sair":"Início"}</button></div></header>`;
 }
 function board(){
  return `<div class="board"><div class="board-title"><b>PLACAR</b><span>${room.players.length} JOGADORES</span></div>${room.players.map((p,i)=>`<div class="player"><span class="ranknum">#${i+1}</span><span class="nick">${e(p.nick)} ${p.id===room.host?'<small>👑 ANFITRIÃO</small>':""} ${p.id===room.me?'<small>VOCÊ</small>':""}</span><span class="points">${p.points} <small>PTS</small></span>${room.phase==="playing"?`<span class="sent ${p.submitted?"yes":""}">${p.submitted?"✓ ENVIOU":"AGUARDANDO"}</span>`:room.phase==="lobby"?`<span class="sent ${p.online?"yes":""}">${p.online?"● ONLINE":"○ DESCONECTADO"} · ${p.ready?"✓ PRONTO":"AGUARDANDO"}</span>`:""}${room.phase==="lobby"&&room.isHost&&p.id!==room.me?`<span class="host-tools"><button class="mini-btn" data-op="handoff" data-player="${e(p.id)}" title="Passar a liderança">👑 Tornar host</button><button class="mini-btn danger" data-op="kick" data-player="${e(p.id)}" title="Remover do lobby">Remover</button></span>`:""}</div>`).join("")}</div>`;
 }
 function render(){
  if(room){const input=root.querySelector("#guess");if(input)draft=input.value;}
  let content="";
  if(screen==="home")content=`<section class="hero"><div class="hero-overlay"><span class="kicker">NOITES LONGAS · DISPUTAS ÉPICAS</span><img class="hero-logo" src="/assets/riviera-logo-transparent.png" alt="Riviera Showdown"><h1>Quem conhece mais?<br><em>Que vença o melhor.</em></h1><p>Uma categoria. Uma posição no ranking. De 20 a 45 segundos para acertar. Chame seus amigos e descubra quem manda na resenha.</p><div class="actions"><button class="btn lime" data-op="create">⚡ CRIAR SALA ONLINE</button><button class="btn violet" data-op="join">ENTRAR COM CÓDIGO</button><button class="btn ghost" data-op="how">❔ COMO JOGAR</button>${session?.token?'<button class="btn ghost" data-op="resume">↻ RETOMAR SALA</button>':""}</div></div></section><section class="modes"><div><span class="kicker">O JOGO DA VEZ</span><h2>Estimativa de Ranking</h2><p>Descubra quem ocupa a posição sorteada em listas de cinema, países, economia e muito mais. Quanto menor a distância, mais pontos.</p></div><div class="feature-grid"><div class="feature"><b>⚡ 30 SEGUNDOS</b><span>Todos respondem ao mesmo tempo</span></div><div class="feature"><b>🔒 PALPITES SECRETOS</b><span>Revelação só depois do tempo</span></div><div class="feature"><b>🏆 DOIS FORMATOS</b><span>Por rodadas ou corrida até X</span></div></div><a class="btn textlink" href="/offline.html">▶ Jogar no mesmo aparelho, sem internet</a><div class="future-modes"><span class="kicker">A PRÓXIMA TEMPORADA</span><h2>Novos desafios estão chegando</h2><div class="future-grid"><div class="future-mode"><b>💬 Frases & Aproximações</b><span>Em desenvolvimento</span></div><div class="future-mode"><b>🕵️ Seven</b><span>Em desenvolvimento</span></div></div></div><div class="rank-library"><span class="kicker">BIBLIOTECA ATUALIZADA</span><h2>Categorias que já estão na arena</h2><details class="rank-catalog"><summary>EXPLORAR AS ${rankings.length} CATEGORIAS DISPONÍVEIS</summary><div class="rank-grid">${rankings.map(x=>`<div class="rank-card"><strong>${e(x.title)}</strong><span>${x.count} posições · ${e(x.snapshot)}</span>${x.sourceUrl?`<a href="${e(x.sourceUrl)}" target="_blank" rel="noopener noreferrer">Fonte ↗</a>`:`<small>${e(x.source)}</small>`}</div>`).join("")}</div></details></div></section>`;
  if(screen==="create")content=`<section class="form-page create-2"><div class="kicker">MONTE O SEU ESQUADRÃO • V2.1</div><h1>CRIAR SALA</h1><p>Escolha as regras, convide a turma e dispute o topo.</p><form id="create-form" class="panel stack"><label>SEU APELIDO<input required name="nick" maxlength="24" minlength="2" autofocus value="${e(localStorage.getItem(NICK)||"")}" placeholder="Como vão te chamar?"></label><div class="arena-presets"><span class="kicker">UM TOQUE PARA CONFIGURAR</span><div class="preset-row"><button class="preset-btn selected" type="button" data-op="preset" data-preset="classic">🏝️ Clássico</button><button class="preset-btn" type="button" data-op="preset" data-preset="turbo">🚀 Turbo</button><button class="preset-btn" type="button" data-op="preset" data-preset="marathon">🏆 Maratona</button></div></div><label>MODO DE PONTUAÇÃO<select name="mode" id="mode"><option value="rounds">Por rodadas — 1º +2, 2º +1</option><option value="race">Corrida até X — só 1º +1</option></select></label><label id="target-label">NÚMERO DE RODADAS<input name="target" type="number" min="1" max="20" value="5"></label><details class="advanced-options" id="advanced-options"><summary>⚙️ OPÇÕES AVANÇADAS <small id="quick-summary">30s por rodada · todas as categorias · sem Turbo</small></summary><div class="advanced-inner"><div class="field-row"><label>TEMPO POR RODADA<select name="durationSeconds" id="duration"><option value="20">⚡ 20 segundos</option><option value="30" selected>⏱️ 30 segundos</option><option value="45">🧠 45 segundos</option></select></label><label class="turbo-switch"><input name="turbo" type="checkbox" id="turbo"><span>🚀 RODADA TURBO<small>A cada 3ª rodada: pontos em dobro para todos os colocados.</small></span></label></div><fieldset class="category-fieldset"><legend>CATEGORIAS (escolha pelo menos uma)</legend>${categoryPicker()}<div class="category-actions"><button class="mini-btn" type="button" data-op="categories-all">Selecionar todas</button><button class="mini-btn" type="button" data-op="categories-none">Limpar</button></div></fieldset></div></details><button class="btn lime" type="submit">CRIAR SALA E CONVIDAR AMIGOS</button></form><button class="btn ghost" data-op="home">Voltar</button></section>`;
  if(screen==="join")content=`<section class="form-page"><div class="kicker">ENTRE NA DISPUTA</div><h1>ENTRAR NA SALA</h1><p>Peça o código de seis caracteres ao anfitrião.</p><form id="join-form" class="panel stack"><label>CÓDIGO DA SALA<input name="code" required maxlength="6" minlength="6" style="letter-spacing:.3em;text-transform:uppercase" placeholder="ABC123" value="${e(invite)}"></label><label>SEU APELIDO<input name="nick" required minlength="2" maxlength="24" placeholder="Seu nome de jogo" value="${e(localStorage.getItem(NICK)||"")}"></label><button class="btn lime" type="submit">ENTRAR E JOGAR</button></form><button class="btn ghost" data-op="home">Voltar</button></section>`;
  if(screen==="room"&&!room)content=`<section class="form-page"><h1>CONECTANDO À SALA...</h1><p>Recuperando sua partida.</p></section>`;
  if(screen==="room"&&room){
   if(room.phase==="lobby"){
    const link=location.origin+"/?room="+room.code;
    content=`<section class="game-page"><div class="roombar"><span class="kicker">SALA PRIVADA • ANFITRIÃO: ${e(room.players.find(p=>p.id===room.host)?.nick||"")}</span><span class="roomcode">${e(room.code)}</span><button class="btn small violet" data-op="copy">COPIAR CONVITE</button><button class="btn small ghost" data-op="whatsapp">WHATSAPP ↗</button><button class="btn small ghost" data-op="how">❔ REGRAS</button></div><div class="game-grid"><div class="panel"><span class="kicker">AGUARDANDO O SEU TIME</span><h1>O LOBBY ESTÁ ABERTO</h1><p>Envie o link, peça para entrarem e comece quando estiverem prontos.</p><div class="invite-link">${e(link)}</div><div class="lobby-ready"><strong>${room.players.filter(p=>p.ready).length} / ${room.players.length}</strong> jogadores prontos <button class="btn small ${room.players.find(p=>p.id===room.me)?.ready?"ghost":"lime"}" data-op="ready">${room.players.find(p=>p.id===room.me)?.ready?"✓ ESTOU PRONTO — CANCELAR":"✓ ESTOU PRONTO"}</button></div><div class="config-summary"><b>⚙️ Regras da sala</b><span>${room.config?.durationSeconds||30}s por rodada</span><span>${room.config?.categoryIds?.length||8} categorias</span><span>${room.config?.turbo?"🚀 Turbo a cada 3ª rodada":"Pontuação tradicional"}</span></div><div class="ruleblock"><b>${room.mode==="race"?"Corrida até "+room.target+" pontos":"Partida de "+room.target+" rodadas"}</b><span>${room.mode==="race"?"Só o primeiro ganha 1 ponto por rodada":"Primeiro +2, segundo +1 ponto por rodada"}</span></div>${room.isHost?`<button class="btn lime" data-op="start" ${room.players.length<2||!room.players.every(p=>p.ready)?"disabled":""}>⚡ COMEÇAR PARTIDA (${room.players.filter(p=>p.ready).length}/${room.players.length})</button>${!room.players.every(p=>p.ready)?'<p class="waitmsg">Todos precisam confirmar ESTOU PRONTO para iniciar.</p>':""}`:'<p class="waitmsg">Aguardando o anfitrião começar...</p>'}</div>${board()}</div></section>`;
   }else if(room.phase==="playing"){
    const qn=room.question,me=room.players.find(p=>p.id===room.me),submitted=!!me?.submitted;
    content=`<section class="game-page"><div class="round-head"><div><span class="kicker">RODADA ${room.round}${room.mode==="rounds"?" DE "+room.target:" • CORRIDA ATÉ "+room.target}${room.special?" • 🚀 TURBO":""}</span><h1>QUAL É A POSIÇÃO?</h1></div><div class="timer" id="timer"><strong id="seconds">${room.config?.durationSeconds||30}</strong><small>SEGUNDOS</small></div></div><div class="game-grid"><div class="panel question"><span class="category">📊 ${e(qn.category)}</span><h2>Quem está em <strong>${qn.position}º lugar</strong>?</h2><p>Ranking TOP ${qn.limit} · ${e(qn.snapshot)}</p>${room.special?'<div class="turbo-banner"><strong>🚀 RODADA TURBO</strong><span>Todos os pontos desta rodada valem o DOBRO!</span></div>':""}<div class="separator"></div>${submitted?`<div class="success-state">✓ PALPITE ENVIADO<p>Seu palpite está guardado até a revelação.</p></div>`:`<form id="guess-form" class="stack"><label>SEU PALPITE<input id="guess" name="answer" autocomplete="off" placeholder="Digite o nome ou apelido (ex.: EUA)" aria-controls="live-options" required maxlength="100" value="${e(draft)}"></label><div id="live-options" class="guess-suggestions" role="listbox" hidden></div><datalist id="options">${qn.options.map(x=>`<option value="${e(x.name)}"></option>`).join("")}</datalist><div class="actions"><button class="btn lime" type="submit">ENVIAR PALPITE</button><button class="btn ghost" type="button" data-op="pass">NÃO SEI • PASSAR</button></div></form>`}<p class="tiny">Aceita variações de nomes, acentos e pequenos erros de digitação. Fonte: ${e(qn.source)}. Em empate de distância, ganha quem enviou antes.</p></div>${board()}</div></section>`;
   }else if(room.phase==="reveal"||room.phase==="finished"){
    content=renderResultScene();
   }else content=`<section class="form-page"><h1>SALA ENCERRADA</h1><p>O anfitrião fechou a partida.</p><button data-op="leave" class="btn lime">VOLTAR AO INÍCIO</button></section>`;
  }
  root.innerHTML=controls()+content+howToPlayDialog()+(screen==="room"&&room?renderReactionDock()+'<div id="reaction-stage" class="reaction-stage" aria-live="polite" aria-atomic="false"></div>':"")+`<footer class="footer">RIVIERA SHOWDOWN <span>FEITO PARA JOGAR COM A TURMA</span></footer>`;
  setNotice("");
  updateTimer();updateNetwork();updateQuickSummary();
 }
 function updateTimer(){
  if(!room||room.phase!=="playing")return;
  const rem=Math.max(0,Math.ceil((room.deadline-Date.now()-serverOffset)/1000));
  const timer=document.getElementById("seconds"),ring=document.getElementById("timer");
  if(timer)timer.textContent=String(rem).padStart(2,"0");
  if(ring)ring.classList.toggle("urgent",rem<=10);
  const form=document.getElementById("guess-form");if(form){for(const el of form.querySelectorAll("input,button"))el.disabled=rem<=0;if(rem<=0&&!form.querySelector(".expired-msg"))form.insertAdjacentHTML("beforeend",'<p class="expired-msg">Tempo encerrado · aguardando revelação</p>');}
 }
 async function api(path,method="GET",body){
  const headers={"content-type":"application/json"};
  if(session?.token)headers.Authorization="Bearer "+session.token;
  const response=await fetch(path,{method,headers,body:body?JSON.stringify(body):undefined,cache:"no-store"});
  const data=await response.json().catch(()=>({error:"Resposta inválida do servidor"}));
  if(!response.ok)throw Error(data.error||"Falha de conexão");
  return data;
 }
 async function sync(){
  if(!session||syncing||screen!=="room")return;
  syncing=true;
  try{
   const next=await api("/api/room/"+session.code);
   serverOffset=next.serverNow-Date.now();
   const previous=room;
   room=next;room.code=session.code;
   const sig=JSON.stringify({phase:next.phase,players:next.players,round:next.round,question:next.question?.position,special:next.special,config:next.config,results:next.lastResults,history:next.history,awards:next.awards});
   if(sig!==lastSignature){
    lastSignature=sig;screen="room";render();
    if(previous&&next.phase==="playing"&&(previous.round!==next.round||previous.phase!=="playing"))playSound("start");
    showRevealCurtain(previous,next);
   }
   paintReactions(next.reactions);
   updateTimer();
  }catch(err){
   if(/sessão não pertence|Sala não encontrada|sala expirou/i.test(err.message)){
    const msg="Sua sessão não está mais ativa. Entre novamente com o convite.";
    session=null;room=null;lastSignature="";localStorage.removeItem(KEY);ws?.close();screen="join";render();setNotice(msg);
   }else{connectionState="offline";updateNetwork();setNotice("Conexão instável: "+err.message)}
  }
  finally{syncing=false}
 }
 function connect(){
  if(!session||screen!=="room")return;
  if(ws&&(ws.readyState===0||ws.readyState===1))return;
  clearTimeout(reconnectTimer);
  try{
   const code=session.code;
   const socket=new WebSocket((location.protocol==="https:"?"wss:":"ws:")+"//"+location.host+"/api/room/"+code+"/ws?token="+encodeURIComponent(session.token));
   ws=socket;connectionState="connecting";updateNetwork();
   socket.onopen=()=>{if(ws!==socket)return;connectionState="connected";updateNetwork();heartbeat();sync()};
   socket.onmessage=()=>sync();
   socket.onclose=()=>{if(ws!==socket)return;ws=null;connectionState="offline";updateNetwork();if(session?.code===code&&screen==="room")reconnectTimer=setTimeout(connect,2500)};
   socket.onerror=()=>{if(ws===socket){connectionState="offline";updateNetwork()}};
  }catch{connectionState="offline";updateNetwork();reconnectTimer=setTimeout(connect,4000)}
 }
 async function heartbeat(){if(!session||screen!=="room")return;try{await api("/api/room/"+session.code+"/heartbeat","POST",{});}catch{}}
 function resetSession(){clearTimeout(reconnectTimer);if(ws){const old=ws;ws=null;old.close()}session=null;room=null;lastSignature="";localStorage.removeItem(KEY);history.replaceState({},"",location.pathname);connectionState="offline";}
 async function sendAction(action,body){
  if(busy)return;
  busy=true;
  try{await api("/api/room/"+session.code+"/"+action,"POST",body||{});draft="";await sync()}
  catch(err){setNotice(err.message)}
  finally{busy=false}
 }
 root.addEventListener("input",event=>{if(event.target?.id==="guess"){draft=event.target.value;updateSuggestions(draft)}else if(event.target?.closest("#create-form"))updateQuickSummary()});
 root.addEventListener("change",event=>{
  if(event.target?.closest("#create-form"))updateQuickSummary();
  if(event.target?.id==="mode"){
   const label=document.getElementById("target-label");
   if(label)label.firstChild.textContent=event.target.value==="race"?"META DE PONTOS":"NÚMERO DE RODADAS";
  }
 });
 root.addEventListener("click",async event=>{
  const btn=event.target.closest("[data-op]");if(!btn)return;
  const op=btn.dataset.op;
  if(op==="home"||op==="leave"){
    if(op==="leave"&&session){
      if(room?.phase==="playing"||room?.phase==="reveal"){setNotice("Uma partida está em andamento. Você pode voltar a esta aba depois ou continuar jogando.");return}
      try{await api("/api/room/"+session.code+"/leave","POST",{})}catch{}
      resetSession();
    }
    screen="home";render();
  }
  if(op==="resume"&&session){screen="room";render();connect();sync()}
  if(op==="whatsapp"&&session){const link=location.origin+"/?room="+session.code;window.open("https://wa.me/?text="+encodeURIComponent("🎮 Bora jogar Riviera Showdown! Entra na minha sala: "+link),"_blank","noopener,noreferrer")}
  if(op==="sound"){
   soundEnabled=!soundEnabled;
   try{localStorage.setItem("riviera-sound-v1",soundEnabled?"on":"off")}catch{}
   if(soundEnabled)playSound("toggle");
   render();
  }
  if(op==="react"&&session&&room){
   const emoji=btn.dataset.emoji;
   if(Date.now()-lastReactAt<1100)return;
   lastReactAt=Date.now();
   try{await api("/api/room/"+session.code+"/react","POST",{emoji});playSound("send");await sync()}
   catch(err){setNotice(err.message)}
  }
  if(op==="share-result"&&session&&room){
   const summary=sharingSummary();
   try{
    if(navigator.share){await navigator.share({title:"Riviera Showdown",text:summary})}
    else if(navigator.clipboard){await navigator.clipboard.writeText(summary);setNotice("Resultado copiado! Cole no grupo do WhatsApp.")}
    else setNotice("Copie o resultado pelo placar.");
   }catch(err){if(err?.name!=="AbortError")setNotice("Não foi possível compartilhar automaticamente.")}
  }
  if(op==="ready")await sendAction("ready");
  if(op==="handoff"||op==="kick"){
    const playerId=btn.dataset.player;
    if(op==="kick"&&!window.confirm("Remover este jogador da sala?"))return;
    if(op==="handoff"&&!window.confirm("Transferir a liderança da sala para este jogador?"))return;
    await sendAction(op,{playerId});
  }
  if(op==="create"||op==="join"){if(op==="create")await loadRankings();screen=op;render()}
  if(op==="how"){document.getElementById("how-dialog")?.showModal()}
  if(op==="close-how"){document.getElementById("how-dialog")?.close()}
  if(op==="choose-answer"){const guess=document.getElementById("guess");if(guess){guess.value=btn.dataset.answer||"";draft=guess.value;document.getElementById("live-options").hidden=true;guess.focus()}}
  if(op==="preset"){
   const presets={classic:{mode:"rounds",target:5,duration:30,turbo:false},turbo:{mode:"race",target:5,duration:20,turbo:true},marathon:{mode:"rounds",target:10,duration:45,turbo:true}};
   const selected=presets[btn.dataset.preset];
   if(selected){const form=document.getElementById("create-form");if(form){
    form.elements.mode.value=selected.mode;form.elements.target.value=selected.target;
    form.elements.durationSeconds.value=selected.duration;form.elements.turbo.checked=selected.turbo;
    form.elements.mode.dispatchEvent(new Event("change",{bubbles:true}));
    for(const el of document.querySelectorAll(".preset-btn"))el.classList.toggle("selected",el===btn);updateQuickSummary();
   }}
  }
  if(op==="categories-all"||op==="categories-none"){for(const el of document.querySelectorAll('#create-form [name="categoryIds"]'))el.checked=op==="categories-all";updateQuickSummary()}

  if(op==="copy"){
   try{await navigator.clipboard.writeText(location.origin+"/?room="+session.code);setNotice("Link copiado! Compartilhe com seus amigos.")}
   catch{setNotice("Copie o link na barra do navegador: "+location.origin+"/?room="+session.code)}
  }
  if(op==="start"||op==="next"||op==="restart"||op==="pass"){if(op==="pass")playSound("send");await sendAction(op)}
 });
 root.addEventListener("submit",async event=>{
  event.preventDefault();if(busy)return;
  const form=event.target;busy=true;
  try{
   if(form.id==="create-form"){
    const fd=new FormData(form),nick=String(fd.get("nick")).trim(),mode=String(fd.get("mode")),target=Number(fd.get("target"));
    const categoryIds=fd.getAll("categoryIds").map(String);
    if(!categoryIds.length)throw Error("Selecione pelo menos uma categoria.");
    const durationSeconds=Number(fd.get("durationSeconds"))||30,turbo=fd.get("turbo")==="on";
    const data=await api("/api/room","POST",{nick,mode,target,categoryIds,durationSeconds,turbo});
    localStorage.setItem(NICK,nick);session=data;localStorage.setItem(KEY,JSON.stringify(session));history.replaceState({},"","/?room="+data.code);screen="room";lastSignature="";room=null;if(ws){const old=ws;ws=null;old.close()}connect();await sync();
   }
   if(form.id==="join-form"){
    const fd=new FormData(form),code=String(fd.get("code")).trim().toUpperCase(),nick=String(fd.get("nick")).trim();
    if(!/^[A-HJ-NP-Z2-9]{6}$/.test(code))throw Error("Código inválido, confira os seis caracteres");
    const data=await api("/api/room/"+code+"/join","POST",{nick});
    localStorage.setItem(NICK,nick);session={...data,code};localStorage.setItem(KEY,JSON.stringify(session));history.replaceState({},"","/?room="+code);screen="room";lastSignature="";room=null;connect();await sync();
   }
   if(form.id==="guess-form"){
    const answer=String(new FormData(form).get("answer")||"").trim();
    if(!answer)throw Error("Digite um palpite ou escolha Passar.");
    await api("/api/room/"+session.code+"/guess","POST",{answer});playSound("send");draft="";await sync();
   }
  }catch(err){setNotice(err.message)}
  finally{busy=false}
 });
 render();
 if(screen==="room"&&session){connect();sync()}
 loadRankings();
 setInterval(()=>{updateTimer();if(session&&screen==="room"){sync();if(!ws||ws.readyState>1)connect()}},3000);
 setInterval(()=>{if(session&&screen==="room")heartbeat()},12000);
 window.addEventListener("online",()=>{if(session&&screen==="room"){connect();heartbeat();sync()}});
 window.addEventListener("offline",()=>{connectionState="offline";updateNetwork()});
 document.addEventListener("visibilitychange",()=>{if(!document.hidden&&session&&screen==="room"){connect();heartbeat();sync()}});

})();
