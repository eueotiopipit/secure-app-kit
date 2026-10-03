import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, x-internal-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const expected = Deno.env.get("PLUGGY_WEBHOOK_SECRET");
  const key = new URL(req.url).searchParams.get("key");
  if (!expected || !key || key !== expected) {
    return new Response("Unauthorized", { status: 401, headers: cors });
  }

  try {
    const payload = await req.json();
    const itemId = payload?.itemId;
    const event = String(payload?.event ?? "");

    if (!itemId || (!event.startsWith("item/") && !event.startsWith("transactions/"))) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Respond quickly to Pluggy; the actual import is handled asynchronously.
    const functionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/pluggy-sync-item`;
    const secret = expected;
    EdgeRuntime.waitUntil(
      fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Key": secret,
        },
        body: JSON.stringify({ itemId }),
      }).catch((error) => console.error("pluggy-sync-item failed", error)),
    );

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
