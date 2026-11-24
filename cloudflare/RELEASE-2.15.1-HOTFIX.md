# Correção de avanço de rodada

Ações do anfitrião (iniciar, avançar, revanche) não são descartadas quando uma confirmação anterior ainda está sincronizando. A intenção é vinculada à sessão e à rodada original; se a rodada já mudou, não é reenviada. O teste de quatro navegadores seleciona explicitamente cinco rodadas clássicas e verifica a transição em todos os participantes.