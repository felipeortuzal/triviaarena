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
