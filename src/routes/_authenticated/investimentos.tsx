import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Bitcoin, Building2, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { FinanceLayout } from "@/components/finance-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route=createFileRoute("/_authenticated/investimentos")({component:InvestimentosPage});

async function loadMarket(){
 const [br,crypto]=await Promise.all([
  fetch("https://brapi.dev/api/quote/%5EBVSP,PETR4,MGLU3,VALE3,ITUB4").then(r=>r.json()),
  fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=brl&include_24hr_change=true").then(r=>r.json())
 ]);
 const result=(br.results??[]).map((x:any)=>({symbol:x.symbol,name:x.shortName??x.symbol,price:x.regularMarketPrice,change:x.regularMarketChangePercent}));
 if(crypto.bitcoin) result.unshift({symbol:"BTC",name:"Bitcoin",price:crypto.bitcoin.brl,change:crypto.bitcoin.brl_24h_change});
 if(crypto.ethereum) result.splice(1,0,{symbol:"ETH",name:"Ethereum",price:crypto.ethereum.brl,change:crypto.ethereum.brl_24h_change});
 return result;
}
function money(n:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:2}).format(n)}
function InvestimentosPage(){
 const {data,isFetching,refetch}=useQuery({queryKey:["market-radar"],queryFn:loadMarket,refetchInterval:60000});
 return <FinanceLayout><div className="space-y-6">
  <header className="flex items-end justify-between gap-3"><div><p className="flex items-center gap-2 text-sm text-primary"><TrendingUp className="size-4"/> Mercado</p><h1 className="text-3xl font-bold">Radar de investimentos</h1><p className="mt-1 text-sm text-muted-foreground">Dados reais, com atualização automática.</p></div><Button variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={"mr-2 size-4 "+(isFetching?"animate-spin":"")}/>Atualizar</Button></header>
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(data??[]).map((q:any)=><Quote key={q.symbol} q={q}/>)}</div>
  <Card><CardContent className="p-5"><h2 className="font-semibold">Explore investimentos</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Category icon={Building2} title="Renda fixa" text="Tesouro, CDB, LCI e LCA"/><Category icon={TrendingUp} title="Ações" text="Empresas listadas"/><Category icon={Building2} title="Imóveis e FIIs" text="Mercado imobiliário"/><Category icon={Bitcoin} title="Cripto" text="Bitcoin e outros"/></div></CardContent></Card>
  <Card className="border-primary/20 bg-primary/5"><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="flex items-center gap-2 font-semibold"><Sparkles className="size-4"/> Explicar com IA</p><p className="text-sm text-muted-foreground">Entenda o que mudou e quais fatores podem estar relacionados ao movimento.</p></div><Button asChild><a href="/assistente">Perguntar</a></Button></CardContent></Card>
  <p className="text-[11px] text-muted-foreground">As cotações são obtidas de APIs de mercado e podem ter atraso ou limites de cobertura. Para B3, dados em tempo real são distribuídos por provedores autorizados.</p>
 </div></FinanceLayout>
}
function Quote({q}:{q:any}){const up=q.change>=0;return <Card><CardContent className="p-4"><div className="flex justify-between"><div><p className="text-xs text-muted-foreground">{q.symbol}</p><p className="font-semibold">{q.name}</p></div><span className={"flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold "+(up?"bg-emerald-500/10 text-emerald-600":"bg-red-500/10 text-red-600")}>{up?<ArrowUp className="size-3"/>:<ArrowDown className="size-3"/>}{Math.abs(q.change).toFixed(2)}%</span></div><p className="mt-5 text-2xl font-bold">{money(q.price)}</p><p className="mt-1 text-[11px] text-muted-foreground">Variação nas últimas 24h/sessão disponível</p></CardContent></Card>}
function Category({icon:Icon,title,text}:{icon:any;title:string;text:string}){return <div className="rounded-xl border p-4"><Icon className="size-5 text-primary"/><p className="mt-3 font-semibold">{title}</p><p className="text-xs text-muted-foreground">{text}</p></div>}
