# Parecer de Código — Tarefa 1

**Veredito:** APONTAMENTOS

Testes executados: 12/12 verdes (`cep.service.spec.ts`); `npm run lint` sem erros.

## Apontamentos (bloqueiam)

1. **`CepAddress` expõe cada valor duas vezes (inglês e português) e usa atributos em português no modelo de domínio** — `apps/web/src/app/features/meeting-points/models/meeting-point.model.ts:29-39` (preenchido em `apps/web/src/app/features/meeting-points/services/cep.service.ts:68-78`)
   Regra violada: `docs/architecture.md` §5.1 — "Código, atributos e entidades em inglês; interface e termos negociais em português."
   Prejuízo concreto: o mesmo dado tem duas fontes de verdade no mesmo objeto (`street`/`logradouro`, `neighborhood`/`bairro`, `city`/`localidade`, `state`/`uf`). A Tarefa 6 vai escolher um dos pares para o formulário; qualquer ajuste futuro no mapeamento (ex.: fallback quando `logradouro` vier vazio) pode atualizar só um lado, e os campos passam a divergir sem erro de compilação. O `toEqual` em `cep.service.spec.ts:51-62` já cristaliza essa forma duplicada. `ViaCepResponse` pode manter os nomes em português porque espelha o payload externo; `CepAddress` deve ter apenas os campos em inglês.

## Sugestões (não bloqueiam)

- **URL base do ViaCEP fixa no serviço e repetida em 9 asserções do teste** — `cep.service.ts:11` e `cep.service.spec.ts:48,77,91,98,108,114,123,134,143,152`. O repo já tem precedente de URL externa via token + `environment` (`app.config.ts:12-15`, consumido em `wallet.service.ts:52`). Extrair para `environment`/`InjectionToken` permite apontar o teste para um host falso e evita editar 10 lugares se o endpoint mudar.
- **`catchError` descarta a causa original de qualquer falha** — `cep.service.ts:51-57`. Offline, HTTP 500, payload ilegível e até um bug futuro em `mapToCepAddress` viram a mesma mensagem, sem `cause` nem distinção. `wallet.service.ts:620-626` já diferencia `HttpErrorResponse.status === 0`; seguir o mesmo critério (ou anexar `{ cause: error }`) preserva a diagnosticabilidade. A discriminação do "não encontrado" por comparação de `error.message` (`cep.service.ts:52`) também é frágil: um `Error` de outra origem com o mesmo texto seria reclassificado.
- **Sem timeout na chamada externa** — `cep.service.ts:43`. Conexão pendurada (comum em rede móvel) não emite erro, e o formulário fica em carregamento indefinido, sem oferecer o preenchimento manual exigido pelo CA10. Um `timeout(...)` no pipe fecha esse caso.
- **HTTP 200 com corpo vazio/parcial é tratado como sucesso** — `cep.service.ts:44-49,61-66`. Um `{}` ou resposta de proxy sem `localidade`/`uf` resolve com endereço vazio e sem alerta, contrariando o CA9 na prática. Vale rejeitar quando não houver ao menos `localidade`/`uf`.
- **`CepAddress.cep` alterna entre formatado e só dígitos** — `cep.service.ts:62`. Com `response.cep` presente vem `"80230-901"`; sem ele, vem `"80230901"`. Normalizar (sempre limpo ou sempre formatado) evita que a Tarefa 6 tenha que lidar com dois formatos.
- **`CreateMeetingPointPayload` exige `isActive`, `latitude` e `longitude`** — `meeting-point.model.ts:11`. O CA11 define `isActive: true` no serviço, e o formulário do spec não coleta coordenadas; do jeito atual, a página de cadastro terá que fabricar `isActive` e coordenadas (ex.: `0,0`) para satisfazer o tipo. Considere omitir `isActive` do payload e definir explicitamente a origem das coordenadas antes da Tarefa 6.
- **Textos de UI no arquivo de modelos de domínio** — `meeting-point.model.ts:41-42`. As constantes são consumidas pela tela; mantê-las no modelo faz o domínio carregar cópia de interface. Mover para o serviço ou um módulo de mensagens da feature mantém o modelo só com tipos.

## Observações fora do escopo deste diff

- **Spec com duas redações para a mesma mensagem de erro:** `specs/4-pontos-de-encontro/spec.md:29` ("Verifique os dígitos e tente novamente.") e `spec.md:83`/CA9 ("Verifique o número digitado."). A constante implementada segue o CA9; a divergência é do documento e merece correção para não gerar retrabalho na Tarefa 6.
- **Mensagens de falha de rede repetidas por feature:** `auth.service.ts:21`, `wallet.service.ts:622` e agora `cep.service.ts:56` definem textos próprios. Padrão pré-existente; candidato a utilitário compartilhado de erros/notificações.
