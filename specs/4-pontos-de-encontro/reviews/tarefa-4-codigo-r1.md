# Parecer de Código — Tarefa 4

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **O teste do atalho depende da tela provisória** — [home.page.spec.ts](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/home/home.page.spec.ts:70)  
   Regra violada. O perfil de revisão reprova testes acoplados a detalhes de implementação. O §4 da arquitetura estabelece que a Home e as páginas de gestão pertencem a suas respectivas features.  
   Prejuízo concreto. A troca do `h2` da tela provisória pela listagem da Tarefa 5 pode quebrar o teste mesmo que o atalho continue navegando para a URL correta dentro da casca. As verificações da URL e da casca já cobrem esse comportamento.

## Sugestões (não bloqueiam)

- Localizar o link pelo texto visível dentro de `main` evita depender da tag `app-home-page`.
- Ao implementar a Tarefa 5, mover as rotas filhas para `meeting-points.routes.ts`, conforme previsto no plano e no padrão de roteamento modular.

## Observações fora do escopo deste diff

- Nenhuma.

`npm test` passou com 384 testes. `npm run lint` concluiu com código 0.
