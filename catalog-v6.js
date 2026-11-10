// Regras de curadoria e importação de listas. Sem publicar dados não auditados.
export function normalizeName(value){
 return String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ");
}
export function allowedCuts(length){return [10,25,50,75,100,250,500,1000].filter(n=>n<=length)}
export function validateCatalog(data){
 const issues=[],activeCodes=new Map(),activeAnswers=new Map(),ids=new Set();
 if(!Array.isArray(data?.puzzles)||!Array.isArray(data?.rankings))return ["Arquivo deve conter puzzles e rankings."];
 data.puzzles.forEach((p,i)=>{
   const at="puzzles["+i+"]";
   if(!/^frase-\d{4}$/.test(p.id||""))issues.push(at+": ID estável inválido");
   if(ids.has(p.id))issues.push(at+": ID repetido");ids.add(p.id);
   if(!["active","inactive"].includes(p.status))issues.push(at+": status inválido");
   if(!/^\d+\s+/.test(p.code||""))issues.push(at+": código sem número inicial");
   if(typeof p.answer!=="string"||p.answer.length<8)issues.push(at+": resposta incompleta");
   if(!Array.isArray(p.hints)||p.hints.length!==2||p.hints.some(h=>typeof h!=="string"||h.length<8)||normalizeName(p.hints[0])===normalizeName(p.hints[1]))issues.push(at+": dicas progressivas inválidas");
   if(!p.topic||!["Fácil","Médio","Difícil"].includes(p.level)||!p.explain)issues.push(at+": categoria/dificuldade/explicação ausente");
   if(p.reference&&!/^https:\/\//i.test(p.reference))issues.push(at+": referência não HTTPS");
   if(p.status==="active"){
     for(const [key,map,field] of [[normalizeName(p.code),activeCodes,"código"],[normalizeName(p.answer),activeAnswers,"resposta"]]){
       if(map.has(key))issues.push(at+": "+field+" duplicado de "+map.get(key));else map.set(key,p.id);
     }
   }else if(!p.duplicateOf)issues.push(at+": motivo/ID de duplicação ausente");
 });
 const listIds=new Set();
 for(const [i,l] of data.rankings.entries()){
   const at="rankings["+i+"]";
   if(!l.id||listIds.has(l.id))issues.push(at+": ID duplicado/ausente");listIds.add(l.id);
   if(!/^https:\/\//.test(l.url||"")||!l.source||!l.snapshot||!l.edition||!l.methodology||!l.category||!l.observedAt||!l.tiePolicy)issues.push(at+": procedência/edição/método incompletos");
   if(!/^\d{4}-\d{2}-\d{2}$/.test(l.observedAt||""))issues.push(at+": data de observação inválida");
   if(!Array.isArray(l.items)||l.items.length<10||l.items.length>1000||l.items.some(x=>typeof x!=="string"||!x.trim()))issues.push(at+": itens incompletos");
   if(!Array.isArray(l.itemIds)||l.itemIds.length!==l.items.length||new Set(l.itemIds).size!==l.itemIds.length)issues.push(at+": itemIds instáveis");
   const normalized=l.items.map(normalizeName);if(new Set(normalized).size!==normalized.length)issues.push(at+": nomes duplicados/ambíguos");
   const aliases=new Map();
   for(const [canonical,variants] of Object.entries(l.aliases||{})){
     if(!l.items.includes(canonical)||!Array.isArray(variants))issues.push(at+": aliases sem item canônico");
     for(const variant of Array.isArray(variants)?variants:[]){
       const key=normalizeName(variant);
       if(!key||aliases.has(key)&&aliases.get(key)!==canonical||l.items.some(x=>normalizeName(x)===key&&x!==canonical))issues.push(at+": alias ambíguo "+variant);
       aliases.set(key,canonical);
     }
   }
   const cuts=allowedCuts(l.items.length);
   if(!Array.isArray(l.allowedCuts)||l.allowedCuts.some(n=>!cuts.includes(n)))issues.push(at+": tamanho de recorte incompatível");
 }
 return issues;
}
export function parseHostRanking(input){
 const meta=input||{};
 const title=String(meta.title||"").trim(),source=String(meta.source||"").trim();
 const url=String(meta.url||"").trim(),snapshot=String(meta.snapshot||"").trim();
 const methodology=String(meta.methodology||"").trim();
 const observedAt=String(meta.observedAt||"").trim();
 if(title.length<4||!source||!/^https:\/\//.test(url)||!snapshot||!methodology||!/^\d{4}-\d{2}-\d{2}$/.test(observedAt))throw Error("Informe título, fonte, URL HTTPS, edição, critério e data observada (AAAA-MM-DD).");
 const original=Array.isArray(meta.items)?meta.items:String(meta.items||"").split(/\r?\n/);
 const items=original.map(s=>String(s).trim().replace(/^\d{1,4}[.)-]\s+/,"").trim()).filter(Boolean);
 if(items.length<10||items.length>1000)throw Error("A lista deve ter de 10 a 1.000 itens ordenados.");
 if(items.some(x=>x.length>120))throw Error("Nome de item longo demais.");
 if(new Set(items.map(normalizeName)).size!==items.length)throw Error("Há itens repetidos ou ambíguos.");
 const aliasMap={};
 for(const [key,variants] of Object.entries(meta.aliases||{})){
   if(!items.includes(key)||!Array.isArray(variants))throw Error("Alias associado a item inexistente.");
   aliasMap[key]=variants.map(x=>String(x).trim()).filter(Boolean);
 }
 const all=new Map(items.map(item=>[normalizeName(item),item]));
 for(const [canonical,variants] of Object.entries(aliasMap)){
   for(const alias of variants){
     const key=normalizeName(alias);
     if(all.has(key)&&all.get(key)!==canonical)throw Error("Alias conflita com nome ou outro alias: "+alias);
     all.set(key,canonical);
   }
 }
 const id="user-"+normalizeName(title).replace(/\s/g,"-").slice(0,36);
 return {id,title,source,url,snapshot,observedAt,methodology,category:meta.category||"Lista da comunidade",tiePolicy:"Ordem declarada pelo anfitrião",status:"candidate-unverified",edition:"user-upload",items,aliases:aliasMap,
  itemIds:items.map((_,i)=>id+"-"+String(i+1).padStart(4,"0")),allowedCuts:allowedCuts(items.length),
  verificationScope:"Lista enviada por anfitrião; não validada pela curadoria Riviera Showdown."};
}
