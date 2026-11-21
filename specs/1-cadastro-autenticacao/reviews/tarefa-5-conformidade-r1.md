# Parecer de conformidade — Tarefa 5, rodada 1

**APROVADO** para o escopo da Tarefa 5 da US01.

### Apontamentos bloqueantes

Nenhum.

- **CA1** — A casca preserva o cabeçalho e o `<router-outlet />`. O menu compartilhado mantém o rodapé institucional e o destaque da rota ativa. No mobile, o rodapé fica dentro da gaveta. [Menu e destaque](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.html:12) · [Palco central](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.html:113)
- **CA2** — O botão `☰` abre a gaveta com os seis links. Ela fecha pelo botão, pelo backdrop, ao selecionar um link, inclusive o da rota atual, e após `NavigationEnd`. Os testes cobrem esses eventos. [Estado e navegação](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.ts:30) · [Testes da gaveta](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.spec.ts:150)
- **CA3** — O CSS compilado confirma que, a partir de `1024px`, a barra lateral fica fixa e visível à esquerda, enquanto o botão `☰` e a camada da gaveta ficam ocultos. Abaixo desse limite, a barra lateral desktop fica oculta. [Template](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.html:51) · [Token `lg`](/home/dudupadilha/projects/utfgo/apps/web/src/styles.css:74)

### Sugestões não bloqueantes

- Validar visualmente a transição em navegador a `1023px` e `1024px`. A revisão confirmou o breakpoint no CSS gerado e os eventos na suíte, sem executar essa verificação visual.
- Registrar a limitação de integração da US01. Em produção, só `/inicio` está registrado entre os seis destinos. O teste que navega para `/caronas` usa uma rota configurada no harness. Essa limitação já existia na base da tarefa. [Rotas de produção](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/home/home.routes.ts:3) · [Rotas de teste](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.spec.ts:49)

### Verificações executadas

- `git diff 89d6be0b33a6cc36b86ef6d40220cb333efec125`, `git diff --check` e `git status --short --untracked-files=all`. O diff contém somente os três arquivos autorizados e o status não listou arquivos não rastreados. O relatório solicitado é ignorado pelo Git e foi lido diretamente.
- Em cópia temporária, `npm test` passou com **38 testes em 4 arquivos**, incluindo os 11 da casca. `npm run lint` e `npm run build` também passaram.
- Inspeção do CSS de produção gerado confirmou as regras responsivas de visibilidade e posição. O repositório permaneceu intacto e nenhum commit foi criado.
