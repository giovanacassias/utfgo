# Decisões — Tarefa 5, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | A gaveta não mantém o foco dentro dela para usuários de teclado; ao abrir, o foco permanece no botão `☰`, e `Tab`/`Escape` podem alcançar ou operar fora da gaveta. | código | aceito | O comportamento deve ser acessível também por teclado: a abertura deve mover o foco para a gaveta, o foco deve permanecer no contexto da gaveta enquanto ela estiver aberta, `Escape` deve fechá-la e o fechamento deve devolver o foco ao botão `☰`. |
