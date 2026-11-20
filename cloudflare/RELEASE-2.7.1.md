# Riviera Showdown 2.7.1 — First Night Stability Patch

**Status:** manutenção de lançamento. Preserva design 2.7, 107 rankings e 55 frases. Sem mudança de pontuação, Durable Objects, formato de sala ou migração de dados.

## Correção
Uma sala antiga podia manter o WebSocket aberto ao entrar em uma **outra sala usando o mesmo navegador**. O novo código salva a nova sessão somente após fechar com segurança a conexão da sala anterior, cancela reconexões pendentes e abre um WebSocket para o novo código. Isso elimina o risco de parecer conectado à sala nova enquanto o navegador só recebe eventos da sala antiga. Também limpa a indicação de resposta registrada da sala anterior.

## Teste de regressão
- Playwright cria duas salas, entra na primeira, volta para a homepage e entra na segunda sem fechar a aba.
- O teste acompanha eventos WebSocket do navegador e comprova que as conexões são abertas para ambos os códigos, com a segunda conexão ativa.
- O código conserva WebSockets para partidas normais, conexão de presença, correção de palpites e sessões existentes.

## Inspeção em produção — 19/11/2026
- Aplicação acessível em HTTPS, catálogo 107 rankings e 55 frases.
- Sala de 4 pessoas: anfitrião + 3 convidados, bloqueio de início sem todos prontos, 2 rodadas, 4 palpites válidos por rodada, bloqueio de duplicatas, autocorreção `Bulbassaur`→`Bulbasaur`, pausa de Modo Festa permitida só para anfitrião, avanço manual, total de 6 pontos (2 + 1 em cada rodada), conclusão, estatísticas e revanche com placar zerado.
- Teste separado: Frases & Aproximações, 2 jogadores, gabarito privado até finalização, respostas e resultado.
- Verificação automatizada adicional no CI: testes unitários, integração com Wrangler e navegador móvel/desktop.
- Domínio final: https://riviera.thegoatgame.com.br

## Roteiro da primeira noite
1. Um anfitrião cria a partida, recomenda-se **Clássico, 5 rodadas, 30 segundos, Modo Festa ativado**.
2. Compartilhe pelo botão "Convidar amigos" (código ou link). Cada pessoa usa seu próprio celular e um apelido diferente.
3. Todos pressionam "Confirmar presença"; o anfitrião toca em "Começar partida".
4. Digitem e enviem os palpites. Erros pequenos são corrigidos se houver **uma** interpretação segura; em caso de dúvida, o jogo oferece sugestões, sem adivinhar.
5. Resultados e pontuação ficam visíveis na revelação; siga para próxima rodada ou aguarde o Modo Festa. Após a última, use "Jogar revanche".

## Limitações conhecidas
- A correção não inventa séries, títulos ou rankings ausentes do catálogo; o sistema não contém uma lista específica de séries como `How I Met Your Mother`.
- Os registros de rankings são snapshots datados; não são atualizados automaticamente.
- Testes automatizados e simulação em produção não substituem o primeiro teste prático em diferentes iPhones e Androids e redes Wi-Fi/4G.
