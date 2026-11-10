import {isEligibleRanking,calculateRanking} from "./rank-tools-v5.js";
// Máquina V5: sorteios, 2 modos, segregação de respostas e apuração atômica.
export const makePartyGame=function makePartyGame({db,uid,api,getPuzzles,getRankings,randomIndex,calculateRanking,isEligibleRanking}){
  const {ref,get,set,onValue,runTransaction}=api;
  const roomAt=code=>ref(db,`roomPublic/${code}`);
  const regAt=code=>ref(db,`roomRegistry/${code}`);
  const ensureHost=state=>{if(!state||state.host!==uid)throw Error("Somente o anfitrião pode conduzir a partida.");};
  const rankings=()=>getRankings().filter(isEligibleRanking);
  const random=n=>{
    if(n<1)throw Error("Catálogo sem desafios disponíveis.");
    const result=randomIndex(n);
    if(!Number.isInteger(result)||result<0||result>=n)throw Error("Sorteio inválido.");
    return result;
  };
  function chooseRound(state){
    const nextType=state.mode==="rank"?"rank":state.mode==="letters"?"letters":state.round?.type==="letters"?"rank":"letters";
    const number=(state.number||0)+1;
    if(nextType==="letters"){
      const puzzles=getPuzzles();
      if(!puzzles.length)throw Error("Não há frases disponíveis.");
      const used=Array.isArray(state.usedLetters)?state.usedLetters:[];
      const eligible=puzzles.map((p,i)=>({p,i})).filter(x=>x.p.status!=="inactive").map(x=>x.i);
      const pool=eligible.filter(i=>!used.includes(i));
      const choices=pool.length?pool:eligible;
      const index=choices[random(choices.length)];
      return {number,usedLetters:pool.length?[...used,index]:[index],
        round:{type:"letters",id:`frase-${number}`,index,hints:0,revealed:false,scored:false,
          topic:puzzles[index].topic||"Geral",level:puzzles[index].level||"Geral",
          content:{id:puzzles[index].id||"legacy-"+index,code:puzzles[index].code,answer:puzzles[index].answer,
            explain:puzzles[index].explain||"",hints:puzzles[index].hints||[],topic:puzzles[index].topic||"Geral",
            level:puzzles[index].level||"Geral"}}};
    }
    const available=rankings();
    if(!available.length)throw Error("As listas de ranking não estão prontas para jogar.");
    const used=Array.isArray(state.usedRanks)?state.usedRanks:[];
    const all=[];
    for(const list of available){
      for(const limit of (list.allowedCuts||[25,50,75,100]).filter(n=>n<=list.items.length)){
        for(let target=1;target<=limit;target++)all.push({categoryId:list.id,limit,target});
      }
    }
    const fresh=all.filter(e=>!used.includes(`${e.categoryId}:${e.limit}:${e.target}`));
    const options=fresh.length?fresh:all;
    const pick=options[random(options.length)];
    const key=`${pick.categoryId}:${pick.limit}:${pick.target}`;
    const selectedList=available.find(l=>l.id===pick.categoryId);
    return {number,usedRanks:fresh.length?[...used,key]:[key],
      round:{type:"rank",id:`ranking-${number}`,categoryId:pick.categoryId,limit:pick.limit,target:pick.target,
        revealed:false,scored:false,resultReady:false,
        catalog:{...selectedList,items:[...selectedList.items],aliases:{...(selectedList.aliases||{})}}}};
  }
  async function start(code){
    const preview=(await get(roomAt(code))).val();
    ensureHost(preview);
    if(!["letters","rank","mixed"].includes(preview.mode))throw Error("Modo desconhecido.");
    if(preview.mode!=="letters"&&!rankings().length)throw Error("Rankings indisponíveis.");
    const registry=(await get(regAt(code))).val();
    if(!registry||registry.host!==uid||!["open","locked"].includes(registry.phase))throw Error("Convite encerrado.");
    if(registry.phase==="open"){
      const t=await runTransaction(ref(db,`roomRegistry/${code}/phase`),v=>v===null||v==="open"?"locked":undefined,{applyLocally:false});
      if(!t.committed&&(await get(regAt(code))).val()?.phase!=="locked")throw Error("Não foi possível fechar novas entradas.");
    }
    const t=await runTransaction(roomAt(code),value=>{
      const old=value||preview;
      if(!old||old.host!==uid||old.phase!=="lobby")return;
      const next=chooseRound(old);
      return {...old,...next,phase:"playing"};
    },{applyLocally:false});
    if(t.committed)return t.snapshot.val();
    const current=(await get(roomAt(code))).val();
    if(current?.phase==="playing")return current;
    throw Error("Não foi possível iniciar a partida.");
  }
  async function hint(code){
    const initial=(await get(roomAt(code))).val();
    ensureHost(initial);
    const t=await runTransaction(roomAt(code),value=>{
      const old=value||initial;
      if(old.phase!=="playing"||old.round?.type!=="letters"||old.round.revealed||old.round.hints>=2)return;
      return {...old,round:{...old.round,hints:(old.round.hints||0)+1}};
    },{applyLocally:false});
    return t.committed;
  }
  async function revealPhrase(code){
    const initial=(await get(roomAt(code))).val();
    ensureHost(initial);
    const t=await runTransaction(roomAt(code),value=>{
      const old=value||initial;
      if(old.phase!=="playing"||old.round?.type!=="letters"||old.round.revealed)return;
      return {...old,round:{...old.round,revealed:true}};
    },{applyLocally:false});
    return t.committed;
  }
  async function submitGuess(code,guess){
    const answer=String(guess??"").trim();
    if(!answer||answer.length>120)throw Error("Digite o nome de um item (1–120 caracteres).");
    const state=(await get(roomAt(code))).val();
    if(!state||state.phase!=="playing"||state.round?.type!=="rank"||state.round.revealed)throw Error("Esta rodada não aceita novos palpites.");
    if(!state.profiles?.[uid])throw Error("Você não está inscrito na sala.");
    const id=state.round.id;
    await set(ref(db,`roomPrivateGuesses/${code}/${id}/${uid}`),answer);
    // Status é um booleano público, NUNCA o texto enviado.
    await set(ref(db,`roomGuessStatus/${code}/${id}/${uid}`),true);
    return answer;
  }
  function watchMyGuess(code,roundId,onGuess,onError){
    return onValue(ref(db,`roomPrivateGuesses/${code}/${roundId}/${uid}`),s=>onGuess(s.val()||""),onError);
  }
  function watchSubmissions(code,roundId,onStatus,onError){
    return onValue(ref(db,`roomGuessStatus/${code}/${roundId}`),s=>onStatus(s.val()||{}),onError);
  }
  async function revealRanking(code){
    const current=(await get(roomAt(code))).val();
    ensureHost(current);
    if(current.phase!=="playing"||current.round?.type!=="rank")throw Error("Esta rodada não é de ranking.");
    const id=current.round.id;
    const locked=await runTransaction(ref(db,`roomPublic/${code}/round/revealed`),v=>v===true?undefined:true,{applyLocally:false});
    if(!locked.committed){
      const latest=(await get(roomAt(code))).val();
      if(!latest.round?.revealed)throw Error("Falha ao encerrar os palpites.");
      if(latest.round.resultReady)return latest;
    }
    // O RTDB só permite leitura do palpite alheio AO HOST após a revelação.
    // Os palpites não são copiados para a sala pública antes desse ponto.
    const state=(await get(roomAt(code))).val();
    if(state.round.id!==id)throw Error("A rodada mudou. Reabra os resultados.");
    const guesses={};
    for(const memberUid of Object.keys(state.profiles||{})){
      const s=await get(ref(db,`roomPrivateGuesses/${code}/${id}/${memberUid}`));
      if(s.exists())guesses[memberUid]=s.val();
    }
    const list=state.round.catalog||rankings().find(l=>l.id===state.round.categoryId);
    if(!list)throw Error("Lista não encontrada para apuração.");
    const review=calculateRanking({list,limit:state.round.limit,target:state.round.target,
      guesses,members:Object.keys(state.profiles||{})});
    const result=await runTransaction(roomAt(code),value=>{
      const old=value||state;
      if(old.round?.id!==id||old.phase!=="playing"||old.round.resultReady||!old.round.revealed)return;
      return {...old,round:{...old.round,resultReady:true,review,guesses,overrides:{}}};
    },{applyLocally:false});
    return result.committed?result.snapshot.val():(await get(roomAt(code))).val();
  }
  async function correctRanking(code,{player,position,reason}){
    const note=String(reason||"").trim().slice(0,180);
    if(note.length<8)throw Error("Explique a correção em pelo menos 8 caracteres.");
    const state=(await get(roomAt(code))).val();
    ensureHost(state);
    const round=state.round;
    const pos=Number(position);
    if(round?.type!=="rank"||!round.resultReady||round.scored||!round.review)throw Error("Resultado ainda não está em revisão.");
    if(!Object.hasOwn(state.profiles||{},player))throw Error("Jogador desconhecido.");
    if(!Number.isInteger(pos)||pos<0||pos>round.limit)throw Error("Posição inválida para o recorte.");
    const list=round.catalog||rankings().find(l=>l.id===round.categoryId);
    if(!list)throw Error("Lista de referência indisponível.");
    const t=await runTransaction(roomAt(code),value=>{
      const old=value||state;
      if(old.round?.id!==round.id||old.round.scored||!old.round.resultReady)return;
      const overrides={...(old.round.overrides||{}),[player]:{position:pos,reason:note}};
      const review=calculateRanking({list,limit:round.limit,target:round.target,
        guesses:old.round.guesses||{},members:Object.keys(old.profiles||{}),overrides});
      return {...old,round:{...old.round,overrides,review}};
    },{applyLocally:false});
    return t.committed?t.snapshot.val():(await get(roomAt(code))).val();
  }
  async function advance(code,{winner="",winnerPoints=1,finish=false}={}){
    const initial=(await get(roomAt(code))).val();
    ensureHost(initial);
    const t=await runTransaction(roomAt(code),value=>{
      const old=value||initial;
      const r=old.round;
      if(old.phase!=="playing"||!r?.revealed||r.scored)return;
      const scores={...(old.scores||{})};
      let record;
      if(r.type==="letters"){
        if(winner&&!old.profiles?.[winner])return;
        if(![0.5,1].includes(Number(winnerPoints)))return;
        if(winner)scores[winner]=(scores[winner]||0)+Number(winnerPoints);
        record={id:r.id,type:"letters",number:old.number,index:r.index,hints:r.hints||0,
          winner:String(winner),winnerPoints:winner?Number(winnerPoints):0,content:r.content||null};
      }else{
        if(!r.resultReady||!r.review)return;
        const awarded={};
        for(const [memberUid,result] of Object.entries(r.review)){
          const points=Number(result.points)||0;
          awarded[memberUid]=points;
          if(points)scores[memberUid]=(scores[memberUid]||0)+points;
        }
        record={id:r.id,type:"rank",number:old.number,categoryId:r.categoryId,
          limit:r.limit,target:r.target,awarded,review:r.review,overrides:r.overrides||{}};
      }
      const history={...(old.roundHistory||{}),[r.id]:record};
      const previous={...old,scores,roundHistory:history,round:{...r,scored:true}};
      if(finish||(Number(old.roundLimit)>0&&old.number>=Number(old.roundLimit)))return {...previous,phase:"finished",finishedAt:Date.now()};
      const next=chooseRound(previous);
      return {...previous,...next,phase:"playing"};
    },{applyLocally:false});
    return t.committed?t.snapshot.val():(await get(roomAt(code))).val();
  }
  return {start,hint,revealPhrase,submitGuess,watchMyGuess,watchSubmissions,
    revealRanking,correctRanking,advance,chooseRound};
};
export const createPartyGame=(args)=>makePartyGame({...args,isEligibleRanking,calculateRanking});
