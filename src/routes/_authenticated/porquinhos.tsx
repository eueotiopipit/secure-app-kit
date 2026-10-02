import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/porquinhos")({
  head: () => ({
    meta: [
      { title: "Porquinhos — Plano Anti-Dívidas" },
      { name: "description", content: "Crie metas e acompanhe o dinheiro guardado." },
      { property: "og:title", content: "Porquinhos — Plano Anti-Dívidas" },
      { property: "og:description", content: "Crie metas e acompanhe o dinheiro guardado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PorquinhosPage,
});

function PorquinhosPage() {
  return <div />;
}