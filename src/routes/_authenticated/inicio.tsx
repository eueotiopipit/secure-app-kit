import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, CreditCard, PiggyBank, Plus, Target, WalletCards } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FinanceLayout, money } from "@/components/finance-layout";

export const Route = createFileRoute("/_authenticated/inicio")({ head: () => ({ meta: [{ title: "Visão geral — Plano Anti-Dívidas" }] }), component: InicioPage });

function InicioPage() {
  const { user } = Route.useRouteContext();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user.id],
    queryFn: async () => {
      const [profile, tx, debts, pigs] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("financial_transactions").select("id,amount_cents,type,description,category,occurred_on").eq("user_id", user.id).order("occurred_on", { ascending: false }),
        supabase.from("debts").select("id,name,original_amount_cents,paid_amount_cents,status").eq("user_id", user.id),
        supabase.from("piggy_banks").select("id,name,current_amount_cents,target_amount_cents,status,target_date").eq("user_id", user.id),
      ]);
      if (profile.error) throw profile.error; if (tx.error) throw tx.error; if (debts.error) throw debts.error; if (pigs.error) throw pigs.error;
      return { name: profile.data?.display_name ?? user.user_metadata?.display_name ?? "Usuário", tx: tx.data ?? [], debts: debts.data ?? [], pigs: pigs.data ?? [] };
    },
  });

  const transactions = data?.tx ?? [];
  const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount_cents, 0);
  const expenses = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount_cents, 0);
  const balance = income - expenses;
  const openDebts = (data?.debts ?? []).filter(d => d.status !== "paid");
  const debtTotal = openDebts.reduce((s, d) => s + Math.max(0, d.original_amount_cents - d.paid_amount_cents), 0);
  const debtPaid = (data?.debts ?? []).reduce((s, d) => s + d.paid_amount_cents, 0);
  const debtOriginal = (data?.debts ?? []).reduce((s, d) => s + d.original_amount_cents, 0);
  const saved = (data?.pigs ?? []).reduce((s, p) => s + p.current_amount_cents, 0);
  const goalTarget = (data?.pigs ?? []).reduce((s, p) => s + p.target_amount_cents, 0);
  const savingProgress = goalTarget > 0 ? Math.min(100, saved / goalTarget * 100) : 0;
  const expenseItems = transactions.filter(t => t.type === "expense").slice(0, 5);
  const incomeItems = transactions.filter(t => t.type === "income").slice(0, 5);
  const topGoals = (data?.pigs ?? []).slice(0, 3);

  return <FinanceLayout><div className="space-y-8">
    <div><p className="text-sm text-muted-foreground">Seu centro financeiro</p><h1 className="text-3xl font-bold tracking-tight">Olá, {data?.name?.split(" ")[0] ?? "usuário"} 👋</h1><p className="mt-1 text-muted-foreground">Acompanhe seu dinheiro e avance para uma vida financeira mais leve.</p></div>
    <section className="space-y-4"><div><h2 className="text-xl font-semibold">Resumo financeiro</h2><p className="text-sm text-muted-foreground">Tudo que você já registrou no aplicativo.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Summary title="Saldo" value={money(balance)} icon={<WalletCards className="size-5" />} /><Summary title="Receitas" value={money(income)} icon={<ArrowUpCircle className="size-5" />} /><Summary title="Gastos" value={money(expenses)} icon={<ArrowDownCircle className="size-5" />} /><Summary title="Dívidas em aberto" value={money(debtTotal)} icon={<CreditCard className="size-5" />} />
    </div></section>
    <section className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ArrowDownCircle className="size-5 text-red-500" />Gastos</CardTitle><CardDescription>Veja onde seu dinheiro está sendo usado.</CardDescription></CardHeader><CardContent>
        {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : expenseItems.length === 0 ? <EmptyState text="Nenhum gasto registrado ainda." href="/lancamentos" action="Adicionar gasto" /> : <div className="space-y-3">{expenseItems.map(t => <TransactionRow key={t.id} description={t.description} category={t.category} date={t.occurred_on} amount={t.amount_cents} positive={false} />)}</div>}
        <Button asChild variant="outline" className="mt-4 w-full"><a href="/lancamentos">Ver todos os gastos</a></Button>
      </CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ArrowUpCircle className="size-5 text-emerald-600" />Receitas</CardTitle><CardDescription>Acompanhe tudo que entrou no seu caixa.</CardDescription></CardHeader><CardContent>
        {isLoading ? <p className="text-sm text-muted-foreground">Carregando...</p> : incomeItems.length === 0 ? <EmptyState text="Nenhuma receita registrada ainda." href="/lancamentos" action="Adicionar receita" /> : <div className="space-y-3">{incomeItems.map(t => <TransactionRow key={t.id} description={t.description} category={t.category} date={t.occurred_on} amount={t.amount_cents} positive />)}</div>}
        <Button asChild variant="outline" className="mt-4 w-full"><a href="/lancamentos">Ver todas as receitas</a></Button>
      </CardContent></Card>
    </section>
    <section className="space-y-4"><div><h2 className="text-xl font-semibold">Junte dinheiro e saia das dívidas</h2><p className="text-sm text-muted-foreground">Transforme seu dinheiro em metas e acompanhe cada passo para reduzir suas dívidas.</p></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><PiggyBank className="size-5" />Junte seu dinheiro</CardTitle><CardDescription>Crie metas e veja seu progresso crescer.</CardDescription></CardHeader><CardContent className="space-y-4">
          <div className="flex items-end justify-between"><div><p className="text-2xl font-bold">{money(saved)}</p><p className="text-sm text-muted-foreground">guardado nas metas</p></div><p className="text-sm font-medium">{goalTarget ? Math.round(savingProgress) + "% da meta total" : "Comece uma meta"}</p></div>
          <Progress value={savingProgress} /><div className="space-y-3">{topGoals.length === 0 ? <EmptyState text="Você ainda não criou uma meta." href="/porquinhos" action="Criar porquinho" /> : topGoals.map(p => { const progress = p.target_amount_cents > 0 ? Math.min(100, p.current_amount_cents / p.target_amount_cents * 100) : 0; return <div key={p.id}><div className="mb-1 flex justify-between text-sm"><span className="font-medium">{p.name}</span><span>{money(p.current_amount_cents)} / {money(p.target_amount_cents)}</span></div><Progress value={progress} /></div>; })}</div>
          <Button asChild className="w-full"><a href="/porquinhos"><Plus className="size-4" />Juntar dinheiro</a></Button>
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Target className="size-5" />Saia das dívidas</CardTitle><CardDescription>Acompanhe quanto já foi pago e quanto ainda falta.</CardDescription></CardHeader><CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4"><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Ainda falta</p><p className="mt-1 text-xl font-bold">{money(debtTotal)}</p></div><div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">Já pago</p><p className="mt-1 text-xl font-bold text-emerald-600">{money(debtPaid)}</p></div></div>
          {debtOriginal > 0 ? <><div className="flex justify-between text-sm"><span>Progresso das dívidas</span><span>{Math.min(100, debtPaid / debtOriginal * 100).toFixed(0)}%</span></div><Progress value={Math.min(100, debtPaid / debtOriginal * 100)} /></> : <EmptyState text="Cadastre suas dívidas para acompanhar seu progresso." href="/dividas" action="Cadastrar dívida" />}
          <div className="space-y-3">{openDebts.slice(0, 3).map(d => { const progress = d.original_amount_cents > 0 ? Math.min(100, d.paid_amount_cents / d.original_amount_cents * 100) : 0; return <div key={d.id} className="rounded-xl border p-3"><div className="mb-2 flex justify-between gap-3 text-sm"><span className="font-medium">{d.name}</span><span>{progress.toFixed(0)}%</span></div><Progress value={progress} /></div>; })}</div>
          <Button asChild variant="outline" className="w-full"><a href="/dividas">Organizar minhas dívidas</a></Button>
        </CardContent></Card>
      </div>
    </section>
  </div></FinanceLayout>;
}
function Summary({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) { return <Card><CardContent className="p-5"><div className="mb-3 flex items-center gap-2 text-muted-foreground">{icon}<span className="text-sm">{title}</span></div><p className="text-2xl font-bold">{value}</p></CardContent></Card>; }
function TransactionRow({ description, category, date, amount, positive }: { description: string; category: string; date: string; amount: number; positive: boolean }) { return <div className="flex items-center justify-between gap-4 border-b pb-3 last:border-0"><div className="min-w-0"><p className="truncate font-medium">{description}</p><p className="text-xs text-muted-foreground">{category} · {new Date(date).toLocaleDateString("pt-BR")}</p></div><span className={positive ? "shrink-0 font-semibold text-emerald-600" : "shrink-0 font-semibold text-red-600"}>{positive ? "+" : "-"}{money(amount)}</span></div>; }
function EmptyState({ text, href, action }: { text: string; href: string; action: string }) { return <div className="rounded-xl border border-dashed p-5 text-center"><p className="text-sm text-muted-foreground">{text}</p><Button asChild variant="ghost" className="mt-2"><a href={href}>{action}</a></Button></div>; }
