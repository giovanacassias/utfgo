# Parecer de Conformidade — Manutenção: barra lateral da casca (AppShellComponent)

**Veredito: APROVADO** (sem apontamentos bloqueantes)

Rodei `npm test` e `npm run lint` na raiz. Os testes deram 12 arquivos e 170 testes passando. O lint passou sem erros. Li o diff de `app-shell/`, mas não abri as capturas nem a imagem do Figma, então a fidelidade visual não foi conferida por mim.

## Critérios verificados
| Critério | Situação | Evidência |
| --- | --- | --- |
| 1. Bug de contraste | atendido | `app-shell.component.html:20` remove `text-text-secondary` do link. A cor cinza passou para o `<nav>` (`:16`) e é herdada pelos links inativos. O ativo recebe `text-on-tertiary` e `bg-tertiary` por `routerLinkActive` (`:22`). O hover usa `hover:bg-tertiary hover:text-on-tertiary` (`:20`). Como o link não tem mais cor própria, o texto claro não perde mais para a classe cinza. |
| 2. Fundo roxo mantido no hover e no ativo | atendido | `:20` e `:22`. |
| 3. Aproximação do Figma | atendido | Logo em `:4-14`: quadrado `bg-primary`, "UTFgo", legenda "MOBILIDADE UTFPR" em `text-tertiary`, `routerLink="/inicio"`. Pontinho em `:25-28`, amarelo no hover (`group-hover:bg-primary`) e no ativo (`group-[.bg-tertiary]:bg-primary`). Controle segmentado em `:37-53`: Passageiro em pílula `bg-background` e Condutor com `disabled`. "Sair" (`:55-62`) e rodapé (`:66-72`) estão inalterados no diff. |
| 4. Nada quebrou | atendido | A gaveta (backdrop, Escape, botão fechar, foco) e o `.ts` não aparecem no diff. Os 6 itens e hrefs continuam (`@for` sobre `navigationItems`, e o teste novo confere 6 links). Alvo de toque: `min-h-11` (44px; `min-h-11` é usado também em `wallet-overview.page.html`). Foco visível: `focus-visible:outline-2 focus-visible:outline-tertiary` no logo e nos links. `bg-tertiary` no link ativo segue válido, e os testes existentes passaram. Nenhuma asserção antiga mudou: o diff do spec só adiciona um `describe`. |
| 5. Escopo | atendido | Os dois arquivos da casca têm diff só com o que a manutenção pede. Os demais itens do `git status` (rotas, wallet, specs, reviews) pertencem à tarefa 4, como informado. |

Os tokens usados existem em `apps/web/src/styles.css` (`text-title-small`, `text-caption`, `surface-muted`, `on-tertiary`, `border`, `radius-control`). Não vi hex solto, cor da paleta padrão nem `style=`, então a regra `01-angular-strict-rules.md` foi respeitada.

## Os testes novos provam o bug?
Sim. O teste "shows light text on the purple background…" (`app-shell.component.spec.ts`, bloco `sidebar visual`) afirma, para o link ativo, `bg-tertiary` e `text-on-tertiary` presentes e `text-text-secondary` ausente. Para o inativo, afirma `text-text-secondary` ausente. Também afirma que o `<nav>` tem `text-text-secondary`. Se `text-text-secondary` voltar ao link, os dois `.toBe(false)` falham, e o teste falha também se o cinza sair do `<nav>`.

Os testes restantes cobrem hover e `min-h-11` nos 6 links, o pontinho `aria-hidden` com `rounded-full` em cada item, o logo com legenda e link para `/inicio`, e Condutor desabilitado dentro do controle segmentado.

## Ressalvas não bloqueantes
- Os testes conferem nomes de classe, não a cor calculada. O contraste real depende do CSS gerado pelo Tailwind e só foi verificado pelas capturas do orquestrador, que não abri.
- As classes que deixam o pontinho amarelo (`group-hover:bg-primary`, `group-[.bg-tertiary]:bg-primary`) não são afirmadas por nenhum teste. Se forem removidas, a suíte continua verde.
- O botão Condutor não tem estilo próprio de desabilitado além de `text-text-secondary`. Não é requisito do pedido.

## Apontamentos bloqueantes
Nenhum.
