# UTFgo

O UTFgo conecta membros da comunidade acadêmica que desejam oferecer caronas a passageiros que precisam delas para ir ou voltar do campus. A plataforma opera com uma carteira digital de fichas pré-pagas (R$ 2,00 por reserva, via Pix ou Cartão de Crédito), garantindo a reserva de vagas com tolerância de cancelamento e fluxo de moderação de assiduidade.

## 👥 Autores

- **Daniel Farias Lima** - [@daniel0051](https://github.com/daniel0051)
- **Giovana Cassias** - [@giovanacassias](https://github.com/giovanacassias)
- **Eduardo Padilha** - [@eduardo-padilha-dev](https://github.com/eduardo-padilha-dev)

---

## 📄 Documentação

- [Especificação de Requisitos (PRD)](docs/prd.md)
- [Arquitetura do Sistema](docs/architecture.md)
- [Checklist e Ficha da Disciplina](docs/checklist.md)

---

📦 Stack Tecnológica Definida no Documento:
Aqui está a tabela com a stack tecnológica exatamente como definida no documento:

| Camada / Componente | Tecnologia Escolhida | Versão / Detalhes de Implementação |
| :--- | :--- | :--- |
| **Backend** | **NestJS** | v12 (Arquitetura em camadas: Controllers, Services e Modules) |
| **Linguagem Base** | **TypeScript** | Utilizada no backend e no frontend |
| **ORM** | **Prisma ORM** | Modelagem relacional e migrations |
| **Banco de Dados (Motor)** | **PostgreSQL** | v16 |
| **Banco Local (Dev)** | **Docker** | Container `postgres:16-alpine` na porta 5432 |
| **Banco no CI** | **GitHub Actions** | Service Container oficial do PostgreSQL |
| **Banco em Nuvem (Prod)** | **Neon.tech** | PostgreSQL Serverless com Connection Pooling (PgBouncer) |
| **Frontend** | **Angular** | v22 (Standalone nativo, Signals, `@if`/`@for`, `inject()`) |
| **Estilização / UI** | **Vanilla CSS** | Estruturado via Tokens de Design (CSS Custom Properties) |
| **Testes** | **Vitest** | Unificado para testes unitários no Frontend e Backend |
| **Testes de Integração / E2E**| **Supertest** | Integrado ao Vitest na API |
| **Linting** | **ESLint** | Validação estática de código (`apps/api` e `apps/web`) |
| **Autenticação** | **JWT** | Stateless via Bearer Token (`JwtAuthGuard`) |
| **Controle de Acesso** | **Guards de Roles** | `@Roles()` com os papéis `PASSENGER`, `DRIVER` e `ADMIN` |
| **Gateway de Pagamento** | **Mercado Pago** | Ambiente Sandbox (Pix e BRL) com Webhooks assinados (HMAC SHA256) |
| **Documentação da API** | **OpenAPI / Swagger** | Gerada dinamicamente via decorators e servida em `/docs` |
| **Estrutura de Código** | **Monorepo** | Duas aplicações autônomas (`apps/api` e `apps/web`) |
---

## 🚀 Em Produção

- **Aplicação:** *(A ser implantada)*
- **API (Swagger):** *(A ser implantada)*

---

## 💻 Quick Start

*(Instruções de execução local serão geradas na Atividade 06)*
