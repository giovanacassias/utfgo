# Parecer de Conformidade

**Veredito: APONTAMENTOS**

**Recuperação depende do armazenamento local.** Em [auth.service.ts](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/auth/auth.service.ts:72), a retomada associa o usuário persistido ao registro salvo no navegador. Se a API gravar o usuário, a resposta se perder e o usuário apagar os dados locais ou trocar de navegador, o cadastro é recusado como duplicado. O login também falha caso a carteira ainda não exista.

O cenário afeta a nova tentativa prevista no CA16 e a criação de conta com carteira do cenário 1. Os testes novos cobrem a recuperação com o registro local preservado. A unicidade de e-mail entre dispositivos independentes também permanece sem garantia.

Nenhum arquivo foi alterado nesta revisão.
