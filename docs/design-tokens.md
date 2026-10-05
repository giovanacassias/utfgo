# Design Tokens — UTFgo

> Documento da identidade visual do protótipo e referência para a futura implementação. Os valores foram conferidos nas páginas Mobile, Desktop e System design do Figma; os tokens sem estilo equivalente estão identificados como padronização proposta.

## Referências

- [Protótipo UTFgo no Figma](https://www.figma.com/design/2eDxEEIwGE3I8OCTHEuSPO/UTFgo?node-id=51-13)
- [Telas desktop](https://www.figma.com/design/2eDxEEIwGE3I8OCTHEuSPO/UTFgo?node-id=260-394)
- [System design no Figma](https://www.figma.com/design/2eDxEEIwGE3I8OCTHEuSPO/UTFgo?node-id=1-177)
- [Atividade 04 — Prototipagem Responsiva e Navegável](https://chestnut-garage-91b.notion.site/Atividade-04-Prototipagem-Responsiva-e-Naveg-vel-33639e637f1580fa875df8afab1a0bed)
- [1ª Avaliação — Concepção e Planejamento](https://chestnut-garage-91b.notion.site/1-Avalia-o-Concep-o-e-Planejamento-33739e637f1580a7b310e90ea510c972)

O protótipo mantém duas referências principais: celular de 393 × 852 px e desktop de 1440 × 960 px. O arquivo de tokens registra também valores sugeridos para os tamanhos intermediários, ainda sem uma prancha tablet dedicada.

## Cores

A página System design já contém estilos de pintura chamados `yellow`, `black`, `purple`, `neutral`, `gray`, `white`, `red` e `green`. A coluna Figma preserva esses nomes; a coluna Token fornece o nome semântico a usar na documentação e no futuro tema CSS.

| Token CSS | Nome no Figma | Valor | Uso |
|---|---|---:|---|
| `--color-primary` | `yellow` / Color - primary | `#FCB900` | Marca e ações primárias |
| `--color-on-primary` | `black` / Color - secondary | `#121214` | Texto e ícone sobre amarelo |
| `--color-secondary` | `black` / Color - secondary | `#121214` | Texto principal e superfícies escuras |
| `--color-tertiary` | `purple` / Color - tertiary | `#4D327F` | Seleção e acentos secundários |
| `--color-on-tertiary` | `neutral` | `#F4F4F6` | Conteúdo sobre roxo |
| `--color-background` | `white` | `#FFFFFF` | Fundo principal |
| `--color-surface-muted` | `neutral` | `#F4F4F6` | Superfície secundária e campos |
| `--color-text-primary` | `black` | `#121214` | Texto principal |
| `--color-text-secondary` | `gray` | `#5F5E60` | Texto de apoio e rótulos |
| `--color-border` | Valor recorrente nas telas; ainda sem estilo nomeado | `#E2E2E4` | Divisores e bordas discretas |
| `--color-danger` | `red` | `#E42828` | Falha, validação e ação destrutiva |
| `--color-danger-surface` | Preenchimento existente nas telas | `#FFF1F0` | Fundo de mensagens de erro |
| `--color-success` | `green` | `#419146` | Confirmação de sucesso |
| `--color-warning-surface` | Variável Figma `light-yellow` | `#FFFBEB` | Fundo de aviso |
| `--color-control-disabled` | Preenchimento existente nas telas | `#EEEEF0` | Fundo de controle desabilitado |

Para texto normal sobre amarelo, usar `--color-on-primary` (`#121214`), nunca branco. O contraste calculado entre esses valores é 10,76:1. Para conteúdo sobre roxo, usar `#F4F4F6` (9,20:1). Verde é adequado para ícones e indicadores; quando houver texto sobre o fundo verde, usar texto escuro (`#121214`).

As telas feitas manualmente também contêm variações próximas de cinza e amarelo, como `#F3F3F5`, `#F9F9FB` e `#D1D5DB`. Para novas telas, usar os tokens desta tabela e evitar criar outra variação sem necessidade. Ao refinar os frames antigos, aproximar essas exceções do token semântico correspondente.

## Tipografia

- **Família da interface:** Plus Jakarta Sans.
- **Pesos disponíveis no protótipo:** Regular 400, Medium 500, SemiBold 600, Bold 700 e ExtraBold 800.
- **Fallback para implementação:** `sans-serif`.

| Token | Tamanho / entrelinha | Peso | Aplicação |
|---|---:|---:|---|
| `--text-caption` | 12 / 16 px | 500–600 | Metadados e legendas curtas |
| `--text-small` | 14 / 20 px | 400–500 | Texto auxiliar e controles compactos |
| `--text-body` | 16 / 24 px | 400 | Texto corrido e campos |
| `--text-title-small` | 20 / 28 px | 600 | Títulos de seção |
| `--text-title` | 24 / 32 px | 700 | Título de tela |
| `--text-display` | 40 / 48 px | 700–800 | Destaque de página |
| `--text-brand` | 64 px | 800 | Logotipo UTFgo |

Os frames atuais foram compostos manualmente e têm ocorrências pequenas de 8–11 px e tamanhos pontuais como 22 e 27 px. Para controles e conteúdo que a pessoa precisa ler, manter no mínimo 12 px; nas próximas revisões, aproximar tamanhos pontuais da escala acima. O logotipo do Figma usa Plus Jakarta Sans ExtraBold. Algumas partes antigas da página Mobile ainda contêm Inter; Plus Jakarta Sans é a família padrão a manter.

## Espaçamento e forma

A escala abaixo padroniza os espaçamentos para a implementação. Ela usa uma base de 4 px e preserva os valores recorrentes no Figma; a escala é a referência para novas telas.

| Token | Valor |
|---|---:|
| `--space-1` | 4 px |
| `--space-2` | 8 px |
| `--space-3` | 12 px |
| `--space-4` | 16 px |
| `--space-5` | 20 px |
| `--space-6` | 24 px |
| `--space-7` | 28 px |
| `--space-8` | 32 px |
| `--space-10` | 40 px |
| `--space-12` | 48 px |

Amostras atuais incluem ainda 10, 14 e 22 px, em especial por causa da montagem manual. Trate esses casos como ajustes locais existentes, não como novos degraus da escala.

- Botões e campos: altura de referência 48 px; raio de 12 px.
- Cards: raio de 16 px; cartões de opção podem usar 12 px.
- Pílulas e seletores circulares: raio total.
- Alvo mínimo recomendado para interação: 44 × 44 px.

## Estados de interação

| Elemento/estado | Aparência e comportamento |
|---|---|
| Botão primário padrão | Fundo `--color-primary`, conteúdo `--color-on-primary`, altura 48 px e raio 12 px. |
| Hover | Usar `#E5A800`, cor já presente em telas, como variação de hover; nomear como token quando esse estado for aplicado ao componente no Figma. |
| Pressionado | Manter contraste do botão, indicar o acionamento com mudança de profundidade/posição e não depender apenas da cor. |
| Foco por teclado | Contorno de 2 px em `--color-tertiary`, com afastamento visual do controle. |
| Desabilitado | Fundo `--color-control-disabled`, texto `--color-text-secondary` e nenhuma ação disponível. |
| Carregando | Preservar a ação primária, exibir indicador e impedir envio duplicado até a resposta. |
| Selecionado | Usar `--color-tertiary` junto de texto, ícone ou borda que deixe a seleção clara. |
| Sucesso / erro | Usar `--color-success` ou `--color-danger` com mensagem e ícone; não comunicar o estado apenas pela cor. |

Os frames ilustram estados como seleção, falha, aprovação, carregamento vazio e preenchido. Hover, foco e pressionado são regras para completar os componentes interativos, não estilos já formalizados na biblioteca do Figma.

## Responsividade

Os breakpoints são uma proposta de implementação baseada nos frames mobile de 393 px e desktop de 1440 px. Não há frame tablet no arquivo ainda.

| Nome | Largura mínima | Uso previsto |
|---|---:|---|
| Base | 320 px | Celular compacto; fluxo de uma coluna e sem rolagem horizontal. |
| `sm` | 640 px | Celular largo; ampliar margens e espaçamentos quando couber. |
| `md` | 768 px | Tablet; permitir duas colunas apenas quando o conteúdo continuar legível. |
| `lg` | 1024 px | Desktop; navegação lateral e conteúdo principal lado a lado. |
| `xl` | 1280 px | Desktop amplo; limitar a composição ao frame de referência de 1440 px. |

Priorizar o arranjo mobile abaixo de 1024 px e a composição desktop a partir de `lg`. Em larguras intermediárias, reorganizar conteúdo sem ocultar ações ou informações essenciais.

## Identidade PWA

Estes valores registram a identidade planejada para a entrega do manifesto; não significam que o PWA já esteja implementado.

| Propriedade | Valor planejado |
|---|---|
| Nome | UTFgo — Carona universitária |
| Nome curto | UTFgo |
| `theme_color` | `#FCB900` |
| `background_color` | `#FFFFFF` |
| `display` | `standalone` |
| `start_url` | `/` |
| Ícones | Exportar ícone quadrado da marca em 192 × 192 e 512 × 512 px na etapa de implementação. |

## Framework CSS

**Tailwind CSS** será usado como framework de estilo previsto para a implementação, mantendo a paleta, tipografia e escala deste documento como tema semântico. A configuração e a versão instalada ficam para a etapa de implementação e para a decisão registrada em `docs/architecture.md`; este documento não declara que Tailwind já foi instalado.

## Sincronização com o Figma

A página System design tem oito estilos de pintura com os nomes listados na tabela e uma variável local `light-yellow`; não há estilos de texto locais e a maioria dos valores ainda não está vinculada a variáveis. Este arquivo formaliza nomes semânticos para os valores que já aparecem no protótipo. Ao alterar uma cor ou fonte, atualizar o valor correspondente aqui e na página System design para que o protótipo e a documentação continuem alinhados.

A atividade pede que o link do protótipo esteja público e também seja incluído no README. O README já contém o link do Figma; antes da entrega, confirmar que a permissão está como qualquer pessoa com o link pode visualizar.
