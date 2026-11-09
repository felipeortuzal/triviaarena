# Etapa 6 — Curadoria de frases e rankings

**Comando:** `execute etapa 6`. Siga o [contrato de execução](../../AGENTS.md) e consulte o [progresso](README.md).

**Objetivo.** Entregar mais variedade com dados que possam ser conferidos. Trabalhe no catálogo, importador e exibição de procedência. Preserve a compatibilidade com salas abertas e com a versão local.

## Implementação

1. Inventarie os 104 registros originais e o catálogo vigente. Corrija siglas incompatíveis com a resposta, fatos ambíguos e duplicatas exatas ou semânticas. Revise explicitamente “4 C no D H” e “5 O nos J O”. Identifique o mesmo fato com um ID estável. Guarde categoria, dificuldade, resposta, explicação, duas dicas progressivas distintas e referência adequada quando o fato depender de convenção ou data.
2. Em rankings, defina IDs estáveis da lista e dos itens, categoria temática, título, método, fonte com URL verificável, edição/data de referência, política de empates, nomes alternativos e itens ordenados. Preserve a diferença entre data da observação e edição da fonte. Mantenha gabarito e apresentação vinculados à versão que a sala iniciou.
3. Procure bases reais para futebol, outros esportes, cinema, música, geografia, história, ciência, economia, negócios, tecnologia e cultura geral. Use fontes primárias ou instantâneos identificáveis que permitam a reutilização prevista. Para rankings derivados, documente fórmula, população coberta e desempate. Não atribua posições exatas quando a fonte só fornece faixas. Mantenha uma lista como candidata se faltar fonte, licença adequada, cobertura ou verificação. Não complete lacunas com dados gerados.
4. Libere Top 10, 25, 50, 100, 250, 500 ou 1.000 conforme o número real de itens ordenados e verificados. Mantenha recortes já usados por salas existentes quando válidos. No importador, valide metadados, quantidade, duplicatas e aliases ambíguos. Retire apenas marcadores inequívocos de numeração, preservando nomes que começam com números. Diferencie catálogo oficial e listas fornecidas por um anfitrião.
5. Forneça validador reproduzível para esquema, tamanhos, IDs, aliases e datas. Para cada lista publicada confronte a ordenação do recorte com a fonte ou snapshot e registre o método de verificação. Quando a fonte for dinâmica, vincule o conjunto à edição usada.

## Testes e aceite

- Gere um inventário por tema e dificuldade com quantidades efetivas, tamanhos permitidos, fontes e limitações. Teste exemplos antes rejeitados por tradução e exemplos que continuam ambíguos.
- Importe uma lista válida e rejeite fonte ausente, duplicatas conflitantes, metadados inválidos e ordem incompleta. Confira que um título com algarismo inicial sobrevive à importação.
- Teste uma sala iniciada com o catálogo anterior e confira que ela exibe o mesmo gabarito. Publique somente o que conseguiu verificar e descreva temas restantes concretamente.
