import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, CreditCard, PiggyBank, WalletCards } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceLayout, money } from "@/components/finance-layout";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({ meta: [{ title: "Visão geral — Plano Anti-Dívidas" }] }),
  component: InicioPage,
});

function InicioPage() {
  const { user } = Route.useRouteContext();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user.id],
    queryFn: async () => {
      const [tx, debts, pigs] = await Promise.all([
        supabase.from("financial_transactions").select("amount_cents,type,description,category,occurred_on").eq("user_id", user.id).order("occurred_on", { ascending: false }),
        supabase.from("debts").select("id,name,original_amount_cents,paid_amount_cents,status").eq("user_id", user.id),
        supabase.from("piggy_banks").select("id,name,current_amount_cents,target_amount_cents,status").eq("user_id", user.id),
      ]);
      if (tx.error) throw tx.error;
      if (debts.error) throw debts.error;
      if (pigs.error) throw pigs.error;
      return { tx: tx.data ?? [], debts: debts.data ?? [], pigs: pigs.data ?? [] };
    },
  });

  const transactions = data?.tx ?? [];
  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount_cents, 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount_cents, 0);
  const debtTotal = (data?.debts ?? []).filter(d => d.status !== "paid").reduce((s, d) => s + Math.max(0, d.original_amount_cents - d.paid_amount_cents), 0);
  const saved = (data?.pigs ?? []).reduce((s, p) => s + p.current_amount_cents, 0);

  return <FinanceLayout><div className="space-y-6">
    <div><p className="text-sm text-muted-foreground">Seu centro financeiro</p><h1 className="text-3xl font-bold tracking-tight">Visão geral</h1></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Summary title="Saldo" value={money(income - expenses)} icon={<WalletCards className="size-5" />} />
      <Summary title="Receitas" value={money(income)} icon={<ArrowUpCircle className="size-5" />} />
      <Summary title="Gastos" value={money(expenses)} icon={<ArrowDownCircle className="size-5" />} />
      <Summary title="Dívidas em aberto" value={money(debtTotal)} icon={<CreditCard className="size-5" />} />
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2"><CardHeader><CardTitle>Últimos lançamentos</CardTitle></CardHeader><CardContent>
        {isLoading ? <p className="text-sm text-muted-foreground">Carregando seus dados...</p> :
          transactions.length === 0 ? <div className="space-y-3"><p className="text-sm text-muted-foreground">Ainda não há lançamentos.</p><Button asChild><a href="/lancamentos">Adicionar lançamento</a></Button></div> :
          <div className="space-y-3">{transactions.slice(0, 6).map(t => <div key={t.description + t.occurred_on + t.amount_cents} className="flex items-center justify-between border-b pb-3 last:border-0">
            <div><p className="font-medium">{t.description}</p><p className="text-xs text-muted-foreground">{t.category} · {new Date(t.occurred_on).toLocaleDateString("pt-BR")}</p></div>
            <span className={t.type === "income" ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>{t.type === "income" ? "+" : "-"}{money(t.amount_cents)}</span>
          </div>)}</div>}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Meu Porquinho</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="flex items-center gap-3"><PiggyBank className="size-8 text-primary" /><div><p className="text-2xl font-bold">{money(saved)}</p><p className="text-sm text-muted-foreground">guardado nas metas</p></div></div>
        {(data?.pigs ?? []).slice(0, 3).map(p => <div key={p.id}><div className="flex justify-between text-sm"><span>{p.name}</span><span>{money(p.current_amount_cents)}</span></div><div className="mt-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{width: Math.min(100, p.target_amount_cents ? p.current_amount_cents / p.target_amount_cents * 100 : 0) + "%"}} /></div></div>)}
        <Button asChild variant="outline" className="w-full"><a href="/porquinhos">Gerenciar metas</a></Button>
      </CardContent></Card>
    </div>
  </div></FinanceLayout>;
}

function Summary({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <Card><CardContent className="p-5"><div className="mb-3 flex items-center gap-2 text-muted-foreground">{icon}<span className="text-sm">{title}</span></div><p className="text-2xl font-bold">{value}</p></CardContent></Card>;
}
