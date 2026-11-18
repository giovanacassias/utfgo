# US01 Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a US01 ponta a ponta, com autenticação OTP, App Shell responsivo, rotas protegidas, mock local executável e documentação pronta para PR em `develop`.

**Architecture:** Angular 22 standalone organiza o domínio em `core`, features lazy-loaded e componentes visuais sem acesso direto à API. `AuthService` concentra HTTP e estado com Signals/localStorage; o `json-server` fornece o mock local por trás do proxy `/api`; a casca autenticada envolve apenas rotas protegidas.

**Tech Stack:** Angular 22, TypeScript estrito, Signals, Reactive Forms, RxJS na fronteira HTTP, Vitest via `ng test`, Tailwind CSS v4, json-server.

**Spec:** `specs/1-cadastro-autenticacao/spec.md` e `docs/superpowers/specs/2026-11-18-us01-completion-design.md`

## Global Constraints

- Componentes são standalone nativos do Angular 22; não criar `NgModule`, `SharedModule` ou `app.module.ts`.
- Usar exclusivamente `@if`, `@for` e `@switch`; não usar `*ngIf`, `*ngFor` ou `*ngSwitch`.
- Usar `signal()`, `computed()`, `effect()`, `input()`, `output()` e `inject()` conforme o caso; não usar injeção por construtor nem decoradores legados.
- Formulários de tela usam Reactive Forms.
- Componentes não injetam `HttpClient` nem usam `fetch`; acesso ao servidor fica em services.
- Estilos usam apenas tokens semânticos e utilitários Tailwind v4; sem cores hexadecimais soltas em templates/componentes.
- O OTP simulado tem 6 dígitos e validade de 10 minutos.
- O cadastro aceita apenas `@alunos.utfpr.edu.br` e `@utfpr.edu.br`.
- Falhas de rede exibem mensagem amigável e mantêm os dados da tentativa para retry.
- Uma tarefa por vez: RED, GREEN, revisão de conformidade, revisão de código, triagem, autorização humana e commit `tarefa <n>: ...`.

## Review Focus

- Consulta de usuário vazia versus e-mail duplicado: o fluxo correto deve diferenciar login não cadastrado de cadastro duplicado; cobrir nas Tarefas 2, 6 e 7.
- Recarregar a tela de PIN ou perder a sessão: o desafio e a sessão devem ser recuperáveis sem autenticar um código expirado; cobrir na Tarefa 2 e 8.
- Navegação direta para rota protegida sem sessão: deve redirecionar sem renderizar a casca autenticada; cobrir na Tarefa 3.
- Alternância mobile/desktop no breakpoint de 1024px: drawer e menu fixo não podem aparecer simultaneamente; cobrir na Tarefa 5 e conferir manualmente.
- Falhas de API durante cadastro, login, confirmação e criação de usuário: devem preservar os campos e não deixar estado parcial; cobrir nas Tarefas 2, 6, 7 e 8.

## Preparação de ambiente

### Task 0: Integrar `develop`, regra Angular e mock local

**Files:**
- Merge: `origin/develop` into `feature/1-cadastro-autenticacao` (sem rebase).
- Create: `apps/api/db.json`, `apps/api/server.cjs`, `apps/web/proxy.conf.json`.
- Modify: `package.json`, `apps/web/angular.json`, `docs/architecture.md`.
- Test: verificação de scripts e requisições locais ao mock.

**Interfaces:**
- Produces: `npm run api` servindo a porta `3000`; proxy do Angular encaminhando `/api/*`; coleção `/users`; endpoint simulado `/auth/otp/send` aceitando `POST`.

- [ ] **Step 1: Confirmar a base antes do merge** — verificar branch atual, `git status`, `git log` e a existência da regra em `origin/develop`.
- [ ] **Step 2: Integrar `origin/develop`** — executar `git merge origin/develop`, resolver apenas conflitos necessários e preservar os commits de spec, plano e Tarefa 1.
- [ ] **Step 3: Configurar o mock** — adicionar seed mínimo de usuário ativo, suspenso e banido; implementar o middleware de OTP simulado sem SMTP; adicionar `json-server` como dependência de desenvolvimento e script raiz `api`.
- [ ] **Step 4: Configurar proxy e arquitetura** — encaminhar `/api` para `http://localhost:3000` e alinhar `docs/architecture.md` com Tailwind v4 e a estrutura efetiva do frontend.
- [ ] **Step 5: Verificar ambiente** — executar `npm run api` em processo controlado, consultar `/users`, enviar um POST de OTP e executar `npm test`, `npm run lint` e `npm run build`.
- [ ] **Step 6: Commit** — `git commit -m "tarefa 0: preparar ambiente da US01"` após revisão dos arquivos de configuração.

### Task 2: Confirmação de OTP, criação de conta, sessão e logout

**Files:**
- Modify: `apps/web/src/app/core/models/auth.model.ts`, `apps/web/src/app/core/auth/auth.service.ts`.
- Test: `apps/web/src/app/core/auth/auth.service.spec.ts`.

**Interfaces:**
- Consumes: `OtpChallenge`, `RegistrationData`, `User` e `pendingRegistration` da Tarefa 1.
- Produces: `confirmOtp(code: string): Observable<AuthSession>`, `session: Signal<AuthSession | null>`, `logout(): void`, com sessão serializada em `localStorage`.

- [ ] **Step 1: Escrever testes RED** para PIN válido de login, PIN válido de cadastro criando `User`, PIN incompleto/incorreto/expirado, persistência da sessão, restauração da sessão e logout.
- [ ] **Step 2: Rodar os testes** — esperado: falha porque `confirmOtp`, `session` e `logout` ainda não existem.
- [ ] **Step 3: Implementar o contrato** usando o desafio atual, `Date.now()`, comparação de código e POST de criação em `/users` apenas para cadastro; usar token simulado determinístico suficiente para o MVP.
- [ ] **Step 4: Rodar teste específico e suíte** — esperado: todos os testes do service passam e a suíte permanece verde.
- [ ] **Step 5: Commit** — `tarefa 2: confirmar otp e persistir sessão`.

### Task 3: Guard e roteamento base

**Files:**
- Create: `apps/web/src/app/core/auth/auth.guard.ts`, `apps/web/src/app/core/auth/auth.guard.spec.ts`.
- Modify: `apps/web/src/app/app.routes.ts`.

**Interfaces:**
- Consumes: `AuthService.session` da Tarefa 2.
- Produces: `authGuard: CanActivateFn`; rotas públicas `/`, `/entrar`, `/criar-conta`, `/validar-codigo`; rota protegida `/inicio` com `AppShellComponent` planejado na Tarefa 4.

- [ ] **Step 1: Escrever testes RED** para visitante redirecionado a `/entrar` e sessão ativa autorizada.
- [ ] **Step 2: Rodar testes** — esperado: falha por guard/rotas inexistentes.
- [ ] **Step 3: Implementar guard funcional com `inject()` e `UrlTree`; configurar `loadComponent`/`loadChildren` sem `NgModule`.
- [ ] **Step 4: Rodar testes e build** — esperado: redirecionamento e acesso autorizado passam.
- [ ] **Step 5: Commit** — `tarefa 3: proteger rotas autenticadas`.

### Task 4: App Shell desktop

**Files:**
- Create: `apps/web/src/app/core/layout/app-shell/app-shell.component.ts`, `.html`, `.spec.ts`.
- Modify: `apps/web/src/app/app.routes.ts` e, se necessário, `apps/web/src/app/styles.css` apenas para tokens.

**Interfaces:**
- Consumes: `AuthService.session` e `authGuard` das Tarefas 2–3.
- Produces: `AppShellComponent` com `<router-outlet>`, menu lateral desktop, cabeçalho, rodapé, links e logout.

- [ ] **Step 1: Escrever testes RED** para os seis links, rota ativa, nome do usuário, saldo/estado de conta, outlet, rodapé e botão Sair.
- [ ] **Step 2: Rodar testes** — esperado: componente inexistente ou sem a estrutura esperada.
- [ ] **Step 3: Implementar componente standalone** com `@for`, `routerLink`, `routerLinkActive`, Signals e tokens Tailwind; não incluir HTTP no componente.
- [ ] **Step 4: Rodar testes, lint e build** — esperado: todos verdes.
- [ ] **Step 5: Commit** — `tarefa 4: adicionar app shell desktop`.

### Task 5: Gaveta mobile

**Files:**
- Modify: `apps/web/src/app/core/layout/app-shell/app-shell.component.ts`, `.html`, `.spec.ts`.

**Interfaces:**
- Consumes: `AppShellComponent` da Tarefa 4.
- Produces: estado local `drawerOpen` e eventos de abrir, fechar por backdrop/botão e fechar após navegação.

- [ ] **Step 1: Escrever testes RED** para botão `☰`, links dentro da gaveta, fechamento por link e fechamento por backdrop.
- [ ] **Step 2: Rodar testes** — esperado: os testes falham sem o estado/eventos.
- [ ] **Step 3: Implementar `drawerOpen = signal(false)` e renderização responsiva com breakpoint `lg` (1024px), mantendo o menu desktop fora do mobile.
- [ ] **Step 4: Rodar testes e lint** — esperado: todos verdes.
- [ ] **Step 5: Commit** — `tarefa 5: adicionar gaveta mobile`.

### Task 6: Landing e login

**Files:**
- Create: `apps/web/src/app/features/auth/auth.routes.ts`, páginas `landing`, `login` e respectivos testes.
- Modify: `apps/web/src/app/app.routes.ts` e `apps/web/src/app/core/auth/auth.service.spec.ts` se necessário para cobertura de integração do service.

**Interfaces:**
- Consumes: `sendLoginOtp`, `OtpChallenge`, `AuthService` e rotas públicas.
- Produces: páginas `/` e `/entrar` com Reactive Forms, mensagens de validação/erro e navegação para `/validar-codigo` após sucesso.

- [ ] **Step 1: Escrever testes RED** para links da landing, allowlist, e-mail não cadastrado, conta suspensa/banida, erro de rede, estado de carregamento e navegação de sucesso.
- [ ] **Step 2: Rodar testes** — esperado: páginas/rotas ainda não existem.
- [ ] **Step 3: Implementar páginas standalone com Reactive Forms, `inject(Router)` e service; preservar valor do campo em erro.
- [ ] **Step 4: Rodar testes, lint e build** — esperado: critérios CA5, CA7, CA11, CA13, CA15 e CA16 cobertos.
- [ ] **Step 5: Commit** — `tarefa 6: adicionar landing e login`.

### Task 7: Tela de cadastro

**Files:**
- Create: `apps/web/src/app/features/auth/pages/register/register.page.ts`, `.html`, `.spec.ts`.
- Modify: `apps/web/src/app/features/auth/auth.routes.ts`.

**Interfaces:**
- Consumes: `sendRegistrationOtp`, `RegistrationData` e `pendingRegistration`.
- Produces: `/criar-conta` com formulário de nome, e-mail e câmpus; navegação para `/validar-codigo` após desafio aceito.

- [ ] **Step 1: Escrever testes RED** para obrigatórios, allowlist, duplicidade, erro de rede e sucesso mantendo dados pendentes.
- [ ] **Step 2: Rodar testes** — esperado: página ainda não existe.
- [ ] **Step 3: Implementar formulário e mensagens sem duplicar regra de e-mail fora do service.
- [ ] **Step 4: Rodar testes, lint e build** — esperado: CA5, CA6, CA11, CA12 e CA16 cobertos.
- [ ] **Step 5: Commit** — `tarefa 7: adicionar tela de cadastro`.

### Task 8: Validação de PIN e início autenticado

**Files:**
- Create: `apps/web/src/app/features/auth/pages/verify-pin/verify-pin.page.ts`, `.html`, `.spec.ts`.
- Create: `apps/web/src/app/features/home/home.page.ts`, `.html`, `.spec.ts`.
- Modify: `apps/web/src/app/features/auth/auth.routes.ts`, `apps/web/src/app/app.routes.ts`.

**Interfaces:**
- Consumes: `confirmOtp`, `resendOtp`, `session`, `AppShellComponent` e rota protegida.
- Produces: `/validar-codigo` com PIN de seis dígitos, reenvio, mensagens de erro e `/inicio` com saudação do usuário.

- [ ] **Step 1: Escrever testes RED** para PIN incompleto/incorreto/expirado, confirmação válida, reenvio, erro de rede, redirecionamento e saudação.
- [ ] **Step 2: Rodar testes** — esperado: páginas/integracão ainda não existem.
- [ ] **Step 3: Implementar páginas standalone e vincular o fluxo ao service/guard.
- [ ] **Step 4: Rodar suíte, lint e build** — esperado: CA8, CA9, CA10, CA14 e CA16 cobertos.
- [ ] **Step 5: Commit** — `tarefa 8: concluir fluxo de otp e início`.

### Task 9: Fechamento da história e documentação

**Files:**
- Modify: `docs/prd.md`, `specs/README.md`, `docs/architecture.md`, `specs/1-cadastro-autenticacao/plan.md`.
- Create: evidências manuais no pacote do PR (fora do código-fonte).

**Interfaces:**
- Consumes: todos os critérios CA1–CA16 implementados e auditoria final aprovada.
- Produces: história `Live`, spec marcada como implementada, plano completo e pacote de PR para `develop`.

- [ ] **Step 1: Rodar auditoria local** — conferir todos os CA, todos os TODOs de premissas, scripts, testes e estrutura standalone.
- [ ] **Step 2: Atualizar PRD/README de specs/arquitetura** apenas com o estado comprovado pela implementação.
- [ ] **Step 3: Rodar `npm test`, `npm run lint`, `npm run build` e `npm run format:check`; corrigir somente problemas pertencentes à história.
- [ ] **Step 4: Iniciar `npm run api` e `npm start`; conferir mobile 393×852 e desktop 1440×960, coletando os dois prints exigidos.
- [ ] **Step 5: Preparar PR para `develop`** com explicação da equipe, apontamentos aceitos/recusados, prints e `Closes #1`; push/merge/fechamento da Issue somente com autorização explícita.

## Self-review do plano

- **Cobertura da spec:** CA1–CA4 nas Tarefas 3–5; CA5–CA7 e CA11–CA13/CA15–CA16 nas Tarefas 6–7; CA8–CA10 e CA14/CA16 nas Tarefas 2 e 8.
- **Dependências:** Tarefa 2 define sessão e confirmação; Tarefa 3 consome a sessão; Tarefas 4–5 consomem guard/sessão; Tarefas 6–8 consomem service e rotas; Tarefa 9 depende de todas.
- **Escopo:** não há nova história funcional; a infraestrutura serve apenas ao contrato já definido na US01.
- **Fora do código:** branch padrão, ruleset, PR mesclado, Issue/quadro e tutor proof são verificações/ações externas, não serão simulados no repositório.
