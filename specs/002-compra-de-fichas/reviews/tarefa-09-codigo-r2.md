# Parecer de Código — Tarefa 9 (rodada 2)

**Veredito:** APROVADO

Execução na raiz: `npm test` com 18 arquivos e 346 testes passando (eram 343 na rodada 1, os 3 novos são os casos de 1 ficha). `npm run lint` limpo.

## Apontamentos (bloqueiam)
Nenhum. Os 2 bloqueantes da rodada 1 estão resolvidos.

## Verificação dos apontamentos da rodada 1

1. **"1 fichas" nas telas novas: resolvido.**
   - O helper `formatTokensLabel(count)` está em `wallet.model.ts`, ao lado de `formatBrlFromCents`. Ele devolve `${count} ${count === 1 ? 'ficha' : 'fichas'}`. Só 1 vai ao singular, e 0 vira "0 fichas".
   - `payment-approved.page.ts` tem os computeds `quantityLabel` (do `order().tokensCount`) e `balanceLabel` (do `wallet().tokenBalance`). `payment-failed.page.ts` tem `quantityLabel`. Os três usam o helper com fallback 0.
   - Os templates usam `{{ quantityLabel() }}` e `{{ balanceLabel() }}` em `[data-summary-quantity]` e `[data-summary-balance]`. O sufixo fixo " fichas" saiu.
   - Busquei "ficha" nos 2 `.html`. Sobraram só texto de copy ("suas fichas já foram creditadas", "Suas fichas já estão disponíveis", "As fichas já foram creditadas") e o rótulo "Valor unitário da ficha". Nenhum deles é contagem, e os dois primeiros já tinham sido classificados como copy do Figma na rodada 1. Não há outra ocorrência de " fichas" fixo ligada a número nas telas novas.
   - O escopo ficou contido. As 4 cópias privadas antigas e o cabeçalho da casca não foram tocados, como o dono decidiu.

2. **Teste com 1 ficha: resolvido, e os testes falhariam sem a correção.**
   - `wallet.model.spec.ts` cobre o helper com 1, 0, 2, 8 e 100.
   - `payment-approved.page.spec.ts:152-159` usa `tokensCount: 1` e saldo 1, e espera `'1 ficha'` com `toBe` em `[data-summary-quantity]` e `[data-summary-balance]`.
   - `payment-failed.page.spec.ts:169-172` usa `tokensCount: 1` e espera `'1 ficha'` em `[data-summary-quantity]`.
   - Com o template antigo (`{{ n }} fichas`) a saída seria "1 fichas". O `toBe` exato falharia por asserção, e não por erro de compilação. O RED relatado é plausível.
   - Os testes olham o texto exibido, não detalhe de implementação.

## Alterações de classes de cor feitas pelo orquestrador

Todas usam tokens que existem em `styles.css`: `bg-secondary` (#121214), `text-on-tertiary` (#f4f4f6), `bg-primary` (#fcb900), `text-on-primary`, `bg-background`, `border-border`, `bg-control-disabled` e `text-text-secondary`. `font-normal` é utilitário padrão do Tailwind. Não há hexadecimal nem valor arbitrário.

- **Cabeçalho do resumo, mobile:** `bg-secondary ... text-on-tertiary`, com `lg:bg-transparent lg:text-text-secondary` no desktop. Ele existe nas duas telas e é coerente entre elas. O contraste de #f4f4f6 sobre #121214 é alto.
- **Falha, mobile:** "Tentar novamente" usa `bg-primary text-on-primary` (amarelo). "Escolher outra forma de pagamento" usa `bg-secondary text-on-tertiary` (preto). O estado desabilitado tem `disabled:bg-control-disabled disabled:text-text-secondary`, então não há texto claro sobre fundo claro.
- **Falha, desktop:** "Tentar novamente" é amarelo (`bg-primary`). "Escolher outra forma de pagamento" é `border border-border bg-background`, o botão secundário com borda. Li o pedido como "Tentar novamente amarelo; Escolher outra com borda". Se a intenção era o "Tentar novamente" desktop também ter borda, hoje ele não tem. Isso é visual e eu não bloqueio.
- **Aprovado, "Ir para o cofrinho":** no mobile é `bg-secondary text-on-tertiary`, com `disabled:bg-control-disabled disabled:text-text-secondary`. No desktop continua com borda sobre fundo branco.
- **Valor unitário e data no mobile:** `font-normal` com `lg:font-semibold`. O desktop é igual ao anterior, e os outros `dd` mobile continuam em `font-bold`. Não vi regressão nos seletores `data-*`, e os testes que olham classes (`bg-success`, `text-danger`, `border-danger`) continuam passando.

## Regressão e escopo
- `git diff` de `apps/web/src` (fora das pastas novas): `wallet.model.ts`, `wallet.model.spec.ts`, `wallet.routes.ts` e a remoção dos comentários TODO nas páginas Pix e Cartão. Esse é o mesmo conjunto da rodada 1, mais o helper e o seu teste. Não há mudança fora do escopo.
- A lógica de `ngOnInit`, `busy`, snapshot e navegação não mudou.

## Sugestões (não bloqueiam; as da rodada 1 não foram reabertas)
- Formatação irregular nos `.ts` novos. Em `payment-approved.page.ts`, `isPix =computed`, falta espaço depois de `=`. Em `payment-failed.page.ts`, `texts =computed`. Em ambos, a linha do `import` passa de 100 colunas e o `quantityLabel` também. O lint não reclama, mas um `prettier --write` nesses arquivos resolve.

## Observações fora do escopo deste diff
- As mesmas da rodada 1, já registradas nas decisões: "1 fichas" no cabeçalho da casca (`app-shell.component.html:110`), 4 cópias privadas do rótulo de fichas que podem passar a usar `formatTokensLabel`, e o fluxo de "navegação falhou" repetido em 4 páginas.
