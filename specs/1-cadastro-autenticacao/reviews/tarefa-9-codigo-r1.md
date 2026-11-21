# Parecer de Código — Tarefa 9

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **Cadastro pode deixar usuário sem carteira e criar duplicatas na repetição** — [auth.service.ts](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/auth/auth.service.ts:67)  
   A arquitetura declara a relação um para um entre `User` e `Wallet`. Os dois registros são criados em requisições independentes: se a criação da carteira falhar após a criação do usuário, o usuário permanece sem carteira. Uma nova confirmação envia outro `POST /users`, podendo criar uma conta duplicada; o login da primeira conta também falha ao não encontrar carteira. O teste incluído verifica a ausência de sessão parcial, mas não cobre a repetição após essa falha.

2. **Sessão restaurada pode exibir saldo fictício** — [auth.model.ts](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/models/auth.model.ts:33) e [app-shell.component.html](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/layout/app-shell/app-shell.component.html:85)  
   A carteira é opcional na sessão, e a restauração aceita sessões anteriores sem ela. Nessa situação, o cabeçalho apresenta zero sem carregar a carteira persistida, podendo ocultar um saldo diferente de zero.

## Sugestões (não bloqueiam)

- Acrescentar teste que repita a confirmação depois da falha de criação da carteira e verifique a consistência dos registros.

## Observações fora do escopo deste diff

- Nenhuma.

**Verificação:** `npm test` passou: 8 arquivos e 84 testes. O arquivo não rastreado `placeholder.page.ts` também foi examinado.
