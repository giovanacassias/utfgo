# Parecer de Código — Tarefa 3, rodada 1

**Classificação:** APONTAMENTOS

## Escopo revisado

Foram lidos `docs/architecture.md`, a Tarefa 3 de `specs/1-cadastro-autenticacao/plan.md`, o diff atual contra `HEAD` e o conteúdo efetivo dos arquivos não rastreados `auth.guard.ts` e `auth.guard.spec.ts`. A revisão ficou restrita à aderência arquitetural, ao escopo da tarefa e à qualidade dos testes. Nenhum arquivo de produção ou de teste foi alterado.

## Verificações conformes

- O guard é funcional e usa `inject()` para obter `AuthService` e `Router` (`apps/web/src/app/core/auth/auth.guard.ts:1-10`); não há injeção por construtor.
- A decisão de acesso é baseada na fonte de sessão do `AuthService` (`authService.session()`), que é um signal somente leitura (`apps/web/src/app/core/auth/auth.service.ts:22-26`).
- O redirecionamento retorna `router.parseUrl('/entrar')`, isto é, um `UrlTree`, sem navegação imperativa (`auth.guard.ts:8-10`).
- O bootstrap standalone usa `provideRouter(routes)` em `app.config.ts:2-6`, e o spec usa o mesmo padrão com `provideRouter(routes)` (`auth.guard.spec.ts:17-24`).
- As rotas públicas estão fora da rota pai protegida (`app.routes.ts:20-24`); `/inicio` está sob uma rota pai com `canActivate: [authGuard]` e `<router-outlet />` (`app.routes.ts:7-12,25-30`).
- Os componentes são standalone no padrão do Angular 22: não declaram `standalone: true`, importam `RouterOutlet` quando necessário e não usam `NgModule` (`app.routes.ts:7-18`). Não há `*ngIf`, `*ngFor`, `HttpClient` ou `fetch` nos componentes introduzidos pela tarefa.
- Os dois testes cobrem os cenários previstos no plano: visitante redirecionado de `/inicio` para `/entrar` e usuário com sessão renderizando `/inicio` como filho dentro da casca (`auth.guard.spec.ts:31-56`).

## Apontamentos (bloqueiam a aprovação)

1. **`app.routes.ts` não está restrito à composição de rotas de features.** O arquivo declara `AppShellComponent` e `RoutePlaceholderComponent` diretamente (`apps/web/src/app/app.routes.ts:1-18`). Isso contraria a regra de `docs/architecture.md:128-130`, segundo a qual `app.routes.ts` apenas mapeia caminhos para rotas das features, e também desloca a casca para fora do diretório previsto em `plan.md:13` (`core/layout/app-shell/`). A rota pai pode continuar sendo definida aqui, mas as declarações de componentes devem pertencer às suas próprias fronteiras arquiteturais; caso contrário, a tarefa deixa o composition root responsável por UI e cria uma base que precisará ser desfeita na Tarefa 4.

2. **As rotas efetivas não são lazy-loaded como exige a arquitetura.** Todas as rotas públicas e a rota filha protegida apontam diretamente para `RoutePlaceholderComponent` (`apps/web/src/app/app.routes.ts:20-30`); não há `loadComponent` nem `loadChildren`. A exigência está explícita em `docs/architecture.md:44` e `130`, e o plano prevê as rotas de autenticação em feature lazy-loaded (`plan.md:14-17`). Os placeholders permitem testar o guard, mas não constituem o roteamento base arquiteturalmente previsto; a implementação deve compor as rotas das features, preservando a separação pública/protegida.

## Sugestões não bloqueantes

- Acrescentar um teste de regressão que navegue para cada rota pública e confirme que nenhuma delas é renderizada dentro de `app-shell`; isso documentaria diretamente a separação entre pré-autenticação e casca autenticada.
- Acrescentar uma asserção específica para o caso autenticado verificando o elemento de conteúdo filho e uma para o redirecionamento verificando a ausência da casca, além de conferir que o teste realmente falha quando a rota é movida para fora/para dentro da rota pai protegida.
- Quando os componentes reais das features existirem, substituir os placeholders e manter o teste de roteamento no nível de integração com `RouterTestingHarness`, sem duplicar a lógica do guard no spec.

## Verificação de execução

Foi feita verificação estática e `git diff --check` não apontou whitespace inválido. Os testes/lint não foram executados porque `apps/web/node_modules` não está presente no workspace.
