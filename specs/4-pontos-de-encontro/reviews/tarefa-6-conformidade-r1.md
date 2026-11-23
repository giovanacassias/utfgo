# Parecer de Conformidade — Tarefa 6

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA8 — Consulta automática de CEP e autopreenchimento | atendido | `point-create.page.spec.ts:78` |
| CA9 — Alerta de CEP inválido ou inexistente | atendido | `point-create.page.spec.ts:91` e `point-create.page.spec.ts:103` |
| CA10 — Falha de rede com preenchimento manual | atendido | `point-create.page.spec.ts:116` |
| CA11 — Cadastro ativo via POST e redirecionamento para a lista | atendido | `point-create.page.spec.ts:166` |
| CA12 — Bloqueio de duplicidade com mensagem de unicidade | atendido | `point-create.page.spec.ts:186` e `apps/api/server.cjs:24` |
| CA13 — Botão desabilitado com nome ou CEP inválido | atendido | `point-create.page.spec.ts:137` |

`npm test` passou com 394 testes em 25 arquivos.

## Apontamentos

1. **Falta a confirmação visual de cadastro na listagem** — `point-create.page.ts:234`  
   Critério violado: cenário 2, passo 5, em `spec.md:58`, que prevê o redirecionamento para a listagem com mensagem de sucesso.  
   Evidência: após a confirmação do POST, o componente redireciona para a listagem, onde a mensagem de sucesso está ausente. O teste confirma a URL de destino em `point-create.page.spec.ts:182`.
