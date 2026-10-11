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

## 🛠️ Stack Tecnológica

A stack tecnológica foi definida e documentada na Seção 1 do `docs/architecture.md`. Aqui está o resumo completo:

---

### 💻 Stack Tecnológica Oficial do UTFgo

| Camada | Tecnologia Escolhida | Detalhes / Padrão |
| :--- | :--- | :--- |
| **Frontend** | **Angular** | Componentes *Standalone*, reatividade via *Signals*, novo Control Flow (`@if`, `@for`), funções `input()`/`output()` e lazy loading de rotas |
| **Estilização / UI** | **Tailwind CSS** | Padronizado com os *Design Tokens* do projeto (cores institucionais, Plus Jakarta Sans) |
| **Backend** | **NestJS** | Arquitetura em camadas estritas (`Controllers`, `Services`, `Modules`), `DTOs` com `ValidationPipe` |
| **ORM** | **Prisma ORM** | Modelagem relacional e migrations |
| **Banco de Dados** | **PostgreSQL** | Motor relacional |
| **Banco Local (Dev)** | **Docker** | Executado via `docker-compose.yml` para garantir paridade de ambiente |
| **Banco em Nuvem (Prod)** | **Vercel Postgres** | Serverless Postgres para o deploy final |
| **Testes Automatizados** | **Vitest** | Suíte rápida unificada para front e back (`npm run test`) em substituição ao Jest |
| **Linting** | **ESLint** | Validação estática de código (`npm run lint`) |
| **Autenticação** | **JWT (Passwordless)** | Código de uso único (OTP) enviado por e-mail, sem senhas no banco, e Guards de perfis (`@Roles()`) |
| **Gateway de Pagamento** | **Stripe (Sandbox)** | Compra de fichas com confirmação assíncrona via *Webhooks* (testados via Stripe CLI) |
| **Estrutura de Repositório** | **Monorepo** (NPM Workspaces) | Divisão em `apps/api` (NestJS) e `apps/web` (Angular) sob a mesma raiz |

---

## 🚀 Em Produção

- **Aplicação:** *(A ser implantada)*
- **API (Swagger):** *(A ser implantada)*

---

## 💻 Quick Start

*(Instruções de execução local serão geradas na Atividade 06)*
