---
trigger: glob
globs: apps/web/src/**/*, apps/web/public/**/*
---

# 02 - FIGMA DESIGN RULES

O Figma do UTFgo é a **fonte do design**. Ao criar ou alterar qualquer tela, componente, ilustração ou imagem em `apps/web/`, obedeça rigorosamente:

1. ONDE ESTÁ O DESIGN (arquivo UTFgo, `fileKey` `2eDxEEIwGE3I8OCTHEuSPO`):
- Arquivo: https://www.figma.com/design/2eDxEEIwGE3I8OCTHEuSPO/UTFgo
- Páginas: `Mobile` (`51:13`), `Desktop` (`260:393`), `Mapa de componentes` (`175:9550`), `System design` (`1:177`) e `Sandbox` (`0:1`).
- Telas conhecidas, **mobile**: Cofrinho `133:2146`, Comprar fichas `133:1822`, Forma de pagamento `133:1913`, Pix `133:1978`.
- Telas conhecidas, **desktop** (frames 1440x960 na página Desktop): `07 · Passageiro · cofrinho` `260:400`, `08 · Passageiro · comprar fichas` `260:401`, `09 · Pagamento · forma` `260:402`, `10 · Pagamento · Pix` `260:403`, `11 · Pagamento · falha` `260:404`, `12 · Pagamento · aprovado` `260:405`. Os demais frames estão listados na página Desktop (use `get_metadata` com o id `260:393`).
- `docs/design-tokens.md` e a página `System design` definem as cores, a tipografia, o espaçamento e os estados. A página `Mapa de componentes` mostra os componentes e seus estados.

2. DESIGN É MOBILE E DESKTOP:
- Toda tela é implementada para **as duas larguras**, como UM único componente responsivo: layout mobile (393 px) como base e layout desktop (1440 px) a partir do breakpoint `lg` (1024 px).
- Antes de implementar, olhe **os dois frames** da tela no Figma (mobile e desktop). Não implemente só um deles.
- Ao terminar, confira o resultado **renderizado no navegador** em 393 px e em 1440 px e compare com os frames. Teste verde não prova fidelidade visual.

3. COMO LER O FIGMA:
- Use as ferramentas do Figma MCP (`get_screenshot`, `get_metadata`, `get_design_context`, `download_assets`). Passe sempre `fileKey` e o `nodeId` do frame (o id `133-2146` do link equivale a `133:2146`).
- Se uma referência no chat apontar para o frame errado (ex.: o link de "Comprar fichas" quando o assunto é o Cofrinho), diga isso ao usuário e use o frame correto.
- Se o Figma MCP não estiver disponível, pare e peça ao usuário a exportação ou a captura do frame. Não adivinhe o visual.

4. IMAGENS E ILUSTRAÇÕES: EXTRAIR DO FIGMA, NUNCA DESENHAR:
- Imagem, ilustração, ícone ou logotipo que exista no Figma deve ser **exportado do próprio Figma** (`download_assets`) e salvo em `apps/web/public/`. PROIBIDO redesenhar, "imitar" ou gerar à mão (SVG improvisado, emoji, desenho aproximado).
- Se não conseguir exportar, peça ao usuário para exportar o arquivo. Nunca substitua por uma invenção.
- Imagem decorativa leva `alt=""` e `aria-hidden="true"`; imagem com significado leva `alt` descritivo.

5. QUANDO O FIGMA NÃO TEM A TELA OU A FUNCIONALIDADE:
- Só nesse caso é permitido criar o design do zero. Primeiro confirme que não existe um frame equivalente (páginas Mobile e Desktop) nem um componente no Mapa de componentes.
- O design criado deve **respeitar o System design e os tokens do projeto** (`docs/design-tokens.md`, `apps/web/src/styles.css`) e **se inspirar nas telas e nos componentes existentes** (mesma hierarquia, espaçamento, cantos, estados e tom). Não invente outra identidade visual.
- Registre no relatório da tarefa que a tela foi criada sem referência no Figma, para o usuário poder desenhá-la no Figma depois.

6. HIERARQUIA (ANTI-SYCOPHANCY):
- Ordem de precedência: **spec aprovada** (critérios de aceite e regras) > **regras `01-angular-strict-rules.md`** e tokens > **Figma** > criação própria.
- Onde o Figma divergir da spec (ex.: rótulos de filtro, ações de outras histórias, botões que a spec não pede), **vale a spec**. Aponte a divergência no relatório da tarefa; não altere a spec por conta própria.
- O Figma pode trazer valores soltos (hexadecimais, tamanhos fora da escala). **Não copie valores soltos**: use o token mais próximo e relate a diferença. Cores, fontes e espaçamentos continuam só pelos tokens.
- Se o pedido violar esta regra, RECUSE essa parte, diga qual regra ela fere e entregue a versão que obedece. NUNCA abra exceção "só desta vez".
