# Parecer de Conformidade — Tarefa 4 (Rodada 1 do novo ciclo, pós-Figma)

**Veredito:** APROVADO

Testes: `npm test` com 12 arquivos e 166 testes passando. `npm run lint` sem erros.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1: saldo em fichas e em R$, `1 ficha = R$ 2,00`, "Comprar fichas", lista da mais recente para a mais antiga, estado vazio | atendido. A ordenação vem do `WalletService` (tarefa anterior) e a página só renderiza `filteredTransactions()`. | `wallet-overview.page.html` (saldo, `data-wallet-balance-brl`, `data-rate-card`, `data-statement-empty`); `wallet-overview.page.spec.ts:143-226` |
| CA2: filtros Todas, Concluídas, Pendentes, Falhas/Canceladas, sem nova requisição e sem perder o saldo | atendido. O teste afirma `loadWalletData` chamado 1 vez e saldo visível com filtro ativo. | `wallet-overview.page.ts` (`filters`, `selectFilter`); spec `:228-257` |
| CA11: cancelar pedido `PENDING` pelo extrato | atendido na UI. Só `PENDING` mostra o botão e ele delega a `cancelOrder`. A regra do Service foi coberta na tarefa 3. | html (botão "Cancelar pedido"); spec `:268-293` |
| CA13: conta `SUSPENDED` ou `BANNED` | atendido. Mostra `role="alert"` com a mensagem, "Comprar fichas" vira botão desabilitado (sem link para `/cofrinho/comprar`) e "Retomar" fica desabilitado. | html; spec `:307-326` |
| CA14: erro de rede com retentar, sem sucesso falso | atendido. `role="alert"` com "Tentar novamente", que recarrega a carteira. Com `wallet` nulo, o saldo não é exibido. | html; spec `:328-348` |
| Assunção 4: `loadChildren` dentro da casca com `authGuard`; `/`, landing e login intactos | atendido. | `app.routes.ts:30-31`; `wallet.routes.ts`; `app.routes.spec.ts` (`loadChildren` sem `loadComponent`, renderiza dentro de `app-shell`, destaque ativo `bg-tertiary`, redireciona para `/entrar` sem sessão, `/inicio` e `/entrar` preservados) |
| Assunção 5: "Doar fichas" desabilitado com "Em breve"; ações de outras histórias não executam | atendido. As movimentações de Estornos e Doações do Figma foram omitidas e os filtros seguem os critérios. | html; spec `:174-181` |
| Assunção 6: Figma orienta, mas valem os critérios e os tokens | atendido. Ver fidelidade abaixo. | html |

## Fidelidade visual ao Figma
Comparei os dois Figmas com as capturas renderizadas. O resultado é razoável nas duas larguras.
- **Mobile:** título "Cofrinho UTFgo" com "UTF" em primary, ilustração à direita, bloco de saldo à esquerda, botões empilhados à direita, "Extrato do Cofrinho", chips com rolagem horizontal e cartão de item com ícone "$".
- **Desktop:** cartão de saldo ocupando 2 de 3 colunas, cartão "Valor por viagem", extrato em cartão com linhas separadas e ponto amarelo, e eyebrow "Carteira UTFgo".

Divergências, todas aceitáveis:
1. Os filtros são os da spec (Todas, Concluídas, Pendentes, Falhas/Canceladas), e não os do Figma (Compras, Estornos, Doações). Isso é o que a Assunção 6 manda.
2. O botão "Comprar fichas" é preto no Figma mobile e laranja no desktop. A implementação usa `bg-secondary` no mobile e `bg-primary` no desktop, via tokens.
3. Falta o ícone de cartão antes de "SALDO DE FICHAS" no mobile e os ícones de "Doar fichas" e "Comprar fichas". São detalhes menores.
4. O item de extrato mostra a data absoluta `dd/MM/yyyy HH:mm` e o status, em vez de "Hoje, 08:24". Mantém a informação de status exigida pelos filtros.
5. No desktop o Figma mostra "+08 fichas" em uma linha só. A implementação mostra fichas e R$ em duas linhas. É irrelevante para os critérios.

## Mudanças fora do previsto
- (a) `environment.development.ts` passou de `http://localhost:3000` para `/api`, com a asserção ajustada em `wallet.model.spec.ts`. A mudança é coerente com `proxy.conf.json`, que reescreve `/api` para `:3000`. O `json-server` não envia CORS e a US01 já usa o proxy. É necessária para o carregamento real, não altera critério e a justificativa procede. Aceitável.
- (b) `public/cofrinho.png` é a ilustração decorativa do Figma e é usada com `alt=""` e `aria-hidden`. Aceitável.
- Os demais arquivos alterados são `plan.md` e `spec.md` (Assunção 6 e registro de alterações). Não encontrei no diff alteração da linha `status:` do spec.
- Não há alteração em `features/auth/` nem escopo inflado.

## Apontamentos
Nenhum bloqueante. Observações não bloqueantes:
- `wallet-overview.page.ts` (`resumeOrder`) navega para `/cofrinho/pagamento`, rota que só existe na tarefa 6. Até lá o clique leva a uma rota inexistente. Está sinalizado com `// TODO #2` e coberto pelo spec com `Router.navigate` mockado, então é uma limitação esperada do fatiamento.
- O spec da página mocka o `WalletService` inteiro. O vínculo real entre página e Service só é exercitado em `app.routes.spec.ts`, que carrega com HTTP mockado e confirma que o saldo "8 fichas" aparece. Isso é suficiente para a tarefa.
