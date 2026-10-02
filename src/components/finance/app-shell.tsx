import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, CalendarDays, CircleDollarSign, CreditCard, LayoutDashboard, LogOut, Menu, PiggyBank, Settings2, UserRound, WalletCards } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const items = [
 { to:"/inicio", label:"Visão geral", icon:LayoutDashboard }, { to:"/lancamentos", label:"Lançamentos", icon:WalletCards }, { to:"/dividas", label:"Dívidas", icon:CreditCard }, { to:"/porquinhos", label:"Porquinhos", icon:PiggyBank }, { to:"/planejamento", label:"Planejamento", icon:CalendarDays }, { to:"/perfil", label:"Perfil", icon:UserRound },
] as const;
function Brand(){ return <Link to="/inicio" className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><CircleDollarSign className="size-5" /></div><div><p className="font-bold leading-none">Plano Anti-Dívidas</p><p className="mt-1 text-[11px] text-muted-foreground">Seu dinheiro, com clareza.</p></div></Link> }
function Nav({ mobile=false }: { mobile?:boolean }) { return <nav className={cn(mobile ? "grid grid-cols-5" : "space-y-1")}>
 {items.slice(0, mobile ? 5 : items.length).map(({to,label,icon:Icon}) => <Link key={to} to={to} activeProps={{className: mobile ? "text-primary" : "bg-accent text-accent-foreground"}} className={cn("transition-colors", mobile ? "flex min-w-0 flex-col items-center gap-1 px-1 py-2 text-[10px] text-muted-foreground" : "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground")}><Icon className="size-5 shrink-0"/><span className="truncate">{mobile && label === "Visão geral" ? "Início" : label}</span></Link>)}
 </nav> }
export function AppShell({ children }: { children:React.ReactNode }) { const navigate=useNavigate(); const qc=useQueryClient(); async function logout(){await qc.cancelQueries();qc.clear();await supabase.auth.signOut();navigate({to:"/auth",replace:true});}
 return <div className="min-h-screen bg-background"><aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-sidebar p-5 lg:flex lg:flex-col"><Brand/><div className="mt-10 flex-1"><Nav/></div><Button variant="ghost" className="justify-start text-muted-foreground" onClick={logout}><LogOut className="size-4"/>Sair</Button></aside>
 <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:hidden"><Brand/><Sheet><SheetTrigger asChild><Button size="icon" variant="ghost" aria-label="Abrir menu"><Menu className="size-5"/></Button></SheetTrigger><SheetContent side="right" className="w-72"><div className="mt-8"><Nav/><Button variant="ghost" className="mt-6 w-full justify-start text-muted-foreground" onClick={logout}><LogOut className="size-4"/>Sair</Button></div></SheetContent></Sheet></header>
 <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:ml-64 lg:px-8 lg:pb-10 lg:pt-8">{children}</main><div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"><Nav mobile/></div></div>;
}
