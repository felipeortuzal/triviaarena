# Riviera Showdown 2.0 — remodelagem visual da arena
Data: 12/11/2026.

## Escopo entregue
- Nova landing page editorial, com composição de game show e cards de três passos.
- Nova identidade cromática verde-lima + violeta sobre carvão e tipografia expressiva, com design responsivo e sem fontes/CDNs externos.
- Novo bloco principal para preparar partida local, ações em destaque e entrada para salas online preservada.
- Indicador de cinco rodadas em telas da partida.
- Tela de passagem do aparelho com lista de jogadores que já enviaram, sem revelar palpites.
- Reformulação visual das telas de rodada, categoria, posição-alvo, placar lateral, revelação, pódio e histórico.
- Arquivo offline regenerado pela mesma lógica do gerador do repositório.

## Regras intocadas
Só Estimativa de Ranking ativa. Frase/Misturado preservados mas pausados. Cinco rodadas, revelação somente após todas as respostas ou desistências explícitas, pontos 5/3/1, empates, revisão justificada, revanche, privacidade dos palpites, multiplayer condicionado à configuração e testes do Firebase.

## Validação
Verificar `npm test`, `npm run test:browser-travel` e `npm run test:browser-five` em CI/ambiente habilitado. Não declarar testes de dois aparelhos físicos ou deploy HTTPS como concluídos sem evidência.
