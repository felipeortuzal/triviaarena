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

## Registro de execução — 09/11/2026

**Estado: Validada nos emuladores e Chrome.** Adicionado `phrases-v3.js`, máquina de estados com transação única por rodada para sorteio, duas dicas, revelação e pontuação idempotente. O registro de cada rodada e o novo desafio (ou finalização) são escritos na mesma transação. `roomRegistry` passa de `open` para `locked` ao iniciar, bloqueando novas entradas; membros existentes podem reconectar com o mesmo UID. O anfitrião é único e seu indicador de presença pode mostrar queda/retorno. O V2 de salas, os rankings e o modo misto continuam recuperáveis para as etapas futuras.

**Interface:** lobby com nick e código, link copiável com seleção manual como alternativa, visualização da pergunta e dificuldade, painel de dicas, resposta, seleção de vencedor (+1), botão de próxima rodada e opção de finalizar diretamente após revelação, resultado com pódio e histórico. O foco de campos é restaurado após a atualização de presença e erro de rede não destrói a rodada. Em `riviera-showdown.html` existem os botões **Jogar neste aparelho** e **Testar lobby e placar**; o segundo simula um convidado e mostra o fluxo visual de entrada, jogo e final sem Firebase. A simulação local é rotulada e não promete conexões reais entre aparelhos.

**Teste reproduzível:** `npm install && npm run test:rooms`, com `firebase-tools`, Node.js 22 e Java 21. [CI #42727601222](https://github.com/felipeortuzal/triviaarena/actions/runs/42727601222) executou **7/7** testes no Firebase Authentication + Realtime Database Emulator, **3/3** regressões Node, testes Chrome (HTTP com base `/triviaarena/`, `file://` sem rede, 375px, fallback de CDN e dados, simulação de lobby e placar) e comprovou a reprodução do HTML único. Dois UIDs distintos completaram três rodadas com 0, 1 e 2 dicas, sem vencedor em uma delas, verificando placares iguais, score único sob clique duplo, finalização idempotente e última rodada contabilizada. Outras verificações: convite inválido, terceiro convidado bloqueado após início, convidado sem poder de iniciar, reconexão de UID, perda/retorno de presença do anfitrião.

**Pendente da Etapa 4:** credenciais de configuração **Web pública** do Firebase do projeto real, instalação de regras seguras na base real, autorização do GitHub Pages para servir a experiência em HTTPS e validação presencial de partida entre dois dispositivos físicos. Nenhum Firebase de produção foi provisionado; HTML de demonstração não usa conta nem backend real.

**Preferência de entrega:** Felipe quer abrir um **site interativo direto**, não uma página do GitHub; entregar a cada atualização um HTML clicável anexado e, quando publicação estiver validada, o endereço HTTPS principal.
