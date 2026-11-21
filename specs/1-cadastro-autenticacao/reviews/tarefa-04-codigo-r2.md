## Veredito: APONTAMENTOS

   Os três apontamentos funcionais da rodada 1 foram corrigidos: título acompanha a rota ativa via `toSignal()` e `NavigationEnd`; destaque permanece ativo em rotas filhas; `lg:w-62`/`lg:pl-62` resultam em 248px no CSS compilado.

1. **[BAIXA] Classe de largura não usa token semântico documentado**

   Evidência: `app-shell.component.html:1,4` e `styles.css:53-63`. `w-62` e `pl-62` geram 248px pelo espaçamento padrão do Tailwind, mas `62` não está declarado nos tokens locais nem em `docs/design-tokens.md`.

2. **[BAIXA] Título ativo falha em rotas com query string**

   Evidência: `app-shell.component.ts:38-40`. Para `/caronas?filtro=hoje`, a comparação não encontra `/caronas` nem `/caronas/`, e o título cai incorretamente para `Início`. O teste cobre apenas rota filha sem parâmetros.

   Verificações: 30/30 testes, lint, build e `git diff --check` passaram. Nenhum arquivo foi alterado durante a revisão.
