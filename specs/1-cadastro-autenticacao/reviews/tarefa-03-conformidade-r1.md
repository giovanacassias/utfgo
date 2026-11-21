# Parecer de Conformidade — Tarefa 3, rodada 1

**Veredito:** APROVADO

## Escopo verificado

Foi considerada a spec aprovada, a Tarefa 3 de `plan.md`, o diff atual contra `HEAD` e os arquivos não versionados relacionados à tarefa. A análise ficou restrita à conformidade estrutural de CA1/CA4 e ao controle de escopo solicitado; não avalia o layout visual da casca, que pertence às Tarefas 4 e 5.

## Verificações

- **Guard sem sessão:** `authGuard` injeta `AuthService` e `Router`; quando `authService.session()` é nula, retorna `router.parseUrl('/entrar')`, que é um `UrlTree` (`apps/web/src/app/core/auth/auth.guard.ts:6-10`).
- **Sessão permite `/inicio`:** com sessão presente, o guard retorna `true` (`auth.guard.ts:10`). O teste configura uma `AuthSession`, navega para `/inicio` e confirma `router.url === '/inicio'` (`apps/web/src/app/core/auth/auth.guard.spec.ts:37-52`).
- **`/inicio` sob casca protegida:** a rota pai sem path usa `AppShellComponent`, aplica `canActivate: [authGuard]` e declara `inicio` em `children` (`apps/web/src/app/app.routes.ts:25-30`). O teste confirma o conteúdo filho dentro de `app-shell` (`auth.guard.spec.ts:53-55`).
- **Rotas públicas fora da proteção:** `/`, `/entrar`, `/criar-conta` e `/validar-codigo` são declaradas antes da rota pai protegida e não recebem `canActivate` (`app.routes.ts:20-24`).
- **Redirecionamento efetivo e ausência de acesso sem sessão:** o teste navega sem sessão para `/inicio` e confirma a URL final `/entrar` (`auth.guard.spec.ts:31-35`).
- **Cobertura dos comportamentos pedidos:** `auth.guard.spec.ts` contém os dois cenários previstos pela Tarefa 3: visitante redirecionado e sessão autorizada dentro da casca. A execução direcionada passou: **1 arquivo, 2 testes, 2 aprovados**.
- **Controle de escopo:** o diff da tarefa contém apenas `auth.guard.ts`, `auth.guard.spec.ts` e a alteração estrutural de `app.routes.ts`. Não foram adicionadas rotas de caronas, cofrinho, pontos, histórico ou perfil, nem implementadas funcionalidades das Tarefas 4–8. O `AppShellComponent` presente é somente o contêiner mínimo com `<router-outlet />` necessário à estrutura da Tarefa 3; a casca visual permanece para a Tarefa 4.

## Comando executado

```text
npm --workspace=apps/web run test -- --watch=false --include src/app/core/auth/auth.guard.spec.ts
Resultado: 1 arquivo aprovado; 2 testes aprovados.
```

## Apontamentos

Nenhum apontamento bloqueador ou não bloqueador para o escopo desta revisão.
