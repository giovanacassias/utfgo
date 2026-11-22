# Parecer de Conformidade — Tarefa 1

**Veredito:** APROVADO

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA8 — Consulta automática de CEP: dispara `GET` ao ViaCEP e mapeia logradouro, bairro e localidade/UF | atendido | `apps/web/src/app/features/meeting-points/services/cep.service.ts:36-59` (GET em `:43`, mapeamento em `:61-79`); testes `services/cep.service.spec.ts:36-83` provam URL `https://viacep.com.br/ws/80230901/json/`, método `GET` e mapeamento completo |
| CA9 — Erro de CEP inválido ou não encontrado: alerta específico e campos abertos | atendido (camada de serviço) | `services/cep.service.ts:39-47` rejeita formato inválido e `{ erro: true \| "true" }` com `CEP_NOT_FOUND_ERROR` = "CEP não encontrado. Verifique o número digitado." (`models/meeting-point.model.ts:41`); testes `cep.service.spec.ts:87-127`; exibição do alerta no formulário pertence à Tarefa 6 |
| CA10 — Resiliência a falhas de rede no ViaCEP | atendido (camada de serviço) | `services/cep.service.ts:51-57` converte HTTP 4xx/5xx e falha de rede em `CEP_NETWORK_ERROR` = "Serviço de consulta de CEP indisponível. Preencha o endereço manualmente." (`models/meeting-point.model.ts:42`); testes `cep.service.spec.ts:131-156`; notificação visual e liberação do preenchimento manual pertencem à Tarefa 6 |

Execução dos testes: `12 passed (12)` — `cep.service.spec.ts` verde, sem requisições pendentes (`httpTesting.verify()` em `afterEach`).

## Apontamentos

*(nenhum)*
