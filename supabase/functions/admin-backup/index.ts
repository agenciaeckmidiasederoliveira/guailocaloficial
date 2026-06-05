import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    if (!token) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isAdminEmail = userData.user.email === "gestorederoliveira@gmail.com";
    if (!roleData && !isAdminEmail) {
      return new Response(JSON.stringify({ error: "Apenas admin" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. List all auth users (paginated)
    const allUsers: any[] = [];
    let page = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) break;
      allUsers.push(...data.users.map((u) => ({
        id: u.id, email: u.email, phone: u.phone,
        created_at: u.created_at, last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
        user_metadata: u.user_metadata, app_metadata: u.app_metadata,
      })));
      if (data.users.length < 1000) break;
      page++;
    }

    // 2. List all storage files (bucket "empresas") recursively
    const storageFiles: any[] = [];
    async function listFolder(prefix: string) {
      const { data, error } = await admin.storage.from("empresas").list(prefix, {
        limit: 1000, sortBy: { column: "name", order: "asc" },
      });
      if (error || !data) return;
      for (const item of data) {
        const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
        if (item.id === null) {
          // folder
          await listFolder(fullPath);
        } else {
          const { data: pub } = admin.storage.from("empresas").getPublicUrl(fullPath);
          storageFiles.push({
            path: fullPath, size: item.metadata?.size,
            mimetype: item.metadata?.mimetype, created_at: item.created_at,
            public_url: pub.publicUrl,
          });
        }
      }
    }
    await listFolder("");

    return new Response(JSON.stringify({
      auth_users: allUsers,
      storage_files: storageFiles,
      counts: { users: allUsers.length, files: storageFiles.length },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
