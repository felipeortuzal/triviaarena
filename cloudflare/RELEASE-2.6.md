# RIVIERA SHOWDOWN 2.6 — THE RANDOM EXPANSION

## Resultado do catálogo
- 41 listas existentes preservadas (ranking, cidades, estados, futebol, F1, cinema, cultura geral).
- +66 listas inéditas, armazenadas no dataset congelado `cloudflare/data/rankings-2.6.json` e embutidas no `cloudflare/worker.mjs` para publicação como Worker único.
- 107 listas no total; **12.262 posições nas listas** (não são 12.262 itens únicos; algumas entidades reaparecem em recortes).
- Cinco listas têm mil posições ou mais: população municipal (1000), área municipal (1000), densidade municipal (1000), 1000 filmes no IMDb histórico e Pokédex Nacional (1025). Há também recortes por região e estado, por gênero de filme, por geração Pokémon, 118 elementos químicos, F1 pilotos e construtores por temporada.
- A base é **congelada e identificada pela data de origem**. Não confundir cinema histórico com o ranking atual do IMDb, nem Pokédex com uma avaliação de força: a Pokédex é sequência por número.

## Proveniência e reprodução
1. **Municípios do Brasil (IBGE / Geodemo Brasil)** — fonte: `https://github.com/luizfpb/geodemo-brasil/blob/main/public/data/municipios.json`. Dataset originalmente proveniente do Censo IBGE 2022 e IBGE SIDRA tabela 4714 para áreas; projeto-fonte MIT. A classificação dos 5570 municípios foi calculada por população (p decrescente), área (a decrescente), densidade p/a decrescente, com nome+UF para desambiguar. Extrair TOP 1000. Regiões e estados são recortes filtrados do mesmo dataset, preservando a ordenação por população.
2. **Pokédex Nacional (PokeAPI)** — `https://github.com/PokeAPI/pokeapi/blob/master/data/v2/csv/pokemon_species.csv`. Espécies #1–1025 ordenadas pelo id nacional. Nome formatado a partir de identificadores do PokeAPI e um pequeno dicionário de nomes especiais; gerações I a IX filtradas por generation_id. **Não é ranking de popularidade ou poder**.
3. **IMDb histórico (dados comunitários JaviRute)** — `https://github.com/JaviRute/top_1000_movies-data_science_project/blob/main/imdb_top_1000.csv`. Dataset anterior a dezembro/2022, congelado. Ordenação explícita: nota IMDb decrescente, desempate por número de votos decrescente. Um título repetido em anos diferentes recebe o ano de lançamento para diferenciar. Os recortes por gênero usam a coluna Genre, filtrados por gênero exato da lista separada por vírgulas; **não são rankings de hoje**.
4. **F1 (F1DB compilado por TracingInsights)** — `https://github.com/TracingInsights/RaceData/blob/main/f1db-csv/f1db-seasons-driver-standings.csv` e `https://github.com/TracingInsights/RaceData/blob/main/f1db-csv/f1db-seasons-constructor-standings.csv` com junção em f1db-drivers.csv e f1db-constructors.csv. Ordenação `positionDisplayOrder`, com nomes dos competidores, apenas temporadas finalizadas até 2025. F1DB disponibilizado sob CC BY 4.0; atribuição preservada.
5. **Tabela periódica** — `https://github.com/Bowserinator/Periodic-Table-JSON`. 118 elementos, em ordem de número atômico. Nomes internacionais, explicitados no subtítulo. Não inclui o elemento provisório de número 119.

## Mecânica do sorteio 2.6
1. Primeiro escolhe **grupo temático** uniformemente (não banco com mais registros), evitando o grupo imediatamente anterior e preferindo grupos que não foram usados nas duas últimas rodadas.
2. Escolhe lista elegível no grupo, evitando os bancos mais recentes quando há outras opções.
3. Escolhe tamanho da rodada, somente entre limites que cabem na lista: 10, 20, 30, 50, 100, 200, 500 ou 1000. Listas curtas legadas com 6–9 itens continuam jogáveis, pelo tamanho exato.
4. Escolhe a posição-alvo pelo sorteio estratificado: faixas 1–10, 11–30, 31–100, 101–300, 301–600 e 601–1000. Formatos grandes podem sortear posições até 1000, mas priorizam posições menos impossíveis. Sorteios repetidos são evitados dentro da mesma partida.
5. No setup, o anfitrião escolhe: **Mistura Riviera (todos os formatos)**, **Clássico (até TOP 50)** ou **Extremo (somente TOP 100 a TOP 1000)**. O backend valida que o Extremo possui ao menos uma lista elegível.
6. O servidor fornece ao jogador os 1000 nomes em **ordem alfabética** como sugestões, sem revelar a posição-alvo do item correto. Gabarito só aparece após revelação. A pontuação autoritativa permanece a mesma dos modos por rodadas e corrida; Turbo e Modo Festa 2.5 compatíveis.

## UI e produto
- Mensagem editorial na homepage "Do TOP 10 ao TOP 1000" e contagem real da biblioteca.
- Busca de categorias por texto, incluindo nomes com acentos; agrupamento para evitar 107 opções sem estrutura.
- Badge de formato, escala (CLÁSSICO / INTERMEDIÁRIO / EXPLORADOR / GIGANTE) e fonte ao lado do desafio; referência completa também no resultado.
- Input contextualizado para municípios e Pokémon.
- Mantém Riviera Club: areia, azul-marinho e amarelo-solar, sem neon ou cards artificiais.

## Qualidade
- Testes unitários de contagem, integridade, origem, top 1000 determinístico, aleatoriedade do motor, compatibilidade de listas curtas e filtros do anfitrião.
- Integração da API multiplayer com TOP >=100, 2 jogadores, bloqueio de modo Extremo inválido, respostas/placar e fontes.
- Chrome end-to-end para busca, criação e jogo no Extremo, resultado e mobile, além da suíte anterior de Ranking, Frases, Modo Festa, Social Club e revanche.
- Publicação deve preservar o binding Durable Object `ARENA`, as salas existentes e o domínio riviera.thegoatgame.com.br.

### Limitações
- Os arquivos são snapshots; rankings econômicos e cinematográficos mudam ao longo do tempo. Os períodos ficam visíveis, e o sistema não os atualiza silenciosamente.
- A qualidade/aceitação das respostas depende do algoritmo existente de nomes e sugestões; nomes com mesma grafia são desambiguados com UF para municípios.
- O sorteio ponderado não significa probabilidade matemática idêntica para cada banco: a prioridade é diversidade de temas e formatos ao longo das partidas. Nos TOP 1000 posições muito altas são propositalmente mais raras.
