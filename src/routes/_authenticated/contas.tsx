import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Building2, CheckCircle2, Landmark, RefreshCw, Unplug, WalletCards, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinanceLayout } from "@/components/finance-layout";

export const Route = createFileRoute("/_authenticated/contas")({
  head: () => ({ meta: [{ title: "Contas bancárias — Plano Anti-Dívidas" }] }),
  component: ContasPage,
});

declare global {
  interface Window {
    PluggyConnect?: new (options: {
      connectToken: string;
      countries?: string[];
      products?: string[];
      allowFullscreen?: boolean;
      language?: string;
      theme?: "light" | "dark";
      onSuccess?: (data: { item: { id: string } }) => void | Promise<void>;
      onError?: (error: { message?: string }) => void | Promise<void>;
      onClose?: () => void | Promise<void>;
    }) => { init: () => void; destroy?: () => void; };
  }
}

type Connection = {
  id: string;
  item_id: string;
  institution_name: string | null;
  institution_logo_url: string | null;
  status: string;
  last_synced_at: string | null;
};

function ContasPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [widgetReady, setWidgetReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.PluggyConnect) {
      setWidgetReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://cdn.pluggy.ai/pluggy-connect/latest/pluggy-connect.js";
    script.async = true;
    script.onload = () => setWidgetReady(Boolean(window.PluggyConnect));
    script.onerror = () => toast.error("Não foi possível carregar a conexão bancária.");
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);

  const { data: connections = [], isLoading } = useQuery<Connection[]>({
    queryKey: ["bank-connections", user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("bank_connections").select("id,item_id,institution_name,institution_logo_url,status,last_synced_at").eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Connection[];
    },
  });

  async function connectBank() {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("pluggy-token", { body: {} });
      if (error || !data?.accessToken) throw new Error(data?.error || error?.message || "Não foi possível iniciar a conexão.");
      if (!window.PluggyConnect) throw new Error("A conexão bancária ainda está carregando. Tente novamente em alguns segundos.");
      setConnectToken(data.accessToken);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível conectar o banco.");
    } finally { setConnecting(false); }
  }

  async function syncItem(itemId: string) {
    setSyncing(itemId);
    try {
      const { data, error } = await supabase.functions.invoke("pluggy-sync-item", { body: { itemId } });
      if (error || !data?.ok) throw new Error(data?.error || error?.message || "Falha ao sincronizar.");
      await queryClient.invalidateQueries({ queryKey: ["bank-connections", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard", user.id] });
      toast.success((data.imported ?? 0) + " movimentações sincronizadas.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível sincronizar.");
    } finally { setSyncing(null); }
  }

  async function onConnected({ item }: { item: { id: string } }) {
    setConnectToken(null);
    toast.success("Banco conectado. Importando seu extrato...");
    await syncItem(item.id);
  }

  return (
    <FinanceLayout>
      <div className="mx-auto max-w-3xl space-y-6 pb-8">
        <header className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-medium text-primary"><Landmark className="size-4" /> Open Finance</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Suas contas</h1>
          <p className="text-sm text-muted-foreground">Conecte seu banco para trazer saldo e movimentações para o Plano Anti-Dívidas.</p>
        </header>

        {connectToken ? (
          <Card className="overflow-hidden">
            <CardHeader><CardTitle className="text-base">Conectando seu banco</CardTitle></CardHeader>
            <CardContent className="flex min-h-[220px] items-center justify-center text-center">
              <div>
                <RefreshCw className="mx-auto mb-3 size-7 animate-spin text-primary" />
                <p className="text-sm font-medium">{widgetReady ? "Abrindo conexão segura..." : "Carregando conexão segura..."}</p>
                <p className="mt-1 text-xs text-muted-foreground">Você será direcionado para autorizar o compartilhamento.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="overflow-hidden border-primary/20 bg-primary/[0.04]">
              <CardContent className="p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Building2 className="size-6" /></div>
                    <div><h2 className="font-semibold">Conecte uma conta bancária</h2><p className="mt-1 max-w-xl text-sm text-muted-foreground">O acesso acontece pelo fluxo seguro do banco. Você escolhe o que autoriza compartilhar.</p></div>
                  </div>
                  <Button onClick={connectBank} disabled={connecting} className="shrink-0"><WalletCards className="size-4" />{connecting ? "Preparando..." : "Conectar banco"}</Button>
                </div>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-emerald-500" /> Credenciais não ficam no app</span><span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-500" /> Você autoriza no banco</span></div>
              </CardContent>
            </Card>

            <section className="space-y-3">
              <div><h2 className="font-semibold">Contas conectadas</h2><p className="mt-1 text-xs text-muted-foreground">Os extratos importados aparecem automaticamente nos seus lançamentos.</p></div>
              {isLoading ? <Card><CardContent className="p-5 text-sm text-muted-foreground">Carregando contas...</CardContent></Card> : connections.length === 0 ? <Card><CardContent className="flex items-center gap-4 p-5"><div className="flex size-10 items-center justify-center rounded-full bg-muted"><Unplug className="size-4 text-muted-foreground" /></div><div><p className="text-sm font-medium">Nenhuma conta conectada</p><p className="mt-1 text-xs text-muted-foreground">Conecte seu primeiro banco acima.</p></div></CardContent></Card> : <div className="space-y-2">{connections.map((connection) => <Card key={connection.id}><CardContent className="flex items-center gap-3 p-4">{connection.institution_logo_url ? <img src={connection.institution_logo_url} alt="" className="size-10 rounded-xl object-contain bg-white p-1" /> : <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="size-5" /></div>}<div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{connection.institution_name || "Banco conectado"}</p><p className="mt-0.5 text-xs text-muted-foreground">{connection.last_synced_at ? "Sincronizado " + new Date(connection.last_synced_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Aguardando sincronização"}</p></div><span className="hidden items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-500 sm:flex"><CheckCircle2 className="size-3" /> Conectado</span><Button variant="outline" size="sm" onClick={() => syncItem(connection.item_id)} disabled={syncing === connection.item_id}><RefreshCw className={"size-4 " + (syncing === connection.item_id ? "animate-spin" : "")} /><span className="hidden sm:inline">{syncing === connection.item_id ? "Sincronizando" : "Sincronizar"}</span></Button></CardContent></Card>)}</div>}
            </section>

            <div className="rounded-xl border border-dashed p-4 text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">Como funciona:</strong> o app usa Open Finance para criar uma conexão autorizada, recebe os dados padronizados do banco e transforma as movimentações em lançamentos do seu painel.</div>
          </>
        )}
      </div>
    </FinanceLayout>
  );
}
