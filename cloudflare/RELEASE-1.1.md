# Riviera Showdown 1.1 — estabilidade e conteúdo

## Mudanças implementadas
- 8 rankings no total (antes 4), incluindo UFs por área e população, Pokédex Nacional #1–30 e tabela periódica (1–30). Bases com data e fonte identificadas. Os quatro rankings anteriores permanecem.
- Melhorias de reconhecimento de respostas: acentos, nomes comuns abreviados (EUA/SP/etc.), nomes de filmes traduzidos e erros pequenos de digitação aceitos apenas quando há correspondência única. Palpites continuam privados e itens repetidos, bloqueados no Durable Object.
- Lobby: indicador de jogadores online (heartbeat), estado "estou pronto", opção de remover jogador do lobby, transferência de anfitrião, recuperação automática de host após 75s sem heartbeat, convite copiável e WhatsApp.
- Cliente: reconexão WebSocket automática, fallback por polling, aviso de conexão, recuperação após voltar à aba, link de convite de outra sala não fica preso em uma sessão anterior, timer e formulário travam quando acabam os 30 segundos.
- Biblioteca de rankings exibida na homepage com contagem e datas; layout para telas de 320px e responsividade de HUD.

## Segurança e limitações
- Apelidos e identidade de convidado continuam baseados em tokens aleatórios por navegador, sem contas verificadas.
- Endpoints de sala exigem bearer token por jogador. Host apenas nas operações de kick/handoff e ações do host. Remoção só no lobby.
- A lista de opções é apresentada aos participantes como autocomplete; o código de fonte é público, de modo que o game **não é anti-cheat** para eventos com prêmio.
- O host pode sair ao encerrar a partida ou no lobby; a transferência automática é por inatividade (>75s), não por prova criptográfica de desconexão.
- Este pacote não adiciona 30 categorias: o catálogo passa de 4 para 8, com fontes verificáveis e nomenclatura preservada.
- O modo local continua disponível separadamente no arquivo standalone original e não foi alterado pela versão Cloudflare.

## Testes
`node --test cloudflare/game.test.mjs`, `cloudflare/integration.mjs` contra Wrangler local e `cloudflare/browser.test.mjs` em dois Chromes diferentes (desktop e mobile) verificam regras, lobby, respostas, concorrência, revelação, revanche, layout e conectividade. Uma execução real entre celulares físicos ainda depende de usuários testarem o domínio publicado.

## Publicação
O site de produção `riviera.thegoatgame.com.br` foi publicado pela API Cloudflare a partir do código da pasta cloudflare. Para manter o site servindo assets sem upload adicional, na implantação pela API o frontend JS/CSS/HTML fica embutido no módulo Worker, e as imagens aprovadas são redirecionadas para os assets públicos do GitHub. O Wrangler do projeto ainda consegue publicar os mesmos arquivos como Static Assets se um CI com credenciais for configurado.
