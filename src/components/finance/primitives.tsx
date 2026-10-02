import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">{eyebrow}</p>}<h1 className="text-2xl font-bold sm:text-3xl">{title}</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p></div>{action}</header>;
}
export function StatCard({ label, value, note, icon: Icon, tone="default" }: { label:string; value:string; note?:string; icon:LucideIcon; tone?:"default"|"good"|"bad" }) {
  return <Card className="financial-card"><CardContent className="p-4"><div className="flex items-start justify-between"><div className={cn("flex size-9 items-center justify-center rounded-lg bg-secondary", tone === "good" && "bg-success/15 text-success", tone === "bad" && "bg-destructive/15 text-destructive")}><Icon className="size-4" /></div>{tone === "good" && <ArrowUpRight className="size-4 text-success" />}{tone === "bad" && <ArrowDownRight className="size-4 text-destructive" />}</div><p className="mt-4 text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold tabular-nums">{value}</p>{note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}</CardContent></Card>;
}
export function ProgressBlock({ value, label, detail, tone="primary" }: { value:number; label:string; detail?:string; tone?:"primary"|"success"|"warning"|"destructive" }) {
  return <div><div className="mb-2 flex items-center justify-between gap-4 text-sm"><span className="font-medium">{label}</span><span className="tabular-nums text-muted-foreground">{Math.round(value)}%</span></div><Progress value={Math.max(0, Math.min(100, value))} className={cn("h-2", tone === "success" && "[&>div]:bg-success", tone === "warning" && "[&>div]:bg-warning", tone === "destructive" && "[&>div]:bg-destructive")} />{detail && <p className="mt-2 text-xs text-muted-foreground">{detail}</p>}</div>;
}
export function EmptyState({ icon: Icon, title, description, action }: { icon:LucideIcon; title:string; description:string; action?:()=>void }) {
 return <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center"><div className="flex size-12 items-center justify-center rounded-xl bg-accent"><Icon className="size-5 text-primary" /></div><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>{action && <Button className="mt-4" onClick={action}><Plus className="size-4" />Adicionar</Button>}</div>;
}
