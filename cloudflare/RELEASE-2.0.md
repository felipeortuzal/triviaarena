# Riviera Showdown 2.0 — salas personalizáveis, Turbo e estatísticas

## Entregas
- Criação de salas com **8 categorias selecionáveis**, modo Por Rodadas ou Corrida até X e limite de **20, 30 ou 45 segundos** por rodada. Validações e sorteio são executados no Durable Object, não apenas no navegador.
- Presets **Clássico, Turbo e Maratona** para configurar regras em um toque. Regras ficam visíveis no lobby para os convidados.
- **Rodada Turbo opcional** a cada 3ª rodada; multiplica por 2 os pontos normalmente ganhos. Sem Turbo, a pontuação das versões anteriores é idêntica. A rodada especial aparece claramente na arena e na revelação. No modo corrida a meta pode ser ultrapassada por bônus.
- **Estatísticas verificadas pelo servidor**: participações, palpites válidos, acertos exatos, distância acumulada e média, vitórias na sala, primeiros/segundos lugares e desempenho em Turbos. Dados da partida atual reiniciam na revanche, estatísticas agregadas da sala persistem durante a vida da sala (~24h).
- **Riviera Awards** ao fim: Sniper (mais exatas), Professor (menor distância média), Flash (acerto exato mais rápido), Rei do Turbo (mais vitórias em rodada especial). Prêmios são omitidos quando não há elegíveis e podem ser compartilhados em caso de empate.
- **Histórico de 60 rodadas reveladas** por sala, exibido em detalhe após cada partida. Não expõe palpites antes do fim da rodada.
- **Novos modos preparados visualmente** ("Frases & Aproximações" e "Seven"), rotulados como em desenvolvimento, não são anunciados como jogáveis.

## Continuidade e segurança
- Conserva o Worker `riviera-showdown`, a classe Durable Object `ArenaRoom`, o domínio `riviera.thegoatgame.com.br`, login por sessão e rankings existentes. **Sem migração de storage**; salas criadas anteriormente seguem com configuração-padrão (30s, todas as categorias, sem Turbo).
- Nenhum token de sessão está presente nas estatísticas públicas nem no histórico. As reações, convites, placar e regras existentes da versão 1.2 foram preservados.
- Estatísticas são **da sala**, não um ranking global e não implicam persistência entre salas ou após expiração da sala.
- Atualmente não há moderação de histórico nem contas de usuário verificadas.

## Testes de aceitação
`node --test cloudflare/game.test.mjs`: regra de Turbo, configuração, duração, filtros de categoria, estatísticas, vitórias e awards.
`node cloudflare/integration.mjs` com Wrangler: duas sessões, três rodadas, 20 segundos, categoria Pokémon, Turbo, histórico, privacidade e revanche.
`node cloudflare/browser.test.mjs` com dois Chromes (desktop e mobile): presets, categoria escolhida, lobby, jogo, estatísticas, revelação, layout 320px, revanche, sons e reações.

## Publicação
O GitHub Actions executa testes automaticamente. A implantação em produção é feita via conexão Cloudflare, reaproveitando o Durable Object existente. Deploy via CLI em CI requer secrets separados, que não estão cadastrados; este fato não impede a publicação direta pela conexão autenticada.
