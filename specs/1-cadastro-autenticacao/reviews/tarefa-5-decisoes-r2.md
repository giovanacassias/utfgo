# Decisões — Tarefa 5, rodada 2

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | O fundo da aplicação continua parcialmente focável com a gaveta aberta; controles descartáveis do `app.html` ficam fora do `inert`. | conformidade/código | aceito | A spec atualizada exige que o AppShell seja a única superfície interativa nas rotas autenticadas e que o fundo não receba foco enquanto a gaveta estiver aberta. |
| 2 | Ao cruzar de 1023 px para 1024 px, o fechamento tenta focar o botão `☰` oculto e perde o foco. | conformidade/código | aceito | A spec atualizada exige encaminhar o foco para um controle visível e interativo do menu desktop durante a transição responsiva. |
