# Parecer de Código — Tarefa 9

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **Falha na compensação deixa o cadastro inconsistente** — [auth.service.ts](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/auth/auth.service.ts:75)  
   Regra violada: [architecture.md](/home/dudupadilha/projects/utfgo/docs/architecture.md) §5.2 estabelece relação um para um entre `User` e `Wallet` e unicidade do e-mail.  
   Prejuízo concreto: se a criação da carteira falhar e o `DELETE` de compensação também falhar, o segundo erro é descartado e o usuário permanece sem carteira. Uma nova confirmação cria outro usuário com o mesmo e-mail; reiniciar o cadastro encontra o e-mail já cadastrado, enquanto o login da conta sem carteira falha. O teste acrescentado cobre somente a compensação bem-sucedida.

## Sugestões (não bloqueiam)

- Cobrir a falha da compensação e a tentativa posterior com um teste que verifique a consistência dos registros.

## Observações fora do escopo deste diff

- Nenhuma.

A rejeição de sessões antigas sem carteira resolve o saldo fictício identificado na primeira rodada. `npm test` passou: 8 arquivos e 85 testes. O diff completo e os arquivos não rastreados foram examinados.
