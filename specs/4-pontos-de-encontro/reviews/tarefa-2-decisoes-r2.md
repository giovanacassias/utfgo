# Decisões — Tarefa 2, rodada 2

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | `POST /meeting-points` do mock devolve entidade fora do contrato `MeetingPoint` (sem `createdAt`, sem garantia de `isActive`) | código | aceito | — |
| 2 | Spec afirma a forma do array de providers em vez do valor injetado via `TestBed` | código | aceito | — |
| 3 | Sugestão: `formatError()` repassa mensagem do servidor em qualquer status | código | aceito (promovida) | — |
| 4 | Sugestão: 409 do mock fora do envelope global | código | aceito (promovida) | — |
| 5 | Sugestão: chave `environment.walletApiUrl` ainda carrega o nome da wallet | código | aceito (promovida) | — |
| 6 | Sugestão: `toggleStatus()` em deep link sem `loadPoints()` prévio | código | aceito (promovida) | — |

Resultado: apontamentos aceitos na rodada 2 → limite de 2 rodadas estourado. Sem terceira rodada; tarefa suspensa para decisão do usuário.

**Decisão final do usuário (registrada em 22/11/2026):** commitar e fazer push do estado atual, com os apontamentos aceitos em aberto e sem terceira rodada. O `plan.md` permanece com a Tarefa 2 desmarcada, pois o código não obteve aprovação dos dois revisores na rodada final.
