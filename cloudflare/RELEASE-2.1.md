# Riviera Showdown 2.1 — pacote 2.0.1 + 2.1

## Melhorias implantadas no código
- 41 categorias em vez de 8. O catálogo é datado e separado por Futebol (6 temporadas fechadas da Premier League), Fórmula 1 (2021–2025), Geografia e Economia (recortes regionais de rankings de países), Cinema (recortes de décadas IMDb), Brasil, Pokémon e Ciência. Cada lista tem ordenação explícita, fonte e fotografia temporal. Rankings regionais filtram os 100 primeiros da lista global original; não são classificações mundiais completas de todos os países do continente.
- Sorteio uniforme por categoria elegível, com prevenção de mesma categoria em duas rodadas seguidas sempre que houver alternativas. Sem repetição da mesma pergunta na partida.
- Lobby exige que TODOS os jogadores confirmem "Estou pronto" e estejam ativos; a validação é feita pelo Durable Object, inclusive contra requisições diretas.
- Novo tutorial explicando pergunta por posição, resposta simultânea, distância e pontuação, inclusive Turbo e desempate.
- Homepage não exibe "Reconectando" sem uma sala ativa.
- Criação simplificada com modo e número de rodadas à vista, três presets, e categorias/duração/Turbo em painel "Opções avançadas" recolhido. Biblioteca agrupada para encontrar assuntos.
- Autocomplete visível em campo de palpite; opções clicáveis com teclado, normalização e aliases continuam sendo validados pelo servidor.
- Imagens aprovadas passam pela mesma origem do Worker, com proxy GitHub + fallback jsDelivr e cache de borda (sem redirecionamento do navegador a sites externos). Durante desenvolvimento, o Wrangler serve os assets locais via ASSETS.
- Visual e HUD mobile refinados, com estados de foco, modais e menus mais claros.

## Limitações
- São 41 **listas/rankings de categorias**, algumas são recortes regionais ou históricos relacionados, não 41 bases independentes. Preservam fontes e datas e não devem ser anunciadas como atualizadas em tempo real.
- Não há ranking global por usuário; estatísticas seguem restritas à sala. Sem antifraude para competição com premiação.
- As imagens têm cache de borda; na primeira solicitação depende de GitHub ou jsDelivr. Para independência total, migrar arquivos para binding Cloudflare Static Assets na implantação de produção e fixar URLs.
- As 41 listas contêm itens de nomes exatos e aliases; é necessário seguir ampliando dicionários de sinônimos principalmente em filmes, times e pilotos.
- A publicação de produção ainda passa pela conexão autenticada Cloudflare (GitHub Actions não tem credenciais de deploy nos secrets).
 
## Testes e implantação
- Testes unitários incluem 41 listas, unicidade de IDs, fontes, sequência regional, balanceamento do sorteio e preservação do jogo existente.
- Integração com duas sessões inclui exigência de pronto, categorias, 20s, pontos Turbo, reações, privacidade, estatísticas, histórico e revanche.
- E2E Chrome desktop + mobile: tutorial, configurações avançadas, autocomplete, lobby, confirmação, partida e pódio.

O código mantém a mesma classe `ArenaRoom`, sem migrações de estado, e o domínio `riviera.thegoatgame.com.br`.
