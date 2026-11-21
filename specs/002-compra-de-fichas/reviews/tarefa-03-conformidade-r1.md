# Parecer de Conformidade — Tarefa 3

**Veredito:** APROVADO

`npm test` na raiz: 10 arquivos e 137 testes passando. `git status --short` mostra só `wallet.service.ts` e `wallet.service.spec.ts` modificados, sem arquivo não rastreado, então nada fora do escopo previsto foi alterado.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA7 — Payment `PAID` com `paidAt`, Order `COMPLETED`, `tokenBalance` + `tokensCount` | atendido na camada de serviço. O redirecionamento para `/wallet/approved` é UI e fica para tarefa posterior. | `apps/web/src/app/features/wallet/services/wallet.service.ts:378-465`, com os PATCH em sequência em `:417-433`. Teste em `wallet.service.spec.ts` no `describe` "Pix confirmation (CA7)", via `confirmSuccessfully`. O helper confere o corpo de cada PATCH e a ordem Payment, Order, Wallet com `expectNone`. |
| CA8 — Cartão aprovado e `RNF06` | atendido na camada de serviço. A validação dos campos do formulário é UI e fica para tarefa posterior. | `confirmPayment` só envia `status`, `paidAt`, `tokenBalance` e `updatedAt`. Teste no `describe` "credit card approval and RNF06 (CA8)", com regex negativa sobre os corpos e asserção de `method` `CREDIT_CARD` e `status` `PAID`. |
| CA9 — Falha: Payment `FAILED`, Order `PENDING`, saldo intacto | atendido na camada de serviço. O redirecionamento para `/wallet/failed` é UI. | `failPayment` em `wallet.service.ts:467-514`. Teste no `describe` "failure simulation (CA9)": corpo `{status:'FAILED'}`, Order `PENDING` e `wallet` igual ao original. Há também teste de rejeição quando o Payment não é `PENDING`. |
| CA11 — Cancelamento e bloqueio de confirmação posterior | atendido | `cancelOrder` em `wallet.service.ts:515-553`. O guard de `order.status !== 'PENDING'` em `:393`. Teste no `describe` "order cancellation (CA11)": cancela, mantém saldo 10 e `confirmPayment` retorna `false` sem HTTP (garantido por `httpMock.verify()`). |
| CA12 — Idempotência e duplo clique | atendido no Service. O bloqueio de botão na UI fica para tarefa posterior. | Guard de `_loading` em `wallet.service.ts:379`. Guards de Order e Payment em `:393-398`. Testes no `describe` "idempotency (CA12)": a segunda chamada durante o loading retorna `false`, `httpMock.match` mostra só 1 PATCH de payment e o crédito ocorre uma vez (saldo 15). Há ainda testes para Order `COMPLETED` e Payment `PAID` sem HTTP. |
| CA14 — Erro de rede ao confirmar | atendido no Service. O botão "tentar novamente" na UI fica para tarefa posterior. | `wallet.service.ts:451-460`. Teste no `describe` "network failure on confirmation (CA14)": mensagem contém "conectar", `draftTokensCount` preservado, estado intacto, `loading` falso e nova tentativa possível. Não há falso sucesso. |
| CA15 — Compensação em falha parcial | atendido | `compensatePartialConfirmation` em `wallet.service.ts:556-585`. Três testes no `describe` "compensation on partial failure (CA15)": falha no Order reverte o Payment para `{status:'PENDING', paidAt:null}`. Falha no Wallet reverte primeiro o Order e depois o Payment. Se a própria compensação falha, retorna `false` e a mensagem diz "recarregue". Os três conferem que não houve sucesso reportado e que o estado local ficou intacto. |

## Avaliação do RED ausente
Os testes detectariam as regressões plausíveis, mesmo sem RED verdadeiro.

- **Guard de `_loading` removido:** `httpMock.match` retornaria 2 PATCH de payment e `toHaveLength(1)` falharia.
- **Guards de Order/Payment removidos:** `httpMock.verify()` em `afterEach` acusaria requisições inesperadas.
- **Ordem ou corpos dos PATCH alterados:** `expectOne`, `expectNone` e `toEqual` nos corpos falhariam.
- **Compensação removida ou invertida:** `expectOne` do rollback falharia, e os corpos do rollback são verificados.
- **Crédito duplicado:** o saldo 15 é verificado.

Ressalva não bloqueante: no teste de CA8, a regex negativa é quase tautológica, porque `confirmPayment` só recebe `paymentId`. O RNF06 fica provado de fato pela forma da assinatura e pelos `toEqual` exatos dos corpos nos helpers, que já bastam. O teste de CA8 não exercita o ramo de cartão no serviço (ele é igual ao do Pix), o que é coerente com o plano.

## Escopo e rastreabilidade
- Só os dois arquivos previstos foram alterados. Nada de `auth/`, `docs/checklist.md` ou componentes.
- `failPayment` e `cancelOrder` não verificam bloqueio de conta, o que é compatível com a spec. CA13 cobre apenas acesso e início ou confirmação de compra, e `confirmPayment` já aplica o bloqueio em `wallet.service.ts:383-387`.
- Os pontos de simulação têm `// TODO #2`: o webhook em `:417` e a falha simulada em `:493`. O `cancelOrder` não tem TODO, o que é correto, pois não é ponto de simulação de gateway.
- Os termos do código (`Order`, `Payment`, `Wallet`, `tokenBalance`, `tokensCount`, `PAID`, `COMPLETED`) seguem o glossário.

## Apontamentos
Nenhum bloqueante.

Arquivos relevantes:
- `C:\Users\danie\Documents\utfgo\apps\web\src\app\features\wallet\services\wallet.service.ts`
- `C:\Users\danie\Documents\utfgo\apps\web\src\app\features\wallet\services\wallet.service.spec.ts`
