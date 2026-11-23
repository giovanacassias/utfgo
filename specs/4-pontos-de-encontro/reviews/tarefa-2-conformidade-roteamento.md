# Parecer de Conformidade — Tarefa 2

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA11 — Cadastro válido com `isActive: true` | Atendido no fluxo direto por inspeção. A persistência HTTP ficou pendente de execução. | `apps/api/server.cjs:13`, `apps/api/server.test.cjs:134` |
| CA12 — Bloqueio de duplicidade no mesmo endereço | Não atendido. O `POST` direto verifica unicidade, mas resta um caminho de escrita pelo roteamento aninhado. | `apps/api/server.cjs:24`, `apps/api/server.cjs:66` |
| CA14 — Alternância de status sem exclusão física | Atendido por inspeção. O `PATCH` admite apenas `isActive` booleano. O `DELETE` direto e o `POST` para um item são rejeitados antes da sobrescrita de método do `json-server`. | `apps/api/server.cjs:51`, `apps/api/server.test.cjs:88` |

A inspeção preservou os fluxos admitidos de `POST` na coleção, `GET` na coleção e por ID e `PATCH` de status por ID. O redirecionamento e a mensagem visual de cadastro pertencem à Tarefa 6. A interface de detalhes pertence à Tarefa 7.

O comando `node --test apps/api/server.test.cjs` foi executado. O diagnóstico confirmou `listen EPERM` em `127.0.0.1` nos três casos, antes das asserções HTTP. A validação de integração ficou pendente com o orquestrador. A revisão foi somente leitura.

## Apontamentos

1. **A guarda de escrita aninhada e o roteador interpretam o destino de formas diferentes** — `apps/api/server.cjs:66`  
   Critério violado: CA12, `specs/4-pontos-de-encontro/spec.md:88`, exige bloquear o cadastro duplicado no mesmo endereço.  
   Evidência: a guarda compara o parâmetro aninhado decodificado após separá-lo apenas por `/`. O `json-server` reconstrói a URL com esse parâmetro e resolve o caminho novamente. Delimitadores de URL interpretados nessa segunda etapa podem fazer a guarda aceitar um destino que o roteador resolve como a coleção `meeting-points`. A gravação então passa pelo `POST` genérico, fora da validação e da verificação de unicidade. O teste em `apps/api/server.test.cjs:99` cobre o bloqueio da forma aninhada simples.
