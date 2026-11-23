# Parecer de Conformidade — Tarefa 2

**Veredito:** APONTAMENTOS

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA11 — Cadastro com dados válidos (`POST /meeting-points` com `isActive: true`) | não atendido | `apps/web/src/app/features/meeting-points/services/meeting-points.service.ts:59`; `apps/api/db.json:124` |
| CA12 — Bloqueio de duplicidade de nome no mesmo endereço | não atendido | `apps/web/src/app/features/meeting-points/services/meeting-points.service.ts:49-51`; `apps/api/db.json:124` |
| CA14 — Desativação/Reativação via `PATCH /meeting-points/:id` sem exclusão física | não atendido | `apps/web/src/app/features/meeting-points/services/meeting-points.service.ts:88-90`; `apps/api/db.json:124` |

## Apontamentos
1. **O seed do mock não expõe os endpoints `GET/POST/PATCH /meeting-points` que o serviço consome e a spec exige** — `apps/api/db.json:124`
   Critério violado: spec.md:87 (CA11 — "o ponto é persistido no backend (`POST /meeting-points`) com `isActive: true`"), spec.md:88 (CA12 — depende da base carregada para detectar duplicidade) e spec.md:90 (CA14 — "o registro no servidor é atualizado com `PATCH /meeting-points/:id`"); também plan.md:30 ("Endpoints REST padrão suportados: `GET /meeting-points`, `POST /meeting-points`, `PATCH /meeting-points/:id`").
   Evidência: a coleção foi semeada com a chave `meetingPoints`. O json-server 0.17.4 usado em `apps/api/server.cjs:6` registra rotas a partir das chaves do `db.json`, e o proxy de `apps/web/proxy.conf.json:2-6` apenas remove o prefixo `/api`, sem qualquer reescrita de caixa/kebab-case. Verificação local somente-leitura contra o `createServer()`: `GET /meeting-points` → **404**, `GET /meetingPoints` → **200** com os 4 pontos do seed. Consequência: `loadPoints()` (`meeting-points.service.ts:36`) falha, `createPoint()` (`:59`) nunca persiste e `toggleStatus()` (`:88`) nunca atualiza o servidor; a checagem de duplicidade de CA12 não tem base carregada para atuar. Os 6 testes passam porque usam `HttpTestingController` com respostas fabricadas em `meeting-points.service.spec.ts:70,96,148,172`, não o seed — o que mascara a falha de integração.
