# Decisões — Manutenção da barra de navegação, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | O foco visível some no link ativo e no link em hover: o contorno `outline-tertiary` fica sobre o fundo `bg-tertiary` do próprio link (`app-shell.component.html:20` e `:22`); corrigir com `focus-visible:outline-offset-2` | código (bloqueante) | aceito | — |

Sugestões não promovidas (candidatas a manutenção, sem correção nesta rodada): trocar `group-[.bg-tertiary]:bg-primary` do pontinho por estado nomeado com `aria-current="page"` (`ariaCurrentWhenActive`); testes presos a nomes de classe; seletor `a[href="/inicio"]:not(nav a)` frágil; asserção de que o drawer renderiza os mesmos 6 itens; botão "Sair" sem `focus-visible` e com alvo menor que 44px (anterior a este diff).
