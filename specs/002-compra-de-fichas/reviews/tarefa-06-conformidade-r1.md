# Parecer de Conformidade — Tarefa 6

**Veredito:** APROVADO

Rodei `npm test` (14 arquivos, 206 testes, todos passam) e `npm run lint` (sem erros). O diff rastreado se limita a `wallet.routes.ts` (+7 linhas, só a rota `pagamento`). Os demais arquivos da tarefa são novos: `pages/payment-method/*` e `public/icons/*`. Não alterei nada.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA6: Pix cria `Order` e `Payment` `PENDING` e só então navega para `/cofrinho/pix`; saldo inalterado | atendido | `payment-method.page.ts:102-115`; teste `spec.ts:175-211` (navegação só após o flush do `/payments`, `tokenBalance` continua 10) |
| CA10: retentativa com pedido `PENDING` usa `createPaymentForOrder`, sem POST em `/orders` | atendido | `page.ts:39-50,105-107`; teste `spec.ts:225-248` (`expectNone` em `/orders`, `orderId` `order-9`) |
| CA12: clique duplo bloqueado na interface e no service | atendido | `page.ts:59-62,92,102`; `wallet.service.ts:247,317`; teste `spec.ts:250-267` |
| CA14: servidor fora do ar | atendido | `payment-method.page.html:32-50`; teste `spec.ts:269-292` |
| Decisão: textos dos botões | atendido | `page.ts:64-69`; testes `spec.ts:158-173,190` |
| Decisão: precedência do pedido `PENDING`; sem nada, redireciona para `/cofrinho/comprar` | atendido | `page.ts:39-50,71-77`; testes `spec.ts:225-248,294-312` |
| Decisão: Cartão navega para `/cofrinho/cartao` sem criar nada | atendido | `page.ts:96-100`; teste `spec.ts:213-223` |
| Decisão: sem etiqueta "SELECIONADO"; seta de voltar para `/cofrinho/comprar` | atendido | `html:2-8`; não há "SELECIONADO" no template |
| Decisão e Assunção 6: ícones exportados do Figma, `<img>` com `alt=""` e `aria-hidden`, sem `<svg>` no HTML | atendido | `html:61,108,134`; `public/icons/{ticket,card,bolt}.svg` (ficheiros exportados do Figma com `id="icon-ticket"` e `id="Container"`); teste `spec.ts:331-348` confere que o arquivo existe em `public/` |
| Decisão: mensagens de erro do `WalletService`; conta bloqueada usa `accountBlockMessage` | atendido | `html:24-31`; teste `spec.ts:314-329` |
| `wallet.routes.ts` ganhou só a rota `pagamento` (não `pix`, `cartao`) | atendido | `wallet.routes.ts:17-23` |
| Nada fora do escopo alterado (WalletService, casca, auth, buy-tokens, wallet-overview, spec.md, plan.md) | atendido | `git diff --stat` (sem `db.json`) lista apenas `wallet.routes.ts` |

### Os testes provam os cenários?
- **Sucesso:** sim. O teste exige que `navigate` não tenha sido chamado após o POST `/orders` nem antes do flush do POST `/payments`. Também confere os corpos enviados, o botão desabilitado com "Gerando Pix..." e o saldo inalterado.
- **Servidor fora do ar:** sim. O teste confere a mensagem em `[role=alert]`, que não houve navegação, que o rascunho, o resumo e o método foram preservados, e o botão "Tentar novamente". Também refaz a criação com sucesso e navega.
- **Clique duplo:** sim, no nível da página. O teste dispara um clique e duas chamadas a `confirm()`, e depois `post('/orders')` com `expectOne` garante um único POST. A guarda do service (`wallet.service.ts:247,317`) não é isolada aqui. A guarda da página já barra a segunda chamada antes de chegar ao service.
- **Retentativa:** sim. O teste usa `expectNone` em `/orders` e confere o `orderId` no POST de `/payments`.
- **RED real:** não consigo comprovar. A tarefa não tem commit, então não há histórico para ver o teste falhando antes da implementação. Os testes estão bem formulados e cada um falharia sem a lógica correspondente.

## Apontamentos
Nenhum bloqueante. As observações abaixo são não bloqueantes, só para a triagem do usuário.

1. **Falha no carregamento da carteira (CA14, "ao carregar a carteira") não tem teste nesta página.**
   - Se `loadWalletData` falhar e não houver rascunho nem pedido, a página redireciona para `/cofrinho/comprar` (`page.ts:73-76`) e a mensagem de erro se perde.
   - Se houver rascunho, o botão "Tentar novamente" chama `confirm()`, não recarrega a carteira.
   - A spec define "Tentar novamente" apenas para o envio, por isso não reprovo.

2. **Pedido órfão se `POST /orders` der certo e `POST /payments` falhar.**
   - O service não rastreia o `Order` criado, e a retentativa cria outro. A causa está no `WalletService`, fora do escopo desta tarefa. Pode virar Issue de manutenção, junto da limitação já registrada na spec.

3. **Seta de voltar como glifo de texto `&larr;` (`html:7`).**
   - O Figma tem um ícone de seta (captura mobile). A regra 02 §4 manda exportar ícones do Figma.
   - A tarefa 5 usa o mesmo glifo (`buy-tokens.page.html:7`) e foi aceita, mas vale uma decisão sua. A lista de ícones da spec cita só ingresso, cartão e raio.

Arquivos relevantes:
- `C:\Users\danie\Documents\utfgo\apps\web\src\app\features\wallet\pages\payment-method\payment-method.page.ts`
- `C:\Users\danie\Documents\utfgo\apps\web\src\app\features\wallet\pages\payment-method\payment-method.page.html`
- `C:\Users\danie\Documents\utfgo\apps\web\src\app\features\wallet\pages\payment-method\payment-method.page.spec.ts`
- `C:\Users\danie\Documents\utfgo\apps\web\src\app\features\wallet\wallet.routes.ts`
