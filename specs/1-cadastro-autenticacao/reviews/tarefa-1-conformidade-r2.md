# Parecer de Conformidade — Tarefa 1

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA6 — Cadastro válido e envio de OTP | atendido | `auth.service.ts:43-74`; `auth.service.spec.ts:124-137` |
| CA7 — Login institucional cadastrado | atendido | `auth.service.ts:30-41`; `auth.service.spec.ts:104-122` |
| CA8 — Reenvio de OTP | atendido nesta tarefa; confirmação visual fora desta tarefa | `auth.service.ts:77-90`; `auth.service.spec.ts:139-156` |
| CA11 — E-mail inválido ou fora da allowlist | atendido | `auth.service.ts:25-27, 30-33, 43-55` |
| CA12 — Campos ausentes ou e-mail duplicado | atendido | `auth.service.ts:48-70`; `auth.service.spec.ts:54-76` |
| CA13 — E-mail não cadastrado | atendido | `auth.service.ts:98-102`; `auth.service.spec.ts:79-87` |
| CA15 — Conta suspensa ou banida | atendido | `auth.service.ts:103-107`; `auth.service.spec.ts:89-102` |
| CA16 — Falha de rede no envio | atendido; confirmação fora desta tarefa | `auth.service.ts:92-95, 142-149`; `auth.service.spec.ts:158-172` |

## Apontamentos

Nenhum.

Testes executados com sucesso: **2 arquivos, 12 testes aprovados**.
