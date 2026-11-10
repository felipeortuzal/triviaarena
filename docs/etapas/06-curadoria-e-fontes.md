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

## Execução da Etapa 06 — 10/11/2026

**Curadoria:** 104 entradas inventariadas, 96 elegíveis e 8 duplicatas semânticas desativadas sem eliminar índices históricos. Os casos `4 C no D H` e `5 O nos J O` foram corrigidos e desativados por duplicidade, com justificativas e fontes. Noventa e cinco duplas de dicas genéricas foram substituídas por pistas específicas progressivas. A convenção dos 5 oceanos fica vinculada à NOAA; os 5 anéis olímpicos ao COI. Os quatro rankings herdados têm IDs de itens, edições, critério, data observada e links de referência. Ver [Inventário](../inventario-curadoria-v6.md) para quantidades reais, fontes e limitações.

**Novo requisito do usuário incorporado:** partidas com **3, 5 (padrão), 10 rodadas**, selecionáveis no site e no lobby. Ao fechar e pontuar a última, o jogo exibe o pódio automaticamente. Em Frases, acerto exato pode valer 1, aproximação semanticamente aceita pelo anfitrião pode valer 0,5 e erro 0. Não há aprovação automática insegura baseada apenas em semelhança textual. Ranking conserva 5/3/1 por colocação, total acumulado. Motor transacional e interface local atualizados, preservando partidas legadas sem `roundLimit`.

**Importação e integridade:** `catalog-v6.js` exige título, fonte, URL HTTPS, edição, metodologia, data, 10–1000 itens ordenados, detecta duplicatas e aliases conflitantes. Prefixos `1. Nome` são retirados sem apagar `12 Angry Men`. No site, a lista importada é marcada `candidate-unverified` e fica **só na simulação local**, não publicada como catálogo oficial. `round.content` e `round.catalog` congelam conteúdo quando sorteado; versões anteriores ainda podem usar os índices originais.

**Limitação editorial explícita:** URLs e as primeiras posições dos quatro rankings foram confrontadas, mas não há comprovante de verificação individual das 400 posições, nem de permissão para redistribuição de novas bases. Categorias FIFA (futebol), ATP (tênis) e Spotify (música) foram apenas pesquisadas como candidatas, não tiveram posições geradas. A conclusão da auditoria editorial continua **Parcial**. O site real HTTPS e o teste em dois aparelhos permanecem pendentes da Etapa 04.

**Validações locais e CI:** `npm test`, `npm run test:rooms`, `node tests/browser-smoke.mjs`, `npm run test:browser-rank`. Acrescentadas verificações de 3 rodadas com pódio automático, score decimal 0,5, tentativa de alterar `roundLimit` rejeitada, snapshots que não se alteram após mudança do catálogo, e importador em Chrome `file://`. Se alguma CI falhar, manter o estado Parcial e corrigir antes da integração.
