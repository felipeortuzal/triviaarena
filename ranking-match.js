export function normalizeAnswer(s){return String(s||"").replace(/♀/g," female ").replace(/♂/g," male ").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," ")}

const SYNONYMS={
 "estados unidos":["eua","usa","united states"],"reino unido":["uk","inglaterra","united kingdom"],"rd congo":["rdc","republica democratica do congo"],"paises baixos":["holanda","netherlands"],
 "sao paulo":["sp"],"rio de janeiro":["rj"],"minas gerais":["mg"],"rio grande do sul":["rs"],"mato grosso":["mt"],"mato grosso do sul":["ms"],"distrito federal":["df","brasilia"],"espirito santo":["es"],"parana":["pr"],"bahia":["ba"],"ceara":["ce"],"pernambuco":["pe"],"santa catarina":["sc"],"rio grande do norte":["rn"],"paraiba":["pb"],"maranhao":["ma"],"goias":["go"],"amazonas":["am"],"para":["pa"],"acre":["ac"],"amapa":["ap"],"roraima":["rr"],"rondonia":["ro"],"sergipe":["se"],"alagoas":["al"],"piaui":["pi"],"tocantins":["to"],
 "the godfather":["o poderoso chefao"],"the godfather part ii":["o poderoso chefao 2"],"the shawshank redemption":["um sonho de liberdade"],"the dark knight":["batman o cavaleiro das trevas"],"the matrix":["matrix"],"inception":["a origem"],"interstellar":["interestelar"],"fight club":["clube da luta"],"forrest gump":["forrest gump o contador de historias"],
 "how i met your mother":["himym","como eu conheci sua mae"],"the fresh prince of bel air":["um maluco no pedaco"],"full house":["tres e demais"],"the office":["the office us","the office eua"],"the big bang theory":["a teoria do big bang","tbbt"],
 "bulbasaur":["bulbassauro"],"ivysaur":["ivissauro"],"venusaur":["venussauro"],"nidoran female":["nidoran femea","nidoran f"]
};

/* Riviera 2.7: high-confidence, server-authoritative typo resolution.
   Deliberately not an LLM: no external network, latency, token charges or
   non-deterministic guessing. Ambiguous guesses are never auto-mapped. */
export function normalizeGuess(raw){
 return normalizeAnswer(String(raw||"").replace(/&/g," and "))
  .replace(/\b(ur|yr)\b/g,"your")
  .replace(/\bthru\b/g,"through")
  .replace(/\btvshow\b/g,"tv show")
  .replace(/\s+/g," ").trim();
}
function matcherCompact(value){return value.replace(/\s+/g,"");}
function matcherCore(value){
 // Omit only weak articles/connectors, never meaningful distinguishing words.
 return value.split(" ").filter(w=>!["the","a","an","of","and","de","do","da","dos","das","o","os","as","e"].includes(w)).join(" ");
}
function matcherAcronym(value){
 return value.split(" ").map(t=>t[0]||"").join("");
}
function matcherCity(value){
 // IBGE names in this catalog include " - UF" to disambiguate duplicate cities.
 return value.replace(/\s+(?:ac|al|ap|am|ba|ce|df|es|go|ma|mt|ms|mg|pa|pb|pr|pe|pi|rj|rn|rs|ro|rr|sc|sp|se|to)$/,"");
}
export function typoDistance(a,b,cap=7){
 if(Math.abs(a.length-b.length)>cap)return cap+1;
 let last2=[],last1=Array.from({length:b.length+1},(_,j)=>j);
 for(let i=1;i<=a.length;i++){
  const next=[i];
  for(let j=1;j<=b.length;j++){
   let d=Math.min(next[j-1]+1,last1[j]+1,last1[j-1]+(a[i-1]===b[j-1]?0:1));
   if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])d=Math.min(d,last2[j-2]+1);
   next[j]=d;
  }
  last2=last1;last1=next;
 }
 return last1[b.length];
}
export function resolveAnswer(raw,options,localAliases){
 const input=normalizeGuess(raw);
 const failed={index:-1,canonical:null,method:null,corrected:false};
 if(!input||!Array.isArray(options)||!options.length)return failed;
 const candidates=options.map((item,index)=>{
  const normalized=normalizeGuess(item);
  return {item,index,normalized};
 });
 const unique=matches=>{
  if(matches.length!==1)return null;
  const selected=matches[0];
  return {index:selected.index,canonical:selected.item,method:selected.method,corrected:normalizeAnswer(raw)!==normalizeAnswer(selected.item)};
 };
 // Exact name or registered translation/alias.
 const exact=candidates.filter(x=>x.normalized===input);
 if(exact.length)return unique(exact.map(x=>({...x,method:"exact"})))||failed;
 const aliases=candidates.filter(x=>[...(Object.hasOwn(SYNONYMS,normalizeAnswer(x.item))?SYNONYMS[normalizeAnswer(x.item)]:[]),...(localAliases?.[x.item]||[])].some(v=>normalizeGuess(v)===input));
 if(aliases.length)return unique(aliases.map(x=>({...x,method:"alias"})))||failed;
 // Unique compact spelling, shortened city-without-UF, official initials/acronym.
 const compact=matcherCompact(input);
 const inputCore=matcherCore(input);
 const safeVariants=candidates.filter(x=>
   (compact.length>=6&&matcherCompact(x.normalized)===compact)||
   (inputCore.length>=8&&matcherCore(x.normalized)===inputCore)||
   (input.length>=5&&matcherCity(x.normalized)===input&&x.normalized!==input)||
   (input.length>=4&&input===matcherAcronym(x.normalized)&&x.normalized.split(" ").length>=3)
 );
 if(safeVariants.length)return unique(safeVariants.map(x=>({...x,method:"variant"})))||failed;
 // Damerau–Levenshtein handles accidental swapped letters, missing and
 // repeated letters. Strict edit budget + second-best margin prevent collisions.
 const size=input.length;
 const budget=size<=5?0:size<=8?1:size<=14?2:size<=23?3:size<=34?4:Math.min(6,Math.floor(size*0.12));
 if(!budget)return failed;
 const scores=candidates.map(x=>{
  const city=matcherCity(x.normalized);
  const complete=typoDistance(input,x.normalized,budget+2);
  const shorter=city!==x.normalized?typoDistance(input,city,budget+2):budget+3;
  return {...x,dist:Math.min(complete,shorter),compared:shorter<complete?city:x.normalized};
 }).sort((a,b)=>a.dist-b.dist);
 const winner=scores[0],runner=scores[1];
 const overlap=winner.dist/Math.max(input.length,winner.compared.length);
 const nearOther=runner&&(runner.dist===winner.dist||(winner.dist>=2&&runner.dist<=winner.dist+1));
 if(winner.dist>budget||overlap>0.21||nearOther)return failed;
 return unique([{...winner,method:"typo"}]);
}
