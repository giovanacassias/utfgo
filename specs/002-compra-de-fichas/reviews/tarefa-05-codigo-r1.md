# Parecer de Código — Tarefa 5

**Veredito:** APROVADO (nenhum bloqueante)

`npm test` passou (13 arquivos, 195 testes) e `npm run lint` passou sem avisos. Revisei `buy-tokens.page.ts`, `.html`, `.spec.ts` e a rota `comprar` em `wallet.routes.ts`. O diff rastreado só acrescenta essa rota e ajusta um comentário.

## Apontamentos (bloqueiam)
Nenhum.

Itens que você pediu para olhar e estão corretos:
- **Recusa de entrada inválida:** `advance()` (`buy-tokens.page.ts:156-165`) não confia no `disabled`. Ele recusa quando `tokensCount()` é nulo, quando a conta está bloqueada e durante `loading`. Os testes forçam o `submit` do `form` nos casos: valor inválido, nada escolhido, conta bloqueada, conta bloqueada depois de escolher e `loading`.
- **Constantes:** não há número solto. Os limites, o preço e os pacotes vêm de `wallet.model.ts`, e as mensagens de min e max interpolam `MIN_TOKENS_PER_ORDER` e `MAX_TOKENS_PER_ORDER` (`.ts:27-28`). O texto das 5 mensagens bate com a tabela da spec (linhas 88-93).
- **Efeito do bloqueio:** o `effect` de `.ts:121-127` só chama `disable` e `enable` com `emitEvent:false`. Não escreve em signal, então não há laço. O teste de CA13 confirma o campo desabilitado.
- **Regras Angular:** sem `standalone: true`, sem `@Input` nem `@Output`, `inject()`, `@if` e `@for` com `track option`, Reactive Forms, sem `any`, sem `.css` nem `style=`. Não há valores arbitrários `[...]` nos utilitários; os `[class]` e `[attr.*]` são bindings. Os tokens usados existem em `styles.css`. O componente só acessa dados por `WalletService`.
- **Acessibilidade:**
  - O `<label for>` está associado ao `id` do input.
  - O erro aparece como texto em `role="alert"` e como borda, então não depende só de cor.
  - `aria-invalid` é condicional.
  - O botão de voltar tem `min-h-11 min-w-11`; os demais alvos têm `min-h-12`.
  - Todos têm `focus-visible:outline`.
  - O contraste usa os pares dos tokens (`text-on-tertiary` sobre `bg-tertiary`, `text-secondary` sobre `background`).
- **Testes:** `bg-tertiary` e `text-danger` aparecem como guarda simples de classe (`spec.ts:175-176,243`), padrão já aceito pelo dono. O resto usa atributos `data-*`, então não prende o teste à estrutura do DOM.

## Sugestões (não bloqueiam)
- **`role="radio"` sem teclado de radiogrupo** (`.html:60-75`). Cada pacote é um tab stop e não há setas nem tabindex móvel. Leitores de tela anunciam "radio" e o usuário espera usar as setas. Opções: implementar o padrão (tabindex móvel e setas) ou usar `<input type="radio">` real. Vale uma Issue se não couber agora.
- **Estado touched/dirty duplicado** (`.ts:81-83,147-154`). O `quantityValidator` está no `FormControl`, mas `control.errors`, `touched` e `dirty` nunca são lidos. A tela recalcula tudo em `customError` e `customTouched`. Hoje as duas rotas usam a mesma função `quantityError`, então não divergem. Se alguém mudar uma regra só no validador, o formulário e a tela passam a discordar. Dá para ler `customControl.errors`, `touched` e `dirty` ou, se o espelho em signal for deliberado, comentar o porquê. O `form` com um único controle também só é usado para `ngSubmit`.
- **Pluralização duplicada.** `tokensLabel` (`.ts:175-177`) repete a lógica de `wallet-overview.page.ts:80,84`. O `.html:43` tem um terceiro ternário `'ficha ativa'`. Um helper em `wallet.model.ts` ou num pipe de `shared/` resolveria. É a terceira ocorrência, então já compensa extrair.
- **Rota `'/cofrinho/pagamento'` solta** (`.ts:164`), igual a `wallet-overview.page.ts:72`. Há um TODO ligado à tarefa 6; uma constante de rota resolveria quando essa rota existir.
- **Métodos só repassam chamada** (`.ts:167-173`). `formatBrl` e `totalFor` apenas delegam para funções do model, e `totalFor(option)` é recalculado a cada ciclo para cada pacote. Dá para pré-computar a lista, por exemplo `packages = TOKEN_PACKAGES.map(...)`.
- **Asserção fraca no teste** (`spec.ts:245`). `not.toContain('R$ 2')` só confirma que nenhum total de R$ 2xx aparece. Seria mais direto verificar que o total mostra "—".
- **Teste com nome enganoso** (`spec.ts:365`). Ele se chama "only through the tariff constants", mas só verifica as mensagens nos limites ±1.
- **`aria-describedby` fixo** (`.html:110`). `[attr.aria-describedby]="'custom-quantity-feedback'"` é um literal; um atributo estático bastaria.
- **Foco no input** (`.html:111`). Falta `outline-offset-2`, que os pacotes e o botão têm. É só consistência visual.

## Observações fora do escopo deste diff
- Pode virar Issue de manutenção: extrair o helper de plural de "ficha" e a constante da rota de pagamento entre as páginas da carteira (itens acima).

**Veredito final: APROVADO.** Lista de bloqueantes: nenhum.
