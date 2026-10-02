import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Transaction = Tables<"financial_transactions">;
export type Debt = Tables<"debts">;
export type DebtPayment = Tables<"debt_payments">;
export type PiggyBank = Tables<"piggy_banks">;
export type PiggyMovement = Tables<"piggy_movements">;
export type Budget = Tables<"budgets">;
export type Recurring = Tables<"recurring_transactions">;
export type Challenge = Tables<"challenge_progress">;

export const expenseCategories = ["Alimentação","Mercado","Transporte","Casa","Contas","Saúde","Educação","Lazer","Compras","Assinaturas","Outros"];
export const incomeCategories = ["Salário","Renda extra","Comissão","Vendas","Benefícios","Outros"];
export const paymentMethods = ["Pix","Dinheiro","Débito","Crédito","Boleto","Transferência","Outros"];
export const debtTypes = ["Cartão","Empréstimo","Financiamento","Conta atrasada","Cheque especial","Familiar/amigo","Outros"];
export const piggyCategories = ["Reserva de emergência","Comprar uma moto","Viagem","Quitar dívida","Comprar celular","Entrada de imóvel","Meta personalizada"];
export const challengeTasks = ["Cadastre todas as suas dívidas","Registre todos os gastos de hoje","Identifique três gastos desnecessários","Revise suas assinaturas","Defina seu orçamento","Anote todas as entradas de dinheiro","Descubra qual dívida tem os maiores juros","Passe um dia sem gastos extras","Liste seus gastos fixos do mês","Compare preços de uma compra da semana","Escolha sua estratégia de pagamento","Pesquise condições melhores para uma dívida","Cancele uma assinatura que não usa","Planeje as refeições da semana","Revise o orçamento na metade do desafio","Venda ou doe algo que não usa","Defina uma meta de reserva","Pague uma parcela antes do vencimento","Evite compras por impulso hoje","Revise seus gastos por categoria","Espere 24h antes de uma compra","Separe um valor para sua meta","Reduza uma categoria em 10%","Confira os próximos vencimentos","Pense numa renda extra possível","Revise o progresso das dívidas","Registre todos os gastos sem falhar","Ajuste os limites do orçamento","Escreva por que quer sair das dívidas","Comemore e defina o próximo passo"];

export function formatBRL(cents: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100); }
export function parseBRL(value: string) { const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", "."); return Math.round((Number.parseFloat(normalized) || 0) * 100); }
export function today() { return new Date().toISOString().slice(0, 10); }
export function monthStart(offset = 0) { const date = new Date(); date.setMonth(date.getMonth() + offset, 1); return date.toISOString().slice(0, 10); }
export function monthEnd(offset = 0) { const date = new Date(); date.setMonth(date.getMonth() + offset + 1, 0); return date.toISOString().slice(0, 10); }
export function daysUntil(date?: string | null) { if (!date) return null; return Math.ceil((new Date(`${date}T12:00:00`).getTime() - new Date(`${today()}T12:00:00`).getTime()) / 86400000); }

async function ownRows<T>(table: "financial_transactions"|"debts"|"debt_payments"|"piggy_banks"|"piggy_movements"|"budgets"|"recurring_transactions"|"challenge_progress") {
  const { data, error } = await supabase.from(table).select("*");
  if (error) throw error;
  return data as T[];
}

export function useFinanceData(userId: string) {
  return useQuery({
    queryKey: ["finance", userId],
    queryFn: async () => {
      const [transactions, debts, payments, piggies, movements, budgets, recurring, challenge] = await Promise.all([
        ownRows<Transaction>("financial_transactions"), ownRows<Debt>("debts"), ownRows<DebtPayment>("debt_payments"), ownRows<PiggyBank>("piggy_banks"), ownRows<PiggyMovement>("piggy_movements"), ownRows<Budget>("budgets"), ownRows<Recurring>("recurring_transactions"), ownRows<Challenge>("challenge_progress"),
      ]);
      return { transactions, debts, payments, piggies, movements, budgets, recurring, challenge };
    },
  });
}
