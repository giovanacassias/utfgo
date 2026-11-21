# Parecer de Código — Tarefa 7 (rodada 2)

**Veredito: APROVADO.** Não há bloqueantes.

Rodei `npm test` na raiz: 15 arquivos e 245 testes passaram. Rodei `npm run lint` na raiz: saiu limpo. Não reabri o bloqueante 2 da rodada 1, que o dono recusou com justificativa registrada, nem as sugestões não promovidas.

## Apontamentos (bloqueiam)
Nenhum.

## Verificação dos 4 pontos pedidos
1. **Correção e redirecionamento.**
   - `ready` virou signal decidido uma vez (`pix-payment.page.ts:45` e `:86`).
   - O redirect de `ngOnInit` continua igual (`:87-89`). Os testes de redirect (sem pedido, sem pagamento, pedido ou pagamento fora de `PENDING`) passam e conferem que o DOM não tem código Pix nem botão de aprovar.
   - Depois da ação, Order e Payment saem de `PENDING`. A página não some mais, porque `ready` não é recalculado.
   - O resultado do `navigate` agora é aguardado em `goToDestination` (`:147-157`). Tanto `false` quanto rejeição caem em `navigationFailed`.
2. **Corrida e estado.**
   - O `finally` sempre zera `submitting` (`:141-143`). O guard `busy()` em `run` (`:127`) impede ação dupla enquanto `submitting` está ligado.
   - Depois da falha de navegação, `navigationFailed` mantém `busy()` ligado. Isso trava todos os botões, e o teste "não navega duas vezes" prova que não há PATCH nem `navigate` extra.
   - Se o componente for destruído durante o `await navigate`, só há `set` em signals de um componente morto, sem efeito colateral. O caso comum é navegação bem-sucedida: o componente é destruído e o `false` nunca acontece.
   - `lastAction` fica sobrando após o sucesso, mas só é lido por `retry()`, que só é alcançável pelo alerta `data-error`. Esse alerta fica atrás do `@if` de `navigationFailed`, então os dois são mutuamente exclusivos.
3. **Acessibilidade.**
   - O alerta de navegação tem `role="alert"` (`pix-payment.page.html:22-36`). O link tem `min-h-11` (44px) e `focus-visible:outline-2` com `outline-offset-2`.
   - A prioridade `navigationFailed` > `isAccountBlocked` > `error` é coerente. Conta bloqueada ou erro de serviço não ocorrem depois de uma ação que deu certo, e as três mensagens nunca competem de verdade.
4. **Mensagem e testes.**
   - Os testes novos provam o comportamento: DOM presente logo após o último PATCH com `navigate` pendente (aprovar, falhar e cancelar), `navigate` resolvendo `false`, `navigate` rejeitando, e nenhum PATCH ou `navigate` duplicado.
   - A mensagem tem ressalvas, listadas nas sugestões abaixo.

## Sugestões (não bloqueiam)
- **Mensagem de falha de navegação (`pix-payment.page.html:28`).** Ela não diz que a ação já deu certo. Num caso real, como aprovar o pagamento e a navegação falhar, a tela continua mostrando "AGUARDANDO PAGAMENTO" e o código Pix ainda copiável. O usuário pode achar que o pagamento não foi registrado e tentar pagar de novo. No cancelamento, "ver o seu pedido" também destoa, porque o pedido foi cancelado. Sugestão de texto: "Sua ação foi registrada, mas não foi possível abrir a próxima tela. Volte ao Cofrinho para conferir." Uma variante por ação seria melhor ainda. Esconder ou desabilitar o bloco do código quando `navigationFailed` também ajudaria.
- **Botões desabilitados sem explicação.** Com `navigationFailed`, o botão de copiar continua ativo e os demais ficam desabilitados. A explicação vem só do alerta, o que é aceitável.
- **Nome `busy`.** Ele agora também significa "página encerrada". Não há prejuízo hoje. Se `navigationFailed` crescer, vale um `locked` ou um comentário explicando.
- **Teste faltando.** Não há teste de destruição do componente durante o `await navigate`. Seria um teste barato: `navigate` pendente, `fixture.destroy()`, resolver com `false`, e checar que não há erro.
- **Foco.** O foco não vai para o alerta. O `role="alert"` anuncia, e o link é o próximo item da ordem de tabulação, então isso é aceitável.

## Observações fora do escopo deste diff
- Os `// TODO #2` das rotas `/cofrinho/aprovado` e `/cofrinho/falha` (tarefa 9) fazem o `navigate` rejeitar hoje. Por isso o caminho `navigationFailed` é real até a tarefa 9 existir, e a correção desta rodada é o que o torna recuperável.
- Os tamanhos de layout fora dos tokens (`size-40`, `size-44`, `lg:min-h-24`, `lg:w-16`) ficam como candidato a Issue de manutenção (documentar tamanhos de layout em `docs/design-tokens.md`), conforme a decisão da rodada 1.
