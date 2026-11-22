# Parecer de Código — Tarefa 2

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)
1. **O `POST /meeting-points` do mock devolve uma entidade fora do contrato `MeetingPoint`** — `apps/api/server.cjs:11,25-27`
   Regra violada: `docs/architecture.md` §5.1 (glossário — `MeetingPoint` tem `id`, `name`, `address`, `latitude`, `longitude`, `isActive` e `createdAt`) e §4 (o mock é a API consumida pelo frontend no MVP).
   Prejuízo concreto: o handler insere o corpo cru e responde com ele, sem `createdAt` (e sem garantir `isActive` para clientes que omitem o campo). `createPoint()` tipa essa resposta como `MeetingPoint` e a coloca direto em `_points` (`meeting-points.service.ts:76-83`). O estado reativo passa a conter um registro inválido: ordenação/exibição por data quebra e um `toggleStatus()` sobre ele calcula `!undefined`. O teste de integração só afirma `status 201`, então a inconsistência passa batida.

2. **O spec afirma a forma do array de providers em vez do valor efetivamente injetado** — `apps/web/src/app/features/meeting-points/services/meeting-points.service.spec.ts:72-79`
   Regra violada: `docs/architecture.md` §2.1 ("Injeção de Dependências: uso exclusivo da função funcional `inject()`") e o critério do revisor ("teste acoplado a detalhe de implementação, que quebra em qualquer refatoração").
   Prejuízo concreto: registrar os providers via helper/`EnvironmentProviders` — refatoração natural quando o TODO #2 migrar para NestJS — faz o teste falhar com a DI ainda correta. Além disso, `expect.objectContaining({ provide: API_URL })` aceita qualquer `useValue`, inclusive `undefined`, então o teste não prova que a URL resolvida é a correta. O padrão já existente em `wallet.model.spec.ts:170-180` resolve o token via `TestBed`, que é o que deveria ser feito aqui.

## Sugestões (não bloqueiam)
- `formatError()` (`meeting-points.service.ts:145-148`) repassa ao usuário qualquer `message` do servidor, independentemente do status. Com o Exception Filter global previsto na arquitetura §2.2, um 500 com detalhe técnico pode aparecer na tela; vale aceitar mensagem do servidor apenas em 409/422 (o spec já cobre 422) e usar o fallback nos demais casos.
- O 409 do mock (`server.cjs:21-23`) responde somente `{ message }`, fora do envelope global `{ statusCode, message, error, timestamp }` (§2.2). Hoje espelha o handler `/users` pré-existente, por isso não bloqueia; na migração, garantir que a resposta venha do filtro global.
- `core/api-url.token.ts:4` e `app.config.ts:24-25` ainda derivam ambos os tokens de `environment.walletApiUrl`. O acoplamento de domínio do serviço foi removido, mas o nome da chave de ambiente ainda carrega a feature antiga; ao executar o TODO #2, renomear para `apiUrl` (com alias transitório) evita ambiguidade.
- `toggleStatus()` exige o ponto em `_points()` (`meeting-points.service.ts:95-99`): em deep link sem `loadPoints()` prévio, um ponto existente no servidor é reportado como "não encontrado". A tela de detalhes da Tarefa 7 precisa carregar o registro antes de acionar a troca de status.

## Observações fora do escopo deste diff
- `WALLET_API_URL` continua consumido fora da feature wallet em arquivos pré-existentes (`app.routes.spec.ts:9,62` e páginas de pagamento): candidata a Issue de manutenção para mover/renomear o token para `core/`.
- `apps/api/db.json` já continha, antes deste diff, registros de execução manual (ids aleatórios e timestamps de 22/11 em `users`, `wallet-1`, `orders` e `payments`): candidata a Issue de limpeza do seed.
