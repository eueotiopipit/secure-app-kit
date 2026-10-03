import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autenticado." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) return json({ error: "Sessão inválida." }, 401);

    const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
    const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      return json({ error: "Integração bancária ainda não configurada no servidor." }, 503);
    }

    const authResponse = await fetch("https://api.pluggy.ai/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
    });
    const authData = await authResponse.json();
    if (!authResponse.ok) return json({ error: "Falha ao autenticar com o provedor bancário." }, 502);

    const body = await req.json();
    const itemId = body?.itemId;
    if (!itemId || typeof itemId !== "string") return json({ error: "itemId é obrigatório." }, 400);

    const apiKey = authData.apiKey;
    const itemResponse = await fetch(`https://api.pluggy.ai/items/${encodeURIComponent(itemId)}`, {
      headers: { "X-API-KEY": apiKey },
    });
    const item = await itemResponse.json();
    if (!itemResponse.ok) return json({ error: "Não foi possível consultar a conexão bancária." }, 502);

    if (item.clientUserId !== user.id) {
      return json({ error: "Conexão bancária não pertence a este usuário." }, 403);
    }

    const connector = item.connector ?? {};
    const { error: connectionError } = await supabase
      .from("bank_connections")
      .upsert({
        user_id: user.id,
        provider: "pluggy",
        item_id: item.id,
        institution_name: connector.name ?? "Banco conectado",
        institution_logo_url: connector.imageUrl ?? null,
        status: item.status ?? "CONNECTED",
        consent_expires_at: item.consentExpiresAt ?? null,
        last_synced_at: new Date().toISOString(),
      }, { onConflict: "item_id" });

    if (connectionError) throw connectionError;

    const accountsResponse = await fetch(
      `https://api.pluggy.ai/accounts?itemId=${encodeURIComponent(itemId)}`,
      { headers: { "X-API-KEY": apiKey } },
    );
    const accountsData = await accountsResponse.json();
    if (!accountsResponse.ok) return json({ error: "Conta conectada, mas não foi possível ler as contas." }, 502);

    let imported = 0;
    for (const account of accountsData.results ?? []) {
      let next = `?accountId=${encodeURIComponent(account.id)}`;
      let pages = 0;

      while (next && pages < 20) {
        const txResponse = await fetch(`https://api.pluggy.ai/v2/transactions${next}`, {
          headers: { "X-API-KEY": apiKey },
        });
        const txData = await txResponse.json();
        if (!txResponse.ok) break;

        const rows = (txData.results ?? []).map((tx: any) => {
          const amount = Math.abs(Number(tx.amount ?? 0));
          const occurredOn = String(tx.date ?? "").slice(0, 10);
          return {
            user_id: user.id,
            amount_cents: Math.round(amount * 100),
            category: tx.category || "Importado do banco",
            description: tx.description || "Movimentação bancária",
            occurred_on: occurredOn,
            payment_method: tx.paymentData?.paymentMethod || tx.operationType || null,
            type: tx.type === "CREDIT" ? "income" : "expense",
            source: "pluggy",
            external_id: tx.id,
          };
        }).filter((tx: any) => tx.occurred_on && tx.amount_cents > 0);

        if (rows.length) {
          const { error } = await supabase
            .from("financial_transactions")
            .upsert(rows, { onConflict: "user_id,external_id" });
          if (error) throw error;
          imported += rows.length;
        }

        next = txData.next ?? null;
        pages += 1;
      }
    }

    return json({ ok: true, itemId: item.id, imported });
  } catch (error) {
    console.error(error);
    return json({ error: "Não foi possível sincronizar os dados bancários." }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
