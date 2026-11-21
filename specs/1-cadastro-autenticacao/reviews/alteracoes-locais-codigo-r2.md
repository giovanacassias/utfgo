# Parecer de Código — Alterações locais, rodada 2

**Veredito: APONTAMENTOS**

Os três apontamentos aceitos na primeira rodada foram tratados no fluxo normal: o login pode criar a carteira ausente, papel e status do cadastro são definidos novamente, e uma tentativa pendente sem usuário persistido pode ser reiniciada com dados diferentes.

## Apontamentos

1. **O novo endpoint de usuários não preserva a chave primária.** O `POST /users` personalizado usa `push()` e verifica apenas a unicidade do e-mail. Ele aceita dois usuários com o mesmo `id` e e-mails diferentes e também grava usuários sem `id` quando o campo é omitido. Isso contraria a chave primária `User.id` definida na arquitetura e altera o comportamento anterior do router do json-server. Evidência: [server.cjs](/home/dudupadilha/projects/utfgo/apps/api/server.cjs).

2. **O teste de integração da API não roda pelo comando padrão.** [server.test.cjs](/home/dudupadilha/projects/utfgo/apps/api/server.test.cjs) verifica as novas regras de concorrência, mas `npm test` na raiz executa apenas os testes Angular. Assim, o comando obrigatório da suíte não verifica essas regras. Evidência: [package.json](/home/dudupadilha/projects/utfgo/package.json).

**Verificação:** `npm test` passou com 95 testes. A execução isolada do teste da API foi impedida pelo sandbox, que recusou a abertura de `127.0.0.1` com `EPERM`; não foi possível confirmar seu resultado nesta revisão.
