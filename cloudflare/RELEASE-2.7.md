# Riviera Showdown 2.7 — Primeira Noite / Correção Inteligente

## Objetivo
Entregar a versão estável para a primeira noite jogando com amigos, sem depender de IA externa, pagamentos ou APIs lentas para corrigir palpites.

## Correção automática
- A correção é **autoritativa no servidor** (Durable Object): nunca atribuir a um nome que não esteja no ranking daquela rodada.
- Etapas de interpretação: normalização de caixa e acentos, apelidos/traduções cadastrados, espaços e conectores, abreviações reconhecíveis, nomes de cidades com UF omitida, acrônimos não ambíguos e distância Damerau-Levenshtein com limite de edição conforme tamanho do título.
- Inclui letras invertidas, omitidas ou repetidas. Ex.: "How I Meet Ur Mother" → "How I Met Your Mother" quando o título existe entre as opções; "Pikachuu" → "Pikachu"; "Sao paolo" → "São Paulo - SP".
- Se mais de um candidato é plausível, a correção **não** escolhe um automaticamente. O servidor responde com sugestões e não registra palpite. Ex.: "Nidoran" com macho/fêmea, "Bom Jesus" com municípios de UFs diferentes.
- Quando a resposta é aceita, o servidor retorna apenas ao autor `acceptedAnswer` e `correction` (se ocorreu). O cliente exibe exatamente a resposta registrada e o nome digitado; o servidor continua ocultando os outros palpites até a revelação.
- O bloqueio de respostas duplicadas continua pela posição canônica: escrever "Bulbassaur" não permite que outro jogador responda "Bulbasaur".
- Frases populares preservam pontuação por qualidade (100, 90, 75, 60, 0); para correspondência de 90+ com o gabarito, a interface também mostra a interpretação.
- Limites: não é um agente generativo, **não entende respostas semânticas livres** ou títulos que não existam no catálogo. Não se corrige automaticamente texto ambíguo.

## Preparação para a primeira partida
- Fluxos mantidos: sala com código, pronto, 2–12 pessoas, 20/30/45 segundos, ranking em 107 listas, dois modos de pontuação, Frases, Modo Festa, Clubs, handoff, reconexão e revanche.
- Configuração sugerida para primeira partida: **Clássico**, 5 rodadas, 30 segundos, Modo Festa ligado. Não exige cadastro, login nem instalação. Para ranking e variedade maior, usar Mistura Riviera.
- A capa aprovada e a identidade visual Riviera Club permanecem. Aviso contextual discreto de autocorreção no campo de resposta e confirmação visual após envio.

## Testes
- Unidade: título de série com erro, Pokémon, filmes, municípios, abreviações, acentos, segurança contra ambiguidade e falsos positivos.
- Integração real de dois jogadores: correção, retorno privado, tentativa duplicada bloqueada, pontuação e reveal.
- Testes de navegador: confirmar a resposta exibida após autocorreção, multiplayer, modos, clubes e mobile.
- Publicação Cloudflare: Worker `riviera-showdown` com binding `ARENA` e domínio `riviera.thegoatgame.com.br`. Sem migração nem substituição de Durable Objects.
