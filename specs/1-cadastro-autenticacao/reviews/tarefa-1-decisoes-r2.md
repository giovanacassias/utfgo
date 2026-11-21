# Decisões — Tarefa 1, rodada 2

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | `pendingRegistration` é atualizado antes da verificação de duplicidade e pode sobrescrever um cadastro pendente válido. | código | aceito | Corrigir a ordem da atualização para preservar o estado pendente correto. |
