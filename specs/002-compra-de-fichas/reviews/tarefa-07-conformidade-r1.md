# Parecer de Conformidade — Tarefa 7

**Veredito:** APROVADO

Rodei `npm test` na raiz: 15 arquivos e 239 testes passaram. `npm run lint` terminou sem erros. Não rodei o navegador. Os cenários de aprovar e falhar com o servidor ligado ficam com o orquestrador, como combinado.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA6: Pix com QR, Copia e Cola, copiar e etiqueta AGUARDANDO PAGAMENTO; página não cria Order/Payment nem recarrega dados | atendido | `pix-payment.page.html:35-72, 80-105`; `pix-payment.page.ts:40-51` (só lê `activeOrder` e `activePayment`; sem HttpClient nem `loadWalletData`). Spec: linhas 173, 193, 484. A criação do Order/Payment é da tarefa 6 e não foi alterada. |
| CA7: "Já realizei" chama `confirmPayment` e vai a `/cofrinho/aprovado` só com retorno true | atendido | `pix-payment.page.ts:131-136, 143-146, 157-159`; spec:271-301. O teste mostra que `navigate` não é chamado antes dos 3 PATCH e que o saldo vai a 15. |
| CA9: simular falha chama `failPayment`, vai a `/cofrinho/falha`, saldo intacto | atendido | `pix-payment.page.ts:138-140, 160-162`; html:158-170; spec:303-318 (o corpo do PATCH é `{status:'FAILED'}` e não há PATCH em `/wallets`) |
| CA11: "Cancelar pedido" sem confirmação, volta a `/cofrinho` | atendido | `pix-payment.page.ts:142-144, 163-164`; html:147-155; spec:320-333 (corpo `{status:'CANCELLED'}`) |
| CA12: trava compartilhada pelas 3 ações e duplo clique | atendido | `pix-payment.page.ts:28-29, 118-135` (`busy` = `loading` OU `submitting`, checado em `run`); spec:335-373 (um só PATCH com clique duplo nos dois botões; com a aprovação em andamento, fail e cancel são recusados e não há PATCH em `/orders`) |
| CA14: erro de rede mostra mensagem do service com "Tentar novamente" e sem navegar | atendido | html:41-59; `pix-payment.page.ts:107-111`; spec:375-451 (aprovar, falhar e cancelar; cada retry repete a ação que falhou) |
| CA15: falha parcial com erro recuperável, sem sucesso falso | atendido | spec:396-416 (o Order falha, há compensação do Payment para PENDING, não navega, saldo 10 e o retry aprova). A compensação em si é do `WalletService` e não foi alterada. |
| Decisão: conteúdo | atendido | etiqueta nos dois tamanhos em html:36-40 e 81-86; QR com alt "QR Code Pix simulado"; 3 passos em `.ts:70-74`; voltar para `/cofrinho/pagamento` em html:2-9 |
| Decisão: código derivado de `gatewayPaymentId` e valor, determinístico | atendido | `wallet.model.ts:80-90`; `.ts:50-56`; `wallet.model.spec.ts:66-86` (mesma entrada dá o mesmo código, entradas diferentes dão códigos diferentes) |
| Decisão: copiar | atendido | `pix-payment.page.ts:100-114`, html:119-129; spec:202-269. Cobre "Código copiado!" com `role="status"`, volta ao normal em 2 s, timer limpo no destroy, rejeição e clipboard indisponível, código com `select-all`. |
| Decisão: dois botões "Já realizei", ícone de copiar só no mobile, "Valor" só no desktop | atendido | html:109-117 (`lg:hidden` no ícone), 125-145 (preto no mobile via `bg-primary`, amarelo no desktop via `bg-secondary`; ver Observações), `data-amount` em 91-93 |
| Decisão: sandbox cinza com borda tracejada e Cancelar com borda e texto danger | atendido | html:147-170; spec:505-518 |
| Decisão: sem pedido, sem pagamento ou fora de PENDING redireciona para `/cofrinho` sem GET | atendido | `pix-payment.page.ts:40-42, 95-99`; spec:453-488 |
| Imagens e ícones (regra 02 §4) | atendido | QR com alt descritivo; ícones com `alt=""` e `aria-hidden`; nenhum `<svg>` no HTML; o teste de spec:520-540 confere que os arquivos existem em `public/` |
| Escopo do diff | atendido | `git diff` só traz `wallet.model.ts` e seu spec (apenas `buildPixCopyPasteCode`), o comentário TODO em `payment-method.page.ts`, em `wallet.routes.ts` só a rota `pix`, mais os 3 ativos e a pasta `pix-payment/`. WalletService, casca, auth, buy-tokens e spec/plan intactos. |
| Assunção 6 (Figma orienta, spec vale onde diverge) | atendido | Cancelar e Simular falha foram criados sem referência no Figma, com tokens. O registro está na spec (linha 126) e no plan (linha 96). |

## RED declarado
Plausível. O spec da página tem 24 testes e o model tem 3 novos, 27 no total. Com a página em stub, os 25 relatados cobrem tudo o que depende de conteúdo, ações e redirecionamento. Alguns poucos testes (por exemplo o "no GET") podiam passar com o stub, o que é coerente com 25 e não com 27.

## Os testes provam os cenários?
Sim: aprovar, falhar, cancelar, duplo clique, erro de rede, falha parcial e copiar têm testes com asserções fortes. Eles checam método, URL e corpo do PATCH, o momento do `navigate` e a ausência de PATCH indevido. O teste de clearTimeout no destroy confere o handle exato.

## Apontamentos
Nenhum bloqueante.

## Observações não bloqueantes
- Não verifiquei a fidelidade visual contra os PNGs do Figma e as capturas. Isso fica com o revisor de código e com a conferência no navegador.
- O bloqueio de conta desabilita só "Já realizei" (spec:490-503). O texto de CA13 fala em iniciar ou confirmar compra, então isso é coerente e não fica fora de escopo.
