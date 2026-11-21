# Parecer de Conformidade — Tarefa 8 (Rodada 2)

**Veredito:** APROVADO

Rodei `npm test`: 16 arquivos e 312 testes passando. `npm run lint`: limpo.

## A correção está certa
- `card-payment.page.ts:172-174` agora assina `merge(this.form.events, ...Object.values(this.form.controls).map(c => c.events))`.
- Os eventos de "tocado" de cada campo passam a atualizar os `computed` `errors` (`:176`) e `canPay` (`:232`).
- Antes, o `FormGroup` só emitia o evento de "tocado" na primeira vez. Isso explica o sintoma da rodada 1, que aparecia a partir do segundo campo tocado.
- `messageFor` (`:289-296`) continua mostrando o erro só se `touched || dirty`.
- Esse efeito sobre o `FormGroup` é a leitura que faço do comportamento do Angular. Não rodei a versão antiga para confirmar.

## Os testes novos provam a correção
- `spec.ts:454-475` dá blur em Titular, Número, Validade e CVV vazios, em sequência. Confere cada mensagem logo após o blur de cada campo e, no fim, as 4 visíveis ao mesmo tempo.
- Esse teste falha no código antigo: a partir do 2º blur o evento de "tocado" não emitia, então a mensagem não apareceria. O RED por asserção (`fieldError(...)` nulo) é plausível.
- `spec.ts:477-487` prova que campos não tocados seguem sem erro.
- A tabela parametrizada (`:380-433`) só dava blur em um campo por teste, por isso nunca pegou a falha da rodada 1.

## Critérios verificados
| Critério | Situação | Onde |
| --- | --- | --- |
| CA8: regras e mensagens da tabela (11 mensagens, validade até o último dia do mês, sem máscara, espaços e hífens removidos) | atendido | `card-payment.page.ts:35-106`; `spec.ts:380-433` e `:489` |
| CA8: "Pagar" desabilitado e `pay()` recusa dados inválidos (`markAllAsTouched` e revalidação) | atendido | `.ts:232-235`, `.ts:263-270`, `.html:154`; `spec.ts:534-583` |
| CA8 / RNF06: nada do cartão chega ao service, URL, console ou storage; `reset` só no sucesso (`:312`) | atendido | `.ts:299-317`, `.ts:346-367`; `spec.ts:855-935` |
| "Erro só depois de tocar ou digitar" e campos limpos ao abrir | atendido | `.ts:289-296`; `spec.ts:239`, `:435-487` |
| Cenário 4: criação ao abrir; reuso do pagamento `CREDIT_CARD` pendente; redirecionamentos sem rascunho ou com pedido não `PENDING` | atendido | `.ts:241-260`, `.ts:346-360`; `spec.ts:253-337` |
| CA9: "Simular cartão recusado" chama `failPayment`, vai a `/cofrinho/falha` e não exige formulário válido | atendido | `.ts:272`, `.ts:363`, `.ts:376`; `spec.ts:697` |
| CA11: "Cancelar pedido" chama `cancelOrder`, volta a `/cofrinho`, sem confirmação | atendido | `.ts:276`, `.ts:365`, `.ts:378`; `spec.ts:729` |
| CA12: trava compartilhada (`loading`, `submitting`, `navigationFailed`); clique duplo gera uma só requisição | atendido | `.ts:190`, `.ts:299`; `spec.ts:622`, `:832` |
| CA14: mensagem do service em `role="alert"`, "Tentar novamente" repete a ação que falhou, campos preservados, sem navegação em erro | atendido | `.html:45-62`, `.ts:281-287`; `spec.ts:339`, `:646-790` |
| CA15 (lado da tela): falha parcial mostra o erro recuperável e mantém os campos; a compensação em si é do service, fora desta tarefa | atendido | `spec.ts:670` |
| Navegação aguardada, e falha de navegação tratada | atendido | `.ts:334-344`; `spec.ts:788-850` |
| Rota `cartao` | atendido | `wallet.routes.ts` |
| Comentário `// TODO #2` em `payment-method.page.ts` | atendido | `payment-method.page.ts:97` |
| Conta bloqueada (CA13) | atendido | `.ts:325`; `spec.ts:940` |

## Fora do diff autorizado
O diff rastreado só mexe em `payment-method.page.ts` (comentário), `wallet.routes.ts` (rota `cartao`) e na pasta `card-payment/`. Fora o `api/db.json` e o `.claude/launch.json`, que você mandou ignorar, não vi mudança nem regressão além do escopo.

## Apontamentos
Nenhum bloqueante.

As sugestões da rodada 1 que o dono não promoveu seguem como estão. Não as reabri.
