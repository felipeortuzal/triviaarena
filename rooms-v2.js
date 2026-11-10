// Lobby V2, reservas de vagas imutáveis e Firebase SDK do jogador.
export const makeRoomGateway=function makeRoomGateway({db,uid,api,now=()=>Date.now(),generateCode=()=>{
  const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",a=new Uint32Array(6);
  crypto.getRandomValues(a);
  return Array.from(a,n=>alphabet[n%alphabet.length]).join("");
}}){
  if(!db||!uid||!api)throw Error("Gateway exige banco, identidade e SDK.");
  const {ref,get,set,runTransaction,onValue,onDisconnect,serverTimestamp}=api;
  const p={
    registry:c=>`roomRegistry/${c}`,
    seats:c=>`roomSeats/${c}`,
    members:c=>`roomMembers/${c}`,
    member:(c,u)=>`roomMembers/${c}/${u}`,
    public:c=>`roomPublic/${c}`,
    profile:(c,u)=>`roomPublic/${c}/profiles/${u}`,
    presence:(c,u)=>`roomPresence/${c}/${u}`
  };
  const at=s=>ref(db,s);
  const validateCode=c=>typeof c==="string"&&/^[A-HJ-NP-Z2-9]{6}$/.test(c);
  function checkName(nick){
    const name=String(nick||"").trim().slice(0,28);
    if(!name)throw Error("Escolha um apelido antes de entrar.");
    return name;
  }
  function niceError(e){
    const m=String(e?.code||e?.message||"").toLowerCase();
    if(m.includes("permission_denied")||m.includes("permission-denied"))return Error("A ação foi recusada pela segurança da sala. Confira o convite.");
    if(m.includes("network")||m.includes("disconnect"))return Error("A conexão caiu. Tente novamente.");
    return e instanceof Error?e:Error("Não foi possível acessar a sala.");
  }
  async function claimSeat(code){
  const memberRef=at(p.member(code,uid));
  const prior=await get(memberRef);
  if(prior.exists())return prior.val().slot;
  const claimRef=at(`roomClaims/${code}/${uid}`);
  async function finalize(slot){
    const registration={slot,joined:now()};
    try{
      await set(memberRef,registration);
      return slot;
    }catch(e){
      const existing=await get(memberRef);
      if(existing.exists())return existing.val().slot; // segunda aba concluiu primeiro
      throw niceError(e);
    }
  }
  for(let attempt=0;attempt<65;attempt++){
    const member=await get(memberRef);
    if(member.exists())return member.val().slot;
    const seats=(await get(at(p.seats(code)))).val()||{};
    const own=Object.keys(seats).find(s=>seats[s]===uid);
    if(own!==undefined)return finalize(Number(own));
    const available=Array.from({length:20},(_,i)=>i).filter(i=>seats[i]===undefined);
    if(!available.length)throw Error("A sala está cheia (20 jogadores).");
    const claimed=(await get(claimRef)).val();
    if(claimed===null){
      const chosen=available[0];
      const transaction=await runTransaction(claimRef,x=>x===null?chosen:undefined,{applyLocally:false});
      if(!transaction.committed)continue;
      continue;
    }
    if(seats[claimed]!==undefined&&seats[claimed]!==uid){
      const newSlot=available[0];
      const transaction=await runTransaction(claimRef,x=>x===claimed?newSlot:undefined,{applyLocally:false});
      // Somente uma revisão por UID prevalece. Não altere slot vazio/em negociação.
      if(!transaction.committed)continue;
      continue;
    }
    const seatRef=at(p.seats(code)+"/"+claimed);
    const transaction=await runTransaction(seatRef,x=>x===null?uid:undefined,{applyLocally:false});
    if(transaction.committed)return finalize(claimed);
    // Outra aba com mesmo UID pode ter ocupado; a próxima leitura recupera.
  }
  throw Error("Muitas entradas simultâneas. Reabra o convite e tente novamente.");
}
async function createRoom({nick,mode,totalRounds=5}){
    if(![3,5,7].includes(totalRounds))throw Error("Escolha 3, 5 ou 7 rodadas por partida.");
    const name=checkName(nick);
    if(!["letters","rank","mixed"].includes(mode))throw Error("Modo de jogo inválido.");
    for(let i=0;i<16;i++){
      const code=generateCode();
      if(!validateCode(code))throw Error("Gerador de código inválido.");
      const timestamp=now();
      let t;
      try{
        t=await runTransaction(at(p.registry(code)),x=>x===null?{version:2,host:uid,phase:"open",createdAt:timestamp}:undefined,{applyLocally:false});
      }catch(e){throw niceError(e)}
      if(!t.committed)continue;
      try{
        const slot=await claimSeat(code);
        const member=await get(at(p.member(code,uid)));
        const joined=member.val()?.joined||timestamp;
        await set(at(p.public(code)),{version:2,host:uid,mode,phase:"lobby",createdAt:timestamp,number:0,
          profiles:{[uid]:{uid,nick:name,joined}},scores:{[uid]:0},totalRounds});
        return {code,slot,created:true};
      }catch(e){
        throw Error("O código foi reservado, mas o lobby não pôde iniciar. Tente criar outra sala. "+(e?.message||""));
      }
    }
    throw Error("Não foi possível gerar um código livre. Tente novamente.");
  }
  async function joinRoom({code,nick}){
    const name=checkName(nick),id=String(code||"").trim().toUpperCase();
    if(!validateCode(id))throw Error("Informe um código de convite com seis caracteres.");
    let registry;
    try{registry=await get(at(p.registry(id)))}catch(e){throw niceError(e)}
    if(!registry.exists())throw Error("Sala não encontrada. Confira o código do convite.");
    if(registry.val().version!==2)throw Error("Este convite pertence a uma versão antiga.");
    const before=await get(at(p.member(id,uid)));
    if(!before.exists()&&registry.val().phase==="locked")throw Error("A partida já começou. Novos jogadores não entram nesta rodada.");
    if(!before.exists()&&registry.val().phase!=="open")throw Error("Esta sala foi encerrada pelo anfitrião.");
    if(!before.exists())await claimSeat(id);
    const state=await get(at(p.public(id)));
    if(!state.exists())throw Error("O anfitrião ainda está preparando esta sala. Tente entrar novamente.");
    const previous=await get(at(p.profile(id,uid)));
    const member=await get(at(p.member(id,uid)));
    const joined=previous.exists()?previous.val().joined:member.val().joined;
    await set(at(p.profile(id,uid)),{uid,nick:name,joined}).catch(e=>{throw niceError(e)});
    return {code:id,alreadyMember:before.exists()};
  }
  async function resumeRoom(code){
    const id=String(code||"").toUpperCase();
    if(!validateCode(id))return false;
    try{
      const member=await get(at(p.member(id,uid))),state=await get(at(p.public(id)));
      return member.exists()&&state.exists();
    }catch{return false}
  }
  function watchRoom(code,onRoom,onError){
    if(!validateCode(code))throw Error("Código inválido.");
    let registry=null,publicRoom=null,presence={},membersRaw={};
    let rReady=false,pReady=false,mReady=false;
    const notify=()=>{
      if(!rReady||!pReady||!mReady)return;
      if(!membersRaw[uid]){onError(Error("Você não pertence mais a esta sala."));return}
      if(!publicRoom){onError(Error("Sala ainda está sendo preparada."));return}
      const members={};
      for(const memberUid of Object.keys(membersRaw)){
        const profile=publicRoom.profiles?.[memberUid];
        members[memberUid]={uid:memberUid,nick:profile?.nick||"Jogador",
          joined:profile?.joined||membersRaw[memberUid].joined,online:!!presence[memberUid]};
      }
      onRoom({...publicRoom,members,presence,closed:registry?.phase==="closed"});
    };
    const fail=e=>onError(niceError(e));
    const unsub=[
      onValue(at(p.registry(code)),s=>{rReady=true;registry=s.val();notify()},fail),
      onValue(at(p.public(code)),s=>{pReady=true;publicRoom=s.val();notify()},fail),
      onValue(at(p.members(code)),s=>{mReady=true;membersRaw=s.val()||{};notify()},fail),
      onValue(at(`roomPresence/${code}`),s=>{presence=s.val()||{};notify()},fail)
    ];
    return ()=>unsub.forEach(stop=>stop());
  }
  function markPresence(code,onError=()=>{}){
    const presence=at(p.presence(code,uid));
    let stopped=false;
    const unsubscribe=onValue(at(".info/connected"),async s=>{
      if(stopped||s.val()!==true)return;
      try{
        await onDisconnect(presence).remove();
        if(!stopped)await set(presence,{connected:true,updatedAt:serverTimestamp()});
      }catch(e){if(!stopped)onError(niceError(e))}
    },onError);
    return ()=>{
      stopped=true;unsubscribe();
      onDisconnect(presence).cancel().catch(()=>{});
      set(presence,null).catch(()=>{});
    };
  }
  async function closeRoom(code){
    const state=await get(at(p.registry(code)));
    if(!state.exists()||state.val().host!==uid)throw Error("Somente o anfitrião pode encerrar.");
    await set(at(p.registry(code)+"/phase"),"closed").catch(e=>{throw niceError(e)});
  }
  return {createRoom,joinRoom,resumeRoom,watchRoom,markPresence,closeRoom,validateCode};
};
