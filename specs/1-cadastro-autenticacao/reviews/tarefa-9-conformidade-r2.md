# Parecer de Conformidade — Tarefa 9

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1 — Cinco destinos protegidos com conteúdo e link ativo | atendido | `apps/web/src/app/app.routes.ts:24`, `apps/web/src/app/core/auth/auth.guard.spec.ts:72` |
| CA2 — Links da gaveta levam aos destinos | atendido | `apps/web/src/app/app.routes.ts:24` |
| Visitante é redirecionado dos cinco destinos | atendido | `apps/web/src/app/core/auth/auth.guard.spec.ts:72` |
| Cenário 1 — Criação de usuário e carteira inicial vinculada e zerada | não atendido | `apps/web/src/app/core/auth/auth.service.ts:67` |
| Saldo da carteira carregada é exibido no cabeçalho | atendido | `apps/web/src/app/core/auth/auth.service.ts:47`, `apps/web/src/app/core/layout/app-shell/app-shell.component.html:85` |
| Falha de API não cria sessão parcial | atendido | `apps/web/src/app/core/auth/auth.service.ts:75`, `apps/web/src/app/core/auth/auth.service.spec.ts:298` |
| CA16 — Nova tentativa após falha de API na confirmação | não atendido | `apps/web/src/app/core/auth/auth.service.ts:75` |
| Sessão antiga sem carteira não exibe saldo fictício | atendido | `apps/web/src/app/core/auth/auth.service.ts:240`, `apps/web/src/app/core/auth/auth.service.ts:263` |

Os testes foram executados com `npm test`: 8 arquivos e 85 testes passaram.

## Apontamentos

1. **Falha simultânea na criação da carteira e na compensação ainda deixa cadastro inconsistente** — `apps/web/src/app/core/auth/auth.service.ts:75`  
   Critério violado: o cenário 1 exige conta com carteira inicial (`specs/1-cadastro-autenticacao/spec.md:43`), e o CA16 exige permitir nova tentativa após falha de API (`specs/1-cadastro-autenticacao/spec.md:83`).  
   Evidência: se `POST /wallets` falhar e o `DELETE` compensatório também falhar, o erro da exclusão é descartado e o usuário pode permanecer sem carteira. Uma nova confirmação executa outro `POST /users`, podendo duplicar a conta; ao reiniciar o cadastro, o e-mail existente é rejeitado, e o login não encontra carteira. O teste cobre a repetição somente quando a exclusão compensatória tem sucesso.
