# Etapa 6 — Curadoria de frases e rankings

**Comando:** `execute etapa 6`. Siga o [contrato de execução](../../AGENTS.md) e consulte o [progresso](README.md).

**Objetivo.** Entregar mais variedade com dados que possam ser conferidos. Trabalhe no catálogo, importador e exibição de procedência. Preserve a compatibilidade com salas abertas e com a versão local.

## Implementação

1. Inventarie os 104 registros originais e o catálogo vigente. Corrija siglas incompatíveis com a resposta, fatos ambíguos e duplicatas exatas ou semânticas. Revise explicitamente “4 C no D H” e “5 O nos J O”. Identifique o mesmo fato com um ID estável. Guarde categoria, dificuldade, resposta, explicação, duas dicas progressivas distintas e referência adequada quando o fato depender de convenção ou data.
2. Em rankings, defina IDs estáveis da lista e dos itens, categoria temática, título, método, fonte com URL verificável, edição/data de referência, política de empates, nomes alternativos e itens ordenados. Preserve a diferença entre data da observação e edição da fonte. Mantenha gabarito e apresentação vinculados à versão que a sala iniciou.
3. Procure bases reais para futebol, outros esportes, cinema, música, geografia, história, ciência, economia, negócios, tecnologia e cultura geral. Use fontes primárias ou instantâneos identificáveis que permitam a reutilização prevista. Para rankings derivados, documente fórmula, população coberta e desempate. Não atribua posições exatas quando a fonte só fornece faixas. Mantenha uma lista como candidata se faltar fonte, licença adequada, cobertura ou verificação. Não complete lacunas com dados gerados.
4. Libere Top 10, 25, 50, 100, 250, 500 ou 1.000 conforme o número real de itens ordenados e verificados. Mantenha recortes já usados por salas existentes quando válidos. No importador, valide metadados, quantidade, duplicatas e aliases ambíguos. Retire apenas marcadores inequívocos de numeração, preservando nomes que começam com números. Diferencie catálogo oficial e listas fornecidas por um anfitrião.
5. Forneça validador reproduzível para esquema, tamanhos, IDs, aliases e datas. Para cada lista publicada confronte a ordenação do recorte com a fonte ou snapshot e registre o método de verificação. Quando a fonte for dinâmica, vincule o conjunto à edição usada.

## Testes e aceite

- Gere um inventário por tema e dificuldade com quantidades efetivas, tamanhos permitidos, fontes e limitações. Teste exemplos antes rejeitados por tradução e exemplos que continuam ambíguos.
- Importe uma lista válida e rejeite fonte ausente, duplicatas conflitantes, metadados inválidos e ordem incompleta. Confira que um título com algarismo inicial sobrevive à importação.
- Teste uma sala iniciada com o catálogo anterior e confira que ela exibe o mesmo gabarito. Publique somente o que conseguiu verificar e descreva temas restantes concretamente.

## Execução V6 — 10/11/2026

**Estado: Parcial editorial, mecânicas validadas em desenvolvimento.** O catálogo V6 tem 110 registros de frases, preserva todos os índices antigos, coloca 9 duplicatas/erros em `enabled:false` e deixa 101 disponíveis. Corrigidos explicitamente `4 C no D H` e `5 O nos J O` por desativação com redirecionamento ao fato canônico; dicas são progressivas, há IDs estáveis e referências em fatos institucionais. Matriz completa por tema e nível em [auditoria do catálogo](../catalog-audit-v6.md).

**Ranking:** seis listas no catálogo, quatro históricas de 100 itens, mais IFPI Global Artist 2025 Top10 (10/10 posições conferidas) e WIPO GII 2026 Top20 (20/20 confrontadas com fonte primária). `edition` versus `observedAt`, `revision`, `itemIds` e `verifiedPrefix` são campos explícitos. Listas históricas ainda não têm verificação integral da ordenação 100/100 e exibem alerta editorial, sem atribuir certificado indevido. Confronto completo destas quatro listas é a pendência para marcar esta etapa Validada editorialmente. Não gerar Top250/500/1000 de listas com apenas 100 itens.

**Importação:** host pode adicionar até três rankings com 10–1000 itens válidos e fonte HTTPS, critério, data, aliases e IDs estáveis. Lista importada é marcada `origin:host`, não se passa por oficial. Importador não remove números integrantes de nomes como `12 Angry Men`. O mesmo snapshot com fonte/gabarito é gravado na rodada e no histórico. A própria frase também grava um `puzzleSnapshot` para permitir continuidade de partidas abertas com o catálogo anterior.

**Nova regra de partidas, pedida explicitamente pelo Felipe:** 3, 5 ou 7 rodadas (5 padrão); cada rodada de Ranking dá 5/3/1 pontos por colocação e empate com placar acumulado; frase enviada privadamente exata +2 / equivalente próxima +1 / incorreta 0; o anfitrião pode revisar de forma visível antes do avanço. No modo oral é preservado acerto host-only +1 para compatibilidade. A quinta/última rodada soma pontos e fecha o jogo automaticamente. A interface local apresenta progresso e final de partida; o mesmo fluxo roda no Firebase Emulator.

**Validação:** `npm run validate:catalog` verifica esquema, IDs, aliases, fontes, duplicatas e versão. Unitários de catálogo, pontuação e correções; testes Firebase com duas identidades e cinco rodadas completas; Chrome real testa três modalidades em `file://` offline e dois contextos isolados no Emulator. Todos rodam em CI. A liberação online de produção e teste em dois celulares físicos continua pendente da Etapa 4; registrar resultados separadamente.
