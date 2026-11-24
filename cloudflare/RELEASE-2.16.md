# Riviera Showdown 2.16 — Discovery & Variety

- 500 rankings e 35.849 posições preservados.
- Pesos por fonte usam raiz quadrada da quantidade de listas da fonte, reduzindo concentração de recortes da mesma coleção. Fontes recentes continuam com peso 0,35; todos os rankings têm chance positiva.
- Catálogo com busca por fonte, data e título, filtro por tamanho e por elegibilidade do modo da turma, contagem dos resultados e estado vazio.
- Corrigido contador de listas do lobby quando a configuração não está disponível.
- A revisão anterior ae9a513 foi publicada diretamente no Cloudflare depois de passar nos testes, usando os assets existentes. Para deploy automático via GitHub, ainda é necessário configurar CLOUDFLARE_API_TOKEN e CLOUDFLARE_ACCOUNT_ID.
