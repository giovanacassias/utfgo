# Decisões — Tarefa 7, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | A página some assim que a ação dá certo, antes da navegação, e não há saída se a navegação não acontecer (`pix-payment.page.html:1`, `pix-payment.page.ts:40-42,135`): `ready()` é um `computed` vivo e o resultado do `router.navigate` é ignorado | código (bloqueante) | aceito | — |
| 2 | Tamanhos fora da escala de tokens: `size-40`, `size-44`, `lg:min-h-24` e `lg:w-16` (`pix-payment.page.html:61,126,76,106`) | código (bloqueante) | recusado | As tarefas 4, 5 e 6 já usam tamanhos da escala do Tailwind para dimensões de layout (ex.: `size-32`, `w-40`), aceitos pelo dono; os tokens do projeto cobrem cor, fonte, raio e espaçamento. Trocar por tokens alteraria o tamanho do QR e do código e afastaria a tela do Figma. Fica como candidato a manutenção (registrar tamanhos de layout em `docs/design-tokens.md`). |

Sugestões não promovidas (candidatas a manutenção, sem correção nesta tarefa): `buildPixCopyPasteCode` sem validação de entrada e comentário sobre o comprimento das tags; temporizador do clipboard criado depois do destroy; `role="status"` na falha de cópia em vez de `alert`; duplicação de markup mobile e desktop (dois QR, duas etiquetas, dois botões); link de voltar sem `outline-offset`; ícones SVG exportados com cor fixa; teste do timer acoplado a `setTimeout`; comentário `// TODO #2` vago em `payment-method.page.ts`.
