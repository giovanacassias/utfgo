# Decisões — Tarefa 1, rodada 3

| # | Apontamento (resumo) | Parecer | Decisão | Justificativa |
| --- | --- | --- | --- | --- |
| 1 | Falha no envio do OTP em uma nova tentativa poderia manter o cadastro pendente anterior. | conformidade | recusado | A falha de rede deve preservar os dados da tentativa atual para permitir retry. O teste existente verifica esse comportamento; manter o cadastro anterior descartaria os dados recém-preenchidos e não corresponde ao fluxo solicitado. |

