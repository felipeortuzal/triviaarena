import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesPhrase,calculatePhrase} from '../phrase-tools.js';
test('frases aceitam equivalências justificáveis e transposição simples',()=>{
 const p={answer:'7 Maravilhas do Mundo Antigo',aliases:['As sete maravilhas da Antiguidade']};
 for(const answer of ['sete maravilhas do mundo antigo','7 MARAVILHAS DO MUNDO ANTIGO!','7 Maravlihas do Mundo Antigo','as sete maravilhas da antiguidade'])assert.equal(matchesPhrase(answer,p),true,answer);
 assert.equal(matchesPhrase('vinte e sete estrelas na bandeira do Brasil',{answer:'27 Estrelas na Bandeira do Brasil'}),true);
});
test('frases rejeitam número errado, negação, contexto errado e resposta incompleta',()=>{
 const p={answer:'7 Maravilhas do Mundo Antigo'};
 for(const answer of ['8 maravilhas do mundo antigo','7 maravilhas do mundo moderno','7 maravilhas do mundo','não 7 maravilhas do mundo antigo','7 maravilhas',''])assert.equal(matchesPhrase(answer,p),false,answer);
 const review=calculatePhrase({puzzle:p,guesses:{a:'sete maravilhas do mundo antigo',b:'7 maravilhas do mundo moderno'},members:['a','b','c']});
 assert.deepEqual(Object.values(review).map(x=>x.points),[1,0,0]);
});
