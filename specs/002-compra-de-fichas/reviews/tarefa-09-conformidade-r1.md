# Parecer de Conformidade — Tarefa 9 (Rodada 1)

**Veredito:** APROVADO

Base: d3a5a5b9. Revisão somente leitura.

**Testes e lint (rodados na raiz)**
- `npm test`: 18 arquivos, 343 testes, todos passando.
- `npm run lint`: sem erros.

**Diff autorizado**
- `wallet.routes.ts`: acrescenta as rotas `aprovado` e `falha` com `loadComponent` e remove o comentário de "tarefa 9 pendente".
- `pix-payment.page.ts` e `card-payment.page.ts`: só 4 linhas de comentário `// TODO #2` removidas, sem mudança de lógica (confirmado via `git diff`).

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Guarda decidida uma vez no `ngOnInit` (Aprovado: `COMPLETED` + `PAID`, senão `/cofrinho`) | atendido | `payment-approved.page.ts:35-40`; testes spec:242, 250, 258 (sem HTTP) |
| Guarda da Falha (`PENDING` + `FAILED`, senão `/cofrinho`) | atendido | `payment-failed.page.ts:66-79`; testes spec:378, 386, 394 |
| Aprovado só lê `activeOrder`, `activePayment` e `wallet`; não escreve | atendido | `payment-approved.page.ts:18-20`; nunca chama writers do service. Teste "is read-only" em spec:266 |
| CA7 / CA8: resumo com quantidade, unitário (`TOKEN_UNIT_PRICE_CENTS`), "Total pago via Pix/Cartão", data `dd/MM/yyyy HH:mm` (`paidAt`), ID da transação | atendido | `payment-approved.page.html:108-140`; `payment-approved.page.ts:29-33` |
| CA7: linha "Novo saldo" a partir de `wallet().tokenBalance` | atendido | `payment-approved.page.html:141-148` |
| Pílula e rótulo por método (Pix / Cartão) | atendido | `payment-approved.page.ts:31-33`; spec:151 |
| CA9: motivo por método (Pix "Tempo limite de pagamento excedido", Cartão "Pagamento recusado pelo emissor do cartão"), subtítulo e pílula "CÓDIGO EXPIRADO" / "CARTÃO RECUSADO"; motivo em `danger` | atendido | `payment-failed.page.ts:17-30`; `payment-failed.page.html:149-154`; spec:169, 182 |
| CA9: resumo da falha (quantidade, total, data via `payment.createdAt`, ID da transação, motivo) | atendido | `payment-failed.page.html:124-155`. A data usa `createdAt`, como a spec manda. |
| CA10: "Tentar novamente" no Pix chama `createPaymentForOrder(orderId,'PIX')` e vai a `/cofrinho/pix` | atendido | `payment-failed.page.ts:125-132`; spec:205 |
| CA10: "Tentar novamente" no Cartão vai a `/cofrinho/cartao` sem chamada HTTP | atendido | `payment-failed.page.ts:126-129`; spec:234 |
| CA10: "Escolher outra forma de pagamento" vai a `/cofrinho/pagamento` sem HTTP | atendido | `payment-failed.page.ts:133-134`; spec:245 |
| CA10: mesmo `orderId`; a página não usa `createOrderAndPayment` nem `setDraftTokensCount`, e não há POST em `/orders` | atendido | Grep e leitura do `.ts`: só usa `createPaymentForOrder` e `cancelOrder`, com `order.id` do snapshot |
| CA10: snapshot do pedido e do pagamento no `ngOnInit`, para a tela não mudar durante a navegação após retry Pix | atendido | `payment-failed.page.ts:49-50, 66-75`; spec:222 |
| CA11: "Cancelar pedido" chama `cancelOrder`, volta a `/cofrinho`, sem confirmação | atendido | `payment-failed.page.ts:135-136`; `payment-failed.page.html:179-187`; spec:259 |
| Assunção 5: "Buscar carona" desabilitada com "Em breve" (mobile e desktop) | atendido | `payment-approved.page.html:80-87, 153-160`; spec:172 |
| "Ir para o cofrinho" leva a `/cofrinho` | atendido | `payment-approved.page.ts:42-60`; spec:183 |
| Trava de duplo clique: `loading` do service + `submitting` da página + `navigationFailed` | atendido | `payment-failed.page.ts:56-58, 99-116`; `payment-approved.page.ts:27, 42-60`; spec (Falha) 280 e (Aprovado) 197 |
| CA14 / falha de navegação: `false` ou rejeição mostram alerta com "Voltar ao Cofrinho" e bloqueiam novas ações | atendido | `payment-failed.page.ts:140-150`; `payment-failed.page.html:36-50`; spec (Falha) 349, 368 e (Aprovado) 215, 232 |
| CA14: erro de rede do service em `role="alert"` com "Tentar novamente" que repete a ação que falhou (Pix retry e cancelar) | atendido | `payment-failed.page.ts:93-97`; `payment-failed.page.html:51-68`; spec:307, 327 |
| Privacidade (RNF06): nenhum dado de cartão tocado nas duas páginas | atendido | Páginas só leem Order, Payment e Wallet. Sem `console`, `localStorage` ou `sessionStorage`. |
| Visual: imagens decorativas (`alt=""`, `aria-hidden`), mobile como base, desktop em `lg`, cores por tokens | atendido | Ambos os `.html`; spec "uses decorative img assets" (Aprovado 275, Falha 402) |
| Rotas `/cofrinho/aprovado` e `/cofrinho/falha` registradas | atendido | `wallet.routes.ts:33-46` |
| Destinos de Pix e Cartão para `/aprovado` e `/falha` (tarefas 7 e 8) | atendido | `pix-payment.page.ts:172-175`; `card-payment.page.ts:372-375` (só comentários removidos) |

## Apontamentos
Nenhum apontamento de conformidade.

## Sugestões (não bloqueantes; não alteram o veredito)
1. As setas de voltar (`&larr;`) das duas telas não são pedidas pela spec. Aprovado volta a `/cofrinho`; Falha volta a `/cofrinho/pagamento`. Seguem o padrão das telas vizinhas e o Figma mobile, então tratei como visual e não como escopo inflado. Se o dono quiser rigor máximo, confirme que isso vem do Figma.
2. O botão "Cancelar pedido" da Falha usa `lg:col-span-2` (largura total no desktop). A spec só pede o "mesmo visual do botão da tela Pix". Detalhe de layout para o revisor de código ou o dono avaliar.
3. A data da Falha usa `payment.createdAt` por decisão registrada do dono e está coerente com a spec. Nenhuma ação.

Fora do escopo desta revisão, por instrução: `db.json`, `launch.json`, `package*.json`, `architecture.md` e `specs/`. A verificação no navegador (393 e 1440 px, fluxos Pix e Cartão, F5, um Order com vários Payments) foi informada pelo orquestrador e não foi reexecutada pelo revisor.
