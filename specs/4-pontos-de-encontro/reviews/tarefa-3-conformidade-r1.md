# Parecer de Conformidade — Tarefa 3

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA5 — O card recebe `MeetingPoint`, exibe nome, endereço e status e emite o ID ao clicar na ação de status. | atendido | `point-card.component.ts:8`, `point-card.component.ts:34`, `point-card.component.spec.ts:17` |
| CA5 — Uso do card na listagem. | fora desta tarefa | `spec.md:77` (integração na Tarefa 5) |
| CA6 — O termo de busca e o filtro de ativos sincronizam em ambas as direções com `model()`. | atendido | `point-search.component.ts:33`, `point-search.component.spec.ts:16`, `point-search.component.spec.ts:34` |

`npm test` passou com 379 testes em 22 arquivos. Os quatro arquivos estavam não rastreados. A leitura direta permitiu verificar o comportamento e a cobertura dos testes. A ordem de criação dos testes e dos componentes não pôde ser verificada no estado revisado.

## Apontamentos
