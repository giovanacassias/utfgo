# Parecer de Conformidade — Tarefa 4

**Veredito:** APROVADO

Testes e lint rodados na raiz: `npm test` com 12 arquivos e 158 testes passando, e `npm run lint` sem erros. Não alterei nenhum arquivo.

## Critérios verificados
| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA1: saldo em fichas e em R$, `1 ficha = R$ 2,00`, "Comprar fichas", lista ordenada ou estado vazio | atendido | A página renderiza em `wallet-overview.page.html:143-149,169-175,201-256`. A ordenação da mais recente para a mais antiga vem do service (`wallet.service.ts:115-130`, tarefa 2). Testes: `wallet-overview.page.spec.ts:143-185`. A ordem só é verificada com o service mockado, então o teste da página prova apenas que ela respeita a ordem recebida. |
| CA2: 4 filtros (Todas, Concluídas, Pendentes, Falhas/Canceladas), sem nova requisição e sem perder o saldo | atendido | Os filtros estão em `wallet-overview.page.ts:37-42` e a página só delega ao service (`:52-54`). O filtro roda em `computed` no service (`wallet.service.ts:132`) e `setStatementFilter` só faz `set` (`:179`). Testes: `spec.ts:187-216` verificam os rótulos, as 4 chamadas a `setStatementFilter`, `loadWalletData` com 1 chamada só e o saldo visível. |
| CA11 (parte do extrato): cancelar pedido `PENDING` | atendido | Botões em `.html:222-241` e `cancelOrder` em `.ts:56`. Testes: `spec.ts:227-252`. A mudança de status e o saldo inalterado ficam no service, coberto na tarefa 3. |
| CA13: conta `SUSPENDED` ou `BANNED` em `/cofrinho` | atendido | Alerta e botões desabilitados em `.html:108-115,160-167` e retomada desabilitada em `:227`. Testes: `spec.ts:266-285`. A parte de `/cofrinho/comprar` pertence às tarefas 5-9. |
| CA14: erro de rede ao carregar a carteira, com retentar e sem sucesso falso | atendido | Mensagem e botão em `.html:117-131`, com `retry()` chamando `loadWalletData` (`.ts:48`). O saldo só aparece com `wallet()` não nulo (`.html:137`). Testes: `spec.ts:287-307`. Criar pedido e confirmar pagamento são de outras tarefas. |
| Assunção 4: `/cofrinho` via `loadChildren` dentro da casca com `authGuard`; `/`, landing e login intactos | atendido | `app.routes.ts:28-32` fica dentro do bloco com `canActivate: [authGuard]` e `AppShellComponent` (`:11-17`). O diff do `app.routes.ts` toca só a rota `cofrinho`. Testes em `app.routes.spec.ts`: `loadChildren` e ausência de `loadComponent` (`:75-81`), página real em vez de `PlaceholderPage` (`:83-89`), renderização na casca com carteira carregada e item de menu ativo (`:91-103`), redirecionamento para `/entrar` sem sessão (`:105-110`) e `/inicio` e `/entrar` intactos (`:112-119`). |
| Assunção 5: "Doar fichas" desabilitado com "Em breve" | atendido | `.html:153-159`. Teste: `spec.ts:153-159`. |

## Verificações adicionais
- **Arquivos fora do escopo:** o working tree tem só `app.routes.ts` modificado e os arquivos novos previstos (`app.routes.spec.ts`, `wallet.routes.ts`, `pages/wallet-overview/*`). Nada em `features/auth`, `AppShellComponent` ou testes da US01 foi alterado. O `auth.guard.spec` e o `app-shell.component.spec` continuam passando sem edição, inclusive o `it.each` de `/cofrinho` (`auth.guard.spec.ts:76`).
- **Página não filtra nem recarrega ao filtrar:** confirmado em `.ts:52-54` e pela asserção `spec.ts:206`.
- **Nota do implementador, destaque do menu em `/cofrinho/*`:** confirmada. Não há teste de subpágina, mas a spec não o exige nesta tarefa e as rotas filhas só nascem nas tarefas 5-9. Não bloqueia.
- **Nota do implementador, `auth.guard.spec` sem `HttpClient`:** o spec passa de fato e não encontrei erro de execução na saída. O `WalletService` injeta `HttpClient` (`wallet.service.ts:50`) e o spec não o provê. Tudo indica que o `HttpClient` é resolvido por padrão no Angular em uso, mas não verifiquei isso no código do framework. Não bloqueia. Vale lembrar que esse spec pode disparar a carga real da carteira.

## Apontamentos
Nenhum bloqueante.

Observações não bloqueantes, só informativas:
- O teste `spec.ts:218-225` ("mensagem específica do filtro") só verifica que o elemento de estado vazio existe. Não distingue o texto "Nenhum pedido corresponde a este filtro" do texto de extrato vazio (`.html:249-253`). Isso não compromete nenhum CA.
- `resumeOrder` navega para `/cofrinho/pagamento`, rota que só existe na tarefa 6. A TODO em `.ts:62` documenta isso e `wallet.routes.ts` também sinaliza.
