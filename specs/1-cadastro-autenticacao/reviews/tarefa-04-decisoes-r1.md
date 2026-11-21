# Decisões da equipe — Tarefa 4 — Rodada 1

| # | Apontamento | Decisão | Justificativa |
|---|---|---|---|
| 1 | Classes `lg:pl-64`, `lg:w-64` e `min-h-20` usam valores fora dos tokens; menu com 256px em vez de 248px. | Aceito | O apontamento está alinhado às regras de tokens e à largura definida na spec. |
| 2 | O título do cabeçalho está fixo como `Início`, sem acompanhar a rota ativa. | Aceito | O cabeçalho deve refletir a tela protegida atualmente exibida. |
| 3 | `routerLinkActiveOptions` com `exact: true` impede destaque em rotas filhas. | Aceito | O link correspondente precisa permanecer destacado também em rotas filhas protegidas. |
