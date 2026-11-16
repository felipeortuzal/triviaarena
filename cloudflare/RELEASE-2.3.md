# Riviera Showdown 2.3 — Riviera Club Redesign

## Direção criativa
A estética neon/glassmorphism do site foi substituída por identidade editorial mediterrânea de clube de praia: marinho (#17343b), areia (#f2eee4), papel (#fffdf7), verde-mar (#185b60), coral (#c75c40), amarelo-solar (#e6d56e). Fotografia de praia integrada no hero em layout assimétrico, texto em escala grande, organização tipográfica e tabelas com linguagem visual esportiva. Inspirações de UX (não cópia visual): Jackbox Games (room codes e fluxo simples), Gartic Phone (modos identificáveis) e Codenames (material tátil, contraste).
Reestilização: homepage, cards de modos, código e configuração de lobby, cabeçalhos da rodada, timer, placar, revelação, pódio, modal, criação de sala, formulários, navegação e mobile. Redução de glow, gradientes holográficos, vidro fosco e bordas arredondadas genéricas.

## Riviera Social Club — histórico persistente
- Clubes privados criados por código de 6 caracteres e nome, ingresso livre mediante código. Cada participante escolhe apelido exclusivo, recebe um token aleatório privado que é preservado no navegador local.
- Cada clube vive em um Durable Object SQLite independente, usando a classe e binding ARENA já existente com prefixo de id de clube. Não é necessária migração nem novo serviço, e jogos existentes continuam funcionando.
- Se o anfitrião for membro de clube, a nova sala fica vinculada automaticamente mediante validação do seu token. Outros jogadores devem estar no mesmo clube no navegador para vincular suas próprias estatísticas ao entrarem na sala.
- Partidas concluídas são registradas pelo servidor, não por placares enviados pelo navegador. Idempotência por matchId aleatório impede duplas contagens; revanches têm matchId próprio.
- Estatísticas persistentes da turma: partidas, vitórias, pontos totais e exatas, classificação com destaque, últimos 12 resultados; armazenamos até 100 registros por clube.
- Token de membro nunca aparece na API pública de ranking. Ler o placar requer token de membro.
- Sem email, senha ou OAuth. Perfil opcional e pseudônimo vinculado ao navegador; sem procedimento de recuperação caso a sessão local seja perdida. Os dados do clube ficam no servidor mas não vinculados à identidade real do usuário.
- Clube com até 40 membros; sala com até 12 participantes. O ranking só computa quem já está vinculado ao clube; convidados sem vínculo podem jogar normalmente.
- Uso da classe ArenaRoom e do binding atual, para manter Workers e Durable Objects já publicados.

## Testes
- Testes anteriores de Ranking e Frases e regressão de pontuação.
- Integração adicional verifica create, join, autenticação, vínculo em sala, estatísticas cruzadas, dedupe de reconexão/releituras e revanche.
- E2E Chrome verifica nova homepage, carregar logotipo, temas, lobby, dois modos, membros e criação de partida vinculada.
- Visual: validar em desktop e mobile no domínio público.
