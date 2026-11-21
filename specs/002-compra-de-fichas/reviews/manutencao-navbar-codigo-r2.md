# Parecer de Código — Manutenção navbar, rodada 2

**Veredito:** APROVADO

Verificação:
- `npm test`: 12 arquivos e 171 testes passaram.
- `npm run lint`: sem erros.
- Diff lido nos dois arquivos do escopo (`app-shell.component.html` e `app-shell.component.spec.ts`).

## Bloqueantes
Nenhum.

## Correção da rodada 2
- A correção está certa. Os links do menu, em `app-shell.component.html` (o `<a>` dentro do `@for`), agora têm `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tertiary`. O contorno fica afastado do fundo `bg-tertiary` no estado ativo e no hover, e isso bate com o que o orquestrador viu no navegador ao apertar Tab.
- O teste novo, "keeps a visible keyboard focus ring offset…", percorre os 6 links e confere as 3 classes de foco, incluindo `outline-offset-2`.
- Esse teste confere classes e não o estilo calculado, o que repete a sugestão da rodada 1 sobre testes presos a classes. Ela foi mantida pelo dono e não reabre.

## Regressão
- Não encontrei regressão. O link do logo mantém seu `focus-visible:outline-2` próprio, que não precisa de offset porque não tem fundo roxo.
- Nada fora dos dois arquivos entrou na avaliação.

## Sugestões (não bloqueiam)
- Nenhuma nova. Os pontos da rodada 1 que o dono não promoveu permanecem como estavam: pontinho preso a `bg-tertiary`, testes presos a classes, seletor `:not(nav a)`, drawer e "Sair".

## Observações fora do escopo deste diff
- Nenhuma.
