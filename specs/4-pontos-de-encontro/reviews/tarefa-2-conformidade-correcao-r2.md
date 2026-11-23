# Parecer de Conformidade — Tarefa 2

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA11 — Cadastro válido via `POST /meeting-points` com `isActive: true` | Atendido no serviço e na inspeção da rota direta. Validação HTTP pendente. | `apps/api/server.cjs:17`, `meeting-points.service.spec.ts:138`, `apps/api/server.test.cjs:121` |
| CA12 — Bloqueio de nome duplicado no mesmo endereço | Não atendido no mock. A rota direta retorna `409`, mas o roteamento aninhado pode gravar sem passar pela verificação de unicidade. | `apps/api/server.cjs:28`, `apps/api/server.cjs:67`, `node_modules/json-server/lib/server/router/nested.js:15` |
| CA14 — Alternância via `PATCH` sem exclusão física | Não atendido no mock. A alternância e seu indicador passaram nos testes web. A exclusão física continua alcançável pelo roteador genérico. | `meeting-points.service.spec.ts:276`, `apps/api/server.cjs:12`, `node_modules/json-server/lib/server/router/index.js:31` |

O redirecionamento e a mensagem visual de cadastro pertencem à Tarefa 6. A tela de detalhes pertence à Tarefa 7.

## Apontamentos

1. **A validação do `POST` e a unicidade cobrem apenas a rota direta** — `apps/api/server.cjs:17` e `apps/api/server.cjs:67`  
   A rota direta agora retorna `422` para campos obrigatórios ausentes ou inválidos, antes da gravação. O roteador genérico também aceita escritas por rotas aninhadas e as encaminha à criação padrão sem passar pelo handler da aplicação. Esse caminho ainda permite inserir registros incompletos ou duplicados, contrariando o bloqueante aceito e o CA12. O teste em `apps/api/server.test.cjs:74` cobre a rota direta.

2. **O bloqueio de `DELETE` direto deixa a exclusão física disponível no roteador genérico** — `apps/api/server.cjs:12` e `apps/api/server.cjs:67`  
   A rota direta retorna `405`, mas o `json-server` aplica a sobrescrita de método depois da guarda da aplicação e ainda registra a operação de remoção física em `router/plural.js:251`. Isso mantém aberto o bloqueante do CA14. O teste em `apps/api/server.test.cjs:95` verifica apenas o `DELETE` direto.

## Testes e estado do repositório

- `npm test -- --include=src/app/features/meeting-points/services/meeting-points.service.spec.ts` passou com **16 de 16 testes**. O bloqueante do indicador foi resolvido. O teste com dois pontos confirma que `loading.toggle()` permanece ativo após a primeira conclusão e desliga após a segunda.
- `node --test apps/api/server.test.cjs` ficou bloqueado pelo sandbox. A execução de diagnóstico confirmou `listen EPERM` em `127.0.0.1` nos três casos, antes das asserções HTTP. A execução de integração fica pendente com o orquestrador.
- Revisei os diffs contra `32e4dec` e `d67f990` e os três pareceres e decisões de correção. Fora dos caminhos do roteador genérico apontados acima, não identifiquei regressão no cadastro válido, no conflito pela rota direta ou na alternância via `PATCH`. A revisão foi somente leitura.

**Arquivos não rastreados**

- `specs/4-pontos-de-encontro/reviews/tarefa-2-codigo-correcao.md`
- `specs/4-pontos-de-encontro/reviews/tarefa-2-conformidade-correcao.md`
- `specs/4-pontos-de-encontro/reviews/tarefa-2-decisoes-correcao.md`
