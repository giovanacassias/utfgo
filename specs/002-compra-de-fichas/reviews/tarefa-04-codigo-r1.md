# Parecer de Código — Tarefa 4 (Rodada 1 do novo ciclo, pós-Figma)

**Veredito:** REPROVADO (formato do agente: APONTAMENTOS). 2 bloqueantes.

Verificação: `npm test` passou (12 arquivos, 166 testes) e `npm run lint` passou sem erros. Li o diff e os arquivos não rastreados: `wallet.routes.ts`, `pages/wallet-overview/*`, `app.routes.spec.ts` e `public/cofrinho.png`. Ignorei `.claude/launch.json`.

## Apontamentos (bloqueiam)

1. **A tarifa "1 ficha = R$ 2,00" está escrita à mão no template, duplicando a regra que já existe no model.**
   - Onde: `apps/web/src/app/features/wallet/pages/wallet-overview/wallet-overview.page.html:92` e `:115`. Os specs repetem a string em `wallet-overview.page.spec.ts:148` e `:158`.
   - Regra violada: o model já exporta `TOKEN_UNIT_PRICE_CENTS = 200` e `formatBrlFromCents` (`wallet.model.ts:4` e `:81`). O saldo em R$ da mesma tela já usa essa função (`formatBrl(...)`). Duplicar regra existente reprova, segundo `.agents/agents/revisor-codigo.md`. O `architecture.md` §4 manda o componente consumir a camada da feature, não reimplementá-la.
   - Prejuízo concreto: se a tarifa mudar, o saldo em R$ e o extrato mudam e os dois textos fixos continuam mostrando R$ 2,00. A tela fica inconsistente em silêncio.
   - Como resolver: expor no componente algo como `readonly rateLabel = \`1 ficha = ${formatBrlFromCents(TOKEN_UNIT_PRICE_CENTS)}\`` e usá-lo nos dois pontos do template. Isso é só apontamento; não corrigi nada.

2. **Testes acoplados a nomes de classes Tailwind, com contagem inflada pelo markup duplicado.**
   - Onde: `wallet-overview.page.spec.ts:364-370` (`min-h-11`, `min-w-11`), `:372-385` e `:387-391` (`focus-visible:outline-2` e `focus-visible:outline-tertiary`). O trecho `:380` ainda exige `toBeGreaterThanOrEqual(9)` controles.
   - Regra violada: "teste acoplado a detalhe de implementação, que quebra em qualquer refatoração".
   - Prejuízo concreto: trocar `min-h-11` por um token ou utilitário equivalente, ou mover o foco para uma regra global em `styles.css`, quebra os testes sem que o comportamento mude. O número 9 inclui as cópias mobile e desktop dos botões (template `actions` renderizado duas vezes), então é frágil e não significa nada ao ler. O jsdom não calcula CSS, então esses testes não provam foco visível nem alvo de 44px.
   - Como resolver: tratar foco e alvo mínimo uma vez, de forma global (por exemplo uma regra `:focus-visible` em `styles.css`) e remover essas asserções de classe. Se o grupo preferir manter o guard, ele deve ficar num único teste e não amarrado a uma contagem.

## Sugestões (não bloqueiam)

- **Valores arbitrários do Tailwind**
  - `wallet-overview.page.html:154` usa `[scrollbar-width:none]` e `[&::-webkit-scrollbar]:hidden`. Não são cor, hex nem `style=`, então não classifiquei como bloqueante. Mesmo assim fogem de "só Tailwind com tokens". Um `@utility` em `styles.css` (por exemplo `scrollbar-hidden`) resolveria. Se você ler a regra de forma mais estrita, promova a bloqueante.
  - Os tamanhos `size-32`, `size-36`, `w-40` e `max-w-6xl` não estão no `@theme`. Só existem `--spacing-1` a `12` e `62`. Não achei hex nem `style=` no template.
- **Contraste**
  - `text-primary` (#FCB900 sobre branco, cerca de 1,6:1) é usado no saldo mobile (`:81`) e em "UTF" no `<h1>` (`:29`). O `design-tokens.md` diz que o amarelo leva texto escuro por cima. Texto amarelo sobre branco reprovaria WCAG, mesmo em texto grande. É fidelidade ao Figma contra acessibilidade, uma decisão do usuário. Registre-a como decisão consciente ou apresente o contraste.
- **Duplicação por breakpoint**
  - Dois `ng-template` (`piggyBank`, `actions`) evitam copiar o markup, e o ganho é real. Mas `actions` recebe `desktop` só para trocar a cor do link "Comprar fichas" (`:143`). Dá para fazer só com classes (`bg-secondary text-on-tertiary lg:bg-primary lg:text-on-primary`), como `filterClasses` já faz, e eliminar o parâmetro de contexto.
  - Os botões ficam duplicados no DOM, ocultos por `display:none`, então não aparecem na árvore de acessibilidade. Está correto. `querySelector('a[href="/cofrinho/comprar"]')` nos testes só enxerga a primeira cópia.
- **Legibilidade**
  - O `<h1>` (`:27-30`) usa o truque `{{ ' ' }}` entre spans e `<br class="lg:hidden">`. Dá para escrever de forma mais clara.
  - `tokensLabel` pode reutilizar `tokensUnit`.
  - Métodos chamados no template (`title`, `statusLabel`, `formatBrl`) são reavaliados a cada detecção de mudança. Funcionam, mas podiam ser um `computed` ou um pipe.
- **Semântica e acessibilidade**
  - O extrato seria melhor como `<ul>/<li>` do que como vários `<article>` soltos.
  - O `role="status"` do carregamento é inserido dinamicamente (`:66`). Leitores de tela costumam não anunciar uma live region que entra já preenchida. O ideal é manter o container sempre presente.
  - O `<img src="cofrinho.png">` é relativo (`:4`). Funciona com `<base href="/">`, mas `/cofrinho.png` é mais robusto.
- **Testes**
  - O teste `:259-266` se chama "filter-specific message", mas só confere que o vazio existe. Não verifica a diferença entre "sem movimentações" e "nenhum pedido neste filtro".
  - O comportamento do template em `lg` não é coberto (limitação do jsdom).
- **Rotas**
  - `app.routes.ts` removeu `data: { title: 'Cofrinho' }` do cofrinho, enquanto as outras rotas filhas mantêm `data.title`. Não achei consumidor de `data.title` em `core/`, então não quebra nada. A inconsistência fica para a tarefa 5 ou para a spec.
- **Linhas longas**
  - `:66` e `:154` ficam longas no HTML. O lint passa, mas vale formatar com Prettier.

## Avaliação das mudanças fora do previsto

- **(a) `walletApiUrl: '/api'` em `environment.development.ts` e a asserção em `wallet.model.spec.ts`:** aceitável. Alinha com `environment.ts`, com `API_URL` em `auth.service.ts` e com o proxy do `architecture.md` §4 (`proxy.conf.json` remove `/api`). Sem problema de segredo ou URL de ambiente. O spec mudou só o valor esperado.
- **(b) `public/cofrinho.png`:** aceitável. Tem 19 KB, é decorativo, usa `alt=""`, `aria-hidden="true"` e `width`/`height`, e `angular.json` já serve `public/`.

## Camadas e regras Angular (conforme)

- O componente não usa HttpClient nem acessa dados direto. Só injeta `WalletService` e `Router`, e consome os signals do serviço (`architecture.md` §2.1 e §4).
- `inject()`, `@if/@for` com `track`, sem `standalone: true`, sem NgModule, sem `any`, sem `.css` por componente e sem `style=`.
- `app.routes.ts` só mapeia com `loadChildren`, e `wallet.routes.ts` faz lazy com `loadComponent`.
- Os alvos de toque têm 44px ou mais (`min-h-11` e `min-h-12`). O erro tem texto com `role="alert"`. Os botões desabilitados têm texto, e o filtro ativo usa `aria-pressed`.
- `app.routes.spec.ts` cobre guard, shell e carga real da carteira, e é robusto.

## Observações fora do escopo deste diff

- `resumeOrder` navega para `/cofrinho/pagamento` e o link "Comprar fichas" aponta para `/cofrinho/comprar`. Nenhuma das duas rotas existe até as tarefas 5 a 6, então os cliques caem em rota inexistente. Os `TODO` já registram isso. Confirme o comportamento do fallback de rotas.
- `SIMULATED_USER_ID` fixo no `WalletService` ainda não usa a sessão do `AuthService` (já marcado com `TODO #2`).

**Bloqueantes (resumo):**
1. Tarifa "1 ficha = R$ 2,00" fixa no template (`wallet-overview.page.html:92` e `:115`), duplicando `TOKEN_UNIT_PRICE_CENTS`.
2. Testes acoplados a classes Tailwind e a uma contagem inflada pelo markup duplicado (`wallet-overview.page.spec.ts:364-391`).
