# Parecer de Código — Tarefa 7

Testes: `npm test` passou (15 arquivos, 239 testes). `npm run lint` passou sem avisos. Conferi o diff, os 3 arquivos novos de `pix-payment/`, `buildPixCopyPasteCode`, a rota `pix` e os 3 ativos. Não rodei o app no navegador.

**Veredito: REPROVADO**

## BLOQUEANTES

1. **A página some assim que a ação dá certo, antes da navegação, e não há saída se a navegação não acontecer.**
   - Onde: `pix-payment.page.html:1` (`@if (ready())`), `pix-payment.page.ts:40-42` (`ready` é um `computed` vivo) e `pix-payment.page.ts:135` (`void this.router.navigate(...)`, resultado ignorado).
   - O que acontece: `confirmPayment`, `failPayment` e `cancelOrder` mudam o `Order` e o `Payment` para `COMPLETED`, `PAID`, `FAILED` ou `CANCELLED`. Com isso `ready()` vira `false` e a tela inteira desaparece. Só depois disso o `navigate` roda e o chunk lazy da próxima rota carrega. O redirecionamento só existe no `ngOnInit`, então nada tira o usuário da tela em branco.
   - Prejuízo: o usuário vê uma tela vazia no intervalo, com título, QR e botões sumindo juntos. As rotas `/cofrinho/aprovado` e `/cofrinho/falha` ainda não existem (tarefa 9). Se o `navigate` resolver `false` ou rejeitar, o usuário fica preso numa página em branco, sem botão nem erro. Os testes não pegam isso porque mockam o `navigate` com `true` e nunca verificam o DOM entre o sucesso e a navegação.
   - Regra violada: o `spec.md` (CA14/CA15) exige não exibir sucesso falso e manter a tela recuperável. O `architecture.md` pede páginas como Smart Components que consomem os Signals do serviço.
   - Correção possível: avaliar `ready` uma vez, por exemplo em um signal travado no `ngOnInit`. Ou manter o conteúdo enquanto `submitting()` for `true`. Ou tratar o retorno de `navigate`. Em qualquer caso, adicionar um teste que confira o DOM logo após o sucesso.

2. **Tamanhos fora da escala de tokens.**
   - Onde: `pix-payment.page.html:61` (`size-40`), `:126` (`size-44`), `:76` (`lg:min-h-24`) e `:106` (`lg:w-16`).
   - O que acontece: `@theme` define só `--spacing-1..8`, `10`, `12` e `62`. Essas utilidades caem no multiplicador padrão do Tailwind: 160px, 176px, 96px e 64px.
   - Regra violada: a regra 01 §2 e a regra 02 §6 pedem tokens, sem valor solto, e mandam usar o token mais próximo e relatar a diferença.
   - Prejuízo: o QR e o bloco do código não seguem os tokens. Se a escala mudar, esses tamanhos ficam para trás sem aviso.
   - Correção possível: usar tokens existentes, ou registrar novos em `styles.css` e em `docs/design-tokens.md`.
   - `min-h-11` e `min-w-11` já têm precedente no repo em quatro outras páginas e não estou apontando.

## SUGESTÕES

- **`buildPixCopyPasteCode` (`wallet.model.ts:80-90`):**
  - É determinística e está bem documentada como simulada. O comprimento da tag está fixo em `0136` e `06`, mas o conteúdo real varia (`mp-pix-123` tem 10 caracteres; `2.00` tem 4). Isso é aceitável porque o código não é EMV, mas o comentário poderia dizer isso.
  - Ela não valida a entrada. `formatBrlFromCents` lança erro para valor não inteiro; esta função devolve `NaN` ou `-5.00` sem avisar. Valor negativo ou não inteiro seria um erro de programação.
  - No spec da página, `buildPixCopyPasteCode` calcula o valor esperado do próprio código sob teste. As asserções `toContain('10.00')` compensam em parte.
- **Clipboard (`pix-payment.page.ts:88-100`):**
  - `navigator.clipboard` indisponível ou `writeText` rejeitado são tratados. O `await` dentro do `try` captura o `TypeError` de `clipboard` indefinido, e há teste para isso.
  - Se o componente for destruído enquanto o `writeText` está pendente, o timer de 2 s é criado depois do `onDestroy` e fica vazado por 2 s. É inofensivo, mas um guard simples resolve.
  - A falha de cópia usa `role="status"` (educado). Para um erro, `role="alert"` seria mais adequado. Se manter, tudo bem.
- **Trava (item 3):**
  - A corrida está fechada. `busy()` é checado e `submitting.set(true)` roda de forma síncrona antes do primeiro `await`. O serviço também tem sua própria trava e `loading`. Os testes cobrem duplo clique entre os botões mobile e desktop e entre as 3 ações.
  - O "Tentar novamente" repete `lastAction` corretamente, e `lastAction` só é gravado depois da trava. Há testes para approve, fail, cancel e para falha parcial.
  - `clearError()` no `ngOnInit` está correto.
- **Duplicação de markup (item 6):**
  - Há dois QR, duas etiquetas `data-waiting-badge`, dois botões "Já realizei" e o `lg:contents`. É funcional porque o `display:none` tira a duplicata da árvore de acessibilidade. A manutenção custa caro: qualquer ajuste precisa ser feito em dois lugares.
  - O container `hidden ... lg:flex` já oculta `data-amount`, que ainda tem `hidden ... lg:block` redundante (`html:128`), e o teste depende dessa classe.
  - Considere extrair subcomponentes dumb (QR e etiqueta) quando houver a próxima tela com os mesmos blocos (`/cofrinho/falha` e `/cofrinho/aprovado` também usam resumo).
- **Acessibilidade (item 7):**
  - Os alvos têm 44 a 48 px, o foco é visível, os `role="alert"` estão presentes, o ícone tem `alt=""` com `aria-hidden` e o QR tem `alt` descritivo. O texto do código é `select-all` e continua selecionável.
  - O código fica `truncate` no mobile, então o usuário não vê o código completo, só o copia inteiro. Aceito, por fidelidade ao Figma.
  - O link de voltar não tem deslocamento de foco (`outline-offset`), ao contrário dos botões.
- **Ativos SVG (item 8):**
  - Os `copy.svg` e `sync.svg` exportados do Figma trazem `fill="#121214"`, `fill="#FCB900"` e `style="display: block;"`. Como são arquivos de `public/` renderizados por `<img>`, não violam o template. O ícone `sync.svg` tem cor fixa, então não segue o token se ele mudar.
- **Testes (item 10):**
  - Classes Tailwind como guarda simples e o `fs` no spec seguem o padrão já aceito da tarefa 6.
  - O teste do timer (linhas 226-243) acopla a `setTimeout` com `call[1] === 2000` e `mock.calls.indexOf`. Funciona, mas é frágil a uma mudança do valor ou da forma de agendar.
  - Falta um teste para o `navigate` que resolve `false` (ligado ao bloqueante 1).

## Observações fora do escopo deste diff

- O comentário `// TODO #2` em `payment-method.page.ts` ficou vago ("replace with the NestJS-backed flow"). Vale uma Issue de manutenção para a troca do `json-server` pelo backend real.
- As rotas `/cofrinho/aprovado` e `/cofrinho/falha` são alvos de `router.navigate`, mas só existem na tarefa 9. Até lá, o fluxo Pix leva a uma rota inexistente. Isso estava planejado, mas conta como risco de integração.

Arquivos principais:
- `C:\Users\danie\Documents\utfgo\apps\web\src\app\features\wallet\pages\pix-payment\pix-payment.page.ts`
- `C:\Users\danie\Documents\utfgo\apps\web\src\app\features\wallet\pages\pix-payment\pix-payment.page.html`
- `C:\Users\danie\Documents\utfgo\apps\web\src\app\features\wallet\pages\pix-payment\pix-payment.page.spec.ts`
- `C:\Users\danie\Documents\utfgo\apps\web\src\app\features\wallet\models\wallet.model.ts`

**Bloqueantes:**
1. A página some após o sucesso, antes da navegação, e o `navigate` não tem tratamento do retorno (`pix-payment.page.html:1`, `pix-payment.page.ts:40-42,135`).
2. Tamanhos fora dos tokens: `size-40`, `size-44`, `lg:min-h-24` e `lg:w-16` (`pix-payment.page.html:61,126,76,106`).
