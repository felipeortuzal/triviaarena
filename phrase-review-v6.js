// Revisão de frase: só aprova automaticamente respostas suficientemente completas.
// Exato (+2), aproximado (+1) e incorreto (+0). O anfitrião pode revisar com motivo.
export function normalized(value){
 return String(value??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()
   .replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();
}
const stop=new Set(["a","as","o","os","em","um","uma","uns","umas","no","na","nos","nas","do","da","dos","das","de","e","para","por","com","ao","aos"]);
function tokens(value){return normalized(value).split(" ").filter(x=>x&&!stop.has(x))}
function digits(value){return normalized(value).split(" ").filter(x=>/^\d+$/.test(x)).join("|")}
function editDistance(a,b){
 const n=a.length,m=b.length;
 if(!n||!m)return Math.max(n,m);
 let prev=Array.from({length:m+1},(_,i)=>i);
 for(let i=1;i<=n;i++){
   const cur=[i];
   for(let j=1;j<=m;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
   prev=cur;
 }
 return prev[m];
}
const critical=new Set(["antigo","antiga","modernas","moderno","moderna","exato","aproximado","ocidental","oriental","positivo","negativo","sul","norte","primeiro","segundo","terceiro","atual","oficial","comum","bissexto","completa","permanente"]);
export function gradePhrase(guess,puzzle){
 const raw=String(guess??"").trim();
 const exact=normalized(puzzle?.answer);
 const value=normalized(raw);
 if(!value)return {status:"empty",points:0,reason:"Sem resposta"};
 if(!exact)return {status:"invalid",points:0,reason:"Gabarito indisponível"};
 if(value===exact)return {status:"exact",points:2,reason:"Resposta exata"};
 const alternatives=Array.isArray(puzzle.acceptedAnswers)?puzzle.acceptedAnswers:[];
 if(alternatives.some(x=>normalized(x)===value))return {status:"approx",points:1,reason:"Variação aceita na curadoria"};
 if(digits(puzzle.answer)!==digits(raw))return {status:"wrong",points:0,reason:"Número principal diferente"};
 const expected=tokens(exact),given=tokens(value);
 if(expected.length<3||given.length<3)return {status:"review",points:0,reason:"Resposta curta demais para aproximação automática"};
 // Termos que alteram significado não podem desaparecer na resposta incompleta.
 if(expected.some(x=>critical.has(x)&&!given.includes(x)))return {status:"review",points:0,reason:"Termo essencial não informado"};
 const similar=(x,y)=>x===y||x.length>=6&&y.length>=6&&editDistance(x,y)<=1;
 if(expected.length>=2&&!given.some(y=>similar(expected[1],y)))
   return {status:"review",points:0,reason:"Termo principal da frase ausente ou substituído"};
 const matched=expected.filter(x=>given.some(y=>similar(x,y))).length;
 const recall=matched/expected.length,precision=matched/given.length;
 if(recall>=0.75&&precision>=0.7&&given.length<=expected.length+2){
   return {status:"approx",points:1,reason:"Resposta equivalente ou incompleta, mas com elementos essenciais"};
 }
 if(recall>=0.5)return {status:"review",points:0,reason:"Semelhança insuficiente: anfitrião pode revisar"};
 return {status:"wrong",points:0,reason:"Elementos principais não coincidem"};
}
export function reviewPhrase({puzzle,guesses,members,overrides={}}){
 return Object.fromEntries(members.map(uid=>{
   const guess=String(guesses[uid]||"");
   const grade=gradePhrase(guess,puzzle);
   const override=overrides[uid];
   if(override&&Number.isInteger(override.points)&&override.points>=0&&override.points<=2&&
     typeof override.reason==="string"&&override.reason.trim().length>=8){
     return [uid,{uid,guess,status:"reviewed",points:override.points,reason:override.reason.trim()}];
   }
   return [uid,{uid,guess,...grade}];
 }));
}
