# Parecer de Código — Tarefa 3

**Veredito:** APROVADO (nenhum apontamento bloqueante)

`npm test` na raiz: 10 arquivos e 137 testes passando. O diff toca só `wallet.service.ts` e `wallet.service.spec.ts`. `git status --short` mostra apenas esses dois arquivos modificados e nenhum não rastreado.

## Apontamentos (bloqueiam)
Nenhum.

Verifiquei os critérios de reprovação do revisor e não encontrei violação:
- Camadas: o acesso HTTP fica no service da feature `wallet`, com `inject()` e signals privados expostos como `asReadonly`. Não há componente falando com o servidor (`architecture.md` §2.1 e §4).
- Tipagem: não há `any`. Os `catch` usam `unknown`, e os payloads são tipados com `Order`, `Payment` e `Wallet`.
- Tratamento de erro: nenhuma falha é engolida.
  - Os `catch {}` de `compensatePartialConfirmation` convertem a falha em `compensated = false`.
  - Esse valor vira a mensagem "recarregue a carteira", e o retorno é sempre `false`. O sucesso nunca é reportado falsamente (CA14 e CA15).
- Segredos: não há URL fixa no código; a URL vem do token `WALLET_API_URL`.
- Duplicação: não encontrei regra equivalente em outro lugar do repo.
- Testes: verificam a ordem das requisições (`expectNone` antes do flush), o corpo de cada PATCH e o caminho de rollback.
  - O rollback é testado nos três casos: falha em Order, falha em Wallet e falha da própria compensação.
  - A idempotência é testada com duplo clique e com pedido `COMPLETED` ou pagamento `PAID`.
  - O `afterEach` com `httpMock.verify()` garante que nenhuma requisição ficou pendente.

## Sugestões (não bloqueiam)
- **Guardas repetidas:** a sequência "bloqueio de conta, busca de payment/order, status `PENDING`" aparece em `confirmPayment`, `failPayment` e `cancelOrder` (`wallet.service.ts` ~373-470) e se repete nos métodos da parte 1. Dá para extrair um helper que devolva `{payment, order}` ou uma mensagem de erro.
- **Atualização do signal em `confirmPayment`:** `(paidPayment ?? item)` e `(completedOrder ?? item)` existem só para satisfazer o narrowing do TypeScript dentro do closure.
  - Seria mais limpo usar `const` locais por etapa e deixar as variáveis `let | null` apenas para o rollback.
  - `failPayment` e `cancelOrder` já usam o resultado direto.
- **Saldo calculado no cliente:** `wallet.tokenBalance + order.tokensCount` usa o saldo local lido antes dos `await`, ou seja, é um read-modify-write. Com duas abas abertas haveria perda de crédito. Para o mock com `json-server` é aceitável; vale um comentário `TODO #2`, já que o backend real faz isso em `prisma.$transaction`.
- **Caminhos de erro sem teste:**
  - `failPayment` e `cancelOrder` com erro de rede (o catch e a mensagem não têm cobertura).
  - `confirmPayment` com conta `SUSPENDED` ou `BANNED` (CA13).
  - `confirmPayment` com `paymentId` inexistente e com carteira ausente.
- **Teste de RNF06 (CA8):** o regex `/4111|cvv|cardNumber|number|expiry|validade|holder/i` roda só sobre os corpos que o service monta, e o service não recebe dado de cartão. A prova é fraca, mas aceitável. O regex é amplo e frágil: `number` casaria com um campo legítimo futuro. Considere asserir `Object.keys(body)` contra uma lista fechada, que o `toEqual` já faz em parte.
- **`tick()` com `setTimeout(0)`:** acopla o teste ao agendamento das continuações dos `await`. Funciona hoje, mas é um ponto de fragilidade em refatorações.
- **`confirmSuccessfully`:** o helper retorna `string[]` com `JSON.stringify` só para o teste de cartão. Poderia devolver os objetos de corpo.
- **Teste de cancelamento:** "cancela e bloqueia confirmação posterior" mistura duas asserções em um único `it`.

## Observações fora do escopo deste diff
- `cancelOrder` não toca no `Payment` `PENDING` do pedido cancelado, e o CA11 não exige isso. O extrato fica com Order `CANCELLED` e Payment `PENDING`. Vale conferir se a UI trata esse caso, ou abrir uma Issue.
- Quando a compensação falha, os signals locais continuam `PENDING` enquanto o servidor pode estar `PAID` ou `COMPLETED`. A mensagem orienta recarregar, mas não há retry automático de `loadWalletData`. Candidato a melhoria futura.

**Lista numerada de apontamentos bloqueantes:** nenhuma.
