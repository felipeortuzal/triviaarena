# Riviera Showdown 2.5 — Game Night

## Experiência
- Modo Festa: ao fechar uma rodada, o servidor anuncia a resposta por 9 segundos e começa a próxima automaticamente, sem clique do host. Contagem autoritativa por Cloudflare Durable Object Alarm, sincronizada entre dispositivos. Nunca avança depois da última rodada.
- Host pode pausar a transição durante a revelação, desligando Modo Festa naquela partida e devolvendo o controle manual. Botão "Avançar agora" segue disponível.
- Salas anteriores têm avanço manual por padrão; opção é armazenada no estado existente, sem migração de Durable Object nem quebra de sessão.
- Criação de partida: toggle Modo Festa, resumo final, presets Clássico/Turbo automáticos e Maratona manual.
- Resultados: faixa editorial de contagem regressiva, relógio sincronizado por offset servidor, progressbar por rodadas.

## Convites
- Lobby: ação "Convidar amigos" com painel de convite editorial e código destacado.
- Compartilhar nativamente pelo celular, copiar link, copiar código, WhatsApp com mensagem pronta. Fallback de cópia quando não há Web Share API, sem dependência externa de QR.
- O navegador respeita convite recebido para outra sala mesmo com sessão antiga salva; esse comportamento já existia na 2.4 e foi preservado.
- O servidor impede convidados de pausar o avanço automático; o host pode prosseguir manualmente.

## Testes
- 27 testes unitários, novo campo autoNext, agenda sem antecipar gabarito, modo manual.
- Integração Wrangler de duas salas: alarme real após 9 segundos, pausa host, convidado sem permissão e sequência manual; mantém ranking, frases, clubes, revanche.
- Chrome/Playwright: compartilhamento, progresso, Modo Festa, pausa, dois modos, mobile e clubes.
- Deploy mantém a classe ArenaRoom/binding ARENA, domínio riviera.thegoatgame.com.br e demais imagens.

## Visual
- Preserva Riviera Club editorial: areia, azul-marinho, coral, amarelo-solar.
- Modal de convite editorial e faixa Modo Festa com tipografia condensada e animação reduzida quando prefer-reduced-motion.
