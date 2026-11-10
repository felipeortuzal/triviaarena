# Riviera Showdown — plataforma de jogos com amigos

**Roadmap de desenvolvimento do Riviera Showdown:** [prompts numerados, comandos e progresso](docs/etapas/README.md).

Riviera Showdown reúne **Decifre a Frase**, **Estimativa de Ranking** e a proposta de modo misto. A prévia local de Frases é jogável e inclui uma simulação de lobby/placar; o **lobby online V2** tem código de convite, autenticação anônima, controle de vagas e presença; a partida online **Decifre a Frase** da Etapa 3 passou nos testes em emulador. A etapa 4 depende de publicar Firebase real e testar dois aparelhos; Rankings/Misto continuam para a etapa 5.

## Começar agora

Abra `riviera-showdown.html` por duplo clique para **experimentar a interface real sem internet**. Clique em **Testar lobby e placar** para simular uma sala, duas pessoas, dicas, rodadas e pódio, ou em **Jogar neste aparelho** para uma partida rápida. A simulação não conecta pessoas reais. No site HTTP, a tela inicial também abre sem Firebase; as ações de criar ou entrar em salas ficam desativadas até a conexão estar configurada.

Para reconstruir e testar a prévia local, com Node.js 22 ou superior:

```bash
npm run build
npm test
```

O gerador `scripts/build-standalone.mjs` combina `index.html`, `app.js`, `data.json` e `logo.svg`, sem manter outra implementação do jogo. O teste de navegador `node tests/browser-smoke.mjs` exige `playwright-core` e Chrome/Chromium instalados; ele é executado no GitHub Actions. Não confunda uma demonstração local com sala multiplayer validada.

## Arquivos

- `index.html` — interface responsiva com carregamento progressivo
- `app.js` — regras, sorteios e multiplayer
- `data.json` — 104 frases e 4 rankings-base de 100 itens
- `logo.svg` — marca oficial Riviera Showdown; `logo.png` permanece como arte legada
- `riviera-showdown.html` — arquivo único offline (gerado, não edite manualmente)
- `firebase-config.js` — **preencher com a configuração do seu projeto**
- `rooms-v2.js` — admissão via slots transacionais, perfis e reconexão com mesmo UID
- `database.rules.json` — regras de acesso por papéis e isolamento de palpites V2
- `firebase.json` e `.firebaserc` — emuladores de Auth e Realtime Database com projeto `demo-riviera-showdown`
- `docs/arquitetura-salas-v2.md` — matriz de permissões, formato de dados e configuração segura

## Testar lobby com os emuladores (sem credenciais de produção)

```bash
npm install
npm run test:rooms
```

Para testar manualmente: inicie `npx firebase emulators:start --only auth,database --project demo-riviera-showdown`, sirva o site com `python -m http.server 8000` e abra `http://localhost:8000/?emulator=1`. A configuração de emulador só é ativada quando você opta pelo parâmetro em `localhost`/`127.0.0.1`. Isso **não liga Firebase de produção**. Ver [arquitetura de salas](docs/arquitetura-salas-v2.md).

## Publicar online (GitHub Pages + Firebase)

1. Crie um projeto em https://console.firebase.google.com/.
2. Em **Authentication > Sign-in method**, habilite **Anonymous**.
3. Em **Build > Realtime Database**, crie um banco e copie a URL do banco.
4. Em **Realtime Database > Rules**, publique as regras de `database.rules.json` **antes de habilitar salas**. O caminho V1 `/rooms` fica bloqueado, os caminhos V2 têm autorização por UID.
5. Em **Project settings > Your apps**, registre um **Web app** e copie os campos para `firebase-config.js`. `databaseURL` deve ser a URL do Realtime Database, não do Firestore.
6. Crie um repositório público no GitHub e envie todos os arquivos para a raiz. Em **Settings > Pages**, selecione **Deploy from a branch**, `main`, `/ (root)`.
7. Confira o deploy do GitHub Pages e o link HTTPS. Em seguida, valide lobby online em dois navegadores/perfis distintos. Rodadas e aprovação final entre dois celulares são etapas 3 e 4.

**Atenção:** o HTML offline **não ativa multiplayer**. A configuração pública do app Web Firebase não substitui as regras de acesso e não deve incluir credenciais administrativas. Em produção, só habilite as salas depois de validar o banco e autenticação anônima. Convites para uma sala existente não expõem apelidos ou placar antes da admissão.

## Catálogo e próximos jogos

- **Frases:** 104 desafios com duas dicas, resposta revelada pelo anfitrião e pontuação opcional.
- **Rankings:** sorteio de categoria, posição e recorte Top 25/50/75/100; palpites enviados individualmente e revelados juntos. Distâncias e pódio automáticos; o anfitrião pode corrigir posições de nomes alternativos antes de pontuar.
- **Modo misturado:** alterna os dois jogos.
- **Anti-repetição:** categorias e frases não se repetem antes de esgotar o conjunto; as posições sorteadas são lembradas por categoria e tamanho.

## Limitações e melhorias possíveis

- As quatro listas base têm 100 itens. Para Top 250, 500 ou 1.000, é necessário adicionar bases reais e verificadas. **O aplicativo não inventa posições.**
- O anfitrião pode importar rankings de 10 a 1.000 posições no lobby, com título, fonte e itens ordenados; também é possível adicionar bases em `data.json` no formato `{id,title,description,source,items:[...]}`.
- O reconhecimento de palpites é literal, ignorando maiúsculas e acentos. Traduções e apelidos podem ser corrigidos pelo anfitrião na tela de resultados.
- Não há reconexão com outro ID após apagar dados do navegador, nem troca automática de anfitrião.
- Não há limite de uso/custo garantido para Firebase; consulte os limites e preços do seu projeto.

## Testes rápidos

Servir os arquivos via HTTP (não `file://`): `python -m http.server 8000`. Testar em `http://localhost:8000` após configurar Firebase. Para testar multiplayer, abrir dois navegadores/perfis distintos e usar o convite. Verificar criação, entrada, palpites, revelação, pontuação e próxima rodada.
