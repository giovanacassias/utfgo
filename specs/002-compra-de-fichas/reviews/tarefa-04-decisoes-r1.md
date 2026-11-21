# Decisões — Tarefa 4, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Tarifa "1 ficha = R$ 2,00" escrita à mão no template (`wallet-overview.page.html:92` e `:115`), duplicando `TOKEN_UNIT_PRICE_CENTS` e `formatBrlFromCents` do model; expor um rótulo no componente a partir dessas constantes e usá-lo nos dois pontos | código (bloqueante) | aceito | — |
| 2 | Testes acoplados a classes Tailwind e a uma contagem `>= 9` inflada pelo markup duplicado (`wallet-overview.page.spec.ts:364-391`) | código (bloqueante) | aceito parcialmente | Aceita só a parte de baixo custo: juntar as verificações de alvo de toque e foco visível num único teste e remover a contagem `>= 9`, mantendo as classes como guarda simples. Recusada a parte de mover o foco para uma regra global em `styles.css`: alteraria o estilo do app inteiro e foge do escopo da tarefa 4. |

Sugestões não promovidas (candidatas a manutenção, sem correção nesta tarefa): utilitário para esconder a barra de rolagem; contraste do texto amarelo sobre branco (mantido como no Figma, decisão do dono ainda a registrar); `ng-template` `actions` com parâmetro só para cor; `<ul>/<li>` no extrato; `role="status"` sempre presente no DOM; `/cofrinho.png` com barra inicial; remoção de `data.title` da rota `cofrinho`.
