# Parecer de Conformidade — Alterações locais, rodada 2

**Veredito: APONTAMENTOS**

Os três apontamentos aceitos na rodada anterior foram abordados: o login cria a carteira ausente após a confirmação do OTP, a criação força papel `PASSENGER` e status `ACTIVE`, e o usuário pode alterar dados de uma tentativa pendente quando ainda não há conta persistida.

**Apontamento bloqueante — conflito de cadastro é apresentado como falha de conexão.** Se dois cadastros consultarem o mesmo e-mail antes de qualquer conta ser criada, o servidor retorna `409` ao segundo `POST /users`. Em [auth.service.ts](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/auth/auth.service.ts:102), esse erro é convertido na mensagem genérica de rede. O CA12 exige informar que o e-mail já está cadastrado e orientar a entrar.

**Verificação:** `npm test` passou com 95 testes. O teste novo do servidor não integra esse comando e não pôde ser executado no sandbox: a abertura da porta local retornou `EPERM`. A revisão não alterou arquivos.
