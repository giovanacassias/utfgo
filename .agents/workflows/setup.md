---
description: Gera a estrutura inicial do monorepo a partir do docs/architecture.md — apps via geradores oficiais, scripts da raiz, template de PR, Portão de Entendimento e índice de specs. Roda UMA vez, antes da primeira Issue. É uma Task de manutenção — sem spec.
---

# Setup do monorepo

Você gera a fundação sobre a qual o ciclo SDD vai rodar. Isso é uma **Task técnica**,
não uma história: não tem `spec.md`, e o PR dela recebe a etiqueta `manutencao`.

A fonte da verdade é o `docs/architecture.md`. Você **não decide stack** — você lê a
que foi decidida. O que não estiver escrito lá, você pergunta; não escolhe.

---

## Passo 0 — Pré-condições (PARE se qualquer uma falhar)

1. `docs/prd.md` e `docs/architecture.md` existem e declaram: o framework do backend,
   o framework do frontend, a estrutura de pastas do monorepo e como rodar os testes.
   Se algum desses quatro estiver ausente ou ambíguo, **PARE** e diga o que falta —
   setup com stack adivinhada é retrabalho garantido.
2. As pastas de app previstas no `architecture.md` (ex.: `apps/web`, `apps/api`)
   **não existem** ou estão vazias. Se já existirem com conteúdo, **PARE**: o setup
   roda uma vez, e rodá-lo de novo por cima é destrutivo.
3. Você está na `main`, limpa e atualizada.
4. O `gh` está autenticado (`gh auth status`) **ou** o MCP do GitHub está
   disponível — sem um dos dois, a etiqueta e o Pull Request do fim não saem.
   Se faltar, **PARE** e oriente: instalar o `gh`, `gh auth login`, com os
   escopos `repo` e `workflow`.

## Passo 1 — Branch

```
git switch -c setup-monorepo
```

Nenhum arquivo é criado antes da branch existir. A `main` é bloqueada.

## Passo 2 — Os apps, pelos geradores oficiais

Gere cada app com o gerador oficial da stack declarada no `architecture.md`
(ex.: `@nestjs/cli` para NestJS, `ng new` para Angular, `create-vite` para React/Vue),
dentro da estrutura de pastas que o documento descreve.

- **Antes de rodar, confirme na documentação atual** (MCP Context7, se
  disponível) a versão corrente de cada CLI e sua compatibilidade com o Node
  instalado — gerador desatualizado ou incompatível descoberto no meio do passo
  é retrabalho.
- Desative o `git init` interno do gerador — o repositório é um só, na raiz.
- Aceite os padrões do gerador. Não adicione biblioteca que o `architecture.md`
  não menciona.
- Se o `architecture.md` declara ferramenta de teste diferente do padrão do gerador,
  siga o documento; se não declara, fique com o padrão do gerador e **relate isso no
  fim** como decisão que o usuário precisa ratificar no `architecture.md`.

## Passo 3 — A raiz

1. `.gitignore` da raiz cobrindo `node_modules/`, artefatos de build (`dist/`,
   `build/`, `.angular/`, `coverage/`) e `.env` — **antes do primeiro
   `git add`**. Confira o que os geradores deixaram: com `--skip-git`, alguns
   (ex.: NestJS) não criam `.gitignore` próprio — não é esquecimento, o da
   raiz cobre todos os apps. Valide com `git status --short`: se aparecerem
   milhares de arquivos, o ignore não cobriu algo. (A IDE mostrar uma
   avalanche de untracked **entre** a geração e este passo é normal — ela
   some aqui.)
2. `.gitattributes` com:

   ```
   * text=auto eol=lf
   ```

   Sem isso, um repositório tocado em Windows e Linux reescreve todos os arquivos a
   cada troca de máquina, e o diff de qualquer PR vira ruído.

3. `package.json` da raiz com os scripts de orquestração descritos no
   `architecture.md` (ex.: `start`, `api`, `test`). Se o documento traz os scripts
   prontos, copie-os literalmente.

## Passo 4 — As ferramentas do método

1. `.github/pull_request_template.md` — o modelo com a seção
   **"O que este PR faz e por quê"** e a seção de apontamentos aceitos/recusados,
   conforme o Apêndice B do guia.
2. `.github/workflows/portao-de-entendimento.yml` — o Portão de Entendimento,
   copiado do Apêndice B do guia, sem alterações.
3. A etiqueta de manutenção no GitHub (é ela que marca PRs sem spec, a começar
   pelo deste setup):

   ```
   gh label create manutencao --description "PR tecnico, sem spec" --color FBCA04
   ```
4. `specs/README.md` — o índice de specs, com a tabela vazia:

   ```markdown
   # Índice de specs

   | Issue | Spec | Estado | Observação |
   | --- | --- | --- | --- |
   ```

## Passo 5 — Prova de vida

Rode a suíte de testes de **cada** app e o lint, com os comandos da raiz.

O scaffold precisa nascer **verde**. É esse verde que dá sentido ao RED do TDD a
partir da primeira tarefa: um teste que falha só é informação num repositório onde
os testes comprovadamente rodam.

**Regra das 2 rodadas:** se um gerador ou a suíte falhar duas vezes pelo mesmo
motivo, **PARE** e relate. Não tente uma terceira abordagem.

## Passo 6 — Entrega

1. Commits pequenos e nomeados por passo (apps, raiz, ferramentas do método) —
   **cada um proposto ao usuário antes** ("commit do passo X: <mensagem>?"),
   nenhum sem o OK dele.
2. Relate ao usuário: o que foi gerado, a saída dos testes, e as decisões que o
   `architecture.md` não cobria (Passo 2) para ele ratificar no documento.
   **Ratificação aprovada pelo usuário = atualize o `architecture.md` na mesma
   branch**, antes do PR — documento e scaffold entram juntos, contando a mesma
   história.
3. Instrua o usuário a abrir o PR com a etiqueta **`manutencao`** — setup é Task,
   não história. Explique os dois detalhes que ninguém adivinha:
   - **O template de PR só carrega da branch padrão.** Como o
     `pull_request_template.md` está nascendo **neste** PR, ele ainda não
     existe na `main` — no primeiro PR, cole o modelo à mão no corpo. Do
     segundo em diante, o GitHub preenche sozinho.
   - **`Closes #<n>` no corpo do PR** liga o PR à Issue e a fecha no merge — é
     esse elo que fecha a rastreabilidade Issue → spec → código exigida na
     avaliação. O PR do setup não fecha Issue nenhuma, então não leva
     `Closes` — mas todo PR de história leva.

---

## Proibições

- **Nenhuma entidade, endpoint, tela, modelo ou migration de negócio.** Se um nome
  do glossário do PRD aparecer em código gerado por você, você passou do ponto — o
  negócio começa na primeira Issue, pelo `/utf-issue`, com spec aprovada.
- Nada de CI além do Portão de Entendimento — esteira de testes é Issue própria.
- Não editar `docs/prd.md` nem `docs/architecture.md`. Se encontrar contradição
  entre eles, relate; não resolva por conta própria.
