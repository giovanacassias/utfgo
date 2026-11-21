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

- **Padrão de código, rotas e arquivos (Inglês Americano):** Todos os nomes de rotas, arquivos, serviços, modelos e variáveis seguem o padrão em **inglês americano** (`/cofrinho`, `/cofrinho/comprar`, `/cofrinho/pagamento`, `/cofrinho/pix`, `/cofrinho/cartao`, `/cofrinho/aprovado`, `/cofrinho/falha`), conforme [docs/architecture.md](../../docs/architecture.md#L154), enquanto os textos exibidos ao usuário na interface permanecem em português do Brasil seguindo o protótipo do Figma.
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
2. **Persistência e simulação de gateway/webhook no `json-server`:** Como `json-server` e `db.json` ainda não estavam configurados na `develop`, o setup do `json-server` (`db.json` inicial com `users`, `wallets`, `orders` e `payments`, scripts locais e `provideHttpClient()` em `app.config.ts`) integra esta entrega. *(Nota: o mock foi depois unificado em `apps/api/db.json` + `npm run api`, padrão da US01, porque a `develop` não tinha o `json-server` preparado e cada história o configurou de um jeito; ver "Registro de alterações" no `plan.md`.)* A criação de `Order`, as tentativas de `Payment` (Pix ou Cartão), a simulação de confirmação/falha assíncrona (webhook) e a atualização de `Wallet.tokenBalance` são persistidas diretamente no `json-server`.
3. **Rastreabilidade de dívida técnica (`// TODO #2`):** Como a Issue #2 está *In Progress* e ainda não há Issue separada de backend aberta no GitHub, todos os pontos de substituição temporária no código (chamadas diretas ao `json-server` em `WalletService`, usuário fixo simulado, simulador de webhook e rota temporária em `app.routes.ts`) serão marcados com **`// TODO #2`**, indicando que devem ser substituídos pela integração real com a API NestJS (`POST /payments/orders`, `POST /payments/webhook` com assinatura HMAC SHA256 do Mercado Pago Sandbox) e pelo `AuthService` da Issue #1 quando o backend e a autenticação estiverem disponíveis.
4. **Rota `/cofrinho` dentro da casca autenticada:** *(Redação original: acesso direto temporário, com redirecionamento de `/` para `/wallet`, enquanto o `AppShellComponent` não estava na `develop`. Com a Issue #1 integrada, isso foi adaptado; ver "Registro de alterações" no `plan.md`.)* `app.routes.ts` substitui o placeholder `/cofrinho` por `loadChildren` apontando para `apps/web/src/app/features/wallet/wallet.routes.ts`, como filha da casca protegida por `authGuard`. `/`, a landing e o login não são alterados.
5. **Ações de outras histórias no protótipo:** Ações do Figma que pertencem a outras histórias — como *Doar fichas* (`US22`), movimentações de *Estornos/Doações* (`US08`, `US13`, `US22`) e *Buscar carona* (`US06`) — não executam fluxos fora da `US02` nesta entrega (permanecem desabilitadas com indicação *"Em breve"* ou omitidas conforme critério).
6. **Referência visual (Figma):** as telas desta história seguem o protótipo do Figma (arquivo UTFgo): Cofrinho mobile `133:2146` e desktop `260:400`; Comprar fichas `260:401`; Pagamento `260:402`; Pix `260:403`; Falha `260:404`; Aprovado `260:405`. O protótipo orienta layout, hierarquia e estilo; onde divergir dos critérios de aceite (ex.: filtros do extrato, ações de outras histórias), valem os critérios, e sempre pelos tokens do `docs/design-tokens.md`.

---

## 2. Cenários de Usuário

### Cenário 1: Consulta do saldo e extrato da carteira (`/cofrinho`)
1. O passageiro acessa `/cofrinho` (Cofrinho UTFgo).
2. A tela exibe o saldo atual (`Wallet.tokenBalance` fichas e equivalente em `R$`), o valor unitário fixo (`1 ficha = R$ 2,00`), o botão **"Comprar fichas"** e o extrato de pedidos/pagamentos do usuário (com filtros por status/tipo).
3. Caso exista um pedido `PENDING`, o passageiro pode retomá-lo ou cancelá-lo diretamente.

### Cenário 2: Escolha da quantidade de fichas (`/cofrinho/comprar`)
1. Ao clicar em **"Comprar fichas"**, o passageiro visualiza o saldo atual e os pacotes rápidos (**1, 5, 10, 20 fichas**) além do campo **Quantidade personalizada**.
2. Ao selecionar um pacote ou digitar um inteiro válido (`1` a `100`), o resumo calcula automaticamente o total (`tokensCount × R$ 2,00`).
3. Ao clicar em **"Ir para pagamento"**, avança para `/cofrinho/pagamento`.

### Cenário 3: Pagamento via Pix com confirmação assíncrona simulada (`/cofrinho/pagamento` → `/cofrinho/pix` → `/cofrinho/aprovado`)
1. Em `/cofrinho/pagamento`, o passageiro seleciona **Pix** e clica em **"Confirmar e gerar Pix"**.
2. O sistema cria `Order` (`PENDING`) e `Payment` (`method: 'PIX'`, `status: 'PENDING'`) no `json-server`, mantendo o saldo da carteira inalterado, e abre `/cofrinho/pix` com QR Code simulado, código Pix Copia e Cola, botão **"Copiar código Pix"** e etiqueta `AGUARDANDO PAGAMENTO`.
3. Ao acionar **"Já realizei o pagamento"** (disparando o webhook assíncrono simulado), o `Payment` passa a `PAID` (com `paidAt`), o `Order` passa a `COMPLETED`, `Wallet.tokenBalance` recebe `+tokensCount` e a tela `/cofrinho/aprovado` exibe o comprovante e o saldo atualizado.

### Cenário 4: Pagamento via Cartão de Crédito à vista (`/cofrinho/pagamento` → `/cofrinho/cartao` → `/cofrinho/aprovado`)
1. Em `/cofrinho/pagamento`, o passageiro seleciona **Cartão de crédito (à vista)** e avança para o checkout de cartão (`/cofrinho/cartao`).
2. O sistema cria `Order` (`PENDING`) (ou reutiliza o `Order` `PENDING` em caso de retentativa) e exibe o formulário em memória (titular, número de 16 dígitos, validade `MM/AA`, CVV).
3. Ao confirmar a simulação de aprovação, apenas os metadados de `Payment` (`method: 'CREDIT_CARD'`, `status: 'PAID'`, `gatewayPaymentId`) são salvos no `json-server` (sem dados sensíveis do cartão), `Order` vira `COMPLETED` e `Wallet.tokenBalance` é creditado.

### Cenário 5: Falha, retentativa e cancelamento (`/cofrinho/falha`)
1. Durante Pix ou Cartão, caso seja acionada a simulação de **falha/expiração** (ex.: botão de sandbox *"Simular falha / expiração"* ou *"Simular cartão recusado"*), o `Payment` é gravado como `FAILED`, o `Order` permanece `PENDING` e `Wallet.tokenBalance` **não sofre alteração**.
2. Na tela `/cofrinho/falha`, o passageiro vê o motivo e o resumo do pedido, podendo clicar em **"Tentar novamente"** (nova tentativa no mesmo método e mesmo `Order`), **"Escolher outra forma de pagamento"** (trocar entre Pix e Cartão no mesmo `Order`) ou **"Cancelar pedido"** (`Order` marcado como `CANCELLED`).

---

## 3. Critérios de Aceite

### Carteira e Extrato (`/cofrinho`)
- [ ] **CA1 — Exibição de saldo e cotação fixa (`RN05/06`):** Dado que o usuário simulado e sua `Wallet` existem no `json-server`, quando acessa `/cofrinho`, então a tela exibe `tokenBalance` em fichas, o valor equivalente em reais (`tokenBalance * R$ 2,00`), a referência fixa `1 ficha = R$ 2,00`, a ação **"Comprar fichas"** e a lista de movimentações (`Order` + `Payment`) ordenadas da mais recente para a mais antiga (ou estado vazio informativo quando não houver pedidos).
- [ ] **CA2 — Filtragem do extrato:** Dado que o usuário possui compras registradas no extrato, quando alterna os filtros exibidos no extrato (ex.: *Todas*, *Concluídas*, *Pendentes*, *Falhas/Canceladas*), então a lista mostra apenas os pedidos correspondentes sem realizar nova requisição desnecessária nem perder o saldo exibido.

### Escolha de Quantidade (`/cofrinho/comprar`)
- [ ] **CA3 — Seleção por pacotes rápidos e cálculo de total:** Dado a tela `/cofrinho/comprar`, quando o usuário seleciona qualquer um dos pacotes (**1, 5, 10 ou 20 fichas**), então o pacote selecionado é destacado visualmente com `--color-tertiary`, o resumo exibe a quantidade escolhida e o total exato em reais (`tokensCount * R$ 2,00`), e o botão **"Ir para pagamento"** fica habilitado.
- [ ] **CA4 — Quantidade personalizada válida:** Dado a tela `/cofrinho/comprar`, quando o usuário preenche no campo **Quantidade personalizada** um número inteiro entre `1` e `100` (ex.: `8`), então o resumo recalcula o total (`R$ 16,00`), limpa a seleção anterior de pacote fixo e permite avançar para `/cofrinho/pagamento`.
- [ ] **CA5 — Quantidade inválida bloqueada (Caminho Triste):** Dado a tela `/cofrinho/comprar`, quando nenhuma quantidade válida está selecionada ou o campo personalizado recebe valor vazio, `0`, negativo, decimal (ex.: `1.5`), texto não numérico ou superior a `100`, então uma mensagem de erro clara é exibida junto ao campo e o botão **"Ir para pagamento"** permanece bloqueado/impede o avanço.

**Regras de validação e mensagens de `/cofrinho/comprar` (detalham o CA5 e o CA13):** o campo *Quantidade personalizada* é um campo de texto (`type="text"`, `inputmode="numeric"`) com Reactive Forms. A mensagem aparece junto ao campo (`role="alert"`) depois que o usuário digita ou sai do campo; ao abrir a tela, sem nenhuma escolha, aparece apenas a dica neutra, sem estilo de erro. O botão **"Ir para pagamento"** fica bloqueado enquanto houver erro, e a função de avançar também recusa a entrada inválida (não depende só do `disabled`).

| Caso | Exemplo | Regra | Mensagem |
| --- | --- | --- | --- |
| Nada escolhido / campo vazio | (vazio) | obrigatório | "Escolha um pacote ou informe uma quantidade." |
| Zero | `0` | mínimo 1 | "A quantidade mínima é 1 ficha." |
| Negativo | `-3` | mínimo 1 | "A quantidade mínima é 1 ficha." |
| Decimal | `1.5` | somente inteiros | "Informe um número inteiro, sem vírgula ou ponto." |
| Texto não numérico | `abc` | somente dígitos | "Digite apenas números." |
| Acima do limite | `101` | máximo 100 | "A quantidade máxima por pedido é 100 fichas." |
| Conta suspensa | usuário `SUSPENDED` | conta bloqueada (não é regra do campo) | "Sua conta está suspensa e não pode realizar compras de fichas." |
| Conta banida | usuário `BANNED` | conta bloqueada (não é regra do campo) | "Sua conta está banida e não pode realizar compras de fichas." |

Decisões de escopo da tela (Figma × spec): pacote selecionado destacado em `tertiary` (sem a etiqueta amarela "SELECIONADO" do Figma); os botões − e + do Figma mobile não entram nesta tarefa; ao voltar de `/cofrinho/pagamento` o rascunho anterior não é pré-selecionado.

### Pagamento via Pix e Cartão (`/cofrinho/pagamento`, `/cofrinho/pix`, `/cofrinho/cartao`)
- [ ] **CA6 — Criação de `Order` e `Payment` via Pix sem crédito prematuro:** Dado uma quantidade válida (`1` a `100`), quando o usuário seleciona **Pix** em `/cofrinho/pagamento` e confirma, então o sistema persiste no `json-server` um `Order` (`status: 'PENDING'`, `tokensCount`, `amountCents: tokensCount * 200`) e um `Payment` (`method: 'PIX'`, `status: 'PENDING'`, `gatewayPaymentId` único), navega para `/cofrinho/pix` exibindo o QR Code simulado, o código Copia e Cola com ação de copiar e a etiqueta `AGUARDANDO PAGAMENTO`, mantendo `Wallet.tokenBalance` **inalterado** até a confirmação.
- [ ] **CA7 — Confirmação assíncrona simulada (Webhook Pix) e crédito na carteira:** Dado um pedido Pix com `Order.status = 'PENDING'` e `Payment.status = 'PENDING'`, quando o usuário aciona a confirmação simulada (**"Já realizei o pagamento"**), então o sistema atualiza `Payment.status` para `PAID` (com `paidAt`), atualiza `Order.status` para `COMPLETED`, incrementa `Wallet.tokenBalance` em `order.tokensCount` no `json-server` e redireciona para `/cofrinho/aprovado` exibindo o resumo da compra e o novo saldo.
- [ ] **CA8 — Pagamento via Cartão de Crédito à vista e conformidade `RNF06`:** Dado uma quantidade válida e a escolha de **Cartão de crédito (à vista)** em `/cofrinho/pagamento`, quando o usuário preenche titular não vazio, número de cartão com 16 dígitos, validade `MM/AA` não expirada e CVV de 3 ou 4 dígitos em `/cofrinho/cartao` e confirma o pagamento aprovado simulado, então o sistema persiste `Order` (`COMPLETED`), `Payment` (`method: 'CREDIT_CARD'`, `status: 'PAID'`) e incrementa `Wallet.tokenBalance`, garantindo que **nenhum dado sensível do cartão (número, validade ou CVV) seja incluído nas requisições ou gravado no `db.json`**; campos de cartão inválidos bloqueiam o envio com feedback por campo.

### Falhas, Retentativas, Cancelamento e Idempotência
- [ ] **CA9 — Falha ou expiração de pagamento sem alterar saldo (Caminho Triste):** Dado um pagamento Pix ou Cartão `PENDING`, quando é acionada a simulação de falha/expiração (ex.: *"Simular falha / expiração"* no Pix ou *"Simular cartão recusado"* no Cartão), então o `Payment` é atualizado para `FAILED`, o `Order` permanece `PENDING`, **`Wallet.tokenBalance` não é alterado**, e o usuário é redirecionado para `/cofrinho/falha` exibindo motivo da falha, ID da transação e resumo do pedido.
- [ ] **CA10 — Nova tentativa reutilizando o mesmo `Order` (`Order ||--o{ Payment`):** Dado um pedido `PENDING` na tela `/cofrinho/falha` (ou retomado pelo extrato de `/cofrinho`), quando o usuário clica em **"Tentar novamente"** ou **"Escolher outra forma de pagamento"** e conclui uma nova tentativa aprovada, então um **novo `Payment`** é criado para o mesmo `orderId` (sem criar um segundo `Order`), e o crédito de `Wallet.tokenBalance` ocorre uma única vez após a confirmação.
- [ ] **CA11 — Cancelamento de pedido pendente:** Dado um `Order` com status `PENDING` (em `/cofrinho/pix`, `/cofrinho/cartao`, `/cofrinho/falha` ou no extrato em `/cofrinho`), quando o usuário aciona **"Cancelar pedido"**, então o `Order.status` é atualizado para `CANCELLED` no `json-server`, `Wallet.tokenBalance` permanece inalterado e o pedido não aceita novas confirmações de pagamento.
- [ ] **CA12 — Idempotência e proteção contra duplo clique (`RNF08`):** Dado uma operação de criação de pedido ou confirmação de webhook em andamento (`loading`), quando o usuário clica repetidamente no botão de ação, ou tenta confirmar novamente um `Order` já `COMPLETED` (ou `Payment` já `PAID`), então envios concorrentes são bloqueados na interface e o Service rejeita creditar a `Wallet` novamente.

### Restrições de Conta e Caminhos Tristes de Rede
- [ ] **CA13 — Conta suspensa ou banida (`SUSPENDED` / `BANNED`):** Dado que o usuário simulado no `db.json` possui `status` igual a `SUSPENDED` ou `BANNED`, quando acessa `/cofrinho` ou tenta iniciar/confirmar uma compra em `/cofrinho/comprar`, então a compra é bloqueada e uma mensagem clara informa que a conta está suspensa ou banida.
- [ ] **CA14 — `json-server` indisponível ou erro de rede (Caminho Triste):** Dado que o `json-server` está offline ou retorna erro HTTP ao carregar a carteira, criar pedido ou confirmar pagamento, então a interface exibe mensagem amigável de falha de conexão com ação para tentar novamente, sem apagar os dados selecionados no fluxo e sem exibir sucesso falso.

**Decisões da tela `/cofrinho/pagamento` (detalham CA6, CA10, CA12 e CA14):**
- **Botão de confirmação:** com Pix selecionado, "Confirmar e gerar Pix"; com Cartão, "Continuar com cartão". Durante o envio (`loading`), o botão fica desabilitado e mostra "Gerando Pix...".
- **Resultados do envio:** *sucesso* (Order e Payment gravados, só então navega para `/cofrinho/pix`); *servidor fora do ar ou erro HTTP* (mensagem do `WalletService` em `role="alert"`, a tela permanece, o resumo e o método escolhido são preservados, nenhum sucesso falso, botão "Tentar novamente" ao lado da mensagem); *clique duplo* (o segundo clique é ignorado pela interface e pelo `WalletService`: um único Order).
- **Mensagens de erro:** as já existentes no `WalletService` ("Não foi possível conectar ao servidor da carteira. Verifique sua conexão e tente novamente." e "Não foi possível criar o pedido de pagamento. Tente novamente."); conta bloqueada usa `accountBlockMessage`.
- **Precedência:** se existe pedido ativo `PENDING` (retentativa, CA10), ele vence o rascunho: o resumo usa os dados do pedido e a confirmação cria só um novo `Payment` para o mesmo `orderId`. Sem pedido ativo, usa o rascunho (`draftTokensCount`). Sem nenhum dos dois, a página redireciona para `/cofrinho/comprar`.
- **Cartão:** navega para `/cofrinho/cartao` sem criar `Order` nem `Payment` (a criação é da tarefa 8).
- **Visual:** sem a etiqueta "SELECIONADO" do Figma; a seta de voltar leva a `/cofrinho/comprar`; os ícones (ingresso, cartão, raio) são exportados do Figma para `apps/web/public/icons/`.
- **Pedido ativo e rascunho novo:** *(Antes registrado como limitação conhecida, corrigido na tarefa 6.)* Ao gravar um rascunho novo válido (`WalletService.setDraftTokensCount`), o pedido ativo e o pagamento ativo são limpos; assim uma compra nova nunca reaproveita um pedido antigo. "Retomar pagamento" e a volta do Pix para a tela de pagamento não definem rascunho e continuam reaproveitando o pedido ativo (CA10).

**Decisões da tela `/cofrinho/pix` (detalham CA6, CA7, CA9, CA11, CA12, CA14 e CA15):**
- **Conteúdo:** etiqueta `AGUARDANDO PAGAMENTO` nos dois tamanhos (mobile e desktop); QR Code estático exportado do Figma (`apps/web/public/qr-code.png`, o mesmo para todo pedido, `alt` descritivo); código Pix Copia e Cola **simulado e derivado do `gatewayPaymentId` e do valor** (função pura no `wallet.model.ts`, mesma entrada gera o mesmo código); 3 passos de pagamento; seta de voltar leva a `/cofrinho/pagamento`.
- **Copiar:** `navigator.clipboard.writeText`; em sucesso o botão mostra "Código copiado!" por cerca de 2 segundos (anunciado com `role="status"`, temporizador limpo ao sair da página); em falha mostra "Não foi possível copiar. Selecione o código e copie manualmente." e o código permanece como texto selecionável. O ícone de copiar aparece só no mobile, como no Figma.
- **Ações e destinos (só navegam depois do sucesso):** "Já realizei o pagamento" (`confirmPayment`, vai a `/cofrinho/aprovado`); "Simular falha / expiração" (`failPayment`, vai a `/cofrinho/falha`, dentro de uma caixa "Ambiente de teste (sandbox)" com fundo cinza e borda tracejada); "Cancelar pedido" (`cancelOrder`, volta a `/cofrinho`, botão discreto com borda e texto `danger`, **sem confirmação**). Os dois últimos controles **não existem no Figma** e foram criados do zero, respeitando os tokens (regra 02 §5).
- **Botão principal:** dois botões "Já realizei o pagamento", um por largura (preto no mobile, amarelo no desktop), com a mesma trava; o "Valor" do resumo aparece só no desktop, como no Figma.
- **Trava e erros:** as três ações compartilham a trava (`loading` do service e `submitting` da página); erro de rede ou parcial usa a mensagem do `WalletService` em `role="alert"` com "Tentar novamente", que repete a ação que falhou.
- **Sem pedido ou pagamento ativo, ou fora de `PENDING`:** a página redireciona para `/cofrinho` (não chama `loadWalletData`).
- **Ícones:** copiar e sincronizar exportados do Figma para `apps/web/public/icons/`.
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
