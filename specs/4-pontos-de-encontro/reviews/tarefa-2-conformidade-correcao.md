# Parecer de Conformidade — Tarefa 2

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA11 — Persistência de dados válidos via `POST /meeting-points` com `isActive: true` | atendido no serviço e na inspeção do mock. Execução da API pendente | `meeting-points.service.ts:61–90`, `apps/api/server.cjs:28–34`, `apps/api/server.test.cjs:107–118` |
| CA12 — Bloqueio de nome duplicado no mesmo endereço, com mensagem de unicidade | atendido no serviço e na inspeção do mock. Execução da API pendente | `meeting-points.service.ts:66–69,129–153`, `apps/api/server.cjs:10–26`, `apps/api/server.test.cjs:57–76` |
| CA14 — Desativação e reativação via `PATCH /meeting-points/:id`, sem exclusão física | não atendido. O serviço alterna o status via `PATCH`, mas o mock também permite exclusão física | `meeting-points.service.ts:94–126`, `apps/api/server.cjs:55` |
| Interface dos critérios | fora desta tarefa. Formulário, mensagem visual e redirecionamento pertencem à Tarefa 6. Tela de detalhes pertence à Tarefa 7 | `specs/4-pontos-de-encontro/plan.md:61–69` |

O teste web solicitado passou com **15 de 15 testes**. O teste da API foi bloqueado pelo ambiente com `listen EPERM` em `127.0.0.1`, antes das asserções HTTP. A execução da API fica pendente com o orquestrador. `git status --short` mostrou nove arquivos rastreados modificados e nenhum arquivo não rastreado.

Os seis itens aceitos na rodada 2 têm correção no diff de `32e4dec`:

1. O `POST` define `createdAt` e força `isActive: true`. O teste da API também verifica o ID e consulta o registro criado. `apps/api/server.cjs:28–34`, `apps/api/server.test.cjs:107–118`.
2. O teste resolve `API_URL` e `WALLET_API_URL` pelo `TestBed` e verifica o valor `/api`. `meeting-points.service.spec.ts:320–326`.
3. `formatError()` aceita mensagens do servidor em `409` e `422`, mantém a mensagem de rede e usa a mensagem padrão em `500`. `meeting-points.service.ts:144–157`, `meeting-points.service.spec.ts:290–314`.
4. O `409` do mock inclui `statusCode`, `message`, `error` e `timestamp`, com asserções no teste da API. `apps/api/server.cjs:20–26`, `apps/api/server.test.cjs:63–70`.
5. Ambos os ambientes usam `apiUrl`, e `WALLET_API_URL` continua resolvendo para `/api` pela configuração da aplicação. `apps/web/src/environments/environment.ts:2–4`, `apps/web/src/environments/environment.development.ts:2–4`, `apps/web/src/app/app.config.ts:13–24`.
6. Sem o ponto na lista, `toggleStatus()` consulta o ID antes do `PATCH`. Os testes web cobrem a atualização do estado reativo e o retorno `404`. `meeting-points.service.ts:94–126`, `meeting-points.service.spec.ts:261–288`.

## Apontamentos

1. **O mock permite exclusão física de pontos de encontro** — `apps/api/server.cjs:55`  
   Critério violado: `specs/4-pontos-de-encontro/spec.md:40` proíbe exclusão física, e a linha 90 exige soft delete no CA14.  
   Evidência: a coleção `meeting-points` adicionada no diff de `d67f990` é servida pelo roteador padrão do `json-server`. O roteador registra `DELETE /:id` com `destroy`, que chama `removeById` e grava o resultado (`node_modules/json-server/lib/server/router/plural.js:250–271`). O teste web prova que `toggleStatus()` usa `PATCH` sem emitir `DELETE`. A exclusão direta pela API permanece disponível. A falha já existia em `32e4dec`.

2. **O novo fluxo por ID permite que o indicador de alternância termine enquanto outra atualização continua pendente** — `apps/web/src/app/features/meeting-points/services/meeting-points.service.ts:94–125`  
   Critério violado: `specs/4-pontos-de-encontro/spec.md:67–68,90` vincula a confirmação e a atualização da lista à conclusão da alteração de status. `plan.md:43` atribui o estado reativo da alternância à Tarefa 2.  
   Evidência: com a lista vazia, duas chamadas para IDs diferentes agora podem executar `GET` e `PATCH` em paralelo. O primeiro `finally` limpa `loading.toggle()` mesmo com a segunda atualização pendente. Em `32e4dec`, chamadas para IDs ausentes retornavam antes de iniciar operações HTTP. A correção amplia para o fluxo por ID uma limitação que já existia para pontos carregados. O teste de concorrência existente cobre apenas a sobreposição entre uma listagem e uma alternância.
