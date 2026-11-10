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
let DATA={puzzles:[FALLBACK_PUZZLE],rankings:[]},db=null,auth=null,uid=null,roomId=null,room=null,unsubRoom=null,modeChoice='letters',nick=safeNick(),view='home',busy=false,err='',imported=[],localHints=0;
let localDemo=false,configured=false,dataReady=false,dataProblem='',connectionState=STANDALONE?'local':'checking',connectionProblem='';
let selectedRounds=5;
let roomGateway=null,phraseGame=null,partyGame=null,clearPresence=()=>{},currentRoomSubscription=null,emulatorMode=false,selectedWinner='',pendingJoinCode='';
let stopGuess=()=>{},stopSubmissions=()=>{},currentGuessRound='',ownGuess='',submitted={},guessDrafts={},rankOverrideReason='';
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
<section class="panel homejoin" aria-label="Jogar neste aparelho"><div class="row between"><div><div class="eyebrow">PRÉVIA LOCAL • SEM CADASTRO</div><h2>Jogar neste aparelho</h2></div><span class="pill">🎲 Três modos</span></div><p>Experimente os três modos. Você pode jogar frases, estimar posições e alternar jogos com placar simulado, sem internet.</p><div class="actions">${btn("▶ Jogar neste aparelho","demo","lime")}${btn("👑 Testar lobby e placar","demo-lobby","ghost")}${dataProblem?btn("↻ Tentar carregar conteúdo","retry-data","ghost"):""}</div>${dataProblem?`<p class="notice" role="status">${esc(dataProblem)}. Uma rodada de reserva está disponível.</p>`:""}</section>
<section class="panel homejoin" aria-label="Salas online"><div class="row between"><div><div class="eyebrow">SALA ONLINE</div><h2>Crie ou entre com um convite</h2></div><span class="pill">${online?"● Disponível":"○ Indisponível"}</span></div><p class="tiny" role="status">${esc(help)}</p>${connectionProblem?`<p class="notice tiny">${esc(connectionProblem)}</p>`:""}
<div class="grid"><div class="stack"><label><span class="label">Seu nick</span><input class="field" id="nick" maxlength="28" placeholder="Como quer aparecer?" value="${esc(nick)}"></label><label><span class="label">Modo da sala</span><select class="field" id="mode"><option value="letters" ${modeChoice==="letters"?"selected":""}>🧩 Decifre a Frase</option><option value="rank" ${modeChoice==="rank"?"selected":""}>🏆 Ranking</option><option value="mixed" ${modeChoice==="mixed"?"selected":""}>🎲 Misturado</option></select></label><label><span class="label">Rodadas por partida</span><select class="field" id="round-count"><option value="3" ${selectedRounds===3?"selected":""}>3 rodadas • rápida</option><option value="5" ${selectedRounds===5?"selected":""}>5 rodadas • padrão</option><option value="7" ${selectedRounds===7?"selected":""}>7 rodadas • longa</option></select></label>${btn("Criar sala e gerar convite →","create","lime",!online)}</div>
<div class="stack"><label><span class="label">Código de convite</span><input class="field" id="join-code" maxlength="10" placeholder="Ex.: TRV7XK" value="${esc(pendingJoinCode||new URLSearchParams(location.search).get("room")||"")}"></label><p class="tiny">Quem recebe o link abre o site, escolhe um nick e entra na sala.</p>${btn("Entrar na sala →","join","primary",!online)}</div></div></section>
<p class="footer">🎲 Desafios com sorteio sem repetição • 📱 Celular e computador • 🔒 Sem cadastro pessoal</p>`);
}
function waiting(){
const count=members().length, onlineCount=members().filter(m=>m.online).length;
const canStart=!room.closed&&(['letters','rank','mixed'].includes(room.mode));
return `<section class="panel lobby">
<div class="row between"><div><div class="eyebrow">LOBBY PRIVADO · ${room.totalRounds||5} RODADAS</div><h2>Sua sala está pronta.</h2><p>Convide os amigos e comece a disputa! Ao completar ${room.totalRounds||5} rodadas, o pódio aparece automaticamente.</p></div><span class="pill lobby-count">${count}/20 jogadores</span></div>
<div class="invite-card"><div><div class="eyebrow">CÓDIGO DA SALA</div><div class="invite-code">${esc(roomId)}</div><p class="tiny">Compartilhe o código ou envie um convite.</p></div><div class="stack"><label class="label" for="invite">LINK DO CONVITE</label><input class="field" readonly id="invite" value="${localDemo?'DEMONSTRAÇÃO LOCAL • Convites indisponíveis':esc(location.origin+location.pathname+'?room='+roomId+(emulatorMode?'&emulator=1':''))}">${btn('📋 Copiar convite','copy','lime',localDemo)}</div></div>
<div class="cardline row between"><div><h3>Participantes</h3><p class="tiny">${onlineCount} online · ${count} inscritos</p></div><span class="pill">${esc(room.mode==='letters'?'🧩 Decifre a Frase':room.mode==='mixed'?'🎲 Misturado':'🏆 Ranking')}</span></div>${roster()}
${isHost()&&['rank','mixed'].includes(room.mode)?`<details class="custom-ranking" ${Object.keys(room.customRankings||{}).length?"":" "}><summary>＋ Adicionar ranking próprio (opcional)</summary>
<p class="tiny">Até 3 listas, de 10 a 1.000 itens, com fonte e data. A lista do anfitrião será identificada como personalizada.</p>
<div class="grid"><label class="stack"><span class="label">Título</span><input class="field" id="custom-title" placeholder="Ex.: Maiores cidades do Brasil"></label><label class="stack"><span class="label">Fonte</span><input class="field" id="custom-source" placeholder="Nome da publicação"></label>
<label class="stack"><span class="label">URL HTTPS da fonte</span><input class="field" id="custom-url" placeholder="https://..."></label><label class="stack"><span class="label">Edição/data</span><input class="field" id="custom-snapshot" placeholder="Ex.: 2026-11"></label></div>
<label class="stack"><span class="label">Critério e desempate</span><input class="field" id="custom-about" placeholder="Universo, indicador e desempate em caso de empate"></label>
<label class="stack"><span class="label">Itens ordenados, uma linha por posição</span><textarea class="field" rows="5" id="custom-items" placeholder="1. 12 Angry Men&#10;2. Cidade de Deus&#10;3. ..."></textarea></label>
${btn("✓ Validar e importar lista","import","ghost")}
${Object.values(room.customRankings||{}).map(d=>`<p class="tiny">✓ ${esc(d.title)} · ${d.items.length} itens · fonte: ${esc(d.source)}</p>`).join("")}</details>`:""}
${!room.members?.[room.host]?.online?'<p class="notice">Anfitrião desconectado. Esperando o retorno…</p>':''}
<div class="cardline stack">${room.closed?'<p class="notice">Esta sala foi encerrada.</p>':isHost()?`${btn(canStart?'▶ Iniciar partida':'Modo disponível em breve','start-game','primary',!canStart)}<p class="tiny">Depois de começar, novos jogadores não entram. O anfitrião controla as dicas e a pontuação.</p>${btn('Encerrar sala','close-room','ghost')}`:'<p class="tiny">Aguardando o anfitrião iniciar a partida…</p>'}
${btn('← Voltar ao início','leave-room','ghost')}</div></section>`;
}
function members(){return Object.values(room?.members||{}).sort((a,b)=>(a.joined||0)-(b.joined||0));}
function isHost(){return localDemo||room?.host===uid}
function roster(){return `<div class="roster">${members().map(m=>`<div class="player"><b>${esc(m.nick)} ${m.uid===room.host?'👑':''}</b><span>${m.online?'● Conectado':'○ Desconectado'} · ${room?.scores?.[m.uid]||0} ponto(s)</span></div>`).join('')}</div>`}
function roomHeader(){
  if(localDemo)return `<div class="row between" style="margin-bottom:20px"><div><div class="eyebrow">JOGAR NESTE APARELHO • RODADA ${room?.number||1} DE ${room?.totalRounds||5}</div><h2>Demonstração: ${room.mode==="rank"?"Estimativa de Ranking":room.mode==="mixed"?"Modo Misturado":"Decifre a Frase"}</h2></div>${btn("← Sair da prévia","stop-demo","ghost")}</div>`;
  return `<div class="row between" style="margin-bottom:20px"><div><div class="eyebrow">SALA ${esc(roomId)} • RODADA ${room?.number||0} DE ${room?.totalRounds||5}</div><h2>${room?.mode==="mixed"?"Modo misturado":room?.mode==="rank"?"Estimativa de Ranking":"Decifre a Frase"}</h2></div>${btn("📋 Convidar","copy","ghost")}</div>`;
}
function phraseReview(r){
 if(!r.resultReady)return `<div class="notice">🔎 ${isHost()?"Preparando as respostas. Tente revelar novamente se necessário.":"O anfitrião está avaliando as respostas."}</div>${isHost()?btn("Atualizar avaliação","reveal","ghost"):""}`;
 const rows=members().map(m=>{
   const result=r.review?.[m.uid]||{status:"empty",points:0,reason:"Sem resposta",guess:""};
   const status=result.status==="exact"?"✓ Exata":result.status==="approx"?"≈ Aproximada":result.status==="reviewed"?"✎ Revisada":result.status==="review"?"? Revisão sugerida":"— Incorreta";
   return `<tr><td>${esc(m.nick)}</td><td>${esc(result.guess||"Sem resposta")}</td><td>${status}${result.reason?`<div class="tiny">${esc(result.reason)}</div>`:""}</td><td class="highlight">+${result.points||0}</td></tr>`;
 }).join("");
 const controls=isHost()?`<div class="round-decision"><div class="eyebrow">REVISÃO DO ANFITRIÃO</div>
 <p class="tiny">Aceite respostas semanticamente equivalentes. Cada correção fica registrada com o motivo.</p>
 <div class="grid"><label><span class="label">Jogador</span><select class="field" id="phrase-correct-player">${members().map(m=>`<option value="${esc(m.uid)}">${esc(m.nick)}</option>`).join("")}</select></label>
 <label><span class="label">Pontos</span><select class="field" id="phrase-correct-points"><option value="2">2 · Exata</option><option value="1">1 · Aproximada</option><option value="0">0 · Incorreta</option></select></label></div>
 <label><span class="label">Justificativa</span><input class="field" id="phrase-correct-reason" maxlength="180" placeholder="Ex.: usou sinônimo equivalente sem alterar o número"></label>
 ${btn("Aplicar revisão","phrase-override","ghost")}</div>`:"";
 return `<div class="cardline"><div class="eyebrow">REVISÃO DA FRASE · EXATA +2 / APROXIMADA +1</div>
 <div class="tablewrap"><table class="board"><thead><tr><th>Jogador</th><th>Resposta</th><th>Resultado</th><th>Pontos</th></tr></thead><tbody>${rows}</tbody></table></div>${controls}</div>`;
}
function roundAdvanceControls(){
 if(!isHost())return "";
 const last=room.number>=(room.totalRounds||5);
 return `<div class="actions">${btn(last?"🏆 Finalizar e ver pódio":"Próxima rodada →","next","lime")}
 ${!last?btn("Encerrar antecipadamente","finish-game","ghost"):""}</div>`;
}
function letters(){
 const r=room.round,p=r.puzzleSnapshot||DATA.puzzles[r.index];
 if(!p)return roomHeader()+"<div class='notice'>Esta pergunta não está disponível no catálogo.</div>";
 const key=roomId+":"+r.id,guess=guessDrafts[key]??(localDemo?room.localGuesses?.local||"":ownGuess||"");
 const sent=localDemo?Object.keys(room.localGuesses||{}).length:Object.values(submitted||{}).filter(Boolean).length;
 const hints=r.hints>0?`<div class="status" role="status"><b>💡 Dica 1:</b> ${esc(p.hints?.[0]||"Sem dica")}${r.hints>1?`<p><b>💡 Dica 2:</b> ${esc(p.hints?.[1]||"Sem dica")}</p>`:""}</div>`:
 '<p class="tiny muted" style="text-align:center">As dicas serão liberadas pelo anfitrião.</p>';
 const source=p.sourceUrl&&p.sourceUrl.startsWith("https://")?`<p class="tiny"><a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">↗ Fonte: ${esc(p.sourceName||"Referência")}</a></p>`:"";
 const answer=`<div class="result" role="status"><div class="eyebrow">RESPOSTA REVELADA</div><strong>${esc(p.answer)}</strong><p>${esc(p.explain||"")}</p>${source}</div>`;
 const host=!r.revealed&&isHost()?`<div class="actions">${btn("💡 Liberar dica "+Math.min(2,(r.hints||0)+1)+"/2","hint","ghost",r.hints>=2)}
 ${btn("👁 Revelar respostas","reveal","primary")}</div>`:"";
 const guessArea=!r.revealed?`<div class="round-decision">
 <label><span class="label">Sua interpretação da frase</span><input class="field" id="phrase-answer" maxlength="120" autocomplete="off" placeholder="Ex.: 27 estrelas na bandeira brasileira" value="${esc(guess)}"></label>
 ${btn(ownGuess||localDemo&&room.localGuesses?.local?"✓ Atualizar resposta":"Enviar resposta 🔒","phrase-guess","lime")}
 <p class="tiny">🔒 ${sent}/${members().length} enviaram. Ninguém vê as respostas dos outros antes da revelação.</p></div>`:"";
 const legacy=!r.resultReady&&isHost()&&r.revealed&&(!r.review||Object.keys(r.guesses||{}).length===0)?
 `<label><span class="label">Acerto por voz (sem resposta digitada): +1</span><select class="field" id="letter-winner"><option value="">Ninguém acertou</option>${members().map(m=>`<option value="${esc(m.uid)}" ${selectedWinner===m.uid?"selected":""}>${esc(m.nick)}</option>`).join("")}</select></label>`:"";
 const legacyFallback=r.revealed&&r.resultReady&&Object.keys(r.guesses||{}).length===0&&isHost()?
 `<label><span class="label">Acerto por voz, sem resposta digitada (+1)</span><select class="field" id="letter-winner"><option value="">Ninguém / sem pontos</option>${members().map(m=>`<option value="${esc(m.uid)}" ${selectedWinner===m.uid?"selected":""}>${esc(m.nick)}</option>`).join("")}</select></label>`:"";
 return `${roomHeader()}<div class="game-layout"><section class="panel round-panel stack">
 <div class="row between"><span class="pill">🧩 RODADA ${room.number}/${room.totalRounds||5}</span><span class="pill">${r.hints||0}/2 dicas</span></div>
 <div class="options"><span class="pill">${esc(p.topic||"Cultura geral")}</span><span class="pill">${esc(p.level||"Geral")}</span></div>
 <div class="largecode">${esc(p.code)}</div><p class="muted" style="text-align:center">Decifre a frase usando os números e as iniciais.</p>
 ${r.revealed?answer:hints}${guessArea}${host}
 ${r.revealed?phraseReview(r)+legacy+legacyFallback+roundAdvanceControls():""}
 </section>${localDemo&&Object.keys(room.members||{}).length<2?"":`<aside class="panel scoreboard"><div class="eyebrow">PLACAR DA PARTIDA</div>${roster()}<p class="tiny">${Object.keys(room.roundHistory||{}).length} de ${room.totalRounds||5} rodadas concluídas.</p></aside>`}</div>`;
}
function rankData(r){return r.listSnapshot||room?.customRankings?.[r.categoryId]||DATA.rankings.find(x=>x.id===r.categoryId)}

function localRankResolve(raw,d,limit){
 const value=norm(raw);
 if(!value)return {status:"empty",position:null};
 const matches=[];
 d.items.forEach((item,index)=>{
   if([item,...(d.aliases?.[item]||[])].some(label=>norm(label)===value))matches.push(index+1);
 });
 if(matches.length>1)return {status:"ambiguous",position:null};
 if(!matches.length)return {status:"unknown",position:null};
 if(matches[0]>limit)return {status:"out-of-cut",position:null};
 return {status:"valid",position:matches[0]};
}

function localRankScore(r){
 const list=rankData(r),users=Object.keys(room.members||{}),guesses=room.localGuesses||{},overrides=r.overrides||{};
 const rows=users.map(uid=>{
   const guess=guesses[uid]||'',override=overrides[uid];
   const state=override?{position:override.position||null,status:override.position?"corrected":"corrected-out"}:localRankResolve(guess,list,r.limit);
   return {uid,guess,position:state.position,status:state.status,delta:state.position===null?null:Math.abs(state.position-r.target),...(override?{reason:override.reason}:{})};
 });
 const sorted=rows.filter(x=>x.delta!==null).sort((a,b)=>a.delta-b.delta||a.uid.localeCompare(b.uid));
 let place=0,previous=null;
 sorted.forEach((x,i)=>{if(x.delta!==previous)place=i+1;previous=x.delta;x.place=place;x.points=({1:5,2:3,3:1})[place]||0});
 rows.filter(x=>x.delta===null).forEach(x=>{x.place=null;x.points=0});
 return Object.fromEntries(rows.map(x=>[x.uid,x]));
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
 <div class="actions">${btn("Próxima rodada →","next","lime")}${btn("🏁 Finalizar partida","finish-game","ghost")}</div>`:"<p class='tiny'>O anfitrião pode revisar o resultado e confirmar a pontuação.</p>"}</div>`;
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
<div class="podium">${ranked.map((m,i)=>`<div class="podium-item"><span>${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</span><strong>${esc(m.nick)}</strong><b>${m.points} ponto${m.points===1?'':'s'}</b></div>`).join('')}</div>
<div class="cardline"><h3>Resumo das ${rounds.length} rodadas</h3>${rounds.map(x=>`<div class="history-row"><span>${x.type==="rank"?"🏆":"🧩"} Rodada ${x.number} · ${esc(x.type==="rank"?(DATA.rankings.find(d=>d.id===x.categoryId)?.title||"Ranking")+" · alvo "+x.target+"º / Top "+x.limit:DATA.puzzles[x.index]?.code||"")}</span><b>${x.type==="rank"?esc(Object.entries(x.awarded||{}).map(([key,points])=>(room.members?.[key]?.nick||"Jogador")+": +"+points).join(" · ")):esc(x.winner?room.members?.[x.winner]?.nick||"Jogador":"Sem vencedor")}</b></div>`).join("")}</div>
<div class="actions cardline">${btn('← Voltar ao início','leave-room','primary')}${isHost()?btn('Encerrar sala','close-room','ghost',room.closed):''}</div></section>`;
}
function render(){
 status();const active=document.activeElement,focusId=active?.id||null;
 const value=focusId?active.value:null;
 const banner=err?`<div role="alert" class="status error">${esc(err)}</div>`:'';
 err='';
 app.innerHTML=banner+(!room?home():room.phase==='finished'?finishedGame():room.round?(room.round.type==='letters'?letters():ranking()):waiting());
 if(focusId){const el=document.getElementById(focusId);if(el&&!el.disabled){if(value!==null&&el.tagName!=='SELECT'&&focusId!=='invite')el.value=value;el.focus({preventScroll:true})}}
}
function watchRankingIfNecessary(id,roomValue){
  const r=roomValue?.round;
  const key=r?.type==="rank"?id+":"+r.id:"";
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
  selectedWinner='';roomId=id;room=null;
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
function usedKey(type){return type==='letters'?'usedLetters':'usedRanks'}
function nextChoice(){const current=room.round;let type=room.mode==='mixed'?(current?.type==='letters'?'rank':'letters'):room.mode;if(type==='letters'){const used=room.usedLetters||[];let available=DATA.puzzles.map((_,i)=>i).filter(i=>!used.includes(i));if(!available.length)available=DATA.puzzles.map((_,i)=>i);const index=pick(available);return {type:'letters',index,hints:0,revealed:false,usedLetters:available.length===DATA.puzzles.length&&used.length? [index]:[...used,index]}}
 const pool=[...DATA.rankings,...(room.customRankings||[])];if(!pool.length)throw Error('Não há rankings cadastrados.');const used=room.usedRanks||[];let choices=pool.filter(x=>!used.includes(x.id));if(!choices.length)choices=pool;let c=pick(choices);const limits=[25,50,75,100,250,500,1000].filter(n=>n<=c.items.length);if(!limits.includes(c.items.length))limits.push(c.items.length);const limit=pick(limits);const history=room.targetHistory?.[c.id+'-'+limit]||[];let positions=Array.from({length:limit},(_,i)=>i+1).filter(i=>!history.includes(i));if(!positions.length)positions=Array.from({length:limit},(_,i)=>i+1);const target=pick(positions);const id='r'+Date.now().toString(36)+random(9999);return {type:'rank',categoryId:c.id,custom:room.customRankings?.find(x=>x.id===c.id)||null,limit,target,id,revealed:false,usedRanks:choices.length===pool.length&&used.length?[c.id]:[...used,c.id],targetHistory:{...(room.targetHistory||{}),[c.id+'-'+limit]:positions.length===limit&&history.length?[target]:[...history,target]}}}
async function nextRound(){if(localDemo){nextLocalRound();return}throw Error('Partidas online serão habilitadas na etapa 3.');if(!isHost())return;let add=nextChoice();const updateData={number:(room.number||0)+1,round:add};if(add.usedLetters)updateData.usedLetters=add.usedLetters;if(add.usedRanks)updateData.usedRanks=add.usedRanks;if(add.targetHistory)updateData.targetHistory=add.targetHistory;delete add.usedLetters;delete add.usedRanks;delete add.targetHistory;if(room.round?.type==='letters'&&room.round.revealed){const winner=$('#letter-winner')?.value;if(winner){updateData[`scores/${winner}`]=(room.scores?.[winner]||0)+1}}if(room.round?.type==='rank'&&room.round.revealed&&!room.round.scored){const ranked=scoreRank(room.round);const scores={...room.scores};ranked.forEach(x=>{if(x.place&&x.place<=3)scores[x.uid]=(scores[x.uid]||0)+({1:5,2:3,3:1}[x.place]||0)});updateData.scores=scores}await update(ref(db,'rooms/'+roomId),updateData)}
function startDemo(){
  if(modeChoice!=="letters"){startDemoLobby();startDemoFromLobby();return}
  currentRoomSubscription?.();currentRoomSubscription=null;clearPresence();stopGuess();stopSubmissions();currentGuessRound="";
  unsubRoom?.();unsubRoom=null;
  localDemo=true;roomId="LOCAL";
  const index=DATA.puzzles.length>1?random(DATA.puzzles.length):0;
  room={host:"local",mode:"letters",number:1,members:{local:{uid:"local",nick:"Jogador",joined:Date.now()}},scores:{local:0},usedLetters:[index],round:{type:"letters",index,hints:0,revealed:false}};
  render();
}
function localChooseRound(){
 const nextType=room.mode==="rank"?"rank":room.mode==="mixed"?(room.round?.type==="letters"?"rank":"letters"):"letters";
 const number=(room.number||0)+1;
 if(nextType==="letters"){
   const pool=DATA.puzzles.map((_,i)=>i).filter(i=>!(room.usedLetters||[]).includes(i));
   const choices=pool.length?pool:DATA.puzzles.map((_,i)=>i);
   const index=choices[random(choices.length)];
   room.usedLetters=pool.length?[...(room.usedLetters||[]),index]:[index];
   room.round={type:"letters",id:`frase-${number}`,index,hints:0,revealed:false,scored:false};
 }else{
   const eligible=DATA.rankings.filter(d=>Array.isArray(d.items)&&d.items.length>=25&&d.url?.startsWith("https://")&&d.source&&d.snapshot);
   if(!eligible.length)throw Error("Nenhuma lista de ranking disponível nesta prévia.");
   const combinations=[];
   for(const d of eligible)for(const limit of [25,50,75,100].filter(n=>n<=d.items.length)){
     for(let target=1;target<=limit;target++)combinations.push({categoryId:d.id,limit,target});
   }
   const fresh=combinations.filter(x=>!(room.usedRanks||[]).includes(`${x.categoryId}:${x.limit}:${x.target}`));
   const choices=fresh.length?fresh:combinations;
   const selected=choices[random(choices.length)];
   const key=`${selected.categoryId}:${selected.limit}:${selected.target}`;
   room.usedRanks=fresh.length?[...(room.usedRanks||[]),key]:[key];
   room.round={type:"rank",id:`ranking-${number}`,...selected,revealed:false,scored:false,resultReady:false};
   const d=rankData(room.round),sample=Math.min(selected.limit-1,selected.target+1);
   room.localGuesses={guest:d.items[sample]};
   ownGuess="";submitted={guest:true};guessDrafts={};
 }
 room.number=number;room.phase="playing";selectedWinner="";render();
}

function nextLocalRound(){
 if(!localDemo||!room?.round?.revealed)return;
 if(room.localGame){localAdvance(false);return}
 const used=room.usedLetters||[],all=DATA.puzzles.map((_,i)=>i);
 let available=all.filter(i=>!used.includes(i));
 if(!available.length)available=all;
 const index=available[random(available.length)];
 room.usedLetters=available.length===all.length&&used.length?[index]:[...used,index];
 room.number++;room.round={type:"letters",index,hints:0,revealed:false};
 selectedWinner="";render();
}

function startDemoLobby(){
 localDemo=true;roomId="DEMO45";selectedWinner="";
 room={host:"local",mode:modeChoice,phase:"lobby",number:0,localGame:true,
 members:{local:{uid:"local",nick:"Você (demo)",joined:Date.now(),online:true},
 guest:{uid:"guest",nick:"Amigo simulado",joined:Date.now()+1,online:true}},
 scores:{local:0,guest:0},roundHistory:{},usedLetters:[],usedRanks:[]};
 render();
}

function startDemoFromLobby(){
 if(!localDemo||room?.phase!=="lobby")return;
 localChooseRound();
}

function localScoreCurrentRound(winner){
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
   if(winner&&room.members[winner])room.scores[winner]=(room.scores[winner]||0)+1;
   room.roundHistory[r.id]={id:r.id,number:room.number,type:"letters",index:r.index,hints:r.hints||0,winner};
 }
 r.scored=true;
}

function localAdvance(finish){
 if(!localDemo||!room?.round?.revealed||room.round.scored)return;
 localScoreCurrentRound(room.round.type==="letters"?($("#letter-winner")?.value||selectedWinner||""):"");
 if(finish){room.phase="finished";render();return}
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
async function handle(action){if(busy)return;busy=true;try{if(action==="demo"){startDemo()}
else if(action==="demo-lobby"){startDemoLobby()}
else if(action==="stop-demo"){localDemo=false;room=null;roomId=null;guessDrafts={};render()}
else if(action==="leave-room"){
  currentRoomSubscription?.();currentRoomSubscription=null;clearPresence();stopGuess();stopSubmissions();currentGuessRound="";
  room=null;roomId=null;const q=new URLSearchParams(location.search);q.delete("room");
  history.replaceState(null,"",location.pathname+(q.size?"?"+q.toString():""));render()
}
else if(action==="close-room"){if(!isHost()||!roomGateway)throw Error("Apenas o anfitrião pode encerrar.");await roomGateway.closeRoom(roomId)}
else if(action==="retry-data"){await loadData()}
else if(action==="hint"&&localDemo){if(room.round?.type==='letters'){room.round.hints=Math.min(2,room.round.hints+1);render()}}
else if(action==="reveal"&&localDemo){if(room.round?.type==='rank')localReveal();else{room.round.revealed=true;render()}}
else if(['choose-letters','choose-rank','choose-mixed'].includes(action)){modeChoice=action.replace('choose-','').replace('rank','rank');render();const field=$('#mode');if(field)field.value=modeChoice;$('#nick')?.focus()}
else if(action==='create'){if(!onlineReady()||!roomGateway)throw Error('Salas online indisponíveis. Use Jogar neste aparelho ou configure o Firebase.');const name=getNick();const result=await roomGateway.createRoom({nick:name,mode:selectedMode(),totalRounds:selectedRounds});connectRoom(result.code)}
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
else if(action==='next'){if(!partyGame||!isHost())throw Error('Somente o anfitrião avança.');await partyGame.advance(roomId,{winner:room.round?.type==='letters'?($('#letter-winner')?.value||selectedWinner||''):''});selectedWinner=''}
else if(action==='finish-game'&&localDemo){finishLocalDemo()}
else if(action==='finish-game'){if(!partyGame||!isHost())throw Error('Somente o anfitrião encerra.');await partyGame.advance(roomId,{winner:room.round?.type==='letters'?($('#letter-winner')?.value||selectedWinner||''):'',finish:true});selectedWinner=''}
else if(action==='hint'&&isHost()&&partyGame){await partyGame.hint(roomId)}
else if(action==='reveal'&&isHost()&&partyGame){if(room.round?.type==='rank')await partyGame.revealRanking(roomId);else await partyGame.revealPhrase(roomId)}
else if(action==='guess'&&room?.round?.type==='rank'){
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
document.addEventListener('change',e=>{if(e.target.id==='mode')modeChoice=e.target.value;if(e.target.id==='round-count')selectedRounds=Number(e.target.value);if(e.target.id==='letter-winner')selectedWinner=e.target.value});
document.addEventListener('input',e=>{if(e.target.id==='nick')nick=e.target.value;if(e.target.id==='join-code')pendingJoinCode=e.target.value;if(e.target.id==='guess'&&room?.round)guessDrafts[roomId+':'+room.round.id]=e.target.value;if(e.target.id==='override-reason')rankOverrideReason=e.target.value});
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
