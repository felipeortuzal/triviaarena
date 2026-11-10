# Riviera Showdown — auditoria do catálogo V6

Edição editorial: **10/11/2026**. Nenhuma posição de ranking foi preenchida a partir de suposição.

## Inventário dos fatos

O catálogo anterior tinha **104 posições indexadas**. Preservamos todas, acrescentamos **6 fatos novos** e marcamos **9 entradas problemáticas como não sorteáveis** (sem apagar dados antigos ou renumerar salas em andamento). Estado atual: **110 registros, 101 disponíveis para sorteio, 9 desativados**. IDs permanentes `fact-001` a `fact-110`; as entradas de repetição trazem `duplicateOf` quando há identidade semântica inequívoca.

| Tema | Registros | Ativos | Fácil | Médio | Difícil |
|---|---:|---:|---:|---:|---:|
| Biologia | 5 | 2 | 3 | 2 | 0 |
| Brasil | 4 | 4 | 1 | 3 | 0 |
| Ciência | 10 | 10 | 2 | 5 | 3 |
| Corpo humano | 6 | 6 | 1 | 4 | 1 |
| Cultura geral | 3 | 3 | 1 | 2 | 0 |
| Cultura pop | 2 | 2 | 2 | 0 | 0 |
| Espaço | 2 | 2 | 1 | 0 | 1 |
| Esportes | 10 | 8 | 5 | 4 | 1 |
| Geografia | 5 | 4 | 1 | 3 | 1 |
| História | 10 | 10 | 0 | 4 | 6 |
| Jogos | 8 | 8 | 3 | 4 | 1 |
| Língua | 1 | 1 | 0 | 1 | 0 |
| Linguagem | 1 | 1 | 1 | 0 | 0 |
| Literatura | 1 | 1 | 0 | 1 | 0 |
| Matemática | 13 | 13 | 4 | 5 | 4 |
| Medidas | 5 | 5 | 3 | 0 | 2 |
| Mitologia | 3 | 3 | 0 | 2 | 1 |
| Música | 9 | 6 | 4 | 4 | 1 |
| Natureza | 1 | 1 | 1 | 0 | 0 |
| Tecnologia | 3 | 3 | 0 | 1 | 2 |
| Tempo | 8 | 8 | 7 | 1 | 0 |

**Entradas retiradas do sorteio (preservadas por compatibilidade):**

| ID | Enunciado | Razão |
|---|---|---|
| fact-091 | 4 C no D H | Duplicata exata do fato 45, com sigla incompatível (D H). |
| fact-092 | 5 A nos A O | Duplicata semântica do fato 62 sobre cinco anéis olímpicos. |
| fact-093 | 11 J em um T de F | Duplicata semântica do fato 56 (11 jogadores por equipe de futebol). |
| fact-097 | 46 C nos C H | Duplicata do fato 46; além disso, 46 cromossomos não se aplicam a toda célula humana. |
| fact-100 | 5 O nos J O | Duplicata semântica dos cinco oceanos no fato 68; enunciado circular/ambíguo. |
| fact-101 | 6 C em um H | Duplicata do fato 55 sobre seis cordas do violão. |
| fact-102 | 88 T em um P T | Duplicata do fato 53 sobre 88 teclas do piano. |
| fact-103 | 7 N M na E D | Duplicata do fato 51 sobre as sete notas naturais. |
| fact-104 | 9 M de G em uma G | A gestação não dura exatamente nove meses; aproximação sem critério e sem período de referência. |

**Revisões especiais:** `fact-091` (`4 C no D H`) contradiz a própria resposta: a forma canônica já existia em `fact-045`; não fazemos adivinhação. `fact-100` (`5 O nos J O`) mistura oceanos com "mapas oceânicos" e duplica `fact-068` (classificação moderna em cinco). `fact-104` foi desativada por tratar a duração gestacional aproximada como dado exato. Reescrevemos dicas repetitivas em várias categorias e registramos critérios de convenção em fusos, estações, cores do arco-íris, sentidos tradicionais e oceanos.

**Novas perguntas:** 3600 segundos em uma hora, 5 sólidos platônicos, 6 arestas e 4 faces de um tetraedro, 8 pernas de aranha, 6 pernas de inseto. Todas incluem enunciado, explicação, duas dicas distintas, tema e nível. Não são cópias de rankings externos.

## Inventário dos quatro rankings

| ID | Lista | Edição/data da fonte | Consulta observada | Verificação inicial | Referência |
|---|---|---|---|---|---|
| `area` | Maiores países e territórios | Consulta em novembro de 2026 | 2026-11-10 | 9/100 posições confrontadas | https://www.worldometers.info/pt/geografia/maiores-paises-do-mundo/ |
| `population` | Mais populosos do planeta | 2026 | 2026-11-10 | 12/100 posições confrontadas | https://www.worldometers.info/world-population/population-by-country/ |
| `gdp` | Maiores economias do mundo | 2025, vintage FMI outubro de 2026 | 2026-11-10 | 20/100 posições confrontadas | https://www.worldometers.info/gdp/gdp-by-country/imf-2025-nominal-worldwide/ |
| `movies` | Filmes mais bem avaliados | 01/11/2026 | 2026-11-10 | 30/100 posições confrontadas | https://www.timo-schreiter.de/imdb/my_top250.php |

**Atenção:** "posições confrontadas" refere-se apenas ao prefixo indicado, não a uma validação de 100/100. Fora desse prefixo, o jogador vê um aviso editorial no site. Não declaramos que um Top 100 seja comprovado apenas porque há 100 itens armazenados. O catálogo completo e suas posições continuam disponíveis para demonstração e uso sob responsabilidade do grupo, como na V5; a curadoria exaustiva aguarda extração/checagem dos recortes integrais. O recorte original das salas antigas é mantido.

**Versionamento:** os quatro rankings têm ID próprio, itemIds por posição, `revision` de edição, `edition` da fonte e `observedAt` separado. Cada rodada V6 armazena `listSnapshot` com itens, aliases, fonte e revisão: alterações futuras em `data.json` não alteram a resposta de uma partida já iniciada. As frases têm `puzzleSnapshot` próprio.

**Limite de confiança:** as respostas dos rankings estão no navegador; usuários técnicos podem consultar o catálogo. O mecanismo de segurança protege os *palpites privados*, não impede consulta manual a conteúdo público. O anfitrião pode importar até três rankings por lobby, desde que apresente URL HTTPS, edição, critério de ordenação e 10–1000 itens sem duplicatas; esses são marcados como *listas do anfitrião*, sem selo de verificação editorial. Nomes que começam com números — como **12 Angry Men** — não perdem o número ao importar.

## Fontes primárias candidatas para futuras listas

| Tema | Fonte verificável | O que oferece | Condição antes de liberar |
|---|---|---|---|
| Futebol | FIFA World Ranking: https://quality.fifa.com/fifa-rankings/world-ranking/men | Classificações de seleções com data de publicação | Congelar edição específica, checar cobertura e reutilização |
| Esportes | Regras IFAB: https://www.theifab.com/laws/latest/the-players/ | Regras oficiais de número de jogadores e outros fatos | Ideal para frases; não é ranking de 100 equipes |
| Música | IFPI Global Charts: https://www.ifpi.org/our-industry/global-charts/ | Ranking Top 10 de singles com edição | Edição/direitos de reutilização e formato reconhecido |
| Cultura/História | UNESCO DataHub: https://data.unesco.org/explore/assets/whc001/export/ | Lista aberta de patrimônio mundial (CC BY-SA 4.0) | Dataset **não** oferece ranking universal por qualidade; definir critério derivado e desempate |
| Tecnologia | WIPO Global Innovation Index: https://www.wipo.int/en/web/global-innovation-index | Ranking anual de inovação e indicadores | Congelar edição 2026, licença e conferência dos itens |
| Negócios | Fortune Global 500: https://fortune.com/ranking/global500/ | Empresas por receita e metodologia | Checar licença/republicação e lista completa; não copiar sem autorização |
| Economia | FMI WEO 2026: https://data.imf.org/datasets/WEO | Indicadores de PIB por país com vintage do relatório | Especificar ano, indicador, moeda, desempate e unidades |
| Astronomia | IAU: https://www.iau.org/IAU/Astronomy-FAQs/Constellations.aspx | Fatos oficiais e listas de constelações | É inventário, não ranking sem critério de ordenação |
| Química | IUPAC: https://iupac.org/what-we-do/periodic-table-of-elements/ | Tabela periódica oficial | Pode sustentar frases/ordem por número atômico, sem atribuir licença não conferida |

As fontes acima são **candidatas**, não rankings importados ou publicações validadas. Não convertem uma base incompleta em Top 250/500/1000 fictício.

## Mecânicas de partida solicitadas

**Partida de 3, 5 ou 7 rodadas**, com **5 por padrão**. Cada rodada tem uma pergunta única, ações do anfitrião, apuração e avanço. A última rodada confirma pontos e apresenta o pódio automaticamente; não é um ranking infinito. No modo Misturado, cada posição da sequência alterna Frases e Ranking. Os pontos do ranking são 5/3/1 por colocação na rodada, acumulados até a final.

**Frase digitada:** exata +2; equivalente suficientemente próxima +1; incorreta/ambígua +0, com possibilidade de revisão justificada pelo anfitrião antes de confirmar. Números diferentes e termos críticos ausentes não são aceitos automaticamente. Quando a turma responde somente em voz, o anfitrião pode marcar o vencedor (+1) como modo de compatibilidade.

**Testes:** `npm run validate:catalog`, `npm test`, `npm run test:rooms`, `npm run test:browser-rank` e `node tests/browser-smoke.mjs`. A etapa 4, de Firebase de produção + GitHub Pages + dois celulares físicos, permanece separada.
