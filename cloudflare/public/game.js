(function clientApp(){
 const root=document.getElementById("app"),notice=document.getElementById("notice");
 const KEY="riviera-cloudflare-session-v1",NICK="riviera-nickname-v1",q=new URLSearchParams(location.search),invite=(q.get("room")||"").trim().toUpperCase();
 let session=null,room=null,ws=null,screen=invite?"join":"home",busy=false,draft="",lastSignature="",serverOffset=0,syncing=false;
 try{session=JSON.parse(localStorage.getItem(KEY)||"null")}catch{}
 if(session?.code&&session?.token)screen="room";
 const e=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 function setNotice(message){notice.textContent=message||"";notice.hidden=!message}
 function controls(){
  return `<header class="nav"><div class="nav-inner"><img class="brand" src="/assets/riviera-logo-transparent.png" alt="Riviera Showdown"><span class="nav-tag">A ARENA É SUA</span><button class="btn small ghost" data-op="home" type="button">Início</button></div></header>`;
 }
 function board(){
  return `<div class="board"><div class="board-title"><b>PLACAR</b><span>${room.players.length} JOGADORES</span></div>${room.players.map((p,i)=>`<div class="player"><span class="ranknum">#${i+1}</span><span class="nick">${e(p.nick)} ${p.id===room.me?'<small>VOCÊ</small>':""}</span><span class="points">${p.points} <small>PTS</small></span>${room.phase==="playing"?`<span class="sent ${p.submitted?"yes":""}">${p.submitted?"✓ ENVIOU":"AGUARDANDO"}</span>`:""}</div>`).join("")}</div>`;
 }
 function render(){
  if(room){const input=root.querySelector("#guess");if(input)draft=input.value;}
  let content="";
  if(screen==="home")content=`<section class="hero"><div class="hero-overlay"><span class="kicker">NOITES LONGAS · DISPUTAS ÉPICAS</span><img class="hero-logo" src="/assets/riviera-logo-transparent.png" alt="Riviera Showdown"><h1>Quem conhece mais?<br><em>Que vença o melhor.</em></h1><p>Uma categoria. Uma posição no ranking. Trinta segundos para acertar. Chame seus amigos e descubra quem manda na resenha.</p><div class="actions"><button class="btn lime" data-op="create">⚡ CRIAR SALA ONLINE</button><button class="btn violet" data-op="join">ENTRAR COM CÓDIGO</button></div></div></section><section class="modes"><div><span class="kicker">O JOGO DA VEZ</span><h2>Estimativa de Ranking</h2><p>Descubra quem ocupa a posição sorteada em listas de cinema, países, economia e muito mais. Quanto menor a distância, mais pontos.</p></div><div class="feature-grid"><div class="feature"><b>⚡ 30 SEGUNDOS</b><span>Todos respondem ao mesmo tempo</span></div><div class="feature"><b>🔒 PALPITES SECRETOS</b><span>Revelação só depois do tempo</span></div><div class="feature"><b>🏆 DOIS FORMATOS</b><span>Por rodadas ou corrida até X</span></div></div><a class="btn textlink" href="/offline.html">▶ Jogar no mesmo aparelho, sem internet</a></section>`;
  if(screen==="create")content=`<section class="form-page"><div class="kicker">MONTE O SEU ESQUADRÃO</div><h1>CRIAR SALA</h1><p>Configure a partida e compartilhe o convite com seus amigos.</p><form id="create-form" class="panel stack"><label>SEU APELIDO<input required name="nick" maxlength="24" minlength="2" autofocus value="${e(localStorage.getItem(NICK)||"")}" placeholder="Como vão te chamar?"></label><label>MODO DE PONTUAÇÃO<select name="mode" id="mode"><option value="rounds">Por rodadas — 1º +2, 2º +1</option><option value="race">Corrida até X — só 1º +1</option></select></label><label id="target-label">NÚMERO DE RODADAS<input name="target" type="number" min="1" max="20" value="5"></label><button class="btn lime" type="submit">CRIAR E GERAR CONVITE</button></form><button class="btn ghost" data-op="home">Voltar</button></section>`;
  if(screen==="join")content=`<section class="form-page"><div class="kicker">ENTRE NA DISPUTA</div><h1>ENTRAR NA SALA</h1><p>Peça o código de seis caracteres ao anfitrião.</p><form id="join-form" class="panel stack"><label>CÓDIGO DA SALA<input name="code" required maxlength="6" minlength="6" style="letter-spacing:.3em;text-transform:uppercase" placeholder="ABC123" value="${e(invite)}"></label><label>SEU APELIDO<input name="nick" required minlength="2" maxlength="24" placeholder="Seu nome de jogo" value="${e(localStorage.getItem(NICK)||"")}"></label><button class="btn lime" type="submit">ENTRAR E JOGAR</button></form><button class="btn ghost" data-op="home">Voltar</button></section>`;
  if(screen==="room"&&!room)content=`<section class="form-page"><h1>CONECTANDO À SALA...</h1><p>Recuperando sua partida.</p></section>`;
  if(screen==="room"&&room){
   if(room.phase==="lobby"){
    const link=location.origin+"/?room="+room.code;
    content=`<section class="game-page"><div class="roombar"><span class="kicker">SALA PRIVADA • ANFITRIÃO: ${e(room.players.find(p=>p.id===room.host)?.nick||"")}</span><span class="roomcode">${e(room.code)}</span><button class="btn small violet" data-op="copy">COPIAR CONVITE</button></div><div class="game-grid"><div class="panel"><span class="kicker">AGUARDANDO O SEU TIME</span><h1>O LOBBY ESTÁ ABERTO</h1><p>Envie o link, peça para entrarem e comece quando estiverem prontos.</p><div class="invite-link">${e(link)}</div><div class="ruleblock"><b>${room.mode==="race"?"Corrida até "+room.target+" pontos":"Partida de "+room.target+" rodadas"}</b><span>${room.mode==="race"?"Só o primeiro ganha 1 ponto por rodada":"Primeiro +2, segundo +1 ponto por rodada"}</span></div>${room.isHost?`<button class="btn lime" data-op="start" ${room.players.length<2?"disabled":""}>⚡ COMEÇAR PARTIDA (${room.players.length}/2+)</button>`:'<p class="waitmsg">Aguardando o anfitrião começar...</p>'}</div>${board()}</div></section>`;
   }else if(room.phase==="playing"){
    const qn=room.question,me=room.players.find(p=>p.id===room.me),submitted=!!me?.submitted;
    content=`<section class="game-page"><div class="round-head"><div><span class="kicker">RODADA ${room.round}${room.mode==="rounds"?" DE "+room.target:" • CORRIDA ATÉ "+room.target}</span><h1>QUAL É A POSIÇÃO?</h1></div><div class="timer" id="timer"><strong id="seconds">30</strong><small>SEGUNDOS</small></div></div><div class="game-grid"><div class="panel question"><span class="category">📊 ${e(qn.category)}</span><h2>Quem está em <strong>${qn.position}º lugar</strong>?</h2><p>Ranking TOP ${qn.limit} · ${e(qn.snapshot)}</p><div class="separator"></div>${submitted?`<div class="success-state">✓ PALPITE ENVIADO<p>Seu palpite está guardado até a revelação.</p></div>`:`<form id="guess-form" class="stack"><label>SEU PALPITE<input id="guess" name="answer" autocomplete="off" placeholder="Digite o nome exato da lista" list="options" required maxlength="100" value="${e(draft)}"></label><datalist id="options">${qn.options.map(x=>`<option value="${e(x.name)}"></option>`).join("")}</datalist><div class="actions"><button class="btn lime" type="submit">ENVIAR PALPITE</button><button class="btn ghost" type="button" data-op="pass">NÃO SEI • PASSAR</button></div></form>`}<p class="tiny">Fonte: ${e(qn.source)}. Em empate de distância, ganha quem enviou antes.</p></div>${board()}</div></section>`;
   }else if(room.phase==="reveal"||room.phase==="finished"){
    const r=room.lastResults;
    content=`<section class="game-page"><span class="kicker">RODADA ${room.round} • RESULTADO</span><h1>${room.phase==="finished"?"🏆 FIM DE JOGO":"HORA DA REVELAÇÃO"}</h1><div class="game-grid"><div class="panel"><span class="kicker">A RESPOSTA CERTA ERA</span><h2 class="revealed">${e(r?.target||"")} <small>(${r?.position}º lugar)</small></h2><div class="results">${(r?.results||[]).map((p,i)=>`<div class="result-row"><span>${i===0?"🥇":i===1?"🥈":"•"}</span><div><b>${e(p.nick)}</b><small>${e(p.answer)} ${p.rank?"· posição "+p.rank+" · distância "+p.distance:"· não pontuou"}</small></div><strong>+${p.earned}</strong></div>`).join("")}</div>${room.phase==="finished"?'<h2>O PÓDIO ESTÁ DEFINIDO!</h2>':""}${room.isHost?`<button class="btn lime" data-op="${room.phase==="finished"?"restart":"next"}">${room.phase==="finished"?"↻ JOGAR REVANCHE":"PRÓXIMA RODADA →"}</button>`:'<p class="waitmsg">Aguardando o anfitrião...</p>'}</div>${board()}</div></section>`;
   }else content=`<section class="form-page"><h1>SALA ENCERRADA</h1><p>O anfitrião fechou a partida.</p><button data-op="leave" class="btn lime">VOLTAR AO INÍCIO</button></section>`;
  }
  root.innerHTML=controls()+content+`<footer class="footer">RIVIERA SHOWDOWN <span>FEITO PARA JOGAR COM A TURMA</span></footer>`;
  setNotice("");
  updateTimer();
 }
 function updateTimer(){
  if(!room||room.phase!=="playing")return;
  const rem=Math.max(0,Math.ceil((room.deadline-Date.now()-serverOffset)/1000));
  const timer=document.getElementById("seconds"),ring=document.getElementById("timer");
  if(timer)timer.textContent=String(rem).padStart(2,"0");
  if(ring)ring.classList.toggle("urgent",rem<=10);
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
  if(!session||syncing)return;
  syncing=true;
  try{
   const next=await api("/api/room/"+session.code);
   serverOffset=next.serverNow-Date.now();
   room=next;room.code=session.code;
   const sig=JSON.stringify({phase:next.phase,players:next.players,round:next.round,question:next.question?.position,results:next.lastResults});
   if(sig!==lastSignature){lastSignature=sig;screen="room";render();}
   updateTimer();
  }catch(err){setNotice(err.message==="Sua sessão não pertence a esta sala"?"Sua sessão expirou. Entre novamente.":err.message)}
  finally{syncing=false}
 }
 function connect(){
  if(!session)return;
  try{if(ws)ws.close();ws=new WebSocket((location.protocol==="https:"?"wss:":"ws:")+"//"+location.host+"/api/room/"+session.code+"/ws?token="+encodeURIComponent(session.token));ws.onmessage=()=>sync();}catch{}
 }
 async function sendAction(action,body){
  if(busy)return;
  busy=true;
  try{await api("/api/room/"+session.code+"/"+action,"POST",body||{});draft="";await sync()}
  catch(err){setNotice(err.message)}
  finally{busy=false}
 }
 root.addEventListener("input",event=>{if(event.target?.id==="guess")draft=event.target.value});
 root.addEventListener("change",event=>{
  if(event.target?.id==="mode"){
   const label=document.getElementById("target-label");
   if(label)label.firstChild.textContent=event.target.value==="race"?"META DE PONTOS":"NÚMERO DE RODADAS";
  }
 });
 root.addEventListener("click",async event=>{
  const btn=event.target.closest("[data-op]");if(!btn)return;
  const op=btn.dataset.op;
  if(op==="home"||op==="leave"){if(op==="leave"){session=null;room=null;lastSignature="";localStorage.removeItem(KEY);ws?.close();history.replaceState({},"",location.pathname);}screen="home";render();}
  if(op==="create"||op==="join"){screen=op;render()}
  if(op==="copy"){
   try{await navigator.clipboard.writeText(location.origin+"/?room="+session.code);setNotice("Link copiado! Compartilhe com seus amigos.")}
   catch{setNotice("Copie o link na barra do navegador: "+location.origin+"/?room="+session.code)}
  }
  if(op==="start"||op==="next"||op==="restart"||op==="pass")await sendAction(op);
 });
 root.addEventListener("submit",async event=>{
  event.preventDefault();if(busy)return;
  const form=event.target;busy=true;
  try{
   if(form.id==="create-form"){
    const fd=new FormData(form),nick=String(fd.get("nick")).trim(),mode=String(fd.get("mode")),target=Number(fd.get("target"));
    const data=await api("/api/room","POST",{nick,mode,target});
    localStorage.setItem(NICK,nick);session=data;localStorage.setItem(KEY,JSON.stringify(session));history.replaceState({},"","/?room="+data.code);screen="room";lastSignature="";room=null;connect();await sync();
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
    await api("/api/room/"+session.code+"/guess","POST",{answer});draft="";await sync();
   }
  }catch(err){setNotice(err.message)}
  finally{busy=false}
 });
 render();
 if(session){connect();sync()}
 setInterval(()=>{updateTimer();if(session)sync()},2000);
})();
