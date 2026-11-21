# Parecer de Código — Tarefa 4

**Veredito:** APONTAMENTOS (equivale a REPROVADO neste vocabulário do caller; há 1 bloqueante de baixo custo)

Verificação: `npm test` passa (12 arquivos, 158 testes). `npm run lint` passa sem avisos. Não encontrei `any`, `standalone: true`, NgModule, `*ngIf`/`*ngFor`, construtor com injeção, `.css` de componente, `style="..."` nem hex. Todas as classes de cor, fonte e raio existem em `@theme` de `apps/web/src/styles.css` (`bg-danger-surface`, `rounded-control`, `rounded-card`, `text-title-small`, `bg-control-disabled` e demais). O `app.routes.ts` só mapeia caminho para `loadChildren`, como pede o architecture.md §4. O componente injeta apenas `WalletService` e `Router`, nunca `HttpClient` (regra de ouro §2.1). A feature não importa outra feature.

## Apontamentos (bloqueiam)
1. **Link "Voltar" sem alvo de toque mínimo de 44 px.** Fica em `apps/web/src/app/features/wallet/pages/wallet-overview/wallet-overview.page.html:2`. O elemento é `w-fit text-title` e só tem a altura da seta (cerca de 32 px de entrelinha) e uma largura de poucos pixels. Todos os outros controles da página usam `min-h-11` ou `min-h-12`.
   Regra violada: `docs/design-tokens.md`, seção Espaçamento e forma ("Alvo mínimo recomendado para interação: 44 × 44 px"). A tarefa pede acessibilidade com alvos de toque.
   Prejuízo concreto: no celular, o único controle de navegação de volta é difícil de acertar. Correção natural: `inline-flex min-h-11 min-w-11 items-center justify-center`.

## Sugestões (não bloqueiam)
- **Foco visível.** Nenhum controle do template (`wallet-overview.page.html`) declara `focus-visible:outline-2 focus-visible:outline-tertiary`. O design-tokens (Estados de interação, "Foco por teclado") pede contorno de 2 px em `--color-tertiary`, e o `app-shell.component.html:84` já faz isso. Hoje vale só o outline padrão do navegador.
- **Estado "carregando" sem anúncio.** Em `wallet-overview.page.html:36` o parágrafo não tem `role="status"` nem `aria-live`. Leitor de tela não percebe o carregamento. A tabela de estados também pede "impedir envio duplicado" (já feito via `[disabled]="loading()"`) e "exibir indicador" (só há texto).
- **Teste fraco para filtro sem resultado.** O teste "shows a filter-specific message when the filter has no results" (`wallet-overview.page.spec.ts:218-225`) só verifica que `[data-statement-empty]` existe. O mesmo teste passaria se o template mostrasse a mensagem de "sem movimentações". Deveria afirmar `toContain('Nenhum pedido corresponde')`. O caso vazio inicial (linha 161) também não verifica o texto "Você ainda não tem movimentações".
- **Seletor genérico no teste.** `element.querySelector('[role="alert"]')` (`spec.ts:271` e `:291`) pega o primeiro alerta. Se os dois aparecerem juntos (bloqueio e erro), o teste vira dependente de ordem. Prefira dados específicos.
- **Regra de "falha" duplicada.** `statusLabel` em `wallet-overview.page.ts:85` usa `status === 'PENDING' && latestPayment?.status === 'FAILED'`. O `filteredTransactions` em `wallet.service.ts:147` usa `status !== 'COMPLETED' && ... === 'FAILED'`. São duas formulações da mesma regra. Hoje dão o mesmo resultado, mas divergem se surgir outro status. Considerar expor um `displayStatus` no service, ou um helper no model.
- **Bloqueio de conta depende do carregamento.** `isAccountBlocked` (`wallet.service.ts:77-80`) só vale depois de `loadWalletData` terminar com sucesso. Se o carregamento falhar, o usuário SUSPENDED/BANNED vê "Retomar pagamento" habilitado em dados antigos. A defesa existe nas ações do service, então não é bloqueante.
- **Rota de teste acoplada.** `app.routes.spec.ts:75-81` localiza a casca por `route.children !== undefined`. Isso quebra se outra rota ganhar `children`. O teste que navega de verdade (linha 91) já cobre o comportamento. O primeiro é teste de implementação, mas aceitável.
- **Destinos ainda inexistentes.** `/cofrinho/comprar` (`page.html:72`) e `/cofrinho/pagamento` (`page.ts:63`) ainda não existem e são tratados como TODO e tarefas 5 e 6. Confirme que o plano os cobre, para que o clique não leve a uma rota sem correspondência. O `data: { title }` do placeholder também foi removido. Verifique se o shell usa esse título para algo.

## Observações fora do escopo deste diff
- `WalletService` usa `SIMULATED_USER_ID` em vez do usuário da sessão do `AuthService` (US01). Isso é pré-existente (tarefas anteriores) e já está marcado com TODO. Vale uma Issue de manutenção para ligar a carteira ao usuário autenticado: o `app.routes.spec.ts` só passa porque o mock de sessão usa `user-1`.
- `architecture.md` §6 (mapa de rotas) não lista as rotas de frontend `/cofrinho/*` da US02. Atualizar quando a história fechar.

## Lista numerada de apontamentos bloqueantes
1. Link "Voltar" sem alvo de toque de 44 px, em `wallet-overview.page.html:2`.

Arquivos relevantes:
- C:\Users\danie\Documents\utfgo\apps\web\src\app\app.routes.ts
- C:\Users\danie\Documents\utfgo\apps\web\src\app\app.routes.spec.ts
- C:\Users\danie\Documents\utfgo\apps\web\src\app\features\wallet\wallet.routes.ts
- C:\Users\danie\Documents\utfgo\apps\web\src\app\features\wallet\pages\wallet-overview\wallet-overview.page.ts
- C:\Users\danie\Documents\utfgo\apps\web\src\app\features\wallet\pages\wallet-overview\wallet-overview.page.html
- C:\Users\danie\Documents\utfgo\apps\web\src\app\features\wallet\pages\wallet-overview\wallet-overview.page.spec.ts
