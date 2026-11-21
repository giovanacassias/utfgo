# Plan — US02: Compra de Fichas na Carteira Digital

**Spec aprovada:** [specs/002-compra-de-fichas/spec.md](./spec.md)  
**Issue:** [#2 — US02 — Compra de Fichas na Carteira Digital](https://github.com/giovanacassias/utfgo/issues/2)

---

## 1. Decisões Técnicas

- **Estrutura de pastas (conforme `docs/architecture.md`):**
  - `apps/api/db.json` (seed único do mock, compartilhado com a US01) servido por `apps/api/server.cjs` via `npm run api` na porta `3000` (`users`, `wallets`, `orders`, `payments`). *(Redação original: `db.json` na raiz + script `mock:api`; ver "Registro de alterações" ao final.)*
  - `apps/web/src/environments/`: `environment.ts` e `environment.development.ts` (com `fileReplacements` em `apps/web/angular.json`) + `InjectionToken` `WALLET_API_URL` e `provideHttpClient()` em `apps/web/src/app/app.config.ts` (evitando URL hardcoded dentro do código de serviço).
  - `apps/web/src/app/features/wallet/`:
    - `models/wallet.model.ts`: entidades `User`, `Wallet`, `Order`, `Payment`, tipos de filtro/estado, constantes da `RN05/06` (`TOKEN_UNIT_PRICE_CENTS = 200`, pacotes `[1, 5, 10, 20]`, faixa `1..100`) e funções puras de formatação/cálculo (`tokensToAmountCents`, `formatBrlFromCents`).
    - `services/wallet.service.ts`: camada única de acesso HTTP (`HttpClient` via `inject()`) e estado reativo com `signal()` / `computed()` (`user`, `wallet`, `orders`, `payments`, `transactions`, `draftTokensCount`, `activeOrderId`, `loading`, `error`).
    - `pages/`: 7 páginas standalone em inglês americano alinhadas às rotas `/cofrinho`, `/cofrinho/comprar`, `/cofrinho/pagamento`, `/cofrinho/pix`, `/cofrinho/cartao`, `/cofrinho/aprovado`, `/cofrinho/falha`.
    - `wallet.routes.ts`: roteamento modular da feature carregado em `/cofrinho` via `loadChildren` em `app.routes.ts`.
- **Conformidade estrita Angular v22 (`.agents/rules/01-angular-strict-rules.md`):**
  - Componentes standalone nativos (não escrever `standalone: true`).
  - Controle de fluxo moderno exclusivo (`@if`, `@for` com `track`, `@switch`).
  - Estado via `signal()` / `computed()`, comunicação com `input()` / `output()` e injeção via `inject()`.
  - Formulários exclusivamente com **Reactive Forms** (`FormGroup`, `FormControl`, `Validators`) — proibido Signal Forms.
  - Estilo exclusivamente com classes utilitárias Tailwind v4 usando os tokens de `apps/web/src/styles.css` (`docs/design-tokens.md`), sem criar `.css`/`.scss` por componente e sem `any`.
- **Limites de escopo e rastreabilidade:**
  - Não alterar `apps/web/src/app/features/auth/` nem `docs/checklist.md`.
  - Marcar todos os substitutos temporários (`json-server`, usuário fixo `user-1`, simulador de webhook e redirect temporário de `/`) com `// TODO #2`.

---

## 2. Tarefas de Implementação (TDD)

- [x] **Tarefa 1 — Setup do `json-server`, configuração HTTP/ambiente e modelos de domínio da carteira**
  - Cobre: `CA1`, `CA3`, `CA4`, `Assume que 1–3`
  - Teste primeiro (`wallet.model.spec.ts`): valida cálculo exato em centavos (`tokensToAmountCents(8) === 1600`), formatação em reais (`formatBrlFromCents(200) === 'R$ 2,00'`), constantes de negócio (`TOKEN_UNIT_PRICE_CENTS = 200`, pacotes `[1, 5, 10, 20]`, mínimo `1`, máximo `100`) e estrutura do seed inicial do `db.json` (`users`, `wallets`, `orders`, `payments` com `user-1` `ACTIVE` e `wallet-1`).
  - Arquivos previstos: `package.json`, `apps/api/db.json` (originalmente `db.json` na raiz), `apps/web/angular.json`, `apps/web/src/environments/environment.ts`, `apps/web/src/environments/environment.development.ts`, `apps/web/src/app/app.config.ts`, `apps/web/src/app/features/wallet/models/wallet.model.ts`, `apps/web/src/app/features/wallet/models/wallet.model.spec.ts`

- [x] **Tarefa 2 — `WalletService` (parte 1): carga da carteira/extrato, bloqueio por conta e criação/retentativa de `Order` + `Payment`**
  - Cobre: `CA1`, `CA2`, `CA6`, `CA10`, `CA13`, `CA14`
  - Teste primeiro (`wallet.service.spec.ts` com `HttpTestingController`): prova carregamento de `user-1`, `wallet`, `orders` e `payments` montando extrato ordenado do mais recente para o mais antigo; bloqueio quando `User.status` é `SUSPENDED` ou `BANNED`; criação de `Order` (`PENDING`, `amountCents = tokensCount * 200`) + `Payment` (`PENDING`, `gatewayPaymentId` único) sem alterar `Wallet.tokenBalance`; criação de novo `Payment` para um `orderId` `PENDING` existente sem duplicar `Order`; e tratamento de falha de rede preservando estado.
  - Arquivos previstos: `apps/web/src/app/features/wallet/services/wallet.service.ts`, `apps/web/src/app/features/wallet/services/wallet.service.spec.ts`

- [x] **Tarefa 3 — `WalletService` (parte 2): confirmação assíncrona simulada (webhook), falha, cancelamento, idempotência e rollback**
  - Cobre: `CA7`, `CA8`, `CA9`, `CA11`, `CA12`, `CA14`, `CA15`
  - Teste primeiro (`wallet.service.spec.ts` com `HttpTestingController`): prova que aprovação atualiza `Payment -> PAID` (com `paidAt`), `Order -> COMPLETED` e incrementa `Wallet.tokenBalance`, sem enviar dados sensíveis de cartão em `CREDIT_CARD` (`RNF06`); prova que falha marca `Payment -> FAILED` mantendo `Order = PENDING` e saldo intacto; prova que cancelamento marca `Order -> CANCELLED` e impede confirmação posterior; prova idempotência contra duplo clique e pedido já `COMPLETED`; e prova compensação/rollback quando falha a atualização de `Order` ou `Wallet` após `Payment -> PAID`.
  - Arquivos previstos: `apps/web/src/app/features/wallet/services/wallet.service.ts`, `apps/web/src/app/features/wallet/services/wallet.service.spec.ts`

- [x] **Tarefa 4 — Roteamento modular (`/cofrinho/*`) e página Cofrinho (`/cofrinho`) com saldo e extrato filtrável**
  - Cobre: `CA1`, `CA2`, `CA11`, `CA13`, `CA14`, `Assume que 4–5`
  - Referência visual obrigatória (Figma, arquivo UTFgo): mobile `133:2146` (`app-piggybank-passenger`) e desktop `260:400` (`07 · Passageiro · cofrinho`). Um único componente responsivo: layout mobile como base e layout desktop a partir de `lg`, sempre pelos tokens do `docs/design-tokens.md`. Onde o Figma divergir da spec, vale a spec (ex.: filtros do extrato).
  - Teste primeiro (`wallet-overview.page.spec.ts` + teste de rotas): prova que `/cofrinho` deixa de ser placeholder e passa a carregar a carteira via `loadChildren` dentro da casca autenticada (`AppShellComponent` + `authGuard`, já existentes da US01), que o item *Cofrinho* do menu e o destaque ativo continuam funcionando (inclusive em subpáginas), que `/`, a landing e o login da US01 permanecem intactos, exibição de saldo em fichas e reais, referência `1 ficha = R$ 2,00`, filtros do extrato (*Todas*, *Concluídas*, *Pendentes*, *Falhas/Canceladas*), retomada/cancelamento de pedido `PENDING`, estado vazio, botão *Doar fichas* desabilitado (*Em breve*), bloqueio de conta `SUSPENDED`/`BANNED` e erro de rede com retentar.
  - Arquivos previstos: `apps/web/src/app/app.routes.ts` (e teste de rotas), `apps/web/src/app/features/wallet/wallet.routes.ts`, `apps/web/src/app/features/wallet/pages/wallet-overview/wallet-overview.page.ts`, `apps/web/src/app/features/wallet/pages/wallet-overview/wallet-overview.page.html`, `apps/web/src/app/features/wallet/pages/wallet-overview/wallet-overview.page.spec.ts`

- [x] **Tarefa 5 — Página de Escolha de Quantidade (`/cofrinho/comprar`)**
  - Cobre: `CA3`, `CA4`, `CA5`, `CA13`
  - Teste primeiro (`buy-tokens.page.spec.ts`): prova seleção dos pacotes `1, 5, 10, 20` fichas com destaque visual (`tertiary`), preenchimento válido no campo personalizado (`1` a `100`) recalculando total (`R$ 2,00`/ficha) e limpando pacote fixo, bloqueio com mensagem clara para vazio/`0`/negativo/decimal/texto/`> 100`, bloqueio para conta `SUSPENDED`/`BANNED` e navegação para `/cofrinho/pagamento` preservando o rascunho.
  - Arquivos previstos: `apps/web/src/app/features/wallet/pages/buy-tokens/buy-tokens.page.ts`, `apps/web/src/app/features/wallet/pages/buy-tokens/buy-tokens.page.html`, `apps/web/src/app/features/wallet/pages/buy-tokens/buy-tokens.page.spec.ts`, `apps/web/src/app/features/wallet/wallet.routes.ts`

- [x] **Tarefa 6 — Página de Forma de Pagamento (`/cofrinho/pagamento`)**
  - Cobre: `CA6`, `CA10`, `CA12`, `CA14`
  - Teste primeiro (`payment-method.page.spec.ts`): prova exibição do resumo (`tokensCount`, `R$ 2,00`, total), alternância entre **Pix** e **Cartão de crédito (à vista)**, criação de `Order` + `Payment` Pix (`PENDING`) ao confirmar e navegação para `/cofrinho/pix`, navegação para `/cofrinho/cartao` quando Cartão é selecionado, reaproveitamento de `orderId` `PENDING` quando em fluxo de retentativa (sem duplicar `Order`), bloqueio de duplo clique durante `loading` e tratamento de falha de rede.
  - Arquivos previstos: `apps/web/src/app/features/wallet/pages/payment-method/payment-method.page.ts`, `apps/web/src/app/features/wallet/pages/payment-method/payment-method.page.html`, `apps/web/src/app/features/wallet/pages/payment-method/payment-method.page.spec.ts`, `apps/web/src/app/features/wallet/wallet.routes.ts`

- [x] **Tarefa 7 — Página de Pagamento Pix (`/cofrinho/pix`)**
  - Cobre: `CA6`, `CA7`, `CA9`, `CA11`, `CA12`, `CA14`, `CA15`
  - Teste primeiro (`pix-payment.page.spec.ts`): prova exibição da etiqueta `AGUARDANDO PAGAMENTO`, QR Code simulado, código Copia e Cola, ação de copiar com confirmação visual, ação **"Já realizei o pagamento"** disparando webhook simulado e navegando para `/cofrinho/aprovado`, ação sandbox de falha/expiração navegando para `/cofrinho/falha` sem creditar saldo, ação **"Cancelar pedido"** retornando para `/cofrinho`, trava contra duplo clique e erro recuperável em falha de rede/parcial.
  - Arquivos previstos: `apps/web/src/app/features/wallet/pages/pix-payment/pix-payment.page.ts`, `apps/web/src/app/features/wallet/pages/pix-payment/pix-payment.page.html`, `apps/web/src/app/features/wallet/pages/pix-payment/pix-payment.page.spec.ts`, `apps/web/src/app/features/wallet/wallet.routes.ts`

- [ ] **Tarefa 8 — Página de Pagamento Cartão de Crédito à vista (`/cofrinho/cartao`)**
  - Cobre: `CA8`, `CA9`, `CA11`, `CA12`, `CA14`, `CA15`
  - Teste primeiro (`card-payment.page.spec.ts`): prova validação via Reactive Forms (titular obrigatório, 16 dígitos, validade `MM/AA` não vencida, CVV 3–4 dígitos) bloqueando envio inválido com erros por campo; prova que ao confirmar aprovação os dados sensíveis do cartão **não** são repassados ao `WalletService`/HTTP (`RNF06`) e navega para `/cofrinho/aprovado`; prova ação sandbox de recusa navegando para `/cofrinho/falha` sem alterar saldo; prova cancelamento (`CANCELLED`) e trava de duplo clique.
  - Arquivos previstos: `apps/web/src/app/features/wallet/pages/card-payment/card-payment.page.ts`, `apps/web/src/app/features/wallet/pages/card-payment/card-payment.page.html`, `apps/web/src/app/features/wallet/pages/card-payment/card-payment.page.spec.ts`, `apps/web/src/app/features/wallet/wallet.routes.ts`

- [ ] **Tarefa 9 — Páginas de Resultado: Aprovado (`/cofrinho/aprovado`) e Falha (`/cofrinho/falha`)**
  - Cobre: `CA7`, `CA8`, `CA9`, `CA10`, `CA11`
  - Teste primeiro (`payment-approved.page.spec.ts` e `payment-failed.page.spec.ts`): prova exibição do comprovante aprovado (etiqueta de validação, quantidade, unitário, total, data, `gatewayPaymentId`, novo saldo, navegação **"Ir para o cofrinho"** e ação **"Buscar carona"** desabilitada/*Em breve*); e prova tela de falha exibindo motivo, ID da transação e resumo do pedido, com ações **"Tentar novamente"** (mesmo `orderId`), **"Escolher outra forma de pagamento"** (mesmo `orderId`) e **"Cancelar pedido"** (`CANCELLED`).
  - Arquivos previstos: `apps/web/src/app/features/wallet/pages/payment-approved/payment-approved.page.ts`, `apps/web/src/app/features/wallet/pages/payment-approved/payment-approved.page.html`, `apps/web/src/app/features/wallet/pages/payment-approved/payment-approved.page.spec.ts`, `apps/web/src/app/features/wallet/pages/payment-failed/payment-failed.page.ts`, `apps/web/src/app/features/wallet/pages/payment-failed/payment-failed.page.html`, `apps/web/src/app/features/wallet/pages/payment-failed/payment-failed.page.spec.ts`, `apps/web/src/app/features/wallet/wallet.routes.ts`

---

## 3. Critérios sem tarefa

*(Nenhum — todos os critérios `CA1` a `CA15` estão cobertos pelas 9 tarefas acima.)*

---

## Registro de alterações

- **Tarefa 4 adaptada à casca da US01:** o texto original previa um redirecionamento temporário `/` → `/wallet` e a limpeza do `app.html`, escritos quando a `develop` ainda não tinha a US01. Com a `feature/1` integrada, a casca autenticada, a landing e o login já existem; esse redirecionamento quebraria a US01. A tarefa passa a substituir o placeholder `/cofrinho` pela carteira (`loadChildren`, dentro da casca, atrás do `authGuard`), sem alterar `/` nem `app.html`. Decisão da equipe.

- **Unificação do `json-server` (commit `chore: unifica json-server em apps/api/db.json`):** a `develop` não tinha o mock preparado quando as Issues #1 e #2 começaram, e cada história configurou o seu: a US01 usou `json-server` `0.17.4` com `apps/api/server.cjs`, `apps/api/db.json`, proxy `/api` e `npm run api`; a US02 usou `json-server` `^1.0.0-beta.15` com `db.json` na raiz e `npm run mock:api`. Como as duas usam a porta `3000` e versões incompatíveis, ao integrar a `feature/1` na `feature/2` padronizamos no setup da US01: `users`, `wallets`, `orders` e `payments` vivem em `apps/api/db.json`, o `db.json` da raiz e o script `mock:api` foram removidos, e o `wallet.model.spec.ts` passou a ler o seed de `apps/api/db.json`. Nenhum critério de aceite mudou. Decisão registrada a pedido da equipe.
- **Rotas em português (`/cofrinho/*`):** a US01 já usa URLs em português (`/entrar`, `/inicio`, `/caronas`, `/cofrinho`, `/pontos-de-encontro`) e o item *Cofrinho* do menu aponta para `/cofrinho`. Para manter o app coerente e não alterar nenhum teste da US01, as rotas da carteira passaram de `/wallet/*` para: `/cofrinho`, `/cofrinho/comprar`, `/cofrinho/pagamento`, `/cofrinho/pix`, `/cofrinho/cartao`, `/cofrinho/aprovado` e `/cofrinho/falha`. Pastas e código seguem em inglês (`features/wallet/`), conforme a regra de idioma do `docs/architecture.md`. Nenhum critério de aceite mudou além do caminho da URL. Decisão da equipe.
- **Referência visual (Figma) tornada obrigatória:** a primeira implementação da tarefa 4 (rodadas 1 e 2) foi reprovada pelo dono por divergir do Figma. A spec nunca nomeou as telas de referência. Passam a valer: Cofrinho mobile `133:2146` e desktop `260:400`; Comprar fichas `260:401`; Pagamento forma `260:402`; Pix `260:403`; Falha `260:404`; Aprovado `260:405`. Os pareceres anteriores da tarefa 4 foram preservados em `reviews/historico-tarefa-04-pre-figma/` e a tarefa recomeça na rodada 1. Decisão do dono.
- **Tarefa 5: regras de validação com mensagens registradas na spec:** a spec (CA5) dizia apenas "mensagem de erro clara". Foi acrescentada, abaixo do CA5, a tabela de regras e mensagens (vazio, 0, negativo, decimal, texto, acima de 100 e conta bloqueada), mais as decisões de escopo da tela (sem etiqueta "SELECIONADO", sem botões − e +, sem pré-seleção do rascunho). Nenhum critério de aceite mudou. Decisão do dono.
- **Tarefa 6: decisões da tela de pagamento registradas na spec:** textos dos botões, resultados do envio (sucesso, servidor fora do ar e clique duplo), precedência do pedido ativo sobre o rascunho, redirecionamento sem rascunho e limitação conhecida da tarefa 5. Nenhum critério de aceite mudou. Decisão do dono.
- **Tarefa 6: limitação do pedido ativo corrigida (rodada 2):** o revisor de código mostrou que o pedido ativo antigo vencia um rascunho novo e cobrava a quantidade errada (ex.: 8 fichas gera Pix, volta e escolhe 20, mas a tela cobrava 8). A correção foi feita na raiz, em `WalletService.setDraftTokensCount` (tarefa 2), com testes de regressão; o trecho "Limitação conhecida" da spec foi substituído. Decisão do dono (opção A).
- **Tarefa 7: decisões da tela Pix registradas na spec:** código Copia e Cola derivado do `gatewayPaymentId`, etiqueta nos dois tamanhos, controles "Cancelar pedido" e "Simular falha / expiração" criados sem referência no Figma, dois botões principais por largura e redirecionamento sem pedido ativo. Nenhum critério de aceite mudou. Decisão do dono.
