---
issue: 2
status: aprovada   # rascunho | aprovada
---

# Spec — US02: Compra de Fichas na Carteira Digital

**Issue:** [#2 — US02 — Compra de Fichas na Carteira Digital](https://github.com/giovanacassias/utfgo/issues/2)  
**Fonte de verdade funcional:** [docs/prd.md](../../docs/prd.md) (`US02`, `RN05/06`, `RNF06`, `RNF08`, `RNF11/12`, Glossário)  
**Fonte de verdade arquitetural:** [docs/architecture.md](../../docs/architecture.md) (`User`, `Wallet`, `Order`, `Payment`)  
**Referências visuais:** Figma (`07 · Passageiro · cofrinho`, `08 · Passageiro · comprar fichas`, `09 · Pagamento · forma`, `10 · Pagamento · Pix`, `11 · Pagamento · falha`, `12 · Pagamento · aprovado`) e [docs/design-tokens.md](../../docs/design-tokens.md)

---

## 1. Contexto, Decisões e `Assume que`

Passageiros do **UTFgo** precisam comprar fichas digitais pré-pagas (valor unitário fixo de **R$ 2,00**, conforme `RN05/06`) via **Pix** ou **Cartão de Crédito (à vista)**, com atualização da carteira (`Wallet.tokenBalance`) após confirmação assíncrona simulada de pagamento, mantendo rastreabilidade de pedidos (`Order`) e tentativas de pagamento (`Payment`).

### Decisões Acordadas na Entrevista

- **Padrão de código, rotas e arquivos (Inglês Americano):** Todos os nomes de rotas, arquivos, serviços, modelos e variáveis seguem o padrão em **inglês americano** (`/wallet`, `/wallet/buy`, `/wallet/payment`, `/wallet/pix`, `/wallet/card`, `/wallet/approved`, `/wallet/failed`), conforme [docs/architecture.md](../../docs/architecture.md#L154), enquanto os textos exibidos ao usuário na interface permanecem em português do Brasil seguindo o protótipo do Figma.
- **Pacotes e limites de compra (`RN05/06`):**
  - Cada ficha custa exatamente **R$ 2,00** (`200` centavos em `amountCents`).
  - A seleção oferece os **4 pacotes rápidos** do Figma (**1, 5, 10 e 20 fichas**) mais a opção **Quantidade personalizada** (inteiro positivo entre **1** e **100** fichas por pedido, total máximo de **R$ 200,00** por pedido).
- **Métodos de pagamento (`PIX` e `CREDIT_CARD`) e privacidade (`RNF06`):**
  - Suporte exclusivo a **Pix** e **Cartão de Crédito à vista (`1x`)** — pagamento parcelado e cartão de débito estão fora de escopo (`docs/prd.md` §6).
  - No **Cartão de Crédito**, o formulário de checkout sandbox valida os dados do cartão (titular, 16 dígitos, validade `MM/AA` futura e CVV de 3–4 dígitos) **apenas em memória** via Reactive Forms; nenhum dado sensível de cartão é enviado ou salvo no `db.json` (`RNF06`).
- **Múltiplas tentativas e idempotência (`Order ||--o{ Payment`, `RNF08`):**
  - Se uma tentativa de `Payment` falhar (`FAILED`), o `Order` permanece `PENDING`, permitindo tentar novamente ou trocar de método gerando um novo `Payment` vinculado ao mesmo `orderId` (sem duplicar o `Order`), ou cancelar o pedido (`Order.status = 'CANCELLED'`).
  - O crédito de `Wallet.tokenBalance` só ocorre quando `Payment.status` passa para `PAID` e `Order.status` para `COMPLETED`, garantindo idempotência (nunca creditar duas vezes para o mesmo `Order`).

### `Assume que` (Substitutos Obrigatórios do MVP — Issue #2)

Como a **Issue #1** (login real e `AppShellComponent`) está em paralelo e o **backend NestJS + Prisma + Mercado Pago Sandbox** ainda não existem na branch `develop`, esta spec registra explicitamente os seguintes substitutos temporários:

1. **Usuário autenticado simulado (`db.json`):** Enquanto a Issue #1 (`features/auth/`) não for integrada na `develop`, o sistema assume como usuário logado o registro fixo já existente no `db.json` (`user-1` — `Caio`, `role: 'PASSENGER'`, `status: 'ACTIVE'`), sem alterar `apps/web/src/app/features/auth/`.
2. **Persistência e simulação de gateway/webhook no `json-server`:** Como `json-server` e `db.json` ainda não estavam configurados na `develop`, o setup do `json-server` (`db.json` inicial com `users`, `wallets`, `orders` e `payments`, scripts locais e `provideHttpClient()` em `app.config.ts`) integra esta entrega. A criação de `Order`, as tentativas de `Payment` (Pix ou Cartão), a simulação de confirmação/falha assíncrona (webhook) e a atualização de `Wallet.tokenBalance` são persistidas diretamente no `json-server`.
3. **Rastreabilidade de dívida técnica (`// TODO #2`):** Como a Issue #2 está *In Progress* e ainda não há Issue separada de backend aberta no GitHub, todos os pontos de substituição temporária no código (chamadas diretas ao `json-server` em `WalletService`, usuário fixo simulado, simulador de webhook e rota temporária em `app.routes.ts`) serão marcados com **`// TODO #2`**, indicando que devem ser substituídos pela integração real com a API NestJS (`POST /payments/orders`, `POST /payments/webhook` com assinatura HMAC SHA256 do Mercado Pago Sandbox) e pelo `AuthService` da Issue #1 quando o backend e a autenticação estiverem disponíveis.
4. **Acesso direto temporário à rota `/wallet`:** Sem `AppShellComponent` mesclado na `develop`, `app.routes.ts` expõe `/wallet` com `loadChildren` apontando para `apps/web/src/app/features/wallet/wallet.routes.ts` e um redirecionamento temporário de `/` para `/wallet` (marcado com `// TODO #2` para remoção após o merge da Issue #1).
5. **Ações de outras histórias no protótipo:** Ações do Figma que pertencem a outras histórias — como *Doar fichas* (`US22`), movimentações de *Estornos/Doações* (`US08`, `US13`, `US22`) e *Buscar carona* (`US06`) — não executam fluxos fora da `US02` nesta entrega (permanecem desabilitadas com indicação *"Em breve"* ou omitidas conforme critério).

---

## 2. Cenários de Usuário

### Cenário 1: Consulta do saldo e extrato da carteira (`/wallet`)
1. O passageiro acessa `/wallet` (Cofrinho UTFgo).
2. A tela exibe o saldo atual (`Wallet.tokenBalance` fichas e equivalente em `R$`), o valor unitário fixo (`1 ficha = R$ 2,00`), o botão **"Comprar fichas"** e o extrato de pedidos/pagamentos do usuário (com filtros por status/tipo).
3. Caso exista um pedido `PENDING`, o passageiro pode retomá-lo ou cancelá-lo diretamente.

### Cenário 2: Escolha da quantidade de fichas (`/wallet/buy`)
1. Ao clicar em **"Comprar fichas"**, o passageiro visualiza o saldo atual e os pacotes rápidos (**1, 5, 10, 20 fichas**) além do campo **Quantidade personalizada**.
2. Ao selecionar um pacote ou digitar um inteiro válido (`1` a `100`), o resumo calcula automaticamente o total (`tokensCount × R$ 2,00`).
3. Ao clicar em **"Ir para pagamento"**, avança para `/wallet/payment`.

### Cenário 3: Pagamento via Pix com confirmação assíncrona simulada (`/wallet/payment` → `/wallet/pix` → `/wallet/approved`)
1. Em `/wallet/payment`, o passageiro seleciona **Pix** e clica em **"Confirmar e gerar Pix"**.
2. O sistema cria `Order` (`PENDING`) e `Payment` (`method: 'PIX'`, `status: 'PENDING'`) no `json-server`, mantendo o saldo da carteira inalterado, e abre `/wallet/pix` com QR Code simulado, código Pix Copia e Cola, botão **"Copiar código Pix"** e etiqueta `AGUARDANDO PAGAMENTO`.
3. Ao acionar **"Já realizei o pagamento"** (disparando o webhook assíncrono simulado), o `Payment` passa a `PAID` (com `paidAt`), o `Order` passa a `COMPLETED`, `Wallet.tokenBalance` recebe `+tokensCount` e a tela `/wallet/approved` exibe o comprovante e o saldo atualizado.

### Cenário 4: Pagamento via Cartão de Crédito à vista (`/wallet/payment` → `/wallet/card` → `/wallet/approved`)
1. Em `/wallet/payment`, o passageiro seleciona **Cartão de crédito (à vista)** e avança para o checkout de cartão (`/wallet/card`).
2. O sistema cria `Order` (`PENDING`) (ou reutiliza o `Order` `PENDING` em caso de retentativa) e exibe o formulário em memória (titular, número de 16 dígitos, validade `MM/AA`, CVV).
3. Ao confirmar a simulação de aprovação, apenas os metadados de `Payment` (`method: 'CREDIT_CARD'`, `status: 'PAID'`, `gatewayPaymentId`) são salvos no `json-server` (sem dados sensíveis do cartão), `Order` vira `COMPLETED` e `Wallet.tokenBalance` é creditado.

### Cenário 5: Falha, retentativa e cancelamento (`/wallet/failed`)
1. Durante Pix ou Cartão, caso seja acionada a simulação de **falha/expiração** (ex.: botão de sandbox *"Simular falha / expiração"* ou *"Simular cartão recusado"*), o `Payment` é gravado como `FAILED`, o `Order` permanece `PENDING` e `Wallet.tokenBalance` **não sofre alteração**.
2. Na tela `/wallet/failed`, o passageiro vê o motivo e o resumo do pedido, podendo clicar em **"Tentar novamente"** (nova tentativa no mesmo método e mesmo `Order`), **"Escolher outra forma de pagamento"** (trocar entre Pix e Cartão no mesmo `Order`) ou **"Cancelar pedido"** (`Order` marcado como `CANCELLED`).

---

## 3. Critérios de Aceite

### Carteira e Extrato (`/wallet`)
- [ ] **CA1 — Exibição de saldo e cotação fixa (`RN05/06`):** Dado que o usuário simulado e sua `Wallet` existem no `json-server`, quando acessa `/wallet`, então a tela exibe `tokenBalance` em fichas, o valor equivalente em reais (`tokenBalance * R$ 2,00`), a referência fixa `1 ficha = R$ 2,00`, a ação **"Comprar fichas"** e a lista de movimentações (`Order` + `Payment`) ordenadas da mais recente para a mais antiga (ou estado vazio informativo quando não houver pedidos).
- [ ] **CA2 — Filtragem do extrato:** Dado que o usuário possui compras registradas no extrato, quando alterna os filtros exibidos no extrato (ex.: *Todas*, *Concluídas*, *Pendentes*, *Falhas/Canceladas*), então a lista mostra apenas os pedidos correspondentes sem realizar nova requisição desnecessária nem perder o saldo exibido.

### Escolha de Quantidade (`/wallet/buy`)
- [ ] **CA3 — Seleção por pacotes rápidos e cálculo de total:** Dado a tela `/wallet/buy`, quando o usuário seleciona qualquer um dos pacotes (**1, 5, 10 ou 20 fichas**), então o pacote selecionado é destacado visualmente com `--color-tertiary`, o resumo exibe a quantidade escolhida e o total exato em reais (`tokensCount * R$ 2,00`), e o botão **"Ir para pagamento"** fica habilitado.
- [ ] **CA4 — Quantidade personalizada válida:** Dado a tela `/wallet/buy`, quando o usuário preenche no campo **Quantidade personalizada** um número inteiro entre `1` e `100` (ex.: `8`), então o resumo recalcula o total (`R$ 16,00`), limpa a seleção anterior de pacote fixo e permite avançar para `/wallet/payment`.
- [ ] **CA5 — Quantidade inválida bloqueada (Caminho Triste):** Dado a tela `/wallet/buy`, quando nenhuma quantidade válida está selecionada ou o campo personalizado recebe valor vazio, `0`, negativo, decimal (ex.: `1.5`), texto não numérico ou superior a `100`, então uma mensagem de erro clara é exibida junto ao campo e o botão **"Ir para pagamento"** permanece bloqueado/impede o avanço.

### Pagamento via Pix e Cartão (`/wallet/payment`, `/wallet/pix`, `/wallet/card`)
- [ ] **CA6 — Criação de `Order` e `Payment` via Pix sem crédito prematuro:** Dado uma quantidade válida (`1` a `100`), quando o usuário seleciona **Pix** em `/wallet/payment` e confirma, então o sistema persiste no `json-server` um `Order` (`status: 'PENDING'`, `tokensCount`, `amountCents: tokensCount * 200`) e um `Payment` (`method: 'PIX'`, `status: 'PENDING'`, `gatewayPaymentId` único), navega para `/wallet/pix` exibindo o QR Code simulado, o código Copia e Cola com ação de copiar e a etiqueta `AGUARDANDO PAGAMENTO`, mantendo `Wallet.tokenBalance` **inalterado** até a confirmação.
- [ ] **CA7 — Confirmação assíncrona simulada (Webhook Pix) e crédito na carteira:** Dado um pedido Pix com `Order.status = 'PENDING'` e `Payment.status = 'PENDING'`, quando o usuário aciona a confirmação simulada (**"Já realizei o pagamento"**), então o sistema atualiza `Payment.status` para `PAID` (com `paidAt`), atualiza `Order.status` para `COMPLETED`, incrementa `Wallet.tokenBalance` em `order.tokensCount` no `json-server` e redireciona para `/wallet/approved` exibindo o resumo da compra e o novo saldo.
- [ ] **CA8 — Pagamento via Cartão de Crédito à vista e conformidade `RNF06`:** Dado uma quantidade válida e a escolha de **Cartão de crédito (à vista)** em `/wallet/payment`, quando o usuário preenche titular não vazio, número de cartão com 16 dígitos, validade `MM/AA` não expirada e CVV de 3 ou 4 dígitos em `/wallet/card` e confirma o pagamento aprovado simulado, então o sistema persiste `Order` (`COMPLETED`), `Payment` (`method: 'CREDIT_CARD'`, `status: 'PAID'`) e incrementa `Wallet.tokenBalance`, garantindo que **nenhum dado sensível do cartão (número, validade ou CVV) seja incluído nas requisições ou gravado no `db.json`**; campos de cartão inválidos bloqueiam o envio com feedback por campo.

### Falhas, Retentativas, Cancelamento e Idempotência
- [ ] **CA9 — Falha ou expiração de pagamento sem alterar saldo (Caminho Triste):** Dado um pagamento Pix ou Cartão `PENDING`, quando é acionada a simulação de falha/expiração (ex.: *"Simular falha / expiração"* no Pix ou *"Simular cartão recusado"* no Cartão), então o `Payment` é atualizado para `FAILED`, o `Order` permanece `PENDING`, **`Wallet.tokenBalance` não é alterado**, e o usuário é redirecionado para `/wallet/failed` exibindo motivo da falha, ID da transação e resumo do pedido.
- [ ] **CA10 — Nova tentativa reutilizando o mesmo `Order` (`Order ||--o{ Payment`):** Dado um pedido `PENDING` na tela `/wallet/failed` (ou retomado pelo extrato de `/wallet`), quando o usuário clica em **"Tentar novamente"** ou **"Escolher outra forma de pagamento"** e conclui uma nova tentativa aprovada, então um **novo `Payment`** é criado para o mesmo `orderId` (sem criar um segundo `Order`), e o crédito de `Wallet.tokenBalance` ocorre uma única vez após a confirmação.
- [ ] **CA11 — Cancelamento de pedido pendente:** Dado um `Order` com status `PENDING` (em `/wallet/pix`, `/wallet/card`, `/wallet/failed` ou no extrato em `/wallet`), quando o usuário aciona **"Cancelar pedido"**, então o `Order.status` é atualizado para `CANCELLED` no `json-server`, `Wallet.tokenBalance` permanece inalterado e o pedido não aceita novas confirmações de pagamento.
- [ ] **CA12 — Idempotência e proteção contra duplo clique (`RNF08`):** Dado uma operação de criação de pedido ou confirmação de webhook em andamento (`loading`), quando o usuário clica repetidamente no botão de ação, ou tenta confirmar novamente um `Order` já `COMPLETED` (ou `Payment` já `PAID`), então envios concorrentes são bloqueados na interface e o Service rejeita creditar a `Wallet` novamente.

### Restrições de Conta e Caminhos Tristes de Rede
- [ ] **CA13 — Conta suspensa ou banida (`SUSPENDED` / `BANNED`):** Dado que o usuário simulado no `db.json` possui `status` igual a `SUSPENDED` ou `BANNED`, quando acessa `/wallet` ou tenta iniciar/confirmar uma compra em `/wallet/buy`, então a compra é bloqueada e uma mensagem clara informa que a conta está suspensa ou banida.
- [ ] **CA14 — `json-server` indisponível ou erro de rede (Caminho Triste):** Dado que o `json-server` está offline ou retorna erro HTTP ao carregar a carteira, criar pedido ou confirmar pagamento, então a interface exibe mensagem amigável de falha de conexão com ação para tentar novamente, sem apagar os dados selecionados no fluxo e sem exibir sucesso falso.
- [ ] **CA15 — Consistência em falha parcial de múltiplas requisições (`RNF08`):** Dado que a simulação no `json-server` atualiza `Payment`, `Order` e `Wallet` em chamadas sequenciais, quando a gravação de `Payment` como `PAID` ocorre mas a atualização de `Order` ou `Wallet.tokenBalance` falha por erro de rede/HTTP, então o Service executa compensação/rollback do estado alterado (revertendo para `PENDING`/`FAILED` ou evitando reportar compra concluída) e apresenta erro recuperável ao usuário.

---

## 4. Fora de Escopo

Estão explicitamente **fora do escopo** desta história:
- Tela de login, cadastro OTP, `authGuard` e `AppShellComponent` (**US01 / Issue #1** — proibido modificar `apps/web/src/app/features/auth/`).
- Backend NestJS, Prisma ORM, PostgreSQL, webhook real com assinatura HMAC SHA256 e SDK/API real do Mercado Pago (substituídos por `json-server` e marcados com `// TODO #2`).
- Doação de fichas entre usuários (**US22**), saque de condutor via Pix (**US17**), retenção/débito/estorno de fichas por reservas e caronas (**US06**, **US08**, **US13**, **US14**).
- Pagamento parcelado ou via cartão de débito (`docs/prd.md` §6).
- Alteração de `docs/checklist.md`.

---

## 5. Dúvidas em Aberto

*(Nenhuma — todas as decisões técnicas, substitutos no `json-server` e critérios de borda/erro estão consolidados acima para revisão e aprovação do Arquiteto.)*
