# Riviera Showdown — plataforma de jogos com amigos

**Roadmap de desenvolvimento do Riviera Showdown:** [prompts numerados, comandos e progresso](docs/etapas/README.md).

Riviera Showdown reúne **Decifre a Frase**, **Estimativa de Ranking** e a proposta de modo misto. A prévia HTML permite jogar **Decifre a Frase, Estimativa de Ranking e Misturado**, incluindo lobby com adversário simulado e placar. O mesmo lobby V2 usa autenticação anônima, convites e presença no Firebase Emulator. A Etapa 5 acrescenta palpites privados, correções com justificativa e placar 5/3/1 na partida online. A Etapa 4 continua pendente de ativação do Pages/Firebase real e testes com aparelhos físicos.

## Começar agora

Abra `riviera-showdown.html` por duplo clique para **experimentar a interface real sem internet**. Escolha **um dos três modos** na página inicial e clique em **Testar lobby e placar** para simular uma sala, duas pessoas, dicas, palpites, rodadas e pódio. **Jogar neste aparelho** inicia uma partida rápida do modo selecionado. A simulação não conecta pessoas reais. No site HTTP, a tela inicial também abre sem Firebase; as ações de criar ou entrar em salas ficam desativadas até a conexão estar configurada.

Para reconstruir e testar a prévia local, com Node.js 22 ou superior:

```bash
npm run build
npm test
```

O gerador `scripts/build-standalone.mjs` combina `index.html`, `app.js`, `data.json` e `logo.svg`, sem manter outra implementação do jogo. O teste de navegador `node tests/browser-smoke.mjs` exige `playwright-core` e Chrome/Chromium instalados; ele é executado no GitHub Actions. Não confunda uma demonstração local com sala multiplayer validada.

## Arquivos

- `index.html` — interface responsiva com carregamento progressivo
- `app.js` — regras, sorteios e multiplayer
- `data.json` — 110 fatos (101 habilitados) e 6 rankings (quatro Top100 históricos, IFPI Top10 e WIPO Top20)
- `logo.svg` — marca oficial Riviera Showdown; `logo.png` permanece como arte legada
- `riviera-showdown.html` — arquivo único offline (gerado, não edite manualmente)
- `firebase-config.js` — **preencher com a configuração do seu projeto**
- `rooms-v2.js` — admissão via slots transacionais, perfis e reconexão com mesmo UID
- `party-game-v5.js` — jogo unificado Frases, Ranking e Misto com apuração atômica
- `rank-tools-v5.js` — resolução de aliases, fontes elegíveis, distâncias e pontos 5/3/1
- `catalog-v6.js` — validação editorial, IDs, importação e snapshots de gabaritos
- `phrase-review-v6.js` — respostas exatas (+2), aproximadas (+1), inválidas (0) e revisão
- `docs/catalog-audit-v6.md` — auditoria de fontes, limitações e candidatos
- `scripts/validate-catalog.mjs` — validação reproduzível antes do build
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

**Para ativar o endereço HTTPS**, com acesso à conta que administra o repositório, é necessário habilitar **Settings → Pages → Build and deployment → Source → GitHub Actions**. A API do conector deste chat não expõe configuração de Pages; a automação não pode habilitar isso sozinha. O endereço esperado, **não garantido até o deploy**, é `https://felipeortuzal.github.io/triviaarena/`. A fonte do site está em `main`, não em uma branch concorrente de publicação.

**Para ativar multiplayer público**, é necessário configurar Firebase Web (Authentication anônimo e Realtime Database com `database.rules.json` publicado). Inserir o JSON **público** da configuração Web na variável de repositório `RIVIERA_FIREBASE_WEB_CONFIG`; a pipeline o copia para `dist/firebase-config.js` e não exige colocar credenciais de administrador no código. Sem variável, o site, se publicado, permanece com demo local e aviso de online indisponível.

As **etapas exatas, telas, verificações de segurança e roteiro para dois aparelhos físicos** estão em [Publicação piloto](docs/publicacao-piloto.md). Dois navegadores independentes no emulador não são substitutos de dois aparelhos físicos conectados ao serviço real.

## Partidas, pontuação e curadoria — Etapa 06

**Uma partida não é um ranking eterno:** ao criar sala escolha **3, 5 ou 7 rodadas** (padrão: **5**). Cada rodada tem desafio, palpites, revelação e apuração; ao confirmar a última rodada o placar é acumulado **uma única vez** e a partida termina automaticamente com pódio. O modo Misturado alterna Frase → Ranking a cada rodada.

- **Decifre a Frase:** todos os jogadores digitam respostas privadas; o reconhecimento automático dá **+2** por frase exata, **+1** por equivalente aproximada que preserve número e termos essenciais, e **0** por incorreta/ambígua. O anfitrião revisa casos contestados com justificativa visível antes de avançar; se o grupo responder apenas por voz, pode selecionar um vencedor para **+1**.
- **Estimativa de Ranking:** a menor distância absoluta entre o item escolhido e a posição-alvo define as colocações da rodada; **1º +5, 2º +3, 3º +1**. Empates dividem a colocação. O total dos pontos soma as rodadas; não significa que cinco pontos finalizam a partida.
- **Conteúdo:** 110 registros de frases (101 válidos para novos sorteios; 9 antigos problemáticos preservados para compatibilidade) e seis rankings: quatro históricos Top100 **parcialmente** confrontados com suas fontes, além de **IFPI 2025 Top10 de artistas** e **WIPO GII 2026 Top20 de inovação**, cujos recortes foram conferidos integralmente. O jogo informa fonte, edição e limitações.
- **Importação personalizada:** anfitrião pode adicionar até três listas ao lobby (10–1000 itens ordenados), com fonte HTTPS, edição/data e critérios, antes do início. São rotuladas como listas do anfitrião, sem certificado editorial automático.

O motor congela o texto e a referência das perguntas na rodada iniciada (`puzzleSnapshot` / `listSnapshot`), evitando mudança do gabarito se uma lista for atualizada. Para conferir os dados: `npm run validate:catalog`; auditoria de qualidade no [relatório V6](docs/catalog-audit-v6.md). A seleção mais refinada de temas e exaustão permanece na Etapa 7.

## Limitações

O jogador técnico ainda pode inspecionar o catálogo público no navegador; a segurança protege **palpites privados**, não a lista de respostas contra engenharia reversa. Correções manuais dependem do anfitrião; quatro rankings históricos ainda precisam auditoria editorial completa de Top100. Também não há reconexão com UID novo após apagar os dados do navegador nem eleição automática de host. GitHub Pages e Firebase de produção dependem da Etapa 4, ainda pendente; testes com emulador não substituem dois celulares físicos.

## Testes rápidos

Servir os arquivos via HTTP (não `file://`): `python -m http.server 8000`. Testar em `http://localhost:8000` após configurar Firebase. Para testar multiplayer, abrir dois navegadores/perfis distintos e usar o convite. Verificar criação, entrada, palpites, revelação, pontuação e próxima rodada.
