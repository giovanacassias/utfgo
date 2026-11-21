# Parecer de Conformidade — Manutenção navbar, rodada 2

**Veredito:** APROVADO

Revisão feita sobre `git diff -- apps/web/src/app/core/layout/app-shell/`. O diff cobre apenas `app-shell.component.html` e `app-shell.component.spec.ts`. A tarefa de manutenção não tem `spec.md`, então os critérios são os do dono.

Testes e lint:
- `npm test`: 12 arquivos e 171 testes passaram.
- `npm run lint`: sem erros.

## Critérios verificados
| Critério | Situação | Onde |
| --- | --- | --- |
| 1. Contraste: ativo e hover com `text-on-tertiary` sobre `bg-tertiary`; demais herdam cinza do `nav` | atendido | O `nav` ganhou `text-text-secondary` e o link perdeu a classe de cor própria (html, linhas 15 a 21). Ativo: `routerLinkActive="bg-tertiary text-on-tertiary"`. Hover: `hover:bg-tertiary hover:text-on-tertiary`. Spec: "shows light text on the purple background..." (afirma que não há `text-text-secondary` no link) e "applies the purple hover state...". |
| 2. Fundo roxo mantido no hover e no ativo | atendido | `hover:bg-tertiary` e `routerLinkActive="bg-tertiary ..."` |
| 3. Aproximação do Figma | atendido | Logo pequeno: quadrado `bg-primary` mais "UTFgo" e "MOBILIDADE UTFPR". Pontinho `size-2 rounded-full` em cada item. Controle segmentado `data-app-shell-profile-switch` com Passageiro e Condutor `disabled`. "Sair" e rodapé não aparecem no diff, então ficaram inalterados. |
| 4. Nada quebrou | atendido | `(click)="closeDrawer()"` e `[routerLink]` mantidos. Os 6 itens e hrefs continuam, com `min-h-11` (44px) em cada link. Os testes existentes com `bg-tertiary` no link ativo seguem passando. |
| 5. Escopo restrito aos dois arquivos | atendido | `git status` nesse diretório mostra só esses dois arquivos modificados. |
| 6. `focus-visible:outline-offset-2` nos links do menu | atendido | Presente no `class` dos links do menu (html, linha 18). Novo teste "keeps a visible keyboard focus ring offset..." confere `outline-2`, `outline-tertiary` e `outline-offset-2` nos 6 links. |

O teste do critério 6 só confere a presença das classes. A confirmação visual da rodada 2 foi feita pelo orquestrador no navegador, com Tab, e não pude reproduzi-la aqui.

O único acréscimo além do pedido é o `focus-visible:outline-2 focus-visible:outline-tertiary` no link do logo. É coerente com o padrão dos outros links, não adiciona comportamento novo e não bloqueia.

## Apontamentos bloqueantes
Nenhum.
