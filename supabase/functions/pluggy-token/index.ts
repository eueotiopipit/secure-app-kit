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
      console.error("Pluggy credentials missing: PLUGGY_CLIENT_ID/PLUGGY_CLIENT_SECRET");
      return json({
        error: "Integração bancária não configurada no servidor.",
        code: "PLUGGY_SECRETS_MISSING",
      }, 503);
    }

    const authResponse = await fetch("https://api.pluggy.ai/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
    });
    const authData = await authResponse.json().catch(() => ({}));
    if (!authResponse.ok || !authData.apiKey) {
      console.error("Pluggy /auth failed:", authResponse.status, authData);
      return json({
        error: "A autenticação da integração bancária foi recusada pela Pluggy.",
        code: "PLUGGY_AUTH_FAILED",
      }, 502);
    }

    const webhookSecret = Deno.env.get("PLUGGY_WEBHOOK_SECRET");
    const webhookUrl = webhookSecret
      ? `${Deno.env.get("SUPABASE_URL")}/functions/v1/pluggy-webhook?key=${encodeURIComponent(webhookSecret)}`
      : undefined;

    const tokenResponse = await fetch("https://api.pluggy.ai/connect_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": authData.apiKey },
      body: JSON.stringify({
        options: {
          clientUserId: user.id,
          avoidDuplicates: true,
          oauthRedirectUri: "https://secure-app-kit.lovable.app/contas",
          ...(webhookUrl ? { webhookUrl } : {}),
        },
      }),
    });
    const tokenData = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokenData.accessToken) {
      console.error("Pluggy /connect_token failed:", tokenResponse.status, tokenData);
      return json({
        error: "A Pluggy recusou a criação do token de conexão.",
        code: "PLUGGY_CONNECT_TOKEN_FAILED",
      }, 502);
    }

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
