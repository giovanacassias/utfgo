# Parecer de Código — Tarefa 2

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **O `POST /meeting-points` ainda pode persistir registros fora do contrato `MeetingPoint`.** O handler aceita o corpo sem validar os campos obrigatórios. A correção garante `isActive` e `createdAt`, mas um `POST` com `{}` no seed atual ainda recebe `201` e grava um ponto sem `name`, `address` ou coordenadas.  
   **Regra violada.** `docs/architecture.md` §2.2 (ID7, validação de escritas) e §5.1 (contrato de `MeetingPoint`).  
   **Prejuízo concreto.** Depois de carregar esse registro, `createPoint()` pode rejeitar até um cadastro válido. A checagem de duplicidade chama `.trim()` no campo ausente antes do bloco `try`, sem preencher o sinal de erro. O problema já existia em `32e4dec` e permanece na correção. [server.cjs](/home/dudupadilha/projects/utfgo/apps/api/server.cjs:10), [meeting-points.service.ts](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/meeting-points/services/meeting-points.service.ts:66)

## Verificação dos seis itens aceitos

| Item | Resultado |
| --- | --- |
| 1. Contrato da resposta do `POST` | Parcial. O mock define `isActive: true` e gera `createdAt`. A validação dos demais campos obrigatórios segue pendente. |
| 2. Teste dos providers | Corrigido. O teste resolve `API_URL` e `WALLET_API_URL` pelo `TestBed` e verifica o valor injetado. |
| 3. Mensagens de erro | Corrigido. O serviço aproveita mensagens do servidor em `409` e `422`, mantém a mensagem de rede e usa a mensagem da operação para `500`. |
| 4. Envelope do `409` | Corrigido no código. O mock devolve `statusCode`, `message`, `error` e `timestamp`. |
| 5. Chave de ambiente | Corrigido. Os ambientes usam `apiUrl` e o token da carteira continua resolvendo `/api`. |
| 6. Alternância por acesso direto | Corrigido no serviço. Quando o ponto está ausente da lista, `toggleStatus()` consulta o ID antes do `PATCH`, atualiza o estado reativo após sucesso e trata `404` sem enviar `PATCH`. |

Comparei as correções com `32e4dec` e a tarefa completa com `d67f990`. Não identifiquei regressão nos fluxos válidos de cadastro (CA11), bloqueio de duplicidade (CA12) e alternância via `PATCH` (CA14) no escopo do serviço e do seed. A tela de detalhes da Tarefa 7 ficou fora da avaliação.

## Sugestões (não bloqueiam)

- Completar os corpos do teste de duplicidade concorrente com coordenadas válidas, para que o teste verifique a unicidade entre dois cadastros válidos. [server.test.cjs](/home/dudupadilha/projects/utfgo/apps/api/server.test.cjs:72)

## Observações fora do escopo deste diff

- Nenhuma.

## Testes e estado do repositório

- Web, `MeetingPointsService` — 15 testes passaram.
- Web, configuração da carteira — 13 testes passaram.
- API — o ambiente bloqueou a abertura do socket local com `listen EPERM` em `127.0.0.1`. A verificação de integração fica a cargo do orquestrador.
- `git status --short` mostrou nove arquivos modificados e nenhum arquivo não rastreado. A revisão não editou arquivos do repositório nem criou commits.
