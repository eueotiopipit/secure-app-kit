import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FinanceLayout, money } from "@/components/finance-layout";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/lancamentos")({ head: () => ({ meta: [{ title: "Lançamentos — Plano Anti-Dívidas" }] }), component: LancamentosPage });

function LancamentosPage() {
  const { user } = Route.useRouteContext(); const qc = useQueryClient();
  const [type, setType] = useState<"income" | "expense">("expense"); const [description, setDescription] = useState(""); const [category, setCategory] = useState("Geral"); const [amount, setAmount] = useState(""); const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["transactions", user.id], queryFn: async () => { const { data, error } = await supabase.from("financial_transactions").select("*").eq("user_id", user.id).order("occurred_on", { ascending: false }); if (error) throw error; return data ?? []; }});
  async function add() {
    const cents = Math.round(Number(amount.replace(",", ".")) * 100);
    if (!description.trim() || !Number.isFinite(cents) || cents <= 0) return void toast.error("Preencha descrição e valor válido.");
    const { error } = await supabase.from("financial_transactions").insert({ user_id: user.id, type, description: description.trim(), category: category.trim() || "Geral", amount_cents: cents, occurred_on: date });
    if (error) return void toast.error(error.message);
    setDescription(""); setAmount(""); await qc.invalidateQueries({ queryKey: ["transactions", user.id] }); await qc.invalidateQueries({ queryKey: ["dashboard", user.id] }); toast.success("Lançamento adicionado.");
  }
  async function remove(id: string) {
    const { error } = await supabase.from("financial_transactions").delete().eq("id", id).eq("user_id", user.id);
    if (error) return void toast.error(error.message);
    await qc.invalidateQueries({ queryKey: ["transactions", user.id] }); await qc.invalidateQueries({ queryKey: ["dashboard", user.id] });
  }
  return <FinanceLayout><div className="space-y-6">
    <div><p className="text-sm text-muted-foreground">Receitas e despesas</p><h1 className="text-3xl font-bold">Lançamentos</h1></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-5" />Novo lançamento</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-2"><Label>Tipo</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={type} onChange={e => setType(e.target.value as "income" | "expense")}><option value="expense">Despesa</option><option value="income">Receita</option></select></div>
      <div className="space-y-2"><Label>Descrição</Label><Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex.: Mercado" /></div>
      <div className="space-y-2"><Label>Categoria</Label><Input value={category} onChange={e => setCategory(e.target.value)} placeholder="Alimentação" /></div>
      <div className="space-y-2"><Label>Valor</Label><Input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" placeholder="0,00" /></div>
      <div className="space-y-2"><Label>Data</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
      <Button onClick={add} className="sm:col-span-2 lg:col-span-5">Salvar lançamento</Button>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Histórico</CardTitle></CardHeader><CardContent>{isLoading ? <p>Carregando...</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum lançamento cadastrado.</p> : <div className="space-y-2">{rows.map(r => <div key={r.id} className="flex items-center justify-between gap-4 rounded-lg border p-3"><div><p className="font-medium">{r.description}</p><p className="text-xs text-muted-foreground">{r.category} · {new Date(r.occurred_on).toLocaleDateString("pt-BR")}</p></div><div className="flex items-center gap-3"><span className={r.type === "income" ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>{r.type === "income" ? "+" : "-"}{money(r.amount_cents)}</span><Button variant="ghost" size="icon" onClick={() => remove(r.id)} aria-label="Excluir"><Trash2 className="size-4" /></Button></div></div>)}</div>}</CardContent></Card>
  </div></FinanceLayout>;
}
