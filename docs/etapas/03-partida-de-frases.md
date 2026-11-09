# Etapa 3 — Decifre a Frase de ponta a ponta

**Comando:** `execute etapa 3`. Siga o [contrato de execução](../../AGENTS.md) e consulte o [progresso](README.md).

**Objetivo.** Completar uma partida de Decifre a Frase com um anfitrião e pelo menos um convidado usando a sala da etapa 2. Use a lógica funcional de sorteio e mantenha respostas verbais.

## Implementação

1. Implemente o fluxo inicial → escolher modo → criar sala → copiar convite/código → entrar com nick → lobby compartilhado. Ao abrir um convite, priorize a entrada naquela sala e preserve o código até a autenticação terminar. Ofereça cópia manual se o navegador recusar a área de transferência.
2. Modele lobby, rodada aberta, revelação e partida encerrada. Só o anfitrião inicia e avança. A cada rodada, sorteie uma frase elegível com ID estável, categoria, dificuldade e duas dicas em ordem. Ofereça um conjunto inicial revisado e compatível com o banco existente. Mantenha o histórico por sala.
3. O anfitrião libera cada dica, revela a resposta e pode marcar quem acertou ou pular a atribuição. Finalize a rodada e grave o ponto uma única vez por ID, inclusive ao encerrar a partida logo após a revelação. Diferencie placar da rodada e placar final.
4. Trate saída voluntária, queda temporária, reentrada com o mesmo UID e encerramento pelo anfitrião. Mostre claramente quando o anfitrião está desconectado. Mantenha uma regra explícita para novos jogadores durante uma partida. A transferência automática de anfitrião tem prompt próprio.
5. Renderize nicks e mensagens como texto. Atualizações de presença e de placar devem preservar o foco, o estado dos controles e ações em andamento. Um erro recuperável mantém a rodada visível.

## Testes e aceite

- Usar duas sessões isoladas com UIDs distintos contra o emulador. Jogar pelo convite três rodadas com zero, uma e duas dicas, acerto atribuído e rodada sem vencedor. Comparar nicks, rodada, revelação e placar nos dois clientes.
- Recarregar o convidado na segunda rodada e o anfitrião após a revelação. Disparar duas vezes “pontuar/avançar” e “encerrar”. Verificar um único registro e que a última rodada entrou no resultado.
- Exercitar link inválido, sala cheia/encerrada, convidado tentando iniciar e queda do anfitrião. Documentar estado final e disponibilizar a prévia local.
- Registrar onde rodou o teste e quais dispositivos foram usados. A publicação e a homologação entre aparelhos físicos são o objetivo da etapa 4.
