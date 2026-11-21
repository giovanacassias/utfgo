# Parecer de Conformidade — Tarefa 7 (rodada 2)

**Veredito:** APROVADO

Testes: `npm test` passou (15 arquivos, 245 testes). `npm run lint` passou sem avisos. Li o diff completo contra `bae24b73` e os arquivos novos (`pix-payment.page.ts`, `.html`, `.spec.ts`). Não abri `qr-code.png`, `copy.svg` nem `sync.svg`; só conferi que o spec exige a existência deles em `public/`, e esse teste passa.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Apontamento 1 da r1: a página não some após a ação dar certo | atendido | `pix-payment.page.ts:50` (`ready` é um `signal`) e `:93-97` (decidido uma vez no `ngOnInit`). `pix-payment.page.html:1` usa `@if (ready())`. |
| Resultado do `router.navigate` não é mais ignorado | atendido | `pix-payment.page.ts:166-176` (`goToDestination` aguarda; `false` ou rejeição ativam `navigationFailed`). |
| Alerta de falha de navegação sem confundir com o erro do service e sem "Tentar novamente" | atendido | `pix-payment.page.html:30-43`: bloco próprio `data-navigation-error`, com `role="alert"`, link "Voltar ao Cofrinho" e sem `data-retry`. Fica antes do `@else if` de conta bloqueada e de `error()`, então não se mistura com o erro do service. |
| Ações bloqueadas após a falha de navegação (o pedido já mudou no servidor) | atendido | `pix-payment.page.ts:31-33` (`busy` inclui `navigationFailed`) e `:148` (`run` retorna se `busy`). O botão `data-retry` do bloco de erro do service também fica desabilitado por `busy()`. |
| Redirecionamento do `ngOnInit` sem pedido ou pagamento ativo, ou fora de `PENDING`, para `/cofrinho` (decisões, sem `loadWalletData`) | atendido | `pix-payment.page.ts:93-98`. Testes em `spec.ts` (sem pedido, sem pagamento, pedido não `PENDING`, pagamento não `PENDING`, e "does not reload wallet data"). |
| CA7: "Já realizei o pagamento" confirma, só navega depois do sucesso e credita 10 para 15 | atendido | `pix-payment.page.ts:115-117,148-165,184` e `.html:153-175`. Os testes cobrem os dois botões (mobile e desktop) e a ordem dos PATCH. |
| CA9: "Simular falha / expiração" usa `failPayment`, vai a `/cofrinho/falha` e mantém o saldo | atendido | `pix-payment.page.ts:119-121,186`. O teste "simulate failure" confere o body `FAILED`, o saldo 10 e a ausência de PATCH em `/wallets`. |
| CA11: "Cancelar pedido" usa `cancelOrder`, sem confirmação, volta a `/cofrinho` | atendido | `pix-payment.page.ts:123-125,188`; `.html:177-186`. |
| CA12: trava compartilhada e duplo clique | atendido | `pix-payment.page.ts:31-33,148,153-163`. Testes de duplo clique e de trava compartilhada entre as ações. |
| CA14: erro de rede mostra a mensagem do service em `role="alert"` e "Tentar novamente" repete a ação que falhou | atendido | `.html:55-71`, `pix-payment.page.ts:128-131`. Testes para aprovar, falhar e cancelar. |
| CA15: falha parcial mostra erro recuperável, sem navegar e com retry | atendido | Teste "partial failure on approve"; a compensação é do service, fora desta tarefa. |
| Decisões da tela: copiar (`navigator.clipboard`, "Código copiado!" por 2 s em `role="status"`, timer limpo, mensagem de falha manual) | atendido | `pix-payment.page.ts:100-113,43-45`. |
| Decisões da tela: conteúdo, QR em `qr-code.png`, código derivado do `gatewayPaymentId` e do valor, 3 passos, etiqueta nos dois tamanhos, sandbox e valor só no desktop | atendido | `.html:61,126`, `wallet.model.ts:80-90`. |

## Os testes provam a correção?
Sim.
- O grupo "after a successful action (page must not vanish)" usa `navigate` pendente e verifica o conteúdo no DOM logo após o último PATCH, para aprovar, falhar e cancelar.
- O grupo "navigation failure" cobre `false` e rejeição. Verifica o alerta, o link `href="/cofrinho"` e a ausência de `[data-error]` e `[data-retry]`. Verifica também `submitting()` em `false`. O terceiro teste prova que as ações ficam bloqueadas e que não há segunda navegação nem PATCH.
- Não consegui reexecutar o estado anterior à correção, então não confirmo os 5 RED. A contagem é plausível: 3 testes de "page must not vanish" mais 2 de falha de navegação (`false` e rejeição) falhariam por asserção com o `computed` vivo e o `navigate` ignorado.

## Apontamentos
Nenhum apontamento bloqueante.

Observação não bloqueante: quando a navegação falha após aprovar, a tela mantém a etiqueta `AGUARDANDO PAGAMENTO`, o QR e o código, embora o pedido já esteja concluído no servidor. O alerta orienta o usuário a voltar ao Cofrinho. A spec não define esse estado, então não reprovo; fica como candidato a manutenção. O apontamento 2 da rodada 1 (tamanhos fora dos tokens) foi recusado pelo dono e não foi reaberto.
