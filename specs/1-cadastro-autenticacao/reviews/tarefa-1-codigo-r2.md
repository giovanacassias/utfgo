# Parecer de Código — Tarefa 1

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **`pendingRegistration` é atualizado antes da verificação de duplicidade** — `apps/web/src/app/core/auth/auth.service.ts:64`

   Regra violada: o serviço deve concentrar e preservar o estado coerente do fluxo de autenticação; a camada de dados deve expor estado confiável aos componentes.

   Prejuízo concreto: uma tentativa de cadastro com e-mail duplicado pode sobrescrever os dados de um cadastro pendente válido. Se o OTP anterior ainda for confirmado posteriormente, a Tarefa 2 poderá associar o código antigo aos dados incorretos.

## Sugestões (não bloqueiam)

- Tornar a allowlist uma configuração explícita, em vez de mantê-la embutida na expressão regular.
- Adicionar testes para erro de rede na consulta de usuário, reenvio sem desafio e preservação do estado após cadastro duplicado.

## Observações fora do escopo deste diff

- `git diff 58342e1..HEAD` está vazio porque os arquivos da implementação ainda estão não rastreados; a análise foi complementada com `git status --short` e a leitura direta dos três arquivos solicitados.
- Testes executados: **2 arquivos, 12 testes aprovados**.
