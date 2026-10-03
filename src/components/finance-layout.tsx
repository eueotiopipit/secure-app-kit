import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { BarChart3, Building2, CreditCard, Home, LogOut, PiggyBank, Receipt, UserCircle, TrendingUp, Rocket, Bot } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/inicio", label: "Início", icon: Home },
  { to: "/lancamentos", label: "Lançamentos", icon: Receipt },
  { to: "/contas", label: "Contas", icon: Building2 },
  { to: "/dividas", label: "Dívidas", icon: CreditCard },
  { to: "/porquinhos", label: "Porquinhos", icon: PiggyBank },
  { to: "/planejamento", label: "Planejamento", icon: BarChart3 },\n  { to: "/renda-extra", label: "Renda extra", icon: Rocket },\n  { to: "/investimentos", label: "Investimentos", icon: TrendingUp },\n  { to: "/assistente", label: "IA", icon: Bot },
  { to: "/perfil", label: "Perfil", icon: UserCircle },
] as const;

export function FinanceLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Não foi possível sair da conta.");
      return;
    }
    navigate({ to: "/auth", replace: true });
  }

  return <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/inicio" className="text-lg font-bold tracking-tight">Plano <span className="text-primary">Anti-Dívidas</span></Link>
        <nav className="hidden gap-1 md:flex">{items.map(({ to, label, icon: Icon }) => <Button key={to} asChild variant={location.pathname === to ? "secondary" : "ghost"} size="sm"><Link to={to}><Icon className="size-4" />{label}</Link></Button>)}</nav>
        <div className="flex items-center gap-1">
          <Button asChild variant={location.pathname === "/perfil" ? "secondary" : "ghost"} size="sm"><Link to="/perfil"><UserCircle className="size-5" /><span className="hidden lg:inline">Perfil</span></Link></Button>
          <Button variant="ghost" size="sm" onClick={logout} title="Sair"><LogOut className="size-4" /><span className="hidden sm:inline">Sair</span></Button>
        </div>
      </div>
    </header>

    <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-24 md:py-8 md:pb-8">{children}</main>

    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.slice(0, 5).map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to;
          return <Link key={to} to={to} className={`flex flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-medium transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
            <span className={`flex size-7 items-center justify-center rounded-full ${active ? "bg-primary/10" : ""}`}><Icon className="size-4" /></span>
            {label}
          </Link>;
        })}
      </div>
    </nav>
  </div>;
}

export function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}
