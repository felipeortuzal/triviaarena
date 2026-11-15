# Riviera Showdown 1.2 — Cinematic Reveal, Podium & Reactions

## Release
- Revelação cinematográfica com animação de entrada/saída, gradientes, destaque da resposta correta e apresentação progressiva dos resultados. Respeita `prefers-reduced-motion`.
- Pódio final com até três jogadores, pontuação e ranking. O critério de desempate por distância da rodada permanece inalterado, e empates de pontos totais são apresentados na ordenação numérica da pontuação com ordem alfabética no placar.
- Som **opt-in**, desativado por padrão, controlado na navegação e persistido em `localStorage`. Toques originais gerados com Web Audio API, sem arquivos musicais ou dependências externas; não há música de terceiros.
- Reações rápidas 🔥 😂 👏 🤯 🏆 😎 visíveis em tempo real aos membros da mesma sala: whitelist no servidor, autenticação por sessão, WebSockets + polling de recuperação e rate limit de 1 reação a cada 1,2s por jogador; os eventos expiram após ~8,5s.
- Compartilhamento de resultados via Web Share API quando disponível; fallback para área de transferência. Convite via WhatsApp permanece no lobby.
- HUD e pódio ajustados para 320 px, 375 px e desktop. Animações de transformação/opacidade e modo de movimento reduzido.

## Segurança, compatibilidade e implantação
- Continua sobre o mesmo Worker `riviera-showdown` e Durable Object SQLite `ArenaRoom` criado na v1; não inclui novas migrações e preserva salas existentes, que recebem os campos de reações ao primeiro uso.
- Nunca inclui tokens ou palpites na lista pública de reações. Um evento contém apenas ID aleatório, emoji permitido, nome do participante e horário.
- O resultado e as respostas continuam revelados apenas no encerramento da rodada.
- As categorias e o sistema de pontuação da 1.1 foram preservados.

## Testes
- `node --test cloudflare/game.test.mjs` valida regras.
- `node cloudflare/integration.mjs` contra Wrangler local valida duas sessões, privacidade, reactions, rate limit e revanche.
- `node cloudflare/browser.test.mjs` em dois contextos Chrome valida som opcional, reações em dispositivos distintos, animação, pódio, mobile 320 px e revanche.
- Uma partida entre dois celulares físicos continua recomendada como teste de aceitação de produção.
