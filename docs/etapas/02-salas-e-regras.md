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
