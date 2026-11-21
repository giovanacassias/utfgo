# Parecer de Conformidade — Tarefa 2

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **Logout não invalida desafio OTP pendente.**

   `logout()` limpava apenas `session` e `localStorage`; o desafio em memória continuava utilizável. Após logout, um OTP pendente poderia autenticar o usuário novamente, contrariando o encerramento efetivo da sessão (CA10).

2. **Falta teste para logout com OTP pendente.**

   Os testes cobriam logout após autenticação bem-sucedida, mas não o caso de um desafio ainda pendente.

## Observações

- CA9/CA10 também exigem navegação, saudação e bloqueio de rotas; conforme o plano, esses comportamentos ficam nas Tarefas 3, 4 e 8.
- A suíte executou 21 testes antes da correção.
