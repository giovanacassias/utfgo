# Parecer de código — Tarefa 5, rodada 1

**BLOQUEADO**

A Tarefa 5 está restrita aos três arquivos do `AppShell` e segue os padrões de estado local, templates e estilos da arquitetura Angular. O diff preserva o palco e o destaque da rota ativa (CA1), implementa os fluxos de abertura e fechamento da gaveta (CA2) e mantém a sidebar fixa no breakpoint de 1024 px (CA3). O bloqueio é o comportamento da gaveta com teclado.

### Apontamento bloqueante

1. **CA2 — A gaveta cobre a página sem gerenciar o foco.** Ao abrir pelo teclado, o foco permanece no botão `☰`, atrás da gaveta. A camada bloqueia o ponteiro, mas `Tab` e `Shift+Tab` podem levar o foco a controles atrás dela. Nesses controles, `Escape` também fica fora dos handlers da gaveta e do botão. Além disso, o fechamento por `NavigationEnd` remove a gaveta sem encaminhar o foco quando ele estava dentro dela. A abertura deve mover o foco para a gaveta e manter o conteúdo de fundo inerte enquanto ela estiver aberta. O fechamento deve levar o foco a um destino visível e coerente com a ação. Os testes atuais verificam o retorno ao botão após cliques no backdrop e no botão de fechar. [Template — abertura](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.html:64), [template — camada e conteúdo de fundo](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.html:86), [fechamento por navegação](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.ts:31), [testes de foco](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.spec.ts:196), [padrão de diálogo modal do W3C](/https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

### Sugestões não bloqueantes

- Usar `ariaCurrentWhenActive` nos links para anunciar a rota ativa, além do destaque visual do CA1.
- Acompanhar as cinco rotas de destino ausentes fora da Tarefa 5. Entre os seis destinos, apenas `/inicio` está registrado em produção.

### Testes e verificações executados

- Revisei o diff contra `89d6be0b33a6cc36b86ef6d40220cb333efec125`. `git diff --check` passou. O `git status --short --untracked-files=all` mostrou apenas os três arquivos modificados.
- Em uma cópia temporária, `npm test` passou com **38 testes em 4 arquivos**. `npm run lint` e `npm run build` também passaram.
- Confirmei no CSS compilado que as regras `lg` usam `(width >= 1024px)`. A validação visual e de teclado em navegador ficou pendente. O apontamento de foco se baseia na inspeção do código.

O repositório permaneceu intacto.
