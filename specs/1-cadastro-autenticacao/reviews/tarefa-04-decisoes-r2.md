# Decisões da equipe — Tarefa 4 — Rodada 2

| # | Apontamento | Decisão | Justificativa |
|---|---|---|---|
| 1 | `w-62` e `pl-62` produzem 248px, mas `62` não está declarado como token semântico local. | Aceito | O projeto exige que os valores visuais usados pelo componente estejam definidos explicitamente nos tokens locais. |
| 2 | O título ativo não reconhece rotas com query string, como `/caronas?filtro=hoje`. | Aceito | O título deve continuar representando a rota ativa mesmo quando a URL contém parâmetros de consulta. |
