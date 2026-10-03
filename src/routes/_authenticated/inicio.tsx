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
  head: () => ({ meta: [{ title: "Visão geral — Finza" }] }),
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
        name: profile.data?.display_name ?? user.user_metadata?.["display_name"] ?? "Usuário",
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

  const forecastNet = futureIncome - futureExpense;
  const currentMonth = new Date().toLocaleDateString("pt-BR", { month: "long" });
  const expenseShare = income > 0 ? Math.min(100, (expenses / income) * 100) : 0;

  return (
    <FinanceLayout>
      <div className="space-y-6 pb-8">
        <section className="overflow-hidden rounded-2xl border border-primary/20 bg-black shadow-sm">
          <img
            src="/finza-logo-home.webp"
            alt="Finza — seu futuro financeiro começa agora"
            className="block h-auto max-h-[230px] w-full object-cover object-center sm:max-h-[270px]"
          />
        </section>

        <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" /> Seu centro financeiro
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Olá, {data?.name?.split(" ")[0] ?? "usuário"} 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">Uma visão clara do seu dinheiro, sem complicação.</p>
          </div>
          <p className="text-xs capitalize text-muted-foreground">{currentMonth}</p>
        </header>

        <section className="grid gap-3 lg:grid-cols-[1.35fr_.65fr]">
          <Card className="overflow-hidden border-primary/15 bg-card shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Wallet className="size-4" /> Saldo atual</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{money(balance)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Baseado nas movimentações registradas</p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Wallet className="size-5" /></div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4">
                <MiniValue icon={<ArrowUpCircle className="size-3.5 text-emerald-500" />} label="Receitas" value={money(income)} compact />
                <MiniValue icon={<ArrowDownCircle className="size-3.5 text-red-500" />} label="Gastos" value={money(expenses)} compact />
                <MiniValue icon={<CreditCard className="size-3.5 text-orange-500" />} label="Dívidas" value={money(debtTotal)} compact />
              </div>
            </CardContent>
          </Card>

          <Card className="border bg-card shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Resumo rápido</p>
                  <h2 className="mt-1 font-semibold">Como está seu mês</h2>
                </div>
                <BarChart3 className="size-5 text-primary" />
              </div>
              <div className="mt-5 space-y-4">
                <div>
                  <div className="mb-1.5 flex justify-between text-xs"><span className="text-muted-foreground">Gastos sobre receitas</span><span className="font-semibold">{Math.round(expenseShare)}%</span></div>
                  <Progress value={expenseShare} className="h-1.5" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <MetricBox label="Guardado" value={money(saved)} icon={<PiggyBank className="size-4" />} />
                  <MetricBox label="Dívidas abertas" value={money(debtTotal)} icon={<CreditCard className="size-4" />} />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold">Movimentação financeira</h2>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">AO VIVO</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Entradas e saídas registradas no período.</p>
            </div>
            <div className="flex w-fit rounded-lg border bg-background/60 p-1">
              {[7, 30, 180].map((period) => (
                <button key={period} type="button" onClick={() => setChartPeriod(period as 7 | 30 | 180)}
                  className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-colors ${chartPeriod === period ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {period === 180 ? "6M" : `${period}D`}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3 grid grid-cols-2 gap-3 sm:max-w-md">
            <div className="rounded-xl bg-emerald-500/8 p-3"><p className="text-[10px] text-muted-foreground">Entrou</p><p className="mt-0.5 text-sm font-bold text-emerald-600">+{money(chartIncome)}</p></div>
            <div className="rounded-xl bg-red-500/8 p-3"><p className="text-[10px] text-muted-foreground">Saiu</p><p className="mt-0.5 text-sm font-bold text-red-600">-{money(chartExpense)}</p></div>
          </div>
          <div className="h-[190px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movementChart} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(142 71% 45%)" stopOpacity={0.24} /><stop offset="100%" stopColor="hsl(142 71% 45%)" stopOpacity={0} /></linearGradient>
                  <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(0 84% 60%)" stopOpacity={0.2} /><stop offset="100%" stopColor="hsl(0 84% 60%)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={chartPeriod === 7 ? 0 : chartPeriod === 30 ? 6 : 29} />
                <YAxis hide domain={[0, "auto"]} />
                <Tooltip cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "3 3" }} contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 11, padding: "8px 10px" }} formatter={(value, name) => [money(Number(value)), name === "income" ? "Receitas" : "Gastos"]} />
                <Area type="monotone" dataKey="income" stroke="hsl(142 71% 45%)" fill="url(#incomeFill)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} animationDuration={500} />
                <Area type="monotone" dataKey="expense" stroke="hsl(0 84% 60%)" fill="url(#expenseFill)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} animationDuration={500} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <QuickAction href="/lancamentos" icon={<ArrowUpCircle />} tone="income" label="Nova receita" />
          <QuickAction href="/lancamentos" icon={<ArrowDownCircle />} tone="expense" label="Novo gasto" />
          <QuickAction href="/dividas" icon={<CreditCard />} tone="debt" label="Pagar dívida" />
          <QuickAction href="/porquinhos" icon={<PiggyBank />} tone="save" label="Guardar dinheiro" />
        </section>

        <section className="grid gap-3 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b p-4">
                <div><h2 className="flex items-center gap-2 font-semibold"><CalendarClock className="size-4 text-primary" /> Próximos dias</h2><p className="mt-1 text-xs text-muted-foreground">Previsão para os próximos 7 dias</p></div>
                <div className="text-right"><p className="text-[10px] text-muted-foreground">Saldo previsto</p><p className={`text-sm font-bold ${forecastNet >= 0 ? "text-emerald-600" : "text-red-600"}`}>{forecastNet >= 0 ? "+" : ""}{money(forecastNet)}</p></div>
              </div>
              <div className="p-3">
                {futureByDay.length === 0 ? (
                  <EmptyState icon={<CalendarClock className="size-4" />} text="Nenhuma movimentação prevista." />
                ) : (
                  <div className="space-y-2">
                    {futureByDay.slice(0, 4).map((date) => {
                      const rows = futureTransactions.filter((t) => t.occurred_on === date);
                      const dayIncome = rows.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount_cents, 0);
                      const dayExpense = rows.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount_cents, 0);
                      return <div key={date} className="flex items-center gap-3 rounded-xl border p-3">
                        <div className="flex size-9 shrink-0 flex-col items-center justify-center rounded-lg bg-muted/70"><span className="text-[9px] font-medium uppercase text-muted-foreground">{new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR",{weekday:"short"}).replace(".","")}</span><span className="text-sm font-bold">{new Date(`${date}T12:00:00`).getDate()}</span></div>
                        <div className="min-w-0 flex-1"><p className="text-sm font-medium">{rows.length} {rows.length === 1 ? "movimentação" : "movimentações"}</p><p className="text-[10px] text-muted-foreground">{new Date(`${date}T12:00:00`).toLocaleDateString("pt-BR",{day:"2-digit",month:"long"})}</p></div>
                        <div className="text-right text-xs font-semibold">{dayIncome > 0 && <p className="text-emerald-600">+{money(dayIncome)}</p>}{dayExpense > 0 && <p className="text-red-600">-{money(dayExpense)}</p>}</div>
                      </div>;
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b p-4">
                <div><h2 className="flex items-center gap-2 font-semibold"><ReceiptText className="size-4 text-primary" /> Últimas movimentações</h2><p className="mt-1 text-xs text-muted-foreground">Suas atividades mais recentes</p></div>
                <Button asChild variant="ghost" size="sm" className="text-xs"><a href="/lancamentos">Ver todas <ChevronRight className="size-3.5" /></a></Button>
              </div>
              {isLoading ? <div className="p-5 text-sm text-muted-foreground">Carregando...</div> : recentTransactions.length === 0 ? <EmptyState icon={<Receipt className="size-4" />} text="Nenhuma movimentação registrada." action={<Button asChild size="sm"><a href="/lancamentos"><Plus className="size-4" />Adicionar</a></Button>} /> : <div>{recentTransactions.map((t) => <TransactionRow key={t.id} description={t.description} category={t.category} date={t.occurred_on} amount={t.amount_cents} positive={t.type === "income"} />)}</div>}
            </CardContent>
          </Card>
        </section>

        <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Finza inteligente</p><h2 className="mt-1 text-xl font-bold tracking-tight">O que você pode fazer agora</h2><p className="mt-1 text-sm text-muted-foreground">Acesse as áreas que ajudam a melhorar sua vida financeira.</p></div>
            <Sparkles className="mt-1 hidden size-5 text-primary sm:block" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <SmartHub href="/renda-extra" icon={<TrendingUp className="size-5" />} title="Aumente sua renda" text="Simule metas e encontre oportunidades para gerar mais dinheiro." badge="Renda" value="Explorar" />
            <SmartHub href="/investimentos" icon={<BarChart3 className="size-5" />} title="Investimentos" text="Acompanhe cotações e organize sua visão de mercado." badge="Mercado" value="Ver investimentos" />
            <SmartHub href="/assistente" icon={<Sparkles className="size-5" />} title="Assistente financeiro" text="Use seus próprios dados para entender os próximos passos." badge="IA" value="Abrir assistente" />
          </div>
        </section>

        <section className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/5 via-card to-card p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary"><Target className="size-3.5" /> Plano de ação</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight">Seu plano desta semana</h2>
              <p className="mt-1 text-sm text-muted-foreground">Próximos passos baseados nos números que você já registrou.</p>
            </div>
            <Sparkles className="hidden size-5 text-primary sm:block" />
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <ActionCard icon={<ArrowDownCircle className="size-5" />} title="Controle seus gastos" value={money(expenses)} description="Total de gastos registrados até agora." href="/lancamentos" action="Ver gastos" />
            <ActionCard icon={<TrendingUp className="size-5" />} title="Aumente sua renda" value={money(Math.max(0, income - expenses))} description="Use o saldo atual como ponto de partida para sua próxima meta." href="/renda-extra" action="Explorar renda" />
            <ActionCard icon={<PiggyBank className="size-5" />} title="Continue guardando" value={money(saved)} description={goalTarget > 0 ? `${Math.round(savingProgress)}% das suas metas acumuladas.` : "Crie uma meta para começar a acompanhar."} href="/porquinhos" action="Ver metas" />
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Dívidas</p><h2 className="mt-1 text-lg font-bold">{money(debtTotal)}</h2></div><div className="flex size-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500"><CreditCard className="size-5" /></div></div>
              <div className="mt-4 flex justify-between text-xs"><span className="text-muted-foreground">Progresso quitado</span><span className="font-semibold">{Math.round(debtProgress)}%</span></div>
              <Progress value={debtProgress} className="mt-2 h-1.5" />
              <Button asChild variant="ghost" size="sm" className="mt-3 px-0 text-xs"><a href="/dividas">Gerenciar dívidas <ChevronRight className="size-3.5" /></a></Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Objetivos guardados</p><h2 className="mt-1 text-lg font-bold">{money(saved)}</h2></div><div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Target className="size-5" /></div></div>
              <div className="mt-4 flex justify-between text-xs"><span className="text-muted-foreground">Progresso das metas</span><span className="font-semibold">{Math.round(savingProgress)}%</span></div>
              <Progress value={savingProgress} className="mt-2 h-1.5" />
              <Button asChild variant="ghost" size="sm" className="mt-3 px-0 text-xs"><a href="/porquinhos">Ver objetivos <ChevronRight className="size-3.5" /></a></Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </FinanceLayout>
  );
}


function MetricBox({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="rounded-xl border bg-background/50 p-3">
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">{icon}{label}</div>
    <p className="mt-1 text-sm font-bold truncate">{value}</p>
  </div>;
}

function EmptyState({ icon, text, action }: { icon: React.ReactNode; text: string; action?: React.ReactNode }) {
  return <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">{icon}</div>
    <p className="text-sm text-muted-foreground">{text}</p>
    {action}
  </div>;
}
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

function SmartHub({ href, icon, title, text, badge, value }: { href: string; icon: React.ReactNode; title: string; text: string; badge: string; value: string }) {
  return (
    <a href={href} className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">{icon}</span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{badge}</span>
      </div>
      <h3 className="mt-5 font-semibold tracking-tight">{title}</h3>
      <p className="mt-1.5 min-h-10 text-sm leading-5 text-muted-foreground">{text}</p>
      <div className="mt-5 flex items-center justify-between border-t pt-3">
        <span className="text-xs font-semibold text-primary">{value}</span>
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
      </div>
    </a>
  );
}

function SectionHeading({ icon, title, href, action }: { icon: React.ReactNode; title: string; href: string; action: string }) {
  return <div className="flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 font-semibold">{icon}{title}</h2><Button asChild variant="ghost" size="sm" className="gap-1 text-xs"><a href={href}>{action}<ChevronRight className="size-3.5" /></a></Button></div>;
}

function ActionCard({ icon, title, value, description, progress, href, action }: { icon: React.ReactNode; title: string; value: string; description: string; progress?: number | undefined; href: string; action: string }) {
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
