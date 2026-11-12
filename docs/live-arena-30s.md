# Riviera Showdown — Arena ao Vivo (30 segundos)
Implementada em **12/11/2026**.

- O anfitrião cria a opção `Arena Ao Vivo · 30s` em aparelhos diferentes; a partida continua tendo cinco rodadas.
- Cada rodada mostra a categoria, Top N e posição alvo, com prazo compartilhado `deadlineAt` (UTC milissegundos).
- Clientes compensam o relógio com `.info/serverTimeOffset`. Regras de escrita bloqueiam palpites após o prazo.
- Uma resposta por jogador. A primeira reserva da chave normalizada vence atomicamente no RTDB; aliases são mapeados para o item canônico. O segundo jogador precisa escolher outro palpite.
- Os textos não aparecem antes da revelação; somente o status de envio. Depois aparecem todos os palpites, posições reais, distâncias e pontos.
- Ao terminar 30 segundos, o anfitrião online revela automaticamente. Quem não enviou recebe zero. Se o host sair, a rodada espera seu retorno.
- Continua existindo o modo clássico no mesmo aparelho, sem sincronização entre celulares; não atribuir a ele multiplayer real.
- A verificação de identidade e prazo acontece nas regras. Chaves canônicas são calculadas no cliente: não protege contra clientes deliberadamente alterados. Um servidor autoritativo seria necessário em torneios valendo prêmio.
- Produção exige Firebase Auth Anônimo, Realtime Database e `database.rules.json` publicado, mais hospedagem HTTPS.