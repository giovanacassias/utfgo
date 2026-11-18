# Ajuste de desenho — fronteira de foco do App Shell

## Intenção

Garantir que a gaveta mobile seja um contexto de interação completo para mouse, toque e teclado. A página descartável de demonstração de tokens não deve permanecer interativa atrás da casca autenticada.

## Abordagens consideradas

- **Fronteira da aplicação (escolhida):** remover/ocultar o conteúdo descartável do `app.html` quando a aplicação usa o roteador, deixando o AppShell como único conteúdo interativo das rotas autenticadas. Ao mudar para desktop, o foco vai para um controle visível da sidebar.
- **Controle global pelo AppShell:** manter o conteúdo raiz e fazer a gaveta descobrir e marcar como `inert` todos os elementos externos a ela. Foi rejeitada por acoplar o componente de layout ao DOM global e por manter conteúdo descartável atrás da aplicação.

## Decisão

A página de tokens será retirada da composição da aplicação roteada. A spec e o plano passam a incluir `apps/web/src/app/app.html` no escopo da tarefa. A gaveta deve receber foco ao abrir, manter `Tab`/`Shift+Tab` dentro dela, fechar com `Escape`, devolver o foco ao botão `☰` ao fechar no mobile e mover o foco para um link visível da sidebar ao cruzar de `< 1024px` para `≥ 1024px`.

## Fora de escopo

Não serão criadas novas rotas de negócio para os seis links nesta tarefa. A existência dos destinos continua pertencendo às tarefas de features correspondentes.
