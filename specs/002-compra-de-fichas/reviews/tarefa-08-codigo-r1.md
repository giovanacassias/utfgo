# Parecer de Código — Tarefa 8

**Veredito:** REPROVADO (1 bloqueante). `npm test`: 310 passam. `npm run lint`: limpo.

## Apontamentos (bloqueiam)

1. **O erro de um campo vazio não aparece ao sair dele, a partir do segundo campo tocado.** `card-payment.page.ts:171` e `card-payment.page.ts:173-181`
   - Regra violada: spec, bloco "Decisões da tela /cofrinho/cartao" (linha 134): o erro aparece "depois que a pessoa digita ou sai do campo". CA8: "feedback por campo". Regra 01 §1, estado reativo correto.
   - Causa: `toSignal(this.form.events)` escuta só o `events` do `FormGroup`. Li o código do Angular instalado (`node_modules/@angular/forms/fesm2022/forms.mjs:977-990`). `markAsTouched` só emite `TouchedChangeEvent` no grupo quando o próprio grupo muda de não tocado para tocado (`changed = this.touched === false`). Depois do primeiro blur de qualquer campo, o grupo já é `touched`. Um blur seguinte, em outro campo ainda vazio e intocado, não emite nada no grupo. Digitar emite `ValueChangeEvent` no grupo, e `pay()` emite por causa do `updateValueAndValidity()`. Só o blur puro fica sem notificação.
   - Prejuízo concreto: o usuário sai do Titular (o erro aparece) e depois passa pelo Número sem digitar. O `computed` `errors()` não recalcula e o campo parece válido. É o caso mais comum de tab pelo formulário. O erro só surge ao digitar ou ao clicar em Pagar.
   - Ponto cego dos testes: os 27 casos fazem um `render()` novo e um único `leave()` por caso (`spec.ts:410-417`). O teste de `spec.ts:443-451` faz blur só no Titular. Nenhum teste faz blur em dois campos em sequência. Não executei o cenário no navegador nem em teste, porque sou somente leitura. A conclusão vem da leitura do código fonte do Angular.
   - Correção sugerida (o revisor não corrige): assinar também os eventos dos controles filhos, por exemplo com `merge(...Object.values(form.controls).map(c => c.events))`. Ou ligar um `(blur)` que incremente um signal. Acrescente um teste de blur em dois campos vazios em sequência.

## Sugestões (não bloqueiam)

- **Comentário impreciso.** `card-payment.page.ts:262`, com a spec linha 134: `form.updateValueAndValidity()` no grupo não reexecuta os validadores dos filhos. A revalidação da validade ao virar o mês, com a página aberta, não acontece. O risco real é mínimo, mas o comentário "revalidando" promete mais do que o código faz. Se quiser a garantia, use `controls.expiry.updateValueAndValidity()`.
- **Validade com 4 dígitos no ano.** `autocomplete="cc-exp"` pode ser preenchido pelo navegador como `11/2026` ou `11 / 26`, e cai em "Use o formato MM/AA". Está de acordo com a spec (sem máscara). Vale registrar como limitação.
- **`run('create')` pode falhar sem aviso.** `card-payment.page.ts:296` e `:254-255`: se `busy()` estiver verdadeiro no `ngOnInit` (por exemplo `loading` do service ainda ativo), `run('create')` retorna sem ação e sem erro. A tela fica sem pagamento, com "Pagar" bloqueado e sem botão de tentar novamente. Hoje o fluxo normal não chega nesse estado, porque a navegação só ocorre depois do `await`. É um caso de borda frágil.
- **Link "Voltar" ativo durante ação em voo.** `card-payment.page.html:3-10`: o link não é bloqueado por `busy()`. Se o usuário voltar durante `approve` ou `refuse`, o `goToDestination` navega depois e o tira da tela em que está. Comportamento aceitável, mas surpreendente.
- **Seta de voltar só no mobile.** O link tem `lg:hidden`, então o desktop só volta pelo navegador. Se isso copia o padrão da tela Pix, ignore.
- **Teste de existência do ícone.** `spec.ts:17-23` usa `process.getBuiltinModule` por um cast `as unknown as`. Funciona, mas é frágil. Os testes presos a classes Tailwind já foram aceitos como guarda simples, então não apontei.

## Verificações sem achado

- **Validadores.**
  - `\d` do JS é ASCII, e `\s` e hífen são removidos só no número.
  - Validade: `new Date(2000+AA, mês, 1)` com `>=` cobre dezembro (mês 12 vira 1º de janeiro), anos bissextos e meses de 28 a 31 dias, porque compara com o dia 1º do mês seguinte, em fuso local.
  - `NaN` é impossível, pois o regex garante dois dígitos. O CVV não aplica trim: `"123 "` dá "Digite apenas números", o que é coerente.
  - A tabela `CARD_MESSAGES` bate com as 11 linhas da spec. `Object.keys(errors)[0]` é seguro, porque cada validador devolve uma única chave.
- **`toSignal`.** Está em contexto de injeção (campo), então cancela a assinatura ao destruir. Não há vazamento. O custo de recalcular a cada tecla é desprezível. `markAllAsTouched` e `updateValueAndValidity` em `pay()` atualizam a tela (fora o buraco do blur apontado acima). `form.reset()` emite `FormResetEvent`, que também atualiza.
- **RNF06.**
  - Não há `form.value`, `getRawValue`, `console.*`, storage nem URL.
  - Nada do cartão vai ao service: só `payment.id`, `order.id` e `draft`.
  - Mensagens de erro são constantes, e `data-*`, `aria-*` e `title` só contêm nomes de campo e ids.
  - `form.reset()` só roda em `approve` bem-sucedido, antes da navegação.
- **Corrida.**
  - `busy` = `loading` ∨ `submitting` ∨ `navigationFailed`. O guard está em `run()` (linha 296) e o `finally` libera `submitting`.
  - A destruição durante `await` só escreve em signals do componente, sem efeito colateral. O pedido criado em segundo plano é consistente.
  - `retry` repete a última ação, e para `approve` passa por `pay()`, que revalida.
- **Criação no `ngOnInit`.**
  - O pagamento `CREDIT_CARD` PENDING é reaproveitado.
  - Pedido ativo com pagamento Pix usa `createPaymentForOrder` e não duplica o Order.
  - Rascunho sem pedido usa `createOrderAndPayment`.
  - Não chamar `loadWalletData` é coerente com a tela Pix. O service bloqueia a criação com `accountBlockMessage` (CA13), e o template mostra o ramo de conta bloqueada antes do erro. Num reload, o rascunho some e há redirect para `/comprar`, onde a carteira é carregada.
- **Layout e tokens.**
  - Um único conjunto de botões posicionado por `lg:col-start-*` e `row-start-*`.
  - O grid de 4 campos vem de `@for` com `track field.name`.
  - Sem `standalone: true`, sem `any`, sem `<svg>`, sem `style=`, sem hex e sem `.css`.
  - Os tokens usados existem em `styles.css` (`danger-surface`, `control-disabled`, `rounded-card`, `text-title-small` e outros). `icons/card.svg` existe.
  - Reactive Forms, `inject()`, `@if` e `@for` estão conformes. O componente só fala com `WalletService`.
  - Não reabri a escala padrão do Tailwind, conforme pedido.
- **Acessibilidade.** Há `label for`, `aria-invalid` e `aria-describedby` condicionais, `role="alert"` e alvos de pelo menos 44px (`min-h-11`/`min-h-12`). O foco visível usa `outline-tertiary`. O ícone é decorativo (`alt=""`, `aria-hidden`).
- **Escopo do diff.** `wallet.routes.ts` só acrescenta `cartao`, e `payment-method.page.ts` só troca o comentário.

## Observações fora do escopo deste diff (candidatas a Issue de manutenção)

- `WalletService.createOrderAndPayment` (`wallet.service.ts:283-298`): se o POST do Order der certo e o do Payment falhar, o Order criado não vira ativo. O "Tentar novamente" cria um segundo Order, e o primeiro fica órfão. É uma violação potencial do CA12.
- A prova de que `createOrderAndPayment` e `createPaymentForOrder` dependem do `loading` compartilhado (retorno `null` silencioso) não distingue "ignorado" de "falhou". Isso alimenta a sugestão acima sobre `run('create')`.

**Veredito final: REPROVADO**
1. `card-payment.page.ts:171-181`: o `toSignal(form.events)` não captura o blur do segundo campo em diante, então o erro do campo vazio não aparece ao sair dele (spec linha 134). Falta também um teste que cubra blur em sequência.
