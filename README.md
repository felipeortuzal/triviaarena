# Riviera Showdown — plataforma de jogos com amigos

**Roadmap de desenvolvimento do Riviera Showdown:** [prompts numerados, comandos e progresso](docs/etapas/README.md).

Riviera Showdown reúne **Decifre a Frase, Estimativa de Ranking e Misturado**, com partidas de **3, 5 (padrão) ou 10 rodadas**, respostas privadas, pontuação automática, pódio e revanche na mesma sala. O HTML local usa as mesmas funções de sorteio e pontuação da versão online.

**Estado em 10/11/2026:** [CI completa aprovada](https://github.com/felipeortuzal/triviaarena/actions/runs/42820049438), com HTML `file://` em Chrome e multiplayer em emulador. **O site público ainda retorna HTTP 404 e o multiplayer de produção não está disponível.** A API oficial recusou a habilitação de Pages e o acesso às variáveis com HTTP 403 (`Resource not accessible by integration`). O Firebase CLI não tem autenticação de produção. Veja as ações exatas e as evidências em [Publicação piloto](docs/publicacao-piloto.md).

## Começar agora

Baixe o [HTML autocontido](https://github.com/felipeortuzal/triviaarena/releases/download/v0.6.0/riviera-showdown.html) e abra `riviera-showdown.html` por duplo clique para **experimentar a interface real sem internet**. Escolha **um dos três modos** na página inicial e clique em **Testar lobby e placar** para simular uma sala, duas pessoas, dicas, palpites, rodadas e pódio. **Jogar neste aparelho** inicia uma partida rápida do modo selecionado. A simulação não conecta pessoas reais. No site HTTP, a tela inicial também abre sem Firebase; as ações de criar ou entrar em salas ficam desativadas até a conexão estar configurada.

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
- `party-game-v5.js` — jogo unificado Frases, Ranking e Misto com apuração atômica
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

Para testar os três modos multiplayer em dois Chromes isolados: `npm run test:browser-rank`. Para testar manualmente: inicie `npx firebase emulators:start --only auth,database --project demo-riviera-showdown`, sirva o site com `python -m http.server 8000` e abra `http://localhost:8000/?emulator=1`. A configuração de emulador só é ativada quando você opta pelo parâmetro em `localhost`/`127.0.0.1`. Isso **não liga Firebase de produção**. Ver [arquitetura de salas](docs/arquitetura-salas-v2.md).

## Publicação HTTPS — Etapa 04 (pendente de habilitação externa)

**Para jogar/testar imediatamente**, abra `riviera-showdown.html` no navegador. Ele é uma experiência interativa local; o botão **Testar lobby e placar** simula a partida com um amigo para conferir layout e mecânicas. Não gera sala real sem Firebase.

O deploy oficial já está automatizado por `.github/workflows/deploy-pages.yml`. Ele testa antes de publicar: Node, Chrome, Firebase Emulator e duas sessões reais de Chrome independentes (emulados). O script `scripts/prepare-pages.mjs` gera `dist/` com os arquivos estritamente públicos, base relativa sob `/triviaarena/`, carimbo `release.json` e configuração Web opcional. O único mecanismo previsto é **GitHub Actions → Pages**.

**Para ativar o endereço HTTPS**, com acesso à conta que administra o repositório, é necessário habilitar **Settings → Pages → Build and deployment → Source → GitHub Actions**. A tentativa de habilitar Pages pela API oficial em 10/11/2026 foi recusada com HTTP 403 pelo escopo do token disponível. O endereço esperado, **não garantido até o deploy**, é `https://felipeortuzal.github.io/triviaarena/`. A fonte do site está em `main`, não em uma branch concorrente de publicação.

**Para ativar multiplayer público**, é necessário configurar Firebase Web (Authentication anônimo e Realtime Database com `database.rules.json` publicado). Inserir o JSON **público** da configuração Web na variável de repositório `RIVIERA_FIREBASE_WEB_CONFIG`; a pipeline o copia para `dist/firebase-config.js` e não exige colocar credenciais de administrador no código. Sem variável, o site, se publicado, permanece com demo local e aviso de online indisponível.

As **etapas exatas, telas, verificações de segurança e roteiro para dois aparelhos físicos** estão em [Publicação piloto](docs/publicacao-piloto.md). Dois navegadores independentes no emulador não são substitutos de dois aparelhos físicos conectados ao serviço real.

## Catálogo e próximos jogos

- **Frases:** 96 desafios elegíveis (mais 8 entradas duplicadas preservadas historicamente), com duas pistas progressivas; equivalências textuais +1, aproximação semântica aprovada pelo anfitrião +0,5 e erro 0. O catálogo inicial continha 104 desafios com duas dicas, envio privado e +1 automático para cada resposta correta. Acentos, caixa, artigos, números por extenso, aliases editoriais e uma transposição adjacente em palavra longa são aceitos. Números errados, negações e qualificadores diferentes são rejeitados.
- **Rankings:** sorteio de categoria, alvo e Top 25/50/75/100 (só recortes cobertos pela fonte). Palpites privados por UID até a revelação, indicador público de envios, nomes PT/EN reconhecidos, distância absoluta e 5/3/1 com empates. Correções do host exigem motivo visível.
- **Modo misturado:** alterna Frase → Ranking → Frase com um placar único e resultado final.
- **Anti-repetição:** frases e combinações categoria/Top/alvo não se repetem até esgotar as opções. A política de distribuição entre categorias será refinada na Etapa 7.

## Limitações e melhorias possíveis

- As quatro listas base têm 100 itens. Para Top 250, 500 ou 1.000, é necessário adicionar bases reais e verificadas. **O aplicativo não inventa posições.**
- O importador V6 aceita listas de 10 a 1.000 posições com fonte HTTPS, edição e metodologia, somente na demonstração local até revisão editorial. Quatro listas oficiais herdadas têm fontes identificadas, mas as 400 posições ainda não foram auditadas individualmente.
- O reconhecimento ignora maiúsculas/acentos, usa aliases por lista, identifica ambiguidade/fora de recorte e aceita correção manual justificada pelo anfitrião após revelação. A lista inteira pode ser inspecionada no navegador: não há proteção contra quem consulta o catálogo para trapacear.
- Não há reconexão com outro ID após apagar dados do navegador, nem troca automática de anfitrião.
- Não há limite de uso/custo garantido para Firebase; consulte os limites e preços do seu projeto.

## Partida e revanche

O anfitrião revela as respostas e confirma cada rodada. A quinta confirmação abre o pódio; também é possível encerrar antes. A revanche mantém os participantes e a lista de desafios usados, zera o placar e cria novos IDs de rodada para não reutilizar palpites anteriores. O convite permanece fechado para novos participantes depois do primeiro início.

`npm run test:browser-five` testa os três modos em duas sessões independentes (desktop e mobile), cinco rodadas, respostas privadas, reconexão dos dois jogadores, clique duplo, pódio, revanche e o HTML `file://` offline. `node tests/public-site.mjs` faz a verificação somente de leitura do site realmente publicado; um resultado verde não declara o multiplayer de produção homologado.

## Testes rápidos

Servir os arquivos via HTTP (não `file://`): `python -m http.server 8000`. Testar em `http://localhost:8000` após configurar Firebase. Para testar multiplayer, abrir dois navegadores/perfis distintos e usar o convite. Verificar criação, entrada, palpites, revelação, pontuação e próxima rodada.

## Curadoria V6 e duração da partida

A sala usa **3, 5 ou 10 rodadas** (cinco por padrão), exibe o progresso, soma pontos de rankings 5/3/1 e respostas de frases 1/0,5/0, e termina automaticamente após a última rodada. A revanche conserva a duração e os jogadores, sem reutilizar palpites nem pontos. Respostas de frases são privadas até a revelação, com correções justificadas pelo anfitrião antes de fechar a rodada.

O [inventário V6](docs/inventario-curadoria-v6.md) documenta os 104 IDs, 96 questões elegíveis, 8 duplicatas semânticas desativadas, fontes e limitações das listas. O [validador](catalog-v6.js) aplica regras de IDs, pistas, aliases, datas e importação; listas do anfitrião são candidatas locais, não publicadas automaticamente para os demais.
