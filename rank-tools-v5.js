
export function normalizeItem(value){
  return String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
    .replace(/&/g," and ").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
}
export function isEligibleRanking(list){
  if(!list||typeof list.id!=="string"||!Array.isArray(list.items)||list.items.length<25)return false;
  if(typeof list.source!=="string"||!list.source.trim()||typeof list.snapshot!=="string"||!list.snapshot.trim())return false;
  if(typeof list.url!=="string"||!/^https:\/\//.test(list.url))return false;
  return new Set(list.items.map(normalizeItem)).size===list.items.length;
}
export function resolveGuess(guess,list,limit){
  const key=normalizeItem(guess);
  if(!key)return {status:"empty",position:null,label:"Sem palpite"};
  const matches=[];
  list.items.forEach((item,index)=>{
    const aliases=list.aliases?.[item]||[];
    if([item,...aliases].some(text=>normalizeItem(text)===key))matches.push(index+1);
  });
  if(matches.length>1)return {status:"ambiguous",position:null,label:"Nome ambíguo"};
  if(matches.length===0)return {status:"unknown",position:null,label:"Não reconhecido"};
  if(matches[0]>limit)return {status:"out-of-cut",position:null,label:"Fora do Top "+limit};
  return {status:"valid",position:matches[0],label:list.items[matches[0]-1]};
}
export function calculateRanking({list,limit,target,guesses,members,overrides={}}){
  if(!isEligibleRanking(list)||!Number.isInteger(limit)||limit<1||limit>list.items.length||!Number.isInteger(target)||target<1||target>limit)throw Error("Dados do ranking inválidos");
  const raw=members.map(uid=>{
    const guess=typeof guesses[uid]==="string"?guesses[uid]:"";
    const correction=overrides[uid];
    const resolved=correction&&Number.isInteger(correction.position)&&correction.position>=0&&correction.position<=limit?
      {position:correction.position||null,status:correction.position===0?"corrected-out":"corrected",label:correction.reason}:resolveGuess(guess,list,limit);
    const delta=resolved.position===null?null:Math.abs(resolved.position-target);
    return {uid,guess,position:resolved.position,delta,status:resolved.status,label:resolved.label,
      ...(correction?{reason:correction.reason}: {})};
  });
  const order=raw.filter(x=>x.delta!==null).sort((a,b)=>a.delta-b.delta||a.uid.localeCompare(b.uid));
  let place=0,lastDistance=null;
  order.forEach((x,index)=>{
    if(lastDistance!==x.delta)place=index+1;
    x.place=place;
    x.points=({1:5,2:3,3:1})[place]||0;
    lastDistance=x.delta;
  });
  for(const x of raw)if(x.delta===null){x.place=null;x.points=0}
  return Object.fromEntries(raw.map(x=>[x.uid,x]));
}
