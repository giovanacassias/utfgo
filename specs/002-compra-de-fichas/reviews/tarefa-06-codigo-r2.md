# Parecer de Código — Tarefa 6 (rodada 2)

**Veredito:** APROVADO

Verifiquei: `npm test` passa (14 arquivos, 212 testes) e `npm run lint` passa sem erros.

## Apontamentos (bloqueiam)
Nenhum.

## Correção do apontamento da rodada 1
A correção está certa e fica na raiz, em `wallet.service.ts:183-193`.
- `setDraftTokensCount` com valor válido grava o rascunho e zera `_activeOrderId` e `_activePaymentId`.
- `null` e valores inválidos retornam antes de tocar no pedido ativo.
- Não alterei nada. A mudança no `WalletService` é só essas duas linhas mais o comentário.
- Os testes novos em `wallet.service.spec.ts` ("new draft vs active Order") cobrem cinco casos:
  - rascunho válido limpa o pedido selecionado;
  - rascunho válido limpa o pedido criado por `createOrderAndPayment`;
  - `null` e `0` preservam o pedido ativo;
  - retomar pedido sem rascunho mantém o pedido;
  - `selectActiveOrder` depois do rascunho mantém os dois, e a retentativa vence.
- Eles testam comportamento observável (signals públicos), não detalhe de implementação.
- Não houve regressão: os 212 testes passam.

## Robustez da regra "dependente de ordem"
Verifiquei todos os chamadores de produção com grep. Só existem dois, e nenhum fluxo real quebra a regra:
- `buy-tokens.page.ts:162` (`advance`) chama `setDraftTokensCount` e navega. Compra nova sempre começa por esse caminho e limpa o pedido antigo. Esse era o bug.
- `wallet-overview.page.ts:70` (`resumeOrder`) chama `selectActiveOrder` e navega. Não mexe no rascunho.
  - Se sobrar um rascunho antigo, a tela de pagamento prioriza o pedido `PENDING` (`payment-method.page.ts:39-43`), então a retomada cobra o pedido certo.
  - Ao voltar para buy-tokens e avançar, o rascunho novo zera o pedido. Também está certo.
- Volta do Pix para a tela de pagamento não chama nenhum dos dois setters. O pedido criado por `createOrderAndPayment` continua ativo, então "Tentar novamente" reaproveita o mesmo pedido via `createPaymentForOrder`, que é o comportamento esperado (CA10).
- Não existe caminho em que `selectActiveOrder` seja chamado antes de `setDraftTokensCount` no mesmo fluxo. A ordem hoje é determinada por quem chama (buy-tokens só chama o setter de rascunho, overview só chama o seletor). Por isso a regra é robusta com o código atual.

## Sugestões (não bloqueiam)
- O acoplamento é implícito: quem chamar `selectActiveOrder` e depois `setDraftTokensCount` perde a retentativa sem erro. O comentário em `wallet.service.ts:190` e o teste "retry wins" documentam isso. Se surgir um terceiro chamador, vale um JSDoc em `setDraftTokensCount` descrevendo o contrato.
- Chamar `setDraftTokensCount(n)` com o mesmo `n` depois de gerar um pedido também descarta o pedido ativo. Isso é intencional e coerente com "compra nova", mas a próxima tela de pagamento criará outro pedido.

## Observações fora do escopo deste diff
- Os itens não promovidos da rodada 1 permanecem como candidatos a Issue de manutenção, sem reabertura:
  - destruição do componente durante `await loadWalletData()`;
  - falha no load sem rascunho;
  - setas do `role="radio"`;
  - glifo da seta de voltar;
  - `fs` via `getBuiltinModule`;
  - pedido órfão.

Arquivos relevantes:
- `C:\Users\danie\Documents\utfgo\apps\web\src\app\features\wallet\services\wallet.service.ts`
- `C:\Users\danie\Documents\utfgo\apps\web\src\app\features\wallet\services\wallet.service.spec.ts`
- `C:\Users\danie\Documents\utfgo\apps\web\src\app\features\wallet\pages\payment-method\payment-method.page.ts`
