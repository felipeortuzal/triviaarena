(function clientApp(){
 const root=document.getElementById("app"),notice=document.getElementById("notice");
 const CLUB_KEY="riviera-club-session-v1",KEY="riviera-cloudflare-session-v1",NICK="riviera-nickname-v1",q=new URLSearchParams(location.search),invite=(q.get("room")||"").trim().toUpperCase();
 let session=null,room=null,ws=null,screen=invite?"join":"home",busy=false,draft="",lastSignature="",serverOffset=0,syncing=false,connectionState="offline",reconnectTimer=null,rankings=[],soundEnabled=false,audioCtx=null,lastReactAt=0;
 const seenReactions=new Set();
 let lastSubmitted=null;
 let clubSession=null,club=null,createStep=0;
 try{clubSession=JSON.parse(localStorage.getItem(CLUB_KEY)||"null")}catch{}
 const defaultRankings=[{"id":"area","title":"Maiores países e territórios"},{"id":"population","title":"Mais populosos do planeta"},{"id":"gdp","title":"Maiores economias do mundo"},{"id":"movies","title":"Filmes mais bem avaliados"},{"id":"br-area","title":"Estados por área"},{"id":"br-pop","title":"Estados por população"},{"id":"pokemon","title":"Pokédex Nacional"},{"id":"elementos","title":"Tabela periódica"}];
 try{session=JSON.parse(localStorage.getItem(KEY)||"null")}catch{}
 if(session?.code&&session?.token&&(!invite||session.code===invite))screen="room";
 try{soundEnabled=localStorage.getItem("riviera-sound-v1")==="on"}catch{}
 const e=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 function setNotice(message){notice.textContent=message||"";notice.hidden=!message}
 function updateNetwork(){const n=document.getElementById("net-pill");if(n){const ok=connectionState==="connected"&&navigator.onLine;n.className="net-pill "+(ok?"connected":"disconnected");n.textContent=ok?"● AO VIVO":"○ RECONECTANDO";}}
 async function loadRankings(){if(rankings.length)return;try{const r=await fetch("/api/rankings",{cache:"no-store"});const v=await r.json();if(r.ok&&Array.isArray(v.rankings)){rankings=v.rankings;if(screen==="home")render()}}catch{}}


async function clubApi(path,method="GET",data){
 const res=await fetch(path,{method,headers:{"content-type":"application/json",...(clubSession?.token?{authorization:"Bearer "+clubSession.token}:{})},body:data?JSON.stringify(data):undefined,cache:"no-store"});
 const value=await res.json().catch(()=>({error:"Resposta inválida"}));
 if(!res.ok)throw Error(value.error||"Não foi possível acessar o clube");
 return value;
}
async function loadClub(){
 if(!clubSession?.code)return;
 try{club=await clubApi("/api/club/"+clubSession.code);if(screen==="home")render();}
 catch(e){club=null;if(e.message.includes("sessão")||e.message.includes("encontrado")){clubSession=null;localStorage.removeItem(CLUB_KEY)}}
}
function clubDialog(){
 return `<dialog class="club-dialog" id="club-dialog" aria-labelledby="club-title"><div class="club-dialog-inner"><button type="button" class="club-close" data-op="club-close" aria-label="Fechar">✕</button><div class="eyebrow">RIVIERA SOCIAL CLUB</div><h2 id="club-title">Sua turma,<br><i>seu campeonato.</i></h2><p>O código de clube é diferente do código de sala. Crie um clube uma vez e acumule pontos em todas as partidas vinculadas.</p><div class="club-form-columns"><form id="club-create-form" class="club-form"><h3>01 / FUNDAR UM CLUBE</h3><label>NOME DA TURMA<input name="name" maxlength="40" minlength="3" required placeholder="Ex.: Riviera de Quinta"></label><label>SEU APELIDO<input name="nick" maxlength="24" minlength="2" required placeholder="Nome no placar" value="${e(localStorage.getItem(NICK)||"")}"></label><button class="btn lime" type="submit">CRIAR CLUBE →</button></form><form id="club-join-form" class="club-form"><h3>02 / ENTRAR EM UM CLUBE</h3><label>CÓDIGO DO CLUBE<input name="code" maxlength="6" minlength="6" required placeholder="ABC123" autocapitalize="characters"></label><label>SEU APELIDO<input name="nick" maxlength="24" minlength="2" required placeholder="Nome no placar" value="${e(localStorage.getItem(NICK)||"")}"></label><button class="btn ghost" type="submit">ENTRAR NO CLUBE →</button></form></div></div></dialog>`;
}
function renderClubPanel(){
 const c=club;
 if(!clubSession||!c)return `<section class="club-panel club-panel-empty" id="social-club"><div><span class="section-index">03 / NOSSA TURMA</span><h2>A RESENHA NÃO<br>TERMINA AQUI.</h2><p>Monte seu clube, jogue várias noites e descubra quem é o dono da Riviera.</p></div><div class="club-panel-cta"><span class="club-big-number">∞</span><button class="btn lime" data-op="club-open">CRIAR OU ENTRAR EM UM CLUBE →</button><small>Grátis. Sem conta obrigatória.</small></div></section>`;
 const members=c.players||[];
 const podium=members.slice(0,5).map((p,i)=>`<div class="club-leader"><span class="club-rank">${String(i+1).padStart(2,"0")}</span><strong>${e(p.nick)} ${p.id===c.me?"<small>VOCÊ</small>":""}</strong><span>${p.wins} VITÓRIA${p.wins===1?"":"S"}</span><b>${p.points} PTS</b></div>`).join("");
 const recent=(c.matches||[]).slice(0,3).map(m=>`<li><span>${new Date(m.date).toLocaleDateString("pt-BR")} · ${m.gameType==="phrases"?"FRASES":"RANKING"}</span><strong>${(m.results||[]).slice().sort((a,b)=>b.points-a.points).map(p=>e(p.nick)).slice(0,2).join(" × ")}</strong></li>`).join("");
 return `<section class="club-panel club-panel-active" id="social-club"><div class="club-panel-top"><div><span class="section-index">03 / RIVIERA SOCIAL CLUB</span><h2>${e(c.name)}</h2><p>A classificação da turma continua mesmo depois que a partida acaba.</p></div><div class="club-code"><span>CÓDIGO DO CLUBE</span><strong>${e(clubSession.code)}</strong><button class="mini-btn" data-op="club-copy">COPIAR CÓDIGO</button></div></div><div class="club-table"><div class="club-table-head"><span>CLASSIFICAÇÃO GERAL</span><span>PARTIDAS REGISTRADAS: ${(c.matches||[]).length}</span></div>${podium||'<p class="club-empty">Ainda não há resultados. Crie uma sala para estrear.</p>'}</div><div class="club-actions"><button class="btn lime" data-op="create">NOVA PARTIDA DO CLUBE →</button><button class="btn ghost" data-op="club-refresh">ATUALIZAR PLACAR</button><button class="club-leave" data-op="club-leave">SAIR DO CLUBE</button></div>${recent?'<ul class="club-recent">'+recent+'</ul>':""}<p class="club-note">Somente partidas criadas por membros deste clube e com participantes vinculados entram no histórico.</p></section>`;
}

function renderStatsAndAwards(){
 const players=[...room.players].sort((a,b)=>b.points-a.points||a.nick.localeCompare(b.nick,"pt-BR"));
 const awards=(room.awards||[]).map(a=>`<div class="award-card"><span class="award-emoji">${e(a.emoji)}</span><strong>${e(a.title)}</strong><span>${e((a.nicks||[]).join(", "))}</span></div>`).join("");
 const rows=players.map(p=>{const m=p.stats?.match||{},c=p.stats?.career||{};return `<tr><td>${e(p.nick)}</td><td>${p.points}</td><td>${m.exact||0}</td><td>${m.averageDistance??"—"}</td><td>${c.wins||0}</td></tr>`}).join("");
 const recent=(room.history||[]).slice(-10).reverse().map(h=>`<li><span>R${h.round} · ${e(h.category)}${h.special?" 🚀":""}</span><strong>${e(h.target)}</strong></li>`).join("");
 return `<section class="stats-area"><div class="stats-intro"><span class="kicker">RIVIERA AWARDS</span><h2>QUEM DOMINOU A MESA?</h2><p>Estatísticas válidas apenas nesta sala, preservadas entre revanches.</p></div>${awards?`<div class="awards-grid">${awards}</div>`:""}<div class="stats-table-wrap"><table class="stats-table"><thead><tr><th>JOGADOR</th><th>PTS</th><th>EXATAS</th><th>${room.gameType==="phrases"?"ERRO MÉDIO":"DESVIO MÉDIO"}</th><th>VITÓRIAS NA SALA</th></tr></thead><tbody>${rows}</tbody></table></div><p class="stats-footnote">Exatas e ${room.gameType==="phrases"?"erro (100 - similaridade)":"desvio"}: partida atual. Vitórias: histórico de partidas concluídas nesta sala. Empates na liderança contam como vitória para ambos.</p><details class="history"><summary>Histórico recente das rodadas</summary><ol>${recent}</ol></details></section>`;
}

function renderResultScene(){
 const r=room.lastResults;
 const isFinal=room.phase==="finished";
 const leaderboard=[...room.players].sort((a,b)=>b.points-a.points||a.nick.localeCompare(b.nick,"pt-BR"));
 const ranks=[1,0,2];
 const podium=isFinal?`<div class="podium-section"><span class="kicker">OS DONOS DA RIVIERA</span><h2 class="podium-title">PÓDIO DA PARTIDA</h2><div class="podium-places" aria-label="Classificação final">${ranks.map(index=>{const p=leaderboard[index];if(!p)return "";const medal=["🥇","🥈","🥉"][index];return `<div class="podium-place podium-${index+1}" style="--podium-delay:${index*.12}s"><span class="podium-medal" aria-hidden="true">${medal}</span><span class="podium-name">${e(p.nick)}</span><strong>${p.points} <small>PTS</small></strong><span class="podium-position">${index+1}º LUGAR</span></div>`}).join("")}</div>${leaderboard.length>3?`<p class="podium-more">E mais ${leaderboard.length-3} competidores na disputa!</p>`:""}</div>`:"";
 const resultRows=(r?.results||[]).map((p,i)=>`<div class="result-row result-row-animated" style="--reveal-delay:${i*.11}s"><span class="result-symbol">${p.earned>0?"⭐":"•"}</span><div><b>${e(p.nick)}</b><small>${e(p.answer)} ${r.type==="phrase"?"· similaridade "+(p.quality||0)+"%"+(p.quality>=60?" · válida":" · insuficiente"):p.rank?"· posição "+p.rank+" · distância "+p.distance:"· não pontuou"}</small></div><strong>+${p.earned}</strong></div>`).join("");
 return `<section class="game-page reveal-page" data-scene="${isFinal?"finished":"reveal"}"><div class="reveal-header"><span class="kicker">A DISPUTA / RODADA ${room.round} • RESULTADO ${r?.special?"🚀 TURBO":""}</span><h1>${isFinal?"🏆 FIM DE JOGO":"HORA DA REVELAÇÃO"}</h1><p>${isFinal?"A temporada dessa mesa terminou. Veja quem levou o troféu.":(r?.type==="phrase"?"Quem completou o ditado com mais precisão?":"Quanto menor a distância do ranking, maior a pontuação.")}</p></div>${podium}${!isFinal&&room.nextAt?`<div class="rv25-auto-bar" aria-live="polite"><div><span class="rv25-auto-pulse"></span><strong>MODO FESTA / PRÓXIMA RODADA</strong><small>O jogo continua automaticamente</small></div><span class="rv25-auto-time" id="autonext-seconds">09</span>${room.isHost?'<button class="rv25-hold" data-op="hold-next">PAUSAR</button>':""}</div>`:""}<div class="game-grid"><div class="panel reveal-panel"><span class="kicker">O GABARITO / ROUND ${room.round}</span><div class="answer-spotlight"><span class="spotlight-stars" aria-hidden="true">✦ ✧ ✦</span><h2 class="revealed">${r?.type==="phrase"?`<span class="phrase-prefix">${e(r.prefix||"")}</span> ${e(r.target||"")}`:`${e(r?.target||"")} <small>(${r?.position}º lugar)</small>`}</h2></div><h3 class="result-subheading">PLACAR DA RODADA ${r?.special?"• PONTOS EM DOBRO":""}</h3><div class="results">${resultRows}</div>${r?.sourceUrl?`<p class="rv26-source">Fonte: ${e(r.source)} · ${e(r.snapshot)} · <a href="${e(r.sourceUrl)}" target="_blank" rel="noopener noreferrer">Consultar base ↗</a></p>`:""}<div class="actions"><button class="btn ghost" data-op="share-result">COMPARTILHAR RESULTADO ↗</button>${room.isHost?`<button class="btn lime" data-op="${isFinal?"restart":"next"}">${isFinal?"JOGAR REVANCHE ↻":"AVANÇAR AGORA →"}</button>`:!room.nextAt?'<p class="waitmsg">Aguardando o anfitrião...</p>':""}</div></div>${board()}</div>${isFinal?renderStatsAndAwards():""}</section>`;
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
 return `<dialog id="how-dialog" class="how-dialog" aria-labelledby="how-title"><div class="how-panel"><span class="kicker">TUTORIAL DE 1 MINUTO</span><h2 id="how-title">COMO JOGAR</h2><div class="how-steps"><article><span class="step-num">01</span><div><strong>Escolha uma posição</strong><p>O jogo mostra uma categoria e pergunta quem ocupa determinado lugar no ranking. Ex.: qual país aparece em 7º?</p></div></article><article><span class="step-num">02</span><div><strong>Todo mundo responde junto</strong><p>Você tem de 20 a 45 segundos. Cada resposta pertence a um único jogador na rodada; ninguém vê o seu palpite antes do fim.</p></div></article><article><span class="step-num">03</span><div><strong>O mais próximo vence</strong><p>Se o alvo é o 7º e você acertou o 6º, a distância é 1. No modo normal, o 1º ganha 2 pontos e o 2º ganha 1; na corrida até X, só o 1º pontua.</p></div></article></div><p class="how-note">Em <strong>Frases & Aproximações</strong>, todos completam um ditado, sem ver a resposta correta. O servidor aceita aproximações de escrita ou variações cadastradas com nota mínima de 60%. Antes de começar, todos apertam <strong>ESTOU PRONTO</strong>. Turbo opcional dobra os pontos.</p><button type="button" class="btn lime how-close" data-op="close-how">ENTENDI, VAMOS JOGAR</button></div></dialog>`;
}
function updateGameType(){
 const form=document.getElementById("create-form");if(!form)return;
 const isPhrase=form.elements.gameType.value==="phrases";
 for(const b of form.querySelectorAll('[data-op="mode-pick"]')){const on=b.dataset.value===form.elements.gameType.value;b.classList.toggle("is-selected",on);b.setAttribute("aria-pressed",String(on))}

 const cat=document.getElementById("rank-categories");if(cat)cat.hidden=isPhrase;
 const scale=document.getElementById("rank-scale-group");if(scale)scale.hidden=isPhrase;
 const desc=document.getElementById("game-description");
 if(desc)desc.textContent=isPhrase?"Complete ditados tradicionais com correção aproximada no servidor.":"Adivinhe posições em rankings e vença pela menor distância.";
 updateQuickSummary();
}

function reviewSetup(){
 const form=document.getElementById("create-form"),out=document.getElementById("setup-review");
 if(!form||!out)return;
 const data=new FormData(form),isPhrase=data.get("gameType")==="phrases";
 const nick=String(data.get("nick")||"").trim();
 const name=isPhrase?"Frases & Aproximações":"Estimativa de Ranking";
 const mode=data.get("mode")==="race"?"Corrida até "+data.get("target")+" pontos":data.get("target")+" rodadas";
 const extras=[!isPhrase?({mix:"Mistura Riviera",classic:"Clássico",extreme:"Extremo"}[data.get("rankScale")]||"Mistura Riviera"):null,data.get("durationSeconds")+"s por rodada",data.get("turbo")==="on"?"Turbo ativado":"Sem Turbo",data.get("autoNext")==="on"?"Modo Festa":"Avanço manual",isPhrase?"55 ditados":data.getAll("categoryIds").length+" categorias"].filter(Boolean);
 out.innerHTML=`<div class="review-intro"><span>PASSAPORTE DE JOGO</span><strong>RIVIERA SHOWDOWN</strong></div><dl><div><dt>JOGO</dt><dd>${e(name)}</dd></div><div><dt>ANFITRIÃO</dt><dd>${e(nick)}</dd></div><div><dt>FORMATO</dt><dd>${e(mode)}</dd></div><div><dt>DETALHES</dt><dd>${e(extras.join(" · "))}</dd></div></dl><div class="review-stamp">READY TO PLAY / RS</div>`;
}
function updateQuickSummary(){
 const form=document.getElementById("create-form"),out=document.getElementById("quick-summary");if(!form||!out)return;
 const n=form.querySelectorAll('[name="categoryIds"]:checked').length;
 out.textContent=`${form.elements.gameType?.value==="phrases"?"DITADOS":n+" CATEGORIAS"} SELECIONADAS`;reviewSetup();
}
function filterCategoryPicker(raw){
 const q=String(raw||"").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 for(const block of document.querySelectorAll("#rank-categories .category-group")){
  let count=0;
  for(const label of block.querySelectorAll(".category-check")){
   const match=!q||label.textContent.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(q);
   label.hidden=!match;if(match)count++;
  }
  block.hidden=count===0;
  if(q&&count)block.open=true;else if(!q)block.open=false;
 }
}
function updateSuggestions(raw){
 const list=document.getElementById("live-options");if(!list||!room?.question)return;
 const q=String(raw||"").trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
 if(q.length<2){list.hidden=true;list.innerHTML="";return}
 const values=(room.question.options||[]).map(a=>a.name).filter(n=>n.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(q)).slice(0,6);
 list.innerHTML=values.map(name=>`<button type="button" role="option" class="guess-option" data-op="choose-answer" data-answer="${e(name)}">${e(name)}</button>`).join("");
 list.hidden=!values.length;
}


function renderCreateWizard(){
 const all=rankings.length?rankings:defaultRankings;
 return `<section class="setup-page">
  <div class="setup-container">
   <div class="setup-rail">
    <button class="setup-back-link" type="button" data-op="home">← VOLTAR À CAPA</button>
    <span class="section-index">RIVIERA / ORGANIZE A MESA</span>
    <h1>MONTE A<br><em>DISPUTA.</em></h1>
    <p>Três escolhas rápidas. Depois é só compartilhar o código com a turma.</p>
    <nav class="setup-steps" aria-label="Etapas de criação">
     <button type="button" data-op="wizard-goto" data-step="0" class="wizard-link" aria-current="step"><span>01</span><strong>O jogo</strong></button>
     <button type="button" data-op="wizard-goto" data-step="1" class="wizard-link"><span>02</span><strong>As regras</strong></button>
     <button type="button" data-op="wizard-goto" data-step="2" class="wizard-link"><span>03</span><strong>Começar</strong></button>
    </nav>
    <div class="setup-rail-bottom"><strong>RS / 27</strong><span>A MESA É SUA.</span></div>
   </div>
   <form id="create-form" class="setup-form">
    <div class="setup-topline"><span>CRIAR PARTIDA</span><span id="wizard-count">PASSO 01 DE 03</span></div>
    <div class="wizard-step" data-step="0">
      <span class="wizard-eyebrow">01 / QUAL É O JOGO?</span>
      <h2>Escolha o desafio.</h2>
      <p>Dois jogos, uma regra: todo mundo participa ao mesmo tempo. Agora com ${all.length} rankings, do TOP 10 ao TOP 1000.</p>
      <label class="setup-field setup-name"><span>COMO VÃO TE CHAMAR?</span><input name="nick" required minlength="2" maxlength="24" value="${e(localStorage.getItem(NICK)||"")}" placeholder="Seu apelido" autocomplete="nickname" aria-label="Seu apelido"></label>
      <div class="setup-mode-list" role="group" aria-label="Modo de jogo">
       <button type="button" class="setup-mode is-selected" data-op="mode-pick" data-value="ranking" aria-pressed="true"><span class="mode-index">01</span><span class="mode-info"><strong>Estimativa de Ranking</strong><small>${all.length} rankings · TOP 20, 30, 50, 100, 500 e 1000</small></span><span class="mode-choice" aria-hidden="true">↗</span></button>
       <button type="button" class="setup-mode" data-op="mode-pick" data-value="phrases" aria-pressed="false"><span class="mode-index">02</span><span class="mode-info"><strong>Frases & Aproximações</strong><small>55 ditados · respostas simultâneas</small></span><span class="mode-choice" aria-hidden="true">↗</span></button>
      </div>
      <select name="gameType" id="game-type" class="visually-hidden" aria-label="Modo selecionado" tabindex="-1"><option value="ranking">Ranking</option><option value="phrases">Frases</option></select>
      <p id="game-description" class="setup-help">Adivinhe posições em rankings e vença pela menor distância.</p>
    </div>
    <div class="wizard-step" data-step="1" hidden>
      <span class="wizard-eyebrow">02 / DEFINA AS REGRAS</span>
      <h2>Do seu jeito.</h2>
      <p>Você controla o ritmo. O resto é com a turma.</p>
      <div class="setup-presets">
        <span class="setup-label">PRONTO PARA COMEÇAR?</span>
        <div class="preset-row">
          <button type="button" class="preset-btn selected" data-op="preset" data-preset="classic">CLÁSSICO <small>5 rodadas</small></button>
          <button type="button" class="preset-btn" data-op="preset" data-preset="turbo">TURBO <small>20 segundos</small></button>
          <button type="button" class="preset-btn" data-op="preset" data-preset="marathon">MARATONA <small>10 rodadas</small></button>
        </div>
      </div>
      <div class="rv26-scale-group" id="rank-scale-group"><span class="setup-label">QUAL O TAMANHO DA SURPRESA?</span><div class="rv26-scale-grid">
       <label class="rv26-scale-option"><input type="radio" name="rankScale" value="mix" checked><strong>🎲 MISTURA RIVIERA</strong><small>TOP 10 a 1000</small></label>
       <label class="rv26-scale-option"><input type="radio" name="rankScale" value="classic"><strong>⚡ CLÁSSICO</strong><small>TOP 10 a 50</small></label>
       <label class="rv26-scale-option"><input type="radio" name="rankScale" value="extreme"><strong>🔥 EXTREMO</strong><small>TOP 100 a 1000</small></label>
      </div></div>
      <div class="setup-field-grid">
       <label class="setup-field"><span>FORMATO DA PARTIDA</span><select name="mode" id="mode"><option value="rounds">Por rodadas · 2 / 1 pontos</option><option value="race">Corrida até X · 1 ponto</option></select></label>
       <label class="setup-field" id="target-label"><span>QUANTAS RODADAS?</span><input type="number" name="target" min="1" max="20" value="5"></label>
       <label class="setup-field"><span>TEMPO PARA RESPONDER</span><select name="durationSeconds" id="duration"><option value="20">20 segundos</option><option value="30" selected>30 segundos</option><option value="45">45 segundos</option></select></label>
       <label class="setup-toggle"><input type="checkbox" name="turbo" id="turbo"><span class="toggle-track"></span><span class="toggle-copy"><strong>Rodadas Turbo</strong><small>Pontos dobrados a cada 3 rodadas</small></span></label><label class="setup-toggle rv25-flow-toggle"><input type="checkbox" name="autoNext" id="auto-next" checked><span class="toggle-track"></span><span class="toggle-copy"><strong>Modo Festa · automático</strong><small>Nova rodada após 9 segundos de revelação. O host pode pausar.</small></span></label>
      </div>
      <details class="setup-categories" id="advanced-options"><summary>PERSONALIZAR CATEGORIAS <span id="quick-summary">${all.length} listas selecionadas</span><b aria-hidden="true">+</b></summary>
        <fieldset class="category-fieldset" id="rank-categories"><legend>O QUE ENTRA NA DISPUTA?</legend><label class="rv26-category-search"><span>BUSCAR LISTAS</span><input type="search" id="category-search" placeholder="Procure futebol, cinema, cidades ou Pokémon..." autocomplete="off"></label>${categoryPicker()}<div class="category-actions"><button type="button" class="mini-btn" data-op="categories-all">Todas</button><button type="button" class="mini-btn" data-op="categories-none">Limpar</button></div></fieldset>
      </details>
    </div>
    <div class="wizard-step" data-step="2" hidden>
      <span class="wizard-eyebrow">03 / TUDO NO LUGAR</span>
      <h2>Abre a mesa.</h2>
      <p>Confira as regras, gere o código e mande para os amigos.</p>
      <div class="setup-review" id="setup-review" aria-live="polite"></div>
      ${clubSession?.code?`<div class="setup-club-note"><span>✳</span> ESTA PARTIDA CONTA PARA O CLUBE <strong>${e(club?.name||clubSession.code)}</strong></div>`:""}
      <button type="submit" class="btn lime wizard-create">ABRIR SALA PRIVADA <span aria-hidden="true">↗</span></button>
      <p class="setup-fineprint">Ao abrir, você recebe um código de seis caracteres. Só começa quando todos estiverem prontos.</p>
    </div>
    <div class="wizard-controls">
      <button type="button" class="wizard-prev" data-op="wizard-prev">← VOLTAR</button>
      <button type="button" class="wizard-next" data-op="wizard-next">CONTINUAR <span>→</span></button>
    </div>
   </form>
  </div>
 </section>`;
}

function invitationText(){
 if(!session?.code)return "";
 return "Riviera Showdown — bora jogar!\nSala: "+session.code+"\n"+location.origin+"/?room="+session.code;
}
function renderShareDialog(){
 const code=session?.code||"------",link=location.origin+"/?room="+code;
 return `<dialog class="rv25-share-dialog" id="share-dialog" aria-labelledby="share-heading">
  <div class="rv25-share-body">
   <button class="rv25-close" type="button" data-op="share-close" aria-label="Fechar convite">✕</button>
   <span class="rv25-overline">RIVIERA SHOWDOWN / SEU CONVITE</span>
   <h2 id="share-heading">A mesa tá<br><em>te esperando.</em></h2>
   <p>Compartilhe o link ou mande só o código. Seus amigos entram pelo celular, sem instalar nada.</p>
   <div class="rv25-share-ticket"><span>ENTRY PASS / CODE</span><strong>${e(code)}</strong><small>${e(link)}</small></div>
   <div class="rv25-share-grid">
    <button class="rv25-share-action primary" type="button" data-op="share-native"><span>↗</span><strong>COMPARTILHAR</strong><small>Enviar convite</small></button>
    <button class="rv25-share-action" type="button" data-op="copy"><span>⎘</span><strong>COPIAR LINK</strong><small>Link completo</small></button>
    <button class="rv25-share-action" type="button" data-op="copy-code"><span>#</span><strong>COPIAR CÓDIGO</strong><small>6 caracteres</small></button>
    <button class="rv25-share-action" type="button" data-op="whatsapp"><span>↗</span><strong>WHATSAPP</strong><small>Mensagem pronta</small></button>
   </div>
   <p class="rv25-share-note">A sala começa quando todos confirmarem presença e o anfitrião iniciar.</p>
  </div>
 </dialog>`;
}

function renderJoinPage(){
 return `<section class="join-page">
   <div class="join-photo"><button type="button" data-op="home" class="join-return">← VOLTAR</button><span>RIVIERA / GUEST PASS</span><strong>YOUR<br>TABLE<br>AWAITS.</strong><small>RS / THE SOCIAL GAME CLUB</small></div>
   <div class="join-main"><span class="wizard-eyebrow">ENTRAR NA DISPUTA</span><h1>Já tem uma<br><em>mesa aberta?</em></h1><p>O anfitrião mandou um convite? Insira o código e entre na partida.</p>
    <form id="join-form" class="join-form">
      <label class="setup-field"><span>CÓDIGO DE SEIS CARACTERES</span><input name="code" id="join-code" required maxlength="6" minlength="6" pattern="[A-HJ-NP-Z2-9]{6}" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABC123" value="${e(invite)}"></label>
      <label class="setup-field"><span>SEU APELIDO</span><input name="nick" required minlength="2" maxlength="24" placeholder="Como vamos te chamar?" autocomplete="nickname" value="${e(localStorage.getItem(NICK)||"")}"></label>
      <button type="submit" class="btn lime join-submit">ENTRAR NA MESA <span aria-hidden="true">→</span></button>
    </form>
    <div class="join-details"><span>01 / DIGITE O CÓDIGO</span><span>02 / ENTRE COM A TURMA</span><span>03 / CONFIRME QUE ESTÁ PRONTO</span></div>
    <button class="join-back" type="button" data-op="home">← Voltar à página inicial</button>
   </div>
 </section>`;
}
function updateWizard(){
 const form=document.getElementById("create-form");if(!form)return;
 for(const step of form.querySelectorAll(".wizard-step"))step.hidden=Number(step.dataset.step)!==createStep;
 for(const link of document.querySelectorAll(".wizard-link")){
  const n=Number(link.dataset.step);link.classList.toggle("is-active",n===createStep);link.classList.toggle("is-done",n<createStep);
  link.disabled=n>createStep;
  if(n===createStep)link.setAttribute("aria-current","step");else link.removeAttribute("aria-current");
 }
 const label=document.getElementById("wizard-count");if(label)label.textContent="PASSO 0"+(createStep+1)+" DE 03";
 const prev=form.querySelector('[data-op="wizard-prev"]'),next=form.querySelector('[data-op="wizard-next"]');
 if(prev)prev.hidden=createStep===0;if(next)next.hidden=createStep===2;
 if(createStep===2)updateQuickSummary();
}
function setWizardStep(next){
 createStep=Math.max(0,Math.min(2,next));updateWizard();root.querySelector(".setup-form")?.scrollIntoView({block:"start",behavior:"instant"});
}

 function controls(){
 const isRoom=screen==="room"&&!!session;
 return `<header class="nav rv24-nav"><div class="nav-inner">
  <button class="nav-brand" type="button" data-op="home" aria-label="Ir à página inicial"><img class="brand" src="/assets/riviera-logo-transparent.png" alt="Riviera Showdown"></button>
  <div class="rv24-nav-center"><span>THE SOCIAL GAME CLUB</span><span class="rv24-nav-divider">/</span><button type="button" data-op="how">COMO JOGAR</button><button type="button" data-op="club-jump">CLUBE</button></div>
  <div class="nav-actions">
   ${isRoom?'<span class="net-pill" id="net-pill">CONECTANDO</span>':""}
   <button class="rv24-nav-action" type="button" data-op="${isRoom?"leave":"join"}">${isRoom?"SAIR DA SALA":"ENTRAR"}</button>
   <button class="rv24-nav-primary" type="button" data-op="create">ABRIR MESA <span>↗</span></button>
   <details class="rv24-menu" id="rv24-menu"><summary aria-label="Abrir menu"><span>MENU</span><i class="menu-lines" aria-hidden="true"><b></b><b></b></i></summary><div class="rv24-menu-panel">
    <div class="rv24-menu-head">NAVEGAR <span>RS / 2026</span></div>
    <button type="button" data-op="home"><span>01</span> INÍCIO <b>↗</b></button>
    <button type="button" data-op="create"><span>02</span> ABRIR UMA MESA <b>↗</b></button>
    <button type="button" data-op="join"><span>03</span> ENTRAR COM CÓDIGO <b>↗</b></button>
    <button type="button" data-op="club-jump"><span>04</span> RIVIERA SOCIAL CLUB <b>↗</b></button>
    <button type="button" data-op="how"><span>05</span> COMO JOGAR <b>↗</b></button>
    <div class="rv24-menu-foot"><span>EFEITOS SONOROS</span><button type="button" class="sound-toggle" data-op="sound" aria-pressed="${soundEnabled}">${soundEnabled?"LIGADO":"DESLIGADO"} <span aria-hidden="true">${soundEnabled?"◉":"○"}</span></button></div>
   </div></details>
  </div>
 </div></header>`;
 }
 function board(){
  return `<div class="board"><div class="board-title"><b>PLACAR</b><span>${room.players.length} JOGADORES</span></div>${room.players.map((p,i)=>`<div class="player"><span class="ranknum">#${i+1}</span><span class="nick">${e(p.nick)} ${p.id===room.host?'<small>HOST</small>':""} ${p.id===room.me?'<small>VOCÊ</small>':""}</span><span class="points">${p.points} <small>PTS</small></span>${room.phase==="playing"?`<span class="sent ${p.submitted?"yes":""}">${p.submitted?"✓ ENVIOU":"AGUARDANDO"}</span>`:room.phase==="lobby"?`<span class="sent ${p.online?"yes":""}">${p.online?"● ONLINE":"○ DESCONECTADO"} · ${p.ready?"✓ PRONTO":"AGUARDANDO"}</span>`:""}${room.phase==="lobby"&&room.isHost&&p.id!==room.me?`<span class="host-tools"><button class="mini-btn" data-op="handoff" data-player="${e(p.id)}" title="Passar a liderança">👑 Tornar host</button><button class="mini-btn danger" data-op="kick" data-player="${e(p.id)}" title="Remover do lobby">Remover</button></span>`:""}</div>`).join("")}</div>`;
 }
 function render(){
  if(room){const input=root.querySelector("#guess");if(input)draft=input.value;}
  let content="";
  if(screen==="home")content=`<div class="rv-home"><section class="rv-hero"><div class="rv-hero-main"><span class="rv-overline">RIVIERA SHOWDOWN — THE SOCIAL GAME CLUB</span><h1>JOGO BOM<br>É JOGO<br><span class="rv-hero-last"><em>COM</em> A TURMA.</span></h1><p>Um sofá, vários celulares e uma disputa que ninguém vai esquecer. Escolha o desafio e veja quem manda na Riviera.</p><div class="rv-hero-actions"><button class="btn lime" data-op="create">CRIAR UMA PARTIDA <span aria-hidden="true">↗</span></button><button class="btn ghost" data-op="join">ENTRAR COM CÓDIGO</button></div><div class="rv-hero-extras"><button class="rv-text-link" data-op="how">COMO FUNCIONA <span>↗</span></button>${session?.token?'<button class="rv-text-link" data-op="resume">RETOMAR MINHA PARTIDA ↗</button>':""}<span>SEM DOWNLOAD · MULTIPLAYER AO VIVO</span></div></div><div class="rv-hero-image"><span class="rv-photo-label">A TEMPORADA É DE VOCÊS.</span><span class="rv-photo-number">RS / 26</span><span class="rv-photo-credit">FOTO: LAURENZ KLEINHEIDER / UNSPLASH</span></div></section><section class="rv-games" id="games"><div class="rv-section-heading"><div><span class="section-index">01 / ESCOLHA SEU JOGO</span><h2>HOJE TEM<br><i>REVANCHE.</i></h2></div><p>Duas formas de provar que você conhece mais que os seus amigos. Sem enrolação: criou, convidou, começou.</p></div><div class="rv-game-list"><article class="rv-game rv-game-ranking"><div class="rv-game-number">01</div><div class="rv-game-content"><span class="rv-game-type">ESTRATÉGIA / CONHECIMENTO</span><h3>ESTIMATIVA<br>DE RANKING</h3><p>Quem está na posição certa? Futebol, F1, cinema, geografia e mais ${rankings.length||107} rankings e formatos TOP 20, 50, 100 ou 1000.</p><button class="rv-game-cta" data-op="create">JOGAR RANKING <span>↗</span></button></div><span class="rv-game-watermark" aria-hidden="true">#01</span></article><article class="rv-game rv-game-phrases"><div class="rv-game-number">02</div><div class="rv-game-content"><span class="rv-game-type">RACIOCÍNIO / CRIATIVIDADE</span><h3>FRASES &<br>APROXIMAÇÕES</h3><p>Complete ditados populares e ganhe pela resposta mais próxima. Cada palavra conta.</p><button class="rv-game-cta" data-op="create-phrases">JOGAR FRASES <span>↗</span></button></div><span class="rv-game-watermark" aria-hidden="true">“ ”</span></article></div><div class="rv-up-next"><span>EM PRODUÇÃO</span><strong>SEVEN</strong><p>7 suspeitos. 1 verdade. Em breve.</p></div><div class="rv26-release"><span class="rv26-release-kicker">EDIÇÃO 2.6 / THE RANDOM EXPANSION</span><div><strong>DO TOP 10<br>AO TOP 1.000.</strong><p>${rankings.length||107} rankings · 41 clássicos + 66 novos · sorteio equilibrado por tema. Cada rodada pode ser completamente diferente.</p></div><span class="rv26-release-stamp" aria-hidden="true">1000</span></div></section>${renderClubPanel()}<section class="rv-bottom"><span class="section-index">02 / UMA NOITE. MUITAS HISTÓRIAS.</span><div><strong>VOCÊ TRAZ A TURMA.<br>NÓS TRAZEMOS A DISPUTA.</strong><button class="btn ghost" data-op="create">ABRIR UMA SALA ↗</button></div><details class="rv-rank-details"><summary>CONHEÇA AS ${rankings.length||107} LISTAS DE RANKING <span>+</span></summary><div class="rv-rank-grid">${rankings.map(x=>`<span>${e(x.title)}</span>`).join("")}</div></details></section></div>`;
  if(screen==="create")content=renderCreateWizard();
  if(screen==="join")content=renderJoinPage();
  if(screen==="room"&&!room)content=`<section class="form-page"><h1>CONECTANDO À SALA...</h1><p>Recuperando sua partida.</p></section>`;
  if(screen==="room"&&room){
   if(room.phase==="lobby"){
    const link=location.origin+"/?room="+room.code;

    const me=room.players.find(p=>p.id===room.me);
    const ready=room.players.filter(p=>p.ready).length;
    const allReady=room.players.length>=2&&ready===room.players.length;
    content=`<section class="game-page rv24-lobby">
      <div class="rv24-screen-heading"><button class="rv24-back" data-op="home">← VOLTAR</button><span>RIVIERA / SALA PRIVADA</span><b>${room.players.length} JOGADORES NA MESA</b></div>
      <div class="rv24-lobby-lead"><span class="rv24-index">01 / A MESA ESTÁ ABERTA</span><h1>CHAMA<br><em>A TURMA.</em></h1><p>Envie o código, espere os amigos entrarem e comece quando todo mundo confirmar.</p></div>
      <div class="rv24-lobby-layout">
       <div class="rv24-lobby-main">
        <div class="rv24-passport">
          <div class="rv24-passport-top"><span>RIVIERA SHOWDOWN</span><span>INVITATION / RS 24</span></div>
          <span class="rv24-passport-label">CÓDIGO DA SALA</span><strong class="roomcode">${e(room.code)}</strong>
          <div class="rv24-passport-actions"><button class="btn lime" data-op="share-open">CONVIDAR AMIGOS <span>↗</span></button><button class="rv24-whatsapp" data-op="copy">COPIAR LINK ↗</button><button class="rv24-whatsapp" data-op="whatsapp">WHATSAPP ↗</button></div>
          <span class="rv24-passport-url">${e(link)}</span>
         </div>
         ${room.clubCode?`<div class="rv-room-club">✳ PARTIDA VINCULADA AO CLUBE <strong>${e(room.clubCode)}</strong></div>`:""}
         <div class="rv24-lobby-roster"><div class="rv24-roster-head"><span>QUEM ESTÁ NA MESA</span><span>${ready} DE ${room.players.length} PRONTOS</span></div>
          ${board()}
          <div class="lobby-ready"><div><strong>${ready} / ${room.players.length}</strong><span>${me?.ready?"VOCÊ ESTÁ PRONTO":"CONFIRME PARA COMEÇAR"}</span></div><button class="btn ${me?.ready?"ghost":"lime"}" data-op="ready">${me?.ready?"✓ PRONTO · CANCELAR":"CONFIRMAR PRESENÇA →"}</button></div>
         </div>
       </div>
       <aside class="rv24-lobby-side"><div class="rv24-rules-head"><span>02 / FICHA DA PARTIDA</span><button data-op="how">VER REGRAS ↗</button></div>
        <h2>${room.gameType==="phrases"?"FRASES &<br>APROXIMAÇÕES":"ESTIMATIVA<br>DE RANKING"}</h2>
        <div class="config-summary"><b>${room.mode==="race"?"CORRIDA ATÉ "+room.target+" PONTOS":room.target+" RODADAS"}</b><span>${room.config?.durationSeconds||30} SEGUNDOS</span><span>${room.gameType==="phrases"?"55 DITADOS":(room.config?.categoryIds?.length||41)+" LISTAS"}</span><span>${room.config?.turbo?"TURBO ATIVADO":"SEM TURBO"}</span><span>${room.config?.autoNext?"PRÓXIMA RODADA AUTOMÁTICA":"AVANÇO MANUAL"}</span>${room.gameType!=="phrases"?`<span>${room.config?.rankScale==="extreme"?"🔥 EXTREMO · TOP 100+":room.config?.rankScale==="classic"?"⚡ CLÁSSICO · TOP 10-50":"🎲 MISTURA RIVIERA"}</span>`:""}</div>
        <p class="rv24-rule-detail">${room.mode==="race"?"Só o primeiro pontua. Ganha quem alcançar a meta.":"Primeiro colocado +2 pontos. Segundo +1 ponto. Ganha quem somar mais."}</p>
        <div class="rv24-ready-footer">
        ${room.isHost?`<button class="btn lime rv24-start" data-op="start" ${!allReady?"disabled":""}>COMEÇAR PARTIDA <span>→</span></button><p class="waitmsg">${allReady?"Todo mundo pronto. A Riviera é sua.":"Aguarde todos confirmarem presença para liberar o início."}</p>`:`<div class="rv24-guest-wait"><span class="rv24-pulse"></span><strong>ESPERANDO O ANFITRIÃO</strong><p>A partida começa quando o host iniciar.</p></div>`}
        </div>
       </aside>
      </div>
     </section>`;
   }else if(room.phase==="playing"){
    const qn=room.question,me=room.players.find(p=>p.id===room.me),submitted=!!me?.submitted;
    content=`<section class="game-page"><div class="round-head"><div><span class="kicker">PARTIDA AO VIVO / RODADA ${room.round}${room.mode==="rounds"?" DE "+room.target:" • CORRIDA ATÉ "+room.target}${room.special?" • 🚀 TURBO":""}</span><h1>${qn.type==="phrase"?"COMPLETE A FRASE":"QUAL É A POSIÇÃO?"}</h1>${room.mode==="rounds"?`<div class="rv25-round-meter" role="progressbar" aria-label="Progresso da partida" aria-valuemin="0" aria-valuemax="${room.target}" aria-valuenow="${room.round}"><span style="width:${Math.min(100,room.round/room.target*100)}%"></span></div>`:""}</div><div class="timer" id="timer"><strong id="seconds">${room.config?.durationSeconds||30}</strong><small>SEGUNDOS</small><span id="timer-progress" class="rv24-timer-progress"></span></div></div><div class="game-grid rv24-playing-grid"><div class="panel question"><div class="rv26-question-meta"><span class="category">${qn.type==="phrase"?"💬":"🎲"} ${e(qn.category)}</span>${qn.type==="phrase"?"":`<span class="rv26-format">${e(qn.tier||"CLÁSSICO")} · ${qn.rankType==="ordem"?"ORDEM":"TOP"} ${Number(qn.limit).toLocaleString("pt-BR")}</span>`}</div>${qn.type==="phrase"?`<h2 class="phrase-prompt">${e(qn.lead)} <strong>...</strong></h2><p>Complete o ditado. Acertos exatos e aproximações reconhecidas valem pontos.</p>`:`<h2>${qn.rankType==="ordem"?"Quem ocupa a":"Quem está na"} <strong>${Number(qn.position).toLocaleString("pt-BR")}ª posição</strong>?</h2><p>${qn.rankType==="ordem"?"Ordem oficial dos itens":"Ranking"} · ${Number(qn.limit).toLocaleString("pt-BR")} opções · ${e(qn.snapshot)}</p>`}${room.special?'<div class="turbo-banner"><strong>🚀 RODADA TURBO</strong><span>Todos os pontos desta rodada valem o DOBRO!</span></div>':""}<div class="separator"></div><div class="rv24-answer-label">SEU PALPITE FICA SECRETO ATÉ A REVELAÇÃO</div><p class="rv27-smart-hint">✳ CORREÇÃO INTELIGENTE ATIVA · Pequenos erros e abreviações são reconhecidos automaticamente, quando não há dúvida.</p>${submitted?`<div class="success-state">✓ PALPITE ENVIADO<p>Seu palpite está guardado até a revelação.</p>${lastSubmitted?.code===session?.code&&lastSubmitted?.round===room.round?`<div class="rv27-answer-confirm"><span>${lastSubmitted.corrected?"CORREÇÃO AUTOMÁTICA":"RESPOSTA REGISTRADA"}</span><strong>${e(lastSubmitted.accepted)}</strong>${lastSubmitted.corrected?`<small>Você digitou: ${e(lastSubmitted.original)}</small>`:""}</div>`:""}</div>`:`<form id="guess-form" class="stack"><label>${qn.type==="phrase"?"SUA CONTINUAÇÃO":"SEU PALPITE"}<input id="guess" name="answer" autocomplete="off" placeholder="${qn.type==="phrase"?"Escreva como o ditado termina":/munic|cidad/i.test(qn.category)?"Município e UF (ex.: São Paulo - SP)":/pok/i.test(qn.category)?"Digite um Pokémon (ex.: Pikachu)":"Digite o nome do item do ranking"}" aria-controls="live-options" required maxlength="${qn.type==="phrase"?160:100}" value="${e(draft)}"></label>${qn.type==="phrase"?"":`<div id="live-options" class="guess-suggestions" role="listbox" hidden></div><datalist id="options">${qn.options.map(x=>`<option value="${e(x.name)}"></option>`).join("")}</datalist>`}<div class="actions"><button class="btn lime" type="submit">ENVIAR PALPITE</button><button class="btn ghost" type="button" data-op="pass">NÃO SEI • PASSAR</button></div></form>`}<p class="tiny rv24-game-footnote">${qn.type==="phrase"?"Correção: exato (100%), variação muito próxima (90%), aproximada (75% ou 60%), incorreta (0%). Só respostas com 60% ou mais disputam pontos. Empates são resolvidos pela ordem de envio.":"Aceita variações de nomes, acentos e pequenos erros de digitação. Fonte: "+e(qn.source)+(qn.sourceUrl?` <a href="${e(qn.sourceUrl)}" target="_blank" rel="noopener noreferrer">Ver dados ↗</a>`:"")+". A menor distância pontua; no empate, ganha quem enviou antes."}</p></div>${board()}</div></section>`;
   }else if(room.phase==="reveal"||room.phase==="finished"){
    content=renderResultScene();
   }else content=`<section class="form-page"><h1>SALA ENCERRADA</h1><p>O anfitrião fechou a partida.</p><button data-op="leave" class="btn lime">VOLTAR AO INÍCIO</button></section>`;
  }
  root.innerHTML=controls()+content+clubDialog()+renderShareDialog()+howToPlayDialog()+(screen==="room"&&room?renderReactionDock()+'<div id="reaction-stage" class="reaction-stage" aria-live="polite" aria-atomic="false"></div>':"")+`<footer class="footer">RIVIERA SHOWDOWN <span>FEITO PARA JOGAR COM A TURMA</span></footer>`;
  setNotice("");
  updateTimer();updateNetwork();updateGameType();updateWizard();
 }
 function updateTimer(){
  if(room?.phase==="reveal"&&room.nextAt){
   const el=document.getElementById("autonext-seconds");
   if(el)el.textContent=String(Math.max(0,Math.ceil((room.nextAt-Date.now()-serverOffset)/1000))).padStart(2,"0");
  }
  if(!room||room.phase!=="playing")return;
  const rem=Math.max(0,Math.ceil((room.deadline-Date.now()-serverOffset)/1000));
  const timer=document.getElementById("seconds"),ring=document.getElementById("timer");
  if(timer)timer.textContent=String(rem).padStart(2,"0");
  if(ring)ring.classList.toggle("urgent",rem<=10);
  const progress=document.getElementById("timer-progress");if(progress)progress.style.width=Math.max(0,Math.min(100,rem/(room.config?.durationSeconds||30)*100))+"%";
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
   if(previous&&(next.round!==previous.round||next.phase==="lobby"||next.phase==="closed"))lastSubmitted=null;
   room=next;room.code=session.code;
   const sig=JSON.stringify({phase:next.phase,players:next.players,round:next.round,gameType:next.gameType,question:next.question?.position,phrase:next.question?.lead,special:next.special,config:next.config,results:next.lastResults,nextAt:next.nextAt,history:next.history,awards:next.awards});
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
 root.addEventListener("input",event=>{
   if(event.target?.id==="guess"){draft=event.target.value;updateSuggestions(draft)}
   else if(event.target?.id==="category-search"){filterCategoryPicker(event.target.value)}
   else if(event.target?.id==="join-code"){event.target.value=event.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g,"")}
   else if(event.target?.closest("#create-form"))updateQuickSummary();
 });
 root.addEventListener("change",event=>{
  if(event.target?.closest("#create-form"))updateQuickSummary();
  if(event.target?.id==="game-type"){updateGameType()}
  if(event.target?.id==="mode"){
   const label=document.getElementById("target-label");
   if(label)label.querySelector("span").textContent=event.target.value==="race"?"META DE PONTOS":"QUANTAS RODADAS?";
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
  if(op==="club-jump"){
    screen="home";render();if(clubSession)root.querySelector("#social-club")?.scrollIntoView({behavior:"smooth",block:"start"});
    else document.getElementById("club-dialog")?.showModal();
  }
  if(op==="share-open"&&session){document.getElementById("share-dialog")?.showModal()}
  if(op==="share-close"){document.getElementById("share-dialog")?.close()}
  if(op==="copy-code"&&session){
   try{await navigator.clipboard.writeText(session.code);setNotice("Código copiado: "+session.code)}
   catch{setNotice("Seu código: "+session.code)}
  }
  if(op==="share-native"&&session){
   try{
    if(navigator.share)await navigator.share({title:"Riviera Showdown",text:invitationText(),url:location.origin+"/?room="+session.code});
    else if(navigator.clipboard){await navigator.clipboard.writeText(invitationText());setNotice("Convite copiado! Envie no seu grupo.")}
    else setNotice(invitationText());
   }catch(err){if(err?.name!=="AbortError")setNotice("Compartilhamento não disponível: copie o link.")}
  }
  if(op==="club-open"){document.getElementById("club-dialog")?.showModal()}
  if(op==="club-close"){document.getElementById("club-dialog")?.close()}
  if(op==="club-refresh"){await loadClub();setNotice("Placar atualizado.")}
  if(op==="club-copy"&&clubSession){try{await navigator.clipboard.writeText(clubSession.code);setNotice("Código do clube copiado.")}catch{setNotice("Código do clube: "+clubSession.code)}}
  if(op==="club-leave"){if(!confirm("Sair deste clube neste aparelho? As estatísticas continuarão salvas no servidor."))return;clubSession=null;club=null;localStorage.removeItem(CLUB_KEY);render()}
  if(op==="create"||op==="join"||op==="create-phrases"){if(op!=="join")await loadRankings();createStep=0;screen=op==="join"?"join":"create";render();if(op==="create-phrases"){const input=document.getElementById("game-type");if(input){input.value="phrases";updateGameType()}}}
  if(op==="mode-pick"){
   const form=document.getElementById("create-form");if(form){form.elements.gameType.value=btn.dataset.value;updateGameType()}
  }
  if(op==="wizard-next"){
   const form=document.getElementById("create-form");
   if(form&&createStep===0){const nick=form.elements.nick;if(!nick.reportValidity())return;}
   if(form&&createStep===1&&form.elements.gameType.value==="ranking"&&!form.querySelector('[name="categoryIds"]:checked')){setNotice("Escolha pelo menos uma categoria.");return;}
   setWizardStep(createStep+1);
  }
  if(op==="wizard-prev"){setWizardStep(createStep-1)}
  if(op==="wizard-goto"){const step=Number(btn.dataset.step);if(step<=createStep)setWizardStep(step)}
  if(op==="how"){document.getElementById("how-dialog")?.showModal()}
  if(op==="close-how"){document.getElementById("how-dialog")?.close()}
  if(op==="choose-answer"){const guess=document.getElementById("guess");if(guess){guess.value=btn.dataset.answer||"";draft=guess.value;document.getElementById("live-options").hidden=true;guess.focus()}}
  if(op==="preset"){
   const presets={classic:{mode:"rounds",target:5,duration:30,turbo:false,autoNext:true},turbo:{mode:"race",target:5,duration:20,turbo:true,autoNext:true},marathon:{mode:"rounds",target:10,duration:45,turbo:true,autoNext:false}};
   const selected=presets[btn.dataset.preset];
   if(selected){const form=document.getElementById("create-form");if(form){
    form.elements.mode.value=selected.mode;form.elements.target.value=selected.target;
    form.elements.durationSeconds.value=selected.duration;form.elements.turbo.checked=selected.turbo;form.elements.autoNext.checked=selected.autoNext;
    form.elements.mode.dispatchEvent(new Event("change",{bubbles:true}));
    for(const el of document.querySelectorAll(".preset-btn"))el.classList.toggle("selected",el===btn);updateQuickSummary();
   }}
  }
  if(op==="categories-all"||op==="categories-none"){for(const el of document.querySelectorAll('#create-form [name="categoryIds"]'))el.checked=op==="categories-all";updateQuickSummary()}

  if(op==="copy"){
   try{await navigator.clipboard.writeText(location.origin+"/?room="+session.code);setNotice("Link copiado! Compartilhe com seus amigos.")}
   catch{setNotice("Copie o link na barra do navegador: "+location.origin+"/?room="+session.code)}
  }
  if(op==="start"||op==="next"||op==="restart"||op==="pass"||op==="hold-next"){if(op==="pass")playSound("send");await sendAction(op)}
 });
 root.addEventListener("submit",async event=>{
  event.preventDefault();if(busy)return;
  const form=event.target;busy=true;
  try{
   if(form.id==="club-create-form"||form.id==="club-join-form"){
     const fd=new FormData(form),nick=String(fd.get("nick")||"").trim();
     const created=form.id==="club-create-form";
     const code=created?null:String(fd.get("code")||"").trim().toUpperCase();
     if(!created&&!/^[A-HJ-NP-Z2-9]{6}$/.test(code))throw Error("Código de clube inválido");
     const payload=created?{name:String(fd.get("name")||"").trim(),nick}:{nick};
     const result=await clubApi(created?"/api/club":"/api/club/"+code+"/join","POST",payload);
     clubSession={code:created?result.code:code,token:result.token,id:result.id,nick};
     localStorage.setItem(CLUB_KEY,JSON.stringify(clubSession));localStorage.setItem(NICK,nick);
     club=await clubApi("/api/club/"+clubSession.code);
     render();document.getElementById("club-dialog")?.close();setNotice("Agora você faz parte do clube "+club.name+"!");return;
   }
   if(form.id==="create-form"){
    const fd=new FormData(form),nick=String(fd.get("nick")).trim(),mode=String(fd.get("mode")),target=Number(fd.get("target"));
    const categoryIds=fd.getAll("categoryIds").map(String);
    const gameType=String(fd.get("gameType")||"ranking");if(gameType==="ranking"&&!categoryIds.length)throw Error("Selecione pelo menos uma categoria.");
    const durationSeconds=Number(fd.get("durationSeconds"))||30,turbo=fd.get("turbo")==="on",autoNext=fd.get("autoNext")==="on",rankScale=String(fd.get("rankScale")||"mix");
    const data=await api("/api/room","POST",{nick,mode,target,categoryIds,durationSeconds,turbo,autoNext,rankScale,gameType,...(clubSession?.token?{clubCode:clubSession.code,clubToken:clubSession.token}:{})});
    localStorage.setItem(NICK,nick);session=data;localStorage.setItem(KEY,JSON.stringify(session));history.replaceState({},"","/?room="+data.code);screen="room";lastSignature="";room=null;if(ws){const old=ws;ws=null;old.close()}connect();await sync();
   }
   if(form.id==="join-form"){
    const fd=new FormData(form),code=String(fd.get("code")).trim().toUpperCase(),nick=String(fd.get("nick")).trim();
    if(!/^[A-HJ-NP-Z2-9]{6}$/.test(code))throw Error("Código inválido, confira os seis caracteres");
    const data=await api("/api/room/"+code+"/join","POST",{nick,...(clubSession?.token?{clubToken:clubSession.token}:{})});
    localStorage.setItem(NICK,nick);session={...data,code};localStorage.setItem(KEY,JSON.stringify(session));history.replaceState({},"","/?room="+code);screen="room";lastSignature="";room=null;connect();await sync();
   }
   if(form.id==="guess-form"){
    const answer=String(new FormData(form).get("answer")||"").trim();
    if(!answer)throw Error("Digite um palpite ou escolha Passar.");
    const confirmation=await api("/api/room/"+session.code+"/guess","POST",{answer});
    lastSubmitted={code:session.code,round:room?.round,original:answer,accepted:confirmation.correction?.canonical||confirmation.acceptedAnswer||answer,corrected:!!confirmation.correction};
    playSound("send");draft="";await sync();
    if(room?.phase==="playing"&&room.players.some(p=>p.id===room.me&&p.submitted))render();
    if(confirmation.correction)setNotice("Autocorreção: "+answer+" → "+confirmation.correction.canonical);
   }
  }catch(err){setNotice(err.message)}
  finally{busy=false}
 });
 render();
 if(screen==="room"&&session){connect();sync()}
 loadRankings();loadClub();
 setInterval(()=>{updateTimer();if(session&&screen==="room"){sync();if(!ws||ws.readyState>1)connect()}},3000);
 setInterval(()=>{if(session&&screen==="room")heartbeat()},12000);
 window.addEventListener("online",()=>{if(session&&screen==="room"){connect();heartbeat();sync()}});
 window.addEventListener("offline",()=>{connectionState="offline";updateNetwork()});
 document.addEventListener("visibilitychange",()=>{if(!document.hidden&&session&&screen==="room"){connect();heartbeat();sync()}});

})();
