# Decisões da equipe — Tarefa 3, rodada 1

| # | Revisor | Apontamento | Decisão | Justificativa |
|---|---|---|---|---|
| 1 | revisor-codigo | `app.routes.ts` declara componentes de UI diretamente, em vez de manter as fronteiras arquiteturais previstas. | Aceito | A composição de rotas não deve concentrar declarações de componentes; a estrutura precisa respeitar a separação definida em `docs/architecture.md`. |
| 2 | revisor-codigo | As rotas usam placeholders diretamente, sem `loadComponent` ou `loadChildren` lazy-loaded. | Aceito | O roteamento base deve seguir o padrão lazy-loaded previsto na arquitetura, mesmo durante a preparação das rotas das features. |

Nenhum apontamento foi recusado.
