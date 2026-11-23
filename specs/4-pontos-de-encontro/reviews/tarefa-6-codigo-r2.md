# Parecer de Código — Tarefa 6, rodada 2

**Veredito:** APROVADO

`npm test` passou com 395 testes em 25 arquivos.

## Apontamentos (bloqueiam)

Nenhum. Os dois apontamentos aceitos na primeira rodada foram resolvidos.

- **Troca de CEP.** A página limpa os campos autopreenchidos ao trocar de CEP e preserva os campos editados manualmente. O teste de regressão simula falha na segunda consulta e confirma que o botão permanece desabilitado até o preenchimento dos campos limpos. [Componente](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/meeting-points/pages/point-create/point-create.page.ts:167) · [Teste](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/meeting-points/pages/point-create/point-create.page.spec.ts:152)
- **Confirmação após o cadastro.** A página envia a confirmação nos metadados da navegação após o retorno bem-sucedido do serviço. A listagem exibe a mensagem com `role="status"`. O teste confirma a exibição após o cadastro e a ausência da mensagem em uma navegação posterior à lista. [Cadastro](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/meeting-points/pages/point-create/point-create.page.ts:251) · [Listagem](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/meeting-points/pages/points-list/points-list.page.ts:23) · [Teste](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/meeting-points/pages/point-create/point-create.page.spec.ts:190)

A implementação segue as seções 2.1 e 4 da arquitetura. A rota usa carregamento sob demanda, os componentes delegam as requisições aos serviços da feature e a confirmação fica na camada de apresentação. [Arquitetura](/home/dudupadilha/projects/utfgo/docs/architecture.md:29) · [Rota](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/meeting-points/meeting-points.routes.ts:10)

## Sugestões (não bloqueiam)

- Em uma revisão futura de `CreateMeetingPointPayload`, retire `isActive` da entrada de criação para que o valor inicial tenha uma única fonte no serviço. O tipo atual exige que a página informe o campo. [Cadastro](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/meeting-points/pages/point-create/point-create.page.ts:243) · [Serviço](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/meeting-points/services/meeting-points.service.ts:74)

## Observações fora do escopo deste diff

- A spec contém duas redações para o alerta de CEP inválido. O componente segue a redação do CA9. [Decisão da entrevista](/home/dudupadilha/projects/utfgo/specs/4-pontos-de-encontro/spec.md:29) · [CA9](/home/dudupadilha/projects/utfgo/specs/4-pontos-de-encontro/spec.md:83)
