# Riviera Showdown — plataforma de jogos com amigos

**Roadmap de desenvolvimento do Riviera Showdown:** [prompts numerados, comandos e progresso](docs/etapas/README.md).

**Agora o foco é somente Estimativa de Ranking. Frase e Misturado estão pausados por decisão de Felipe.** O código e os dados desses modos foram preservados para retomada futura.

Em cada rodada, todos tentam adivinhar qual item ocupa uma posição sorteada em uma lista. Os palpites ficam escondidos. **A resposta, as posições e as distâncias só podem ser reveladas depois que todos enviarem um palpite ou escolherem passar a vez.** A menor distância vence; a pontuação é 5/3/1, com empates. A partida tem cinco rodadas, pódio e revanche.

**Publicação:** o site público ainda retorna HTTP 404. Habilitar Pages e consultar variáveis de Actions pela API retorna HTTP 403 para o token disponível. Firebase CLI segue sem autenticação de produção; nenhum projeto ou credencial foi inventado. As [ações externas exatas](docs/publicacao-piloto.md) continuam necessárias para conectar aparelhos diferentes. Nenhum faturamento foi habilitado.

## Jogar agora — Ranking no mesmo aparelho

Baixe o [HTML atualizado de Ranking](https://github.com/felipeortuzal/triviaarena/releases/download/v0.8.0/riviera-showdown.html) antes da viagem e abra no navegador. Não precisa de conta, servidor ou Firebase para jogar juntos no mesmo aparelho.

1. Informe os nomes de **2 a 8 pessoas** e toque em **Começar com a turma**.
2. O jogo sorteia categoria, recorte e posição-alvo. Cada pessoa registra o palpite em segredo e passa o aparelho. **Não sei · passar vez** registra uma desistência explícita que vale zero.
3. Depois que todos responderem, revelem juntos e comparem quem chegou mais perto.
4. Após cinco rodadas, vejam o pódio. **Jogar revanche** mantém a turma e zera os pontos.

**Pausar e sair** salva o progresso no navegador. Use **Retomar partida** ao reabrir o mesmo arquivo. Rascunhos não enviados são descartados; envios confirmados e pontos são preservados. Se o navegador bloquear armazenamento, o jogo avisa para manter a página aberta. Partidas antigas de Frase/Misturado permanecem guardadas, mas não são retomadas nesta versão.

**Experimentar sozinho** oferece Ranking com um adversário explicitamente simulado. As salas online aparecem em uma seção separada. Quando Firebase estiver configurado, todos poderão enviar seus palpites simultaneamente nos próprios aparelhos. A revelação espera todos; uma desconexão não conta como resposta.

Para reconstruir e testar a prévia local, com Node.js 22 ou superior:

```bash
npm run build
npm test
```

O gerador `scripts/build-standalone.mjs` combina `index.html`, `app.js`, seus módulos locais compartilhados, `data.json` e `logo.svg`, sem manter outra implementação do jogo. O teste de navegador `node tests/browser-smoke.mjs` exige `playwright-core` e Chrome/Chromium instalados; ele é executado no GitHub Actions. Não confunda uma demonstração local com sala multiplayer validada.

## Arquivos

- `index.html` — interface responsiva com carregamento progressivo
- `app.js` — regras, sorteios e multiplayer
- `data.json` — 104 frases e 4 rankings-base de 100 itens
- `logo.svg` — marca oficial Riviera Showdown; `logo.png` permanece como arte legada
- `riviera-showdown.html` — arquivo único offline (gerado, não edite manualmente)
- `firebase-config.js` — **preencher com a configuração do seu projeto**
- `rooms-v2.js` — admissão via slots transacionais, perfis e reconexão com mesmo UID
- `party-game-v5.js` — apuração atômica de Ranking; implementações anteriores preservadas
- `rank-tools-v5.js` — resolução de aliases, fontes elegíveis, distâncias e pontos 5/3/1
- `docs/arquitetura-ranking-v5.md` — regras do jogo, privacidade, testes e limites de confiança
- `database.rules.json` — regras de acesso por papéis e isolamento de palpites V2
- `firebase.json` e `.firebaserc` — emuladores de Auth e Realtime Database com projeto `demo-riviera-showdown`
- `scripts/prepare-pages.mjs` — pacote público do Pages; lê somente configuração Web Firebase opcional
- `.github/workflows/deploy-pages.yml` — testes, publicação automatizada e URL HTTPS após configuração de Pages
- `docs/publicacao-piloto.md` — guia de ativação e teste físico
- `docs/arquitetura-salas-v2.md` — matriz de permissões, formato de dados e configuração segura

## Testar lobby com os emuladores (sem credenciais de produção)

```bash
npm install
npm run test:rooms
```

Para testar Ranking em dois Chromes isolados: `npm run test:browser-rank`. Para testar manualmente: inicie `npx firebase emulators:start --only auth,database --project demo-riviera-showdown`, sirva o site com `python -m http.server 8000` e abra `http://localhost:8000/?emulator=1`. A configuração de emulador só é ativada quando você opta pelo parâmetro em `localhost`/`127.0.0.1`. Isso **não liga Firebase de produção**. Ver [arquitetura de salas](docs/arquitetura-salas-v2.md).

## Publicação HTTPS — Etapa 04 (pendente de habilitação externa)

**Para jogar/testar imediatamente**, abra `riviera-showdown.html` no navegador. Ele é uma experiência interativa local; o botão **Testar lobby e placar** simula a partida com um amigo para conferir layout e mecânicas. Não gera sala real sem Firebase.

O deploy oficial já está automatizado por `.github/workflows/deploy-pages.yml`. Ele testa antes de publicar: Node, Chrome, Firebase Emulator e duas sessões reais de Chrome independentes (emulados). O script `scripts/prepare-pages.mjs` gera `dist/` com os arquivos estritamente públicos, base relativa sob `/triviaarena/`, carimbo `release.json` e configuração Web opcional. O único mecanismo previsto é **GitHub Actions → Pages**. A validação atual de navegador é focada em Ranking; os testes de SDK dos módulos pausados foram preservados como regressão interna.

**Para ativar o endereço HTTPS**, com acesso à conta que administra o repositório, é necessário habilitar **Settings → Pages → Build and deployment → Source → GitHub Actions**. A tentativa de habilitar Pages pela API oficial em 10/11/2026 foi recusada com HTTP 403 pelo escopo do token disponível. O endereço esperado, **não garantido até o deploy**, é `https://felipeortuzal.github.io/triviaarena/`. A fonte do site está em `main`, não em uma branch concorrente de publicação.

**Para ativar multiplayer público**, é necessário configurar Firebase Web (Authentication anônimo e Realtime Database com `database.rules.json` publicado). Inserir o JSON **público** da configuração Web na variável de repositório `RIVIERA_FIREBASE_WEB_CONFIG`; a pipeline o copia para `dist/firebase-config.js` e não exige colocar credenciais de administrador no código. Sem variável, o site, se publicado, permanece com demo local e aviso de online indisponível.

As **etapas exatas, telas, verificações de segurança e roteiro para dois aparelhos físicos** estão em [Publicação piloto](docs/publicacao-piloto.md). Dois navegadores independentes no emulador não são substitutos de dois aparelhos físicos conectados ao serviço real.

## Catálogo e próximos jogos

- **Frases (pausado):** 104 desafios preservados. Na futura retomada, a preferência é disputa simultânea com +1 para quem acertar primeiro; essa mudança não foi implementada enquanto o modo está pausado.
- **Rankings:** sorteio de categoria, alvo e Top 25/50/75/100 (só recortes cobertos pela fonte). Palpites privados por UID até a revelação, indicador público de envios, nomes PT/EN reconhecidos, distância absoluta e 5/3/1 com empates. Correções do host exigem motivo visível.
- **Frase e Misturado:** código preservado, modos pausados e indisponíveis na interface atual.
- **Anti-repetição:** frases e combinações categoria/Top/alvo não se repetem até esgotar as opções. A política de distribuição entre categorias será refinada na Etapa 7.

## Limitações e melhorias possíveis

- As quatro listas base têm 100 itens. Para Top 250, 500 ou 1.000, é necessário adicionar bases reais e verificadas. **O aplicativo não inventa posições.**
- A importação de ranking pelo anfitrião permanece adiada até a Etapa 6 (curadoria): por enquanto usam-se as quatro listas verificáveis existentes no `data.json` com 100 itens cada e metadados `id,title,source,url,snapshot,about,items`.
- O reconhecimento ignora maiúsculas/acentos, usa aliases por lista, identifica ambiguidade/fora de recorte e aceita correção manual justificada pelo anfitrião após revelação. A lista inteira pode ser inspecionada no navegador: não há proteção contra quem consulta o catálogo para trapacear.
- Não há reconexão com outro ID após apagar dados do navegador, nem troca automática de anfitrião.
- Não há limite de uso/custo garantido para Firebase; consulte os limites e preços do seu projeto.

## Partida e revanche

O anfitrião revela as respostas e confirma cada rodada. A quinta confirmação abre o pódio; também é possível encerrar antes. A revanche mantém os participantes e a lista de desafios usados, zera o placar e cria novos IDs de rodada para não reutilizar palpites anteriores. O convite permanece fechado para novos participantes depois do primeiro início.

`npm run test:browser-five` testa Ranking em duas sessões independentes (desktop e mobile), cinco rodadas, respostas privadas, reconexão dos dois jogadores, clique duplo, pódio, revanche e o HTML `file://` offline. `node tests/public-site.mjs` faz a verificação somente de leitura do site realmente publicado; um resultado verde não declara o multiplayer de produção homologado.

## Testes rápidos

Servir os arquivos via HTTP (não `file://`): `python -m http.server 8000`. Testar em `http://localhost:8000` após configurar Firebase. Para testar multiplayer, abrir dois navegadores/perfis distintos e usar o convite. Verificar criação, entrada, palpites, revelação, pontuação e próxima rodada.
