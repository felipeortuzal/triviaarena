# Etapa 9 — Continuidade do anfitrião e escala

**Comando:** `execute etapa 9`. Siga o [contrato de execução](../../AGENTS.md) e consulte o [progresso](README.md).

**Objetivo.** Tornar salas mais resistentes à saída do anfitrião e medir quanto a versão publicada suporta. Execute esta etapa futura somente quando Felipe a solicitar.

## Implementação

1. Reproduza a perda do anfitrião durante lobby, rodada aberta e revelação. Defina período de reconexão e critério determinístico de sucessão. Separe queda de conexão, recarga da aba e saída voluntária. Preserve o UID do usuário, os pontos e o histórico.
2. Implemente a transferência de autoridade de forma atômica e visível para o grupo. O anfitrião anterior que retornar deve encontrar um único papel válido. Teste tentativa de autopromoção, duas abas competindo e todos os participantes desconectados.
3. Implemente ou refine a política de expiração e limpeza de salas encerradas sem afetar partidas ativas. Exercite limpeza em dados de teste isolados. Respeite a retenção combinada e a capacidade do plano utilizado.
4. Meça custo e desempenho em ambiente de teste. Use a sala de até 20 jogadores e variação do número de salas, observando leituras, bytes, tempo de propagação e recuperação de reconexões. Documente cenário e teto efetivamente medido. Use os resultados para indicar quando um servidor árbitro, Supabase ou outra solução justificaria a migração.
5. Registre como opções posteriores torneios, temporadas, placar entre sessões e políticas antitrapaça para partidas públicas. Para essas opções, forneça dependências e impactos fundamentados no uso observado e aguarde escolha de escopo antes de construir produtos adicionais.

## Testes e aceite

- Com três identidades independentes, interrompa o anfitrião no meio de uma rodada, faça dois convidados disputarem a sucessão e retorne o usuário antigo. Deve restar uma única autoridade, uma rodada ativa e um único resultado contabilizado.
- Execute cenários de expiração e carga em salas isoladas. Registre onde foram testados e o que ficou fora da medição.
- Entregue o comportamento visível em caso de saída, métricas reproduzíveis, alteração de custo prevista se houver e o limite atual para uso com amigos.
