# Parecer de Conformidade — Tarefa 1

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA8 — Consulta automática de CEP: dispara `GET` para o ViaCEP e autopreenche logradouro, bairro e localidade/UF | atendido | `apps/web/src/app/features/meeting-points/services/cep.service.ts:36-59` (GET montado em `:43`, mapeamento em `:61-69`); testes `apps/web/src/app/features/meeting-points/services/cep.service.spec.ts:36-83` provam URL `https://viacep.com.br/ws/80230901/json/`, método `GET` e mapeamento completo (`street`/`neighborhood`/`city`/`state`) |
| CA9 — Erro de CEP inválido ou não encontrado: alerta específico e campos abertos para correção | atendido (camada de serviço) | `cep.service.ts:39-41` rejeita formato inválido sem chamada HTTP; `:44-47` rejeita `{ erro: true \| "true" }`; mensagem `CEP_NOT_FOUND_ERROR = "CEP não encontrado. Verifique o número digitado."` em `models/meeting-point.model.ts:37` (literal idêntico ao CA9, `spec.md:83`); testes `cep.service.spec.ts:82-124`. Exibição do alerta e manutenção dos campos abertos pertencem à Tarefa 6 (plan.md:61-64) |
| CA10 — Resiliência a falhas de rede no ViaCEP: notificação clara e preenchimento manual liberado | atendido (camada de serviço) | `cep.service.ts:51-57` converte HTTP 4xx/5xx e falha de rede em `CEP_NETWORK_ERROR = "Serviço de consulta de CEP indisponível. Preencha o endereço manualmente."` (`models/meeting-point.model.ts:38`), distinto do erro de não encontrado; testes `cep.service.spec.ts:126-153` (500, 404 e `ProgressEvent('error')`). Notificação visual e liberação do preenchimento manual pertencem à Tarefa 6 |
| Termos do código alinhados ao glossário (`docs/architecture.md:141`, `:151`) — apontamento da rodada 1 | atendido | `models/meeting-point.model.ts:29-35`: `CepAddress` agora expõe apenas `cep`, `street`, `neighborhood`, `city`, `state`; os campos duplicados em português (`logradouro`, `bairro`, `localidade`, `uf`) foram removidos. `ViaCepResponse` (`:15-27`) mantém as chaves em português por serem o contrato literal da API externa. `MeetingPoint` (`:1-9`) segue exatamente os atributos do glossário |

Execução dos testes: `12 passed (12)` — `cep.service.spec.ts` verde, sem requisições pendentes (`httpTesting.verify()` em `afterEach`, `cep.service.spec.ts:31-33`).

Nota de rastreabilidade: o único apontamento aceito na triagem (`tarefa-1-decisoes-r1.md`, item 1) está resolvido no diff atual, e os três critérios da tarefa continuam atendidos sem regressão. Observação não bloqueante: a mensagem de erro do §1 da spec (`spec.md:29`, "Verifique os dígitos e tente novamente.") diverge do literal do CA9 (`spec.md:83`); o código segue o CA9, critério de aceite vinculante — a inconsistência é da spec, não da implementação.

## Apontamentos

*(nenhum)*
