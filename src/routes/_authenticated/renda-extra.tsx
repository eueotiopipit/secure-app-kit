import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bike, Camera, ChevronRight, Clock3, DollarSign, Gauge, Lightbulb,
  ShoppingBag, Store, Truck, WandSparkles, Sparkles, BriefcaseBusiness,
} from "lucide-react";
import { FinanceLayout } from "@/components/finance-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/renda-extra")({ component: RendaExtraPage });

type Idea = {
  id: string; title: string; subtitle: string; icon: any; potential: string;
  investment: string; difficulty: string; time: string; steps: string[];
};

const ideas: Idea[] = [
  { id:"delivery", title:"Entregas", subtitle:"Moto ou bike", icon:Truck, potential:"R$ 80–R$ 250/dia", investment:"Baixo / médio", difficulty:"Média", time:"4–8h", steps:["Escolha as plataformas disponíveis na sua região.","Separe combustível, manutenção e taxas antes de calcular o lucro.","Defina uma meta diária e registre o resultado líquido.","Ajuste horários e regiões com base no seu próprio histórico."] },
  { id:"content", title:"Conteúdo", subtitle:"TikTok, Instagram e YouTube", icon:Camera, potential:"Variável", investment:"Baixo", difficulty:"Média", time:"1–4h/dia", steps:["Escolha um nicho e uma frequência sustentável.","Publique, meça alcance e retenção e repita os formatos que funcionarem.","Monetize com afiliados, serviços, produtos ou publicidade conforme o canal."] },
  { id:"street", title:"Venda na rua", subtitle:"Produtos físicos", icon:Store, potential:"Variável", investment:"Baixo / médio", difficulty:"Média", time:"3–8h", steps:["Escolha produtos de giro e margem conhecidos.","Comece com pouco estoque e registre custo por unidade.","Teste pontos e horários antes de aumentar o investimento."] },
  { id:"marketplace", title:"Marketplaces", subtitle:"Shopee e Mercado Livre", icon:ShoppingBag, potential:"Variável", investment:"Médio", difficulty:"Média", time:"2–6h/dia", steps:["Escolha um produto com demanda e margem após taxas.","Calcule frete, embalagem, comissão e devoluções.","Teste pequenos lotes antes de escalar anúncios e estoque."] },
  { id:"online", title:"Serviços online", subtitle:"Design, edição, suporte e consultoria", icon:BriefcaseBusiness, potential:"Variável", investment:"Baixo", difficulty:"Média", time:"2–6h", steps:["Defina um serviço específico e um preço inicial.","Monte 2–3 exemplos de trabalho e uma oferta simples.","Prospecte clientes e acompanhe horas, receita e lucro líquido."] },
  { id:"ai", title:"Trabalhos com IA", subtitle:"Automação e criação", icon:WandSparkles, potential:"Variável", investment:"Baixo", difficulty:"Média", time:"2–6h", steps:["Escolha um problema que possa ser resolvido com IA.","Crie um fluxo simples e revise todo resultado antes de entregar.","Venda o resultado final, não apenas o uso da ferramenta."] },
];

function RendaExtraPage() {
  const [active, setActive] = useState("delivery");
  const [goal, setGoal] = useState(2000);
  const [days, setDays] = useState(26);
  const [hours, setHours] = useState(4);
  const item = (ideas.find(x => x.id === active) ?? ideas[0])!;
  const Icon = item.icon;

  const simulation = useMemo(() => {
    const daily = days > 0 ? goal / days : 0;
    const hourly = hours > 0 ? daily / hours : 0;
    return { daily, hourly };
  }, [goal, days, hours]);

  return <FinanceLayout><div className="space-y-6 pb-8">
    <header>
      <p className="flex items-center gap-2 text-sm text-primary"><Sparkles className="size-4"/> Oportunidades</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Aumente sua renda</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Explore formas de renda extra, compare esforço e investimento e transforme uma meta mensal em números práticos.</p>
    </header>

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ideas.map((idea) => { const I=idea.icon; return <button key={idea.id} onClick={()=>setActive(idea.id)} className={"group rounded-2xl border bg-card p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 "+(active===idea.id?"ring-2 ring-primary/30":"")}>
        <div className="flex items-start justify-between"><span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><I className="size-5"/></span><ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1"/></div>
        <h2 className="mt-4 font-semibold">{idea.title}</h2><p className="text-xs text-muted-foreground">{idea.subtitle}</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]"><Stat icon={<DollarSign/>} label="Potencial" value={idea.potential}/><Stat icon={<Gauge/>} label="Dificuldade" value={idea.difficulty}/><Stat icon={<ShoppingBag/>} label="Inicial" value={idea.investment}/><Stat icon={<Clock3/>} label="Tempo" value={idea.time}/></div>
      </button>})}
    </section>

    <Card className="overflow-hidden border-primary/15"><CardContent className="p-0">
      <div className="border-b bg-primary/5 p-5 sm:p-6"><div className="flex items-center gap-3"><span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="size-6"/></span><div><p className="text-xs font-semibold uppercase tracking-wider text-primary">Oportunidade selecionada</p><h2 className="text-xl font-bold">{item.title}</h2><p className="text-sm text-muted-foreground">{item.subtitle}</p></div></div></div>
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4"><Info title="Potencial estimado" value={item.potential}/><Info title="Investimento inicial" value={item.investment}/><Info title="Dificuldade" value={item.difficulty}/><Info title="Tempo" value={item.time}/></div>
      <div className="border-t p-5 sm:p-6"><h3 className="font-semibold">Como começar</h3><div className="mt-4 grid gap-3 md:grid-cols-2">{item.steps.map((step,i)=><div key={step} className="flex gap-3 rounded-xl border p-4"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i+1}</span><p className="text-sm text-muted-foreground">{step}</p></div>)}</div></div>
    </CardContent></Card>

    <Card><CardContent className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">Simulador de meta</h2><p className="mt-1 text-sm text-muted-foreground">Use a meta para estimar quanto precisaria gerar por dia e por hora.</p></div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold text-primary">Simulador</span></div>
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <Field label="Meta mensal"><input type="number" min="0" value={goal} onChange={e=>setGoal(Math.max(0,Number(e.target.value)))} /></Field>
        <Field label="Dias trabalhados"><input type="number" min="1" max="31" value={days} onChange={e=>setDays(Math.min(31,Math.max(1,Number(e.target.value))))} /></Field>
        <Field label="Horas por dia"><input type="number" min="1" max="24" value={hours} onChange={e=>setHours(Math.min(24,Math.max(1,Number(e.target.value))))} /></Field>
        <div className="rounded-xl bg-primary/10 p-4"><p className="text-xs text-muted-foreground">Referência</p><p className="mt-1 text-2xl font-bold">R$ {simulation.daily.toFixed(2).replace(".",",")}/dia</p><p className="mt-1 text-xs text-muted-foreground">≈ R$ {simulation.hourly.toFixed(2).replace(".",",")}/hora</p></div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">A simulação é matemática e não desconta combustível, taxas, impostos, materiais ou outros custos. Para lucro líquido, registre esses custos nas suas movimentações.</p>
    </CardContent></Card>

    <Card className="border-primary/20 bg-primary/5"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="flex items-center gap-2 font-semibold"><Sparkles className="size-4"/> Analisar com IA</p><p className="text-sm text-muted-foreground">Cruze sua renda, gastos, dívidas e metas com a oportunidade selecionada.</p></div><Button asChild><a href="/assistente">Abrir assistente</a></Button></CardContent></Card>
  </div></FinanceLayout>;
}
function Stat({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="rounded-lg bg-muted/50 p-2"><div className="flex items-center gap-1 text-muted-foreground">{icon}<span>{label}</span></div><p className="mt-1 truncate font-semibold text-foreground">{value}</p></div>}
function Info({title,value}:{title:string;value:string}){return <div className="rounded-xl border p-4"><p className="text-xs text-muted-foreground">{title}</p><p className="mt-1 font-semibold">{value}</p></div>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="text-sm font-medium">{label}<div className="mt-2">{children}</div></label>}
