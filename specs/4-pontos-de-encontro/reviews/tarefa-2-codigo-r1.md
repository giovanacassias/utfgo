# Parecer de Código — Tarefa 2

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)
1. **Serviço de uma feature depende do token de configuração de outra feature (`WALLET_API_URL`)** — `apps/web/src/app/features/meeting-points/services/meeting-points.service.ts:4,19` (reforçado em `meeting-points.service.spec.ts:6,44`)
   Regra violada: `docs/architecture.md` §3 (`core/` é onde moram "Services, guards, layout e modelos compartilhados") e §4 ("Organização por Feature ... camada de serviço/repositório específica daquele domínio"; "Isolamento de Requisições").
   Prejuízo concreto: `WALLET_API_URL` é um contrato do domínio da carteira e carrega TODO #2 explícito em `app.config.ts:11-15` e `environment*.ts:1-3` para ser apontado à API NestJS. No dia dessa migração, trocar ou remover o token quebra `MeetingPointsService` e seu spec — que não têm relação com wallet — e dois domínios com contratos potencialmente distintos ficam forçados a compartilhar uma única base URL. A URL base genérica deveria ser token de `core/`.

2. **Regra de unicidade (CA12) vive apenas no Angular, sobre estado em memória; a nova coleção não tem guarda na camada que é dona dos dados no MVP** — `apps/web/src/app/features/meeting-points/services/meeting-points.service.ts:49-52,105`; `apps/api/db.json:124`
   Regra violada: `docs/architecture.md` §2.2 ("Services: Concentram a lógica de domínio, regras de negócio ...") e §4 ("Mock local da US01: ... garante unicidade de e-mail e criação idempotente de carteira no processo do mock"), com precedente já implementado em `apps/api/server.cjs:13-27`.
   Prejuízo concreto: `hasDuplicate()` compara somente com `_points()`. Quem entrar em `/pontos-de-encontro/novo` por link direto — rota prevista no CA3, sem passar pela listagem que chama `loadPoints()` — encontra o array vazio e o json-server aceita o ponto duplicado. O mesmo vale para duas abas ou duplo clique, já que `createPoint()` não tem a guarda de reentrância existente em `wallet.service.ts:250`. A integridade do catálogo passa a depender de um único caminho de UI e, na migração para NestJS, não haverá camada servidora responsável pela invariante.

## Sugestões (não bloqueiam)
- `catch {}` em `meeting-points.service.ts:40,67,97` descarta o `HttpErrorResponse`: um 409 de unicidade ou uma queda de conexão viram a mesma mensagem genérica "Tente novamente". `WalletService.formatNetworkError()` (`wallet.service.ts:620-626`) já é o padrão do repo para preservar a causa. Não é apontamento porque o erro é registrado no signal, não engolido em silêncio.
- `_loading` é único para `loadPoints`, `createPoint` e `toggleStatus`; se duas operações coexistirem, o `finally` da que termina primeiro limpa o indicador da que ainda está em voo.
- Os novos endpoints json-server não trazem o marcador `TODO #2` usado em `wallet.service.ts:51,210,274` para rastrear a substituição do mock; sem ele, este service pode ficar órfão na migração do backend.
- O spec importa `DUPLICATE_MEETING_POINT_ERROR` da própria implementação e assere contra ela (`meeting-points.service.spec.ts:9,132`): se a mensagem exibida ao usuário estiver errada, o teste continua verde. Afirme o texto literal esperado.

## Observações fora do escopo deste diff
- `WALLET_API_URL` já é consumido fora da feature wallet em arquivos pré-existentes (`app.routes.spec.ts:9,62` e páginas de pagamento): candidata a Issue de manutenção para mover/renomear o token para `core/`, independentemente desta tarefa.
- `apps/api/db.json` já continha, antes do diff, registros gerados por execução manual (ids aleatórios como `SxZH5Pj`, `9RBEUTf` e timestamps de 22/11 em `users`, `wallet-1`, `orders` e `payments`, linhas 28-34, 59-64, 76-89 e 104-121): sujeira pré-existente no seed, candidata a Issue de limpeza.
