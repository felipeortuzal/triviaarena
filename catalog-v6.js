// Riviera Showdown — validação editorial, importador e gabaritos estáveis.
export const ROUND_OPTIONS=[3,5,7];
export const RANK_CUTS=[10,25,50,100,250,500,1000];
export const canon=value=>String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
  .toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
export const cutsFor=length=>RANK_CUTS.filter(x=>x<=length);
export const slug=value=>canon(value).replace(/ /g,"-").slice(0,42);
export function parseOrderedItems(text){
  return String(text||"").split(/\r?\n/).map(x=>x.trim().replace(/^(?:\d{1,4}[.)]\s+|\d{1,4}º\s+-?\s*)/,"").trim()).filter(Boolean);
}
export function validateRanking(list,{minimum=10}={}){
  const errors=[];
  const count=list?.items?.length||0;
  if(!list||!list.id||!/^[-a-z0-9]{2,60}$/.test(list.id))errors.push("ID estável inválido");
  if(!list?.title||list.title.trim().length<5)errors.push("Título insuficiente");
  if(!list?.source||list.source.trim().length<4)errors.push("Nome da fonte obrigatório");
  if(!list?.url||!/^https:\/\/[^\s]+\.[^\s]+$/.test(list.url))errors.push("URL HTTPS verificável obrigatória");
  if(!list?.snapshot||list.snapshot.trim().length<4)errors.push("Edição/data de referência obrigatória");
  if(!list?.about||list.about.trim().length<12)errors.push("Critério, universo e desempate obrigatórios");
  if(!Array.isArray(list?.items)||count<minimum||count>1000)errors.push("Quantidade de itens fora dos limites");
  const items=Array.isArray(list?.items)?list.items:[];
  const names=new Map();
  for(let i=0;i<items.length;i++){
    const raw=items[i],key=canon(raw);
    if(!key||raw.trim().length>140)errors.push("Item vazio ou longo na posição "+(i+1));
    if(names.has(key))errors.push("Nomes canônicos duplicados nas posições "+names.get(key)+" e "+(i+1));
    names.set(key,i+1);
  }
  const aliasIndex=new Map();
  for(const [name,aliases] of Object.entries(list?.aliases||{})){
    const itemPos=names.get(canon(name));
    if(!itemPos){errors.push("Alias associado a item desconhecido: "+name);continue}
    if(!Array.isArray(aliases)){errors.push("Aliases devem ser lista: "+name);continue}
    for(const alias of aliases){
      const key=canon(alias);
      if(!key){errors.push("Alias vazio: "+name);continue}
      if(names.has(key)&&names.get(key)!==itemPos)errors.push("Alias confunde dois itens: "+alias);
      if(aliasIndex.has(key)&&aliasIndex.get(key)!==itemPos)errors.push("Alias ambíguo: "+alias);
      aliasIndex.set(key,itemPos);
    }
  }
  if(list?.itemIds&&(!Array.isArray(list.itemIds)||list.itemIds.length!==count||new Set(list.itemIds).size!==count))errors.push("IDs de itens incompletos ou repetidos");
  return [...new Set(errors)];
}
export function importRanking({id,title,source,url,snapshot,about,rawItems,aliases={},category="Personalizado"}){
  const items=parseOrderedItems(rawItems);
  const list={id:"host-"+slug(id||title),title:String(title||"").trim(),source:String(source||"").trim(),
    url:String(url||"").trim(),snapshot:String(snapshot||"").trim(),
    about:String(about||"").trim(),category,items,aliases,origin:"host",
    itemIds:items.map((_,i)=>"item-"+String(i+1).padStart(4,"0"))};
  const errors=validateRanking(list);
  if(errors.length)throw Error("Ranking recusado: "+errors.join("; "));
  return list;
}
export function validatePuzzle(puzzle){
  const errors=[];
  if(!puzzle?.id||!/^[-a-z0-9]{3,60}$/.test(puzzle.id))errors.push("ID estável inválido");
  if(!puzzle?.code||!puzzle?.answer)errors.push("Enunciado/resposta faltando");
  if(!puzzle?.topic||!puzzle?.level)errors.push("Tema/dificuldade faltando");
  if(!puzzle?.explain||puzzle.explain.length<12)errors.push("Explicação insuficiente");
  if(!Array.isArray(puzzle?.hints)||puzzle.hints.length!==2||puzzle.hints.some(x=>!x.trim())||
     canon(puzzle.hints[0])===canon(puzzle.hints[1]))errors.push("Duas dicas diferentes obrigatórias");
  const nrCode=String(puzzle?.code||"").match(/^\d+/)?.[0],nrAnswer=String(puzzle?.answer||"").match(/^\d+/)?.[0];
  if(nrCode!==nrAnswer)errors.push("Número da sigla difere da resposta");
  const words=canon(puzzle.answer).split(" ").slice(1);
  const initials=canon(puzzle.code).split(" ").slice(1).filter(x=>x.length===1&&!["a","o","e"].includes(x));
  const initSet=new Set(words.filter(w=>w.length>=2).map(w=>w[0]));
  if(initials.length&&!initials.every(x=>initSet.has(x)))errors.push("Sigla não corresponde a conteúdo da resposta");
  if(puzzle.sourceUrl&&!/^https:\/\//.test(puzzle.sourceUrl))errors.push("Referência deve usar HTTPS");
  return [...new Set(errors)];
}
export const puzzleSnapshot=(p,index)=>({
  id:p.id||"legacy-"+index,code:p.code||"",answer:p.answer||"",explain:p.explain||"Sem explicação registrada.",
  topic:p.topic||"Geral",level:p.level||"Geral",hints:[...(p.hints||["Dica indisponível","Outra dica indisponível"])],acceptedAnswers:[...(p.acceptedAnswers||[])],
  sourceName:p.sourceName||"",sourceUrl:p.sourceUrl||"",edition:p.edition||""
});
export const rankingSnapshot=list=>({
  id:list.id,revision:list.revision||"legacy-1",title:list.title||"Ranking",source:list.source||"Fonte não informada",
  url:list.url||"",snapshot:list.snapshot||"Data não informada",about:list.about||"Critério da lista conforme referência indicada.",category:list.category||"",
  items:[...list.items],itemIds:list.itemIds||list.items.map((_,i)=>list.id+"-"+String(i+1).padStart(4,"0")),
  aliases:list.aliases||{},origin:list.origin||"official",verifiedPrefix:list.verifiedPrefix||0,edition:list.edition||"",observedAt:list.observedAt||"",verificationNote:list.verificationNote||"",
});
