# Parecer de Código — Tarefa 2

**Veredito: APONTAMENTOS**

Revisei `git diff 32e4dec` e `git diff d67f990` à luz da arquitetura, do plano, da spec e dos pareceres e decisões da Tarefa 2. Dois dos três bloqueantes aceitos foram resolvidos. A exclusão física ainda é possível pelo roteador do mock.

## Apontamento bloqueante

1. **O bloqueio de exclusão física é parcial.** O handler responde `405` ao `DELETE` direto, antes de delegar ao `json-server`. O roteador delegado aplica a sobrescrita de método HTTP depois dessa guarda e ainda registra o handler que remove o registro do banco. Assim, uma requisição cujo método seja convertido dentro do roteador pode chegar à exclusão física. Isso mantém o CA14 em aberto. A guarda precisa atuar sobre o método efetivo antes de o roteador executar a mutação. O teste atual cobre o `DELETE` direto. [server.cjs](/home/dudupadilha/projects/utfgo/apps/api/server.cjs:12) · [Roteador do json-server](/home/dudupadilha/projects/utfgo/node_modules/json-server/lib/server/router/index.js:31) · [Handler de exclusão](/home/dudupadilha/projects/utfgo/node_modules/json-server/lib/server/router/plural.js:250) · [Spec](/home/dudupadilha/projects/utfgo/specs/4-pontos-de-encontro/spec.md:90)

## Demais verificações

- **POST sem campos obrigatórios — resolvido por inspeção.** O mock devolve `422` antes de gravar quando nome ou endereço estão ausentes ou em branco, ou quando as coordenadas não são números finitos. O cadastro válido gera `createdAt` e persiste com `isActive: true` (CA11). A checagem de duplicidade normalizada e o retorno `409` foram preservados (CA12). [server.cjs](/home/dudupadilha/projects/utfgo/apps/api/server.cjs:17) · [server.test.cjs](/home/dudupadilha/projects/utfgo/apps/api/server.test.cjs:74)
- **Indicador de alternância em paralelo — resolvido e confirmado por teste.** O contador mantém `loading.toggle()` ativo até a última operação sair do `finally`. O teste conclui um `PATCH` enquanto o outro segue pendente e verifica o indicador nos dois momentos. A desativação e a reativação continuam usando `PATCH`. [meeting-points.service.ts](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/meeting-points/services/meeting-points.service.ts:94) · [meeting-points.service.spec.ts](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/meeting-points/services/meeting-points.service.spec.ts:276)

A inspeção dos diffs e os testes web não indicaram regressão nos fluxos válidos de cadastro, duplicidade e alternância por `PATCH` no escopo da Tarefa 2.

## Testes e estado do repositório

- `npm test -- --include=src/app/features/meeting-points/services/meeting-points.service.spec.ts` — **16 de 16 passaram**.
- `node --test apps/api/server.test.cjs` — o diagnóstico confirmou `listen EPERM` em `127.0.0.1` antes das asserções HTTP. A execução da suíte de integração fica pendente com o orquestrador.
- `git diff --check d67f990` — sem apontamentos de whitespace.

Arquivos não rastreados em `specs/4-pontos-de-encontro/reviews/`:

- `tarefa-2-codigo-correcao.md`
- `tarefa-2-conformidade-correcao.md`
- `tarefa-2-decisoes-correcao.md`

A revisão foi somente leitura.
