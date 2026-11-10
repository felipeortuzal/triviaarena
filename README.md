# Riviera Showdown — plataforma de jogos com amigos

**Roadmap de desenvolvimento do Riviera Showdown:** [prompts numerados, comandos e progresso](docs/etapas/README.md).

Riviera Showdown reúne **Decifre a Frase, Estimativa de Ranking e Misturado**, com partidas de **cinco rodadas**, respostas privadas, pontuação automática, pódio e revanche na mesma sala. O HTML local usa as mesmas funções de sorteio e pontuação da versão online.

**Estado em 10/11/2026:** modo viagem 0.7 implementado e testado em Chromium offline. A [CI da versão 0.6](https://github.com/felipeortuzal/triviaarena/actions/runs/42820049438) também validou HTML `file://` e multiplayer em emulador; a CI atual inclui `npm run test:browser-travel`. **O site público ainda retorna HTTP 404 e o multiplayer de produção não está disponível.** A API oficial recusou a habilitação de Pages e o acesso às variáveis com HTTP 403 (`Resource not accessible by integration`). O Firebase CLI não tem autenticação de produção. Veja as ações exatas e as evidências em [Publicação piloto](docs/publicacao-piloto.md).

## Começar agora — viagens e encontros

Baixe o [HTML do modo viagem](https://github.com/felipeortuzal/triviaarena/releases/download/v0.7.0/riviera-showdown.html) antes de sair e abra no navegador. **Não precisa de conta, servidor nem Firebase para jogar juntos no mesmo aparelho.**

1. Escolha Frase, Ranking ou Misturado.
2. Preencha os nomes de **2 a 8 pessoas** e toque em **Começar com a turma**.
3. Passe o aparelho para a pessoa indicada. Ela toca em **Estou com o aparelho**, responde e passa para a próxima. **Não sei · passar vez** deixa a partida seguir sem pontuar aquela resposta.
4. Depois de todos responderem, revelem juntos. O jogo calcula os pontos e termina na quinta rodada.
5. Toque em **Jogar revanche** para manter a turma e zerar o placar.

**Pausar e sair** guarda a partida neste navegador. Ao abrir novamente o mesmo arquivo, use **Retomar partida**. O salvamento depende de armazenamento local permitido; se ele estiver bloqueado, o jogo avisa para manter a página aberta. Respostas enviadas e placares são preservados; rascunhos ainda não enviados são apagados ao passar o aparelho ou pausar. O arquivo não sincroniza aparelhos diferentes.

**Experimentar sozinho** e **Testar lobby e placar** continuam disponíveis com adversário explicitamente simulado. As salas entre aparelhos permanecem em uma seção separada e exigem Firebase de produção. Não confunda o modo viagem com multiplayer pela internet.

A revisão 0.7 adiciona controles maiores para toque, modos compactos no celular, envio com Enter, dicas individuais, troca de jogador sem revelar respostas anteriores e navegação pelo logo sem sair do arquivo HTML. Os testes automatizados cobrem cinco rodadas nos três modos, passar vez, pausa, nova página, empate e revanche. Dois aparelhos físicos continuam sem homologação.

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

- **Frases:** 104 desafios com duas dicas, envio privado e +1 automático para cada resposta correta. Acentos, caixa, artigos, números por extenso, aliases editoriais e uma transposição adjacente em palavra longa são aceitos. Números errados, negações e qualificadores diferentes são rejeitados.
- **Rankings:** sorteio de categoria, alvo e Top 25/50/75/100 (só recortes cobertos pela fonte). Palpites privados por UID até a revelação, indicador público de envios, nomes PT/EN reconhecidos, distância absoluta e 5/3/1 com empates. Correções do host exigem motivo visível.
- **Modo misturado:** alterna Frase → Ranking → Frase com um placar único e resultado final.
- **Anti-repetição:** frases e combinações categoria/Top/alvo não se repetem até esgotar as opções. A política de distribuição entre categorias será refinada na Etapa 7.

## Limitações e melhorias possíveis

- As quatro listas base têm 100 itens. Para Top 250, 500 ou 1.000, é necessário adicionar bases reais e verificadas. **O aplicativo não inventa posições.**
- A importação de ranking pelo anfitrião permanece adiada até a Etapa 6 (curadoria): por enquanto usam-se as quatro listas verificáveis existentes no `data.json` com 100 itens cada e metadados `id,title,source,url,snapshot,about,items`.
- O reconhecimento ignora maiúsculas/acentos, usa aliases por lista, identifica ambiguidade/fora de recorte e aceita correção manual justificada pelo anfitrião após revelação. A lista inteira pode ser inspecionada no navegador: não há proteção contra quem consulta o catálogo para trapacear.
- Não há reconexão com outro ID após apagar dados do navegador, nem troca automática de anfitrião.
- Não há limite de uso/custo garantido para Firebase; consulte os limites e preços do seu projeto.

## Partida e revanche

O anfitrião revela as respostas e confirma cada rodada. A quinta confirmação abre o pódio; também é possível encerrar antes. A revanche mantém os participantes e a lista de desafios usados, zera o placar e cria novos IDs de rodada para não reutilizar palpites anteriores. O convite permanece fechado para novos participantes depois do primeiro início.

`npm run test:browser-five` testa os três modos em duas sessões independentes (desktop e mobile), cinco rodadas, respostas privadas, reconexão dos dois jogadores, clique duplo, pódio, revanche e o HTML `file://` offline. `node tests/public-site.mjs` faz a verificação somente de leitura do site realmente publicado; um resultado verde não declara o multiplayer de produção homologado.

## Testes rápidos

Servir os arquivos via HTTP (não `file://`): `python -m http.server 8000`. Testar em `http://localhost:8000` após configurar Firebase. Para testar multiplayer, abrir dois navegadores/perfis distintos e usar o convite. Verificar criação, entrada, palpites, revelação, pontuação e próxima rodada.
