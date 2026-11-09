# Etapa 8 — Experiência mobile e versão para compartilhar

**Comando:** `execute etapa 8`. Siga o [contrato de execução](../../AGENTS.md) e consulte o [progresso](README.md).

**Objetivo.** Entregar uma versão que Felipe consiga abrir, explicar aos amigos e compartilhar por um único link. Use os jogos e a infraestrutura já validados. Mantenha a marca Riviera Showdown em toda a experiência.

## Implementação

1. Revise o caminho completo no celular e no desktop: escolha de modo, criação/entrada por convite, lobby, partida, revelação, placar e encerramento. Use uma ação principal reconhecível em cada estado, hierarquia legível e botões alcançáveis. Diferencie controles do anfitrião e do convidado. Preserve o estilo visual já aprovado na etapa 1.
2. Trate teclado virtual, foco visível, formulários com rótulos, movimento reduzido e contraste. Teste nicks longos, empate, lista cheia, reconexão e internet lenta. Confirme que abrir o teclado ou receber uma atualização não esconde o botão de envio nem apaga a resposta. Prefira avisos curtos junto ao controle correspondente.
3. Meça carregamento e tamanho dos recursos. Use uma assinatura de dados adequada ao estado que cada cliente precisa ver. Evite reconstruir a página inteira a cada alteração de presença e enviar todo o histórico a cada rodada. Faça ajustes respaldados pelas medições e confira ausência de regressões.
4. Gere o HTML autocontido da revisão final e publique pelo fluxo existente. Inclua instrução curta para criar sala, compartilhar e jogar. Atualize o README com o nome público, URL funcional, comandos de desenvolvimento e limitações reais. Preserve a autorização separada para uma eventual renomeação do repositório.

## Testes e aceite

- Repita frases, ranking e misto em duas sessões independentes no site publicado. Valide convite copiado, apelidos, dicas, palpites privados, empate, encerramento, reentrada, pontuação final e feedback de erro.
- Faça o teste entre aparelhos físicos para os fluxos multiplayer que serão anunciados como validados. Registre navegadores e ambientes, inclusive a diferença entre teste com viewport móvel e aparelho real. Se faltar uma plataforma, indique qual ficou pendente.
- Abra o HTML por duplo clique com a rede desligada e confirme os dois jogos no modo local. Compare identidade, regras e edição do catálogo com a revisão publicada. Confirme que o link para jogar leva ao site e que o HTML entregue é baixável.
- Entregue os dois links, commit publicado, resultados da verificação final, limitações comprovadas e um roteiro de três passos para Felipe começar a primeira partida.
