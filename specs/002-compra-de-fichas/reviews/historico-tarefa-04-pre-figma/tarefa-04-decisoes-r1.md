# Decisões — Tarefa 4, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Link "Voltar" sem alvo de toque mínimo de 44 px (`wallet-overview.page.html:2`); corrigir com `inline-flex min-h-11 min-w-11 items-center justify-center` | código (bloqueante) | aceito | — |
| 2 | Sugestão promovida a apontamento: controles sem foco visível; adicionar `focus-visible:outline-2 focus-visible:outline-tertiary` nos botões e links da página | código (sugestão promovida pelo usuário) | aceito | — |
| 3 | Sugestão promovida a apontamento: texto "carregando" sem anúncio a leitor de tela; adicionar `role="status"` (`wallet-overview.page.html:36`) | código (sugestão promovida pelo usuário) | aceito | — |

Sugestões não promovidas (ficam como candidatas a manutenção, sem decisão de correção nesta tarefa): teste de "filtro sem resultado" que não confere o texto; seletor genérico `[role="alert"]` nos testes; regra de "falha" duplicada entre página e service; bloqueio de conta dependente do carregamento; teste de rotas acoplado a `route.children`; destinos `/cofrinho/comprar` e `/cofrinho/pagamento` ainda inexistentes (tarefas 5 e 6).
