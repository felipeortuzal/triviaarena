// Riviera Showdown — Cloudflare Workers + SQLite-backed Durable Objects.

// All guesses and scoring are authoritative inside the room object.

const BANKS = [{"id":"area","title":"Maiores países e territórios","source":"Worldometer — Maiores Países do Mundo","snapshot":"Consulta: novembro de 2026","items":["Rússia","Canadá","China","Estados Unidos","Brasil","Austrália","Índia","Argentina","Cazaquistão","Argélia","RD Congo","Groenlândia","Arábia Saudita","México","Indonésia","Sudão","Líbia","Irã","Mongólia","Peru","Chade","Níger","Angola","Mali","África do Sul","Colômbia","Etiópia","Bolívia","Mauritânia","Egito","Tanzânia","Nigéria","Venezuela","Paquistão","Namíbia","Moçambique","Turquia","Chile","Zâmbia","Mianmar","Afeganistão","Somália","República Centro-Africana","Sudão do Sul","Ucrânia","Madagascar","Botsuana","Quênia","França","Iêmen","Tailândia","Espanha","Turcomenistão","Camarões","Papua-Nova Guiné","Suécia","Uzbequistão","Marrocos","Iraque","Paraguai","Zimbábue","Japão","Alemanha","Filipinas","Congo","Finlândia","Vietnã","Malásia","Noruega","Costa do Marfim","Polônia","Omã","Itália","Equador","Burkina Faso","Nova Zelândia","Gabão","Saara Ocidental","Guiné","Reino Unido","Uganda","Gana","Romênia","Laos","Guiana","Bielorrússia","Quirguistão","Senegal","Síria","Camboja","Uruguai","Suriname","Tunísia","Bangladesh","Nepal","Tajiquistão","Grécia","Nicarágua","Coreia do Norte","Malawi"]},{"id":"population","title":"Mais populosos do planeta","source":"Worldometer — Population by Country 2026","snapshot":"Estimativa 2026","items":["Índia","China","Estados Unidos","Indonésia","Paquistão","Nigéria","Brasil","Bangladesh","Rússia","Etiópia","México","Japão","Egito","Filipinas","RD Congo","Vietnã","Irã","Turquia","Alemanha","Tanzânia","Tailândia","Reino Unido","França","África do Sul","Itália","Quênia","Mianmar","Colômbia","Sudão","Uganda","Coreia do Sul","Argélia","Iraque","Espanha","Argentina","Afeganistão","Iêmen","Canadá","Angola","Ucrânia","Marrocos","Polônia","Uzbequistão","Moçambique","Malásia","Gana","Arábia Saudita","Peru","Madagascar","Costa do Marfim","Camarões","Nepal","Níger","Venezuela","Austrália","Coreia do Norte","Síria","Mali","Burkina Faso","Sri Lanka","Taiwan","Malawi","Zâmbia","Chade","Cazaquistão","Somália","Chile","Senegal","Guatemala","Romênia","Países Baixos","Equador","Camboja","Zimbábue","Guiné","Benim","Ruanda","Burundi","Bolívia","Sudão do Sul","Tunísia","Haiti","Bélgica","República Dominicana","Jordânia","Emirados Árabes Unidos","Honduras","Tajiquistão","Papua-Nova Guiné","Cuba","Suécia","Chéquia","Azerbaijão","Portugal","Togo","Grécia","Israel","Hungria","Áustria","Suíça"]},{"id":"gdp","title":"Maiores economias do mundo","source":"Worldometer / FMI — GDP by Country 2025","snapshot":"FMI WEO outubro de 2026","items":["Estados Unidos","China","Alemanha","Japão","Reino Unido","Índia","França","Rússia","Itália","Canadá","Brasil","Espanha","Coreia do Sul","Austrália","México","Turquia","Indonésia","Países Baixos","Arábia Saudita","Suíça","Polônia","Taiwan","Bélgica","Argentina","Irlanda","Suécia","Israel","Emirados Árabes Unidos","Singapura","Áustria","Tailândia","Noruega","Vietnã","Filipinas","Malásia","Dinamarca","Bangladesh","Colômbia","Romênia","África do Sul","Hong Kong","Paquistão","Chéquia","Irã","Egito","Chile","Portugal","Peru","Finlândia","Cazaquistão","Nigéria","Argélia","Grécia","Iraque","Nova Zelândia","Hungria","Catar","Ucrânia","Cuba","Marrocos","Kuwait","Eslováquia","Uzbequistão","Angola","Quênia","Bulgária","Equador","Porto Rico","República Dominicana","Etiópia","Guatemala","Gana","Omã","Sri Lanka","Croácia","Costa Rica","Venezuela","Luxemburgo","Sérvia","Costa do Marfim","Bielorrússia","Lituânia","RD Congo","Panamá","Tanzânia","Uruguai","Mianmar","Eslovênia","Turcomenistão","Azerbaijão","Uganda","Bolívia","Jordânia","Camarões","Zimbábue","Tunísia","Macau","Camboja","Paraguai","Bahrein"]},{"id":"movies","title":"Filmes mais bem avaliados","source":"IMDb Top 250 — cópia histórica de 01/11/2026","snapshot":"Retrato: 1º de novembro de 2026","items":["The Shawshank Redemption","The Godfather","The Dark Knight","The Godfather: Part II","The Lord of the Rings: The Return of the King","12 Angry Men","Schindler's List","The Lord of the Rings: The Fellowship of the Ring","Pulp Fiction","The Lord of the Rings: The Two Towers","The Good, the Bad and the Ugly","Forrest Gump","Inception","Fight Club","Star Wars: Episode V - The Empire Strikes Back","The Matrix","Interstellar","Goodfellas","One Flew Over the Cuckoo's Nest","Se7en","It's a Wonderful Life","The Silence of the Lambs","Saving Private Ryan","Seven Samurai","The Green Mile","Cidade de Deus","Life Is Beautiful","Terminator 2: Judgment Day","Back to the Future","Star Wars: Episode IV - A New Hope","Spirited Away","Gladiator","The Pianist","Kill Bill: The Whole Bloody Affair","Parasite","Grave of the Fireflies","Harakiri","The Lion King (1994)","Psycho","The Departed","Whiplash","The Prestige","American History X","Spider-Man: Across the Spider-Verse","Cinema Paradiso","Léon: The Professional","Casablanca","The Intouchables","The Usual Suspects","Django Unchained","Alien","Rear Window","Modern Times","Once Upon a Time in the West","WALL-E","City Lights","Apocalypse Now","Avengers: Infinity War","Memento","Dune: Part Two","Raiders of the Lost Ark","Spider-Man: Into the Spider-Verse","The Lives of Others","The Odyssey (2026)","Sunset Boulevard","Witness for the Prosecution","Paths of Glory","Inglourious Basterds","The Shining","The Great Dictator","Aliens","High and Low","12th Fail","Avengers: Endgame","Good Will Hunting","Coco","Toy Story (1995)","The Dark Knight Rises","Amadeus","Your Name","3 Idiots","Braveheart","Das Boot","Princess Mononoke","Oldboy","Dr. Strangelove","American Beauty","Attack on Titan: The Last Attack","Capernaum","Singin' in the Rain","Once Upon a Time in America","Joker (2019)","Toy Story 3","Star Wars: Episode VI - Return of the Jedi","Come and See","Requiem for a Dream","Incendies","Ikiru","The Hunt (2012)","Eternal Sunshine of the Spotless Mind"]}];
BANKS.push(...[{"id":"br-area","title":"Estados do Brasil por área territorial","source":"IBGE — Áreas Territoriais 2025","snapshot":"IBGE, 2025","sourceUrl":"https://www.ibge.gov.br/geociencias/organizacao-do-territorio/estrutura-territorial/15761-areas-territoriais.html","items":["Amazonas","Pará","Mato Grosso","Minas Gerais","Bahia","Mato Grosso do Sul","Goiás","Maranhão","Rio Grande do Sul","Tocantins","Piauí","São Paulo","Rondônia","Roraima","Paraná","Acre","Ceará","Amapá","Pernambuco","Santa Catarina","Paraíba","Rio Grande do Norte","Espírito Santo","Rio de Janeiro","Alagoas","Sergipe","Distrito Federal"]},{"id":"br-pop","title":"Estados brasileiros mais populosos","source":"IBGE — Estimativas da População das UFs","snapshot":"IBGE, 2025","sourceUrl":"https://agenciadenoticias.ibge.gov.br/media/com_mediaibge/arquivos/8383bdedce5a6d972e60dd32671e533a.pdf","items":["São Paulo","Minas Gerais","Rio de Janeiro","Bahia","Paraná","Rio Grande do Sul","Pernambuco","Ceará","Pará","Santa Catarina","Goiás","Maranhão","Amazonas","Paraíba","Espírito Santo","Mato Grosso","Rio Grande do Norte","Piauí","Alagoas","Distrito Federal","Mato Grosso do Sul","Sergipe","Rondônia","Tocantins","Acre","Amapá","Roraima"]},{"id":"pokemon","title":"Pokédex Nacional — primeiros 30","source":"The Pokémon Company — National Pokédex","snapshot":"Pokédex Nacional #1–30","sourceUrl":"https://www.pokemon.com/pokedex/","items":["Bulbasaur","Ivysaur","Venusaur","Charmander","Charmeleon","Charizard","Squirtle","Wartortle","Blastoise","Caterpie","Metapod","Butterfree","Weedle","Kakuna","Beedrill","Pidgey","Pidgeotto","Pidgeot","Rattata","Raticate","Spearow","Fearow","Ekans","Arbok","Pikachu","Raichu","Sandshrew","Sandslash","Nidoran♀","Nidorina"]},{"id":"elementos","title":"Tabela Periódica — ordem atômica","source":"IUPAC — Periodic Table","snapshot":"Números atômicos 1–30","sourceUrl":"https://iupac.org/what-we-do/periodic-table-of-elements/","items":["Hidrogênio","Hélio","Lítio","Berílio","Boro","Carbono","Nitrogênio","Oxigênio","Flúor","Neônio","Sódio","Magnésio","Alumínio","Silício","Fósforo","Enxofre","Cloro","Argônio","Potássio","Cálcio","Escândio","Titânio","Vanádio","Cromo","Manganês","Ferro","Cobalto","Níquel","Cobre","Zinco"]}]);

export function normalizeAnswer(s){return String(s||"").replace(/♀/g," female ").replace(/♂/g," male ").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ")}

function safeJson(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}})}

function randomToken(){return Array.from(crypto.getRandomValues(new Uint8Array(24)),x=>x.toString(16).padStart(2,"0")).join("")}

function randomCode(){const a="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",r=crypto.getRandomValues(new Uint8Array(6));return Array.from(r,x=>a[x%a.length]).join("")}

const SYNONYMS={
 "estados unidos":["eua","usa","united states"],"reino unido":["uk","inglaterra","united kingdom"],"rd congo":["rdc","republica democratica do congo"],"paises baixos":["holanda","netherlands"],
 "sao paulo":["sp"],"rio de janeiro":["rj"],"minas gerais":["mg"],"rio grande do sul":["rs"],"mato grosso":["mt"],"mato grosso do sul":["ms"],"distrito federal":["df","brasilia"],"espirito santo":["es"],"parana":["pr"],"bahia":["ba"],"ceara":["ce"],"pernambuco":["pe"],"santa catarina":["sc"],"rio grande do norte":["rn"],"paraiba":["pb"],"maranhao":["ma"],"goias":["go"],"amazonas":["am"],"para":["pa"],"acre":["ac"],"amapa":["ap"],"roraima":["rr"],"rondonia":["ro"],"sergipe":["se"],"alagoas":["al"],"piaui":["pi"],"tocantins":["to"],
 "the godfather":["o poderoso chefao"],"the godfather part ii":["o poderoso chefao 2"],"the shawshank redemption":["um sonho de liberdade"],"the dark knight":["batman o cavaleiro das trevas"],"the matrix":["matrix"],"inception":["a origem"],"interstellar":["interestelar"],"fight club":["clube da luta"],"forrest gump":["forrest gump o contador de historias"],
 "bulbasaur":["bulbassauro"],"ivysaur":["ivissauro"],"venusaur":["venussauro"],"nidoran female":["nidoran femea","nidoran f"]
};
export function levenshtein(a,b){if(Math.abs(a.length-b.length)>3)return 99;let last=Array.from({length:b.length+1},(_,j)=>j);for(let i=1;i<=a.length;i++){const next=[i];for(let j=1;j<=b.length;j++)next[j]=Math.min(next[j-1]+1,last[j]+1,last[j-1]+(a[i-1]===b[j-1]?0:1));last=next;}return last[b.length];}
export function matchAnswer(raw,options){const value=normalizeAnswer(raw);if(!value)return -1;const exact=options.findIndex(item=>normalizeAnswer(item)===value);if(exact>=0)return exact;const alias=options.findIndex(item=>(SYNONYMS[normalizeAnswer(item)]||[]).map(normalizeAnswer).includes(value));if(alias>=0)return alias;if(value.length<6)return -1;let best=99,at=-1,ties=0;options.forEach((item,i)=>{const d=levenshtein(value,normalizeAnswer(item));if(d<best){best=d;at=i;ties=1}else if(d===best)ties++});return best<=2&&ties===1?at:-1;}
function suggestAnswer(raw,options){const q=normalizeAnswer(raw);return options.map(v=>({v,d:levenshtein(q,normalizeAnswer(v))})).sort((a,b)=>a.d-b.d).slice(0,3).map(x=>x.v)}

export function chooseQuestion(room){
 const choices=[];
 for(let bi=0;bi<BANKS.length;bi++)for(const limit of [...new Set([25,50,100].map(n=>Math.min(n,BANKS[bi].items.length)))])for(let position=1;position<=Math.min(limit,30);position++){
   const key=`${bi}:${limit}:${position}`;if(!room.used.includes(key))choices.push({key,bi,limit,position});
 }
 if(!choices.length)room.used=[];
 const selected=(choices.length?choices:[{key:"0:25:1",bi:0,limit:25,position:1}])[Math.floor(Math.random()*(choices.length||1))];
 room.used.push(selected.key); room.question=selected;room.answers={};room.lastResults=null;room.reactions=[];
 room.round+=1; room.phase="playing";room.deadline=Date.now()+30000;
}

export function finalizeRoom(room,now){
 if(room.phase!=="playing")return false;
 const every=Object.keys(room.players).every(pid=>Object.hasOwn(room.answers,pid));
 if(!every&&now<room.deadline)return false;
 const q=room.question,board=BANKS[q.bi].items;
 const scored=Object.entries(room.answers).filter(([,a])=>a.rank!==null).map(([pid,a])=>({pid,nick:room.players[pid]?.nick||"Jogador",answer:a.answer,rank:a.rank,distance:Math.abs(a.rank-q.position),at:a.at})).sort((a,b)=>a.distance-b.distance||a.at-b.at||a.pid.localeCompare(b.pid));
 const results=Object.entries(room.players).map(([pid,p])=>{
   const a=room.answers[pid],found=scored.find(t=>t.pid===pid),index=scored.findIndex(t=>t.pid===pid);
   const earned=found?(room.mode==="race"?(index===0?1:0):index===0?2:index===1?1:0):0;
   p.points+=earned;
   return {pid,nick:p.nick,answer:a?.answer||"Sem resposta",rank:a?.rank??null,distance:found?.distance??null,earned,points:p.points,missed:!a||a.rank===null};
 }).sort((a,b)=>b.earned-a.earned||(a.distance??999)-(b.distance??999)||a.nick.localeCompare(b.nick));
 room.lastResults={target:board[q.position-1],position:q.position,round:room.round,results};
 room.phase=(room.mode==="race"?Object.values(room.players).some(p=>p.points>=room.target)||room.round>=30:room.round>=room.target)?"finished":"reveal";
 return true;
}

export class ArenaRoom{
 constructor(ctx,env){this.ctx=ctx;this.env=env}
 async change(fn){
  let result;
  await this.ctx.storage.transaction(async tx=>{
    const state=await tx.get("room");
    result=fn(state);
    if(result.change)await tx.put("room",result.state);
  });
  if(result?.change)this.broadcast();
  if(result?.alarm)await this.ctx.storage.setAlarm(result.alarm);
  return result;
 }
 broadcast(){
  for(const ws of this.ctx.getWebSockets()){
   try{ws.send(JSON.stringify({type:"changed",at:Date.now()}))}catch{}
  }
 }
 async alarm(){
  await this.change(room=>{
   if(!room)return {error:"Sala não existe",status:404};
   const changed=finalizeRoom(room,Date.now());
   return {change:changed,state:room,alarm:!changed&&room.phase==="playing"?room.deadline+100:undefined};
  });
 }
 async fetch(req){
  const url=new URL(req.url),path=url.pathname;
  if(path==="/ws"){
   const room=await this.ctx.storage.get("room"),p=Object.entries(room?.players||{}).find(([,v])=>v.token===url.searchParams.get("token"));
   if(!p)return safeJson({error:"Convite inválido ou sessão expirada"},403);
   if(req.headers.get("Upgrade")!=="websocket")return safeJson({error:"WebSocket necessário"},400);
   const pair=new WebSocketPair();const [client,server]=Object.values(pair);
   this.ctx.acceptWebSocket(server);server.serializeAttachment({playerId:p[0]});
   return new Response(null,{status:101,webSocket:client});
  }
  let body={};
  if(req.method==="POST"){try{body=await req.json();if(!body||typeof body!=="object")throw Error()}catch{return safeJson({error:"JSON inválido"},400)}}
  const token=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
  const r=await this.change(room=>{
   const now=Date.now();
   if(path==="/create"){
    if(room)return {error:"Código já está em uso",status:409};
    const nick=String(body.nick||"").trim().slice(0,24),mode=body.mode==="race"?"race":"rounds";
    if(nick.length<2)return {error:"Digite um nome com pelo menos 2 letras",status:400};
    const target=Math.max(1,Math.min(mode==="race"?15:20,Number.parseInt(body.target)||5));
    const id=crypto.randomUUID(),secret=randomToken(),newRoom={host:id,players:{[id]:{nick,token:secret,points:0,ready:false,lastSeen:now}},mode,target,round:0,used:[],answers:{},phase:"lobby",created:now};
    return {change:true,state:newRoom,data:{id,token:secret}};
   }
   if(!room)return {error:"Sala não encontrada",status:404};
   if(now-(room.created||now)>24*60*60*1000&&room.phase!=="closed"){room.phase="closed";return {change:true,state:room,error:"Essa sala expirou. Crie uma nova.",status:410};}
   if(room.phase==="closed"&&path==="/join")return {error:"Sala encerrada. Solicite outro convite.",status:410};
   if(path==="/join"){
    if(room.phase!=="lobby")return {error:"A partida já começou",status:409};
    if(Object.keys(room.players).length>=12)return {error:"Sala cheia (máximo 12 jogadores)",status:409};
    const nick=String(body.nick||"").trim().slice(0,24);
    if(nick.length<2)return {error:"Digite um apelido com pelo menos 2 letras",status:400};
    if(Object.values(room.players).some(p=>normalizeAnswer(p.nick)===normalizeAnswer(nick)))return {error:"Já existe um jogador com esse nome",status:409};
    const id=crypto.randomUUID(),secret=randomToken();
    room.players[id]={nick,token:secret,points:0,ready:false,lastSeen:now};
    return {change:true,state:room,data:{id,token:secret}};
   }
   const member=Object.entries(room.players).find(([,p])=>p.token===token);
   if(!member)return {error:"Sua sessão não pertence a esta sala",status:403};
   const id=member[0],isHost=id===room.host;
   let changed=finalizeRoom(room,now);
   if(path==="/state"){
    const q=room.question,bank=q?BANKS[q.bi]:null;
    const players=Object.entries(room.players).map(([pid,p])=>({id:pid,nick:p.nick,points:p.points,ready:!!p.ready,online:now-(p.lastSeen||room.created||now)<35000,submitted:!!room.answers[pid]})).sort((a,b)=>b.points-a.points||a.nick.localeCompare(b.nick));
    return {change:changed,state:room,data:{version:"1.2",phase:room.phase,code:room.code,host:room.host,me:id,isHost,mode:room.mode,target:room.target,round:room.round,deadline:room.deadline||null,serverNow:now,players,question:q?{category:bank.title,source:bank.source,snapshot:bank.snapshot,position:q.position,limit:q.limit,options:bank.items.slice(0,q.limit).map(x=>({name:x})).sort((a,b)=>normalizeAnswer(a.name).localeCompare(normalizeAnswer(b.name)))}:null,lastResults:room.phase==="reveal"||room.phase==="finished"?room.lastResults:null,reactions:(room.reactions||[]).filter(evt=>now-evt.at<8500).map(evt=>({id:evt.id,emoji:evt.emoji,nick:evt.nick,at:evt.at}))}};
   }
   if(!isHost&&["start","next","restart","close","kick","handoff"].includes(path.slice(1)))return {error:"Somente o anfitrião pode fazer isso",status:403};
   if(path==="/heartbeat"){
     room.players[id].lastSeen=now;
     const h=room.players[room.host];
     if(!h||now-(h.lastSeen||room.created||now)>75000){
       const available=Object.entries(room.players).filter(([pid,p])=>pid!==room.host&&now-(p.lastSeen||0)<35000);
       if(available.length)room.host=available.sort((a,b)=>(b[1].lastSeen||0)-(a[1].lastSeen||0))[0][0];
     }
     return {change:true,state:room,data:{ok:true,host:room.host}};
   }
   if(path==="/react"){
     const emojis=["🔥","😂","👏","🤯","🏆","😎"];
     const emoji=String(body.emoji||"");
     if(!emojis.includes(emoji))return {error:"Reação inválida",status:400};
     if(room.phase==="closed")return {error:"Sala encerrada",status:410};
     const actor=room.players[id];
     if(now-(actor.lastReactionAt||0)<1200)return {error:"Aguarde um instante para reagir novamente",status:429};
     actor.lastReactionAt=now;
     room.reactions=(room.reactions||[]).filter(evt=>now-evt.at<8500).slice(-11);
     const event={id:crypto.randomUUID(),emoji,nick:actor.nick,at:now};
     room.reactions.push(event);
     return {change:true,state:room,data:{ok:true,eventId:event.id}};
   }
   if(path==="/ready"){
     if(room.phase!=="lobby")return {error:"Pronto só pode ser alterado no lobby",status:409};
     room.players[id].ready=!room.players[id].ready;
     return {change:true,state:room,data:{ok:true,ready:room.players[id].ready}};
   }
   if(path==="/kick"){
     if(room.phase!=="lobby")return {error:"Só é possível remover alguém antes da partida",status:409};
     const target=String(body.playerId||"");
     if(!room.players[target]||target===id)return {error:"Jogador inválido",status:400};
     delete room.players[target];return {change:true,state:room,data:{ok:true}};
   }
   if(path==="/handoff"){
     const target=String(body.playerId||"");
     if(!room.players[target]||target===id)return {error:"Selecione outro jogador",status:400};
     room.host=target;return {change:true,state:room,data:{ok:true}};
   }
   if(path==="/leave"){
     if(room.phase!=="lobby"&&room.phase!=="finished")return {error:"Termine a rodada antes de sair definitivamente",status:409};
     delete room.players[id];if(room.host===id)room.host=Object.keys(room.players)[0]||null;
     if(!room.host)room.phase="closed";
     return {change:true,state:room,data:{ok:true}};
   }
   if(path==="/start"){
    if(room.phase!=="lobby")return {error:"A partida já foi iniciada",status:409};
    if(Object.keys(room.players).length<2)return {error:"São necessários 2 jogadores",status:409};
    chooseQuestion(room);changed=true;
    return {change:true,state:room,data:{ok:true},alarm:room.deadline};
   }
   if(path==="/guess"||path==="/pass"){
    if(room.phase!=="playing"||now>=room.deadline)return {change:changed,state:room,error:"A rodada já terminou",status:409};
    if(Object.hasOwn(room.answers,id))return {error:"Você já respondeu nesta rodada",status:409};
    let answer="Passou",rank=null;
    if(path==="/guess"){
      const raw=String(body.answer||"").trim().slice(0,100);
      if(!raw)return {error:"Digite um palpite ou use Passar",status:400};
      const bank=BANKS[room.question.bi],options=bank.items.slice(0,room.question.limit),index=matchAnswer(raw,options);
      if(index<0)return {error:"Item não reconhecido. Tente uma sugestão: "+suggestAnswer(raw,options).join(", "),status:422};
      rank=index+1;answer=bank.items[index];
      if(Object.values(room.answers).some(a=>a.rank===rank))return {error:"Outro jogador já escolheu esse item! Tente outro.",status:409};
    }
    room.answers[id]={answer,rank,at:now};
    finalizeRoom(room,now);
    return {change:true,state:room,data:{ok:true},alarm:room.phase==="playing"?room.deadline:undefined};
   }
   if(path==="/next"){
    if(room.phase!=="reveal")return {error:"Ainda não é hora da próxima rodada",status:409};
    chooseQuestion(room);
    return {change:true,state:room,data:{ok:true},alarm:room.deadline};
   }
   if(path==="/restart"){
    if(room.phase!=="finished")return {error:"Termine a partida antes da revanche",status:409};
    for(const p of Object.values(room.players))p.points=0;
    room.round=0;room.used=[];
    chooseQuestion(room);return {change:true,state:room,data:{ok:true},alarm:room.deadline};
   }
   if(path==="/close"){
    room.phase="closed";return {change:true,state:room,data:{ok:true}};
   }
   return {error:"Ação inexistente",status:404};
  });
  if(r.error)return safeJson({error:r.error},r.status||400);
  return safeJson(r.data??{ok:true});
 }
}

async function handleRequest(request,env){
 const url=new URL(request.url),path=url.pathname;
 if(path==="/api/status")return safeJson({app:"Riviera Showdown",online:true,version:"1.2",rankings:BANKS.length});
 if(path==="/api/rankings")return safeJson({rankings:BANKS.map(b=>({id:b.id,title:b.title,source:b.source,snapshot:b.snapshot,count:b.items.length,sourceUrl:b.sourceUrl||null}))});
 if(path==="/api/room"&&request.method==="POST"){
  let body;try{body=await request.json()}catch{return safeJson({error:"JSON inválido"},400)}
  for(let i=0;i<8;i++){
   const code=randomCode(),stub=env.ARENA.get(env.ARENA.idFromName(code));
   const resp=await stub.fetch(new Request("https://room/create",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}));
   if(resp.status===409)continue;
   const data=await resp.json();
   return safeJson({...data,code},resp.status);
  }
  return safeJson({error:"Não foi possível abrir uma sala. Tente novamente."},503);
 }
 const match=path.match(/^\/api\/room\/([A-HJ-NP-Z2-9]{6})(?:\/(ws|join|start|guess|pass|next|restart|close|heartbeat|ready|kick|handoff|leave|react))?$/);
 if(match){
  const [_,code,action]=match,stub=env.ARENA.get(env.ARENA.idFromName(code));
  const suffix=action?"/"+action:"/state",remote=new URL("https://room"+suffix);
  if(action==="ws"){remote.pathname="/ws";remote.search=url.search;}
  const headers=new Headers(request.headers);headers.delete("host");
  return stub.fetch(new Request(remote.toString(),{method:request.method,headers,body:request.method==="POST"?request.body:undefined}));
 }
 if(path.startsWith("/api/"))return safeJson({error:"Rota não encontrada"},404);
 return env.ASSETS.fetch(request);
}

export default {fetch:handleRequest};