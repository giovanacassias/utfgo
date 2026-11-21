# Parecer de Conformidade — Tarefa 9 (rodada 2)

**Veredito:** APROVADO

Testes: `npm test` na raiz, 18 arquivos e 346 testes, todos passando. `npm run lint`: sem erros nem avisos.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA7: aprovado exibe resumo da compra e novo saldo (Pix) | atendido | payment-approved.page.html (linhas do resumo, `data-summary-balance`, `balanceLabel()`); spec: teste "shows the receipt" (8 fichas, saldo 15 fichas) |
| CA8: cartão leva a /cofrinho/aprovado, rótulo "via Cartão", pílula "CARTÃO APROVADO" | atendido | payment-approved.page.ts (`methodLabel`, `pillLabel`); teste "labels the total via Cartão" |
| CA9: falha mostra motivo, ID da transação e resumo do pedido; saldo intocado (telas só leem) | atendido | payment-failed.page.html (`data-summary-reason`, `data-summary-transaction`, `data-summary-quantity`); teste "is read-only" na tela Aprovado |
| CA10: "Tentar novamente" e "Escolher outra forma" sobre o mesmo pedido | atendido, sem regressão | payment-failed.page.html (`data-try-again`, `data-other-method`) e a lógica do .ts não foi alterada; testes da tela Falha passam |
| CA11: "Cancelar pedido" na tela Falha | atendido, sem regressão | payment-failed.page.html (`data-cancel`) |
| CA14: erro de navegação e de rede tratado, sem sucesso falso | atendido, sem regressão | blocos `data-navigation-error` e `data-error`; testes de falha de navegação e clique duplo passam |
| Bloco de decisões: resumo do Aprovado (quantidade, unitário, total, data `dd/MM/yyyy HH:mm`, ID, "Novo saldo") | atendido | payment-approved.page.html |
| Bloco de decisões: resumo da Falha (quantidade, total, data, ID, motivo em `danger`; subtítulo e pílula por método) | atendido | payment-failed.page.html (`texts()`) |
| Bloco de decisões: "Buscar carona" desabilitada com "Em breve" | atendido | payment-approved.page.html, nas versões mobile e desktop |
| Bloco de decisões: ações sem criar novo Order, com trava e tratamento de falha de navegação | atendido, sem regressão | payment-failed.page.ts e .html |
| Bloco de decisões: redirecionamento a /cofrinho sem pedido ou pagamento válidos | atendido | testes de redirecionamento passam |
| Correção da rodada 2 (decisões r1, itens 1 e 2) | atendido | `formatTokensLabel` em wallet.model.ts (+ teste para 0, 1, 2, 8 e 100); `quantityLabel` e `balanceLabel` no Aprovado; `quantityLabel` na Falha; testes com 1 ficha em payment-approved.page.spec.ts (quantidade e saldo "1 ficha") e payment-failed.page.spec.ts:169-172 |
| Texto da spec preservado | atendido | Os textos fixos continuam os da spec: "Quantidade adquirida/solicitada", "Valor unitário da ficha", "Total pago via Pix/Cartão", "Novo saldo", "Motivo da falha", "Resumo da compra/do pedido", "Tentar novamente", "Escolher outra forma de pagamento", "Cancelar pedido", "Ir para o cofrinho". Só a pluralização mudou. |
| Ajustes de cor feitos pelo orquestrador (cabeçalho do resumo mobile `bg-secondary`, botões mobile da Falha, "Ir para o cofrinho" mobile, `font-normal` em unitário e data do Aprovado) | atendido | Mudaram só classes. Nenhum texto, `data-*` ou comportamento foi alterado, e a spec exige "cores só por tokens". `bg-secondary`, `text-on-tertiary`, `bg-primary` e `border-border` são classes de token. Os testes que checam a pílula (`bg-success`, sem `text-white`) passam. |
| Escopo: nada fora da tarefa foi tocado | atendido | O diff de `wallet.model.ts` só acrescenta `formatTokensLabel`. Nas telas antigas (`card-payment.page.ts`, `pix-payment.page.ts`) só saíram os comentários `TODO #2` e a rota continua apontando para as novas telas (já constava na rodada 1). `wallet.routes.ts` só ganhou `aprovado` e `falha`. `wallet.service.ts` e o app-shell não aparecem no diff nem no status. `spec.md` e `plan.md` têm só o diff da tarefa 9, que é o bloco de decisões e a linha de registro. Nenhum outro arquivo de código ou de spec foi alterado. |

## Apontamentos
Nenhum.

Observação sem efeito sobre o veredito, e que é do revisor de código: em payment-approved.page.ts há `readonly isPix =computed` sem espaço após o `=`, e a linha do import de `formatTokensLabel` está longa (formatação). O lint passou.
