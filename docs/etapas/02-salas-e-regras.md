# Etapa 2 — Modelo de sala e regras do Firebase

**Comando:** `execute etapa 2`. Siga o [contrato de execução](../../AGENTS.md) e consulte o [progresso](README.md).

**Objetivo.** Preparar e testar a infraestrutura de salas privadas para o lobby, a partida e os palpites futuros. Preserve o modo local da etapa 1.

## Implementação

1. Leia a criação, entrada, assinatura e regras atuais. Desenhe a estrutura mínima para código de convite, membros, anfitrião, fase, rodada com ID, resultado e presença. Especifique quais campos um visitante, membro ou anfitrião podem ler e alterar. Planeje a entrada com código sem exigir leitura integral da sala antes da admissão.
2. Use Firebase Authentication anônimo e Realtime Database. Prepare configuração reproduzível do Emulator Suite com identificador de projeto de demonstração separado de produção. Conecte o cliente ao emulador apenas quando o ambiente de desenvolvimento for explicitamente selecionado. Especifique como fornecer a configuração web de produção.
3. Modele a criação e a admissão para lidar com colisão de código, clique duplo, reconexão do mesmo UID e concorrência pela vigésima vaga. Vincule o membro ao UID autenticado, valide valor/tamanho dos campos e impeça mudança de anfitrião, rodada e pontos por convidados. Negue por padrão. Verifique permissões herdadas no caminho pai. Separe palpites particulares do estado compartilhado.
4. Faça a UI e as operações de leitura/escrita concordarem com as novas regras. Mostre erros recuperáveis de sala inexistente, cheia ou encerrada sem expor dados alheios. Preserve o caminho legado se houver salas reais em uso. Documente a migração compatível ou o isolamento por versão.
5. Crie testes de autorização e de concorrência contra o emulador real. Use a SDK do cliente nos testes de permissão. Reserve o acesso administrativo para preparar ou limpar dados isolados de teste.

## Testes e aceite

- Duas identidades independentes criam e entram na mesma sala. Repetir o mesmo pedido mantém uma inscrição por UID.
- Um usuário sem autenticação e um autenticado sem associação não leem o estado privado. Um membro não promove a si próprio, não altera outro nick ou placar e não escreve dados com tipo inválido.
- A última vaga disputada por dois usuários admite só um. Um participante que recarrega recupera sua identidade e seus pontos. Colisão de código preserva a sala anterior.
- Forneça comando para iniciar os emuladores e reproduzir os casos, matriz de permissões e resultado observado. Se o emulador não rodar no ambiente, registre os testes escritos e a execução pendente.

## Registro de execução — 09/11/2026

**Estado: Validada (Emulator Suite real).** Implementado namespace separado para o lobby V2: `roomRegistry` (metadados), `roomClaims` (reserva por UID), `roomSeats` (20 slots imutáveis), `roomMembers` (prova da admissão), `roomPublic` (lobby, perfis, placares), `roomPresence` (presença) e `roomPrivateGuesses` (privacidade). O namespace `rooms` do V1 permanece fisicamente preservado e negado pelas regras novas. Nenhum dado real foi excluído.

**CI de aceite:** [GitHub Actions 42722841443](https://github.com/felipeortuzal/triviaarena/actions/runs/42722841443) — 4/4 testes com o Firebase Authentication Emulator e o Realtime Database Emulator via SDK cliente, 3/3 testes Node de inicialização, Chrome headless com HTTP em `/triviaarena/` e `file://` sem internet, viewport 375px e fallback de CDN/dados. A reconstrução do HTML autocontido foi idêntica ao arquivo versionado. Ambiente: Ubuntu GitHub Actions, Node.js 22, Java 21, firebase-tools 14.18 e Firebase JS SDK 11.6.

**Resultados funcionais:** duas identidades anônimas independentes criam/entram; mesmo UID reentra sem outra vaga; convidado não lê sala antes de entrar; usuário sem autenticação não lê registry; convidado não promove anfitrião, não altera outro nick, placar, rodada nem palpite alheio; valores inválidos são rejeitados; dono da rodada só acessa palpites alheios após a revelação. Colisão de código não sobrescreve sala anterior. Na última vaga disputada, entra somente um dos concorrentes. Operações simultâneas do mesmo UID ocupam apenas um slot. Uma nova leitura após reentrada recupera a pontuação gravada.

**Interface:** lobby com código grande e botão de convite, indicador de jogadores e presença, modo de jogo selecionado, saída da tela e encerramento controlado pelo anfitrião. Mantida a identidade visual escura e premium com acentos roxo e lima, cards responsivos e foco visível para teclado. A prévia offline de Decifre a Frase permanece jogável. A etapa 2 não publica rodadas online: a ação `Iniciar partida` está conscientemente desabilitada até a etapa 3.

**Pendente fora do escopo:** configurar Web App Firebase real e publicar regras somente após revisão em produção; ativar GitHub Pages e testar sala HTTPS em dois aparelhos físicos nas etapas 3–4. Não foi usado serviço pago nem credencial administrativa. Comando local: `npm run test:rooms`. [Documento completo](../arquitetura-salas-v2.md).

**Próximo ponto de retomada:** etapa 3 — partida de Frases, autoridade do anfitrião, tempo de rodada, dica, placar final e reconexão em diferentes clientes. 
