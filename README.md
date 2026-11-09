# Riviera Showdown — plataforma de jogos com amigos

**Roadmap de desenvolvimento do Riviera Showdown:** [prompts numerados, comandos e progresso](docs/etapas/README.md).

Dois jogos: **Decifre a Frase** e **Estimativa de Ranking**, com convite por link, apelidos e estado sincronizado entre dispositivos.

## Começar agora

Abra `riviera-showdown.html` por duplo clique para experimentar **Decifre a Frase** no próprio aparelho, mesmo sem internet. No site HTTP, a tela inicial também abre sem Firebase; as ações de criar ou entrar em salas ficam desativadas até a conexão estar configurada.

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
- `database.rules.json` — regras iniciais para Firebase Realtime Database

## Publicar online (GitHub Pages + Firebase)

1. Crie um projeto em https://console.firebase.google.com/.
2. Em **Authentication > Sign-in method**, habilite **Anonymous**.
3. Em **Build > Realtime Database**, crie um banco e copie a URL do banco.
4. Em **Realtime Database > Rules**, cole o conteúdo de `database.rules.json` e publique as regras. Revise as regras para seu uso antes de abrir o site ao público.
5. Em **Project settings > Your apps**, registre um **Web app** e copie os campos para `firebase-config.js`. `databaseURL` deve ser a URL do Realtime Database, não do Firestore.
6. Crie um repositório público no GitHub e envie todos os arquivos para a raiz. Em **Settings > Pages**, selecione **Deploy from a branch**, `main`, `/ (root)`.
7. Aguarde o GitHub Pages publicar e abra a URL. Crie uma sala, copie o convite e abra em outro navegador/celular.

**Atenção:** só fazer upload do HTML **não ativa multiplayer**; é obrigatório configurar o Firebase. O arquivo de configuração web do Firebase pode ficar público; as regras de acesso ao banco são indispensáveis. O anfitrião deve manter a aba aberta para conduzir a partida. Os participantes não precisam criar contas.

## Jogos

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
