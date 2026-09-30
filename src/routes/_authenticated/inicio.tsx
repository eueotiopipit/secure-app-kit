import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Sparkles } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/inicio")({
  head: () => ({
    meta: [
      { title: "Início — Meu App" },
      { name: "description", content: "Sua área logada no Meu App." },
      { property: "og:title", content: "Início — Meu App" },
      { property: "og:description", content: "Sua área logada no Meu App." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InicioPage,
});

function InicioPage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
  });

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const name =
    profile?.display_name ||
    (user.user_metadata["display_name"] as string | undefined) ||
    (user.user_metadata["full_name"] as string | undefined) ||
    user.email?.split("@")[0] ||
    "usuário";
  const avatarUrl =
    profile?.avatar_url ||
    (user.user_metadata["avatar_url"] as string | undefined) ||
    undefined;
  const initials = name.slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="text-gradient-gold text-xl font-bold tracking-tight">
          Meu App
        </span>
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="glow-card w-full max-w-lg text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-accent">
              <Sparkles className="size-6 text-accent-foreground" />
            </div>
            <CardTitle className="text-3xl">
              {isLoading ? (
                <Skeleton className="mx-auto h-9 w-56" />
              ) : (
                <>Olá, {name}!</>
              )}
            </CardTitle>
            <CardDescription className="text-base">
              Você entrou na sua conta. Esta é a sua área no app — a partir
              daqui podemos construir o que você precisar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Conectado como <strong>{user.email}</strong>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
