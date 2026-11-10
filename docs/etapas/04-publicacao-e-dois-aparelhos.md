# Etapa 4 — Publicação e partida em dois aparelhos

**Comando:** `execute etapa 4`. Siga o [contrato de execução](../../AGENTS.md) e consulte o [progresso](README.md).

**Objetivo.** Publicar a V1 em HTTPS e provar que dois amigos conseguem terminar uma partida de Decifre a Frase pelo mesmo convite.

## Implementação

1. Confira o estado atual de Pages e dos arquivos de configuração. Use o repositório existente e preserve seu nome. Publique o frontend estático por um mecanismo do Pages compatível com a branch e suas permissões. Evite dois mecanismos conflitantes de publicação. Teste caminhos de scripts, logo e dados sob o prefixo real.
2. Verifique o projeto Firebase escolhido para este jogo, login anônimo, URL da instância correta, domínios exigidos e regras aprovadas na etapa 2. Aponte a publicação para produção e mantenha o emulador restrito a desenvolvimento. Use o nível gratuito para o piloto. Se o acesso ao console estiver indisponível, deixe o código pronto, indique o menu e os valores públicos necessários e avance com os verificáveis.
3. Confirme a implantação pelo resultado do GitHub e abra a URL no navegador. Verifique que a revisão publicada corresponde à esperada, que a página inicial aparece e que um usuário anônimo cria uma sala. O status verde de um workflow por si só não comprova o funcionamento do jogo.
4. Execute o roteiro abaixo com dois aparelhos físicos e duas sessões distintas. Se só houver acesso a um aparelho, exercite duas sessões independentes, entregue o link disponível e dê a Felipe o roteiro mínimo da verificação restante. Ao receber o resultado, registre modelo/navegador ou tipo de aparelho, rede, data e etapa atingida. Use dados de teste. Evite publicar convites ainda ativos.

## Testes e aceite

- **Computador/anfitrião:** criar uma sala de frases, escolher nick e copiar o convite pelo botão do jogo.
- **Celular/convidado:** abrir o convite, de preferência em outra rede, entrar com outro nick e conferir os dois nomes nas duas telas. Conferir que o convidado não controla o início ou a revelação.
- Jogar três rodadas. Abrir as duas dicas em uma delas, recarregar o celular durante outra, atribuir um acerto, encerrar após a última revelação e comparar o placar final nos dois aparelhos.
- Reabrir o convite da partida encerrada. Verificar estado compreensível, ausência de vaga fantasma no fluxo definido e inexistência de erros fatais no console acessível.
- Entregar o endereço HTTPS que abriu o jogo, HTML da revisão, commit publicado, testes feitos e eventual ação externa. Registrar “Validada” apenas com a evidência dos dois aparelhos.

## Execução registrada — 09/11/2026

**Estado: Parcial.** Adicionados um mecanismo único de publicação (`.github/workflows/deploy-pages.yml` com `actions/configure-pages` + `upload-pages-artifact` + `deploy-pages`), pacote estático versionado (`scripts/prepare-pages.mjs`), validação de configuração Web Firebase pública via variável `RIVIERA_FIREBASE_WEB_CONFIG`, e testes de caminhos relativos, release e rejeição de URL insegura. O deploy só ocorre a partir de `main` após verificações; não há credenciais administrativas no repositório. `firebase-config.js` original não foi configurado com dados inventados.

**Evidência dos testes:** [GitHub Actions #42730703040](https://github.com/felipeortuzal/triviaarena/actions/runs/42730703040), aprovado: 3 testes Node de inicialização, 3 testes da exportação Pages, 7 testes SDK Firebase Auth + Realtime Database emulators, Chrome file:// offline, HTTP prefixado, viewport 375px e **navegadores Chrome isolados (desktop 1280px e mobile 390px)** numa partida real de 3 rodadas usando convite, autenticação anônima e emuladores; nomes sincronizados, controle do anfitrião, recarga do convidado na 2ª rodada, dicas, revelação, resultado final idêntico, nova sessão bloqueada após fechar, e ausência de exceções fatais.

**Por que ainda não é “Validada”:** O GitHub informa `has_pages=false`, logo **não há HTTPS público comprovado** neste repositório. O conector de GitHub usado não expõe a ativação de Pages/alteração de Settings; o Firebase real não foi fornecido nem configurado (`apiKey: COLE_AQUI`); tampouco temos acesso a dois aparelhos físicos para homologar. Etapa 04 permanece **Parcial** até o endereço público abrir, o serviço online de produção funcionar e a partida terminar em dois aparelhos reais. Evitar dizer que Chrome isolado equivale a celular físico.

**Ação mínima externa:** habilitar **GitHub Settings → Pages → Source → GitHub Actions**; preparar o Firebase gratuito (Anonymous + Realtime Database com regras versionadas) e definir a variável pública `RIVIERA_FIREBASE_WEB_CONFIG`. Em seguida, executar a pipeline de publicação novamente, conferir a URL pública e o `release.json`, e efetuar teste PC+iPhone em redes distintas. Passos detalhados em [Publicação piloto](../publicacao-piloto.md).

**Prévia para Felipe:** anexe `riviera-showdown.html` diretamente à resposta (abrível por duplo clique) e priorize o site jogável, não links do repositório. A prévia oferece rodadas rápidas e modo `Testar lobby e placar` com convidado simulado.
