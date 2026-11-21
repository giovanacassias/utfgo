# Parecer de Conformidade — Tarefa 9

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Cinco destinos protegidos com conteúdo e link ativo | atendido | `apps/web/src/app/app.routes.ts:24`, `apps/web/src/app/core/auth/auth.guard.spec.ts:72` |
| CA2 — Links da gaveta levam aos destinos | atendido | `apps/web/src/app/app.routes.ts:24`, `apps/web/src/app/core/layout/app-shell/app-shell.component.spec.ts` |
| Visitante é redirecionado dos cinco destinos | atendido | `apps/web/src/app/core/auth/auth.guard.spec.ts:72` |
| Cenário 1 — Criação de usuário e carteira inicial vinculada e zerada | não atendido | `apps/web/src/app/core/auth/auth.service.ts:67` |
| Saldo da carteira carregada é exibido no cabeçalho | atendido | `apps/web/src/app/core/auth/auth.service.ts:47`, `apps/web/src/app/core/layout/app-shell/app-shell.component.html:85` |
| Falha de API não cria sessão parcial | atendido | `apps/web/src/app/core/auth/auth.service.spec.ts:298` |
| CA16 — Nova tentativa após falha de API na confirmação | não atendido | `apps/web/src/app/core/auth/auth.service.ts:67` |

Os testes foram executados com `npm test`: 8 arquivos e 84 testes passaram.

## Apontamentos

1. **Falha na criação da carteira deixa usuário sem carteira e a nova tentativa pode duplicar a conta** — `apps/web/src/app/core/auth/auth.service.ts:67`  
   Critério violado: a spec exige conta com carteira inicial no cenário 1 (`specs/1-cadastro-autenticacao/spec.md:43`) e nova tentativa após erro de API (`specs/1-cadastro-autenticacao/spec.md:83`).  
   Evidência: o usuário é persistido antes da requisição de criação da carteira. Se essa segunda requisição falhar, não há sessão, mas o usuário permanece salvo. Repetir a confirmação executa outro `POST /users`; se o usuário reiniciar o cadastro, o e-mail é considerado duplicado e o login falha por ausência de carteira. O teste cobre apenas a ausência de sessão parcial, sem verificar recuperação ou duplicação.
