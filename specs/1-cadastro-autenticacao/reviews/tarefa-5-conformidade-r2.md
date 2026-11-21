# Parecer de conformidade — Tarefa 5, rodada 2

**BLOQUEADO**

A gaveta recebe foco ao abrir, mantém o ciclo de `Tab` e `Shift+Tab` quando o foco está dentro dela e devolve o foco ao `☰` nos fechamentos em largura mobile. No build de produção, porém, há dois caminhos em que o foco sai do contexto esperado.

### Apontamentos bloqueantes

1. **O fundo continua parcialmente focável com a gaveta aberta.** O `inert` cobre a barra lateral, o cabeçalho e o conteúdo da casca. Os controles do template raiz ficam fora dessa proteção. No Chromium a 1023 px, transferi o foco programaticamente para **Ação Primária** com a gaveta aberta. `Escape` deixou a gaveta aberta e `Tab` avançou para **Ação Secundária**, atrás do modal. Isso viola o confinamento de foco e o fechamento por `Escape` aceitos na rodada 1 para o CA2. [Fundo da casca](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.html:51) · [Handler de teclado](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.html:104) · [Controles do template raiz](/home/dudupadilha/projects/utfgo/apps/web/src/app/app.html:125) · [Decisão da rodada 1](/home/dudupadilha/projects/utfgo/specs/1-cadastro-autenticacao/reviews/tarefa-5-decisoes-r1.md:5) · [Padrão de diálogo modal do W3C](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)

2. **O fechamento ao cruzar o breakpoint perde o foco.** A mudança para desktop fecha a gaveta ao detectar que o `☰` está com `display: none`, mas o callback de fechamento ainda tenta focar esse botão. No Chromium, ao passar de 1023 para 1024 px com a gaveta aberta, a barra lateral ficou visível, o foco caiu no `body` e o próximo `Tab` foi para **Ação Primária**, fora da navegação da casca. A transição precisa encaminhar o foco a um destino visível no desktop. O teste de redimensionamento verifica a remoção da gaveta e de `inert`, sem verificar o destino do foco. [Restauração do foco](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.ts:67) · [Teste de redimensionamento](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.spec.ts:268) · [CA3](/home/dudupadilha/projects/utfgo/specs/1-cadastro-autenticacao/spec.md:61)

### Sugestões não bloqueantes

- Usar `ariaCurrentWhenActive="page"` junto ao destaque visual para anunciar a rota ativa.

### Verificações executadas

- Revisei o diff contra `89d6be0b33a6cc36b86ef6d40220cb333efec125` e comparei o código com a arquitetura e as regras Angular/TypeScript. As alterações de implementação se limitam aos três arquivos autorizados. Li diretamente os pareceres e decisões não rastreados e o relatório da rodada 2. `git diff --check` passou.
- Em cópia temporária, `npm test` passou com **48 testes em 4 arquivos**. `npm run lint` e o build de produção também passaram. O CSS compilado confirmou `lg` em **1024 px**.
- No Chromium headless, verifiquei foco inicial, tabulação nativa nos dois sentidos, `Escape`, toque no backdrop, foco externo programático e transição para desktop. A verificação com leitor de tela ficou pendente.

O repositório permaneceu intacto.
