# Plan — US01: Cadastro e Autenticação de Usuário + Casca do App

**Spec aprovada:** [specs/1-cadastro-autenticacao/spec.md](./spec.md)  
**Issue:** [#1 — US01 — Cadastro e Autenticação de Usuário](https://github.com/giovanacassias/utfgo/issues/1)

---

## 1. Decisões Técnicas

- **Estrutura de pastas (conforme `docs/architecture.md`):**
  - `apps/web/src/app/core/models/`: interfaces e tipos do domínio de autenticação (`User`, `OtpChallenge`, `AuthSession`).
  - `apps/web/src/app/core/auth/`: `AuthService` (estado reativo com Signals + `HttpClient` contra `json-server` + persistência em `localStorage`) e `authGuard` funcional com `inject()`.
  - `apps/web/src/app/core/layout/app-shell/`: componente da casca (`AppShellComponent`) com menu lateral fixo no desktop (`≥ 1024px`, Opção B do Figma), gaveta lateral (*drawer*) no celular (`< 1024px`) acionada por `☰`, cabeçalho superior, rodapé e palco central (`<router-outlet />`).
  - `apps/web/src/app/features/auth/`: módulo de rotas *lazy-loaded* para as telas pré-autenticação (`/` landing, `/entrar` login, `/criar-conta` cadastro, `/validar-codigo` PIN de 6 dígitos).
  - `apps/web/src/app/features/home/`: tela inicial autenticada (`/inicio`) renderizada dentro do palco central da casca, além de rotas placeholder para os demais links da barra lateral.
- **Biblioteca de UI e Estilo:** Componentes Angular v22 *Standalone* com controle de fluxo moderno (`@if`, `@for`), `signal()`, `computed()` e `inject()`, estilizados exclusivamente com **Tailwind CSS v4** e os tokens semânticos definidos em `apps/web/src/styles.css` (sem biblioteca externa pesada de componentes).
- **Configuração de rotas filhas (`<router-outlet />`):** `app.routes.ts` mantém as rotas públicas de acesso fora da casca e agrupa as rotas autenticadas sob uma rota pai com `component: AppShellComponent` e `canActivate: [authGuard]`, exibindo as telas filhas no `<router-outlet />` da casca.

---

## 2. Tarefas de Implementação (TDD)

- [x] **Tarefa 1 — Serviço de Autenticação: allowlist institucional e envio/reenvio de OTP**
  - Cobre: `CA6`, `CA7`, `CA8`, `CA11`, `CA12`, `CA13`, `CA15`, `CA16`
  - Teste primeiro: valida aceitação apenas da allowlist (`@alunos.utfpr.edu.br`, `@utfpr.edu.br`), bloqueio de e-mail inválido/não cadastrado no login/duplicado no cadastro/conta `SUSPENDED` ou `BANNED`, geração e reenvio de OTP de 6 dígitos (validade de 10 min) e tratamento de erro de rede via `HttpTestingController`.
  - Arquivos previstos: `apps/web/src/app/core/models/auth.model.ts`, `apps/web/src/app/core/auth/auth.service.ts`, `apps/web/src/app/core/auth/auth.service.spec.ts`

- [ ] **Tarefa 2 — Serviço de Autenticação: validação de OTP, persistência de sessão e logout**
  - Cobre: `CA9`, `CA10`, `CA14`
  - Teste primeiro: prova que um PIN de 6 dígitos válido dentro de 10 minutos autentica o usuário (criando a conta no fluxo de cadastro) e persiste a sessão; prova que PIN incompleto, incorreto ou expirado falha sem autenticar; e prova que o logout limpa a sessão.
  - Arquivos previstos: `apps/web/src/app/core/auth/auth.service.ts`, `apps/web/src/app/core/auth/auth.service.spec.ts`

- [ ] **Tarefa 3 — Guarda de Rotas (`authGuard`) e Roteamento Base (`app.routes.ts`)**
  - Cobre: `CA1`, `CA4`
  - Teste primeiro: prova que visitante não autenticado acessando `/inicio` é redirecionado para `/entrar` e que usuário autenticado acessa a rota filha dentro da casca.
  - Arquivos previstos: `apps/web/src/app/core/auth/auth.guard.ts`, `apps/web/src/app/core/auth/auth.guard.spec.ts`, `apps/web/src/app/app.routes.ts`

- [ ] **Tarefa 4 — Casca do App: Layout Desktop Fixo, Palco Central e Logout (`AppShellComponent`)**
  - Cobre: `CA1`, `CA3`, `CA10`
  - Teste primeiro: prova a renderização da barra lateral fixa com os 6 links (*Início*, *Caronas*, *Cofrinho*, *Pontos de encontro*, *Meu histórico*, *Meu perfil*), destaque do link ativo, cabeçalho com nome do usuário, `<router-outlet />`, rodapé e acionamento do botão Sair.
  - Arquivos previstos: `apps/web/src/app/core/layout/app-shell/app-shell.component.ts`, `apps/web/src/app/core/layout/app-shell/app-shell.component.html`, `apps/web/src/app/core/layout/app-shell/app-shell.component.spec.ts`

- [ ] **Tarefa 5 — Casca do App: Gaveta Lateral Mobile (`☰`) (`AppShellComponent`)**
  - Cobre: `CA2`
  - Teste primeiro: prova que tocar no botão `☰` abre a gaveta lateral exibindo os links de navegação, e tocar em um link ou no botão/backdrop de fechamento fecha a gaveta.
  - Arquivos previstos: `apps/web/src/app/core/layout/app-shell/app-shell.component.ts`, `apps/web/src/app/core/layout/app-shell/app-shell.component.html`, `apps/web/src/app/core/layout/app-shell/app-shell.component.spec.ts`

- [ ] **Tarefa 6 — Telas de Landing (`/`) e Login por E-mail (`/entrar`)**
  - Cobre: `CA5`, `CA7`, `CA11`, `CA13`, `CA15`, `CA16`
  - Teste primeiro: prova a navegação dos botões da landing para `/entrar` e `/criar-conta`, e no login valida e-mail institucional, exibe erros de domínio/não cadastrado/conta bloqueada/rede e navega para `/validar-codigo` no sucesso.
  - Arquivos previstos: `apps/web/src/app/features/auth/pages/landing/landing.page.ts`, `apps/web/src/app/features/auth/pages/login/login.page.ts`, `apps/web/src/app/features/auth/auth.routes.ts` e respectivos `.spec.ts`

- [ ] **Tarefa 7 — Tela de Cadastro (`/criar-conta`)**
  - Cobre: `CA5`, `CA6`, `CA11`, `CA12`, `CA16`
  - Teste primeiro: prova bloqueio por campos obrigatórios vazios, e-mail fora da allowlist ou já cadastrado, e avanço para `/validar-codigo` mantendo os dados pendentes quando válido.
  - Arquivos previstos: `apps/web/src/app/features/auth/pages/register/register.page.ts`, `apps/web/src/app/features/auth/pages/register/register.page.spec.ts`, `apps/web/src/app/features/auth/auth.routes.ts`

- [ ] **Tarefa 8 — Tela de Validação de Código OTP (`/validar-codigo`) e Início Pós-Login (`/inicio`)**
  - Cobre: `CA8`, `CA9`, `CA14`, `CA16`
  - Teste primeiro: prova entrada dos 6 dígitos, reenvio de código com aviso visual, mensagens de erro para PIN incompleto/inválido/expirado/falha de rede, e redirecionamento para `/inicio` exibindo *"Olá, \<Nome\>"* dentro da casca.
  - Arquivos previstos: `apps/web/src/app/features/auth/pages/verify-pin/verify-pin.page.ts`, `apps/web/src/app/features/home/home.page.ts`, `apps/web/src/app/features/auth/auth.routes.ts` e respectivos `.spec.ts`

---

## 3. Critérios sem tarefa

*(Nenhum — todos os critérios `CA1` a `CA16` estão cobertos pelas 8 tarefas acima.)*
