# Parecer de código — Tarefa 5, rodada 2

**BLOQUEADO**

A rodada 2 corrigiu o fluxo principal da gaveta. No Chromium, abrir com `Enter` moveu o foco para **Fechar menu**, `Tab` e `Shift+Tab` circularam pelos controles internos, e tanto `Escape` quanto o toque no backdrop fecharam a gaveta e devolveram o foco ao `☰`. O código segue os padrões do projeto para estado local com signals, consultas de view, injeção e classes responsivas.

### Apontamentos bloqueantes

1. **CA2 e decisão da rodada 1 — O fundo da aplicação continua parcialmente focável.** O `inert` cobre a sidebar, o cabeçalho e o conteúdo da rota dentro da casca. A página de demonstração do componente raiz tem botões fora dessa subárvore. No build de produção, com a gaveta aberta, transferi o foco programaticamente para **Ação Primária**. O navegador aceitou o foco, `Tab` avançou para **Ação Secundária** e `Escape` deixou a gaveta aberta. O confinamento precisa abranger o fundo da aplicação para que o teclado continue operando no contexto modal. [Fundo da casca](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.html:51) · [Handler limitado à gaveta](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.html:104) · [Controle externo à casca](/home/dudupadilha/projects/utfgo/apps/web/src/app/app.html:125) · [Decisão da rodada 1](/home/dudupadilha/projects/utfgo/specs/1-cadastro-autenticacao/reviews/tarefa-5-decisoes-r1.md:5) · [Padrão de diálogo modal do W3C](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

2. **CA3 e restauração de foco — Ao passar para desktop, o fechamento tenta focar o `☰` oculto.** Ao redimensionar de `1023px` para `1024px` com foco dentro da gaveta, confirmei no Chromium que o menu desktop fica visível e interativo, mas o foco cai no `body`. O próximo `Tab` vai para **Ação Primária**, fora da navegação recém-exibida. Esse fechamento precisa encaminhar o foco para um controle visível do menu desktop, como o link da rota ativa. O teste atual verifica a remoção da gaveta e do `inert`, sem verificar o destino do foco. [Restauração de foco](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.ts:67) · [Fechamento no redimensionamento](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.ts:83) · [Teste de redimensionamento](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.spec.ts:268)

### Sugestões não bloqueantes

- Usar `ariaCurrentWhenActive="page"` para anunciar a rota ativa além do destaque visual.
- Acompanhar os cinco destinos ainda ausentes em produção fora da Tarefa 5.

### Verificações executadas

- Revisei o diff contra `89d6be0b33a6cc36b86ef6d40220cb333efec125`. `git diff --check` passou. O diff contém os três arquivos autorizados do AppShell. Li diretamente os pareceres e decisões da rodada 1 e o relatório da rodada 2.
- Em cópia temporária, `npm test` passou com **48 testes em 4 arquivos**. `npm run lint` e `npm run build` passaram. O CSS gerado confirmou `lg` em `1024px`.
- No Chromium headless, verifiquei `Enter`, `Tab`, `Shift+Tab`, `Escape`, toque no backdrop, foco fora da casca e a transição de `1023px` para `1024px`. A verificação ficou sem leitor de tela.
