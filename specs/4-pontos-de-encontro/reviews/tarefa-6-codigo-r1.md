# Parecer de Código — Tarefa 6

**Veredito:** APONTAMENTOS

`npm test` passou com 394 testes em 25 arquivos.

## Apontamentos (bloqueiam)

1. **A troca de CEP pode deixar o formulário pronto para salvar o endereço do CEP anterior.** Após o autopreenchimento pelo CEP A, trocar para o CEP B e receber uma falha de rede libera o botão com o logradouro, bairro e cidade/UF ainda preenchidos pelo CEP A. O formulário pode gravar um ponto no endereço errado sem que o usuário edite esses campos. A seção 2.1 da arquitetura orienta o uso de estado reativo na interface. Aqui, o estado da consulta é atualizado na troca de CEP, mas os valores derivados da consulta anterior continuam válidos para a submissão. Vincule os valores autopreenchidos ao CEP consultado e invalide-os na troca, preservando as edições manuais. [Componente](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/meeting-points/pages/point-create/point-create.page.ts:166) · [Arquitetura](/home/dudupadilha/projects/utfgo/docs/architecture.md:29)

## Sugestões (não bloqueiam)

- Acrescente um teste que preencha o endereço com o primeiro CEP, informe um segundo CEP e simule falha de rede. O teste atual começa com o endereço vazio e só verifica o preenchimento manual nesse cenário. [Teste](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/meeting-points/pages/point-create/point-create.page.spec.ts:116)
- A página repete `isActive: true`, valor que o serviço já garante. Em uma revisão futura do tipo `CreateMeetingPointPayload`, retire esse campo da entrada do serviço para manter o valor inicial em um único lugar. [Componente](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/meeting-points/pages/point-create/point-create.page.ts:224) · [Serviço](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/meeting-points/services/meeting-points.service.ts:74)

## Observações fora do escopo deste diff

- A spec traz duas redações para o alerta de CEP inválido. O componente usa a redação do CA9. [Decisão da entrevista](/home/dudupadilha/projects/utfgo/specs/4-pontos-de-encontro/spec.md:29) · [CA9](/home/dudupadilha/projects/utfgo/specs/4-pontos-de-encontro/spec.md:83)
