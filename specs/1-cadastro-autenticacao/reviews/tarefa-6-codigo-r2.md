# Parecer de Código — Tarefa 6

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **O teste de largura depende da classe CSS e do pai imediato do formulário** — `apps/web/src/app/features/auth/pages/login/login.page.spec.ts:46`  
   Regra violada: `docs/architecture.md`, §4, exige o uso de tokens do tema. O papel `revisor-codigo.md` reprova testes acoplados a detalhes de implementação.  
   Prejuízo concreto: inserir um contêiner neutro entre o formulário e o elemento que define a largura faz o teste falhar mesmo com a mesma largura renderizada e o mesmo token. A asserção também passa se a classe estiver no HTML e o CSS correspondente deixar de ser gerado.

   Os três ajustes aceitos na rodada 1 foram verificados. Os testes de login substituem o `AuthService` por um dublê e exercitam sua interface pública. A validação institucional usa `AuthService.isInstitutionalEmail` e o alerta deixou de enumerar domínios. O login usa `--breakpoint-sm`, definido no tema. `npm test` passou com 64 testes e `npm run lint` passou.

## Sugestões (não bloqueiam)

- Tratar falhas de navegação separadamente das falhas no envio do OTP, conforme sugerido na rodada 1.

## Observações fora do escopo deste diff

- Nenhuma.
