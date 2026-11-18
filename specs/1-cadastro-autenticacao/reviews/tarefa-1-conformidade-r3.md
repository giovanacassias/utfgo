# Parecer de Conformidade — Tarefa 1

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| Allowlist institucional — CA11 | atendido | `auth.service.ts:25-27` |
| Cadastro válido consulta duplicidade antes de avançar — CA6/CA12 | atendido | `auth.service.ts:64-70` |
| E-mail duplicado bloqueado — CA12 | atendido | `auth.service.ts:66-67` |
| Dados pendentes mantidos após cadastro válido — CA6 | atendido | `auth.service.ts:69` |
| Envio e reenvio de OTP — CA8 | atendido | `auth.service.ts:76-89, 141-148` |
| Erro amigável de rede — CA16 | atendido | `auth.service.ts:91-95, 147` |
| Preservação do estado pendente em falha de rede | não atendido | `auth.service.ts:69` |
| Testes da tarefa | atendido | `auth.service.spec.ts`; 12 testes passaram |

## Apontamentos

1. **Falha no envio do OTP pode sobrescrever um cadastro pendente válido** — `apps/web/src/app/core/auth/auth.service.ts:69`

   Critério alegado: CA16 — falha de rede deve permitir nova tentativa sem apagar os dados preenchidos.

   Evidência: o cenário considera uma nova tentativa com pendente anterior já existente e falha no POST de `/api/auth/otp/send`.

