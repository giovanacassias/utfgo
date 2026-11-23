# Parecer de Código — Tarefa 2

**Veredito: APROVADO**

O bloqueante de roteamento aninhado foi resolvido. A guarda valida o nome decodificado da coleção antes da reescrita pelo `json-server`. Para escritas aninhadas, ela rejeita `meeting-points` e nomes com delimitadores de URL. As rotas diretas `POST`, `GET` e `PATCH` seguem fora dessa guarda. [server.cjs](/home/dudupadilha/projects/utfgo/apps/api/server.cjs:66)

O teste de regressão exige `405` para as formas aninhadas literal e codificada e verifica que a coleção mantém a mesma quantidade de registros. A execução local da suíte parou com `listen EPERM` em `127.0.0.1`, antes das asserções HTTP. O veredito se baseia na inspeção do diff. [server.test.cjs](/home/dudupadilha/projects/utfgo/apps/api/server.test.cjs:99)
