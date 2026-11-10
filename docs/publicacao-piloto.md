# Etapa 04 — Colocar Riviera Showdown no ar sem expor credenciais

**Estado auditado em 10/11/2026:** a URL HTTPS retorna 404 também em Chromium real. `has_pages=false`; `POST /repos/felipeortuzal/triviaarena/pages` com `build_type=workflow` foi recusado com HTTP 403 (`Resource not accessible by integration`). O token identifica o proprietário, mas não concede a operação administrativa de Pages nem acesso às variáveis de Actions. `firebase projects:list --json` retornou `Failed to authenticate, have you run firebase login?`. A configuração versionada continua com `COLE_AQUI`; nenhum projeto ou credencial de produção foi inventado. Não houve ativação de faturamento ou de serviços pagos.

**Resultado disponível:** HTML autocontido atualizado e partidas de cinco rodadas nos três modos validadas no emulador. Produção e dois aparelhos físicos continuam pendentes.

## Evidências da execução de 10/11/2026

- 11 testes Node de inicialização, rankings e equivalências de frases + 3 testes do pacote Pages aprovados.
- 11 testes SDK com Auth/Realtime Database Emulator aprovados: privacidade inclusive contra o anfitrião antes da revelação, acesso de convidados, concorrência pela última vaga, apuração idempotente, cinco rodadas, reconexão e IDs novos na revanche.
- Playwright/Chromium: regressões de salas e rankings aprovadas; **dois contextos independentes** completaram cinco rodadas em **cada um dos três modos**, com placares iguais (5 pontos em Frase, 25 em Ranking, 13 em Misturado para respostas corretas em todas as rodadas), atualização de ambos os navegadores, clique duplo e revanche. Desktop 1365 px e mobile 390 px; sem exceções fatais JavaScript.
- HTML autocontido: três modos até a quinta rodada e revanche, rede desligada, viewport 375 px. O Chromium do ambiente Cloud bloqueia `file://` por política administrativa; o teste local entregou os mesmos bytes por rota interceptada do Playwright. Isso **não é teste de duplo clique**. O CI conserva o teste `file://` real, sem essa substituição.
- O SDK Node de Realtime Database ignora `NO_PROXY` para WebSocket. A execução SDK local retirou as quatro variáveis de proxy **somente do processo de testes que fala com 127.0.0.1**, preservando o proxy do CLI e dos acessos externos.
- O build utiliza `package-lock.json` e `npm ci`. O workflow de publicação testa os três modos e, após o deploy, confere assets, SHA de `release.json` e interface em navegador real.

## O que está pronto
- `.github/workflows/deploy-pages.yml` é o único mecanismo projetado para publicar em Pages: no `main`, verifica build, testes Node, Chrome real, Firebase Emulator, partida de Frases em dois **browsers independentes** e monta `dist/` com assets relativos; somente depois implanta com `actions/deploy-pages`. Mantém o nome do repositório `triviaarena`.
- `scripts/prepare-pages.mjs` publica só os arquivos necessários: `index.html`, `app.js`, `rooms-v2.js`, `phrases-v3.js`, `data.json`, `logo.svg`, `firebase-config.js`, `riviera-showdown.html`, `.nojekyll`, `release.json`. Não publica o código do emulador, documentação ou arquivos administrativos.
- O caminho relativo `/triviaarena/` é testado. O convite produzido é `https://felipeortuzal.github.io/triviaarena/?room=XXXXXX`, **somente depois que o Pages realmente estiver ativo**.
- `release.json` inclui o SHA publicado e o indicador `mode`: `offline-preview` quando não há configuração Firebase, `firebase-web-configured` quando há.
- Sem Firebase, o site público (caso Pages habilitado) **abre normalmente**, mas oferece apenas a demonstração local e o lobby simulado, sem fingir multiplayer real.

## Ação externa 1 — Habilitar GitHub Pages

No repositório existente, abra [a configuração de Pages](https://github.com/felipeortuzal/triviaarena/settings/pages): **Settings → Pages → Build and deployment → Source → GitHub Actions**. **Não** escolha `Deploy from a branch` se for usar a automação `deploy-pages.yml`; isso criaria dois mecanismos concorrentes. Se o workflow já tiver falhado antes da ativação, retome-o em [Actions → Riviera Showdown · Publicar site HTTPS](https://github.com/felipeortuzal/triviaarena/actions/workflows/deploy-pages.yml) → **Run workflow (branch main)** ou retome a etapa comigo. Sinal de sucesso: workflow de publicação verde **e** conteúdo visível na URL HTTPS do projeto. GitHub Pages oferece HTTPS para esta modalidade no repositório público.

## Ação externa 2 — Firebase de produção para salas entre amigos

1. Abra [Firebase Console](https://console.firebase.google.com/) → **Add project**, crie um projeto próprio do jogo no plano gratuito **Spark**, sem vincular conta de faturamento, se o limite disponível permitir. Não reutilize base de outro projeto nem acione faturamento sem decisão explícita de Felipe.
2. **Build → Authentication → Sign-in method → Anonymous → Enable**. Verifique os domínios autorizados conforme o método e adicione `felipeortuzal.github.io` se necessário. Para autenticação anônima não é necessário login pessoal.
3. **Build → Realtime Database → Create database**. Escolha região e instância. Na aba **Rules**, publique **o conteúdo exato e revisado de `database.rules.json`** antes de liberar qualquer jogador. O namespace V1 `rooms` fica bloqueado pelas regras novas; não apagar dados antigos. Confirme que o default `.read/.write` está `false`.
4. **Project settings → General → Your apps → Web app**. Copie a configuração Web pública com os cinco campos: `apiKey`, `authDomain`, `databaseURL`, `projectId`, `appId`. A `databaseURL` deve ser a do **Realtime Database**, por exemplo `https://SEU-ID-default-rtdb.us-central1.firebasedatabase.app` ou `https://SEU-ID-default-rtdb.firebaseio.com`.
5. No GitHub, abra [as variáveis de Actions](https://github.com/felipeortuzal/triviaarena/settings/variables/actions) → **New repository variable**. Nome exato: `RIVIERA_FIREBASE_WEB_CONFIG`. Valor: objeto JSON público contendo esses cinco campos. Exemplo ilustrativo (não é credencial real):

```json
{"apiKey":"WEB_API_KEY","authDomain":"seu-projeto.firebaseapp.com","databaseURL":"https://seu-projeto-default-rtdb.us-central1.firebasedatabase.app","projectId":"seu-projeto","appId":"1:123456789:web:abcdef"}
```

O workflow valida a estrutura e injeta os campos **públicos** apenas no pacote implantado; **nunca** copie service account, private key, refresh token ou credenciais administrativas. Não publicar credenciais em chats e prints.

6. Reexecute o workflow de publicação após configurar a variável. Verifique `https://felipeortuzal.github.io/triviaarena/release.json` (SHA e `firebase-web-configured`) e abra a página principal. Um check verde **não** prova que o Firebase de produção está configurado corretamente: crie uma sala e teste.

## Roteiro de homologação física — pendente até execução real

Anfitrião: computador/Chrome ou Edge, abrir URL HTTPS, digitar nick, escolher **Decifre a Frase**, criar sala e copiar convite.

Convidado: iPhone/Safari ou outro celular, preferencialmente em outra rede (4G/5G), abrir o mesmo convite e digitar outro nick. Confirmar que os dois nomes aparecem em ambos, código é idêntico e o convidado não consegue iniciar.

Rodadas: jogar **cinco rodadas em cada modo**, com 0 dica na primeira, 1 na segunda e 2 na terceira. Na segunda recarregar celular e confirmar retorno ao mesmo UID; registrar um vencedor e uma rodada sem vencedor. Após a quinta revelação, abrir o pódio e comparar placar e histórico nos dois aparelhos.

Revanche: anfitrião escolhe **Jogar revanche**, confirma placar zerado nos dois aparelhos e inicia novamente.

Encerramento: anfitrião fecha sala; terceiro dispositivo ou nova sessão reabre convite e recebe mensagem de sala encerrada. Verificar responsividade e se não há erro fatal.

Registrar data, modelos/navegadores, redes e resultado. **Somente considerar a Etapa 04 “Validada” quando este fluxo em dois aparelhos físicos e HTTPS estiver comprovado.** Emuladores e Chrome headless são regressão relevante, mas não substituem homologação física.

## Como ver o site antes de publicar

Abrir o arquivo `riviera-showdown.html` por duplo clique. **Jogar neste aparelho** permite rodada rápida e **Testar lobby e placar** simula o lobby com um amigo fictício até a tela de pódio. Nenhuma das duas funções depende do Firebase nem se conecta a amigos. A entrega ao usuário deve priorizar este HTML anexado à resposta, não páginas do repositório.

## Limites de confiança

A apuração roda no cliente do anfitrião, com transação única para placar e histórico; convidados não podem gravar esses campos. Um anfitrião malicioso ainda pode alterar seu cliente e o catálogo de respostas é público. Isso não equivale a um servidor antitrapaça. As regras protegem os envios privados antes da revelação e impedem que convidados modifiquem o placar. Nenhum serviço pago foi adicionado.
