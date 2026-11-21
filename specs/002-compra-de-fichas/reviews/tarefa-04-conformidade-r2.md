# Parecer de Conformidade — Tarefa 4 (Rodada 2)

**Veredito:** APROVADO

Testes: `npm test` passou com 12 arquivos e 165 testes. `npm run lint` rodou sem erros. A contagem caiu de 166 para 165 porque os testes de alvo de toque e de foco foram fundidos em um só, o que é coerente com a decisão 2.

## As duas correções aceitas
1. **Rótulo da tarifa vindo de `rateLabel`:** feito.
   - `wallet-overview.page.ts:38` define `rateLabel = \`1 ficha = ${formatBrlFromCents(TOKEN_UNIT_PRICE_CENTS)}\``. Os imports estão nas linhas 6 e 9.
   - O template usa `{{ rateLabel }}` nos dois pontos, em `wallet-overview.page.html:92` (mobile) e `:115` (cartão "Valor por viagem", desktop). Não sobrou texto literal.
   - O texto renderizado continua "1 ficha = R$ 2,00". Isso é afirmado em `wallet-overview.page.spec.ts:150` e `:172`.
   - Há um teste novo em `wallet-overview.page.spec.ts:155-165`. Ele compara `rateLabel` com o valor derivado das constantes e confirma exatamente 2 ocorrências no host.
2. **Alvo de toque e foco visível unificados:** feito.
   - `wallet-overview.page.spec.ts:378-394` é um único teste. Ele verifica `min-h-11` e `min-w-11` no link "Voltar" e itera sobre todos os `a` e `button` conferindo `focus-visible:outline-2` e `focus-visible:outline-tertiary`.
   - A contagem `>= 9` foi removida.

## Critérios verificados
| Critério | Situação | Onde |
| --- | --- | --- |
| CA1: saldo em fichas e R$, `1 ficha = R$ 2,00`, "Comprar fichas", extrato e estado vazio | atendido | `wallet-overview.page.html:79-92,115,140-146,226-239`; spec `:145-153` |
| CA2: filtros sem nova requisição e sem perder o saldo | atendido, sem regressão | `wallet-overview.page.ts:40-45,61`; html `:154-167` |
| CA11: cancelar pedido `PENDING` e retomar | atendido | html `:205-224`; `wallet-overview.page.ts:65-73` |
| CA13: conta `SUSPENDED` ou `BANNED` | atendido | html `:40-47,131-138,210` |
| CA14: erro de rede com "Tentar novamente", sem sucesso falso | atendido | html `:49-63`; `wallet-overview.page.ts:57` |
| Assunção 4: `loadChildren` dentro da casca; `/`, landing e login intactos | atendido | `app.routes.ts`, `wallet.routes.ts`, `app.routes.spec.ts` |
| Assunção 5: "Doar fichas" desabilitado com "Em breve" | atendido | html `:122-130` |
| Assunção 6: o Figma orienta, mas valem a spec e os tokens | atendido | template sem mudança estrutural nesta rodada |

## Sem regressão
- O visual e o comportamento do template e do componente seguem como no parecer da rodada 1. Não vi mudança de markup, classes ou lógica além das duas correções.
- `environment.development.ts` com `/api` (e a asserção em `wallet.model.spec.ts`) e o asset `public/cofrinho.png` foram mantidos, como aprovado na rodada 1.
- A nota não bloqueante da rodada 1 continua valendo: `resumeOrder` navega para `/cofrinho/pagamento`, rota que só nasce na tarefa 6. O TODO está sinalizado em `wallet-overview.page.ts:71`.
- Não encontrei alteração na linha `status:` da spec nem escopo inflado.

## Apontamentos
Nenhum.
