# Parecer de Código — Alterações locais

**Veredito: APONTAMENTOS**

1. **Recuperação depende dos dados locais do navegador.** Se o usuário for persistido, mas a carteira não for criada, apagar o armazenamento local ou trocar de navegador impede a recuperação: o novo cadastro é recusado por duplicidade e o login não encontra carteira. Isso deixa uma conta sem a carteira exigida pela relação um para um em `docs/architecture.md`. Evidência: [auth.service.ts](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/auth/auth.service.ts:72).

2. **Os dados recuperados são enviados sem validar papel e status.** `registrationRecovery` valida apenas identificador, e-mail, nome e câmpus; o objeto recuperado é enviado integralmente na criação do usuário. Um registro local corrompido ou alterado pode, portanto, criar uma conta com papel diferente de `PASSENGER` ou status diferente de `ACTIVE`. Evidência: [auth.service.ts](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/auth/auth.service.ts:82) e [auth.service.ts](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/auth/auth.service.ts:312).

3. **Uma tentativa pendente pode bloquear alterações de cadastro sem caminho de saída.** Após falha antes da gravação do usuário, a retomada exige nome e câmpus idênticos aos anteriores, mas não apresenta esses valores nem permite descartar a tentativa. O usuário que não recordar o dado fica impedido de continuar. Evidência: [auth.service.ts](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/auth/auth.service.ts:175).

Os testes de concorrência usam respostas simuladas com `HttpTestingController`; eles não verificam diretamente o comportamento de duplicidade do servidor `json-server`.
