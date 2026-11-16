# RIVIERA SHOWDOWN 2.4 — HUMAN POLISH

## Objetivo
Preservar a capa/editorial Mediterranean Riviera Club aprovada na versão 2.3 e substituir a experiência interna de "formulário de IA" por uma aplicação de jogos com identidade visual consistente, navegação clara e baixa fricção, sem quebrar os dois modos nem o armazenamento Durable Objects.

## Fluxo redesenhado (executado)
1. **Navegação:** um único CTA de "Abrir mesa", atalho para entrada, atalhos de Como Jogar e Clube, menu suspenso compacto com estados acionáveis e som opcional. Cabeçalho leve com logo oficial existente.
2. **Criar sala:** fluxo em três etapas, sem modal genérico: escolha Ranking ou Frases + apelido → configure formato, rodadas, 20/30/45s, Turbo, categorias → confira o passaporte da sala e gere convite. O formulário antigo não foi apenas recolorido: foi substituído. Toda configuração continua validada no servidor.
3. **Entrar na sala:** tela dividida com fotografia da Riviera, código grande de seis caracteres, autocapitalização e filtro de letras permitidas, apelido claro e CTA único.
4. **Lobby:** código como peça principal de convite, botões de copiar/WhatsApp, roster de jogadores, host, presença, confirmação de pronto, menu de regras e seção dedicada para iniciar. Mantém kick e transferência de anfitrião.
5. **Jogo:** tipografia forte para a pergunta, entrada de palpite central, placar lateral com status, timer de 30s ou configuração atual com progresso e estado urgente. Sem vazamento de respostas.
6. **Revelação:** composição mais sóbria para gabarito, pontos, ranking, pódio e continuação. Sem neon e camadas de vidro artificial.
7. **Mobile:** layouts próprios a 850px, 580px, 360px; validação de rolagem horizontal e foco, com navegação compacta.

## Design system
- Paleta mantida de Riviera Club: navy #17343b, areia #f2eee4, papel #fffdf7, coral #c75c40, solar #e6d56e.
- Títulos editoriais em Barlow Condensed + detalhes de DM Serif Display, interface em DM Sans.
- Bordas nítidas, grid assimétrico, hierarquia tipográfica, contrastes funcionais e elementos de jogo próprios; sem cards com brilho ou bordas neon.
- Componentes base: header, menu dropdown, wizard rail, game mode selector, presets, custom controls, review passport, guest entry, lobby ticket, roster, scoreboard, match timer, podium.
- Não alterar a capa principal, logo nem imagem da praia aprovadas.

## Segurança / compatibilidade
- Backend mantido, com versão do status 2.4, sem mudança da classe Durable Object nem migração.
- URLs, tokens, placares históricos do Social Club, 41 rankings e 55 ditados seguem compatíveis.
- Botões de reação e som opcionais continuam. O timer é somente visual no browser; prazo e scoring permanecem autoritativos no Worker.
- Ao sair de uma rodada ativa, a app ainda conserva a sessão, permitindo retomada; fechar a sala é uma operação separada.

## Testes
- Unitários 24 testes, Worker local Wrangler, integração entre sessões, privacidade, pontuação, revanche, clubes.
- Browser e2e de Ranking, Frases, clube, menu, 3 passos, entrada, 320px/375px mobile, resultados e ausência de erros JS.
- Checagem de publicação em Cloudflare: versão 2.4, homepage mantida, fluxo de entrada e criação, logo e imagens.

## Prompt detalhado para a próxima rodada Codex / auditoria
Você é o lead frontend engineer e product designer do Riviera Showdown no repositório felipeortuzal/triviaarena. Trabalhe na pasta cloudflare. Preserve identidade Riviera Club v2.4 e os fluxos 2.3, API, Durable Objects e regras. Critérios: não mudar a capa sem justificativa; refinar o menu responsivo e estados de foco; verificar o wizard 3 etapas com preservação de dados entre etapas, validação, skip do campo categorias em Frases; auditar lobby em 320px/375px/768px/1280px, estados de host/convidado e status de pronto; auditar HUD durante jogo com teclado mobile aberto; testar resultado/revanche/clubes; não reintroduzir gradientes futuristas, glows, glassmorphism ou decoração genérica. Execute testes `node --test cloudflare/game.test.mjs`, integração contra Wrangler local, `node cloudflare/browser.test.mjs` e confira screenshots antes de deploy. Entregue mudanças em commits pequenos e observações de UX baseadas nas imagens capturadas.
