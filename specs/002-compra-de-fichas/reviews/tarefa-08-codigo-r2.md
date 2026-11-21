# Parecer de Código — Tarefa 8, rodada 2

**Veredito:** APROVADO

Rodei `npm test` (16 arquivos, 312 testes passando) e `npm run lint` (sem erros). O Angular instalado é o 22.2.4, que tem a API `events`.

## Apontamentos (bloqueiam)
Nenhum.

## Confirmações pedidas
1. **A correção está certa e completa** (`card-payment.page.ts:172-174`).
   - No Angular, o `FormGroup` só emite o evento de "tocado" quando o estado muda de falso para verdadeiro. Foi isso que causou o bug da rodada 1.
   - Agora o `merge` assina o grupo e os 4 controles. Cada controle emite os próprios eventos de touched, valor, status e reset.
   - O grupo continua assinado, então `markAllAsTouched` e `reset()` do grupo também chegam ao signal.
   - O `Object.values(controls)` é montado depois da criação do `form` (linha 125), então a ordem de inicialização está certa.
2. **Sem vazamento e sem loop.**
   - O `toSignal` roda no contexto de injeção (inicializador de campo), então a assinatura é desfeita junto com o componente.
   - As emissões duplicadas (evento do controle mais o do grupo) apenas invalidam os `computed`, que são preguiçosos. A recomputação acontece uma vez por ciclo de detecção.
   - Os `computed` só leem o estado do form e não emitem eventos. Não há ciclo.
3. **Recálculo confirmado.**
   - `errors()` e `canPay` leem `formEvents()` (linhas 177 e 233), então recalculam ao tocar o último campo, ao digitar, no `markAllAsTouched` e no `reset`.
   - `pay()` continua usando `markAllAsTouched`, `updateValueAndValidity` e `reset` no caminho de sucesso (linhas 264, 265 e 312).
4. **Sem regressão em RNF06.**
   - Nenhum dado de cartão vai para o `WalletService`: as chamadas só recebem `id`, `draft` e `'CREDIT_CARD'`.
   - O diff dos arquivos rastreados é só a rota `cartao` e o comentário `// TODO #2`, ambos autorizados.
   - Os 312 testes passam, então nenhum outro comportamento quebrou.
5. **Os 2 testes novos provam o comportamento** (`card-payment.page.spec.ts:454-487`).
   - O primeiro dá blur nos 4 campos vazios em sequência, com um único `render()` e sem fixture novo entre os blurs. Confere cada mensagem logo após o blur e, no fim, as 4 juntas.
   - O segundo mostra que os campos intocados ficam sem erro enquanto holder e number foram tocados.
   - Não consegui reverter a correção para ver o teste falhar, porque a revisão é somente leitura. Pelo mecanismo, o primeiro teste falharia a partir do segundo blur sem o fix.

## Sugestões (não bloqueiam)
- Nenhuma nova. As sugestões da rodada 1 seguem como candidatas a manutenção, sem serem reabertas.

## Observações fora do escopo deste diff
- Pedido órfão em `WalletService.createOrderAndPayment` quando o POST do Order dá certo e o do Payment falha (já registrado na rodada 1).

**Veredito final: APROVADO.** Bloqueantes: nenhum.
