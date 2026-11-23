# Parecer de Conformidade — Tarefa 6

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA8 — Consulta automática de CEP e autopreenchimento de logradouro, bairro e cidade/UF | atendido | `point-create.page.spec.ts:79` |
| CA9 — Alerta específico para CEP inválido ou inexistente, com campos editáveis | atendido | `point-create.page.spec.ts:92` e `point-create.page.spec.ts:104` |
| CA10 — Orientação e preenchimento manual após falha do ViaCEP | atendido | `point-create.page.spec.ts:117` |
| CA11 — Cadastro ativo via POST e redirecionamento para a lista | atendido | `point-create.page.spec.ts:190` |
| CA12 — Bloqueio de duplicidade com mensagem de unicidade | atendido | `point-create.page.spec.ts:222` e `apps/api/server.cjs:24` |
| CA13 — Botão desabilitado com nome ou CEP vazio ou inválido | atendido | `point-create.page.spec.ts:138` |
| Cenário 2, passo 5 — Confirmação visual do cadastro na listagem | atendido | `point-create.page.spec.ts:206` |
| Decisão da rodada 1 — Invalidar dados do CEP anterior e preservar edições manuais | atendido | `point-create.page.spec.ts:152` |

`npm test` passou com 395 testes em 25 arquivos.

## Apontamentos
