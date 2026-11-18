# Conclusão da US01 — Cadastro, Autenticação e Casca do App

## Intenção

Concluir a primeira história do UTFgo na branch `feature/1-cadastro-autenticacao`, transformando a spec aprovada em um fluxo funcional de ponta a ponta: landing, cadastro, login por e-mail institucional, OTP, sessão, rota protegida e App Shell responsivo.

## Objetivos

- Executar as Tarefas 2–8 já definidas em `specs/1-cadastro-autenticacao/plan.md`.
- Preservar a Tarefa 1 e sua revisão já commitadas.
- Manter TDD, uma tarefa por vez, dois revisores distintos e commits rastreáveis.
- Integrar a branch com `develop` antes das novas tarefas, incorporando a regra Angular da Atividade 10.
- Disponibilizar o mock `json-server` conforme a arquitetura e os comandos da atividade.
- Ao final, atualizar o PRD e o índice de specs, verificar o app no navegador e preparar o PR para `develop`.

## Fora de escopo

- Alterar a spec aprovada ou seus critérios de aceite.
- Implementar histórias diferentes da US01.
- Trocar `json-server` por backend real, SMTP, Supabase ou NestJS.
- Fazer mudanças cosméticas sem relação com os tokens/protótipo da US01.

## Critérios de não regressão

- A consulta de duplicidade continua ocorrendo antes de atualizar `pendingRegistration`.
- Falha de rede mantém os dados da tentativa atual para retry.
- Componentes não acessam `HttpClient` diretamente; a comunicação fica em services.
- Componentes Angular permanecem standalone, sem `NgModule`.
- Cada tarefa adiciona testes antes da lógica e termina com suíte verde.

## Abordagens consideradas

1. **Executar o plano existente, tarefa por tarefa — escolhida.** Preserva a rastreabilidade exigida pela atividade e permite revisão independente de cada entrega.
2. **Agrupar as Tarefas 2–8.** Reduz commits, mas quebra a correspondência entre tarefa, teste, parecer e decisão prevista no fluxo.
3. **Corrigir somente infraestrutura e documentação.** Resolve parte do checklist, mas não entrega a história funcional.

A abordagem escolhida é a primeira porque o plano já separa os limites funcionais e a disciplina exige que cada tarefa tenha seu próprio ciclo de TDD e revisão.

## Sequência de implementação

1. Preparação: trazer `origin/develop` para a branch sem reescrever histórico; incorporar a regra Angular da Atividade 10 e atualizar a arquitetura para refletir Tailwind CSS v4 como decisão efetiva.
2. Infraestrutura do MVP: criar `apps/api/db.json`, configurar o proxy `/api`, adicionar `json-server` e o script `npm run api`; manter usuários em `/users` e o envio simulado de OTP no contrato consumido pelo `AuthService`.
3. Tarefa 2: confirmar OTP, criar cadastro, persistir sessão e implementar logout.
4. Tarefa 3: criar `authGuard` e rotas base.
5. Tarefa 4: construir App Shell desktop com navegação, cabeçalho, palco, rodapé e logout.
6. Tarefa 5: adicionar gaveta mobile e seus estados de abertura/fechamento.
7. Tarefa 6: criar landing e login por e-mail.
8. Tarefa 7: criar tela de cadastro.
9. Tarefa 8: criar validação de PIN e tela inicial autenticada.
10. Fechamento: atualizar PRD/índice, rodar auditoria contra a spec, conferir navegador e preparar PR para `develop`.

## Verificação final

- `npm test`, `npm run lint` e `npm run build` verdes.
- `npm run api` e `npm start` funcionais para a conferência manual.
- Fluxos de cadastro, login, OTP, logout, rota protegida e navegação responsiva conferidos em navegador.
- Prints de celular com gaveta aberta e desktop com tela da história.
- Todas as tarefas do plano marcadas como feitas, pareceres e decisões versionados, PR mesclado em `develop` e Issue fechada pelo PR.
