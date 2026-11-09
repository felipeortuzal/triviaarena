# Etapa 7 — Distribuição dos sorteios e esgotamento

**Comando:** `execute etapa 7`. Siga o [contrato de execução](../../AGENTS.md) e consulte o [progresso](README.md).

**Objetivo.** Evitar repetição de fatos, concentração em listas semelhantes e excesso de alvos nas primeiras posições. Aplique a mesma política a partidas hospedadas e à prévia.

## Implementação

1. Meça a distribuição do algoritmo vigente. O código auditado escolhia o limite antes da posição. Com os quatro recortes originais, a chance inicial de 1º–25º era cerca de 52,1%. Reproduza o cenário com o catálogo da auditoria como fixture. Declare o que se pretende equilibrar por sessão e como tratar catálogos quase esgotados.
2. Sorteie por tema com rotação embaralhada e por lista elegível dentro do tema. Use identificadores de fato para frases e identificadores de posição/item por versão da lista para rankings. Evite repetir o mesmo alvo ao mudar apenas o tamanho do Top. Mantenha variedade de dificuldade sem tornar a sequência previsível. Se necessário, para uma lista escolhida, sorteie entre posições inéditas e depois escolha um recorte válido que contenha o alvo.
3. Defina o fim de cada conjunto. Se a sessão esgotar desafios, ofereça encerrar ou iniciar um novo ciclo explícito. Ao iniciar novo ciclo, evite a repetição imediata da última rodada quando existir alternativa. Preserve o histórico ao atualizar a página, reconectar e retomar uma partida mista.
4. Tome a decisão de sorteio uma vez por rodada. Os clientes exibem a mesma seleção persistida. Um clique duplo ou duas abas do anfitrião não podem consumir dois itens nem substituir o resultado da rodada. Injete uma fonte de aleatoriedade controlável só para os testes.
5. Defina métricas adequadas, como cobertura de temas por ciclo e distribuição de posições dentro de uma lista. Documente os pesos e o efeito do algoritmo sobre a frequência dos recortes. Não prometa uniformidade simultânea de recortes e posições se as populações diferirem.

## Testes e aceite

- Com sementes reproduzíveis, simule partidas curtas e ciclos completos de frases, ranking e misto, incluindo catálogos vazios, com um item e com várias listas no mesmo tema.
- Verifique propriedades exatas: posição entre 1 e o limite, limite até o tamanho verificável, item único antes do esgotamento, mesmo estado após reconexão, consistência entre clientes e reinício explícito.
- Registre uma comparação antes/depois por tema e faixas de posição usando o mesmo catálogo, sementes, número de partidas e política de amostragem. Use tolerâncias justificadas, evitando testes que falham ocasionalmente por acaso. Identifique qualquer concentração intencional.
