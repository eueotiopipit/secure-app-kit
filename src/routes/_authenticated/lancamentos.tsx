import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/lancamentos")({
  head: () => ({
    meta: [
      { title: "Lançamentos — Plano Anti-Dívidas" },
      { name: "description", content: "Organize suas receitas e seus gastos." },
      { property: "og:title", content: "Lançamentos — Plano Anti-Dívidas" },
      { property: "og:description", content: "Organize suas receitas e seus gastos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LancamentosPage,
});

function LancamentosPage() {
  return <div />;
}