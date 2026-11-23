# ✅ Checklist — a ficha da disciplina

> Este arquivo é **a única fonte do que a disciplina exige**: as regras do
> projeto, os Indicadores de Desempenho (IDs) e as entregas. Os workflows
> `/utf-prd` e `/utf-architecture` o usam como régua de conferência — trocar
> de disciplina (ou de semestre) é trocar este arquivo, sem mexer no framework.
> Marque um item **somente quando conseguir explicá-lo** — item preenchido
> sem o aluno saber explicar é penalizado com a retirada da nota **deste e de
> mais um item feito**. Não altere os enunciados.
> ➡️ O detalhamento do checklist e das entregas está no Guia do Projeto no
> Notion: [link no Moodle].

## 📐 Regras da disciplina

- **Tema unificado do semestre** *(este bullet muda a cada semestre)* —
  **2026/2: gestão de Caronas na UTFPR** — uma plataforma web funcional,
  intuitiva e moderna para organizar caronas, gerenciar participantes e
  automatizar resultados. O tema é o mesmo para toda a turma; cada equipe
  imprime a própria **identidade visual, fluxo de UX e funcionalidades
  extras**. O app integra o portal **UTFApps**, como legado para a
  comunidade.
- **Equipes:** 2 ou 3 integrantes.
- **Stack fixa:** **Angular 20+** — arquitetura **standalone** (sem NgModules),
  **Signals** para estado, sintaxe moderna (`@if`/`@for`/`@switch`/`@defer`,
  `input()`/`output()`/`model()`, `inject()`).
- **Sem backend próprio — e em duas fases:** no MVP (Entrega 2) os dados vêm
  de um **json-server** (API fake local); na Entrega 3 a aplicação troca para
  um **BaaS** (ex.: Supabase, PocketBase) com autenticação (JWT) e CRUD reais.
  A escolha do BaaS é da equipe, registrada no documento técnico — e a troca
  deve atingir **só os Services**: planeje a camada de dados para isso desde o
  início (é a regra "componente não fala com o servidor" valendo dinheiro).
- **Framework CSS moderno** à escolha (ex.: Tailwind CSS, PrimeNG), com
  **Design System** próprio da equipe (tokens em `docs/design-tokens.md`).
- **UI/UX:** protótipo navegável (Stitch/Figma) com link público no
  repositório; **Mobile-First** responsivo; experiência **PWA**
  (`manifest.webmanifest`, ícones, tema, splash, standalone, estados offline).
- **Fluxo de trabalho: Gitflow** — branches `main` e `develop`; features em
  branches curtas a partir da `develop`, integradas via Pull Request;
  a `main` reflete produção. (Atenção: **não** é GitHub Flow.)
- **Deploy** em produção: Vercel, Render ou similar.
- **Desenvolvimento progressivo:** as atividades semanais são entregas
  parciais do projeto — pratique o conteúdo da semana no próprio app.
- **Documento técnico:** `docs/architecture.md` (no texto oficial da
  disciplina ele é chamado de `ssd.md` — é o mesmo documento).
- **README.md** com a estrutura exigida: título/nome do app, autores,
  descrição, links para `docs/prd.md`, `docs/architecture.md` e
  `docs/checklist.md`, link do protótipo (Stitch/Figma), stack (Angular, framework CSS,
  BaaS, bibliotecas), link do site em produção, instruções de execução e
  imagens de telas.

## Progresso do repositório

Auditoria de 23/11/2026 na branch `develop`, com base em `abf18a1` e nos ajustes de roteamento e busca em pontos de encontro. **28 de 33 indicadores** estão marcados neste checklist. As marcações registram o estado técnico. A equipe ainda precisa saber explicar cada item na avaliação.

**Verificação local.** Após os ajustes, o build de produção e o lint passaram, e `npm test` passou com 402 testes em 26 arquivos. Na auditoria inicial, `node --test apps/api/server.test.cjs` passou com 3 testes.

## RA1 — Design e Experiência do Usuário (UI/UX) com IA

- [x] **ID1:** Desenvolver protótipos navegáveis (ex: gerados via Stitch e refinados no Figma) que demonstram compreensão das diretrizes de usabilidade, com link público disponibilizado no repositório.
  O [README](../README.md) aponta para o Figma. A navegação do protótipo e o acesso público ainda precisam de confirmação.
- [x] **ID2:** Projetar interfaces responsivas com a abordagem Mobile-First, garantindo que o layout se adapte perfeitamente a diferentes resoluções (celulares, tablets e desktops).
  A casca usa gaveta no mobile e navegação lateral no desktop. A listagem de pontos adapta a grade a partir de `md`. A evidência vem do código.
- [ ] **ID3:** Projetar a experiência de aplicativo nativo (PWA), configurando o manifest.webmanifest (ícones, cores de tema, splash screen e modo de exibição standalone) e prevendo o comportamento visual da interface em estados offline.
  Há ícones em `apps/web/public`. Manifesto, instalação standalone, splash e experiência offline seguem pendentes.

## RA2 — Componentização e UI Declarativa Moderna

- [x] **ID4:** Desenvolver componentes utilizando estritamente a arquitetura Standalone (sem o uso de NgModules).
  O app usa `bootstrapApplication` e componentes standalone com imports próprios.
- [x] **ID5:** Incorporar e customizar componentes utilizando um Framework CSS moderno (ex: Tailwind CSS, PrimeNG).
  Tailwind CSS 4 com tema em `apps/web/src/styles.css` e [tokens do projeto](design-tokens.md).
- [x] **ID6:** Aplicar a nova sintaxe de fluxo de controle (@if / @switch) para exibição condicional de elementos.
  `@if` controla estados de carregamento, erro e sucesso na listagem e no cadastro de pontos.
- [x] **ID7:** Utilizar a nova sintaxe de fluxo de controle @for com a propriedade track obrigatória para a renderização dinâmica e otimizada de coleções.
  A listagem usa `@for (point of points(); track point.id)`.
- [x] **ID8:** Aplicar Pipes (nativos ou customizados) para formatar a apresentação de dados na interface.
  A confirmação de pagamento usa o pipe `date` para formatar a data.
- [x] **ID9:** Implementar Deferrable Views (@defer) para otimizar a performance, carregando componentes pesados apenas sob demanda.
  A listagem de pontos adia a renderização dos cards com `@defer (on viewport)` e exibe um placeholder. O build gerou um chunk separado para o card.

## RA3 — Reatividade e Gerenciamento de Estado (Signals)

- [x] **ID10:** Aplicar técnicas de one-way data binding (Interpolação {{ }} e Property Binding [ ]) para exibir e atualizar dados, utilizando estritamente Signals (writable e computed) como fonte de estado.
  A listagem deriva os pontos filtrados com `computed()` a partir de Signals e usa interpolação e property binding no template.
- [x] **ID11:** Aplicar técnicas de event binding ( ) para capturar interações do usuário e atualizar o estado da aplicação.
  O evento `(toggleStatus)` da listagem chama o serviço para atualizar o estado do ponto.
- [x] **ID12:** Aplicar técnicas de two-way data binding utilizando a função moderna model() para sincronização bidirecional.
  `PointSearchComponent` declara `model()` para a busca e o filtro de ativos, ligados à página com `[()]`.
- [x] **ID13:** Utilizar efeitos (effect()) para a manipulação segura de efeitos colaterais reativos.
  `PointSearchComponent` usa `effect()` para sincronizar seus controles com os Signals.

## RA4 — Arquitetura de Software e Injeção de Dependências

- [x] **ID14:** Utilizar as funções modernas input() e output() para a comunicação segura e tipada entre componentes em uma hierarquia (pai/filho).
  `PointCardComponent` recebe o ponto com `input.required()` e emite a alteração de status com `output<string>()`.
- [x] **ID15:** Criar comunicação entre componentes não relacionados hierarquicamente extraindo a lógica para Services, utilizando a função inject() em vez de injeção via construtor.
  Listagem e detalhes compartilham `MeetingPointsService` por `inject()`.

## RA5 — Roteamento e Navegação SPA

- [x] **ID16:** Configurar rotas dinâmicas utilizando a API funcional moderna (provideRouter) e habilitar a passagem automática de parâmetros ativando a função withComponentInputBinding().
  `app.config.ts` usa `provideRouter(routes, withComponentInputBinding())`.
- [x] **ID17:** Passar e consumir dados entre telas capturando os parâmetros da rota (URL) diretamente através da função moderna Signal input() no componente de destino.
  A rota de pontos declara `:id` e `PointDetailsPage` lê o parâmetro via `input.required<string>()`.
- [x] **ID18:** Criar uma estrutura de navegação aninhada (rotas filhas) para representar hierarquias de layout.
  `AppShellComponent` hospeda rotas filhas como início, cofrinho e pontos de encontro.
- [x] **ID19:** Aplicar Functional Route Guards para controle de acesso (autenticação) e Resolvers para pré-carregamento de dados antes da transição da tela.
  Os Guards funcionais protegem as rotas autenticadas e administrativas. O Resolver de `pontos-de-encontro/:id` busca o ponto pelo ID antes de abrir a tela.

## RA6 — Integração de APIs e Assincronismo (BaaS)

- [x] **ID20:** Realizar requisições assíncronas (GET) a uma API pública.
  `CepService` consulta o ViaCEP via GET. Há testes do serviço com HTTP simulado.
- [ ] **ID21:** Implementar o fluxo de Autenticação e Gerenciamento de Sessão (JWT) conectando a aplicação aos serviços de identidade do BaaS (ex: Supabase Auth).
  Cadastro, OTP e sessão usam a API local do MVP. A integração com a identidade e o JWT do BaaS segue pendente.
- [ ] **ID22:** Realizar o ciclo completo de operações CRUD (GET, POST, PUT, PATCH, DELETE) conectando a aplicação a um Backend-as-a-Service (ex: Supabase, PocketBase).
  Há operações de dados via `json-server`. O ciclo completo de CRUD no BaaS segue pendente.
- [ ] **ID23:** Implementar Functional Interceptors para injetar tokens de autenticação globalmente e tratar erros de forma centralizada.
  `MeetingPointsService` adiciona o Bearer manualmente. Faltam interceptor funcional global e tratamento centralizado de erros.
- [x] **ID24:** Aplicar validações em Formulários Reativos, exibindo mensagens de erro claras e desabilitando o botão de submit com base na validade do formulário.
  O cadastro de pontos valida campos obrigatórios, CEP e coordenadas, exibe mensagens de erro e desabilita o envio quando inválido.
- [x] **ID25:** Fazer a ponte entre o assincronismo e a reatividade utilizando toSignal() e toObservable(), integrando RxJS com o ecossistema de Signals.
  A listagem de pontos converte o Signal de busca com `toObservable()`, aplica um debounce de 250 ms no RxJS e volta ao estado reativo com `toSignal()`.

## RA7 — Engenharia de Software, Versionamento e DevOps

- [x] **ID26:** Criar e gerenciar um repositório no GitHub utilizando a estrutura ágil do Gitflow (branches main e develop).
  O Git registra `main`, `develop` e branches `feature/*` locais e em `origin`.
- [x] **ID27:** Colaborar ativamente realizando integrações via Pull Requests e resolução de conflitos.
  O histórico registra os merges dos PRs #6, #7 e #9, além da integração entre branches de autenticação e carteira.
- [ ] **ID28:** Planejar, executar o processo de build moderno e realizar o deploy automatizado da aplicação em ambiente de produção (ex: Render, Vercel).
  O build de produção passou localmente. Faltam evidência de deploy automatizado e URL pública de produção.

## RA8 — Engenharia de Software Assistida por IA (SDD e Orquestração)

- [x] **ID29 — Escopo e Gestão Ágil:** Utilizar IA Generativa para a ideação e redação de User Stories. Cadastrar e gerenciar essas histórias como Issues em um Kanban no GitHub Projects.
  Há User Stories no PRD e specs associadas às Issues #1, #2 e #8. A gestão dessas histórias no Kanban do GitHub Projects ainda precisa de confirmação.
- [x] **ID30 — Fundações (PRD):** Apoiar-se na IA para estruturar o Documento de Requisitos do Produto (prd.md).
  O [PRD](prd.md) foi estruturado a partir da entrevista registrada no commit `4c1e934`.
- [x] **ID31 — Especificação Técnica:** A partir do PRD, instruir a IA a gerar um documento de especificação rigoroso (ssd.md — aqui, `docs/architecture.md`), detalhando explicitamente a arquitetura dos componentes Standalone e Services antes da geração do código fonte.
  O commit `96ee98f` registra a [arquitetura](architecture.md). As specs e planos detalham componentes e Services antes das respectivas tarefas de implementação. A escolha de backend no documento ainda precisa ser alinhada à regra de BaaS.
- [x] **ID32 — Orquestração (MCP e Skills):** Configurar a IDE (ex: Antigravity) ativando Servidores MCP (Model Context Protocol, ex: Figma, Supabase) e utilizando Skills de Angular 20+ para que o Agente gere o código com o contexto exato do projeto.
  A skill de Angular está em `.agents/skills/angular-developer`. Falta evidência no repositório de configuração e uso de MCP pela equipe.
- [x] **ID33 — Validação e Testes (TDD):** Atuar como revisor técnico da IA. Orientar o agente a gerar testes unitários (.spec.ts) focados nas regras de negócio para validar rigorosamente a implementação gerada.
  Há testes de regras de negócio para autenticação, carteira e pontos de encontro, com planos de TDD e revisões registradas em [specs](../specs/README.md).

---

## 📦 As três entregas

| Entrega | O quê |
| --- | --- |
| **E1 — Concepção e Planejamento** | Escopo da equipe sobre o tema do semestre, repositório com Gitflow, README com o checklist, Design System, framework CSS, protótipo navegável no Figma |
| **E2 — Estrutura Funcional (MVP)** | Aplicação com a estrutura funcional mínima, consumindo dados do **json-server** |
| **E3 — Aplicação Completa e Apresentação** | Dados e autenticação migrados para o **BaaS** (ex.: Supabase), app completo em produção (Vercel/Render) + **vídeo** apresentando inspiração, design system, protótipo e o projeto contra o checklist |

> 📅 **As datas de entrega estão no Moodle.** Elas mudam a cada semestre, e
> data em arquivo do repositório envelhece sem ninguém perceber — a do Moodle é
> a que vale.

> 🎥 Se o vídeo for insuficiente, a apresentação é síncrona ao Professor
> (presencial ou remota). O detalhamento de cada entrega está no Guia do
> Projeto no Notion: [link no Moodle].

## Situação das entregas

| Entrega | Situação no repositório |
| --- | --- |
| E1 | Escopo, Gitflow, checklist, Design System e Tailwind registrados. O README contém o link do Figma. Falta confirmar o acesso público e a navegação do protótipo. |
| E2 | Cadastro e login por OTP, compra simulada de fichas e gestão de pontos de encontro implementados sobre o `json-server`. Caronas, histórico e perfil ainda usam telas provisórias. A conclusão do escopo mínimo e a submissão no Moodle seguem sem confirmação. |
| E3 | Pendentes a migração de dados e sessão para BaaS, a aplicação completa em produção e a evidência do vídeo. O README e a arquitetura ainda apontam para NestJS, em desacordo com a regra de BaaS da disciplina. |

O [README](../README.md) já contém nome, descrição, autores e links para os documentos e o Figma. Ainda precisa refletir a stack atual, documentar `npm run dev`, incluir imagens das telas e receber a URL de produção quando houver deploy.
