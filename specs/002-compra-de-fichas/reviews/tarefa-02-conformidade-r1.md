# Parecer de Conformidade — Tarefa 2
**Veredito:** APROVADO

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| `CA1` — Exibição de saldo e cotação fixa (`RN05/06`) e extrato ordenado do mais recente ao mais antigo (`specs/002-compra-de-fichas/spec.md:75`) | atendido (camada de serviço; UI `/wallet` na Tarefa 4) | `apps/web/src/app/features/wallet/services/wallet.service.ts:93-96,103-130,202-240`; `apps/web/src/app/features/wallet/services/wallet.service.spec.ts:78-198` |
| `CA2` — Filtragem do extrato em memória sem nova requisição nem perda do saldo (`specs/002-compra-de-fichas/spec.md:76`) | atendido (camada de serviço; controles de UI na Tarefa 4) | `apps/web/src/app/features/wallet/services/wallet.service.ts:60,71,132-150,179-181`; `apps/web/src/app/features/wallet/services/wallet.service.spec.ts:202-302` |
| `CA6` — Criação de `Order` (`PENDING`, `amountCents = tokensCount * 200`) e `Payment` (`PENDING`, `gatewayPaymentId` único) sem alterar `Wallet.tokenBalance` (`specs/002-compra-de-fichas/spec.md:84`) | atendido (camada de serviço; telas `/wallet/payment` e `/wallet/pix` nas Tarefas 6–7) | `apps/web/src/app/features/wallet/services/wallet.service.ts:98-101,183-190,243-313,373-399`; `apps/web/src/app/features/wallet/services/wallet.service.spec.ts:350-479` |
| `CA10` — Nova tentativa reutilizando o mesmo `Order` `PENDING` sem criar segundo `Order` (`specs/002-compra-de-fichas/spec.md:90`) | atendido (camada de serviço para retentativa; crédito único na Tarefa 3 e telas nas Tarefas 6/9) | `apps/web/src/app/features/wallet/services/wallet.service.ts:152-177,192-195,316-371`; `apps/web/src/app/features/wallet/services/wallet.service.spec.ts:483-590` |
| `CA13` — Bloqueio de compra para conta `SUSPENDED` ou `BANNED` com mensagem clara (`specs/002-compra-de-fichas/spec.md:95`) | atendido (camada de serviço; exibição nas telas nas Tarefas 4–5) | `apps/web/src/app/features/wallet/services/wallet.service.ts:77-91,251-255,321-325`; `apps/web/src/app/features/wallet/services/wallet.service.spec.ts:306-346` |
| `CA14` — Tratamento de `json-server` offline ou erro HTTP preservando estado selecionado (`specs/002-compra-de-fichas/spec.md:96`) | atendido (camada de serviço para carga, criação e retentativa; confirmação na Tarefa 3 e UI nas Tarefas 4–8) | `apps/web/src/app/features/wallet/services/wallet.service.ts:197-199,230-239,302-312,360-370,401-407`; `apps/web/src/app/features/wallet/services/wallet.service.spec.ts:594-747` |
| `Assume que 1–3` (`// TODO #2`) e glossário de `docs/architecture.md` (`specs/002-compra-de-fichas/spec.md:21,36-38`; `docs/architecture.md:152-231`) | atendido | `apps/web/src/app/features/wallet/services/wallet.service.ts:51,207,271,348,389` |

## Apontamentos


---
*Nota de verificação:* Os 17 casos de teste de `apps/web/src/app/features/wallet/services/wallet.service.spec.ts` foram inspecionados integralmente via `read_file` (sem testes pulados ou asserções frouxas) e não há alterações de arquivos por este subagente. Por ausência de ferramenta shell neste ambiente de subagente, `git diff 666655c`, `npm test` e `npm run lint` não foram executados diretamente por este revisor, tomando-se como referência a saída factual informada no despacho (`npm test`: 3 arquivos / 28 testes passando, exit code 0; `npm run lint`: exit code 0).
