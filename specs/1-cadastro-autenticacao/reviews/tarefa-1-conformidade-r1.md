# Parecer de Conformidade — Tarefa 1

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA6 | não atendido | `apps/web/src/app/core/auth/auth.service.ts:43-70` |
| CA7 | não atendido | `apps/web/src/app/core/auth/auth.service.ts:30-41` |
| CA8 | não atendido | `apps/web/src/app/core/auth/auth.service.ts:73-86` |
| CA11 | não atendido | `apps/web/src/app/core/auth/auth.service.ts:25-34` |
| CA12 | não atendido | `apps/web/src/app/core/auth/auth.service.ts:50-70` |
| CA13 | não atendido | `apps/web/src/app/core/auth/auth.service.ts:94-98` |
| CA15 | não atendido | `apps/web/src/app/core/auth/auth.service.ts:94-105` |
| CA16 | não atendido | `apps/web/src/app/core/auth/auth.service.ts:88-92, 138-145` |

## Apontamentos

1. **A suíte de testes não executa** — `apps/web/package.json` / comando solicitado  
   Critério violado: todos os critérios ligados, pois a validação exige testes executáveis.  
   Evidência: `npm --workspace=apps/web run test -- --watch=false` falhou com `sh: 1: ng: not found`; portanto, os testes não podem comprovar os comportamentos implementados.

2. **O reenvio não implementa a confirmação visual exigida** — `apps/web/src/app/core/auth/auth.service.ts:73-86`  
   Critério violado: CA8 — “uma confirmação visual de reenvio é exibida”.  
   Evidência: o serviço gera e envia o novo desafio, mas não há estado/mensagem de confirmação visual nos arquivos avaliados.

3. **O tratamento de falha de rede cobre apenas envio, não confirmação do OTP** — `apps/web/src/app/core/auth/auth.service.ts:88-145`  
   Critério violado: CA16 — erro durante “envio ou confirmação do OTP”.  
   Evidência: não existe neste conjunto de alterações fluxo de confirmação de OTP nem tratamento de erro de rede correspondente.
