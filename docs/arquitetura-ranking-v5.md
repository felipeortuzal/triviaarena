# Riviera Showdown · Estimativa de Ranking e Misto (V5)

## Escopo e referências

A versão 5 compartilha o mesmo lobby (`roomRegistry`, `roomPublic`, `roomMembers`) para **Frases**, **Ranking** e **Misturado**. O modo misturado alterna **Frase → Ranking → Frase** e mantém o placar, o anfitrião e o histórico. A prévia `riviera-showdown.html` permite experimentar os três modos sem rede com um convidado **simulado**, distintamente do multiplayer real.

O catálogo V5 usa as quatro listas pré-existentes no `data.json`: área territorial, população, PIB nominal e filmes (100 itens cada). Cada cartão de ranking exibe título, descrição/critério (`about`), `source`, `snapshot`, link `url`, recorte Top 25/50/75/100 e posição-alvo. Os links são dados externos e podem mudar; a etapa 6 auditará posicionamento e atualizações de fontes. Há aliases claros PT/EN por lista para nomes de países e títulos de filmes. Listas sem HTTPS, fonte, data, pelo menos 25 itens e nomes canônicos únicos normalizados não entram no sorteio.

**Limite de confiança explícito:** a lista de itens é entregue ao navegador para exibição e resolução local. Usuários tecnicamente capazes podem inspecioná-la e descobrir a posição correta antecipadamente. O controle no RTDB impede que um membro leia **o palpite de outro antes da revelação**, mas não torna o catálogo secreto, nem substitui um servidor de jogo autoritativo. O anfitrião tem autoridade de apuração/correção. Para disputas de alta confiança ou prêmio real será necessário mover sorteio, respostas e pontuação para infraestrutura confiável.

## Dados no Realtime Database

- `roomPublic/{code}/round`: metadados da rodada, alvo, categoria, tamanho, flags `revealed`, `resultReady` e `scored`. Não contém os palpites antes da revelação.
- `roomPrivateGuesses/{code}/{roundId}/{uid}`: texto privado do próprio jogador. Cada identidade anônima pode ler e alterar **só seu valor** enquanto a rodada rank estiver aberta, sem alteração posterior.
- `roomGuessStatus/{code}/{roundId}/{uid}`: **somente `true`**, que sinaliza envio, sem texto. Leitura por membros da sala, escrita do UID correspondente apenas quando já existe o texto privado e a rodada está aberta. O nó pai e as raízes de palpites não concedem leitura pública.
- Após **Revelar**, o host congela novos envios alterando `round.revealed` via transação. Só **então** pode ler os textos individuais e grava `round.guesses` (visíveis), `round.review` calculado e `round.resultReady` em uma transação. O anfitrião pode incluir `round.overrides/{uid}` com `position` (0 significa inválido) e `reason` visível, recalculando a mesma `review`.
- `roomPublic/{code}/roundHistory/{roundId}` conserva resultados e notas de correção, e `roomPublic/{code}/scores` conserva o total da partida. O avanço (ou finalização) transfere todos os pontos **uma única vez e em uma única transação**, no mesmo nó do estado; `scored` evita reprocessamento.
- `usedRanks` registra chave categoria/recorte/alvo para evitar repetição até esgotar as combinações; `usedLetters` continua independente.

**Fronteira importante:** regras do Realtime Database herdadas de um nó pai não podem ser revogadas num filho. Por isso, os palpites nunca ficam como filhos de `roomPublic` antes da revelação. Em `roomPrivateGuesses`, a regra `.read` fica no UID. O host só pode ler valores alheios quando o ID da rodada corresponde e `revealed=true`. Status é separado, com apenas booleanos.

## Resolução dos nomes e pontuação

`rank-tools-v5.js` aplica Unicode NFD, ignora acentos e diferenças de maiúsculas/minúsculas, normaliza pontuação e espaços e reconhece aliases da própria lista. Não faz *fuzzy matching* inseguro, não inventa posições, nem usa buscas externas para adivinhar resposta. Respostas com mais de uma correspondência são **ambíguas** e não pontuam automaticamente.

Quando o nome é reconhecido fora do Top sorteado, recebe estado **fora do recorte** e zero ponto; sem envio, vazio e nomes desconhecidos também recebem zero. Uma correção manual com justificativa escrita, visível no ranking, pode atribuir uma posição válida a uma tradução/sinônimo ou zero a um nome inadequado.

Distância = `abs(posição_encontrada - posição_alvo)`. Valores menores são melhores. Empates compartilham a posição por **ranking de competição** (1,2,2,4), independentemente da ordem de chegada. Pontos por **colocação**, não por distância isolada: 1º = 5, 2º = 3, 3º = 1; 4º em diante e inválidos = 0.

**Fixture sintética, alvo 5:**

| Jogador | Posição real | Distância | Colocação | Pontos |
|---|---:|---:|---:|---:|
| A | 5 | 0 | 1º | +5 |
| B | 4 | 1 | 2º (empate) | +3 |
| C | 6 | 1 | 2º (empate) | +3 |
| D | fora do recorte | — | inválida | +0 |

Se todos estiverem na posição 5, todos ficam em 1º e recebem +5. A pontuação é calculada uma vez quando o host confirma **Próxima rodada** ou **Finalizar**, inclusive a última rodada.

## Testes e execução

- `npm run test:unit`: fixture sintética com posições 1, 5, limite, fora do recorte, aliases, acentos, empate integral, empate 2º/2º, vazio/desconhecido, ambiguidade e correção.
- `npm run test:rooms`: contas do Firebase Auth Emulator + regras RTDB reais verificam que convidado não lê palpite alheio, não escreve por outro UID e não modifica rodada encerrada. Host consegue revisar apenas após revelação; pontuação e placar persistem sem duplicação. Misto alterna jogos e preserva scores.
- `npm run test:browser-rank`: dois contextos reais do Chrome contra Auth/RTDB Emulator, lobby por convite, palpite privado, evento de envio concorrente à digitação, revelação, correção com justificativa, pódio idêntico, responsividade 390px e jogo misto.
- `node tests/browser-smoke.mjs`: `file://` sem rede e HTTP com prefixo `/triviaarena/`; experimenta frases, ranking e misturado localmente.
- `npm run build`: regenera `riviera-showdown.html` a partir do frontend e dos quatro rankings, sem dependência de Firebase ou CDN.

O Pages e Firebase reais dependem da ação externa já documentada na [Etapa 4](publicacao-piloto.md). Testes com emulador e dois navegadores de máquina virtual **não são testes em dois aparelhos físicos** e não comprovam hospedagem pública.

## Revisão 0.8 — Ranking ativo e espera obrigatória

Frase e Misturado foram pausados na interface. Os módulos continuam versionados e cobertos por regressões internas; isso não os torna modos ativos no produto.

O anfitrião só pode revelar Ranking quando todos os perfis inscritos enviaram um palpite. `submitGuess(code, "", {skip:true})` representa desistência explícita, pontua zero e registra status de envio. Atualizações continuam permitidas até a revelação. A interface mostra quantos enviaram e quais nomes faltam; o SDK recusa a revelação incompleta.

As regras de `roomPublic/$code/round` também validam a barreira para gravações diretas do anfitrião: verificam cada uma das **20 vagas máximas** de `roomSeats`, exigindo `roomGuessStatus` verdadeiro para cada vaga com perfil. A expressão é expandida porque a linguagem de regras de Realtime Database não fornece `numChildren()` nem iteração. Vagas vazias ou reservas ainda sem perfil não bloqueiam a rodada. O status só pode ser escrito pelo próprio UID, com perfil e palpite privado existentes. A barreira também é testada em alterações do campo `revealed` e da sala inteira.

O anfitrião continua sendo uma parte de confiança para a apuração, como documentado anteriormente. Desconectar não envia palpite automaticamente; o jogador pode reconectar e responder ou passar a vez. Não há revelação forçada por timeout.
