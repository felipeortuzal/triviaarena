# Etapa 5 — Estimativa de Ranking e modo misto

**Comando:** `execute etapa 5`. Siga o [contrato de execução](../../AGENTS.md) e consulte o [progresso](README.md).

**Objetivo.** Colocar Estimativa de Ranking e Misturado no mesmo fluxo de salas e oferecer partidas completas, com resultado explicável e palpites privados até a revelação.

## Implementação

1. Comece pelas quatro listas existentes. Adapte a tela aos campos reais `source`, `url`, `about` e `snapshot`. Mostre nome e link da fonte, edição/data, critério, tamanho do recorte e posição-alvo. Verifique o destino do link. Habilite somente listas com ordem e referência justificáveis.
2. O palpite é o nome de um item. Resolva nomes canônicos e aliases por lista. Normalize acentos e caixa. Detecte ambiguidade e itens fora do recorte. Defina o comportamento para palpite vazio ou desconhecido. Permita ao anfitrião corrigir uma posição com justificativa visível antes de confirmar o resultado.
3. Cada jogador envia ou atualiza apenas o próprio palpite na rodada aberta. Publique para os demais apenas o estado de envio previsto pelo produto. Isole os valores por jogador no banco, valide o ID ativo e a fase. Ao fechar, congele as respostas e calcule resultado reproduzível. Sem uma fronteira entre estado público e palpites privados, uma regra no filho não revoga leitura dada no pai. Documente o limite de confiança da arquitetura se o catálogo de respostas for enviado ao navegador.
4. Use distância absoluta entre a posição real do item e a sorteada. Preserve a regra existente de empate por distância e distribuição 5/3/1 segundo a colocação, com exemplos. Apure uma única vez por ID de rodada e some inclusive a última antes do fim da partida. Palpite inválido não recebe ponto.
5. No modo misto, alterne os dois jogos mantendo um único placar, histórico e anfitrião. Preserve o texto que está sendo digitado se outro jogador enviar ou sair. Atualize o HTML local para demonstrar ambos os jogos.

## Testes e aceite

- Crie uma lista sintética identificada como fixture de teste. Com alvo 5, posições 5, 4 e 6 produzem distâncias 0, 1 e 1 e lugares 1, 2 e 2. Cubra ainda posição 1, última posição, fora do recorte, alias, empate integral, palpite vazio, correção e ausência de envio.
- Com contas distintas, tente ler o palpite alheio antes da revelação, escrever pelo outro UID, alterar após o fechamento e escrever em rodada passada. Confirme as recusas no backend. Teste envio concorrente ao fechamento.
- Complete uma partida de ranking e uma mista com dois clientes e atualização durante digitação. Verifique resultados idênticos após recarregar e após tentar apurar duas vezes. Repita no ambiente publicado se disponível. Registre separadamente as verificações locais e reais.
