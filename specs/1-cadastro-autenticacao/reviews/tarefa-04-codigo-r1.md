## Veredito: APONTAMENTOS

### Pontos conformes

- AppShell standalone nativo, sem `standalone: true`.
- Usa `inject()`, Signals e não injeta `HttpClient`.
- Usa `@for` com `track`, sem `*ngIf`/`*ngFor`.
- Seis links, `router-outlet`, cabeçalho, rodapé e logout presentes.
- Logout limpa a sessão via `AuthService` e navega para `/entrar`.
- Arquivos tocados estão limitados ao componente, template e spec; `docs/superpowers/` foi preservado.

### Apontamentos

1. **[MÉDIA] Título do cabeçalho não acompanha a rota ativa**

   Evidência: `apps/web/src/app/core/layout/app-shell/app-shell.component.html:50-52`. O título está fixo como `Início`, mesmo quando outra rota protegida é exibida. A spec exige cabeçalho com o título da tela ativa.

2. **[MÉDIA] Destaque ativo restrito a correspondência exata**

   Evidência: `apps/web/src/app/core/layout/app-shell/app-shell.component.html:14-16`. `[routerLinkActiveOptions]="{ exact: true }"` impede que um link permaneça destacado em rotas filhas, como `/inicio/detalhes`. O teste existente cobre somente `/inicio`.

3. **[BAIXA] Largura do menu desktop não corresponde à especificação**

   Evidência: `apps/web/src/app/core/layout/app-shell/app-shell.component.html:1-4`. `w-64` e `pl-64` equivalem a 256px; a spec define 248px.

Verificações: teste específico 2/2, suíte 29/29, lint, build e `git diff --check` passaram. Nenhum arquivo foi alterado durante a revisão.
