# Parecer de Código — Manutenção (barra lateral do AppShell)

Escopo: só `app-shell.component.html` e `app-shell.component.spec.ts`. `npm test` passou (170 testes) e `npm run lint` passou sem erros.

**Veredito:** REPROVADO (1 bloqueante)

## Apontamentos (bloqueiam)
1. **O foco visível some no link ativo e no link em hover.** O link do menu usa `focus-visible:outline-2 focus-visible:outline-tertiary` e, ao mesmo tempo, `bg-tertiary` (ativo ou hover) — `app-shell.component.html:20` e `:22`.
   - Regra violada: acessibilidade pedida no escopo ("foco visível"). Outras regras de estilo não se aplicam.
   - O contorno roxo (`outline-tertiary`) sem offset encosta no fundo roxo do próprio link e não se distingue dele.
   - Prejuízo concreto: quem navega por teclado não vê onde está o foco no item ativo nem em um item com hover. O fundo roxo do hover e do ativo foi introduzido por este diff.
   - Correção sugerida (não aplicada): adicionar `focus-visible:outline-offset-2`. Alternativa: usar outra cor de contorno, por exemplo `outline-primary`, que já aparece no pontinho.
   - O mesmo vale para o logo na linha 5 se ele ganhar fundo roxo. Hoje não ganha, então ali está ok.

## Sugestões (não bloqueiam)
- **Variante arbitrária `group-[.bg-tertiary]:bg-primary` (linha 27).** Não é hexadecimal nem valor fora do `@theme`, e o token `primary` é usado corretamente. O problema é acoplamento: o estilo depende de a string da classe de `routerLinkActive` ser exatamente `bg-tertiary`.
  - Se alguém trocar a classe ativa, o pontinho amarelo some sem erro de build nem de teste. O Tailwind também só gera a classe se ler a string literal.
  - Alternativas:
    - Usar `[routerLinkActive]` com `#rla="routerLinkActive"` e `[class.bg-primary]="rla.isActive"` no pontinho.
    - Usar `aria-[current=page]:` junto com `ariaCurrentWhenActive="page"`.
  - A segunda opção também melhora a acessibilidade: o link ativo passa a ter `aria-current="page"`, que hoje não existe.
- **Duplicação.** A cor do pontinho aparece em dois lugares com o mesmo valor: `group-hover:bg-primary` e `group-[.bg-tertiary]:bg-primary`. Isso some se o estado ativo virar variante nomeada, como acima.
- **Pontinho `bg-border` (linha 27).** Em fundo branco ele tem baixo contraste. É decorativo e tem `aria-hidden`, então está correto.
- **Contraste e alvos.**
  - `text-on-tertiary` (#f4f4f6) sobre `bg-tertiary` (#4d327f) tem contraste alto, bem acima de 7:1. Está ok.
  - `min-h-11` equivale a 44px, porque `--spacing` não foi sobrescrito no `@theme`. Está ok.
  - O botão "Condutor" (linha 46) é desabilitado e fica de fora das exigências de alvo e contraste. O controle segmentado também ficou semanticamente razoável: "Passageiro" é um `span` e "Condutor" é um `button disabled`.
  - Se quiser deixar a intenção explícita, dá para usar `role="group"` com `aria-label="Perfil ativo"` no trilho e `aria-current="true"` em "Passageiro".
- **Testes acoplados a nomes de classe.** Quase todos os testes novos afirmam `classList.contains('hover:bg-tertiary' | 'min-h-11' | 'rounded-full' | 'bg-surface-muted' | 'bg-background')`.
  - Qualquer renomeação de token ou refatoração visual quebra o teste sem mudar comportamento. Eles não provam contraste nem hover, só repetem o template.
  - Os testes que valem a pena manter são os de comportamento: pontinho com `aria-hidden` e sem texto, logo apontando para `/inicio` com a legenda, "Condutor" `disabled`, link ativo marcado e `toBe(6)` itens.
  - O teste de "texto claro" garante que o link não tem `text-text-secondary`, o que é aceitável como guarda de regressão do bug original. Prefira afirmar a classe ativa pelo nome vindo de `routerLinkActive` ou por `aria-current`.
- **Seletor `a[href="/inicio"]:not(nav a)` (spec).** Passou no ambiente de teste, mas `:not()` com seletor complexo é frágil. Prefira `sidebar.querySelector('a[href="/inicio"]')` e confira que ele não está dentro do `nav` com `closest('nav')`, ou coloque um `data-app-shell-logo` no logo.
- **`.bg-primary.rounded-control` no teste do logo.** É acoplamento puro a classe. Basta afirmar o texto e o `href`.
- **Menu mobile.** O `ng-template #menuContent` continua compartilhado entre a barra desktop e o drawer, e `closeDrawer()` segue em todos os links. Estruturalmente está correto. Nenhum teste novo exercita o drawer aberto, e o bloco `describe('sidebar visual')` só consulta `[data-app-shell-sidebar]`. Uma asserção mínima de que o drawer renderiza os mesmos 6 itens seria um bom complemento.
- **Regras Angular e tokens.** `@for` com `track`, sem `*ngIf`, sem `style=`, sem `.css` por componente e sem hexadecimais. `text-title-small`, `text-caption`, `rounded-control`, `bg-surface-muted` e `size-2/10` estão todos no `@theme`. Conforme.

## Observações fora do escopo deste diff
- O botão "Sair" (linha 58) e o rodapé não têm `focus-visible`, e "Sair" tem alvo menor que 44px. Isso já existia antes deste diff. Candidata a Issue de manutenção.
- O botão "Condutor" não tem `focus-visible` nem `min-h`, mas é desabilitado.

## Resumo
1. Bloqueante: foco invisível por contorno roxo sobre fundo roxo em `app-shell.component.html:20` e `:22`.
