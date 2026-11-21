# Decisões — Tarefa 2, rodada 1

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Logout não invalida desafio OTP pendente. | conformidade | aceito | O logout deve encerrar também um desafio pendente para impedir autenticação posterior com um código anterior. |
| 2 | Falta teste para logout com OTP pendente. | conformidade | aceito | O comportamento aceito precisa de um teste de regressão que confirme a invalidação do desafio. |
| 3 | `session` é mutável externamente. | código | aceito | O serviço deve expor apenas uma leitura do Signal; alterações de autenticação precisam passar pelos métodos que persistem o estado. |
| 4 | Sessão restaurada sem validação em runtime. | código | aceito | JSON inválido ou incompleto no `localStorage` não pode ser tratado como sessão autenticada. |
