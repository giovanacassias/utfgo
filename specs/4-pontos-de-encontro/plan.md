# Plan — US04: Gestão de Pontos de Encontro

**Spec aprovada:** [specs/4-pontos-de-encontro/spec.md](./spec.md)  
**Issue:** [#8 — US04 — Gestão de Pontos de Encontro](https://github.com/giovanacassias/utfgo/issues/8)

---

## 1. Decisões Técnicas

- **Estrutura de Pastas e Módulos (alinhada a `docs/architecture.md`):**
  - `apps/web/src/app/features/meeting-points/`:
    - `models/meeting-point.model.ts`: interface `MeetingPoint`, tipos de filtro e interface de resposta do ViaCEP (`ViaCepResponse`).
    - `services/cep.service.ts`: serviço dedicado para consulta da API pública do ViaCEP (`https://viacep.com.br/ws/{cep}/json/`), com tratamento de erro e validação de formato.
    - `services/meeting-points.service.ts`: camada reativa com `signal()`, `computed()` e `HttpClient` para operações de listagem, busca, criação e alternância de status (Soft Delete) contra o backend/mock.
    - `components/`:
      - `point-card/point-card.component.ts`: componente dumb de apresentação usando `input.required<MeetingPoint>()` e `output<string>()`.
      - `point-search/point-search.component.ts`: componente de filtro e busca com two-way binding usando Signal `model()`.
    - `pages/`:
      - `points-list/points-list.page.ts`: listagem geral com `@defer (on viewport)`, busca reativa e atalho para novo ponto.
      - `point-create/point-create.page.ts`: formulário reativo com busca automática por CEP (ViaCEP) e validação de duplicidade.
      - `point-details/point-details.page.ts`: detalhes e ação de desativação/reativação, consumindo o `:id` da rota via `input.required<string>()`.
    - `meeting-points.routes.ts`: roteamento modular da feature com lazy loading.
- **Configuração de Roteamento Dinâmico com Signal Input Binding:**
  - Adição de `withComponentInputBinding()` em `app.config.ts` (`provideRouter(routes, withComponentInputBinding())`), permitindo que parâmetros de rota (como `:id`) sejam mapeados automaticamente para inputs de componentes.
- **Integração na Casca e Atalho na Home:**
  - O componente `HomePage` (`features/home/home.page.ts`) ganha um atalho/card navegável para `/pontos-de-encontro`.
  - A casca autenticada (`AppShellComponent`) carrega `meeting-points.routes.ts` como rota filha protegida por `authGuard`.
- **Backend / Mock (`apps/api/db.json` e `apps/api/server.cjs`):**
  - Entidade `meetingPoints` registrada no seed com pontos iniciais do câmpus da UTFPR.
  - Endpoints REST padrão suportados: `GET /meeting-points`, `POST /meeting-points`, `PATCH /meeting-points/:id`.

---

## 2. Tarefas de Implementação (TDD)

- [x] **Tarefa 1 — Modelos de domínio e Serviço de Consulta do ViaCEP (`CepService`)**
  - Cobre: `CA8`, `CA9`, `CA10`
  - Teste primeiro (`cep.service.spec.ts` com `HttpTestingController`): valida chamada `GET` para o ViaCEP ao receber CEP limpo de 8 dígitos, rejeição síncrona de formato inválido, tratamento do retorno `{ erro: "true" }` e tratamento resiliente de falha de rede/API offline.
  - Arquivos previstos: `apps/web/src/app/features/meeting-points/models/meeting-point.model.ts`, `apps/web/src/app/features/meeting-points/services/cep.service.ts`, `apps/web/src/app/features/meeting-points/services/cep.service.spec.ts`

- [x] **Tarefa 2 — Serviço de Pontos de Encontro (`MeetingPointsService`) e Seed no Mock**
  - Cobre: `CA11`, `CA12`, `CA14`
  - Teste primeiro (`meeting-points.service.spec.ts`): prova carregamento de pontos, criação com `isActive = true`, bloqueio por duplicidade de nome no mesmo endereço, e alternância de status (*Soft Delete*) via `toggleStatus(id)` atualizando o estado reativo sem exclusão física.
  - Arquivos previstos: `apps/api/db.json`, `apps/web/src/app/features/meeting-points/services/meeting-points.service.ts`, `apps/web/src/app/features/meeting-points/services/meeting-points.service.spec.ts`

- [x] **Tarefa 3 — Componentes Reativos de Apresentação: Card e Busca (`PointCardComponent` e `PointSearchComponent`)**
  - Cobre: `CA5`, `CA6`
  - Teste primeiro (`point-card.component.spec.ts` e `point-search.component.spec.ts`): prova renderização dos dados do ponto via `input()` e disparo de evento via `output()`; prova sincronização bidirecional do termo de busca e filtro de ativos usando Signal `model()`.
  - Arquivos previstos: `apps/web/src/app/features/meeting-points/components/point-card/point-card.component.ts`, `apps/web/src/app/features/meeting-points/components/point-search/point-search.component.ts` e seus respectivos `.spec.ts`

- [ ] **Tarefa 4 — Configuração de Roteamento com `withComponentInputBinding` e Atalho na Home**
  - Cobre: `CA1`, `CA2`, `CA3`
  - Teste primeiro: prova que `withComponentInputBinding()` está habilitado em `app.config.ts`, que as rotas filhas `/pontos-de-encontro` estão protegidas pelo `authGuard`, e que a tela inicial (`/inicio`) renderiza o atalho funcional para a gestão de pontos.
  - Arquivos previstos: `apps/web/src/app/app.config.ts`, `apps/web/src/app/app.routes.ts`, `apps/web/src/app/features/home/home.page.ts`, `apps/web/src/app/features/home/home.page.spec.ts`

- [ ] **Tarefa 5 — Tela de Listagem com `@defer` e Filtro Reativo (`PointsListPage`)**
  - Cobre: `CA4`, `CA6`, `CA7`
  - Teste primeiro (`points-list.page.spec.ts`): prova iteração com `@for (point of points(); track point.id)`, integração com `<app-point-search>`, filtragem reativa dinâmica e presença de `@defer` com placeholder de carregamento.
  - Arquivos previstos: `apps/web/src/app/features/meeting-points/pages/points-list/points-list.page.ts`, `apps/web/src/app/features/meeting-points/pages/points-list/points-list.page.spec.ts`, `apps/web/src/app/features/meeting-points/meeting-points.routes.ts`

- [ ] **Tarefa 6 — Formulário Reativo de Cadastro com Autopreenchimento de CEP (`PointCreatePage`)**
  - Cobre: `CA8`, `CA9`, `CA10`, `CA11`, `CA12`, `CA13`
  - Teste primeiro (`point-create.page.spec.ts`): prova que ao digitar CEP válido os campos de rua/bairro/cidade são preenchidos; valida mensagens de erro para CEP não encontrado/falha de rede; valida botão desabilitado com campos obrigatórios vazios; e prova redirecionamento para a lista após criação com sucesso.
  - Arquivos previstos: `apps/web/src/app/features/meeting-points/pages/point-create/point-create.page.ts`, `apps/web/src/app/features/meeting-points/pages/point-create/point-create.page.spec.ts`

- [ ] **Tarefa 7 — Tela de Detalhes e Ações com Rota Dinâmica `:id` (`PointDetailsPage`)**
  - Cobre: `CA1`, `CA14`
  - Teste primeiro (`point-details.page.spec.ts`): prova que o componente recebe `id = input.required<string>()` da URL, carrega o ponto correspondente, e permite alternar o status (*Soft Delete*) com confirmação visual e feedback.
  - Arquivos previstos: `apps/web/src/app/features/meeting-points/pages/point-details/point-details.page.ts`, `apps/web/src/app/features/meeting-points/pages/point-details/point-details.page.spec.ts`

---

## 3. Critérios sem tarefa

*(Nenhum — todos os critérios `CA1` a `CA14` estão estritamente cobertos pelas 7 tarefas acima.)*
