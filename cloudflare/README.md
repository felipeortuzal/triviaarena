# Riviera Showdown — multiplayer em Cloudflare Workers

[Jogar no domínio oficial](https://riviera.thegoatgame.com.br/)

O frontend está em `cloudflare/public` e o servidor em `cloudflare/worker.mjs`. O binding `ARENA` mantém as salas e clubes em Durable Objects SQLite. `node cloudflare/prepare.mjs` reúne as imagens e o HTML offline no diretório de publicação.

A sala usa um código de seis caracteres e admite até 12 pessoas. Cada navegador mantém a própria identidade. As respostas ficam privadas até todos enviarem ou o prazo de 20, 30 ou 45 segundos terminar. A tela confirma a grafia aceita e recupera essa confirmação após uma recarga. No Ranking, a menor distância vence. Em Frases, os jogadores completam o ditado e veem a pontuação de similaridade na revelação.

O anfitrião pode passar a liderança ou remover alguém no lobby. Uma ausência prolongada do anfitrião permite que outro jogador ativo assuma. O clube soma resultados das partidas vinculadas e registra cada partida uma vez.

## Verificação e publicação

O [workflow do Cloudflare](../.github/workflows/deploy-cloudflare.yml) valida lógica, integração com o Worker e navegador. O deploy automático depende dos secrets `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID`. Também é possível publicar a versão testada pela API do Cloudflare no mesmo Worker, mantendo a classe `ArenaRoom`, o domínio e os dados. Consulte os comandos e a experiência offline no [README do projeto](../README.md).

O teste em quatro navegadores inclui o convite, cinco rodadas e revanche. A experiência de teclado e a troca entre Wi-Fi e rede móvel em iPhone e Android físicos dependem de uma partida nos aparelhos.
