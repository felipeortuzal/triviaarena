# Prompts de desenvolvimento do Riviera Showdown

Com o GitHub conectado neste projeto, envie **“execute etapa 1”**. Ao receber a entrega, envie **“execute etapa 2”** e siga a ordem abaixo. A instrução de cada etapa está no título clicável. Os arquivos também podem ser usados em uma conversa nova.

**Primeira mensagem se o chat ainda não conhecer o projeto**

> Use o GitHub para acessar `felipeortuzal/triviaarena`, leia o `AGENTS.md` da raiz e execute a etapa 1 do índice `docs/etapas/README.md`.

Para retomar, envie **“retome a etapa N”**. Para consultar sem implementar, envie **“qual é o status da etapa N?”**. Confira o último registro e os commits associados. Cada prompt herda o [contrato de execução](../../AGENTS.md).

## Ordem de execução

| Etapa | Versão | Dependências | Entrega verificável |
|---|---|---|---|
| [1. Inicialização, marca e prévia HTML](01-inicializacao-e-previa.md) | V1 | Commit atual | A página inicia e o HTML abre por duplo clique. |
| [2. Modelo de sala e regras do Firebase](02-salas-e-regras.md) | V1 | 1 | Dois usuários independentes entram no emulador e as tentativas de acesso indevido falham. |
| [3. Decifre a Frase de ponta a ponta](03-partida-de-frases.md) | V1 | 1 e 2 | Dois clientes completam três rodadas com dicas, reconexão e placar final. |
| [4. Publicação e partida em dois aparelhos](04-publicacao-e-dois-aparelhos.md) | V1 | 1–3 | Convite HTTPS abre no celular e a mesma partida termina nos dois aparelhos físicos. |
| [5. Estimativa de Ranking e modo misto](05-ranking-e-misto.md) | V2 | 2 e 3 para desenvolver, 4 para validar online | Dois jogadores concluem uma partida mista com palpites privados e pontuação correta. |
| [6. Curadoria de frases e rankings](06-curadoria-e-fontes.md) | V3 | 1 e 5 | O catálogo publicado é verificável e passa nas validações de integridade. |
| [7. Distribuição dos sorteios e esgotamento](07-sorteio-e-variedade.md) | V3 | 5 e 6 | Temas, listas, posições e frases obedecem à política documentada e reproduzível. |
| [8. Experiência mobile e versão para compartilhar](08-mobile-e-release.md) | V3 | 1–7 para o lançamento | Os três modos passam no link público, e o HTML da versão abre localmente. |
| [9. Continuidade do anfitrião e escala](09-continuidade-e-escala.md) | Futura · opcional | 8 | A sala sobrevive à perda do anfitrião e os limites de capacidade estão medidos. |

A etapa 4 concentra permissões de infraestrutura e acesso a aparelhos físicos. Se faltar apenas essa validação, o desenvolvimento das etapas 5–7 pode continuar contra o emulador. A liberação pública segue pendente. A etapa 9 é opcional e pode ser solicitada depois da primeira versão completa.

## Registro de progresso

| Etapa | Estado | Evidência, pendência e ponto de retomada |
|---|---|---|
| 1 | Validada | [CI aprovada em Chrome e Node](https://github.com/felipeortuzal/triviaarena/actions/runs/42717663362): 3/3 testes Node; HTTP em `/triviaarena/`, `file://` sem rede, duas dicas, revelação, avanço, responsividade em 375 px, falhas de dados e de CDN. [HTML autônomo](../../riviera-showdown.html). Publicação Pages e salas reais são etapas 4 e 2–3. |
| 2 | Validada | [CI com Emulator Suite e Chrome](https://github.com/felipeortuzal/triviaarena/actions/runs/42722841443): 4/4 testes com Auth + Realtime Database reais no projeto demo e 3/3 regressões Node. Provados acesso negado, nickname/placar imutáveis a convidados, palpites isolados, choque de código, reconexão por UID, concorrência pela 20ª vaga e duas operações simultâneas do mesmo UID. Lobby premium e prévia HTML atualizados. [Matriz e comandos](../arquitetura-salas-v2.md). Configuração Firebase de produção e dois aparelhos físicos continuam fora desta etapa. |
| 3 | Validada | [CI completa no Firebase Emulator + Chrome](https://github.com/felipeortuzal/triviaarena/actions/runs/42727601222): **7/7 testes no emulador e 3/3 testes Node**, além de Chrome real em HTTP prefixado e `file://` offline. Dois UIDs concluíram 3 rodadas com 0/1/2 dicas, vencedor e sem vencedor, pontuação exatamente uma vez, encerramento duplo, reconexão, ingresso bloqueado após início e presença do anfitrião após queda/retorno. Interface de partida, revelação e pódio, e **prévia clicável no arquivo `riviera-showdown.html`** com simulação de lobby e convidado fictício. Teste físico e publicação HTTPS seguem na Etapa 4. |
| 4 | Parcial | Auditoria de 10/11/2026: Pages `has_pages=false`, URL 404 em HTTP e Chromium; habilitação via API e leitura de variáveis negadas com 403. Firebase CLI sem autenticação; config Web de exemplo. [CI completa aprovada, incluindo HTML file://](https://github.com/felipeortuzal/triviaarena/actions/runs/42820049438). [Deploy bloqueado no configure-pages](https://github.com/felipeortuzal/triviaarena/actions/runs/42820049394). Build, 11 testes SDK e partidas de cinco rodadas nos três modos em dois contextos Chromium aprovados; pódio, refresh, clique duplo e revanche. HTML local atualizado com funções compartilhadas. Produção e dois aparelhos físicos pendentes. [Evidências e ações exatas](../publicacao-piloto.md). |
| 5 | Parcial | Implementação validada em emuladores em 10/11/2026: Ranking, Frase e Misturado, cinco rodadas, palpites privados, 5/3/1 para ranking, +1 por frase correta, apuração idempotente, reconexão e revanche. 11 testes Node + 3 de Pages + 11 SDK aprovados; dois contextos Chromium concluíram cada modo. Homologação de produção e física depende da Etapa 4. |
| 6 | A executar | — |
| 7 | A executar | — |
| 8 | Parcial | Modo viagem 0.7: 2–8 participantes no mesmo aparelho, três modos, cinco rodadas, respostas escondidas na troca de jogador, passar vez, pausa/retomada e revanche. Playwright offline: três participantes locais, página reaberta, nomes inválidos, limite de jogadores, armazenamento bloqueado e save corrompido. Interface de toque em 360/375 px; HTML gerado dos mesmos módulos. CI inclui teste file://. Pages/Firebase reais e aparelhos físicos seguem pendentes; etapas 6–7 continuam fora desta entrega. |
| 9 | A executar | — |

## Ponto de partida auditado

Referência histórica de 09/11/2026: [commit `00ec746`](https://github.com/felipeortuzal/triviaarena/commit/00ec7463a098ae8f11112811171c13ade39bac0e). A branch `main` continha sete arquivos. O módulo falhava ao analisar `letters()`, o Firebase continha marcadores de exemplo e a URL do GitHub Pages retornava 404. A base continha 104 registros de frases e quatro listas de 100 itens. Houve testes de lógica isolada. A sincronização em aparelhos físicos ainda precisava de validação. Releia o HEAD a cada execução.
