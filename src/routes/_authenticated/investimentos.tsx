import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Coins, Building2, DollarSign, RefreshCw, Sparkles, TrendingUp, Landmark, Home } from "lucide-react";
import { FinanceLayout } from "@/components/finance-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/investimentos")({ component: InvestimentosPage });

type QuoteData = { symbol:string; name:string; price:number; change:number; unit?:string };

async function loadMarket(): Promise<QuoteData[]> {
  const [br, crypto] = await Promise.all([
    fetch("https://brapi.dev/api/quote/%5EBVSP,IFIX,USDBRL,PETR4,VALE3,ITUB4").then(r=>{if(!r.ok) throw new Error("Falha ao consultar mercado"); return r.json();}),
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=brl&include_24hr_change=true").then(r=>{if(!r.ok) throw new Error("Falha ao consultar cripto"); return r.json();}),
  ]);
  const result: QuoteData[] = (br.results ?? []).map((x:any)=>({
    symbol:x.symbol, name:x.shortName ?? x.longName ?? x.symbol,
    price:Number(x.regularMarketPrice ?? 0), change:Number(x.regularMarketChangePercent ?? 0),
  }));
  if(crypto.bitcoin) result.unshift({symbol:"BTC",name:"Bitcoin",price:Number(crypto.bitcoin.brl),change:Number(crypto.bitcoin.brl_24h_change)});
  if(crypto.ethereum) result.splice(1,0,{symbol:"ETH",name:"Ethereum",price:Number(crypto.ethereum.brl),change:Number(crypto.ethereum.brl_24h_change)});
  return result;
}
function money(n:number){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:2}).format(n)}
function InvestimentosPage(){
  const {data,isFetching,refetch,error}=useQuery({queryKey:["market-radar"],queryFn:loadMarket,refetchInterval:60000,staleTime:30000});
  return <FinanceLayout><div className="space-y-6 pb-8">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="flex items-center gap-2 text-sm text-primary"><TrendingUp className="size-4"/> Mercado</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Radar de investimentos</h1><p className="mt-1 text-sm text-muted-foreground">Cotações consultadas automaticamente e atualizadas a cada minuto.</p></div><Button variant="outline" onClick={()=>refetch()} disabled={isFetching}><RefreshCw className={`mr-2 size-4 ${isFetching?"animate-spin":""}`}/>Atualizar</Button></header>

    {error && <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-sm text-muted-foreground">Não foi possível atualizar o mercado agora. Tente novamente em alguns segundos.</div>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{(data??[]).map(q=><Quote key={q.symbol} q={q}/>)}</div>

    <Card><CardContent className="p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-semibold">Explore por categoria</h2><p className="mt-1 text-xs text-muted-foreground">Entenda cada tipo de investimento de forma prática.</p></div><Landmark className="size-5 text-primary"/></div><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Category icon={Landmark} title="Renda fixa" text="Tesouro, CDB, LCI e LCA"/>
      <Category icon={TrendingUp} title="Bolsa" text="Ações e ETFs"/>
      <Category icon={Building2} title="FIIs" text="Exposição ao mercado imobiliário"/>
      <Category icon={Coins} title="Cripto" text="Bitcoin, Ethereum e outros"/>
      <Category icon={DollarSign} title="Exterior" text="Dólar e ativos globais"/>
    </div></CardContent></Card>

    <section className="grid gap-3 md:grid-cols-2">
      <Card><CardContent className="p-5"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Home className="size-5"/></span><div><h2 className="font-semibold">Imóveis</h2><p className="text-xs text-muted-foreground">Compare compra, aluguel, financiamento e valorização.</p></div></div><div className="mt-4 rounded-xl border p-4"><p className="text-sm font-medium">Simulação prática</p><p className="mt-1 text-xs text-muted-foreground">A próxima etapa pode transformar preço, entrada, aluguel e juros em um cenário comparável.</p></div></CardContent></Card>
      <Card className="border-primary/20 bg-primary/5"><CardContent className="flex items-center justify-between gap-4 p-5"><div><p className="flex items-center gap-2 font-semibold"><Sparkles className="size-4"/> Entenda o movimento</p><p className="text-sm text-muted-foreground">Pergunte ao assistente sobre um ativo e use seus próprios números como contexto.</p></div><Button asChild><Link to="/assistente">Perguntar</Link></Button></CardContent></Card>
    </section>
    <p className="text-[11px] text-muted-foreground">Cotações são informativas e dependem da disponibilidade dos provedores. Variações exibidas não constituem recomendação de investimento.</p>
  </div></FinanceLayout>
}
function Quote({q}:{q:QuoteData}){const up=q.change>=0;return <Card className="transition-all hover:-translate-y-0.5 hover:border-primary/20"><CardContent className="p-4"><div className="flex items-start justify-between gap-2"><div><p className="text-xs text-muted-foreground">{q.symbol}</p><p className="font-semibold">{q.name}</p></div><span className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${up?"bg-emerald-500/10 text-emerald-600":"bg-red-500/10 text-red-600"}`}>{up?<ArrowUp className="size-3"/>:<ArrowDown className="size-3"/>}{Math.abs(q.change).toFixed(2)}%</span></div><p className="mt-5 text-2xl font-bold">{q.symbol==="^BVSP"||q.symbol==="IFIX"?q.price.toLocaleString("pt-BR",{maximumFractionDigits:2}):money(q.price)}</p><p className="mt-1 text-[11px] text-muted-foreground">Variação da sessão/24h disponível</p></CardContent></Card>}
function Category({icon:Icon,title,text}:{icon:any;title:string;text:string}){return <div className="rounded-xl border p-4 transition-colors hover:bg-accent/30"><Icon className="size-5 text-primary"/><p className="mt-3 font-semibold">{title}</p><p className="text-xs text-muted-foreground">{text}</p></div>}
