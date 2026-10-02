import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/planejamento")({
  head: () => ({
    meta: [
      { title: "Planejamento — Plano Anti-Dívidas" },
      { name: "description", content: "Orçamento, calendário, relatórios e desafio financeiro." },
      { property: "og:title", content: "Planejamento — Plano Anti-Dívidas" },
      { property: "og:description", content: "Orçamento, calendário, relatórios e desafio financeiro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlanejamentoPage,
});

function PlanejamentoPage() {
  return <div />;
}