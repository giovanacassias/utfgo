# Parecer de Conformidade — Tarefa 1
**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| `CA1` (parcial na Tarefa 1: cotação fixa `200` centavos, conversão/formatação em `R$` e seed inicial; exibição em `/wallet` e carga HTTP ficam nas Tarefas 2 e 4) | atendido | `apps/web/src/app/features/wallet/models/wallet.model.ts:4,72-87`; `apps/web/src/app/features/wallet/models/wallet.model.spec.ts:24,50-57`; `db.json:12-42` |
| `CA3` (parcial na Tarefa 1: constantes dos pacotes `[1, 5, 10, 20]` e cálculo exato `tokensCount * 200`; UI `/wallet/buy` fica na Tarefa 5) | atendido | `apps/web/src/app/features/wallet/models/wallet.model.ts:4-5,72-78`; `apps/web/src/app/features/wallet/models/wallet.model.spec.ts:24-25,33-41` |
| `CA4` (parcial na Tarefa 1: faixa `1..100` e cálculo exato `8 -> 1600` centavos / `R$ 16,00`; UI `/wallet/buy` fica na Tarefa 5) | atendido | `apps/web/src/app/features/wallet/models/wallet.model.ts:6-7,72-87`; `apps/web/src/app/features/wallet/models/wallet.model.spec.ts:26-27,37,54` |
| `Assume que 1` (usuário simulado `user-1` — `Caio`, `PASSENGER`, `ACTIVE` no `db.json` e constante `SIMULATED_USER_ID`, sem alterar `features/auth/`) | atendido | `db.json:2-11`; `apps/web/src/app/features/wallet/models/wallet.model.ts:2`; `apps/web/src/app/features/wallet/models/wallet.model.spec.ts:28,75-88` |
| `Assume que 2` (setup `json-server`, `db.json` com `users`, `wallets`, `orders`, `payments`, script `mock:api`, `environment*`, `WALLET_API_URL` e `provideHttpClient()`) | atendido | `package.json:10,21`; `db.json:1-43`; `apps/web/angular.json:50-55`; `apps/web/src/environments/environment.ts:2-4`; `apps/web/src/environments/environment.development.ts:2-4`; `apps/web/src/app/app.config.ts:12-25`; `apps/web/src/app/features/wallet/models/wallet.model.spec.ts:65-148` |
| `Assume que 3` (marcação `// TODO #2` nos pontos temporários introduzidos na Tarefa 1) | atendido | `apps/web/src/environments/environment.ts:1`; `apps/web/src/environments/environment.development.ts:1`; `apps/web/src/app/app.config.ts:11,22`; `apps/web/src/app/features/wallet/models/wallet.model.ts:1` |
| Glossário e entidades de `docs/architecture.md` §5.1–5.2 (`User`, `Wallet`, `Order`, `Payment`, enums e padrão em inglês americano) | atendido | `apps/web/src/app/features/wallet/models/wallet.model.ts:9-51`; `db.json:2-42` |
| `CA2`, `CA5`–`CA15`, `Assume que 4–5` (camada HTTP `WalletService`, rotas, telas `/wallet/*`, validações de UI, falhas, idempotência e rollback) | fora desta tarefa | `specs/002-compra-de-fichas/plan.md:37-75` |

*Nota factual de verificação:* Este ambiente de subagente não possui ferramenta de shell, portanto `git diff b43310a`, `npm test` e `npm run lint` não foram executados diretamente por este revisor. A análise baseou-se na leitura integral via `read_file` de `spec.md`, `plan.md`, `docs/architecture.md` e de todos os arquivos da Tarefa 1 (além dos trechos iniciais de `package-lock.json`), confirmando que `wallet.model.spec.ts` contém 9 casos de teste sem mocks enganosos ou asserções relaxadas/puladas, em consonância com o diff e a saída factual informados no despacho (`Test Files 2 passed (2)`, `Tests 11 passed (11)`, `eslint src`, `exit code 0`).

## Apontamentos
