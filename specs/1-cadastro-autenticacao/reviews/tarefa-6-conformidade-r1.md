# Parecer de Conformidade — Tarefa 6

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA5 — Navegação da tela inicial para login e cadastro | atendido | [landing.page.spec.ts:16](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/auth/pages/landing/landing.page.spec.ts:16) |
| CA7 — Envio de OTP, navegação e exibição do e-mail | não atendido | [auth.routes.ts:24](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/auth/auth.routes.ts:24) |
| CA11 — Bloqueio e mensagem junto ao campo de e-mail no login | atendido | [login.page.spec.ts:45](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/auth/pages/login/login.page.spec.ts:45) |
| CA13 — Orientação para criar conta quando o e-mail não está cadastrado | atendido | [login.page.spec.ts:124](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/auth/pages/login/login.page.spec.ts:124) |
| CA15 — Bloqueio de contas suspensas ou banidas na solicitação do OTP | atendido | [login.page.spec.ts:125](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/auth/pages/login/login.page.spec.ts:125) |
| CA16 — Mensagem de conexão e nova tentativa com o e-mail preservado | atendido | [login.page.spec.ts:153](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/auth/pages/login/login.page.spec.ts:153) |

## Apontamentos

1. **O e-mail informado não é exibido em `/validar-codigo`** — `apps/web/src/app/features/auth/auth.routes.ts:24`  
   Critério violado: CA7, [spec.md:70](/home/dudupadilha/projects/utfgo/specs/1-cadastro-autenticacao/spec.md:70), exige que o fluxo navegue para a tela de validação exibindo o e-mail informado.  
   Evidência: `npm test` passou com 63 testes e a execução direcionada passou com 14. O teste de sucesso verifica a geração do OTP, a navegação e o e-mail no estado do roteador. A rota de destino ainda renderiza um `<span>` vazio. A exibição do e-mail permanece pendente na tela prevista para a Tarefa 8. [login.page.spec.ts:82](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/auth/pages/login/login.page.spec.ts:82) · [route-placeholder.page.ts:5](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/auth/pages/route-placeholder/route-placeholder.page.ts:5)
