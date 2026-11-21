# Parecer de Código — Tarefa 3, rodada 2

**Classificação:** APROVADO

## Escopo e base da revisão

Foram lidos `docs/architecture.md`, `specs/1-cadastro-autenticacao/plan.md`, `specs/1-cadastro-autenticacao/reviews/tarefa-03-decisoes-r1.md` e o estado atual do diff desde o início da Tarefa 3. A análise considerou a alteração rastreada em `app.routes.ts` contra `5d6f3a3` e o conteúdo efetivo dos arquivos não rastreados relacionados à tarefa.

A revisão ficou restrita ao código e ao escopo da Tarefa 3. Nenhum código foi alterado.

## Apontamentos aceitos na rodada 1

### 1. `app.routes.ts` restrito à composição e componentes nas fronteiras corretas

**Verificado e atendido.**

- `apps/web/src/app/app.routes.ts:1-26` contém apenas o tipo de rotas, a referência ao `authGuard` e a composição das rotas públicas/protegidas. Não declara componentes de UI diretamente.
- A casca está em `apps/web/src/app/core/layout/app-shell/app-shell.component.ts:1-9`, dentro da fronteira `core/layout/app-shell` prevista no plano.
- O placeholder de autenticação está em `apps/web/src/app/features/auth/pages/route-placeholder/route-placeholder.page.ts:1-7`, dentro da feature `auth`.
- O placeholder da tela autenticada está em `apps/web/src/app/features/home/pages/home-placeholder/home-placeholder.page.ts:1-7`, dentro da feature `home`.
- A rota protegida mantém `canActivate: [authGuard]` e renderiza a casca como pai das rotas da feature `home` (`app.routes.ts:11-24`).

Isso resolve o apontamento aceito sem transferir declarações de componentes para o composition root.

### 2. Rotas lazy-loaded com `loadComponent`/`loadChildren`

**Verificado e atendido.**

- As rotas públicas delegam para `features/auth/auth.routes` via `loadChildren` (`app.routes.ts:6-10`).
- A casca é carregada via `loadComponent` a partir de `core/layout/app-shell` (`app.routes.ts:14-17`).
- As rotas autenticadas delegam para `features/home/home.routes` via `loadChildren` (`app.routes.ts:18-23`).
- Todas as rotas efetivas de `AUTH_ROUTES` usam `loadComponent` (`features/auth/auth.routes.ts:3-33`).
- A rota de `/inicio` usa `loadComponent` (`features/home/home.routes.ts:3-11`).

O teste de roteamento também verifica a composição lazy (`auth.guard.spec.ts:36-45`), além dos cenários de redirecionamento e acesso autenticado.

## Verificações adicionais solicitadas

- **Angular 22:** `apps/web/package.json` declara Angular `^22.2.0` e CLI/build `^22.2.5`.
- **Standalone:** os componentes introduzidos usam o padrão standalone nativo do Angular 22, sem `standalone: true` e sem `NgModule`. `AppShellComponent` importa somente `RouterOutlet` (`app-shell.component.ts:1-7`).
- **`inject()`:** `authGuard` injeta `AuthService` e `Router` com `inject()` (`core/auth/auth.guard.ts:1-10`); não há injeção por construtor nos arquivos da tarefa.
- **Signals/AuthService:** o guard consulta `AuthService.session()` (`auth.guard.ts:6-10`); a sessão é um signal somente leitura exposto pelo serviço (`core/auth/auth.service.ts:19-26`). O spec fornece um signal como sessão do `AuthService` (`auth.guard.spec.ts:14-24`).
- **`UrlTree`:** o redirecionamento usa `router.parseUrl('/entrar')` (`auth.guard.ts:10`), sem navegação imperativa.
- **Templates e camada de dados:** não há `*ngIf`, `*ngFor`, `fetch`, `HttpClient` ou `HttpClientModule` nos componentes da tarefa. A busca em `apps/web/src/app` encontrou `HttpClient` apenas em `core/auth/auth.service.ts` e nos testes do serviço, não em componente.
- **Escopo:** as adições relacionadas à tarefa limitam-se ao guard, seu spec, composição de rotas, casca mínima necessária e rotas/placeholders das features. Não foram introduzidas funcionalidades das Tarefas 4–8; a casca visual completa permanece para as Tarefas 4 e 5, conforme o plano.

## Testes e verificações

- `npm --workspace=apps/web run test -- --watch=false`: **3 arquivos aprovados, 27 testes aprovados**.
- `npm --workspace=apps/web run test -- --watch=false --include src/app/core/auth/auth.guard.spec.ts`: **1 arquivo aprovado, 4 testes aprovados**.
- `npm --workspace=apps/web run lint`: concluído com código de saída 0 e sem diagnósticos.
- `git diff --check`: concluído sem apontamentos de whitespace.

## Sugestões não bloqueantes

- Reforçar futuramente o spec para verificar explicitamente cada rota pública (`/`, `/entrar`, `/criar-conta` e `/validar-codigo`) e cada rota filha da feature, em vez de validar apenas a forma lazy das entradas principais. A composição atual já atende ao requisito.
- Na Tarefa 4, substituir o `AppShellComponent` mínimo pelo layout previsto no plano, preservando a mesma fronteira `core/layout/app-shell` e o `<router-outlet />` para as rotas filhas.

Não há apontamentos bloqueadores nesta rodada.
