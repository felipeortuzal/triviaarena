# Riviera Showdown — multiplayer em Cloudflare Workers

Esta é a implantação alternativa, independente do Firebase, sem alterar o jogo existente. O backend `cloudflare/worker.mjs` usa **Durable Objects SQLite** para armazenar e arbitrar salas em um único servidor por código. O frontend está em `cloudflare/public`. **Sem chaves nem serviços Firebase.**

## Fluxo real
1. Um jogador cria sala online e recebe convite por URL com código de 6 caracteres. A identidade do jogador é um token aleatório guardado apenas em seu navegador.
2. Amigos entram com o mesmo código, cada um com seu próprio token. O host inicia somente quando há pelo menos dois jogadores.
3. Todos têm 30 segundos cronometrados no servidor e palpitam simultaneamente. Um item da lista não pode ser usado por duas pessoas: a reserva é validada pelo Durable Object.
4. Palpites de outras pessoas não são enviados ao cliente durante a rodada. Após o encerramento, o backend calcula distância e pontuação; resultado e placar são transmitidos à sala via WebSocket, com polling de recuperação.
5. Modo **Por rodadas**: 1º +2, 2º +1. Modo **Corrida até X**: 1º +1; encerra ao atingir a meta (limite de 30 rodadas). Empate na distância é resolvido pelo horário de chegada no servidor.
6. A sessão é preservada em localStorage e a URL de convite não contém token de sessão. O modo original de um aparelho está disponível no caminho `/offline.html` depois da preparação dos assets.

## Ativar publicação com sua conta Cloudflare
- Na conta Cloudflare, habilite **Workers & Pages → Workers**. Conta gratuita compatível com Durable Objects SQLite conforme disponibilidade de quota e limites vigentes.
- No GitHub do repositório, abra **Settings → Secrets and variables → Actions**. Crie **CLOUDFLARE_API_TOKEN** com permissão de editar Workers/scripts e Durable Objects; e **CLOUDFLARE_ACCOUNT_ID** com o ID da conta. **Não coloque o token no chat nem no código.**
- Execute o workflow **Riviera Showdown · Cloudflare Workers multiplayer** em **Actions → Run workflow**. O workflow testa código e publica se os secrets estiverem presentes. Atualizações subsequentes na pasta cloudflare/publicam automaticamente.
- Verifique a URL `*.workers.dev` fornecida no log do deploy. Teste com **dois aparelhos diferentes** antes de anunciar multiplayer validado.

## Domínio
Para não afetar o site existente no domínio principal, usar `riviera.thegoatgame.com.br`. No Cloudflare, em **Workers & Pages → riviera-showdown → Settings → Domains & Routes → Add → Custom Domain**, escolha esse subdomínio. Uma zona DNS de mesmo domínio precisa estar sob a conta apropriada do Cloudflare. O DNS não é alterado automaticamente por este commit.

## Validação
```bash
node --check cloudflare/worker.mjs
node --check cloudflare/public/game.js
node --test cloudflare/game.test.mjs
node cloudflare/prepare.mjs
npx wrangler@4 dev --config wrangler.jsonc
```
Abra `http://localhost:8787`. Teste em dois perfis de navegador ou dispositivos distintos. O **CI de código não substitui teste real em dois aparelhos**. O app é para jogos entre amigos, não é sistema com cadastro verificável, moderação, login ou antifraude; quem conhecer dados de ranking externamente pode pesquisá-los.

## Limites atuais
- Sem moderação de salas, histórico durável de usuários, kick de jogadores, ou troca automática de anfitrião.
- Salas públicas por código: qualquer pessoa com código pode tentar entrar enquanto lobby estiver aberto.
- Os rankings são as quatro bases existentes de `data.json`, com fontes e retratos históricos informados no frontend. Dados de 2026 não devem ser tratados como cotações em tempo real.
- O domínio só estará operante após a vinculação na conta Cloudflare.
