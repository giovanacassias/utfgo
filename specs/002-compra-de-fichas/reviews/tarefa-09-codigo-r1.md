# Parecer de Código — Tarefa 9 (rodada 1)

**Veredito:** APONTAMENTOS

Execução: `npm test` na raiz: 18 arquivos, 343 testes, todos passam. `npm run lint` na raiz: limpo, sem avisos. O diff dos arquivos alterados é só o esperado: duas rotas lazy com `loadComponent` em `wallet.routes.ts`, e remoção dos 4 comentários TODO/"arrive in task 9" nas páginas Pix e Cartão e nas rotas (os destinos `/cofrinho/aprovado` e `/cofrinho/falha` agora existem). Os comentários ficaram consistentes com o código.

## Apontamentos (bloqueiam)

1. **Pluralização errada com 1 ficha ("1 fichas") nas duas telas novas**
   - Onde: `payment-approved.page.html:112` (Quantidade adquirida) e `:146` (Novo saldo); `payment-failed.page.html:128` (Quantidade solicitada). Todos têm o sufixo ` fichas` fixo.
   - Regra violada: não há regra no `architecture.md` para isso. É duplicação/divergência de regra que já existe no repo (critério "duplicação de regra que já existe"). As outras telas da feature tratam o singular:
     - `buy-tokens.page.ts:176`, `card-payment.page.ts:217`, `payment-method.page.ts:54`, `wallet-overview.page.ts:80`: `count === 1 ? 'ficha' : 'fichas'`.
     - `buy-tokens.page.html:43`: `'ficha ativa' : 'fichas ativas'`.
     - `wallet-overview.page.ts:84`: usa o rótulo singular da mesma forma.
   - Prejuízo concreto: quem compra 1 ficha vê "1 fichas" na Falha e "1 fichas" na quantidade do Aprovado. O saldo do Aprovado, depois de comprar 1 ficha com carteira zerada, também vira "1 fichas". A fluência do app fica inconsistente entre telas do mesmo fluxo. O texto fixo do cabeçalho ("suas fichas já foram creditadas", `payment-approved.page.html:24,35,74`) também fica no plural com 1 ficha. Isso é copy do Figma, então só registre ou aceite, não precisa corrigir.
   - Sugestão de correção: extrair um helper único (ex.: `formatTokensLabel(count)` em `models/wallet.model.ts`, ao lado de `formatBrlFromCents`) e usá-lo nas duas telas novas. De quebra, ele elimina as 4 cópias privadas existentes.

2. **Nenhum teste cobre 1 ficha**
   - Onde: `payment-approved.page.spec.ts` e `payment-failed.page.spec.ts` só usam 8 fichas e saldo 15 ou 10. Por isso o defeito do item 1 passou despercebido.
   - Prejuízo: o bug só foi achado na revisão visual, e a regressão volta sem alarme. Acrescente um caso por tela com `tokensCount: 1` esperando "1 ficha". No Aprovado, inclua também saldo 1 esperando "1 ficha". Este é o RED plausível para o item 1.

## Sugestões (não bloqueiam)

- **Lógica de falha de navegação copiada em 4 páginas** (card, pix, approved, failed):
  - O `try { await router.navigate } catch`, o signal `navigationFailed`, o `busy` e o bloco `<div data-navigation-error>` com o mesmo texto repetem-se.
  - Em `payment-approved.page.ts:46-59` o `try/finally` aninhado ficou pesado para o que faz.
  - A duplicação nasceu na tarefa 7/8, então é candidata a refatoração própria, não deste diff. Mas fica pior a cada tela.
- **Duplicação mobile/desktop no HTML:**
  - O resumo é um só, com variantes `lg:`, o que é bom.
  - O cabeçalho (`h1`, imagem e subtítulo), os botões de ação (`data-*="mobile"` e `"desktop"`) e a imagem são renderizados duas vezes com `hidden`/`lg:hidden`. O corpo da imagem (`<img>`) é carregado nas duas instâncias.
  - Isso segue o padrão já usado em Pix e Cartão e atende "um único componente responsivo". A consequência é que cada mudança de texto ou de botão exige editar dois lugares, e os testes precisam clicar nos dois.
  - Alternativa: um conjunto de botões reordenado por classes `lg:`, quando o Figma permitir.
- **Contraste:** `text-danger` (#e42828) sobre `bg-danger-surface` (#fff1f0) dá cerca de 4,1:1. Isso fica abaixo de AA (4,5:1) em texto pequeno. Atinge a pílula "CÓDIGO EXPIRADO/CARTÃO RECUSADO" (`text-caption`), o alerta de erro e o botão "Tentar novamente". O padrão já existia nos alertas das tarefas anteriores. Se o token é fixo pelo design system, trate como observação de design.
- **Link "Voltar" mobile da Falha** (`payment-failed.page.html:3-9`): é um `routerLink` que não respeita o `busy()`. Durante um POST/PATCH em andamento, o usuário pode sair da tela no meio da ação. O mock é local e o dano é baixo, mas o bloqueio compartilhado não o cobre.
- **Testes acoplados a classes CSS:**
  - `expect(...className).toContain('bg-success'|'text-danger'|'border-danger'|'bg-danger-surface')` e `.not.toContain('text-white')` (approved spec:168-169, failed spec:165,202,276-277) quebram com qualquer refatoração de estilo. Provam o Figma, não o comportamento, e a pílula só tem uma classe de cor.
  - `data-*` como seletor é aceitável.
  - Se quiser provar cor, prefira um teste de design separado, ou aceite o acoplamento conscientemente.
- **Helper `publicFileExists`** está copiado em 5 specs (via `process.getBuiltinModule`). Ele é frágil por depender do `cwd`. Vale extrair para um utilitário de teste compartilhado.
- `ready` no Aprovado é um `signal` decidido uma vez. Funciona, e o comentário justifica o caso do F5. Um `computed` bastaria, mas só se o redirecionamento sair do `ngOnInit`. Preferência de estilo, não prejuízo.

## O que foi verificado e está correto

- **Snapshot de pedido/pagamento na Falha:**
  - É necessário. `createPaymentForOrder` faz `_activePaymentId.set(novo)`, então `activePayment` mudaria para o Payment PENDING recém-criado enquanto a navegação para `/cofrinho/pix` ainda está pendente. Sem o snapshot, a tela trocaria o motivo e o ID da transação no meio da ação.
  - O teste "keeps showing the failed attempt while navigating after a Pix retry" prova isso.
  - Riscos residuais: (a) voltar para `/falha` depois de iniciar um retry cai no guard de `ngOnInit` (Payment agora PENDING) e redireciona a `/cofrinho`, comportamento aceitável. (b) O snapshot não acompanha mudanças externas, o que é intencional.
- **Nenhum POST em `/orders`:** Pix cria só `POST /payments`. Cartão apenas navega (a página de cartão cria o Payment na abertura). "Outra forma" apenas navega. Cancelar faz `PATCH /orders/:id`. Isso está coberto por `expectNone` em POST `/orders`, POST e sem HTTP.
- **`retry()`** repete `lastAction` corretamente: o teste de erro em cancelar prova que ele repete o `cancelOrder`, e não o retry Pix.
- **Bloqueio de clique duplo e `busy` compartilhado** estão corretos e testados: `loading || submitting || navigationFailed`, com todos os botões `disabled`.
- **Erro de rede** vem de `walletService.error` e é exibido com `role="alert"`. **Falha de navegação** (`false` e rejeição) mostra alerta com saída para `/cofrinho`. O erro de serviço não se mistura com o de navegação (`@if / @else if`).
- **Aprovado é somente leitura:** `ngOnInit` não escreve, só `router.navigate`, e o teste confirma `expectNone` em POST/PATCH.
- **Estado inválido:** `COMPLETED`/`PAID` e `PENDING`/`FAILED` redirecionam a `/cofrinho` quando não batem, sem HTTP.
- **Estrutura e regras de código:**
  - `inject()`, `signal`/`computed`, `@if` e control flow moderno, sem `any`, sem NgModule, sem `standalone: true`, sem CSS por componente e sem `style=""`. A feature não importa outra feature.
  - Componente não toca HTTP: só `WalletService`.
  - Rotas lazy com `loadComponent`.
- **Tokens:** classes `text-display/title/small/caption/body`, `bg-primary/secondary/success/danger-surface/control-disabled`, `rounded-control/card/full`, `border-border` e `lg:` existem em `styles.css`. Não há hexadecimal nem valor fora da escala (`min-h-11`, `min-h-12`, `size-32`, `size-44` já são usados nas páginas anteriores).
- **Acessibilidade:**
  - Imagens decorativas com `alt=""` e `aria-hidden="true"`, conforme a regra 02 item 4.
  - Seta de voltar com `aria-label="Voltar"` e alvo de 44 px.
  - Botões com `min-h-11/12`.
  - `focus-visible` em todos os controles interativos.
  - Botão desabilitado "Buscar carona" com texto "Em breve".
  - `dl/dt/dd` semântico no resumo.
  - Um `h1` por largura (o oculto sai da árvore).
- **Responsividade:** mobile como base com `lg:grid lg:grid-cols-2`, resumo único com variantes. `break-all` no ID da transação evita overflow em 393 px.

## Observações fora do escopo deste diff (candidatas a Issue de manutenção)

- `core/layout/app-shell/app-shell.component.html:110` mostra `{{ saldo }} fichas` sem tratar o singular (saldo 1 vira "1 fichas" no cabeçalho de toda a casca).
- Extração de um helper único de rótulo de fichas (hoje 4 cópias privadas) e de um fluxo comum de "navegação falhou" (4 páginas).
- Utilitário de teste compartilhado para `publicFileExists`.
- Contraste `text-danger` sobre `bg-danger-surface` abaixo de AA em texto pequeno (decisão de design system).

Arquivos revisados: `apps/web/src/app/features/wallet/pages/payment-approved/` e `payment-failed/` (.ts, .html, .spec.ts), `apps/web/src/app/features/wallet/wallet.routes.ts`, e as páginas Pix e Cartão (remoção dos comentários).
