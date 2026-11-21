# Decisões — Tarefa 8, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | O erro de um campo vazio não aparece ao sair dele, a partir do segundo campo tocado (`card-payment.page.ts:171-181`): `toSignal(form.events)` escuta só o `FormGroup`, que só emite o evento de "tocado" na primeira vez; faltam testes de blur em dois campos vazios em sequência | código (bloqueante) | aceito | Segue a recomendação do revisor: é o caso mais comum de passar por um formulário com Tab e contraria a spec ("depois que a pessoa digita ou sai do campo"). A correção assina também os eventos dos campos e vem com teste de regressão. |

Sugestões não promovidas (candidatas a manutenção, sem correção nesta tarefa): comentário em `pay()` que promete "revalidar" mas só revalida o grupo (usar `controls.expiry.updateValueAndValidity()`); validade preenchida pelo navegador como `11/2026` cai na mensagem de formato (de acordo com a spec, sem máscara); `run('create')` retorna sem ação nem erro se `busy()` estiver ativo no `ngOnInit`; link "Voltar" não bloqueado durante ação em andamento; seta de voltar só no mobile; teste de existência do ícone com `process.getBuiltinModule`; pedido órfão no `WalletService.createOrderAndPayment` quando o POST do Order dá certo e o do Payment falha (fora do escopo).
