import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get pending companies count
    const { count: pendentes } = await supabase
      .from("empresas")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente");

    // Get today's new registrations
    const today = new Date().toISOString().split("T")[0];
    const { data: novas } = await supabase
      .from("empresas")
      .select("nome, cidade, estado, plano, status")
      .gte("data_cadastro", `${today}T00:00:00`)
      .order("data_cadastro", { ascending: false })
      .limit(10);

    // Get today's analytics summary
    const { count: viewsHoje } = await supabase
      .from("analytics")
      .select("*", { count: "exact", head: true })
      .eq("tipo_evento", "page_view")
      .gte("data_hora", `${today}T00:00:00`);

    const { count: whatsappHoje } = await supabase
      .from("analytics")
      .select("*", { count: "exact", head: true })
      .eq("tipo_evento", "click_whatsapp")
      .gte("data_hora", `${today}T00:00:00`);

    // Get payments pending
    const { count: pagamentosPendentes } = await supabase
      .from("pagamentos")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente");

    const summary = {
      pendentes: pendentes || 0,
      novasHoje: novas?.length || 0,
      empresasNovas: novas || [],
      viewsHoje: viewsHoje || 0,
      whatsappHoje: whatsappHoje || 0,
      pagamentosPendentes: pagamentosPendentes || 0,
      geradoEm: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    };

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
