import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Order matters: parents first, children last
const RESTORE_ORDER = [
  "profiles",
  "user_roles",
  "parceiros",
  "empresas",
  "client_pages",
  "client_service_pages",
  "blog_posts",
  "avaliacoes",
  "favoritos",
  "pagamentos",
  "notificacoes_parceiro",
  "empresa_milestones",
  "analytics",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    if (!token) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: corsHeaders });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: corsHeaders });
    }
    const isAdminEmail = userData.user.email === "gestorederoliveira@gmail.com";
    const { data: roleData } = await admin
      .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleData && !isAdminEmail) {
      return new Response(JSON.stringify({ error: "Apenas admin" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { backup, mode = "upsert", tables: requestedTables } = body;
    if (!backup || typeof backup !== "object") {
      return new Response(JSON.stringify({ error: "Backup inválido" }), { status: 400, headers: corsHeaders });
    }

    const report: Record<string, { inserted: number; failed: number; error?: string }> = {};
    const tablesToRestore = requestedTables ?? RESTORE_ORDER;

    for (const table of tablesToRestore) {
      if (!RESTORE_ORDER.includes(table)) continue;
      const rows = backup[table];
      if (!Array.isArray(rows) || rows.length === 0) {
        report[table] = { inserted: 0, failed: 0 };
        continue;
      }

      let inserted = 0, failed = 0, lastError = "";
      // chunks of 100
      for (let i = 0; i < rows.length; i += 100) {
        const chunk = rows.slice(i, i + 100);
        const query = mode === "upsert"
          ? admin.from(table).upsert(chunk, { onConflict: "id" })
          : admin.from(table).insert(chunk);
        const { error } = await query;
        if (error) {
          failed += chunk.length;
          lastError = error.message;
        } else {
          inserted += chunk.length;
        }
      }
      report[table] = { inserted, failed, ...(lastError ? { error: lastError } : {}) };
    }

    return new Response(JSON.stringify({ ok: true, report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
