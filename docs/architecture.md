# 🛠️ Architecture / Software Design Document

**Projeto:** UTFgo  
**Versão:** 1.0.0  
**Última atualização:** 2026-10-02  

> 🤖 **O `prd.md` responde _o quê_ o produto faz. Este responde _onde as coisas moram e como se chamam_.** Detalhe de tela — rota, componente, contrato — **não** se decide aqui: isso é trabalho da spec de cada história.
>
> ✍️ **Documento gerado e validado via `/utf-architecture`:** Define as quatro declarações que o `/utf-setup` exige: **framework do backend, framework do frontend, estrutura do monorepo e como rodar os testes.**

---

## 🤖 1. Fontes de Contexto para a IA

> Onde a IDE agêntica busca a verdade. **Isto é o índice; a configuração mora nos arquivos** — documento não configura ferramenta.

| Fonte | Onde configurar | Serve para |
| :---- | :-------------- | :--------- |
| Constituição da IA | `.agents/rules/utf-rules.md` (via `CLAUDE.md` / `GEMINI.md`) | Regras inegociáveis: fases do SDD, 2 rodadas, revisores distintos, Git Flow |
| Fluxos da IA | `.agents/workflows/` | PRD, architecture, setup, backlog, ciclo por tarefa, tutor |
| Agentes (subagentes) | `.agents/agents/` | Implementador, revisor de conformidade, revisor de código, auditor e tutor |
| Ficha da disciplina | `docs/checklist.md` | Regras do projeto, IDs e entregas da disciplina |
| Requisitos do Produto | `docs/prd.md` | Escopo funcional (stories), regras de negócio (RN) e glossário ubíquo |

---

## 📦 2. Stack Tecnológica

> Definição **estrita**: nenhuma dependência entra sem aparecer aqui. Esta seção e o `package.json` contam a mesma história.

- **Backend:** NestJS (v12) + TypeScript.
- **ORM:** Prisma ORM.
- **Banco de Dados Relacional:** PostgreSQL 16.
- **Frontend:** Angular (v22).
- **Estilo:** Vanilla CSS moderno estruturado com tokens de design (CSS Custom Properties).
- **Testes:** **Vitest** unificado para Backend e Frontend, com **Supertest** para testes de integração/e2e na API.

### 🎯 2.1. Padrões de Código do Frontend (Angular v22)
- **Componentes Standalone nativos:** Padrão do Angular 22 (não se escreve `standalone: true`).
- **Reatividade com Signals:** Estado gerenciado via `signal()`, `computed()` e `effect()` para reatividade granular.
- **Controle de Fluxo Moderno:** Uso exclusivo da nova sintaxe de templates (`@if`, `@for`, `@switch`), vetando diretivas legadas (`*ngIf`, `*ngFor`).
- **Inputs e Outputs Reativos:** Uso de funções reativas `input()` e `output()`.
- **Injeção de Dependências:** Uso exclusivo da função funcional `inject()`, abolindo a injeção em construtores.
- **Roteamento:** Lazy loading configurado por rotas de feature via `loadComponent` ou `loadChildren`.
- **Regra de Ouro da Camada de Dados:** **Componente não fala com o servidor.** Todo acesso à API NestJS passa obrigatoriamente por uma camada de serviços/repositórios dedicada. Mudanças de contrato afetam apenas essa camada, nunca a interface gráfica.

### 🧱 2.2. Backend — Regras Estruturais (IDs da Disciplina)
- **Separação Estrita de Camadas (ID6):**
  - **Controllers:** Tratam a requisição HTTP, acionam DTOs e delegam para o Service. Sem lógica de negócio ou chamadas diretas ao Prisma.
  - **Services:** Concentram a lógica de domínio, regras de negócio e transações de banco com `prisma.$transaction`.
  - **Modules:** Encapsulam e exportam estritamente o necessário para comunicação entre domínios.
- **Validação de Entrada e Blindagem da API (ID7):**
  - Uso global de `ValidationPipe` com `{ whitelist: true, forbidNonWhitelisted: true, transform: true }`.
  - Todas as requisições de escrita tipadas com DTOs e validadas via decorators de `class-validator` e `class-transformer`.
- **Autenticação, Autorização e Controle de Acesso (ID9):**
  - Autenticação stateless com tokens **JWT** (via Bearer Token no header `Authorization`).
  - `JwtAuthGuard` aplicado globalmente na API, com exceção de rotas marcadas com o decorator `@Public()`.
  - `RolesGuard` gerenciando permissões baseadas no enum de papéis (`PASSENGER`, `DRIVER`, `ADMIN`) via decorator `@Roles(...)`.
- **Padronização Global de Respostas e Erros (ID10):**
  - **Interceptor Global:** Envelopa todas as respostas com sucesso no padrão `{ "data": ..., "timestamp": "...", "path": "..." }`.
  - **Exception Filter Global:** Trata `HttpException` e exceções do Prisma (`PrismaClientKnownRequestError`), devolvendo `{ "statusCode": ..., "message": ..., "error": ..., "timestamp": "..." }`.
- **Validação de Variáveis de Ambiente Fail-Fast (ID17):**
  - `@nestjs/config` com `ConfigModule.forRoot({ isGlobal: true, validate })`.
  - Reutilização de `class-validator` e `class-transformer` em classe de validação de ambiente (`EnvironmentVariables`), abortando imediatamente o bootstrap em caso de chave ausente ou formato inválido. Nenhuma chave no repositório.
- **Gateway de Pagamento Sandbox e Webhooks (ID20 / ID21):**
  - Gateway exclusivo: **Mercado Pago** em ambiente sandbox (aderente às regras do UTFgo com Pix e moeda BRL).
  - Webhooks tratados em endpoint dedicado `@Public()` com verificação obrigatória de assinatura criptográfica HMAC SHA256 (`x-signature`), garantindo a consistência do status do pedido e da transação.

### 🌐 2.3. O Contrato da API (ID14)
- Documentação interativa **OpenAPI/Swagger** gerada do código através de decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`) e servida pela própria API no endpoint `/docs`.
- O contrato é vivo; nenhum arquivo estático (ex.: `swagger.json`) é commitado no repositório.

### 🧪 2.4. Comandos Exatos de Testes e Lint
- **Backend (`apps/api`):**
  - Execução de testes: `npm test` (executa `vitest run`)
  - Testes em modo watch (TDD): `npm run test:watch` (executa `vitest`)
  - Linting: `npm run lint` (executa `eslint "{src,apps,libs,test}/**/*.ts"`)
- **Frontend (`apps/web`):**
  - Execução de testes: `npm test` (executa `ng test --watch=false`)
  - Testes em modo watch (TDD): `npm run test:watch` (executa `ng test`)
  - Linting: `npm run lint` (executa `ng lint`)
- **Raiz do Monorepo (para CI / GitHub Actions — ID18):**
  - Testes completos: `npm test` (executa os testes em `apps/api` e `apps/web`)
  - Lint completo: `npm run lint` (executa o lint em `apps/api` e `apps/web`)

---

## 🗂️ 3. Estrutura do Repositório (Monorepo)

> Monorepo com duas aplicações autônomas (`apps/api` e `apps/web`), cada uma com seu próprio `package.json`. A estrutura de diretórios é materializada previamente no setup para evidenciar a arquitetura.

```text
.
├── .agents/                 # Constituição, workflows e prompts dos agentes
├── README.md                # Vitrine e instruções de execução
├── docker-compose.yml       # Banco PostgreSQL 16 local (porta 5432)
├── docs/                    # prd.md, architecture.md, checklist.md
├── specs/                   # Especificações, planos e revisões por história
└── apps/
    ├── api/                 # Backend NestJS + Prisma
    │   ├── prisma/
    │   │   ├── schema.prisma
    │   │   └── migrations/
    │   ├── src/
    │   │   ├── common/      # Interceptors, Filters, Guards, Decorators
    │   │   ├── config/      # ConfigModule e validação fail-fast com class-validator
    │   │   ├── prisma/      # PrismaService
    │   │   ├── modules/     # Módulos por domínio do PRD
    │   │   │   ├── auth/
    │   │   │   ├── users/
    │   │   │   ├── wallet/
    │   │   │   ├── payments/
    │   │   │   ├── rides/
    │   │   │   ├── bookings/
    │   │   │   ├── meeting-points/
    │   │   │   └── disputes/
    │   │   ├── app.module.ts
    │   │   └── main.ts
    │   ├── test/            # Suítes de integração/e2e com Supertest + Vitest
    │   ├── package.json
    │   └── tsconfig.json
    └── web/                 # Frontend Angular 22 Standalone
        ├── src/
        │   ├── app/
        │   │   ├── core/    # Interceptors HTTP (JWT), Guards de rotas, API client
        │   │   ├── shared/  # Componentes reutilizáveis, pipes e diretivas
        │   │   └── features/# Módulos verticais por funcionalidade (lazy-loaded)
        │   │       ├── auth/
        │   │       ├── wallet/
        │   │       ├── rides/
        │   │       ├── bookings/
        │   │       └── admin/
        │   ├── main.ts
        │   ├── index.html
        │   └── styles.css
        ├── package.json
        └── angular.json
```

---

## 🏗️ 4. Arquitetura Frontend

- **Organização por Feature:** Cada pasta em `src/app/features/` agrupa as páginas (Smart Components), componentes de apresentação (Dumb Components) e a camada de serviço/repositório específica daquele domínio.
- **Isolamento de Requisições:** Telas e componentes visuais jamais injetam clientes HTTP ou efetuam `fetch`. Eles consomem Signals providos pelos serviços da feature.
- **Roteamento Modular:** O arquivo de rotas principal (`app.routes.ts`) apenas mapeia caminhos para as rotas das features com `loadChildren` ou `loadComponent`.

---

## 🗄️ 5. Arquitetura de Dados

### 📖 5.1. Glossário Técnico (Mapeamento PRD §2 → Entidades)

> Código, atributos e entidades em inglês; interface e termos negociais em português.

| Termo PRD (PT-BR) | Entidade Técnica (EN) | Atributos Principais |
| :---------------- | :-------------------- | :------------------- |
| **Usuário** | `User` | `id`, `email`, `name`, `role` (`PASSENGER`, `DRIVER`, `ADMIN`), `status` (`ACTIVE`, `SUSPENDED`, `BANNED`), `createdAt` |
| **Perfil de Condutor** | `DriverProfile` | `id`, `userId`, `cnhNumber`, `crlvNumber`, `status` (`PENDING`, `APPROVED`, `REJECTED`), `approvedAt` |
| **Carteira Digital** | `Wallet` | `id`, `userId`, `tokenBalance`, `penaltyPoints`, `updatedAt` |
| **Pedido de Fichas** | `Order` | `id`, `userId`, `tokensCount`, `amountCents`, `status` (`PENDING`, `COMPLETED`, `CANCELLED`), `createdAt` |
| **Pagamento (Gateway)** | `Payment` | `id`, `orderId`, `gatewayPaymentId`, `method` (`PIX`, `CREDIT_CARD`), `amountCents`, `status` (`PENDING`, `PAID`, `FAILED`, `REFUNDED`), `paidAt` |
| **Saque Condutor** | `Payout` | `id`, `userId`, `tokensCount`, `amountCents`, `pixKey`, `status` (`PENDING`, `COMPLETED`, `REJECTED`), `requestedAt`, `processedAt` |
| **Ponto de Encontro** | `MeetingPoint` | `id`, `name`, `address`, `latitude`, `longitude`, `isActive`, `createdAt` |
| **Carona** | `Ride` | `id`, `driverId`, `meetingPointId`, `direction` (`TO_CAMPUS`, `FROM_CAMPUS`), `departureTime`, `totalSeats`, `status` (`SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `EXPIRED`) |
| **Reserva** | `Booking` | `id`, `rideId`, `passengerId`, `tokenCost`, `status` (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`), `createdAt` |
| **Contestação** | `Dispute` | `id`, `bookingId`, `reason`, `status` (`OPEN`, `RESOLVED_REFUND`, `DISMISSED`), `adminNotes`, `createdAt` |

*Nota arquitetural:* `availableSeats` em `Ride` é um atributo **calculado em tempo de execução** ($\text{totalSeats} - \text{bookings ativos}$), e o passageiro da contestação é acessado via `Dispute -> Booking -> passengerId`, evitando redundâncias e garantindo a 3ª Forma Normal.

### 📊 5.2. Diagrama ER (Mermaid)

```mermaid
erDiagram
    User ||--o| DriverProfile : "possui"
    User ||--|| Wallet : "possui"
    User ||--o{ Order : "cria"
    User ||--o{ Payout : "solicita saque"
    User ||--o{ Ride : "conduz"
    User ||--o{ Booking : "reserva"

    Order ||--o{ Payment : "possui tentativas"
    MeetingPoint ||--o{ Ride : "local de embarque"
    Ride ||--o{ Booking : "possui"
    Booking ||--o| Dispute : "pode originar"

    User {
        string id PK
        string email UK
        string name
        string role
        string status
        datetime createdAt
    }

    DriverProfile {
        string id PK
        string userId FK
        string cnhNumber
        string crlvNumber
        string status
        datetime approvedAt
    }

    Wallet {
        string id PK
        string userId FK
        int tokenBalance
        int penaltyPoints
        datetime updatedAt
    }

    Order {
        string id PK
        string userId FK
        int tokensCount
        int amountCents
        string status
        datetime createdAt
    }

    Payment {
        string id PK
        string orderId FK
        string gatewayPaymentId UK
        string method
        int amountCents
        string status
        datetime paidAt
        datetime createdAt
    }

    Payout {
        string id PK
        string userId FK
        int tokensCount
        int amountCents
        string pixKey
        string status
        datetime requestedAt
        datetime processedAt
    }

    MeetingPoint {
        string id PK
        string name
        string address
        float latitude
        float longitude
        boolean isActive
    }

    Ride {
        string id PK
        string driverId FK
        string meetingPointId FK
        string direction
        datetime departureTime
        int totalSeats
        string status
        datetime createdAt
    }

    Booking {
        string id PK
        string rideId FK
        string passengerId FK
        int tokenCost
        string status
        datetime createdAt
    }

    Dispute {
        string id PK
        string bookingId FK
        string reason
        string status
        string adminNotes
        datetime createdAt
    }
```

### 🌍 5.3. O Banco por Ambiente

| Ambiente | Onde roda | Como conecta |
| :--- | :--- | :--- |
| **Local** | Container Docker (`postgres:16-alpine` na porta 5432) | `postgresql://postgres:postgres@localhost:5432/utfgo?schema=public` |
| **CI (GitHub Actions)** | Service Container PostgreSQL oficial na pipeline | Variável de ambiente `DATABASE_URL` fornecida via Action Service Container |
| **Produção** | **Neon.tech** (PostgreSQL Serverless com Connection Pooling) | `DATABASE_URL` segura injetada na plataforma com flag `?sslmode=require&pgbouncer=true` |

> 🔒 Credenciais e segredos **jamais** aparecem no repositório. O arquivo `.env.example` disponibiliza apenas as chaves modelo sem credenciais reais.

---

## 🗺️ 6. Mapa de Domínios e Rotas

> Este índice crescerá durante o desenvolvimento: **uma linha por história implementada**. As rotas e contratos nascem na spec de cada história.

| Domínio | Rota | Guard | Dados (Service / Repository) | US |
| :------ | :--- | :---- | :--------------------------- | :- |
| Auth | `POST /auth/otp/send`, `POST /auth/otp/verify` | `@Public()` | `AuthService`, `UsersService` | US01 |
| Wallet / Payments | `POST /payments/orders`, `POST /payments/webhook` | `JwtAuthGuard` / `@Public()` | `PaymentsService`, `WalletService` | US02 |

---

## 📅 7. Histórico

| Data | Versão | O que mudou |
| :--- | :----- | :---------- |
| 2026-10-02 | 1.0.0 | Versão inicial completa produzida via `/utf-architecture` e aprovada pelo Arquiteto. |

---

## 🛑 O que ainda **não** está neste documento

Detalhes de funcionalidade — DTOs de endpoints específicos, máquinas de estado de uma história e regras de tela — **não entram aqui**: nascem sob demanda no `spec.md` de cada história. Este documento guarda só o que vale para o sistema inteiro.
