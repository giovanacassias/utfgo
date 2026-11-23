# Parecer de Código — Tarefa 2

**Veredito: APONTAMENTOS**

## Apontamento bloqueante

1. **A guarda de escrita aninhada ainda pode divergir do roteamento do `json-server`.** A guarda identifica a coleção separando o parâmetro `nested` apenas por `/`. O `json-server` reescreve a URL com esse parâmetro já decodificado, e o Express interpreta separadores de URL ao resolver o caminho reescrito. Assim, a guarda pode classificar a coleção de forma diferente do roteador e deixar um `POST` alcançar a criação genérica sem a validação dos campos obrigatórios nem a checagem de unicidade. Isso mantém aberta a pendência de escrita aninhada e compromete CA11 e CA12. O teste novo cobre o caminho aninhado convencional. [Guarda](/home/dudupadilha/projects/utfgo/apps/api/server.cjs:66) · [Reescrita](/home/dudupadilha/projects/utfgo/node_modules/json-server/lib/server/router/nested.js:15) · [Teste](/home/dudupadilha/projects/utfgo/apps/api/server.test.cjs:100)

## Demais verificações

- **Exclusão por sobrescrita de método — resolvida por inspeção.** A versão instalada de `method-override` só examina requisições originalmente `POST`. O `POST` na coleção termina no handler próprio e o `POST` na rota de item recebe `405` antes do roteador delegado. O `DELETE` direto também recebe `405`. O teste novo verifica que o registro continua acessível após a tentativa de sobrescrita. [Guardas](/home/dudupadilha/projects/utfgo/apps/api/server.cjs:13) · [Sobrescrita de método](/home/dudupadilha/projects/utfgo/node_modules/method-override/index.js:46) · [Teste](/home/dudupadilha/projects/utfgo/apps/api/server.test.cjs:95)
- **Rotas admitidas — sem regressão identificada por inspeção.** O `POST` direto valida os campos, devolve `409` para duplicidade normalizada e cria o registro com `isActive: true`. O `GET` de coleção e de item continua delegado ao roteador. O `PATCH` de item aceita `isActive` booleano como único campo, tanto para desativar quanto para reativar. [API](/home/dudupadilha/projects/utfgo/apps/api/server.cjs:13) · [Serviço Angular](/home/dudupadilha/projects/utfgo/apps/web/src/app/features/meeting-points/services/meeting-points.service.ts:94)

## Testes

`node --test apps/api/server.test.cjs` ficou bloqueado pelo ambiente. A execução de diagnóstico confirmou `listen EPERM` em `127.0.0.1` nos três casos, antes das asserções HTTP. A confirmação em execução fica com o orquestrador.
