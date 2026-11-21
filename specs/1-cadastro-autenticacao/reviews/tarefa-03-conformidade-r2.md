# Parecer de Conformidade — Tarefa 3, rodada 2

**Classificação:** APROVADO

## Escopo verificado

Foram considerados `specs/1-cadastro-autenticacao/spec.md`, `plan.md`, os pareceres e decisões da rodada 1 da Tarefa 3, e o estado atual desde o início da Tarefa 3, tomando como base o commit `5d6f3a3` (Tarefa 2). A verificação cobriu CA1 estrutural, CA4, os dois comportamentos previstos no plano, isolamento das rotas públicas, proteção de `/inicio`, ausência de implementação de tarefas futuras e cobertura/execução dos testes. Nenhum arquivo de código foi alterado.

## Evidências

1. **CA1 estrutural — casca, palco e composição de rotas:** `apps/web/src/app/app.routes.ts:5-25` não declara componentes diretamente. A rota protegida carrega `AppShellComponent` por `loadComponent` (`app.routes.ts:12-17`) e insere as rotas filhas sob `children` (`app.routes.ts:18-24`). O shell mínimo em `apps/web/src/app/core/layout/app-shell/app-shell.component.ts:4-8` contém apenas o `<router-outlet />`, suficiente para a estrutura da Tarefa 3; a casca visual permanece para a Tarefa 4.

2. **Correção dos apontamentos aceitos na r1:** a composição deixou de concentrar declarações de UI em `app.routes.ts`, e o roteamento passou a usar lazy loading: `loadChildren` para as rotas públicas e de feature (`app.routes.ts:7-10,20-23`) e `loadComponent` para a casca (`app.routes.ts:14-17`). Isso atende à decisão r1 e à regra de `docs/architecture.md:44,128-130`.

3. **CA4 — guarda funcional e redirecionamento:** `apps/web/src/app/core/auth/auth.guard.ts:6-10` injeta `AuthService` e `Router`; com sessão retorna `true`, e sem sessão retorna `router.parseUrl('/entrar')`. Não há navegação imperativa nem exibição da casca no caminho de bloqueio.

4. **Preservação do comportamento de visitante não autenticado:** `apps/web/src/app/core/auth/auth.guard.spec.ts:47-51` navega para `/inicio` sem sessão e confirma a URL final `/entrar`. O teste passou.

5. **Preservação do comportamento de usuário autenticado:** `apps/web/src/app/core/auth/auth.guard.spec.ts:53-72` injeta uma `AuthSession`, navega para `/inicio`, confirma a URL `/inicio` e verifica o conteúdo filho dentro de `app-shell`. O teste passou.

6. **Rotas públicas fora da casca:** `apps/web/src/app/app.routes.ts:6-10` delega `/`, `/entrar`, `/criar-conta` e `/validar-codigo` a `features/auth/auth.routes.ts`; a casca aparece somente na segunda rota de composição (`app.routes.ts:11-25`), com `canActivate` e as rotas autenticadas em `features/home/home.routes.ts`. O teste estrutural também confirma que as rotas de composição não possuem `component` direto (`auth.guard.spec.ts:32-34`) e que as fronteiras são lazy-loaded (`auth.guard.spec.ts:36-45`).

7. **`/inicio` como filho protegido:** `apps/web/src/app/app.routes.ts:11-24` aplica `canActivate: [authGuard]` à rota pai que contém o `loadChildren` de `HOME_ROUTES`; `features/home/home.routes.ts:3-10` define `inicio` dentro dessa árvore. Assim, o guard protege o acesso antes da renderização da casca e do filho.

8. **Ausência de tarefas futuras:** o diff da Tarefa 3 contém apenas o guard, seus testes, a composição de rotas e placeholders mínimos para as fronteiras `auth`, `home` e `app-shell`. Não foram implementados layout desktop/mobile, gaveta, navegação visual, logout de UI, telas de login/cadastro/OTP, caronas, cofrinho, pontos de encontro, histórico ou perfil. Os placeholders têm templates mínimos (`route-placeholder.page.ts:3-7`, `home-placeholder.page.ts:3-7`) e não antecipam as Tarefas 4–8.

9. **Cobertura e execução:** o teste direcionado da Tarefa 3 passou com **1 arquivo e 4 testes aprovados**. A suíte web completa passou com **3 arquivos e 27 testes aprovados**. O lint passou sem erros. O build foi iniciado, mas não concluiu porque o Angular tentou buscar `fonts.googleapis.com` para inlining de fonte e a rede retornou `EAI_AGAIN`; não houve erro de compilação atribuído às mudanças da Tarefa 3.

## Comandos executados

```text
npm --workspace=apps/web run test -- --include src/app/core/auth/auth.guard.spec.ts
Resultado: 1 arquivo aprovado; 4 testes aprovados.

npm --workspace=apps/web run test -- --watch=false
Resultado: 3 arquivos aprovados; 27 testes aprovados.

npm --workspace=apps/web run lint
Resultado: aprovado.

git diff --check HEAD
Resultado: sem erros.
```

## Apontamentos

Nenhum apontamento bloqueador ou não bloqueador para a conformidade da Tarefa 3 nesta rodada.
