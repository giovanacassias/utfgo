# Parecer de Código — Tarefa 2

**Veredito:** APONTAMENTOS

## Apontamentos (bloqueiam)

1. **`session` é mutável externamente.**

   Expor diretamente o Signal permitia que consumidores chamassem `service.session.set(...)`, alterando a autenticação sem persistir ou limpar o `localStorage`. O serviço deveria expor apenas uma leitura.

2. **Sessão restaurada sem validação em runtime.**

   `JSON.parse(...) as AuthSession` aceitava qualquer JSON válido, como `{}`, como sessão autenticada. Uma sessão inválida poderia ser tratada como autenticada por futuros guards e componentes.

## Sugestões (não bloqueiam)

- Alinhar posteriormente a documentação que menciona `/auth/otp/verify`, pois a validação é local.
- Validar explicitamente `^\\d{6}$`, não apenas o tamanho do código.
- Ajustar a mensagem de erro de rede para também contemplar confirmação/criação.

## Verificações

- `npm test`: 21 testes passaram.
- `npm run lint`: passou.
- Build de desenvolvimento: passou.
