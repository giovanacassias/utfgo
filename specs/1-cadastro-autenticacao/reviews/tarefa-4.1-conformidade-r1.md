# Parecer de Conformidade — Tarefa 4.1

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Palco central e destaque de rota ativa | atendido no working tree | `app-shell.component.html:38-60`, `app-shell.component.spec.ts:86-114` |
| CA3 — Menu lateral fixo no desktop | atendido no working tree | `app-shell.component.html:1-5`, `app-shell.component.spec.ts:94-99` |

## Apontamentos

1. **O diff solicitado está vazio** — `git diff 300f14eeda4e8a3bdcdff5ebaa42f231a3486174..HEAD`
   Critério violado: CA1 e CA3 não podem ser comprovados pelo diff indicado.
   Evidência: as correções estão apenas no working tree; `HEAD` permanece no commit `300f14e` e há arquivos modificados/não rastreados.

2. **O teste do token não prova a declaração do token nos tokens locais** — `app-shell.component.spec.ts:75-84`
   Critério violado: requisito da Tarefa 4.1 de provar que o token de largura desktop está declarado localmente.
   Evidência: o teste verifica apenas as classes `lg:w-62` e `lg:pl-62`; a declaração real está em `styles.css:64`, mas não é validada pelo teste.

`npm test`: 32 testes passaram.
