import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil — Plano Anti-Dívidas" },
      { name: "description", content: "Gerencie seu perfil e sua conta." },
      { property: "og:title", content: "Perfil — Plano Anti-Dívidas" },
      { property: "og:description", content: "Gerencie seu perfil e sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  return <div />;
}