# Plano Anti-Dívidas — evolução para SaaS financeiro

## Objetivo
Evoluir o app existente sem recomeçar: preservar login Google, email/senha, recuperação, sessão, perfil e identidade visual; substituir a atual tela logada simples por um produto financeiro completo, persistente, seguro e mobile-first.

## 1. Base visual e navegação
- Renomear a experiência para **Plano Anti-Dívidas** em títulos, textos e metadados.
- Extrair o sistema visual atual (fundo escuro, acento dourado, tipografia e profundidade) para tokens e componentes reutilizáveis.
- Criar a estrutura interna responsiva: barra inferior no celular, menu lateral no desktop, cabeçalho de contexto e botão de adição rápida.
- Criar componentes reutilizáveis para valores, progresso, estados vazios, formulários, cartões financeiros, alertas e gráficos.
- Manter animações discretas, acessibilidade, áreas de toque confortáveis e formulários otimizados para teclado numérico.

## 2. Banco e segurança
- Manter `profiles` e acrescentar campos financeiros de preferência/perfil quando necessários.
- Criar tabelas privadas para:
  - transações (receitas e gastos);
  - dívidas e pagamentos;
  - porquinhos e movimentações;
  - limites de orçamento;
  - transações recorrentes;
  - progresso do desafio;
  - alertas;
  - respostas do diagnóstico e propostas de renegociação.
- Usar valores monetários em centavos, datas explícitas, validações de domínio, índices por usuário/data e atualização automática de `updated_at`.
- Aplicar permissões e RLS separadas para leitura, criação, edição e exclusão em cada tabela, sempre limitadas ao usuário autenticado.
- Validar propriedade também nas relações filhas, impedindo pagamentos ou movimentações ligados a registros de outro usuário.
- Nunca usar armazenamento local como fonte principal nem expor credenciais privilegiadas.

## 3. Fluxos principais
- **Dashboard:** saldo, receitas, gastos, dívidas restantes, parcelas, valor guardado, metas, vencimentos e insights calculados com dados reais.
- **Lançamentos:** CRUD completo de gastos e receitas, categorias, recorrência, busca, filtros, totais e comparação mensal.
- **Dívidas:** cadastro, edição, exclusão, progresso, parcelas, vencimentos, histórico de pagamentos e quitação automática com celebração discreta.
- **Diagnóstico:** questionário guiado, análise educativa por cenário e caminhos de organização, priorização, renegociação ou revisão do orçamento.
- **Comparador:** custo atual versus proposta, entrada, parcelas, juros, desconto, custo total e impacto mensal, sem decidir pelo usuário.
- **Central de perguntas:** respostas curtas e responsáveis para dúvidas comuns sobre dívidas.
- **Porquinhos:** criação, depósitos, retiradas, histórico, ritmo da meta, valores diário/semanal/mensal e previsão pelo valor que o usuário consegue guardar.
- **Orçamento:** limites mensais por categoria, consumo visual e alertas próximos ou acima do limite.
- **Recorrências e calendário:** regras de repetição, lançamentos gerados sem duplicidade e visão mensal unificada.
- **Relatórios:** evolução mensal, receitas versus gastos, categorias, dívidas e porquinhos em gráficos responsivos.
- **Desafio 30 dias:** lista persistente, progresso e pequenas recompensas visuais.
- **Perfil:** nome, foto disponível, preferências básicas, alteração de senha adequada e logout seguro.

## 4. Estrutura técnica
- Manter TanStack Start, rotas protegidas existentes e o cliente gerenciado do Lovable Cloud.
- Organizar as áreas internas em rotas próprias sob a proteção atual, com uma estrutura compartilhada de navegação.
- Centralizar tipos, validações com Zod, formatação monetária e cálculos financeiros puros e testáveis.
- Fazer leituras e mutações autenticadas com cache e invalidação consistentes; o banco continua sendo a fonte da verdade.
- Registrar decisões estruturais no guia técnico do projeto e manter o roteiro de implementação atualizado.

## 5. Ordem de entrega
1. Banco, políticas, tipos e utilitários financeiros.
2. Estrutura visual interna, navegação e perfil.
3. Dashboard, gastos e receitas.
4. Dívidas, pagamentos, diagnóstico, comparador e perguntas.
5. Porquinhos e plano de meta.
6. Orçamento, recorrências, calendário, relatórios e desafio.
7. Revisão visual e funcional completa.

## 6. Validação antes da conclusão
- Testar criação, edição, exclusão, busca, filtros e cálculos dos fluxos principais.
- Confirmar persistência após sair e entrar novamente.
- Testar isolamento com dois usuários para leitura, criação, edição e exclusão, inclusive relações filhas.
- Verificar estados vazios, carregamento, erro, vencido, quitado e meta concluída.
- Revisar celular e desktop, console, rede, acessibilidade e consistência visual.
- Executar revisão de segurança do banco e dependências.
- Entregar relatório final com o que foi implementado, banco, autenticação, políticas, testes, correções e pendências reais de produção.
