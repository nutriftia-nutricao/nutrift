# AGENTES.md — Nutrift

Este documento define a arquitetura, comportamento dos agentes, regras de produto, lógica de negócio e integração com banco de dados do aplicativo Nutrift.

Este arquivo é a fonte oficial de verdade do projeto.

---

## 1. Visão do Produto

Nutrift é um aplicativo focado em **aderência ao plano alimentar**, não apenas em registro de calorias.

O objetivo do produto é ajudar o usuário a:

- receber um plano alimentar semanal realista
- executar esse plano no dia a dia
- manter consistência
- obter resultado através de disciplina e clareza

O Nutrift não é apenas um contador de calorias.

O Nutrift é um sistema de **execução de plano alimentar**.

---

## 2. Estrutura do App

Abas principais:

1. Hoje
2. Progresso
3. Agente (Nuti)
4. Perfil

### 2.1 Tela Hoje

A tela Hoje é a principal do aplicativo.

Ela deve mostrar:

- calendário semanal
- refeições do dia selecionado
- alimentos por refeição
- check de execução por alimento
- macros consumidos do dia
- hidratação
- futuramente atividade física

Função principal da tela:

**executar o plano alimentar do dia**

---

## 3. Calendário Semanal

O calendário semanal na tela Hoje possui duas funções:

1. Navegação entre os dias
2. Indicador visual de consistência

Ao tocar em um dia:

- o `selectedCalendarDate` deve mudar
- a tela deve exibir o plano daquele dia
- se o dia não for hoje, continua funcionando normalmente

### 3.1 Status visuais do calendário

Status possíveis:

- `complete`
- `partial`
- `off_plan`
- `empty`

### 3.2 Cálculo da aderência diária

A aderência do dia é baseada em **alimentos executados**, não em refeições e não apenas em macros.

Fórmula:

- `total_foods` = total de alimentos planejados no dia
- `checked_foods` = total de alimentos com `is_checked = true`

```txt
adherence = checked_foods / total_foods