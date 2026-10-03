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

export const Route = createFileRoute("/_authenticated/dividas")({ head: () => ({ meta: [{ title: "Dívidas — Plano Anti-Dívidas" }] }), component: DividasPage });

function DividasPage() {
  const { user } = Route.useRouteContext(); const qc = useQueryClient();
  const [name, setName] = useState(""); const [creditor, setCreditor] = useState(""); const [amount, setAmount] = useState(""); const [installment, setInstallment] = useState(""); const [interest, setInterest] = useState(""); const [paymentValues, setPaymentValues] = useState<Record<string, string>>({});
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["debts", user.id], queryFn: async () => { const { data, error } = await supabase.from("debts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }); if (error) throw error; return data ?? []; }});
  async function add() {
    const original = Math.round(Number(amount.replace(",", ".")) * 100); const inst = Math.round(Number(installment.replace(",", ".")) * 100);
    if (!name.trim() || !Number.isFinite(original) || original <= 0) return void toast.error("Informe nome e valor da dívida.");
    const { error } = await supabase.from("debts").insert({ user_id: user.id, name: name.trim(), creditor: creditor.trim(), debt_type: "other", original_amount_cents: original, installment_amount_cents: Number.isFinite(inst) ? inst : 0, monthly_interest_rate: Number(interest.replace(",", ".")) || 0, status: "open", total_installments: 1 });
    if (error) return void toast.error(error.message);
    setName(""); setCreditor(""); setAmount(""); setInstallment(""); setInterest(""); await qc.invalidateQueries({ queryKey: ["debts", user.id] }); await qc.invalidateQueries({ queryKey: ["dashboard", user.id] }); toast.success("Dívida adicionada.");
  }
  async function pay(debt: (typeof rows)[number]) {
    const cents = Math.round(Number((paymentValues[debt.id] || "").replace(",", ".")) * 100);
    const remaining = Math.max(0, debt.original_amount_cents - debt.paid_amount_cents);
    if (!Number.isFinite(cents) || cents <= 0 || cents > remaining) return void toast.error("Informe um pagamento válido dentro do saldo restante.");
    const { error: paymentError } = await supabase.from("debt_payments").insert({ user_id: user.id, debt_id: debt.id, amount_cents: cents, paid_on: new Date().toISOString().slice(0, 10) });
    if (paymentError) return void toast.error(paymentError.message);
    const paid = debt.paid_amount_cents + cents;
    const { error } = await supabase.from("debts").update({ paid_amount_cents: paid, paid_installments: debt.paid_installments + 1, status: paid >= debt.original_amount_cents ? "paid" : "open", paid_off_at: paid >= debt.original_amount_cents ? new Date().toISOString() : null }).eq("id", debt.id).eq("user_id", user.id);
    if (error) return void toast.error(error.message);
    setPaymentValues(v => ({ ...v, [debt.id]: "" }));
    await qc.invalidateQueries({ queryKey: ["debts", user.id] }); await qc.invalidateQueries({ queryKey: ["dashboard", user.id] });
    toast.success("Pagamento registrado.");
  }
  async function remove(id: string) { const { error } = await supabase.from("debts").delete().eq("id", id).eq("user_id", user.id); if (error) return void toast.error(error.message); await qc.invalidateQueries({ queryKey: ["debts", user.id] }); await qc.invalidateQueries({ queryKey: ["dashboard", user.id] }); }
  return <FinanceLayout><div className="space-y-6">
    <div><p className="text-sm text-muted-foreground">Organize o que precisa ser quitado</p><h1 className="text-3xl font-bold">Dívidas</h1></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-5" />Cadastrar dívida</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-2"><Label>Nome</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Cartão, empréstimo..." /></div>
      <div className="space-y-2"><Label>Credor</Label><Input value={creditor} onChange={e => setCreditor(e.target.value)} placeholder="Banco / empresa" /></div>
      <div className="space-y-2"><Label>Valor total</Label><Input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" placeholder="0,00" /></div>
      <div className="space-y-2"><Label>Parcela</Label><Input value={installment} onChange={e => setInstallment(e.target.value)} inputMode="decimal" placeholder="0,00" /></div>
      <div className="space-y-2"><Label>Juros/mês %</Label><Input value={interest} onChange={e => setInterest(e.target.value)} inputMode="decimal" placeholder="0" /></div>
      <Button onClick={add} className="sm:col-span-2 lg:col-span-5">Salvar dívida</Button>
    </CardContent></Card>
    <Card><CardHeader><CardTitle>Suas dívidas</CardTitle></CardHeader><CardContent>{isLoading ? <p>Carregando...</p> : rows.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma dívida cadastrada.</p> : <div className="space-y-3">{rows.map(d => { const remaining=Math.max(0,d.original_amount_cents-d.paid_amount_cents); const pct=d.original_amount_cents ? Math.min(100,d.paid_amount_cents/d.original_amount_cents*100) : 0; return <div key={d.id} className="rounded-xl border p-4"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{d.name}</h3><p className="text-sm text-muted-foreground">{d.creditor || "Credor não informado"} · {d.status}</p></div><Button variant="ghost" size="icon" onClick={() => remove(d.id)}><Trash2 className="size-4" /></Button></div><div className="mt-4 flex justify-between text-sm"><span>Restante</span><strong>{money(remaining)}</strong></div><div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{width: pct + "%"}} /></div><p className="mt-2 text-xs text-muted-foreground">{money(d.paid_amount_cents)} pagos de {money(d.original_amount_cents)}</p><div className="mt-4 flex gap-2"><Input className="max-w-48" value={paymentValues[d.id] || ""} onChange={e => setPaymentValues(v => ({ ...v, [d.id]: e.target.value }))} inputMode="decimal" placeholder="Valor do pagamento" /><Button variant="outline" onClick={() => pay(d)} disabled={d.status === "paid"}>Registrar pagamento</Button></div></div>})}</div>}</CardContent></Card>
  </div></FinanceLayout>;
}
