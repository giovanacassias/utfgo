# Decisões — Tarefa 9, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Pluralização errada com 1 ficha ("1 fichas") nas telas novas: quantidade e novo saldo no Aprovado (`payment-approved.page.html:112,146`) e quantidade na Falha (`payment-failed.page.html:128`); as outras telas do fluxo já tratam o singular | código (bloqueante) | aceito | Segue a recomendação do revisor: erro visível para quem compra 1 ficha e inconsistente com o resto do fluxo. A correção cria um helper único de rótulo em `wallet.model.ts` e o usa só nas duas telas novas (sem mexer nas telas antigas). |
| 2 | Nenhum teste cobre 1 ficha (`payment-approved.page.spec.ts` e `payment-failed.page.spec.ts` só usam 8 fichas) | código (bloqueante) | aceito | Sem o teste a regressão volta sem alarme. Entra um caso por tela com `tokensCount: 1` (e saldo 1 no Aprovado), escrito antes da correção (RED por asserção). |

Conformidade: aprovado, sem apontamentos. Sugestões de conformidade (setas de voltar, largura do "Cancelar pedido" no desktop) e sugestões de código não promovidas ficam como candidatas a manutenção, sem correção nesta tarefa: lógica de falha de navegação repetida em 4 páginas; duplicação mobile/desktop no HTML; contraste de `text-danger` sobre `bg-danger-surface`; link "Voltar" da Falha sem respeitar `busy()`; testes acoplados a classes CSS; `publicFileExists` copiado em 5 specs; `ready` como `signal`; cabeçalho da casca com "1 fichas" e saldo desatualizado; helper único de rótulo para as 4 cópias antigas.
