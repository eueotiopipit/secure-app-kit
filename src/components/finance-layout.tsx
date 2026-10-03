import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { BarChart3, CreditCard, Home, LogOut, PiggyBank, Receipt, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/inicio", label: "Visão geral", icon: Home },
  { to: "/lancamentos", label: "Lançamentos", icon: Receipt },
  { to: "/dividas", label: "Dívidas", icon: CreditCard },
  { to: "/porquinhos", label: "Porquinhos", icon: PiggyBank },
  { to: "/planejamento", label: "Planejamento", icon: BarChart3 },
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
        <div className="flex items-center gap-2">
          <Button asChild variant={location.pathname === "/perfil" ? "secondary" : "outline"} size="sm"><Link to="/perfil"><UserCircle className="size-4" /><span className="hidden sm:inline">Perfil</span></Link></Button>
          <Button variant="ghost" size="sm" onClick={logout} title="Sair">
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 md:hidden">{items.slice(0, 5).map(({ to, label, icon: Icon }) => <Button key={to} asChild variant={location.pathname === to ? "secondary" : "ghost"} size="sm" className="shrink-0"><Link to={to}><Icon className="size-4" />{label}</Link></Button>)}</div>
    </header>
    <main className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8">{children}</main>
  </div>;
}

export function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}
