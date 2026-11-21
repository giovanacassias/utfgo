# Parecer de Código — Tarefa 8

**Veredito: APONTAMENTOS**

## Apontamentos (bloqueiam)

1. **A suíte de testes falha após a substituição da página provisória** — [app.routes.ts](/home/dudupadilha/projects/utfgo/apps/web/src/app/app.routes.ts:20)

   O teste em [auth.guard.spec.ts](/home/dudupadilha/projects/utfgo/apps/web/src/app/core/auth/auth.guard.spec.ts:70) ainda exige o seletor do componente provisório, que a rota deixou de carregar. A arquitetura define `npm test` como comando de testes do frontend; sua execução terminou com **76 testes aprovados e 1 falha**. A asserção deve verificar o conteúdo ou comportamento atual da rota dentro da casca, sem depender do componente provisório.

## Sugestões (não bloqueiam)

- Remover as rotas e o componente provisório de início quando não forem mais necessários, para evitar caminhos de manutenção duplicados.

## Observações fora do escopo deste diff

- Nenhuma outra observação.
