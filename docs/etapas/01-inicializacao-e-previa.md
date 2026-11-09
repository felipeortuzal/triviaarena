# Etapa 1 — Inicialização, marca e prévia HTML

**Comando:** `execute etapa 1`. Siga o [contrato de execução](../../AGENTS.md) e consulte o [progresso](README.md).

**Objetivo.** Fazer o aplicativo sair de “Carregando jogos…”, exibir Riviera Showdown e entregar a primeira prévia executável por duplo clique. Preserve a base dos dois modos para as próximas etapas.

## Implementação

1. Compare o HEAD com a auditoria. No commit original, rode `node --check app.js` e localize a interpolação inválida em `letters()`. Se a falha já tiver sido corrigida, confirme o carregamento real e trabalhe nas demais lacunas.
2. Separe a inicialização da interface da conexão externa. Carregue a tela inicial e permita visualizar Decifre a Frase quando o Firebase estiver ausente, a CDN falhar ou o conteúdo não carregar. Exiba uma ação de recuperação adequada a cada erro. Disponibilize criação online apenas com conexão apta.
3. Aplique Riviera Showdown ao título, cabeçalho, logo, ícone, textos acessíveis e instruções relevantes. Crie uma marca legível na tela do celular. Preserve o caminho do repositório, parâmetros de convite e compatibilidade com os dados atuais.
4. Reaproveite o renderizador e os dados para gerar `riviera-showdown.html` como arquivo único. Incorpore assets e dados de que a experiência local precisa. Abra uma rodada de demonstração, mostre as duas dicas, revele a resposta e avance. Identifique “Jogar neste aparelho”. Separe o carregamento opcional do Firebase para o arquivo funcionar em `file://` mesmo sem internet. Evite manter uma segunda implementação manual do jogo.
5. Acrescente um teste de regressão de inicialização cujo resultado falhe se o módulo deixar de compilar ou a interface nunca sair do carregamento. Documente o comando reprodutível.

## Testes e aceite

- Abrir a versão HTTP em uma rota com prefixo `/triviaarena/`. Conferir nome, logo, escolha de modo e ausência de exceção fatal no console.
- Abrir o HTML baixado por `file://`, com a rede desligada, e jogar a rodada de demonstração. Em uma janela estreita, alcançar todos os controles sem rolagem horizontal da página.
- Simular configuração ausente e indisponibilidade da dependência externa. Registrar o comportamento e confirmar que o modo local continua acessível.
- Entregar o HTML testado, o commit e o resultado de cada cenário. O milestone é a inicialização e a prévia local.
