# Parecer de Código — Tarefa 6

**Veredito:** REPROVADO (1 bloqueante)

Rodei `npm test` (206 testes passando) e `npm run lint` (limpo). Ignorei `.claude/launch.json` e `apps/api/db.json`, como pedido.

## Apontamentos (bloqueiam)
1. **O pedido ativo vence o rascunho sempre, então uma compra nova pode cobrar a quantidade antiga sem aviso** — `apps/web/src/app/features/wallet/pages/payment-method/payment-method.page.ts:38-50`
   - Regra violada: spec CA6/CA10 (o `Order` `PENDING` só é reaproveitado numa nova tentativa) e CA14 ("sem apagar os dados selecionados", sem sucesso falso). A tela agora decide o fluxo com um estado que ela não controla.
   - Causa: `WalletService._activeOrderId` fica no singleton e nada o zera. `createOrderAndPayment` e `createPaymentForOrder` gravam o id (`wallet.service.ts:294,356`). `wallet-overview` chama `selectActiveOrder` (`wallet-overview.page.ts:70`). `buy-tokens.page.ts:162` só chama `setDraftTokensCount`, sem limpar o pedido ativo.
   - Prejuízo concreto, em um fluxo comum:
     1. O usuário escolhe 8 fichas em `/comprar` e gera o Pix. O `Order` de 8 fichas fica `PENDING` e ativo.
     2. Ele volta a `/cofrinho/comprar` e escolhe 20 fichas (rascunho = 20).
     3. Em `/cofrinho/pagamento`, `source()` devolve o pedido antigo de 8 fichas, e a tela mostra e cobra 8 fichas.
   - O mesmo acontece se ele abrir um pedido no extrato antes de comprar. O teste `retry flow` (spec linha 225) trava esse comportamento, com rascunho 3 e pedido 5 resultando em 5, e não cobre o caso inverso.
   - Correção sugerida, só como direção: limpar o pedido ativo ao definir um rascunho novo (em `buy-tokens` ou em `setDraftTokensCount`), ou distinguir "retomada" de "compra nova" por um sinal explícito. A decisão e o teste de regressão são do implementador, depois da triagem.

## Sugestões (não bloqueiam)
- **Destruição durante o `await loadWalletData()`** (`payment-method.page.ts:71-77`): se o usuário sair da tela antes de o load terminar e `source()` for `null`, o `navigate` ainda dispara e puxa o usuário para `/cofrinho/comprar`. Isso o tira de onde ele foi (por exemplo, outro item da barra). Guardar com `DestroyRef`/flag e não navegar se o componente já foi destruído.
- **Falha no load** (`payment-method.page.ts:73-76`): se `loadWalletData` falha e `source()` é `null`, o redirecionamento ocorre sem o usuário ver o erro. Se o rascunho existe, o alerta "Tentar novamente" (`html:39-48`) chama `confirm()`, e não recarrega a carteira. Com o usuário não carregado, `isAccountBlocked` fica `false`, então o fluxo segue sem conferir o status da conta. Considerar um retry que recarregue a carteira quando `user()` for `null`.
- **Corrida `submitting` × `loading`: não há.** `submitting.set(true)` roda de forma síncrona logo após o `canConfirm()`, e o `finally` o libera. A camada do service (`loading`) cobre chamadas fora da página. O teste de clique triplo cobre o caso. Nada a corrigir.
- **Navegação só após sucesso, e erro de rede:** correto. O `navigate` só ocorre com `result !== null`. O erro vem do signal do service (`role="alert"`) e dados, rascunho e método são preservados. O botão "Tentar novamente" aparece só quando `source()` existe. A mensagem de offline está coberta pelo teste.
- **Mobile e desktop:** o botão único no `aside` (`html:169-177`) não tem `hidden`, então funciona no mobile. Há duplicação moderada de texto (`h1` com dois `span`, linhas 11-21, e o resumo em `lg:hidden` e `hidden lg:flex`, linhas 53-74 e 143-167). É aceitável para dois layouts distintos. Se crescer, vale extrair um sub-componente de apresentação.
- **Acessibilidade:** `radiogroup`, `radio`, `aria-checked`, `role="alert"`, `min-h-11`/`min-h-12` e `focus-visible` estão corretos. Falta o padrão WAI-ARIA de radio: `tabindex` roving e setas do teclado. Hoje cada radio é um botão com Tab próprio. O estado de carregamento tem só o texto "Gerando Pix..." no botão e não há texto de carregamento para o `loadWalletData`; é uma lacuna menor.
- **Tokens:** todas as classes são tokens do `styles.css` (conferi `title-small`, `display`, `control-disabled`, `surface-muted`, `warning-surface`, `rounded-card` e `rounded-control`). Não há valores arbitrários `[...]`, nem hex, nem `style=`. Os SVGs de `public/icons/*.svg` trazem `fill` fixo em hex (`#4D327F` e outros) e `style="display:block"`, mas são exports do Figma e ficam em `public/` como `<img>`, então não violam a regra 02. O HTML não tem `<svg>`.
- **`optionClasses()` combinado com `[class]`** (`payment-method.page.ts:118-122`): funciona, mas um `@if` ou o binding direto seria mais legível. É preferência de estilo.
- **Testes:**
  - O acoplamento a classes Tailwind é o padrão já aceito pelo dono. Os testes usam `data-*`, `aria-checked` e `role`, que são robustos.
  - O hack `globalThis.process.getBuiltinModule('fs')` (spec linhas 12-23) é frágil. Ele depende de `cwd` (testa duas raízes) e de Node 22+. Vale como guarda simples, mas, se o ambiente mudar, falha longe do problema real. Alternativa: um teste só sobre a existência dos arquivos, ou `?raw`/`import.meta` do bundler. Não bloqueia.
  - Falta teste do caso inverso do bloqueante (rascunho novo depois de pedido ativo `PENDING`).

## Observações fora do escopo deste diff
- `_activeOrderId` nunca é limpo em nenhum lugar do `WalletService`. Mesmo corrigindo a tarefa 6, o ciclo de vida do pedido ativo merece uma Issue de manutenção, junto com o fluxo de falha e de cancelamento das próximas tarefas.
- Os `TODO #2` na página (rotas `/cofrinho/pix` e `/cofrinho/cartao`) dependem das tarefas 7 e 8. Até lá, a navegação leva a rotas inexistentes.

**Veredito final: REPROVADO**
Bloqueantes:
1. Precedência do pedido ativo sobre o rascunho em `payment-method.page.ts:38-50`, causada pelo `_activeOrderId` nunca limpo (`wallet.service.ts`, `buy-tokens.page.ts:162`), que cobra a quantidade antiga numa compra nova.
