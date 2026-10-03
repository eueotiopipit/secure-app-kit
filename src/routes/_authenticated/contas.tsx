import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Building2,
  Check,
  CreditCard,
  Landmark,
  PiggyBank,
  Plus,
  Trash2,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceLayout, money } from "@/components/finance-layout";

export const Route = createFileRoute("/_authenticated/contas")({
  head: () => ({ meta: [{ title: "Contas — Finza" }] }),
  component: ContasPage,
});

type Account = {
  id: string;
  name: string;
  account_type: string;
  opening_balance_cents: number;
  color: string;
};

type Transaction = { account_id: string | null; type: string; amount_cents: number };

const accountTypes = [
  { value: "checking", label: "Conta corrente", icon: Landmark },
  { value: "savings", label: "Poupança", icon: PiggyBank },
  { value: "wallet", label: "Carteira", icon: WalletCards },
  { value: "credit_card", label: "Cartão", icon: CreditCard },
] as const;

function ContasPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [type, setType] = useState("checking");
  const [balance, setBalance] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: accounts = [], isLoading } = useQuery<Account[]>({
    queryKey: ["finance-accounts", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_accounts")
        .select("id,name,account_type,opening_balance_cents,color")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Account[];
    },
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["account-transactions", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("account_id,type,amount_cents")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
  });

  const balances = useMemo(() => {
    const result: Record<string, number> = {};
    for (const account of accounts) result[account.id] = Number(account.opening_balance_cents || 0);
    for (const transaction of transactions) {
      if (!transaction.account_id || result[transaction.account_id] === undefined) continue;
      const amount = Number(transaction.amount_cents || 0);
      result[transaction.account_id] += transaction.type === "income" ? amount : -amount;
    }
    return result;
  }, [accounts, transactions]);

  const total = useMemo(
    () => accounts.reduce((sum, account) => sum + (balances[account.id] ?? 0), 0),
    [accounts, balances],
  );

  async function addAccount() {
    const parsed = Number(balance.replace(",", "."));
    if (!name.trim()) return void toast.error("Digite o nome da conta.");
    if (!Number.isFinite(parsed)) return void toast.error("Informe um saldo válido.");

    setSaving(true);
    const { error } = await supabase.from("finance_accounts").insert({
      user_id: user.id,
      name: name.trim(),
      account_type: type,
      opening_balance_cents: Math.round(parsed * 100),
    });
    setSaving(false);

    if (error) return void toast.error(error.message);

    setName("");
    setBalance("");
    await queryClient.invalidateQueries({ queryKey: ["finance-accounts", user.id] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard", user.id] });
    toast.success("Conta adicionada.");
  }

  async function removeAccount(id: string) {
    const { error } = await supabase
      .from("finance_accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return void toast.error(error.message);

    await queryClient.invalidateQueries({ queryKey: ["finance-accounts", user.id] });
    await queryClient.invalidateQueries({ queryKey: ["account-transactions", user.id] });
    await queryClient.invalidateQueries({ queryKey: ["dashboard", user.id] });
    toast.success("Conta removida.");
  }

  return (
    <FinanceLayout>
      <div className="space-y-6 pb-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <WalletCards className="size-4" />
              Organização financeira
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Suas contas</h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Organize onde seu dinheiro está e acompanhe o saldo de cada lugar.
            </p>
          </div>
          <div className="rounded-2xl border bg-card px-4 py-3 shadow-sm">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Saldo cadastrado</p>
            <p className="mt-1 text-xl font-bold">{money(total)}</p>
          </div>
        </header>

        <Card className="overflow-hidden border-primary/15">
          <CardHeader className="border-b bg-primary/[0.04]">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Plus className="size-4" />
              </span>
              Adicionar conta
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto] lg:items-end">
            <Field label="Nome">
              <input
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Nubank"
              />
            </Field>

            <Field label="Tipo">
              <select
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none focus:border-primary"
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                {accountTypes.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Saldo atual">
              <input
                className="h-10 w-full rounded-xl border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                value={balance}
                onChange={(event) => setBalance(event.target.value)}
                inputMode="decimal"
                placeholder="0,00"
              />
            </Field>

            <Button onClick={addAccount} disabled={saving} className="h-10">
              <Plus className="size-4" />
              {saving ? "Salvando..." : "Adicionar"}
            </Button>
          </CardContent>
        </Card>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Minhas contas</h2>
              <p className="text-xs text-muted-foreground">
                Seus saldos ficam disponíveis para as análises do Finza.
              </p>
            </div>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold">
              {accounts.length} {accounts.length === 1 ? "conta" : "contas"}
            </span>
          </div>

          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[1, 2].map((item) => (
                <Card key={item} className="animate-pulse">
                  <CardContent className="h-28 p-5" />
                </Card>
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Building2 className="size-7" />
                </div>
                <h3 className="mt-4 font-semibold">Nenhuma conta cadastrada</h3>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Cadastre sua conta principal para começar a acompanhar seu dinheiro pelo Finza.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {accounts.map((account) => {
                const typeInfo = accountTypes.find((item) => item.value === account.account_type) ?? accountTypes[0];
                const Icon = typeInfo.icon;
                const positive = (balances[account.id] ?? Number(account.opening_balance_cents)) >= 0;

                return (
                  <Card key={account.id} className="group overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Icon className="size-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{account.name}</p>
                            <p className="text-xs text-muted-foreground">{typeInfo.label}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-60 transition-opacity hover:opacity-100"
                          onClick={() => removeAccount(account.id)}
                          aria-label={"Excluir " + account.name}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>

                      <div className="mt-6 flex items-end justify-between">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Saldo</p>
                          <p className="mt-1 text-2xl font-bold tracking-tight">{money(balances[account.id] ?? Number(account.opening_balance_cents))}</p>
                        </div>
                        <span className={positive ? "flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600" : "flex size-8 items-center justify-center rounded-full bg-red-500/10 text-red-600"}>
                          {positive ? <ArrowUpRight className="size-4" /> : <ArrowDownLeft className="size-4" />}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center gap-2 border-t pt-3 text-[11px] text-muted-foreground">
                        <Check className="size-3.5 text-emerald-500" />
                        Integrada ao seu painel financeiro
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <Card className="border-primary/15 bg-primary/[0.03]">
          <CardContent className="flex gap-3 p-5">
            <Banknote className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold">Tudo conectado dentro do Finza</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Suas contas servem de base para organizar movimentações, visualizar seu saldo e entender para onde seu dinheiro está indo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </FinanceLayout>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="text-xs font-medium">
      {label}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
