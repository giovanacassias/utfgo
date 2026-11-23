# Parecer de Conformidade — Tarefa 2

**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA11 — Cadastro com dados válidos (`POST /meeting-points` com `isActive: true`) | atendido | `apps/web/src/app/features/meeting-points/services/meeting-points.service.ts:61-90`; `apps/api/db.json:124-161`; `apps/web/src/app/features/meeting-points/services/meeting-points.service.spec.ts:147-171`; `apps/api/server.test.cjs:91-108`; `apps/web/src/app/core/api-url.token.ts:1-8`; `apps/web/src/app/app.config.ts:23-25` |
| CA12 — Bloqueio de duplicidade de nome no mesmo endereço/câmpus, com mensagem de erro de unicidade | atendido | `apps/web/src/app/features/meeting-points/services/meeting-points.service.ts:62-69,124-137`; `apps/api/server.cjs:9-28`; `apps/web/src/app/features/meeting-points/services/meeting-points.service.spec.ts:11,195-226`; `apps/api/server.test.cjs:57-71` |
| CA14 — Alternância de status via `PATCH /meeting-points/:id`, sem exclusão física | atendido | `apps/web/src/app/features/meeting-points/services/meeting-points.service.ts:24-38,94-122,139-155`; `apps/api/db.json:124-161`; `apps/web/src/app/features/meeting-points/services/meeting-points.service.spec.ts:229-286`; `apps/api/server.test.cjs:72-84,110-115` |

## Apontamentos
