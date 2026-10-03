import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronRight,
  CalendarClock,
  CreditCard,
  PiggyBank,
  Plus,
  Receipt,
  ReceiptText,
  BarChart3,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Target,
  Wallet,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FinanceLayout, money } from "@/components/finance-layout";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({ meta: [{ title: "Visão geral — Plano Anti-Dívidas" }] }),
  component: InicioPage,
});

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
      if (profile.error) throw profile.error;
      if (tx.error) throw tx.error;
      if (debts.error) throw debts.error;
      if (pigs.error) throw pigs.error;
      return {
        name: profile.data?.display_name ?? user.user_metadata?.display_name ?? "Usuário",
        tx: tx.data ?? [],
        debts: debts.data ?? [],
        pigs: pigs.data ?? [],
      };
    },
  });

  const transactions = data?.tx ?? [];
  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount_cents, 0);
  const expenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount_cents, 0);
  const balance = income - expenses;
  const openDebts = (data?.debts ?? []).filter((d) => d.status !== "paid");
  const debtTotal = openDebts.reduce((s, d) => s + Math.max(0, d.original_amount_cents - d.paid_amount_cents), 0);
  const debtPaid = (data?.debts ?? []).reduce((s, d) => s + d.paid_amount_cents, 0);
  const debtOriginal = (data?.debts ?? []).reduce((s, d) => s + d.original_amount_cents, 0);
  const debtProgress = debtOriginal > 0 ? Math.min(100, (debtPaid / debtOriginal) * 100) : 0;
  const saved = (data?.pigs ?? []).reduce((s, p) => s + p.current_amount_cents, 0);
  const goalTarget = (data?.pigs ?? []).reduce((s, p) => s + p.target_amount_cents, 0);
  const savingProgress = goalTarget > 0 ? Math.min(100, (saved / goalTarget) * 100) : 0;
  const recentTransactions = transactions.slice(0, 4);
  const topGoals = (data?.pigs ?? []).slice(0, 2);
  const [chartPeriod, setChartPeriod] = useState<7 | 30 | 180>(30);

  const movementChart = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: chartPeriod }, (_, index) => {
      const date = new Date(now);
      date.setHours(12, 0, 0, 0);
      date.setDate(now.getDate() - (chartPeriod - 1 - index));
      return date;
    });

    return days.map((date) => {
      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");
      const dayTransactions = transactions.filter((t) => t.occurred_on === key);
      const dayIncome = dayTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount_cents, 0);
      const dayExpense = dayTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount_cents, 0);

      return {
        label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", ""),
        income: dayIncome,
        expense: dayExpense,
      };
    });
  }, [transactions, chartPeriod]);

  const chartIncome = movementChart.reduce((sum, day) => sum + day.income, 0);
  const chartExpense = movementChart.reduce((sum, day) => sum + day.expense, 0);

  const futureTransactions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() + 7);
    return transactions
      .filter((t) => {
        const date = new Date(`${t.occurred_on}T12:00:00`);
        return date > today && date <= end;
      })
      .sort((a, b) => a.occurred_on.localeCompare(b.occurred_on));
  }, [transactions]);

  const futureIncome = futureTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount_cents, 0);
  const futureExpense = futureTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount_cents, 0);
  const futureByDay = Array.from(new Set(futureTransactions.map((t) => t.occurred_on)));

  return (
    <FinanceLayout>
      <div className="space-y-7 pb-6">
        <header className="space-y-1">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="size-4" /> Seu centro financeiro
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Olá, {data?.name?.split(" ")[0] ?? "usuário"} 👋
          </h1>
          <p className="text-sm text-muted-foreground">Veja o que está acontecendo com seu dinheiro hoje.</p>
        </header>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="size-4" /> Saldo atual
                </div>
                <p className="text-3xl font-bold tracking-tight sm:text-4xl">{money(balance)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Receitas e gastos registrados no app</p>
              </div>
              <div className="hidden size-11 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
                <Wallet className="size-5" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 border-t pt-4">
              <MiniValue icon={<ArrowUpCircle className="size-3.5 text-emerald-500" />} label="Receitas" value={money(income)} compact />
              <MiniValue icon={<ArrowDownCircle className="size-3.5 text-red-500" />} label="Gastos" value={money(expenses)} compact />
              <MiniValue icon={<CreditCard className="size-3.5 text-orange-500" />} label="Dívidas" value={money(debtTotal)} compact />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-semibold">
                Fluxo financeiro
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">dinâmico</span>
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">Compare o que entrou e saiu do seu dinheiro.</p>
            </div>
            <div className="flex shrink-0 rounded-lg border bg-background/60 p-1">
              {[7, 30, 180].map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => setChartPeriod(period as 7 | 30 | 180)}
                  className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${chartPeriod === period ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {period === 180 ? "6M" : `${period}D`}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3 flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-500"><span className="size-2 rounded-full bg-emerald-500" /> Entrou <strong>{money(chartIncome)}</strong></span>
            <span className="flex items-center gap-1.5 text-red-500"><span className="size-2 rounded-full bg-red-500" /> Saiu <strong>{money(chartExpense)}</strong></span>
          </div>
          <div className="h-[175px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movementChart} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(0 84% 60%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={chartPeriod === 7 ? 0 : chartPeriod === 30 ? 6 : 29} />
                <YAxis hide domain={[0, "auto"]} />
                <Tooltip cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "3 3" }} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 11, padding: "8px 10px" }} labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 4 }} formatter={(value, name) => [money(Number(value)), name === "income" ? "Receitas" : "Gastos"]} />
                <Area type="monotone" dataKey="income" stroke="hsl(142 71% 45%)" fill="url(#incomeFill)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} animationDuration={500} />
                <Area type="monotone" dataKey="expense" stroke="hsl(0 84% 60%)" fill="url(#expenseFill)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} animationDuration={500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <QuickAction href="/lancamentos" icon={<ArrowUpCircle />} tone="income" label="Adicionar receita" />
          <QuickAction href="/lancamentos" icon={<ArrowDownCircle />} tone="expense" label="Adicionar gasto" />
          <QuickAction href="/dividas" icon={<CreditCard />} tone="debt" label="Pagar dívida" />
          <QuickAction href="/porquinhos" icon={<PiggyBank />} tone="save" label="Guardar dinheiro" />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-semibold">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarClock className="size-4" />
                </span>
                Próximos dias
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">O que está previsto para entrar e sair</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Próximos 7 dias</p>
              <p className="text-xs font-semibold">
                <span className="text-emerald-500">+{money(futureIncome)}</span>
                <span className="mx-1 text-muted-foreground">·</span>
                <span className="text-red-500">-{money(futureExpense)}</span>
              </p>
            </div>
          </div>
          <Card>
            <CardContent className="p-3">
              {futureByDay.length === 0 ? (
                <div className="flex items-center gap-3 rounded-xl border border-dashed p-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CalendarClock className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Nada agendado para os próximos 7 dias</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Cadastre uma movimentação com uma data futura para acompanhar aqui.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {futureByDay.map((date) => {
                    const dayRows = futureTransactions.filter((t) => t.occurred_on === date);
                    const dayIncome = dayRows.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount_cents, 0);
                    const dayExpense = dayRows.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount_cents, 0);
                    return (
                      <div key={date} className="flex items-center gap-3 rounded-xl border p-3">
                        <div className="flex size-10 shrink-0 flex-col items-center justify-center rounded-lg bg-muted/60">
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                          </span>
                          <span className="text-sm font-bold">{new Date(`${date}T12:00:00`).getDate()}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{dayRows.length} {dayRows.length === 1 ? "movimentação" : "movimentações"}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
                          </p>
                        </div>
                        <div className="text-right text-xs font-semibold">
                          {dayIncome > 0 && <p className="text-emerald-500">+{money(dayIncome)}</p>}
                          {dayExpense > 0 && <p className="text-red-500">-{money(dayExpense)}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <SectionHeading icon={<ReceiptText className="size-5" />} title="Últimas movimentações" href="/lancamentos" action="Ver todas" />
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-5 text-sm text-muted-foreground">Carregando suas movimentações...</div>
              ) : recentTransactions.length === 0 ? (
                <div className="p-6 text-center">
                  <Receipt className="mx-auto mb-2 size-8 text-muted-foreground" />
                  <p className="font-medium">Nenhuma movimentação ainda</p>
                  <p className="mt-1 text-sm text-muted-foreground">Comece registrando uma receita ou um gasto.</p>
                  <Button asChild className="mt-4"><a href="/lancamentos"><Plus className="size-4" />Adicionar lançamento</a></Button>
                </div>
              ) : (
                <div>{recentTransactions.map((t) => (
                  <TransactionRow key={t.id} description={t.description} category={t.category} date={t.occurred_on} amount={t.amount_cents} positive={t.type === "income"} />
                ))}</div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="rounded-2xl border bg-muted/30 p-5 sm:p-6">
          <div className="mb-5">
            <p className="flex items-center gap-2 text-lg font-semibold"><Target className="size-5 text-primary" /> Seu próximo passo</p>
            <p className="mt-1 text-sm text-muted-foreground">Pequenas ações hoje deixam sua vida financeira mais leve.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ActionCard
              icon={<PiggyBank className="size-5" />}
              title="Junte seu dinheiro"
              value={money(saved)}
              description={goalTarget ? `${Math.round(savingProgress)}% das suas metas` : "Crie sua primeira meta"}
              progress={goalTarget ? savingProgress : undefined}
              href="/porquinhos"
              action="Ver metas"
            />
            <ActionCard
              icon={<CreditCard className="size-5" />}
              title="Saia das dívidas"
              value={money(debtTotal)}
              description={debtOriginal ? `${Math.round(debtProgress)}% já quitado` : "Cadastre suas dívidas"}
              progress={debtOriginal ? debtProgress : undefined}
              href="/dividas"
              action="Ver dívidas"
            />
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {topGoals.map((goal) => {
            const progress = goal.target_amount_cents > 0 ? Math.min(100, (goal.current_amount_cents / goal.target_amount_cents) * 100) : 0;
            return (
              <div key={goal.id} className="rounded-xl border bg-card p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm font-medium"><PiggyBank className="size-4 shrink-0 text-primary" /><span className="truncate">{goal.name}</span></span>
                  <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
                <p className="mt-2 text-xs text-muted-foreground">{money(goal.current_amount_cents)} de {money(goal.target_amount_cents)}</p>
              </div>
            );
          })}
        </section>
      </div>
    </FinanceLayout>
  );
}

function MiniValue({ icon, label, value, className = "", compact = false }: { icon: React.ReactNode; label: string; value: string; className?: string; compact?: boolean }) {
  return <div className={className}>
    <div className={`mb-0.5 flex items-center gap-1.5 text-muted-foreground ${compact ? "text-[10px]" : "text-xs"}`}>{icon}{label}</div>
    <p className={`truncate font-semibold ${compact ? "text-xs" : "text-sm"}`}>{value}</p>
  </div>;
}

function QuickAction({ href, icon, label, tone }: { href: string; icon: React.ReactNode; label: string; tone: "income" | "expense" | "debt" | "save" }) {
  const toneClass = {
    income: "bg-emerald-500/10 text-emerald-500",
    expense: "bg-red-500/10 text-red-500",
    debt: "bg-orange-500/10 text-orange-500",
    save: "bg-primary/10 text-primary",
  }[tone];

  return (
    <Button asChild variant="outline" className="group h-auto min-h-14 justify-start gap-2.5 rounded-xl border-border/80 px-3 text-left transition-all hover:-translate-y-0.5 hover:bg-accent/40 sm:justify-center">
      <a href={href}>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${toneClass}`}>
          <span className="[&>svg]:size-5">{icon}</span>
        </span>
        <span className="text-xs font-semibold sm:text-sm">{label}</span>
      </a>
    </Button>
  );
}

function SmartHub({ href, icon, title, text, action }: { href: string; icon: React.ReactNode; title: string; text: string; action: string }) {\n  return <a href={href} className="group rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span><ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5" /></div><p className="mt-4 font-semibold">{title}</p><p className="mt-1 text-sm text-muted-foreground">{text}</p><p className="mt-4 text-xs font-semibold text-primary">{action} →</p></a>;\n}\n\nfunction SectionHeading({ icon, title, href, action }: { icon: React.ReactNode; title: string; href: string; action: string }) {
  return <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-semibold">{icon}{title}</h2><Button asChild variant="ghost" size="sm" className="gap-1 text-xs"><a href={href}>{action}<ChevronRight className="size-3.5" /></a></Button></div>;
}

function ActionCard({ icon, title, value, description, progress, href, action }: { icon: React.ReactNode; title: string; value: string; description: string; progress?: number; href: string; action: string }) {
  return <div className="rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40">
    <div className="flex items-start justify-between gap-3">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      <Button asChild variant="ghost" size="sm" className="h-8 px-2"><a href={href}>{action}<ChevronRight className="ml-1 size-3.5" /></a></Button>
    </div>
    <p className="mt-4 text-sm font-medium">{title}</p>
    <p className="mt-1 text-xl font-bold">{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    {progress !== undefined && <Progress value={progress} className="mt-3 h-1.5" />}
  </div>;
}

function TransactionRow({ description, category, date, amount, positive }: { description: string; category: string; date: string; amount: number; positive: boolean }) {
  return <div className="flex items-center gap-3 border-b p-4 last:border-0">
    <div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${positive ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
      {positive ? <ArrowUpCircle className="size-5" /> : <ArrowDownCircle className="size-5" />}
    </div>
    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{description}</p><p className="truncate text-xs text-muted-foreground">{category} · {new Date(date).toLocaleDateString("pt-BR")}</p></div>
    <span className={`shrink-0 text-sm font-semibold ${positive ? "text-emerald-600" : "text-red-600"}`}>{positive ? "+" : "-"}{money(amount)}</span>
  </div>;
}
