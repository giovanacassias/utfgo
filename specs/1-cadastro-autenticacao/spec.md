---
issue: 1
status: aprovada   # rascunho | aprovada
---

# Spec — US01: Cadastro e Autenticação de Usuário + Casca do App

**Issue:** [#1 — US01 — Cadastro e Autenticação de Usuário](https://github.com/giovanacassias/utfgo/issues/1)  
**Fonte de verdade funcional:** [docs/prd.md](../docs/prd.md) (`US01`, `RN01`, `RNF01`)  
**Referências visuais:** Figma (`01 · UTFgo institucional`, `02 · Acesso por e-mail`, `03 · Validar código`, `04 · Passageiro · início vazio`) e [docs/design-tokens.md](../docs/design-tokens.md)

---

## 1. Contexto e Motivação (O Problema)

Membros da comunidade acadêmica da UTFPR precisam de um acesso seguro e restrito à plataforma **UTFgo** sem depender de senhas tradicionais (autenticação *passwordless* via código OTP enviado ao e-mail institucional).

Além do fluxo de criação de conta e login por PIN, esta é a **primeira história implementada no projeto** e, portanto, inaugura a **casca da aplicação (*App Shell*)** — estrutura compartilhada de cabeçalho, navegação responsiva (gaveta lateral no celular e menu lateral fixo no desktop), palco central (`<router-outlet />`) e rodapé — que sustentará todas as telas autenticadas do sistema.

### Decisões Acordadas na Entrevista

- **Allowlist de domínios institucionais:** O cadastro e o acesso aceitam e-mails terminados em `@alunos.utfpr.edu.br` e `@utfpr.edu.br` (allowlist configurável). *Observação: confirmar posteriormente com a coordenação/TI se há outros subdomínios específicos para professores e servidores.*
- **Separação entre Cadastro e Login:**
  - **Criar conta:** fluxo explícito para novos usuários preencherem os dados iniciais obrigatórios (Nome completo, E-mail institucional e Câmpus) antes da confirmação via PIN/OTP.
  - **Entrar:** fluxo para usuários já cadastrados informarem apenas o e-mail institucional e validarem o código PIN de 6 dígitos.
- **Casca do App (*App Shell*):**
  - **Desktop (`≥ 1024px` — Opção B do Figma):** menu lateral fixo à esquerda (`248px`) com a marca `UTFgo`, seção `NAVEGAÇÃO` (*Início*, *Caronas*, *Cofrinho*, *Pontos de encontro*, *Meu histórico*, *Meu perfil*), alternador `PERFIL ATIVO` (*Passageiro* | *Condutor*) e rodapé institucional (*Acesso institucional UTFPR* / *Ajuda e suporte*); cabeçalho superior com título da tela ativa e resumo da conta (fichas e nome do usuário); e palco central com `<router-outlet />`.
  - **Mobile (`< 1024px` — Regra da Atividade 11):** cabeçalho com botão hambúrguer (`☰`), marca/título e saldo de fichas; ao tocar em `☰`, abre uma **gaveta lateral (*drawer*)** exibindo os mesmos links de navegação do desktop e o rodapé, fechando ao selecionar um link ou acionar o fechamento/backdrop.
  - **Visibilidade da Casca:** As telas pré-autenticação (`01 · UTFgo institucional`, `02 · Acesso por e-mail`, `03 · Validar código` e `Criar conta`) são renderizadas sem a barra lateral/gaveta da casca autenticada. Após a confirmação do código OTP, o usuário é redirecionado para o palco autenticado (`/inicio`).
- **Simulação do OTP no MVP (`json-server`):** Como o MVP utiliza `json-server` sem servidor SMTP real, o código OTP de 6 dígitos tem validade de **10 minutos** e será simulado/validado localmente no fluxo de serviço (exibindo o PIN gerado em log/aviso discreto de ambiente de desenvolvimento para permitir o teste ponta a ponta).

---

## 2. Cenários de Usuário

### Cenário 1: Cadastro de novo usuário (Primeiro Acesso)
1. O visitante acessa a tela institucional (`/`) e clica em **"Criar conta"** (ou em *"É o primeiro acesso? Clique aqui"* na tela de login).
2. Preenche **Nome completo**, **E-mail institucional** (dentro da allowlist) e **Câmpus**, e clica em **"Enviar código de acesso"**.
3. O sistema verifica que o e-mail ainda não possui conta, registra o código OTP de 6 dígitos válido por 10 minutos e navega para a tela de validação do PIN.
4. O usuário digita os 6 dígitos e clica em **"Confirmar código"**.
5. O sistema cria a conta com papel `PASSENGER`, status `ACTIVE` e carteira inicial zerada (ou conforme seed), salva a sessão autenticada e redireciona para `/inicio` dentro da casca do app exibindo *"Olá, \<Nome\>"*.

### Cenário 2: Login de usuário existente (Passwordless OTP)
1. O usuário acessa a tela de login (`/entrar`), informa seu **E-mail institucional** já cadastrado e clica em **"Enviar código de acesso"**.
2. O sistema gera um novo código OTP de 6 dígitos (validade de 10 minutos) e exibe a tela de validação de PIN mostrando o e-mail mascarado/etiquetado.
3. Caso não receba, o usuário pode clicar em **"Reenviar código"** para invalidar o código anterior e gerar um novo.
4. Ao inserir o código válido e clicar em **"Confirmar código"**, a sessão é iniciada e o usuário entra na casca autenticada em `/inicio`.

### Cenário 3: Navegação pela Casca do App (Mobile e Desktop)
1. Autenticado em `/inicio`, o conteúdo da rota é exibido no palco central (`<router-outlet />`) com o link **Início** destacado como ativo.
2. No **celular (`< 1024px`)**, o usuário toca no botão `☰` para abrir a gaveta lateral, vê todos os itens de navegação, toca em um link (ou no botão fechar) e a gaveta se fecha atualizando o palco central.
3. No **desktop (`≥ 1024px`)**, o menu lateral fixo permanece visível à esquerda ao lado do palco central, sem necessidade do botão `☰`.

---

## 3. Critérios de Aceite

### Casca do App (*App Shell*)
- [ ] **CA1 — Palco central e destaque de rota ativa:** Dado que o usuário está autenticado, quando navega para `/inicio` (ou outra rota filha protegida), então a casca renderiza o cabeçalho, o rodapé e o conteúdo da rota ativa dentro do `<router-outlet />`, destacando visualmente o link correspondente na navegação.
- [ ] **CA2 — Gaveta lateral no celular (`< 1024px`):** Dado que a viewport é mobile (`< 1024px`), quando o usuário toca no botão hambúrguer (`☰`) no cabeçalho, então a gaveta lateral (*drawer*) abre exibindo os links de navegação (*Início*, *Caronas*, *Cofrinho*, *Pontos de encontro*, *Meu histórico*, *Meu perfil*); ao tocar em um link ou no botão/área de fechamento, a gaveta fecha.
- [ ] **CA3 — Menu lateral fixo no desktop (`≥ 1024px`):** Dado que a viewport é desktop (`≥ 1024px`), quando a casca autenticada é renderizada, então o menu lateral permanece fixo e visível à esquerda ao lado do `<router-outlet />`, sem exibir o botão `☰`, mantendo cabeçalho superior e rodapé.
- [ ] **CA4 — Proteção de rotas autenticadas:** Dado um visitante não autenticado, quando tenta acessar `/inicio` diretamente pela URL, então é redirecionado para a tela de acesso (`/entrar` ou `/`) sem exibir a casca autenticada.

### Cadastro e Envio de Código OTP
- [ ] **CA5 — Tela inicial e navegação para cadastro/login:** Dado um visitante na tela inicial (`/`), quando clica em **"Entrar com e-mail institucional"**, então navega para `/entrar`; quando clica em **"Criar conta"**, então navega para `/criar-conta`.
- [ ] **CA6 — Cadastro com dados válidos e envio de OTP:** Dado o formulário de cadastro em `/criar-conta`, quando o usuário preenche nome completo não vazio, e-mail pertencente à allowlist (`@alunos.utfpr.edu.br` ou `@utfpr.edu.br`) ainda não cadastrado e câmpus, e submete, então o sistema avança para a tela de validação de PIN de 6 dígitos mantendo os dados pendentes para confirmação.
- [ ] **CA7 — Login com e-mail institucional cadastrado:** Dado o formulário de login em `/entrar`, quando o usuário informa um e-mail institucional válido já existente com status `ACTIVE` e clica em **"Enviar código de acesso"**, então o sistema dispara a geração do OTP de 6 dígitos (validade de 10 minutos) e navega para a tela de validação do código exibindo o e-mail informado.
- [ ] **CA8 — Reenvio de código OTP:** Dado que o usuário está na tela de validação de PIN, quando clica em **"Reenviar código"**, então um novo código OTP de 6 dígitos é gerado, o prazo de 10 minutos é reiniciado e uma confirmação visual de reenvio é exibida.

### Validação de Código OTP e Sessão
- [ ] **CA9 — Confirmação de OTP válido:** Dado que o usuário está na tela de validação de PIN, quando preenche os 6 dígitos corretos dentro do prazo de 10 minutos e clica em **"Confirmar código"**, então a sessão do usuário é persistida (token/sessão ativa), a conta é criada (se for cadastro) e o usuário é redirecionado para `/inicio` exibindo seu nome no cabeçalho/saudação.
- [ ] **CA10 — Logout / Encerramento de sessão:** Dado um usuário autenticado na casca, quando aciona a opção **"Sair"** no menu/conta, então a sessão local é limpa e o usuário retorna à tela inicial/login, perdendo acesso às rotas protegidas.

### Caminhos Tristes e Casos de Erro
- [ ] **CA11 — E-mail vazio, malformado ou fora da allowlist institucional:** Dado o formulário de login ou cadastro, quando o usuário informa um campo vazio, formato inválido ou domínio fora da allowlist (ex.: `usuario@gmail.com`), então o envio é bloqueado e uma mensagem de erro clara é exibida junto ao campo indicando a exigência de e-mail institucional da UTFPR.
- [ ] **CA12 — Campos obrigatórios ausentes ou e-mail duplicado no cadastro:** Dado o formulário de cadastro, quando o usuário tenta avançar sem preencher o nome completo ou informa um e-mail já cadastrado, então o envio é bloqueado e uma mensagem específica é exibida (orientando a entrar caso o e-mail já exista).
- [ ] **CA13 — E-mail não cadastrado ao tentar fazer login:** Dado o formulário de login em `/entrar`, quando o usuário informa um e-mail institucional válido que ainda não possui cadastro, então o sistema não avança para o PIN e exibe mensagem orientando a criar uma conta primeiro.
- [ ] **CA14 — Código OTP incompleto, incorreto ou expirado:** Dado a tela de validação de PIN, quando o usuário tenta confirmar com menos de 6 dígitos, digita um código diferente do gerado ou tenta confirmar após mais de 10 minutos de emissão, então o botão/submissão exibe mensagem de erro específica (*código incompleto*, *código inválido* ou *código expirado — solicite um novo*) sem autenticar o usuário.
- [ ] **CA15 — Conta suspensa ou banida (`SUSPENDED` / `BANNED`):** Dado um usuário cadastrado cujo status é `SUSPENDED` ou `BANNED`, quando tenta solicitar ou confirmar o código OTP no login, então o acesso é negado e uma mensagem informa que a conta está suspensa/banida.
- [ ] **CA16 — Falha de rede / API indisponível:** Dado que a API (`json-server`) está indisponível ou retorna erro de rede durante o envio ou confirmação do OTP, quando o usuário submete o formulário, então o sistema exibe mensagem amigável de erro de conexão permitindo nova tentativa sem apagar o e-mail/dados preenchidos.

---

## 4. Fora de Escopo

Estão explicitamente **fora do escopo** desta história e pertencem a outras Issues do backlog:
- Compra de fichas via Pix/Cartão e webhook de pagamento (**US02** — tela *Cofrinho* terá apenas placeholder/rota de destino).
- Envio de documentos CNH/CRLV e homologação de perfil de condutor (**US03** — alternador *Passageiro / Condutor* na casca pode exibir estado informativo ou desabilitado caso o usuário ainda não seja condutor aprovado).
- Gestão de pontos de encontro (**US04**), publicação, busca, reserva e gerenciamento de caronas (**US05 a US15**).
- Contestações, saques, relatórios e gestão administrativa de usuários (**US16 a US20**).
- Envio real de e-mails via servidor SMTP externo e backend NestJS completo (substituídos por `json-server` e simulação local de OTP nesta etapa do MVP, conforme arquitetura da disciplina).

---

## 5. Dúvidas em Aberto

*(Nenhuma — todas as decisões de negócio, layout da casca e comportamento de erro foram resolvidas na entrevista com a equipe.)*
