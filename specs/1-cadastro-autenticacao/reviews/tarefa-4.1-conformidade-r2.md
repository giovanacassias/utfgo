# Parecer de Conformidade — Tarefa 4.1

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Cabeçalho, rodapé, rota no `router-outlet` e link ativo | atendido | `app-shell.component.html:45-60`; `app-shell.component.spec.ts:101-129` |
| CA3 — Menu desktop fixo à esquerda, com largura tokenizada e sem `☰` | atendido | `app-shell.component.html:1-4`; `styles.css:64`; `app-shell.component.spec.ts:75-111` |
| Token de largura desktop declarado nos tokens locais | atendido | `styles.css:64`; `docs/design-tokens.md:85` |
| Título “Caronas” em `/caronas?filtro=hoje` | atendido | `app-shell.component.ts:29-42`; `app-shell.component.spec.ts:143-149` |
| Testes | atendido | `npm test`: 4 arquivos, 32 testes aprovados |

## Apontamentos

1. **O diff exato solicitado está vazio** — `git diff 300f14eeda4e8a3bdcdff5ebaa42f231a3486174..HEAD`
   Critério violado: a revisão foi solicitada contra esse intervalo específico.
   Evidência: as implementações estão apenas no working tree (`M`/`??`); não há alterações entre a referência informada e `HEAD`.
