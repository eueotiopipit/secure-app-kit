import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PiggyBank, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FinanceLayout, money } from "@/components/finance-layout";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/porquinhos")({ head: () => ({ meta: [{ title: "Porquinhos — Plano Anti-Dívidas" }] }), component: PorquinhosPage });

function PorquinhosPage() {
  const { user } = Route.useRouteContext(); const qc=useQueryClient();
  const [name,setName]=useState(""); const [target,setTarget]=useState(""); const [initial,setInitial]=useState(""); const [date,setDate]=useState("");
  const {data:rows=[],isLoading}=useQuery({queryKey:["pigs",user.id],queryFn:async()=>{const {data,error}=await supabase.from("piggy_banks").select("*").eq("user_id",user.id).order("created_at",{ascending:false});if(error)throw error;return data??[];}});
  async function add(){const targetC=Math.round(Number(target.replace(",","."))*100);const initialC=Math.round(Number(initial.replace(",","."))*100)||0;if(!name.trim()||targetC<=0)return toast.error("Informe nome e meta.");const {error}=await supabase.from("piggy_banks").insert({user_id:user.id,name:name.trim(),target_amount_cents:targetC,current_amount_cents:initialC,target_date:date||null,objective:"Meta financeira",category:"Geral",icon:"piggy-bank",status:initialC>=targetC?"completed":"active"});if(error)return toast.error(error.message);setName("");setTarget("");setInitial("");setDate("");await qc.invalidateQueries({queryKey:["pigs",user.id]});await qc.invalidateQueries({queryKey:["dashboard",user.id]});toast.success("Porquinho criado.");}
  async function remove(id:string){const {error}=await supabase.from("piggy_banks").delete().eq("id",id).eq("user_id",user.id);if(error)return toast.error(error.message);await qc.invalidateQueries({queryKey:["pigs",user.id]});await qc.invalidateQueries({queryKey:["dashboard",user.id]});}
  return <FinanceLayout><div className="space-y-6">
    <div><p className="text-sm text-muted-foreground">Transforme objetivos em metas acompanháveis</p><h1 className="text-3xl font-bold">Meus Porquinhos</h1></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="size-5"/>Novo porquinho</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><div className="space-y-2"><Label>Nome da meta</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Reserva de emergência"/></div><div className="space-y-2"><Label>Meta</Label><Input value={target} onChange={e=>setTarget(e.target.value)} inputMode="decimal" placeholder="5.000,00"/></div><div className="space-y-2"><Label>Valor inicial</Label><Input value={initial} onChange={e=>setInitial(e.target.value)} inputMode="decimal" placeholder="0,00"/></div><div className="space-y-2"><Label>Prazo</Label><Input type="date" value={date} onChange={e=>setDate(e.target.value)}/></div><Button onClick={add} className="sm:col-span-2 lg:col-span-4">Criar meta</Button></CardContent></Card>
    <div className="grid gap-4 md:grid-cols-2">{isLoading?<p>Carregando...</p>:rows.length===0?<Card className="md:col-span-2"><CardContent className="py-10 text-center text-sm text-muted-foreground"><PiggyBank className="mx-auto mb-3 size-10"/><p>Você ainda não criou um porquinho.</p></CardContent></Card>:rows.map(p=>{const pct=p.target_amount_cents?Math.min(100,p.current_amount_cents/p.target_amount_cents*100):0;const remaining=Math.max(0,p.target_amount_cents-p.current_amount_cents);return <Card key={p.id}><CardHeader><div className="flex items-start justify-between"><div><CardTitle>{p.name}</CardTitle><p className="text-sm text-muted-foreground">{p.target_date?"Prazo: "+new Date(p.target_date+"T12:00:00").toLocaleDateString("pt-BR"):"Sem prazo"}</p></div><Button variant="ghost" size="icon" onClick={()=>remove(p.id)}><Trash2 className="size-4"/></Button></div></CardHeader><CardContent><div className="flex justify-between text-sm"><span>{money(p.current_amount_cents)}</span><span>{money(p.target_amount_cents)}</span></div><div className="mt-2 h-3 rounded-full bg-muted"><div className="h-3 rounded-full bg-primary" style={{width:pct+"%"}}/></div><p className="mt-3 text-sm text-muted-foreground">{pct.toFixed(0)}% concluído · faltam {money(remaining)}</p></CardContent></Card>})}</div>
  </div></FinanceLayout>;
}
