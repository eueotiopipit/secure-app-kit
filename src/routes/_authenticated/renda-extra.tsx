import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bike, Camera, ShoppingBag, Store, Truck, WandSparkles, Sparkles, ChevronRight } from "lucide-react";
import { FinanceLayout } from "@/components/finance-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route=createFileRoute("/_authenticated/renda-extra")({component:RendaExtraPage});

const ideas=[
 ["delivery","Entregas","Moto ou bike",Truck],
 ["content","Fazer conteúdo","TikTok, Reels e YouTube",Camera],
 ["street","Vender na rua","Produtos de giro rápido",Store],
 ["marketplace","Marketplaces","Shopee e Mercado Livre",ShoppingBag],
 ["ai","Serviços com IA","Automação e criação",WandSparkles],
] as const;

function RendaExtraPage(){
 const [active,setActive]=useState("delivery");
 const item=ideas.find(x=>x[0]===active)??ideas[0];
 return <FinanceLayout><div className="space-y-6">
  <header><p className="flex items-center gap-2 text-sm text-primary"><Sparkles className="size-4"/> Oportunidades</p><h1 className="text-3xl font-bold">Aumente sua renda</h1><p className="mt-1 text-sm text-muted-foreground">Ideias práticas, simuladores e análise personalizada.</p></header>
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{ideas.map(([id,title,sub,Icon])=><button key={id} onClick={()=>setActive(id)} className={"rounded-2xl border bg-card p-4 text-left transition hover:-translate-y-0.5 "+(active===id?"ring-2 ring-primary/40":"")}><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5"/></span><h2 className="mt-4 font-semibold">{title}</h2><p className="text-xs text-muted-foreground">{sub}</p><div className="mt-4 flex justify-between text-[11px]"><span>Começo: baixo</span><ChevronRight className="size-4"/></div></button>)}</div>
  <Card><CardContent className="p-6"><div className="flex items-center gap-3"><span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><item[3] className="size-6"/></span><div><p className="text-xs text-primary">GUIA PRÁTICO</p><h2 className="text-xl font-bold">{item[1]}</h2></div></div><div className="mt-6 grid gap-4 md:grid-cols-3"><Info title="Como começar" text="Escolha uma oferta simples, teste em pequena escala e registre custos e resultados."/><Info title="O que calcular" text="Investimento inicial, custo operacional, preço, margem líquida e horas disponíveis."/><Info title="Com IA" text="Use IA para montar plano, comparar cenários, criar ofertas e analisar seus resultados." /></div></CardContent></Card>
  <Card><CardContent className="p-6"><h2 className="font-semibold">Simule sua meta</h2><div className="mt-4 grid gap-4 md:grid-cols-3"><label className="text-sm">Meta mensal<input className="mt-2 w-full rounded-lg border bg-background px-3 py-2" defaultValue="2000"/></label><label className="text-sm">Horas por dia<input className="mt-2 w-full rounded-lg border bg-background px-3 py-2" defaultValue="4"/></label><div className="rounded-xl bg-primary/10 p-4 text-sm"><p className="text-muted-foreground">O cálculo detalhado será baseado nos custos e dados do usuário.</p></div></div></CardContent></Card>
  <Card className="border-primary/20 bg-primary/5"><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="flex items-center gap-2 font-semibold"><Sparkles className="size-4"/> Analisar com IA</p><p className="text-sm text-muted-foreground">Cruze renda, gastos, dívidas e metas.</p></div><Button asChild><a href="/assistente">Abrir IA</a></Button></CardContent></Card>
 </div></FinanceLayout>
}
function Info({title,text}:{title:string;text:string}){return <div className="rounded-xl border p-4"><p className="font-medium">{title}</p><p className="mt-2 text-sm text-muted-foreground">{text}</p></div>}
