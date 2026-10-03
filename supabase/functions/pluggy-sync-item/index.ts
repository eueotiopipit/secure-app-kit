import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    const internalKey = req.headers.get("X-Internal-Key");
    const internalSecret = Deno.env.get("PLUGGY_WEBHOOK_SECRET");
    const isInternal = Boolean(internalKey && internalSecret && internalKey === internalSecret);
    if (!authHeader && !isInternal) return json({ error: "Não autenticado." }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: authHeader ? { Authorization: authHeader } : {} } },
    );

    const { data: { user }, error: userError } = authHeader
      ? await supabase.auth.getUser()
      : { data: { user: null }, error: null };
    if (!isInternal && (userError || !user)) return json({ error: "Sessão inválida." }, 401);

    const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
    const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");
    if (!clientId || !clientSecret) return json({ error: "Integração bancária ainda não configurada no servidor." }, 503);

    const { itemId } = await req.json();
    if (!itemId) return json({ error: "itemId é obrigatório." }, 400);

    const apiKeyResponse = await fetch("https://api.pluggy.ai/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
    });
    const apiKeyData = await apiKeyResponse.json();
    if (!apiKeyResponse.ok) return json({ error: "Falha ao autenticar com o provedor bancário." }, 502);

    const apiKey = apiKeyData.apiKey;
    const tokenResponse = await fetch("https://api.pluggy.ai/connect_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
      body: JSON.stringify({
        options: {
          clientUserId: targetUserId,
          avoidDuplicates: true,
        },
      }),
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) return json({ error: "Não foi possível iniciar a conexão bancária." }, 502);

    return json({ accessToken: tokenData.accessToken });
  } catch (error) {
    console.error(error);
    return json({ error: "Erro ao iniciar a conexão bancária." }, 500);
  }
});

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
