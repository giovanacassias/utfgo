---
issue: 8
status: aprovada   # rascunho | aprovada
---

# Spec — US04: Gestão de Pontos de Encontro

**Issue:** [#8 — US04 — Gestão de Pontos de Encontro](https://github.com/giovanacassias/utfgo/issues/8)  
**Fonte de verdade funcional:** [docs/prd.md](../../docs/prd.md) (`US04`, `RN34`, `RNF07`, `RNF11`)  
**Modelo de dados:** [docs/architecture.md](../../docs/architecture.md) (`MeetingPoint`)  
**Design Tokens e Estilo:** [docs/design-tokens.md](../../docs/design-tokens.md) e Tailwind CSS v4

---

## 1. Contexto e Motivação (O Problema)

O **UTFgo** organiza caronas solidárias entre membros da UTFPR. Para garantir a segurança dos usuários, previsibilidade de horários e evitar paradas perigosas em vias expressas, os embarques e desembarques ocorrem estritamente em **Pontos de Encontro oficiais** pré-determinados e homologados pela instituição (`RN34`).

Conforme o protótipo do Figma, a navegação principal da casca contém as seções centrais (*Início*, *Caronas*, *Cofrinho* e *Meu perfil*). O acesso à **Gestão de Pontos de Encontro** é feito através de um atalho/card em destaque na tela inicial (**Início / Home**), direcionando o usuário para o gerenciador `/pontos-de-encontro`.

Além da listagem e do cadastro com **Soft Delete** (`isActive: boolean`), esta história contempla a exigência de integração com uma **API pública externa de utilidade pública (ViaCEP)** para resolução automática de endereço por CEP, além de suprir a régua técnica da disciplina com **rotas dinâmicas vinculadas a Signal inputs**, **componentes reutilizáveis com `input()`/`output()`**, **two-way binding reativo com `model()`** e **carregamento diferido com `@defer`**.

### Decisões Acordadas na Entrevista

- **Ponto de Entrada (Figma):**
  - O atalho para `/pontos-de-encontro` na página inicial (`/inicio`) é exibido apenas para administradores.
  - A gestão é exclusiva de administradores. Passageiros e condutores têm o acesso direto às telas bloqueado. A API valida o papel também nas operações de cadastro e alteração de status.
- **Consumo de API Externa (ViaCEP):**
  - No formulário de cadastro, ao informar o CEP (8 dígitos), o sistema faz uma requisição HTTP `GET` para `https://viacep.com.br/ws/{cep}/json/` através de um serviço dedicado (`CepService`), autopreenchendo Logradouro, Bairro e Cidade/UF.
  - Se o CEP for inválido, malformado ou retornar `{ erro: true }`, o campo exibe mensagem amigável de erro clara (*"CEP não encontrado. Verifique os dígitos e tente novamente."*).
  - Em caso de falha de conexão com a API externa, uma mensagem orienta o usuário e permite o preenchimento manual ou nova tentativa.
- **Estrutura de Rotas e Navegação:**
  - `/pontos-de-encontro`: Listagem de pontos, com busca em tempo real, filtro de status e cards com carregamento postergado (`@defer`).
  - `/pontos-de-encontro/novo`: Formulário reativo de cadastro de novo ponto com autopreenchimento por CEP.
  - `/pontos-de-encontro/:id`: Rota dinâmica de detalhes e ações do ponto, com injeção automática do parâmetro `:id` da rota via `input.required<string>()` (habilitado por `withComponentInputBinding()`).
- **Arquitetura de Componentes e Reatividade:**
  - Componente de apresentação filho `<app-point-card [point]="p" (toggleStatus)="onToggleStatus($event)" />` usando `input()` e `output()`.
  - Componente de controle `<app-point-search [(searchTerm)]="search" [(onlyActive)]="showActive" />` com two-way binding via Signal `model()`.
  - Controle de visualização com `@defer (on viewport)` e placeholder com efeito de skeleton.
- **Regras de Negócio e Soft Delete:**
  - Exclusão física é proibida (`RNF07`). A desativação apenas altera `isActive` para `false`.
  - Pontos inativos são identificados visualmente com etiqueta discreta *"Inativo"* e ficam bloqueados para seleção em novas caronas (`RN34`).
  - A unicidade considera nome, logradouro, número, bairro e cidade/UF, normalizados para ignorar diferenças de maiúsculas, acentos e espaços. Pontos com nomes distintos podem compartilhar o endereço.
- **Coordenadas do ponto:**
  - O administrador informa latitude e longitude manualmente para indicar o local exato de embarque. A latitude deve estar entre −90 e 90 e a longitude entre −180 e 180, inclusive.

---

## 2. Cenários de Usuário

### Cenário 1: Acesso via Home e Consulta com Busca/Filtro
1. Na tela **Início** (`/inicio`), o usuário visualiza o atalho/card de **"Pontos de Encontro"** e clica nele.
2. O sistema navega para `/pontos-de-encontro` e exibe os pontos homologados em cards com Nome, Endereço completo e Etiqueta de status (*Ativo* ou *Inativo*).
3. O usuário digita no campo de busca ou alterna o filtro de ativos; a lista filtra instantaneamente via Signal reativo derivado (`computed`).

### Cenário 2: Cadastro de Novo Ponto com Consulta de CEP (ViaCEP)
1. Na tela de listagem, o usuário clica em **"Novo ponto de encontro"** e navega para `/pontos-de-encontro/novo`.
2. O usuário preenche o CEP `80230-901`. Ao completar 8 dígitos, o sistema consulta a API pública do ViaCEP.
3. Os campos *Rua/Logradouro* ("Avenida Sete de Setembro"), *Bairro* ("Rebouças") e *Cidade/UF* ("Curitiba/PR") são preenchidos automaticamente.
4. O administrador informa o *Nome do Ponto* ("Entrada da Biblioteca"), o *Número/Complemento* ("3165"), a latitude e a longitude da entrada, e clica em **"Salvar ponto de encontro"**.
5. O ponto é criado com status `isActive: true` e o sistema redireciona para a listagem com mensagem de sucesso.

### Cenário 3: Visualização e Desativação (Soft Delete) via Rota com Parâmetro
1. Na listagem, o usuário clica no card de um ponto ativo e é direcionado para a rota `/pontos-de-encontro/:id`.
2. A tela carrega os detalhes do ponto correspondente ao `:id` recebido no input da rota.
3. O usuário aciona a ação **"Desativar ponto"**.
4. O sistema atualiza o ponto para `isActive: false`, exibe confirmação visual e atualiza o estado na lista.

---

## 3. Critérios de Aceite

### Navegação e Rotas
- [ ] **CA1 — Roteamento dinâmico com `withComponentInputBinding`:** Dado o acesso à rota `/pontos-de-encontro/:id`, o parâmetro `:id` da URL é capturado pelo componente diretamente através de um Signal `id = input.required<string>()`, carregando os dados do ponto correspondente.
- [ ] **CA2 — Atalho na Home e Navegação Casca:** Dado que o usuário está na tela `/inicio`, um atalho navegável permite acessar `/pontos-de-encontro` dentro do palco central da casca.
- [ ] **CA3 — Proteção de rotas:** Dado um visitante não autenticado, qualquer tentativa de acesso direto a `/pontos-de-encontro`, `/pontos-de-encontro/novo` ou `/pontos-de-encontro/:id` é redirecionada pelo `authGuard` para `/entrar`.
- [ ] **CA15 — Gestão exclusiva de administradores:** O atalho e as três telas estão disponíveis apenas para administradores. Passageiros e condutores têm o acesso direto bloqueado. A API só autoriza `POST /meeting-points` e `PATCH /meeting-points/:id` para administradores.

### Listagem e Componentização Reativa
- [ ] **CA4 — Listagem com `@for` e `track`:** A listagem itera sobre os pontos cadastrados usando `@for (point of points(); track point.id)`, exibindo nome, endereço e status.
- [ ] **CA5 — Componente filho com `input()` e `output()`:** Cada item da lista é renderizado por `<app-point-card>`, que recebe o objeto através de `point = input.required<MeetingPoint>()` e emite eventos de clique/alteração por `toggleStatus = output<string>()`.
- [ ] **CA6 — Two-way binding com `model()`:** O componente de filtro `<app-point-search>` recebe e atualiza bidirecionalmente `searchTerm = model('')` e `onlyActive = model(false)`.
- [ ] **CA7 — Carregamento diferido com `@defer`:** A grade de pontos de encontro utiliza a diretiva `@defer (on viewport)` com `@placeholder` esqueleto, simulando otimização de renderização.

### Integração com API Pública (ViaCEP)
- [ ] **CA8 — Consulta automática de CEP:** Dado o formulário em `/pontos-de-encontro/novo`, ao digitar um CEP válido com 8 dígitos, o serviço dispara requisição `GET` para a API do ViaCEP e autopreenche logradouro, bairro e localidade/UF.
- [ ] **CA9 — Erro de CEP inválido ou não encontrado:** Dado um CEP com formato inválido ou inexistente na base dos Correios, o sistema exibe alerta específico (*"CEP não encontrado. Verifique o número digitado."*) e mantém os campos abertos para correção.
- [ ] **CA10 — Resiliência a falhas de rede no ViaCEP:** Caso a API externa esteja fora do ar ou retorne erro HTTP, uma notificação visual clara orienta o usuário e permite o preenchimento manual dos dados do endereço.

### Validação, Cadastro e Soft Delete
- [ ] **CA11 — Cadastro com dados válidos:** O administrador preenche nome, CEP, endereço completo e coordenadas manuais válidas. Com latitude de −90 a 90 e longitude de −180 a 180, inclusive, o ponto é persistido por `POST /meeting-points` com `isActive: true`, e a tela exibe a listagem com uma mensagem de sucesso. Coordenadas vazias ou fora dos limites impedem o cadastro.
- [ ] **CA12 — Bloqueio de duplicidade por nome e endereço:** Se nome, logradouro, número, bairro e cidade/UF coincidirem com os de um ponto existente após normalização de caixa, acentos e espaços, a API rejeita o cadastro e o formulário exibe uma mensagem de duplicidade. O mesmo endereço aceita pontos com nomes distintos.
- [ ] **CA13 — Validação de campos obrigatórios:** O botão de salvar permanece desabilitado (`[disabled]`) enquanto Nome ou CEP estiverem vazios ou inválidos via **Reactive Forms**.
- [ ] **CA14 — Desativação / Reativação (Soft Delete):** Na tela de detalhes ou card do ponto, o usuário pode alternar o status do ponto entre ativo e inativo; o registro no servidor é atualizado com `PATCH /meeting-points/:id` `{ isActive: false }` sem exclusão física.

---

## 4. Fora de Escopo

- Mapa interativo com renderização de GPS em tempo real ou geolocalização por satélite (Google Maps / OpenStreetMap).
- Cálculo de rotas e estimativa de trânsito entre pontos.
- Exclusão física permanente (Hard Delete) de pontos de encontro.
- Criação e agendamento de caronas (pertence à **US05**).

---

## 5. Dúvidas em Aberto

*(Nenhuma — todas as decisões de navegação a partir da Home, regras de validação e modelo de integração externa foram alinhadas com o protótipo do Figma.)*
