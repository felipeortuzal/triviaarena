# Etapa 04 — Colocar Riviera Showdown no ar sem expor credenciais

**Estado do piloto em 09/11/2026:** frontend testado e pacote de Pages automatizado. O GitHub reporta `has_pages: false` para este repositório e `firebase-config.js` ainda contém marcadores `COLE_AQUI`. O conector GitHub disponível grava código e workflows, mas não altera **Settings → Pages** nem provisiona o Firebase Console. Até essas ações externas, **não existe link público confirmado** e multiplayer externo permanece desabilitado. Um workflow verde de teste não é uma publicação.

## O que está pronto
- `.github/workflows/deploy-pages.yml` é o único mecanismo projetado para publicar em Pages: no `main`, verifica build, testes Node, Chrome real, Firebase Emulator, partida de Frases em dois **browsers independentes** e monta `dist/` com assets relativos; somente depois implanta com `actions/deploy-pages`. Mantém o nome do repositório `triviaarena`.
- `scripts/prepare-pages.mjs` publica só os arquivos necessários: `index.html`, `app.js`, `rooms-v2.js`, `phrases-v3.js`, `data.json`, `logo.svg`, `firebase-config.js`, `riviera-showdown.html`, `.nojekyll`, `release.json`. Não publica o código do emulador, documentação ou arquivos administrativos.
- O caminho relativo `/triviaarena/` é testado. O convite produzido é `https://felipeortuzal.github.io/triviaarena/?room=XXXXXX`, **somente depois que o Pages realmente estiver ativo**.
- `release.json` inclui o SHA publicado e o indicador `mode`: `offline-preview` quando não há configuração Firebase, `firebase-web-configured` quando há.
- Sem Firebase, o site público (caso Pages habilitado) **abre normalmente**, mas oferece apenas a demonstração local e o lobby simulado, sem fingir multiplayer real.

## Ação externa 1 — Habilitar GitHub Pages

No repositório existente, abra **Settings → Pages → Build and deployment → Source → GitHub Actions**. **Não** escolha `Deploy from a branch` se for usar a automação `deploy-pages.yml`; isso criaria dois mecanismos concorrentes. Se o workflow já tiver falhado antes da ativação, retome-o em **Actions → Riviera Showdown · Publicar site HTTPS → Run workflow (branch main)** ou retome a etapa comigo. Sinal de sucesso: workflow de publicação verde **e** conteúdo visível na URL HTTPS do projeto. GitHub Pages oferece HTTPS para esta modalidade no repositório público.

## Ação externa 2 — Firebase de produção para salas entre amigos

1. Abra **Firebase Console → Add project**, crie um projeto próprio do jogo em plano gratuito, se o limite disponível permitir. Não reutilize base de outro projeto nem acione faturamento sem decisão explícita de Felipe.
2. **Build → Authentication → Sign-in method → Anonymous → Enable**. Verifique os domínios autorizados conforme o método e adicione `felipeortuzal.github.io` se necessário. Para autenticação anônima não é necessário login pessoal.
3. **Build → Realtime Database → Create database**. Escolha região e instância. Na aba **Rules**, publique **o conteúdo exato e revisado de `database.rules.json`** antes de liberar qualquer jogador. O namespace V1 `rooms` fica bloqueado pelas regras novas; não apagar dados antigos. Confirme que o default `.read/.write` está `false`.
4. **Project settings → General → Your apps → Web app**. Copie a configuração Web pública com os cinco campos: `apiKey`, `authDomain`, `databaseURL`, `projectId`, `appId`. A `databaseURL` deve ser a do **Realtime Database**, por exemplo `https://SEU-ID-default-rtdb.us-central1.firebasedatabase.app` ou `https://SEU-ID-default-rtdb.firebaseio.com`.
5. No GitHub, **Settings → Secrets and variables → Actions → Variables → New repository variable**. Nome exato: `RIVIERA_FIREBASE_WEB_CONFIG`. Valor: objeto JSON público contendo esses cinco campos. Exemplo ilustrativo (não é credencial real):

```json
{"apiKey":"WEB_API_KEY","authDomain":"seu-projeto.firebaseapp.com","databaseURL":"https://seu-projeto-default-rtdb.us-central1.firebasedatabase.app","projectId":"seu-projeto","appId":"1:123456789:web:abcdef"}
```

O workflow valida a estrutura e injeta os campos **públicos** apenas no pacote implantado; **nunca** copie service account, private key, refresh token ou credenciais administrativas. Não publicar credenciais em chats e prints.

6. Reexecute o workflow de publicação após configurar a variável. Verifique `https://felipeortuzal.github.io/triviaarena/release.json` (SHA e `firebase-web-configured`) e abra a página principal. Um check verde **não** prova que o Firebase de produção está configurado corretamente: crie uma sala e teste.

## Roteiro de homologação física — pendente até execução real

Anfitrião: computador/Chrome ou Edge, abrir URL HTTPS, digitar nick, escolher **Decifre a Frase**, criar sala e copiar convite.

Convidado: iPhone/Safari ou outro celular, preferencialmente em outra rede (4G/5G), abrir o mesmo convite e digitar outro nick. Confirmar que os dois nomes aparecem em ambos, código é idêntico e o convidado não consegue iniciar.

Rodadas: jogar **três frases**, com 0 dica na primeira, 1 na segunda e 2 na terceira. Na segunda recarregar celular e confirmar retorno ao mesmo UID; registrar um vencedor e uma rodada sem vencedor. Após a terceira revelação, finalizar e comparar placar e histórico nos dois aparelhos.

Encerramento: anfitrião fecha sala; terceiro dispositivo ou nova sessão reabre convite e recebe mensagem de sala encerrada. Verificar responsividade e se não há erro fatal.

Registrar data, modelos/navegadores, redes e resultado. **Somente considerar a Etapa 04 “Validada” quando este fluxo em dois aparelhos físicos e HTTPS estiver comprovado.** Emuladores e Chrome headless são regressão relevante, mas não substituem homologação física.

## Como ver o site antes de publicar

Abrir o arquivo `riviera-showdown.html` por duplo clique. **Jogar neste aparelho** permite rodada rápida e **Testar lobby e placar** simula o lobby com um amigo fictício até a tela de pódio. Nenhuma das duas funções depende do Firebase nem se conecta a amigos. A entrega ao usuário deve priorizar este HTML anexado à resposta, não páginas do repositório.
