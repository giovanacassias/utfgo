# Parecer de Conformidade — Tarefa 5

**Veredito:** APROVADO

Rodei `npm test` (13 arquivos, 195 testes passando) e `npm run lint` (limpo). Segundo `git status --short`, só `wallet.routes.ts` foi modificado, além do `.claude/launch.json`, que é para ignorar, e da pasta nova `pages/buy-tokens/`.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA3: 4 pacotes (1, 5, 10, 20), destaque `tertiary`, resumo com quantidade e total, botão habilitado | atendido | `buy-tokens.page.ts:128-135` (`selectPackage`) e `:171-175` (`packageClasses`, `bg-tertiary`); `buy-tokens.page.html:50-76`; teste `spec:143-185` |
| CA4: personalizada de 1 a 100 recalcula o total (8 → R$ 16,00), limpa o pacote e permite avançar | atendido | `ts:138-141` (`onCustomInput`) e `:86-92`; testes `spec:187-213` (inclui limites 1 e 100) e `spec:307-315` |
| CA5: vazio, 0, negativo, decimal, texto e > 100 mostram mensagem junto ao campo e bloqueiam o botão | atendido | `ts:24-50` (`quantityError`), `:100-106` (`errorMessage`), `:112-114` (`canAdvance`); `html:110-123` (`role="alert"`); testes `spec:228-267` |
| Tabela: textos exatos (vazio, 0 e -3, 1.5, abc, 101) | atendido | `ts:24-30`. Os cinco textos coincidem caractere a caractere com a spec, e `MIN`/`MAX` vêm das constantes (1 e 100). O teste `it.each` usa os mesmos literais montados a partir das constantes; só "inteiro" e "apenas números" são literais fixos |
| Tabela: conta suspensa e banida | atendido | A mensagem vem de `WalletService.accountBlockMessage` (`wallet.service.ts:82-90`), com texto idêntico à spec, e é exibida em `html:23-31` (`role="alert"`). O teste da página usa o texto vindo do mock; o texto real do service foi entregue na tarefa 3 |
| Regras: `type="text"`, `inputmode="numeric"`, Reactive Forms | atendido | `html:100-101`, `ts:79-83` |
| Regras: dica neutra ao abrir, erro só depois de digitar ou sair do campo | atendido | `ts:100-108` e `html:116-121`; testes `spec:156-166` e `:248-257` |
| Regras: a função de avançar recusa entrada inválida, conta bloqueada ou loading, mesmo com o `disabled` burlado | atendido | `ts:150-158` (`advance` checa `canAdvance()` e `tokensCount`); testes `spec:269-286`, `:317-334` (submit forçado), `:336-349` e `:351-363` |
| CA13 na tela de comprar: bloqueia e mostra mensagem; pacotes, campo e botão desabilitados | atendido | `ts:118-126` (effect que desabilita o campo), `:129-131` (`selectPackage` retorna se bloqueado), `html:56`; teste `spec:317-334` |
| Ponto (c): `loadWalletData()` ao iniciar | atendido | `ts:128-130`; teste `spec:136-141` (chamado 1 vez) |
| Ponto (d): pacote e campo se excluem | atendido | `ts:133-136` e `:138-141`; testes `spec:187-201` e `:215-226` |
| Ponto (e): sem etiqueta "SELECIONADO", sem botões − e +, sem pré-seleção do rascunho | atendido | Nada disso aparece no html. `selectedPackage` começa em `null` e o rascunho não é lido. O teste `spec:184` verifica a ausência de "SELECIONADO", e `spec:163-165` verifica que nada vem pré-selecionado |
| Ponto (f): `wallet.routes.ts` ganhou só `comprar` e a rota do Cofrinho continua igual | atendido | `wallet.routes.ts` (diff: +1 rota `comprar` com `loadComponent`, mais o comentário atualizado para as tarefas 6-9). Não há rota `pagamento` |
| Ponto (g): nada fora do escopo alterado | atendido | O diff contra o commit `924393be` mostra só `wallet.routes.ts` como arquivo rastreado modificado. Casca, auth, `WalletService` e wallet-overview estão intactos |
| Assunção 6 (Figma: onde divergir, valem os critérios e os tokens) | atendido | A tela usa só classes de token (`bg-tertiary`, `text-danger`, `bg-danger-surface`, etc.), sem hexadecimal e sem `style=`. Divergências do Figma (sem etiqueta amarela, sem − e +) são exatamente as decididas na spec. Não abri as capturas de imagem, então a fidelidade visual não foi conferida por mim; confio na verificação do orquestrador no navegador |
| Assunção 3: marcação `// TODO #2` | atendido | `ts:156` marca o navigate para `/cofrinho/pagamento`, que ainda não existe (tarefa 6) |

## Sobre os testes e o RED
- Os testes provam cada linha da tabela. Zero, -3, 1.5, 1,5, abc, 12abc e 101 são cobertos por `it.each` e checam texto, classe `text-danger`, botão desabilitado e total sem valor. Vazio é coberto por `spec:248-267`. Suspensa e banida estão em `spec:317` e `:336`.
- O teste do total (`not.toContain('R$ 2')`) é uma asserção levemente frouxa, mas ela não deixa passar nenhum caso inválido relevante.
- O RED não é verificável por mim. O diff não traz nenhum registro de execução, e declarar RED por "módulo ausente" é um RED fraco, só de import. Os testes são comportamentais e, na prática, falhariam sem a implementação. Não bloqueia.

## Apontamentos
Nenhum bloqueante.

Observação não bloqueante: a dica neutra reutiliza o mesmo texto de "obrigatório" (`ts:96`). Isso é compatível com a spec, que pede apenas uma "dica neutra" sem estilo de erro.
