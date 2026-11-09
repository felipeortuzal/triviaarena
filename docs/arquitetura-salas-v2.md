# Salas privadas V2 — arquitetura, regras e testes (Etapa 02)

## Direção de produto e layout

Preservar o Riviera Showdown como uma interface própria de jogo social — **fundo noturno, roxo, menta/lima, superfícies com profundidade, tipografia grande e poucos elementos por decisão**, inspirado no direcionamento de plataformas de games/Jackbox/Kahoot que já consta no projeto. O lobby destaca o código de convite, a lista de jogadores e a presença, com layout em uma coluna no celular. Não transformar o lobby em um dashboard corporativo nem antecipar a partida que só será validada na etapa 3. O site e o HTML autônomo usam a mesma revisão de `index.html` e `app.js`.

## Estrutura do Firebase Realtime Database

A versão antiga em `/rooms` é preservada fisicamente, mas não aceita novas leituras ou escritas pelas regras V2. **Não migrar nem apagar salas reais sem inventário e autorização de Felipe.** O namespace V2 foi separado para não aplicar regras antigas e permissivas às salas novas.

| Caminho | Conteúdo | Exposição |
| --- | --- | --- |
| `roomRegistry/{code}` | `version: 2`, `host` (UID anônimo), `phase: open/closed`, `createdAt` | Leitura somente de usuário autenticado **com o código exato**. Não contém apelidos, rodada, pontuação ou palpites. Necessário para transações. |
| `roomSeats/{code}/{slot}` | 20 posições fixas, numeradas de 0 a 19, com UID anônimo do ocupante | Leitura de quem conhece o código e está autenticado; somente cada UID pode ocupar um slot vazio, que não pode ser sobrescrito. |\n| `roomMembers/{code}/{uid}` | Prova de admissão, `{slot, joined}` | Raiz somente para membros; próprio UID pode consultar e registrar seu slot comprovado. |\n| `roomPublic/{code}` | `host`, `mode`, `phase`, `number`, `profiles/{uid}` com apelido, `scores/{uid}`; futura `round` | Leitura por membros da registry. Escrita estrutural somente pelo anfitrião; membro pode criar/atualizar somente o próprio perfil. |
| `roomPrivateGuesses/{code}/{round}/{uid}` | Palpite individual (texto) | Apenas o próprio jogador pode ler/enviar durante uma rodada não revelada; anfitrião só pode ler **depois** da revelação. O nó pai não é legível. |
| `roomPresence/{code}/{uid}` | `connected`, `updatedAt` | Membros leem. Cada UID altera apenas sua presença; `onDisconnect` a remove. |
| `rooms` | legado V1, se houver | Bloqueado pelas novas regras; nenhuma exclusão automática. |

### Matriz de permissão

| Operação | Sem login | Autenticado sem entrar | Membro | Anfitrião |
| --- | --- | --- | --- | --- |
| Consultar registry de um **código conhecido** | ✕ | ✓ (apenas registro/UIDs anônimos) | ✓ | ✓ |
| Ler lobby, apelidos, modo, placar | ✕ | ✕ | ✓ | ✓ |
| Criar sala, se código ainda não usado | ✕ | ✓ | ✓ em **novo código** | ✓ |
| Reivindicar vaga em sala aberta, até 20 | ✕ | ✓ | ✓ (UID preexistente não duplica) | ✓ |
| Alterar outro perfil, placar ou rodada | ✕ | ✕ | ✕ | ✓ |
| Alterar próprio nick (registro de entrada fixo) | ✕ | ✕ | ✓ | ✓ |
| Ler outro palpite antes da revelação | ✕ | ✕ | ✕ | ✕ |
| Ler palpite próprio ou de terceiro revelado | ✕ | ✕ | Próprio | Anfitrião, após revelação |
| Encerrar admissão de novos jogadores | ✕ | ✕ | ✕ | ✓ |

Os registros de descoberta não podem ser listados na raiz: as regras permitem a leitura apenas quando se conhece o código específico. O código possui seis caracteres sem símbolos ambíguos. As identidades anônimas nos slots ficam visíveis a quem conhece o código, mas nenhum apelido/placar é exposto antes da admissão. Cada slot torna-se imutável depois da reserva e o vínculo UID–slot é validado pelo servidor. Como todo convite por código, devem ser planejados rate limiting, expiração e monitoramento antes de escalar.

## Fluxo de admissão concorrente

1. Usuário entra com Firebase Authentication **Anonymous**. `runTransaction(roomRegistry/{code})` reivindica código livre; colisão **não sobrescreve** nada e gera outro código. Em seguida, anfitrião ocupa um slot.
2. Anfitrião cria `roomPublic/{code}`, com perfil inicial e pontuação inicial.
3. Convidado acessa `?room=CODIGO`, escolhe apelido e executa `runTransaction` no registry. O cliente reivindica via transação um dos **20 slots fixos**, com gravação permitida apenas quando o slot está vazio e o valor é o próprio UID. Depois, registra `roomMembers/{code}/{uid}` apresentando o slot que realmente ocupa. Duas gravações pela vigésima vaga são serializadas pelo banco. A raiz da sala e os demais slots nunca recebem permissão ampla de escrita.
4. Depois de reservar seu slot, o UID cria **seu próprio registro de membro** e grava **seu próprio perfil** no lobby privado. Se houver falha após a reserva, repetir a entrada usa o mesmo slot, sem consumir outra vaga. Login anônimo persistido no mesmo navegador permite voltar ao mesmo UID e ao mesmo placar.
5. Assinaturas de registry/lobby/presença atualizam o grupo. Na desconexão, `onDisconnect` retira apenas o indicador de presença — a vaga continua reservada até o anfitrião fechar ou uma regra futura liberar vagas.

A transação não exige leitura de `roomPublic` antes da admissão; a registry tem **apenas dados mínimos**, sem palpites. A UI bloqueia duplo clique enquanto uma operação está em andamento, e o servidor lida com pedidos simultâneos.

## Emuladores (sem acesso a projeto de produção)

**Requisitos:** Node.js 22+, Java 21+ e internet para instalar pacotes. `.firebaserc` usa exclusivamente `demo-riviera-showdown`.

```bash
npm install
npx firebase emulators:start --only auth,database --project demo-riviera-showdown
```

Em outro terminal:

```bash
python -m http.server 8000
```

Abra **http://localhost:8000/?emulator=1**. Esse parâmetro funciona **somente** em `localhost` ou `127.0.0.1`, não no GitHub Pages. As portas locais são **9099** (Auth) e **9000** (Realtime Database). Para reproduzir os testes automatizados em um terminal, pare os emuladores iniciados manualmente e rode:

```bash
npm run test:rooms
```

Os testes usam clientes reais do Firebase JS SDK, duas contas anônimas independentes, identidade persistente dentro do mesmo cliente, tentativa de acesso sem login, alterações proibidas, isolamento de palpites, colisão de convite e disputa concorrente pela última vaga. O teste Chrome em CI cobre a visualização local do frontend, não uma partida entre aparelhos físicos.

## Produção — ação externa necessária

1. Criar/habilitar o projeto no Firebase Console e autenticação anônima.
2. Criar Realtime Database, publicar **antes da abertura do app** as regras versionadas em `database.rules.json`.
3. Em configurações do projeto > apps da Web, copiar **somente** os campos públicos de configuração Web para `firebase-config.js`, incluindo `databaseURL` do Realtime Database. A chave Web Firebase é identificador público e **não** concede privilégio administrativo; credenciais de service account, tokens e chaves privadas nunca entram no Git.
4. Testar o projeto real em modo restrito. Não usar `?emulator=1` em ambiente remoto. Publicação, rodada e dois celulares físicos são responsabilidades das etapas 3–4.

**Limite atual:** os convites podem preparar lobby e presença, mas botões de iniciar rodada online estão desabilitados até a etapa 3 (Frases) e 5 (Rankings/Misto). O modo local offline permanece jogável sem Firebase.

**Limite conhecido:** duas abas simultâneas com o **mesmo UID** podem disputar slots diferentes antes de a primeira confirmar o vínculo em `roomMembers`; como os slots são imutáveis, pode haver vaga ocupada sem perfil. A interface bloqueia o clique duplo e novas entradas reutilizam o primeiro slot encontrado, mas o tratamento transacional entre abas distintas ainda exige um mecanismo de reserva por UID para garantir uma vaga por identidade sob concorrência adversarial. Essa condição deve ser testada antes de liberar salas de produção. Nenhum UID consegue reservar um 21º slot, mesmo com esse limite.
