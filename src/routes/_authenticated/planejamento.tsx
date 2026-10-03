import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, ChartNoAxesCombined, PiggyBank, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceLayout, money } from "@/components/finance-layout";

export const Route = createFileRoute("/_authenticated/planejamento")({
  head: () => ({ meta: [{ title: "Planejamento — Plano Anti-Dívidas" }] }),
  component: PlanejamentoPage,
});

function PlanejamentoPage() {
  const { user } = Route.useRouteContext();
  const { data } = useQuery({
    queryKey: ["planning", user.id],
    queryFn: async () => {
      const [budgets, pigs, tx] = await Promise.all([
        supabase.from("budgets").select("*").eq("user_id", user.id).order("month", { ascending: false }),
        supabase.from("piggy_banks").select("*").eq("user_id", user.id),
        supabase.from("financial_transactions").select("amount_cents,type,category,occurred_on").eq("user_id", user.id),
      ]);
      if (budgets.error) throw budgets.error;
      if (pigs.error) throw pigs.error;
      if (tx.error) throw tx.error;
      return { budgets: budgets.data ?? [], pigs: pigs.data ?? [], tx: tx.data ?? [] };
    },
  });
  const income = (data?.tx ?? []).filter(t => t.type === "income").reduce((s, t) => s + t.amount_cents, 0);
  const expenses = (data?.tx ?? []).filter(t => t.type === "expense").reduce((s, t) => s + t.amount_cents, 0);
  const budgeted = (data?.budgets ?? []).reduce((s, b) => s + b.limit_cents, 0);
  return <FinanceLayout><div className="space-y-6">
    <div><p className="text-sm text-muted-foreground">Orçamento e acompanhamento</p><h1 className="text-3xl font-bold">Planejamento</h1></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric title="Receitas registradas" value={money(income)} />
      <Metric title="Gastos registrados" value={money(expenses)} />
      <Metric title="Orçamento cadastrado" value={money(budgeted)} />
      <Metric title="Metas ativas" value={String((data?.pigs ?? []).filter(p => p.status !== "completed").length)} />
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ChartNoAxesCombined className="size-5"/>Orçamento</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Defina limites por categoria para acompanhar seus gastos mensais.</p><Button asChild className="mt-4"><Link to="/lancamentos">Ir para lançamentos</Link></Button></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><PiggyBank className="size-5"/>Metas</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Seus porquinhos centralizam metas, prazo e progresso.</p><Button asChild className="mt-4"><Link to="/porquinhos">Ver porquinhos</Link></Button></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><CalendarDays className="size-5"/>Calendário financeiro</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Use as datas dos lançamentos e vencimentos para organizar o mês.</p><Button asChild variant="outline" className="mt-4"><Link to="/lancamentos">Ver histórico</Link></Button></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Target className="size-5"/>Próximas etapas</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">A estrutura de orçamento, recorrências, relatórios e desafio pode crescer a partir dos dados reais já conectados.</p></CardContent></Card>
    </div>
  </div></FinanceLayout>;
}
function Metric({ title, value }: { title: string; value: string }) {
  return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{title}</p><p className="mt-2 text-2xl font-bold">{value}</p></CardContent></Card>;
}
