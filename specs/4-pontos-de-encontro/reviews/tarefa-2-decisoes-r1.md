# Decisões — Tarefa 2, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Seed não expõe `GET/POST/PATCH /meeting-points` (chave `meetingPoints` gera `/meetingPoints`) | conformidade | aceito | — |
| 2 | `MeetingPointsService` depende de `WALLET_API_URL`, token da feature carteira | código | aceito | — |
| 3 | Unicidade (CA12) apenas no Angular, sem guarda no mock e sem proteção contra reentrância | código | aceito | — |
| 4 | Sugestão: `catch {}` descarta `HttpErrorResponse`; preservar causa/mensagem | código | aceito (promovida) | — |
| 5 | Sugestão: `_loading` único para operações concorrentes | código | aceito (promovida) | — |
| 6 | Sugestão: ausência de marcador `TODO #2` nos novos endpoints | código | aceito (promovida) | — |
| 7 | Sugestão: spec assere mensagem importada da implementação | código | aceito (promovida) | — |

Observações fora do escopo (`WALLET_API_URL` pré-existente fora da wallet; sujeira pré-existente em `db.json`) permanecem como candidatas a Issue de manutenção.
