# Parecer de Conformidade — Tarefa 8

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA8 — Reenvio de OTP e confirmação visual | atendido | `verify-pin.page.ts:56`, `verify-pin.page.spec.ts:46`, `auth.service.ts:125` |
| CA9 — Confirmação, sessão e redirecionamento para `/inicio` com saudação | não atendido | `verify-pin.page.ts:43`, `verify-pin.page.spec.ts:63`, `auth.guard.spec.ts:71` |
| CA14 — Erros para código incompleto, inválido ou expirado | atendido | `verify-pin.page.ts:43`, `verify-pin.page.spec.ts:34`, `auth.service.ts:28` |
| CA16 — Erro de conexão e preservação dos dados para nova tentativa | atendido | `verify-pin.page.ts:51`, `verify-pin.page.spec.ts:40`, `verify-pin.page.spec.ts:53` |

## Apontamentos

1. **A suíte de testes falha após a substituição da página protegida** — `apps/web/src/app/core/auth/auth.guard.spec.ts:71`
   Critério violado: CA9 exige redirecionamento para `/inicio` exibindo o nome; a revisão exige que os testes executem com sucesso para considerar o critério atendido.
   Evidência: `npm test` terminou com 76 testes aprovados e um reprovado. O teste de rota protegida ainda espera `app-route-placeholder` dentro da casca, enquanto a rota agora carrega `HomePage`. O teste novo da saudação passou, mas a suíte completa permanece reprovada.
