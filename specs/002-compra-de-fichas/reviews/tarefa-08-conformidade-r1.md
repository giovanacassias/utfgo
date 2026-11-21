# Parecer de Conformidade — Tarefa 8

**Veredito:** APROVADO

Rodei `npm test` (16 arquivos, 310 testes, todos passando) e `npm run lint` (sem erros). Não conferi a tela no navegador, então não avalio a fidelidade visual.

## Critérios verificados
Todos os arquivos estão em `apps/web/src/app/features/wallet/pages/card-payment/` (abreviado abaixo: `ts` = `card-payment.page.ts`, `html` = `card-payment.page.html`, `spec` = `card-payment.page.spec.ts`).

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA8: titular, 16 dígitos, validade `MM/AA` e CVV de 3 ou 4 dígitos validados em Reactive Forms, com erro por campo | atendido | `ts:47-107` (validadores), `ts:122-127` (form); testes `spec:380-433` |
| CA8: `confirmPayment` recebe só o id e não leva dados do cartão; navega para `/cofrinho/aprovado` só com retorno `true` | atendido | `ts:276-295`, `ts:343-345`, `ts:348`; testes `spec:549-572`, `spec:871-901` |
| CA9: "Simular cartão recusado" vai para `/cofrinho/falha`, sem exigir formulário válido e sem alterar o saldo | atendido | `ts:249-251`, `html:176-187`; teste `spec:662-680` |
| CA11: "Cancelar pedido" sem confirmação e sem exigir formulário válido, volta para `/cofrinho` | atendido | `ts:253-255`, `html:164-173`; teste `spec:694-712` |
| CA12: trava compartilhada (`loading`, `submitting` e falha de navegação) e duplo clique | atendido | `ts:213-215`, `ts:281-283`; testes `spec:587-609`, `spec:797-809` |
| CA14: erro de rede mostra a mensagem do service com "Tentar novamente" e preserva os campos; formulário limpo só no sucesso | atendido | `ts:287-289` (`reset` só em `approve`), `html:64-80`; testes `spec:611-658`, `spec:714-749` |
| CA15: falha parcial não navega e o erro é recuperável | atendido | `ts:276-295`; teste `spec:635-658` |
| Cenário 4: criação ao abrir | atendido | `ts:231-246`, `ts:320-328`; testes `spec:253-316` |
| Cenário 4: com rascunho e sem pedido ativo, `createOrderAndPayment(n,'CREDIT_CARD')` | atendido | `ts:320-328` |
| Cenário 4: com pedido ativo PENDING, `createPaymentForOrder(orderId,'CREDIT_CARD')` | atendido | `ts:320-328` |
| Cenário 4: reaproveita `activePayment` quando é `CREDIT_CARD` e PENDING | atendido | `ts:217-221`, `ts:244` |
| Cenário 4: sem rascunho nem pedido redireciona para `/cofrinho/comprar` | atendido | `ts:238-240`; teste `spec:318-326` |
| Cenário 4: falha na criação mostra o erro com "Tentar novamente" e bloqueia "Pagar" e "Simular" | atendido | `ts:236-247`, `html:64-80`; teste `spec:339-365` |
| Cenário 5 | atendido | recusar e cancelar acima |
| Tabela de validação: 11 mensagens literais | atendido | `ts:32-52` |
| Tabela: espaços e hífens removidos do número, sem máscara e sem Luhn | atendido | `ts:62-70` |
| Tabela: validade vale até o último dia do mês (`2000+AA`) | atendido | `ts:84-87`; teste `spec:454-465` com `Date` congelada |
| Tabela: todas as linhas provadas nos testes | atendido | `spec:380-408` cobre as 11 mensagens, os casos válidos e os limites |
| Erro só depois de digitar ou sair do campo; campos limpos ao abrir | atendido | `ts:271-278` (`touched` ou `dirty`); testes `spec:239-251`, `spec:435-452` |
| "Pagar" desabilitado se inválido; `pay()` recusa e revalida | atendido | `ts:233-241`, `ts:225-228`; testes `spec:499-547` (inclui Enter e submit) |
| RNF06: nenhum dado sensível no service, na URL, no console ou no storage | atendido | `ts:5` e `ts:230-244`; teste `spec:812-902` com valores-isca (envio aprovado, recusa, cancelamento e falha) |
| A página não some após o sucesso; falha de `router.navigate` mostra `data-navigation-error` com "Voltar ao Cofrinho" | atendido | `ts:211-222`, `html:44-62`; testes `spec:752-809` |
| `wallet.routes.ts` ganhou só a rota `cartao` | atendido | diff de `apps/web/src/app/features/wallet/wallet.routes.ts` |
| Acessibilidade e atributos (`label for`, `autocomplete`, `inputmode`, `type="text"`, `role="alert"`, `aria-invalid`) | atendido | `html:117-140`; teste `spec:467-482` |
| Ícone `icons/card.svg` como `<img>` com `alt=""` e `aria-hidden`, sem `<svg>` no HTML | atendido | `html:101`; o arquivo já existia em `apps/web/public/icons`; teste `spec:920-934` |
| Assunção 6 e regra 02 §5: tela sem Figma | atendido | registrado na spec (`spec.md:153`); o relatório da tarefa ainda deve repetir isso |

## Escopo
O diff fora da pasta `card-payment/` contém só a rota `cartao` e o comentário `// TODO #2` em `payment-method.page.ts`. O diff contra `54561af6` não toca `WalletService`, `wallet.model.ts`, a casca, auth, `spec.md` nem `plan.md`. Não há arquivo novo em `apps/web/public/`. O ícone já existia, tanto o `card.svg` quanto os demais.

## Sobre a página não chamar `loadWalletData`
É aceitável, e não é apontamento. A spec do cartão (`spec.md:151`) manda decidir tudo no `ngOnInit` a partir do estado do service. O CA13 só exige bloqueio em `/cofrinho` e `/cofrinho/comprar`. A tela de Pix tem a mesma decisão (`spec.md:129`). Mesmo assim, a página:
- lê `isAccountBlocked` e mostra a mensagem de bloqueio;
- recusa `pay()` quando a conta está bloqueada (`ts:307`);
- é coberta por teste com usuário `SUSPENDED` (`spec:904-918`).

Num refresh direto o estado em memória se perde, o rascunho fica nulo e a página redireciona para `/cofrinho/comprar`, onde o CA13 vale.

## RED declarado
Plausível. Com um stub vazio, os testes que só verificam ausência de chamada (redirecionamentos, "não recarrega GET", "não há erro") passam por acaso. Os demais, mais de 50 entre as 27 linhas da tabela, as ações e a privacidade, falhariam. 53 falhas em 310 é compatível. Não reproduzi o stub.

## Apontamentos
Nenhum.

Observação não bloqueante: o relatório da tarefa precisa registrar que a tela foi criada sem referência no Figma (regra 02 §5), e a conferência visual em 393 px e 1440 px continua pendente com o orquestrador.
