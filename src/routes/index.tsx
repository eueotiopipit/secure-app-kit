import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, Database, KeyRound } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meu App — Sua conta, seus dados" },
      {
        name: "description",
        content:
          "Entre com email e senha ou com o Google e acesse sua área no app.",
      },
      { property: "og:title", content: "Meu App — Sua conta, seus dados" },
      {
        property: "og:description",
        content:
          "Entre com email e senha ou com o Google e acesse sua área no app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-gradient-gold text-xl font-bold tracking-tight">
          Meu App
        </span>
        {signedIn ? (
          <Button asChild size="sm">
            <Link to="/inicio">Abrir o app</Link>
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <Link to="/auth">Entrar</Link>
          </Button>
        )}
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          bibito é o maior
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Crie sua conta em segundos com email e senha ou entre com o Google.
          Tudo salvo com segurança no banco de dados.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link to={signedIn ? "/inicio" : "/auth"}>
              {signedIn ? "Abrir o app" : "Começar agora"}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="mt-16 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          <Feature
            icon={<KeyRound className="size-5 text-primary" />}
            title="Login de verdade"
            text="Email e senha ou Google, com recuperação de senha por email."
          />
          <Feature
            icon={<Database className="size-5 text-primary" />}
            title="Banco de dados"
            text="Seu perfil fica salvo e disponível em qualquer dispositivo."
          />
          <Feature
            icon={<ShieldCheck className="size-5 text-primary" />}
            title="Privacidade"
            text="Cada pessoa só enxerga e edita os próprios dados."
          />
        </div>
      </main>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="glow-card rounded-xl bg-card p-5 text-left">
      <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-accent">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
