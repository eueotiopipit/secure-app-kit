import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bot, CircleDollarSign, Lightbulb, Send, Sparkles, Target } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FinanceLayout, money } from "@/components/finance-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route=createFileRoute("/_authenticated/assistente")({component:AssistentePage});
function AssistentePage(){
 const {user}=Route.useRouteContext(); const [question,setQuestion]=useState("");
 const {data}=useQuery({queryKey:["assistant-context",user.id],queryFn:async()=>{const [tx,debt,pig]=await Promise.all([supabase.from("financial_transactions").select("amount_cents,type").eq("user_id",user.id),supabase.from("debts").select("original_amount_cents,paid_amount_cents,status").eq("user_id",user.id),supabase.from("piggy_banks").select("current_amount_cents").eq("user_id",user.id)]);return {income:(tx.data??[]).filter(x=>x.type==="income").reduce((s,x)=>s+x.amount_cents,0),expense:(tx.data??[]).filter(x=>x.type==="expense").reduce((s,x)=>s+x.amount_cents,0),debt:(debt.data??[]).filter(x=>x.status!=="paid").reduce((s,x)=>s+Math.max(0,x.original_amount_cents-x.paid_amount_cents),0),saved:(pig.data??[]).reduce((s,x)=>s+x.current_amount_cents,0)}}});
 const prompts=["Analise meus gastos","Como aumentar minha renda?","Como organizar minhas dívidas?","Como começar a investir?"];
 return <FinanceLayout><div className="mx-auto max-w-4xl space-y-6"><header><p className="flex items-center gap-2 text-sm text-primary"><Sparkles className="size-4"/> Inteligência financeira</p><h1 className="text-3xl font-bold">Assistente financeiro</h1><p className="mt-1 text-sm text-muted-foreground">Uma camada de IA para cruzar seus números e montar planos personalizados.</p></header>
 <Card className="border-primary/20 bg-primary/5"><CardContent className="p-5 sm:p-7"><div className="flex gap-4"><div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Bot className="size-6"/></div><div><p className="font-semibold">Pergunte do seu jeito</p><p className="text-sm text-muted-foreground">Ex.: quero juntar R$ 10 mil, preciso aumentar minha renda ou quero entender meus gastos.</p></div></div><div className="mt-5 flex flex-wrap gap-2">{prompts.map(p=><button key={p} onClick={()=>setQuestion(p)} className="rounded-full border bg-background px-3 py-2 text-xs font-medium">{p}</button>)}</div><div className="mt-5 flex gap-2"><input value={question} onChange={e=>setQuestion(e.target.value)} placeholder="Digite sua pergunta..." className="min-w-0 flex-1 rounded-xl border bg-background px-4 py-3 text-sm"/><Button><Send className="size-4"/></Button></div></CardContent></Card>
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Mini icon={CircleDollarSign} label="Receitas" value={money(data?.income??0)}/><Mini icon={Target} label="Gastos" value={money(data?.expense??0)}/><Mini icon={Lightbulb} label="Dívidas" value={money(data?.debt??0)}/><Mini icon={Target} label="Guardado" value={money(data?.saved??0)}/></div>
 <Card><CardContent className="p-5"><h2 className="font-semibold">Como a IA vai funcionar</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><Info title="Contexto" text="Usa seus dados financeiros autorizados."/><Info title="Análise" text="Compara metas, custos, dívidas e cenários."/><Info title="Plano" text="Entrega passos concretos e simuláveis."/></div><p className="mt-5 text-xs text-muted-foreground">A interface já está preparada para o modelo generativo. A chave do provedor deve ficar apenas no backend, nunca no navegador.</p></CardContent></Card>
 </div></FinanceLayout>
}
function Mini({icon:Icon,label,value}:{icon:any;label:string;value:string}){return <Card><CardContent className="p-4"><Icon className="size-5 text-primary"/><p className="mt-3 text-xs text-muted-foreground">{label}</p><p className="mt-1 font-bold">{value}</p></CardContent></Card>}
function Info({title,text}:{title:string;text:string}){return <div className="rounded-xl border p-4"><p className="font-medium">{title}</p><p className="mt-2 text-xs text-muted-foreground">{text}</p></div>}
