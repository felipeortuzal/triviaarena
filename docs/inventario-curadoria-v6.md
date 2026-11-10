# Etapa 06 — Curadoria, fontes e partidas de duração definida

## Decisão de produto (10/11/2026)

Uma partida não deve durar indefinidamente. Na criação, o anfitrião escolhe **3, 5 (padrão) ou 10 rodadas**; a sala grava `roundLimit` imutável. O lobby e cada rodada mostram a duração; depois de pontuar a última, o jogo encerra e mostra o pódio automaticamente. É possível finalizar mais cedo manualmente. No ranking cada rodada distribui 5/3/1 pontos com empates; no Decifre a Frase a resposta exata vale 1 e a **aproximação semanticamente correta vale 0,5** quando o anfitrião escolhe essa opção. Uma resposta incorreta vale zero. Não existe algoritmo automático de similaridade aceitando falsos positivos; a autoridade de validação e responsabilidade pelo julgamento permanece explícita.

**Exemplo:** em uma partida mista de 5 rodadas, as rodadas 1/3/5 são Frase e 2/4 são Ranking. Um jogador que recebe 0,5 na 1ª rodada, 5 na 2ª e 1 na 5ª termina com 6,5 pontos. O placar é somado uma única vez por rodada e preservado em recarregamento.

## Inventário real do catálogo

- 104 frases/entradas originais — **96 elegíveis, 8 duplicatas semânticas inativas**, mantendo seus índices e identificadores para salas antigas.
- Dificuldades elegíveis: Fácil **34**, Médio **39**, Difícil **23**.
- Contagem por tema (elegível):

| Tema | Total | Tema | Total |
|---|---:|---|---:|
| Matemática | 10 | Ciência | 10 |
| História | 10 | Jogos | 8 |
| Esportes | 8 | Tempo | 7 |
| Música | 6 | Corpo humano | 6 |
| Medidas | 5 | Geografia | 4 |
| Brasil | 4 | Cultura geral | 3 |
| Tecnologia | 3 | Mitologia | 3 |
| Espaço | 2 | Cultura pop | 2 |
| Língua | 1 | Literatura | 1 |
| Linguagem | 1 | Natureza | 1 |
| Biologia | 1 | | |

O campo `id` usa identificadores estáveis `frase-0001` etc., `status` distingue `active` e `inactive`, e `duplicateOf` documenta relações de duplicidade. Foram substituídas **95 duplas de dicas genéricas** por duas pistas distintas e progressivas. Dados sensíveis a convenção têm referência ou esclarecimento, inclusive **5 oceanos** pela convenção moderna da NOAA e **5 anéis olímpicos** de acordo com o COI. A entrada historicamente errada `4 C no D H` foi corrigida para `4 C no C H` e desativada como duplicata da entrada 45; `5 O nos J O` foi corrigida para `5 O na C M` e desativada como duplicata da entrada 68.

Duplicatas desativadas: 91→45 (câmaras), 92→62 (anéis), 93→56 (futebol), 97→46 (cromossomos), 100→68 (oceanos), 101→55 (violão), 102→53 (piano), 103→51 (notas). **Nenhuma foi apagada**, preservando os índices das salas anteriores. A questão de gestação passa a reconhecer explicitamente a duração aproximada.

## Rankigns originais com versões e limitações

| ID | Categoria | Fonte e edição | Itens | Recortes previstos |
|---|---|---|---:|---|
| `area` | Geografia | [Worldometer — área total](https://www.worldometers.info/geography/largest-countries-in-the-world/) · snapshot consultado em 10/11/2026 | 100 | 10, 25, 50, 100 |
| `population` | Demografia | [Worldometer — população 2026](https://www.worldometers.info/world-population/population-by-country/) · estimativa 2026 | 100 | 10, 25, 50, 100 |
| `gdp` | Economia | [Worldometer/FMI — PIB nominal 2025](https://www.worldometers.info/gdp/gdp-by-country/imf-2025-nominal-worldwide/) · WEO outubro 2026 | 100 | 10, 25, 50, 100 |
| `movies` | Cinema | [IMDb Top 250, retrato 01/11/2026](https://www.timo-schreiter.de/imdb/my_top250.php) · reprodução de terceiro | 100 | 10, 25, 50, 100 |

Estas quatro bases já existiam antes da Etapa 06. A origem e **a abertura de cada ordem** foram confrontadas com páginas disponíveis, mas **não foi possível demonstrar auditoria linha a linha de todas as 400 posições** nesta execução. `verificationScope` declara isso explicitamente. Sites dinâmicos podem alterar listas posteriormente. A estrutura conserva `edition`, `snapshot`, `observedAt`, `methodology`, `tiePolicy`, `itemIds` e `allowedCuts`. É necessário aprofundar a verificação dos itens antes de alegar cobertura totalmente auditada, especialmente cinema de terceira parte. Um gabarito usado numa sala antiga prevalece pelo `round.content` / `round.catalog` gravado na abertura da rodada, não pela versão mais recente no navegador; rodadas legadas sem snapshot mantêm fallback pelos índices originais.

## Temas candidatos para expansão — NÃO publicados como posições

- **Futebol:** [ranking FIFA masculino](https://inside.fifa.com/fifa-rankings/world-ranking/men) — precisa fixar data do ranking e extrair uma edição autorizada.
- **Tênis:** [ranking ATP de simples](https://www.atptour.com/en/rankings/singles) — precisa escolher semana, extrair posições ordenadas e verificar direito de reutilização.
- **Música:** [Spotify Charts](https://charts.spotify.com/) — seria necessário fixar dia/semana, região e condições de reutilização; **não** inferir ordem pelo número total de streams não qualificados.
- **Ciência/tecnologia, negócios, história, cultura geral e outros esportes:** continuam sem listas amplas ordenadas e licenciáveis identificadas; permaneceram **candidatas**, sem rankings inventados.

## Importação de listas do anfitrião

`catalog-v6.js` implementa `parseHostRanking` e `validateCatalog`. A interface de importação fica em **demonstração local**: título, nome e URL HTTPS da fonte, metodologia, edição, data de observação e **10–1000 itens em ordem explícita**. Um usuário pode experimentar o ranking importado no jogo offline com um adversário simulado. A importação é `candidate-unverified`, **não entra no multiplayer oficial** nem substitui catálogo verificado por todos os aparelhos.

Recortes só são liberados até o comprimento real da lista: Top 10, 25, 50, 75, 100, 250, 500 e 1.000. Itens repetidos, alias que conflita com item, fonte inválida, data inválida e ausência de posições são rejeitados. Um prefixo numérico é retirado **somente** quando vem com ponto/parêntese/hífen e espaço (por exemplo, `1. Nome`); o título `12 Angry Men` não perde o 12.

## Teste e segurança

Execute `npm test` (unidade, catálogo, pacote Pages), `npm run test:rooms` (Auth + RTDB Emulator, incluindo limite de rodadas e meio ponto), `node tests/browser-smoke.mjs` (`file://` offline) e `npm run test:browser-rank` (dois Chromes isolados). A aplicação não promove uma versão de catálogo durante uma rodada em andamento. A segurança de autoridade no cálculo depende do anfitrião e do catálogo visível, como já documentado em `docs/arquitetura-ranking-v5.md`.

**A Etapa 04 permanece Parcial:** sem GitHub Pages/Firebase de produção e sem partida homologada em dois aparelhos físicos. Teste no emulador não é teste de produção.
