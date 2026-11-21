# Parecer de Conformidade — Tarefa 7

**Veredito:** APONTAMENTOS

## Critérios verificados

| Critério (da spec) | Situação | Onde |
| --- | --- | --- |
| CA5 — Navegação da tela inicial para cadastro e login | atendido | `landing.page.ts:48`, `landing.page.ts:56`, `auth.routes.ts:17` |
| CA6 — Avanço com dados válidos e manutenção dos dados pendentes | não atendido: a prova integrada está incompleta | `register.page.spec.ts:49`, `auth.service.ts:118` |
| CA11 — Bloqueio e mensagem para e-mail vazio, inválido ou fora da allowlist | atendido | `register.page.ts:30`, `register.page.ts:54`, `register.page.ts:59` |
| CA12 — Bloqueio por campos ausentes ou e-mail duplicado | atendido | `register.page.ts:58`, `register.page.ts:60`, `auth.service.ts:113` |
| CA16 — Erro de conexão com dados preservados e nova tentativa | atendido para o envio no cadastro | `register.page.ts:79`, `register.page.spec.ts:57` |

## Apontamentos

1. **O teste da página não comprova que os dados permanecem pendentes após o avanço** — `apps/web/src/app/features/auth/pages/register/register.page.spec.ts:49`  
   Critério violado: CA6 exige avançar para a validação “mantendo os dados pendentes para confirmação”; a tarefa também exige essa prova.  
   Evidência: o teste substitui `AuthService` por um mock e verifica somente os argumentos enviados e a URL. O serviço real possui testes separados para `pendingRegistration`, mas não há teste que prove a manutenção desses dados junto à navegação da página.

`npm test` na raiz passou: 7 arquivos e 69 testes.
