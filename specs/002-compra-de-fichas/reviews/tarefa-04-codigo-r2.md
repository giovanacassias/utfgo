# Parecer de Código — Tarefa 4 (rodada 2)

**Veredito:** APROVADO

Verificação: `npm test` passou (12 arquivos, 165 testes) e `npm run lint` passou sem erros.

## Apontamentos (bloqueiam)
Nenhum.

## Confirmação das duas correções aceitas
1. **Rótulo da tarifa:** `wallet-overview.page.ts:38` define `rateLabel = \`1 ficha = ${formatBrlFromCents(TOKEN_UNIT_PRICE_CENTS)}\``. O `wallet-overview.page.html` usa `{{ rateLabel }}` nas linhas 92 e 115, e o texto "R$ 2,00" não aparece mais escrito à mão no template. O teste novo (`wallet-overview.page.spec.ts:155-165`) compara `rateLabel` com o valor derivado das constantes e confere que ele aparece exatamente 2 vezes. Está correto. As asserções literais "1 ficha = R$ 2,00" nas linhas 150 e 172 dão uma checagem independente do texto final, então não são duplicação de regra.
2. **Alvo de toque e foco visível:** as verificações foram unificadas em um único teste (`wallet-overview.page.spec.ts:378-394`) e a contagem `>= 9` foi removida. O teste agora itera sobre todos os `a, button` renderizados, então não depende do número de elementos. A recusa de mover o foco para o `styles.css` foi respeitada e não foi reaberta.

## Regressão e conformidade
- Nenhuma regressão encontrada. O diff de `app.routes.ts` só troca o placeholder por `loadChildren` apontando para `WALLET_ROUTES`. O guard e as demais rotas ficaram intactos, e `app.routes.spec.ts` cobre isso.
- Regras Angular: o template não tem `*ng`, `style=` nem hexadecimal. O componente usa `inject()` e os dados vêm só do `WalletService`. Não há `NgModule` nem feature importando outra feature, e o lazy loading é feito por `loadChildren` e `loadComponent`.

## Sugestões (não bloqueiam)
As sugestões da rodada 1 não promovidas permanecem como estão e não foram reabertas.

## Observações fora do escopo deste diff
Nenhuma além dos itens já listados em `tarefa-04-decisoes-r1.md` como candidatos a manutenção.

**Veredito final: APROVADO. Bloqueantes: nenhum.**
