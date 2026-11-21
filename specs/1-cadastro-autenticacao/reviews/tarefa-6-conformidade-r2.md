# Parecer de Conformidade — Tarefa 6

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA5 — Navegação da landing para `/entrar` e `/criar-conta` | atendido | [landing.page.spec.ts:16](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/auth/pages/landing/landing.page.spec.ts:16) |
| CA7 — Envio de OTP e navegação para `/validar-codigo` com o e-mail no estado da rota | atendido | [auth.service.spec.ts:116](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/auth/auth.service.spec.ts:116), [login.page.spec.ts:82](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/auth/pages/login/login.page.spec.ts:82) |
| CA11 — Bloqueio de e-mail vazio, malformado ou fora da allowlist, com erro junto ao campo | atendido | [auth.service.spec.ts:34](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/auth/auth.service.spec.ts:34), [login.page.spec.ts:52](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/auth/pages/login/login.page.spec.ts:52) |
| CA13 — Orientação para criar conta quando o e-mail não está cadastrado | atendido | [auth.service.spec.ts:98](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/auth/auth.service.spec.ts:98), [login.page.spec.ts:124](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/auth/pages/login/login.page.spec.ts:124) |
| CA15 — Bloqueio e mensagem para contas suspensas ou banidas na solicitação do OTP | atendido | [auth.service.spec.ts:106](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/auth/auth.service.spec.ts:106), [login.page.spec.ts:130](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/auth/pages/login/login.page.spec.ts:130) |
| CA16 — Mensagem de conexão e nova tentativa com o e-mail preservado | atendido | [login.page.spec.ts:152](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/auth/pages/login/login.page.spec.ts:152) |

## Apontamentos
