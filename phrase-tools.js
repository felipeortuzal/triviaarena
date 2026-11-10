// Equivalências conservadoras: números por extenso, acentos, artigos e aliases
// editoriais. Não usa similaridade semântica nem remove negações/qualificadores.
export function normalizePhrase(value){
  const numbers={zero:0,um:1,uma:1,dois:2,duas:2,tres:3,quatro:4,cinco:5,seis:6,sete:7,oito:8,nove:9,dez:10,onze:11,doze:12,treze:13,catorze:14,quatorze:14,quinze:15,dezesseis:16,dezasseis:16,dezessete:17,dezoito:18,dezenove:19,vinte:20,trinta:30,quarenta:40,cinquenta:50,sessenta:60,setenta:70,oitenta:80,noventa:90,cem:100};
  const tokens=String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/);
  const converted=[];
  for(let i=0;i<tokens.length;i++){
    const n=numbers[tokens[i]];
    if(n>=20&&n<100&&tokens[i+1]==='e'&&numbers[tokens[i+2]]>0&&numbers[tokens[i+2]]<10){converted.push(String(n+numbers[tokens[i+2]]));i+=2;}
    else converted.push(n===undefined?tokens[i]:String(n));
  }
  return converted.filter(t=>!['o','a','os','as','de','do','da','dos','das'].includes(t)).join(' ');
}
export function matchesPhrase(guess,puzzle){
  const actual=normalizePhrase(guess);
  if(!actual)return false;
  return [puzzle.answer,...(puzzle.aliases||[])].some(answer=>{
    const expected=normalizePhrase(answer);
    if(actual===expected)return true;
    // Uma transposição adjacente em palavra longa é um erro de digitação
    // justificável. Números, palavras curtas e demais diferenças são rejeitados.
    const a=actual.split(' '),b=expected.split(' ');
    if(a.length!==b.length)return false;
    const changed=a.map((word,i)=>word===b[i]?-1:i).filter(i=>i>=0);
    if(changed.length!==1)return false;
    const i=changed[0],x=a[i],y=b[i];
    if(x.length<5||x.length!==y.length||!/^[a-z]+$/.test(x+y))return false;
    for(let j=0;j<x.length-1;j++)if(x.slice(0,j)+x[j+1]+x[j]+x.slice(j+2)===y)return true;
    return false;
  });
}
export function calculatePhrase({puzzle,guesses,members}){
  return Object.fromEntries(members.map(uid=>{
    const guess=guesses[uid]||'',correct=matchesPhrase(guess,puzzle);
    return [uid,{uid,guess,correct,points:correct?1:0}];
  }));
}
