import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dividas")({
  head: () => ({
    meta: [
      { title: "Dívidas — Plano Anti-Dívidas" },
      { name: "description", content: "Acompanhe suas dívidas e pagamentos." },
      { property: "og:title", content: "Dívidas — Plano Anti-Dívidas" },
      { property: "og:description", content: "Acompanhe suas dívidas e pagamentos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DividasPage,
});

function DividasPage() {
  return <div />;
}