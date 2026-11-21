# Parecer de Conformidade — Tarefa 6 (rodada 2)

**Veredito:** APROVADO

Rodei `npm test` (14 arquivos, 212 testes passando) e `npm run lint` (limpo). Não revertei a correção para ver o RED, porque sou somente leitura. A análise do RED abaixo vem da leitura do código.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA6: Pix cria Order e Payment `PENDING`, navega para `/cofrinho/pix` só depois do sucesso, saldo inalterado | atendido | `payment-method.page.ts:93-112`; spec `payment-method.page.spec.ts:~190-211` (`navigate` uma vez, saldo 10 preservado) |
| CA10: retentativa e "Retomar pagamento" reaproveitam o pedido ativo e criam só um Payment, sem segundo Order | atendido | `payment-method.page.ts:38-44` e `:99-101` (`createPaymentForOrder`); spec `:225-248` (`expectNone` de POST `/orders`; Payment com o mesmo `orderId`). `selectActiveOrder` (`wallet.service.ts:195`) não foi alterado. |
| CA12: clique duplo bloqueado na interface e no Service | atendido | `canConfirm` inclui `loading` e `submitting` (`payment-method.page.ts:60-63`); `submitting` é liberado no `finally` (`:96,:108`). Sem mudança nesta rodada; os testes de clique duplo seguem passando. |
| CA14: erro de rede mostra a mensagem do Service em `role="alert"`, mantém a tela, o resumo e o método, e oferece "Tentar novamente" | atendido | `payment-method.page.html:34-52`; a navegação só ocorre com `result !== null` (`payment-method.page.ts:105`). Sem regressão. |
| Decisão: precedência (pedido ativo `PENDING` vence o rascunho; sem os dois, redireciona para `/cofrinho/comprar`) | atendido | `payment-method.page.ts:36-50,:77-82` |
| Decisão: cartão navega para `/cofrinho/cartao` sem criar Order nem Payment | atendido | `payment-method.page.ts:92-96`; spec `:213-223` |
| Decisão: botões e rótulos ("Confirmar e gerar Pix", "Continuar com cartão", "Gerando Pix...") | atendido | `payment-method.page.ts:66-71` |
| Decisão: ícones em `apps/web/public/icons/` (`ticket.svg`, `card.svg`, `bolt.svg`) usados no HTML | atendido | `payment-method.page.html:59,:111,:148` |
| Rota `/cofrinho/pagamento` | atendido | `wallet.routes.ts:17-23` |

## Correção da rodada 2 (`WalletService.setDraftTokensCount`)
- **A mudança está correta e mínima.** Um rascunho válido novo limpa `_activeOrderId` e `_activePaymentId` (`wallet.service.ts:189-192`). Rascunho `null` ou inválido retorna antes dessa linha, então o pedido ativo é mantido.
- **A ordem do fluxo está coberta.** A retentativa chama `selectActiveOrder` depois do rascunho, e o teste `selecting an Order after the draft keeps both (retry wins)` prova que o pedido ativo sobrevive nesse caso.
- **Os únicos chamadores de produção são `buy-tokens.page.ts:162` e `wallet-overview.page.ts:70`.** Nenhum outro fluxo foi afetado.
- **Os testes provam a correção.**
  - `wallet.service.spec.ts` cobre cinco casos: rascunho novo limpa o pedido selecionado; limpa o pedido criado por `createOrderAndPayment`; `null` ou `0` mantém o pedido; retomar sem rascunho mantém o pedido; retentativa depois do rascunho mantém ambos.
  - `payment-method.page.spec.ts:250-273` cobre o cenário real (pedido antigo de 8 fichas, depois rascunho de 20). A tela mostra "20 fichas / R$ 40,00" e o `POST /orders` sai com `tokensCount: 20` e `amountCents: 4000`.
- **O RED é plausível.** Sem a linha nova, `activeOrderId` continuaria `order-old` e as asserções `toBeNull()` e "20 fichas" falhariam. Nenhuma delas é satisfeita por um mock.

## Apontamentos
Nenhum bloqueante.

Observação não bloqueante: o bloco "Limitação conhecida" em `spec.md:121` ficou obsoleto, porque a decisão r1 diz que a limitação deixa de existir. A spec é do usuário, então a edição fica com ele, se quiser.
