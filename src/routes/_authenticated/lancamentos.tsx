import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, Trash2, Plus, WalletCards } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FinanceLayout, money } from "@/components/finance-layout";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/lancamentos")({
  head: () => ({ meta: [{ title: "Movimentações — Finza" }] }),
  component: LancamentosPage,
});

type Account = { id: string; name: string; account_type: string };

function LancamentosPage() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Geral");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState("");

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["transactions", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("occurred_on", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: accounts = [] } = useQuery<Account[]>({
    queryKey: ["finance-accounts", user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_accounts")
        .select("id,name,account_type")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Account[];
    },
  });

  async function add() {
    const cents = Math.round(Number(amount.replace(",", ".")) * 100);
    if (!description.trim() || !Number.isFinite(cents) || cents <= 0) {
      return void toast.error("Preencha descrição e valor válido.");
    }
    if (!accountId) return void toast.error("Escolha a conta movimentada.");

    const { error } = await supabase.from("financial_transactions").insert({
      user_id: user.id,
      account_id: accountId,
      type,
      description: description.trim(),
      category: category.trim() || "Geral",
      amount_cents: cents,
      occurred_on: date,
    });

    if (error) return void toast.error(error.message);

    setDescription("");
    setAmount("");
    await qc.invalidateQueries({ queryKey: ["transactions", user.id] });
    await qc.invalidateQueries({ queryKey: ["finance-accounts", user.id] });
    await qc.invalidateQueries({ queryKey: ["dashboard", user.id] });
    toast.success(type === "income" ? "Receita adicionada." : "Gasto adicionado.");
  }

  async function remove(id: string) {
    const { error } = await supabase
      .from("financial_transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return void toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["transactions", user.id] });
    await qc.invalidateQueries({ queryKey: ["finance-accounts", user.id] });
    await qc.invalidateQueries({ queryKey: ["dashboard", user.id] });
    toast.success("Movimentação removida.");
  }

  return (
    <FinanceLayout>
      <div className="space-y-6 pb-8">
        <header>
          <p className="flex items-center gap-2 text-sm font-medium text-primary">
            <WalletCards className="size-4" />
            Fluxo do seu dinheiro
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Movimentações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre receitas e gastos para o Finza atualizar seus números automaticamente.
          </p>
        </header>

        <Card className="overflow-hidden border-primary/15">
          <CardHeader className="border-b bg-primary/[0.04]">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Plus className="size-4" />
              </span>
              Novo lançamento
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <select className="h-10 w-full rounded-xl border bg-background px-3 text-sm" value={type} onChange={(e) => setType(e.target.value as "income" | "expense")}>
                <option value="expense">Despesa</option>
                <option value="income">Receita</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Conta</Label>
              <select className="h-10 w-full rounded-xl border bg-background px-3 text-sm" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">Selecione a conta</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex.: Mercado" />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Alimentação" />
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button onClick={add} className="h-10 sm:col-span-2 lg:col-span-3">
              <Plus className="size-4" />
              Salvar movimentação
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">{[1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-muted" />)}</div>
            ) : rows.length === 0 ? (
              <div className="py-10 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><WalletCards className="size-5" /></div>
                <p className="mt-3 font-medium">Nenhuma movimentação ainda</p>
                <p className="mt-1 text-sm text-muted-foreground">Adicione sua primeira receita ou despesa acima.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {rows.map((row) => {
                  const income = row.type === "income";
                  const account = accounts.find((item) => item.id === row.account_id);
                  return (
                    <div key={row.id} className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/30">
                      <span className={income ? "flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600" : "flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600"}>
                        {income ? <ArrowUpCircle className="size-5" /> : <ArrowDownCircle className="size-5" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{row.description}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.category} · {account?.name ?? "Conta não vinculada"} · {new Date(row.occurred_on).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={income ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>
                          {income ? "+" : "-"}{money(row.amount_cents)}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => remove(row.id)} aria-label="Excluir movimentação">
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FinanceLayout>
  );
}
