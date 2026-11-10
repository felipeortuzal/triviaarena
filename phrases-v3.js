// Etapa 3: máquina de estados atômica do jogo Decifre a Frase.
export const makePhraseGame=function makePhraseGame({db,uid,api,getPuzzles,randomIndex}){
  const {ref,get,runTransaction}=api;
  const where=code=>ref(db,"roomPublic/"+code);
  const reg=code=>ref(db,"roomRegistry/"+code);
  const select=(state)=>{
    const all=getPuzzles();
    if(!Array.isArray(all)||!all.length)throw Error("O catálogo de frases está indisponível.");
    const used=Array.isArray(state.usedLetters)?state.usedLetters:[];
    const available=all.map((_,index)=>index).filter(i=>!used.includes(i));
    const pool=available.length?available:all.map((_,i)=>i);
    const pick=pool[randomIndex(pool.length)];
    if(!Number.isInteger(pick))throw Error("Falha no sorteio da frase.");
    const item=all[pick];
    const number=(state.number||0)+1;
    const nextUsed=available.length?[...used,pick]:[pick];
    return {number,round:{type:"letters",id:"frase-"+number,index:pick,topic:item.topic||"Geral",level:item.level||"Geral",hints:0,revealed:false,scored:false},usedLetters:nextUsed};
  };
  function requireHost(state){
    if(!state||state.host!==uid)throw Error("Somente o anfitrião controla a partida.");
    if(state.mode!=="letters")throw Error("Este modo ainda não foi habilitado para partidas online.");
  }
  async function start(code){
    const register=await get(reg(code));
    if(!register.exists()||register.val().host!==uid)throw Error("Somente o anfitrião pode iniciar.");
    if(register.val().phase==="open"){
      const lock=await runTransaction(ref(db,"roomRegistry/"+code+"/phase"),val=>val==="open"?"locked":undefined,{applyLocally:false});
      if(!lock.committed){
        const fresh=await get(reg(code));
        if(fresh.val()?.phase!=="locked")throw Error("Não foi possível bloquear novas entradas nesta sala.");
      }
    }else if(register.val().phase!=="locked"){throw Error("Esta sala já foi encerrada.");}
    const t=await runTransaction(where(code),old=>{
      if(!old||old.host!==uid||old.mode!=="letters"||old.phase!=="lobby")return;
      const next=select(old);
      return {...old,...next,phase:"playing"};
    },{applyLocally:false});
    if(!t.committed){
      const latest=await get(where(code));
      if(latest.val()?.phase==="playing")return latest.val();
      throw Error("A partida não pôde ser iniciada. Atualize a página.");
    }
    return t.snapshot.val();
  }
  async function hint(code){
    const t=await runTransaction(where(code),old=>{
      if(!old||old.host!==uid||old.phase!=="playing"||old.round?.type!=="letters"||old.round.revealed||old.round.hints>=2)return;
      return {...old,round:{...old.round,hints:(old.round.hints||0)+1}};
    },{applyLocally:false});
    return t.committed;
  }
  async function reveal(code){
    const t=await runTransaction(where(code),old=>{
      if(!old||old.host!==uid||old.phase!=="playing"||!old.round||old.round.revealed)return;
      return {...old,round:{...old.round,revealed:true}};
    },{applyLocally:false});
    return t.committed;
  }
  async function transition(code,{winner="",finish=false}={}){
    const chosen=String(winner||"");
    // Todas as alterações (placar + histórico + nova rodada/resultado) são ATÔMICAS.
    const t=await runTransaction(where(code),old=>{
      if(!old||old.host!==uid||old.mode!=="letters"||old.phase!=="playing"||!old.round?.revealed||old.round.scored)return;
      if(chosen&&!old.profiles?.[chosen])return;
      const r=old.round;
      const scores={...(old.scores||{})};
      if(chosen)scores[chosen]=(scores[chosen]||0)+1;
      const roundHistory={...(old.roundHistory||{}),[r.id]:{
        id:r.id,index:r.index,number:old.number,topic:r.topic||"Geral",hints:r.hints||0,winner:chosen
      }};
      const scored={...r,scored:true,winner:chosen};
      const previous={...old,scores,roundHistory,round:scored};
      if(finish)return {...previous,phase:"finished",finishedAt:Date.now()};
      const next=select(previous);
      return {...previous,...next,phase:"playing"};
    },{applyLocally:false});
    if(!t.committed){
      const current=await get(where(code));
      const state=current.val();
      if(state?.phase==="finished"&&finish)return state;
      if(state?.phase==="playing"&&!finish&&state.round?.revealed===false)return state;
      throw Error("Esta rodada já foi processada ou ainda não foi revelada.");
    }
    return t.snapshot.val();
  }
  async function getMatch(code){
    const state=await get(where(code));
    return state.exists()?state.val():null;
  }
  return {start,hint,reveal,transition,getMatch};
};
