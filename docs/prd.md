# 📄 Product Requirements Document (PRD)

**Projeto:** [nome]
**Versão:** 0.0.0 · esqueleto — preencha via `/utf-prd`
**Última atualização:** [data]
**Projeto:** UTFgo
**Versão:** 1.0.0
**Última atualização:** 2026-09-20

> 🤖 **Este documento é a fonte da verdade sobre o QUE o produto faz.** Regra de
> negócio que não estiver aqui não existe — nem para a equipe, nem para a IA.
> Tecnologia **não** se discute aqui: isso é assunto do `architecture.md`.
>
> ✍️ **Não preencha na mão:** rode `/utf-prd` — a entrevista percorre as seções
> abaixo, na ordem, e confere o resultado contra a ficha da disciplina
> (`docs/checklist.md`). As respostas são suas; o agente só organiza.

---

## 🎯 1. Visão Geral e Objetivo

**O problema:** [quem sofre o quê, hoje]
**O problema:**
Membros da comunidade acadêmica da UTFPR enfrentam dificuldades para se deslocar até a universidade e retornar dela, embora muitas pessoas façam trajetos equivalentes em horários semelhantes partindo de pontos comuns da cidade.

**A solução:** [o que o produto faz a respeito, em um parágrafo]
**A solução:**
O UTFgo conecta membros da comunidade acadêmica que desejam oferecer caronas a passageiros que precisam delas para ir ou voltar do campus. A plataforma opera com uma carteira digital de fichas pré-pagas (R$ 2,00 por reserva, via Pix ou Cartão de Crédito), garantindo a reserva de vagas com tolerância de cancelamento e fluxo de moderação de assiduidade.

**Como saberemos que deu certo:** [comportamento observável, não métrica inventada]
**Como saberemos que deu certo:**
Através do acompanhamento das métricas mensais do sistema: número de passageiros e condutores cadastrados; caronas finalizadas com sucesso vs. canceladas (por condutor ou passageiro); caronas expiradas (não iniciadas/não finalizadas); e mapeamento dos pontos de encontro com maior índice de caronas.

---

## 📖 2. Glossário Ubíquo

> Os termos do negócio, como o cliente fala. É daqui que o `architecture.md`
> deriva os nomes das entidades.

| Termo | Significa | Não confundir com |
| :---- | :-------- | :---------------- |
| | | |
| **Administrador** | Usuário com permissões privilegiadas; gerencia pontos de encontro, usuários, e valida documentos de condutores. | Usuário comum ou moderador externo. |
| **Condutor** | Usuário apto a oferecer caronas; possui conta de passageiro e cadastro de condutor aprovado com CNH e CRLV. | *Motorista* de aplicativo comercial. |
| **Passageiro** | Usuário com conta ativa apto a buscar caronas e solicitar reservas. | Usuário anônimo ou visitante. |
| **Ponto de Encontro** | Local oficial pré-determinado e homologado pelo Administrador para embarque. | *Ponto de partida* ou *embarque avulso*. |
| **Carona** | Deslocamento solidário oferecido por um condutor, com ponto de encontro, data, horário e limite de vagas. | *Viagem*, *corrida de aplicativo*. |
| **Vaga** | Assento individual disponível ou ocupado dentro de uma carona específica. | *Reserva* (direito garantido ao assento). |
| **Reserva** | Vaga selecionada e paga (débito de ficha) por um passageiro após aceite do condutor. | *Vaga disponível*. |
| **Ficha** | Crédito do sistema com valor fixo definido pelo Admin (R$ 2,00), usado para custear 1 reserva. | Moeda física ou valor negociado. |
| **Carteira** | Saldo digital de fichas do usuário, recarregável via Pix/Cartão de Crédito. | Conta bancária externa. |
| **Sentido** | Direção da carona em relação ao campus: *Ida* (para o campus) ou *Volta* (do campus). | Destino arbitrário / outros locais. |

---

## 👤 3. Atores e Permissões

> ⚠️ A coluna **"Não pode"** vira Guard e controle de role na API.

| Ator | Quem é | Pode | Não pode |
| :--- | :----- | :--- | :------- |
| | | | |
| **Passageiro** | Membro com conta ativa | • Gerenciar perfil (nome, foto, CPF).<br>• Ver dados públicos do condutor antes/depois da reserva (Discord).<br>• Comprar fichas, gerenciar carteira, doar fichas.<br>• Solicitar reserva e cancelar reserva (regras de prazo).<br>• Avaliar condutor e abrir denúncia.<br>• Solicitar perfil de Condutor.<br>• Usar app mesmo suspenso como condutor. | • Oferecer carona.<br>• Gerenciar pontos de encontro.<br>• Reservar vaga sem saldo de fichas.<br>• Reservar 2 caronas com <30min de intervalo.<br>• Avaliar condutor sem concluir carona.<br>• Visualizar dados sensíveis de terceiros (CPF/CNH).<br>• Estorno de ficha se ausente no embarque. |
| **Condutor** | Usuário maior de 18 anos aprovado | • Gerenciar perfil (CNH/CRLV).<br>• Oferecer, editar (horário/vagas com >1h de antecedência) e cancelar caronas.<br>• Visualizar/decidir solicitações de reserva pendentes.<br>• Iniciar carona, marcar passageiros ausentes, finalizar.<br>• Avaliar passageiro e abrir denúncia.<br>• Sacar dinheiro da carteira via Pix. | • Avaliar passageiros sem concluir carona.<br>• Oferecer caronas com CNH/CRLV vencidos.<br>• Oferecer 2 caronas com <30min de intervalo.<br>• Editar ponto de encontro após publicado.<br>• Editar horário ou vagas com <1h de antecedência.<br>• Visualizar CPF/dados sensíveis do passageiro. |
| **Administrador** | Gestor da plataforma | • Gerenciar Pontos de Encontro oficiais (CRUD, inativar).<br>• Definir valor da ficha (R$ 2,00).<br>• Validar/aprovar CPF, CNH e CRLV.<br>• Suspender, banir ou reativar contas com justificativa.<br>• Realizar estornos de fichas e arbitrar contestações.<br>• Acessar relatórios e métricas de desempenho. | • Participar de caronas como usuário (privilégio).<br>• Alterar notas/avaliações manualmente.<br>• Excluir histórico físico (sem soft delete).<br>• Acessar dados/documentos sem log de auditoria.<br>• Gerar fichas arbitrárias sem estorno formal. |

---

## 📝 4. Escopo Funcional (User Stories)

> Uma story por vez, no formato do modelo abaixo. Cada uma carrega dois eixos:
> **Prioridade (MoSCoW)** — `Must Have` é o escopo comprometido do projeto
> (o escopo mínimo da ficha é `Must Have` por definição); `Should`/`Could`
> entram se sobrar tempo, mas ficam documentadas — nada se perde; o
> `Won't Have` vira item da seção *Fora de Escopo* — e **Tamanho (esforço)** —
> `S` cabe numa sessão, `M` vira algumas tarefas no plano, `L` pede divisão.
> Toda story nasce `Draft` — **só você promove a `Ready`**.
### Must Have (Escopo Obrigatório)

### US01 — [título] · `Must|Should|Could Have` · `S|M|L` · Status: `Draft`
- **US01 — Cadastro e Autenticação de Usuário** · `M` · Status: `Ready`
  Como usuário, quero criar e acessar conta usando e-mail institucional e código OTP, para autenticação segura passwordless.
- **US02 — Compra de Fichas na Carteira Digital** · `M` · Status: `Ready`
  Como passageiro, quero comprar fichas via Pix ou Cartão com confirmação assíncrona (webhook), para saldo de reservas.
- **US03 — Homologação de Perfil de Condutor** · `M` · Status: `Draft`
  Como passageiro >18 anos, quero enviar CNH e CRLV, para aprovação de perfil de condutor pelo administrador.
- **US04 — Gestão de Pontos de Encontro** · `S` · Status: `Draft`
  Como administrador, quero cadastrar e desativar pontos (soft delete), para restringir caronas a locais válidos.
- **US05 — Publicação de Carona** · `M` · Status: `Draft`
  Como condutor, quero publicar carona (sentido, data, hora, vagas, ponto) com 1h30 de antecedência mínima.
- **US06 — Busca e Reserva de Vaga** · `M` · Status: `Draft`
  Como passageiro, quero filtrar caronas e reter ficha para solicitar reserva, aguardando aceite (com estorno em 5min).
- **US07 — Gestão da Carona e Presença** · `M` · Status: `Draft`
  Como condutor, quero iniciar carona (após marcar presenças/ausências) e finalizá-la, disparando prazos de pagamento.
- **US08 — Cancelamento de Reserva Confirmada** · `S` · Status: `Draft`
  Como passageiro, quero cancelar reserva confirmada (estorno total se >1h; perda e +2 pontos na carteira se <1h).
- **US11 — Aceitar/Recusar Reserva** · `M` · Status: `Draft`
  Como condutor, quero aceitar ou recusar reservas pendentes (recusa esgota vaga ou expira solicitações).
- **US12 — Editar Vagas de Carona Publicada** · `S` · Status: `Draft`
  Como condutor, quero aumentar ou reduzir vagas não preenchidas com >1h de antecedência (máx 4 vagas).
- **US13 — Cancelamento de Carona pelo Condutor** · `M` · Status: `Draft`
  Como condutor, quero cancelar carona (sem penalidade se >1h; estorno geral e +2 pontos ao condutor se <1h).
- **US14 — Expiração por Falta de Início** · `S` · Status: `Draft`
  Como sistema, quero expirar caronas 1h após agendamento sem início, estornando reservas e punindo condutor (4 pts).
- **US15 — Expiração por Falta de Finalização** · `S` · Status: `Draft`
  Como sistema, quero auto-finalizar caronas em andamento após 12h, iniciando a janela de repasse do pagamento.
- **US16 — Contestação Simplificada** · `M` · Status: `Draft`
  Como passageiro, quero abrir contestação em até 24h pós-finalização; admin julga (reverter ou manter) e fecha caso.
- **US17 — Saque de Saldo via Pix** · `S` · Status: `Draft`
  Como condutor, quero converter fichas limpas e solicitar repasse monetário real (R$) via chave Pix.
- **US18 — Relatórios e Métricas** · `S` · Status: `Draft`
  Como admin, quero visualizar painel de funil, rankings de pontos e horários para medir o sucesso.
- **US19 — Edição de Perfil e Documentos** · `S` · Status: `Draft`
  Como usuário, quero atualizar documentos vencidos, reativando a publicação (mas não uso) de caronas.
- **US20 — Alterar Status do Usuário** · `S` · Status: `Draft`
  Como admin, quero suspender, banir ou reativar granularmente o acesso de infratores com motivo logado.

**Como** [perfil], **eu quero** [ação] **para que** [objetivo].
### Should Have (Escopo Flexível)

**Critérios de aceite:**
- **US09 — Avaliação Mútua Pós-Carona**
- **US10 — Registro de Denúncias**
- **US12b — Editar Horário da Carona (mesmo dia)**
- **US22 — Doação de Fichas entre Usuários**

- [ ] **Dado** [contexto], **quando** [ação], **então** [resultado verificável].
- [ ] **Dado** [o caminho triste: erro, vazio, abandono], **quando** …, **então** …

**Regras relacionadas:** RNnn

---

## 🛡️ 5. Regras de Negócio (Constraints)

| ID | Regra |
| :-- | :---- |
| RN01 | |
| **RN01** | Autenticação exclusiva via e-mail institucional validado (passwordless OTP). |
| **RN02** | Condutor exige conta de passageiro ativa, ser maior de 18 anos, CNH e CRLV. |
| **RN03** | CPF, CNH e CRLV precisam de aprovação manual do Administrador. |
| **RN04** | Documento de condutor vencido bloqueia novas caronas, mantendo permissões de passageiro e caronas agendadas intactas. |
| **RN05/06** | Fichas (créditos) compradas apenas via gateway, não de forma arbitrária. Valor Fixo: R$ 2,00. |
| **RN11** | É proibido oferecer ou reservar duas caronas com menos de 30 minutos de intervalo de agenda. |
| **RN13/14** | Cancelamento antecipado (>1h) é isento; cancelamento tardio (<1h) gera +2 pontos de penalidade. |
| **RN17/19** | Atingir 10 pontos na carteira suspende a função (reservar ou ofertar) por 1 mês automático. |
| **RN21** | No-show de passageiro na origem retém 100% da ficha sem pontos adicionais de penalidade. |
| **RN22** | No-show de condutor (carona expirada por falta de início): 4 pontos de penalidade. |
| **RN25** | Pagamentos a condutores liberados automaticamente 24h pós-finalização sem contestação. |
| **RN34** | Publicação de carona restrita exclusivamente a Pontos de Encontro ativos cadastrados. |
| **RN35** | Antecedência mínima obrigatória de 1h30 para publicar qualquer nova carona. |
| **RN36** | Vagas por carona limitadas de 1 a 4, independentemente de capacidade física do veículo. |
| **RN37/38** | Aceite manual do condutor confirma a reserva. Inação de 30min expira solicitação e estorna ficha. |

*(Nota: a numeração das regras reflete os debates durante o levantamento de requisitos)*

---

## 🚫 6. Fora de Escopo (Non-goals)

> O que o produto deliberadamente **não** faz neste semestre — o `Won't Have`
> do MoSCoW, com o motivo de cada corte.
- Chat interno em tempo real (substituído por troca de usernames do Discord após confirmação).
- Rastreamento de GPS ao vivo no mapa durante o trajeto.
- Pontos intermediários no trajeto (apenas origem/destino fixo entre Ponto Oficial e Campus).
- Painel complexo de moderação de denúncias (julgamento de texto manual).
- Pagamento parcelado ou por cartão de débito.
- Destinos arbitrários que não envolvam o campus da UTFPR.

-

---

## ⚙️ 7. Requisitos Não Funcionais (Qualidade)

> Só os que você consegue justificar na defesa.
- **RNF01:** Segurança: Autenticação via OTP por e-mail institucional restrito (JWT + Refresh Token).
- **RNF03/04:** Segurança/Auditoria: HTTPS rígido e geração de log em acessos a documentos (CPF/CNH/CRLV).
- **RNF05:** Segurança: Role-Based Access Control (RBAC) no nível das requisições de API (Guards/Pipes).
- **RNF06:** Segurança: Dados sensíveis de cartão gerenciados unicamente pelo gateway de pagamento (sandbox).
- **RNF07:** Confiabilidade: Nenhuma exclusão física de registros essenciais (Soft Delete imposto a todos os relatórios).
- **RNF08:** Confiabilidade: Atomicidade e transações consistentes nas operações de ficha/reserva.
- **RNF09:** Confiabilidade: Jobs recorrentes processáveis/idempotentes para expiração e pagamentos (cron).
- **RNF10:** Privacidade: Conformidade estrutural com a LGPD (remoção controlada, logs).
- **RNF11/12:** Usabilidade: Responsividade plena e clareza textual dos retornos e bloqueios de regra de negócio.
- **RNF13/14:** Desempenho e Disponibilidade: Listagem eficiente indexada via banco relacional nos picos de entrada universitária.

-

---

## 🛠️ 8. Histórico

| Data | Versão | O que mudou |
| :--- | :----- | :---------- |
| | 1.0.0 | Versão inicial via `/utf-prd` |
| 2026-09-20 | 1.0.0 | Versão inicial gerada por entrevista /utf-prd (Fluxo fechado, escopo completo) |
