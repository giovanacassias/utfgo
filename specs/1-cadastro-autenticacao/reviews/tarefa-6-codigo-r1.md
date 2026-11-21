# Parecer de Código — Tarefa 6

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **Os testes da tela dependem do transporte HTTP do `AuthService`** — `apps/web/src/app/features/auth/pages/login/login.page.spec.ts:79`  
   Regra violada: `docs/architecture.md`, §2.1 e §4, concentram o contrato da API na camada de dados.  
   Prejuízo concreto: integrar a busca de usuário e o envio do OTP em uma única chamada quebraria os testes da tela mesmo que a validação, as mensagens e a navegação continuassem funcionando. Os testes do `AuthService` já cobrem as requisições, o código de seis dígitos e a validade de dez minutos.

2. **O alerta repete os domínios definidos no `AuthService`** — `apps/web/src/app/features/auth/pages/login/login.page.ts:74`  
   Regra violada: a separação da camada de dados em `docs/architecture.md`, §2.1 e §4, e a allowlist configurável prevista no §1 da spec.  
   Prejuízo concreto: ao remover um domínio da allowlist do serviço, a própria tela continuaria indicando esse domínio como aceito.

3. **A largura máxima do login usa um valor fora do tema** — `apps/web/src/app/features/auth/pages/login/login.page.ts:38`  
   Regra violada: `docs/architecture.md`, §4, e `.agents/rules/01-angular-strict-rules.md`, §2, exigem o uso dos tokens visuais do projeto.  
   Prejuízo concreto: o build confirmou que `max-w-prose` gera a largura fixa de `65ch`. O limite do formulário fica fora do tema e exige uma alteração no template para acompanhar ajustes de largura do projeto.

## Sugestões (não bloqueiam)

- Tratar as falhas de navegação separadamente das falhas do `AuthService` em `login.page.ts:166`. Se o carregamento de `/validar-codigo` falhar depois do envio do OTP, a mensagem deve orientar a pessoa a retomar a navegação sem exibir a exceção técnica do roteador.

## Observações fora do escopo deste diff

- Nenhuma.
