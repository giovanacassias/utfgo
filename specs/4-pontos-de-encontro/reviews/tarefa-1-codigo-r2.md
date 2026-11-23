# Parecer de Código — Tarefa 1

**Veredito:** APROVADO

Testes executados: 12/12 verdes (`cep.service.spec.ts`, incluindo os 3 casos de `CA10` e os 2 formatos de `erro` do ViaCEP); `npm run lint` sem erros. Diff conferido contra `c21ff67` — apenas os três arquivos previstos no plano estão staged.

**Apontamento aceito na rodada 1:** resolvido. `CepAddress` agora expõe somente os campos em inglês (`cep`, `street`, `neighborhood`, `city`, `state`) em `meeting-point.model.ts:29-35`, com o mapeamento do payload externo concentrado em `cep.service.ts:61-69` (`logradouro→street`, `bairro→neighborhood`, `localidade→city`, `uf→state`). `ViaCepResponse` (`meeting-point.model.ts:15-27`) manteve os nomes em português, como o parecer da rodada 1 indicou, por espelhar o contrato do ViaCEP. O teste de contrato foi atualizado para a forma única (`cep.service.spec.ts:53-59`) e não há mais nenhuma referência aos campos removidos no `src` (busca por `logradouro|localidade|CepAddress` só encontra `ViaCepResponse` e o mapeamento).

## Apontamentos (bloqueiam)

Nenhum. O diff não introduziu violação de camada, formato de resposta, segredo, tratamento de erro que engula falha, abstração de uso único, duplicação de regra existente ou teste acoplado a detalhe de implementação. O teste usa `HttpTestingController` e assere contrato público (`CepAddress`, URL/método, mensagens), não estrutura interna do serviço.

## Sugestões (não bloqueiam)

- Nenhuma nova. As sugestões da rodada 1 (URL base fixa, `catchError` achatando causas, ausência de timeout, corpo 200 vazio, formato híbrido de `cep`, payload exigindo `isActive`/coordenadas, textos de UI no modelo) não foram promovidas na triagem e permanecem como estão — não reavaliadas nesta rodada, por escopo.

## Observações fora do escopo deste diff

- **Spec com duas redações para a mesma mensagem de erro** — `specs/4-pontos-de-encontro/spec.md:29` versus `spec.md:83` (CA9). Já registrada na rodada 1; a constante implementada segue o CA9. Candidata a Issue de manutenção para não gerar retrabalho na Tarefa 6.
- **Mensagens de falha de rede repetidas por feature** — `auth.service.ts:21`, `wallet.service.ts:622` e `cep.service.ts:56`. Padrão pré-existente e transversal; candidato a utilitário compartilhado de erros/notificações.
