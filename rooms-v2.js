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
    const prior=await get(at(p.member(code,uid)));
    if(prior.exists())return prior.val().slot;
    let seats=await get(at(p.seats(code)));
    let all=seats.val()||{};
    let own=Object.keys(all).find(k=>all[k]===uid);
    if(own!==undefined){
      const slot=Number(own);
      try{await set(at(p.member(code,uid)),{slot,joined:now()})}catch(e){
        // Se outra aba já inscreveu o mesmo UID, reutilize sua inscrição.
        const current=await get(at(p.member(code,uid)));
        if(!current.exists())throw niceError(e);
        return current.val().slot;
      }
      return slot;
    }
    for(let index=0;index<20;index++){
      if(all[String(index)]!==undefined)continue;
      let claimed;
      try{
        claimed=await runTransaction(at(p.seats(code)+"/"+index),x=>x===null?uid:undefined,{applyLocally:false});
      }catch(e){
        // Pode haver outro cliente reivindicando este slot. Revalide a situação.
        if(String(e?.code||"").includes("permission"))continue;
        throw niceError(e);
      }
      if(!claimed.committed)continue;
      try{await set(at(p.member(code,uid)),{slot:index,joined:now()})}catch(e){
        const current=await get(at(p.member(code,uid)));
        if(!current.exists())throw niceError(e);
        return current.val().slot;
      }
      return index;
    }
    seats=await get(at(p.seats(code)));
    all=seats.val()||{};
    own=Object.keys(all).find(k=>all[k]===uid);
    if(own!==undefined)return claimSeat(code);
    throw Error("A sala está cheia (20 jogadores).");
  }
  async function createRoom({nick,mode}){
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
          profiles:{[uid]:{uid,nick:name,joined}},scores:{[uid]:0}});
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
    if(registry.val().phase!=="open")throw Error("Esta sala foi encerrada pelo anfitrião.");
    const before=await get(at(p.member(id,uid)));
    await claimSeat(id);
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
