# Parecer de Conformidade — Tarefa 4 (rodada 2)

**Veredito:** APROVADO

Rodei `npm test` na raiz: 12 arquivos e 162 testes passando (eram 158 na rodada 1, ou seja, 4 testes novos). `npm run lint` rodou sem erros. Não alterei nenhum arquivo.

Não há cópia da rodada 1 para comparar linha a linha. A comparação foi feita entre o working tree e o parecer r1, que cita as mesmas linhas. O `git diff` contra `46027d0` mostra só a troca da rota `cofrinho` em `app.routes.ts`, e os demais arquivos são novos.

## As 3 correções aceitas na triagem
| Correção | Situação | Onde |
| --- | --- | --- |
| (1) Link "Voltar" com alvo de 44 px (`inline-flex min-h-11 min-w-11 items-center justify-center`) | feito | `wallet-overview.page.html:2`. Teste: `wallet-overview.page.spec.ts:323-329` |
| (2) `focus-visible:outline-2 focus-visible:outline-tertiary` nos controles | feito | Presente em todos os `a` e `button` da página: `.html:2,27,58,66,73,90,128,136`. Testes: `spec.ts:331-350` |
| (3) `role="status"` no indicador de carregamento | feito | `.html:36`. Teste: `spec.ts:316-321` |

## Critérios reverificados
| Critério | Situação | Onde |
| --- | --- | --- |
| CA1: saldo em fichas e em R$, `1 ficha = R$ 2,00`, "Comprar fichas", lista ou estado vazio | atendido | `.html:45-51,71-76,103-158`. Testes: `spec.ts:143-185` |
| CA2: 4 filtros, sem nova requisição e sem perder o saldo | atendido | `.html:85-101` e `.ts:37-42,52-54`. Testes: `spec.ts:187-216` (`loadWalletData` fica em 1 chamada) |
| CA11, parte do extrato: cancelar pedido `PENDING` | atendido | `.html:124-143` e `.ts:56`. Teste: `spec.ts:243-252`. A mudança de status ficou no service, na tarefa 3 |
| CA13: conta `SUSPENDED`/`BANNED` em `/cofrinho` | atendido | `.html:10-17,62-69,129`. Testes: `spec.ts:266-285`. A parte de `/cofrinho/comprar` é das tarefas 5-9 |
| CA14: erro de rede ao carregar a carteira, com retentar e sem sucesso falso | atendido | `.html:19-33,39`, `.ts:48`. Testes: `spec.ts:287-307`. Criar pedido e confirmar pagamento são de outras tarefas |
| Assunção 4: `loadChildren` dentro da casca com `authGuard`; `/`, landing e login intactos | atendido | `app.routes.ts:28-32` e `wallet.routes.ts:4-12`. Testes: `app.routes.spec.ts:75-118`, que cobre o menu ativo e o redirecionamento sem sessão |
| Assunção 5: "Doar fichas" desabilitado com "Em breve" | atendido | `.html:55-61`. Teste: `spec.ts:153-159` |

## Nada mais mudou nem regrediu
- O comportamento, os textos e os rótulos da página são os que o r1 aprovou. A única mudança no template são as classes e atributos das 3 correções.
- O arquivo `.ts` da página tem a mesma lógica descrita no r1, sem acréscimos de comportamento.
- O diff de `app.routes.ts` continua restrito à rota `cofrinho`. Nada em `features/auth`, na casca ou nos testes da US01 foi tocado.
- Os 4 testes novos são os três das correções mais o de `spec.ts:346-350`. Este último só confere o outline do link "Comprar fichas". O título menciona também o botão de compra bloqueado, que ele não exercita. É só um defeito de redação do título e não afeta nenhum critério.

## Apontamentos
Nenhum bloqueante.

Observações herdadas da rodada 1, ainda válidas e não bloqueantes: o teste de "filtro sem resultado" (`spec.ts:218-225`) não confere o texto, e `resumeOrder` navega para `/cofrinho/pagamento`, rota que só nasce na tarefa 6 (a `// TODO #2` está em `.ts:62`).
