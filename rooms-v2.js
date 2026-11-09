// Contrato do lobby V2. Sem credenciais administrativas; apenas SDK do jogador.
export const makeRoomGateway=function makeRoomGateway({db,uid,api,now=()=>Date.now(),generateCode=()=>{const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",a=new Uint32Array(6);crypto.getRandomValues(a);return Array.from(a,n=>alphabet[n%alphabet.length]).join("")}}){
  if(!db||!uid||!api)throw Error("Gateway exige banco, identidade e SDK");
  const {ref,get,set,runTransaction,onValue,onDisconnect,serverTimestamp}=api;
  const path={
    registry:c=>`roomRegistry/${c}`,
    public:c=>`roomPublic/${c}`,
    profile:(c,u)=>`roomPublic/${c}/profiles/${u}`,
    presence:(c,u)=>`roomPresence/${c}/${u}`
  };
  const roomRef=(p)=>ref(db,p);
  const validateCode=c=>typeof c==="string"&&/^[A-HJ-NP-Z2-9]{6}$/.test(c);
  const cleanNick=s=>String(s||"").trim().slice(0,28);
  function checkName(s){
    const name=cleanNick(s);
    if(!name)throw Error("Escolha um apelido antes de entrar.");
    return name;
  }
  const codeError=(e)=>{
    const message=String(e?.code||e?.message||"");
    if(message.includes("permission-denied")||message.includes("PERMISSION_DENIED"))return Error("A operação foi recusada pelas regras da sala. Confira o convite ou tente novamente.");
    if(message.includes("network")||message.includes("disconnected"))return Error("A conexão caiu. Reconecte e tente novamente.");
    return e instanceof Error?e:Error("Não foi possível acessar a sala.");
  };
  async function createRoom({nick,mode}){
    const name=checkName(nick);
    if(!["letters","rank","mixed"].includes(mode))throw Error("Modo de jogo inválido.");
    for(let attempt=0;attempt<16;attempt++){
      const code=generateCode();
      if(!validateCode(code))throw Error("Gerador de código inválido.");
      const timestamp=now();
      const registry={version:2,host:uid,phase:"open",createdAt:timestamp,members:{[uid]:true}};
      let claim;
      try{
        claim=await runTransaction(roomRef(path.registry(code)),current=>current===null?registry:undefined,{applyLocally:false});
      }catch(e){throw codeError(e)}
      if(!claim.committed)continue; // colisão, nunca sobrescreve
      const state={version:2,host:uid,mode,phase:"lobby",createdAt:timestamp,number:0,
        profiles:{[uid]:{uid,nick:name,joined:timestamp}},scores:{[uid]:0}};
      try{
        await set(roomRef(path.public(code)),state);
      }catch(e){
        // Reserva mantida para não transferir um convite para outra pessoa.
        throw Error("O código foi reservado, mas o lobby não pôde iniciar. Tente criar outra sala. "+(e?.message||""));
      }
      return {code,created:true};
    }
    throw Error("Não foi possível gerar um código livre. Tente novamente.");
  }
  async function joinRoom({code,nick}){
    const name=checkName(nick),id=String(code||"").trim().toUpperCase();
    if(!validateCode(id))throw Error("Informe um código de convite com seis caracteres.");
    const registryRef=roomRef(path.registry(id));
    try{
      await runTransaction(registryRef,current=>{
        if(!current || current.version!==2 || current.phase!=="open")return;
        if(current.members?.[uid]===true)return; // mesma identidade: não consome outra vaga
        if(Object.keys(current.members||{}).length>=20)return;
        return {...current,members:{...current.members,[uid]:true}};
      },{applyLocally:false});
    }catch(e){throw codeError(e)}
    let snapshot;
    try{snapshot=await get(registryRef)}catch(e){throw codeError(e)}
    if(!snapshot.exists())throw Error("Sala não encontrada. Confira o código do convite.");
    const registry=snapshot.val();
    const admitted=registry.members?.[uid]===true;
    if(!admitted){
      if(registry.phase!=="open")throw Error("Esta sala foi encerrada pelo anfitrião.");
      if(Object.keys(registry.members||{}).length>=20)throw Error("A sala está cheia (20 jogadores).");
      throw Error("Não foi possível entrar. Tente novamente.");
    }
    // A vaga é reivindicada antes do apelido: nunca duplica após perda de rede.
    let state;
    try{state=await get(roomRef(path.public(id)))}catch(e){throw codeError(e)}
    if(!state.exists())throw Error("O anfitrião ainda está preparando esta sala. Tente entrar novamente.");
    let profile;
    try{profile=await get(roomRef(path.profile(id,uid)))}catch(e){throw codeError(e)}
    const joined=profile.exists()?profile.val().joined:now();
    await set(roomRef(path.profile(id,uid)),{uid,nick:name,joined}).catch(e=>{throw codeError(e)});
    return {code:id,alreadyMember:!!profile.exists()};
  }
  async function resumeRoom(code){
    const id=String(code||"").toUpperCase();
    if(!validateCode(id))return false;
    try{
      const member=await get(roomRef(path.registry(id)+"/members/"+uid));
      const state=await get(roomRef(path.public(id)));
      return member.val()===true&&state.exists();
    }catch{return false}
  }
  function watchRoom(code,onRoom,onError){
    if(!validateCode(code))throw Error("Código inválido.");
    let registry=null,publicRoom=null,presence={},registryReady=false,publicReady=false;
    const notify=()=>{
      if(!registryReady||!publicReady)return;
      if(!registry||!registry.members?.[uid]){onError(Error("Você não pertence mais a esta sala."));return}
      if(!publicRoom){onError(Error("Sala ainda está sendo preparada."));return}
      const members={};
      for(const memberUid of Object.keys(registry.members)){
        const profile=publicRoom.profiles?.[memberUid];
        members[memberUid]={
          uid:memberUid,nick:profile?.nick||"Jogador",
          joined:profile?.joined||registry.createdAt,online:!!presence[memberUid]
        };
      }
      onRoom({...publicRoom,members,presence,closed:registry.phase==="closed"});
    };
    const fail=e=>onError(codeError(e));
    const unsubscribe=[
      onValue(roomRef(path.registry(code)),s=>{registryReady=true;registry=s.val();notify()},fail),
      onValue(roomRef(path.public(code)),s=>{publicReady=true;publicRoom=s.val();notify()},fail),
      onValue(roomRef(`roomPresence/${code}`),s=>{presence=s.val()||{};notify()},fail)
    ];
    return ()=>unsubscribe.forEach(stop=>stop());
  }
  function markPresence(code,onError=()=>{}){
    const userPresence=roomRef(path.presence(code,uid));
    let cancelled=false;
    const stop=onValue(roomRef(".info/connected"),async snap=>{
      if(cancelled||snap.val()!==true)return;
      try{
        await onDisconnect(userPresence).remove();
        if(!cancelled)await set(userPresence,{connected:true,updatedAt:serverTimestamp()});
      }catch(e){if(!cancelled)onError(codeError(e))}
    },onError);
    return ()=>{
      cancelled=true;
      stop();
      onDisconnect(userPresence).cancel().catch(()=>{});
      set(userPresence,null).catch(()=>{});
    };
  }
  async function closeRoom(code){
    // A regra do RTDB garante que apenas o anfitrião execute isso.
    const s=await get(roomRef(path.registry(code)));
    if(!s.exists()||s.val().host!==uid)throw Error("Somente o anfitrião pode encerrar.");
    await set(roomRef(path.registry(code)+"/phase"),"closed").catch(e=>{throw codeError(e)});
  }
  return {createRoom,joinRoom,resumeRoom,watchRoom,markPresence,closeRoom,validateCode};
};
