import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SITE = "https://www.guialocalbr.com.br";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [clientPagesRes, servicePagesRes, empresasRes] = await Promise.all([
      supabase.from("client_pages").select("id, slug, updated_at").eq("status", "ativo"),
      supabase
        .from("client_service_pages")
        .select("slug_servico, updated_at, page_id")
        .eq("status", "ativo"),
      supabase
        .from("empresas")
        .select("slug, updated_at, cidade, estado, plano, nicho")
        .eq("status", "aprovado")
        .not("slug", "is", null),
    ]);

    // Mapa page_id -> slug da página principal
    const pageSlugById = new Map<string, string>();
    for (const p of clientPagesRes.data ?? []) {
      pageSlugById.set((p as any).id, (p as any).slug);
    }

    const staticUrls = [
      { loc: `${SITE}/`, changefreq: "daily", priority: "1.0" },
      { loc: `${SITE}/busca`, changefreq: "daily", priority: "0.9" },
      { loc: `${SITE}/cadastro`, changefreq: "weekly", priority: "0.8" },
      { loc: `${SITE}/planos`, changefreq: "weekly", priority: "0.8" },
      { loc: `${SITE}/categorias`, changefreq: "weekly", priority: "0.8" },
      { loc: `${SITE}/cidades`, changefreq: "weekly", priority: "0.8" },
      { loc: `${SITE}/blog`, changefreq: "daily", priority: "0.8" },
      { loc: `${SITE}/sobre`, changefreq: "monthly", priority: "0.6" },
    ];

    // Página principal do cliente vive em /:slug (raiz)
    const clientUrls = (clientPagesRes.data ?? []).map((p: any) => ({
      loc: `${SITE}/${p.slug}`,
      lastmod: (p.updated_at || "").slice(0, 10),
      changefreq: "weekly",
      priority: "0.9",
    }));

    // Subpáginas de serviço: por enquanto não há rota pública dedicada,
    // mantemos vazio até a rota /:slug/:servico ser definida.
    const serviceUrls: any[] = [];

    const empresaUrls = (empresasRes.data ?? []).map((e: any) => ({
      loc: `${SITE}/empresa/${e.slug}`,
      lastmod: (e.updated_at || "").slice(0, 10),
      changefreq: "weekly",
      priority: e.plano === "premium" ? "0.9" : "0.7",
    }));

    const cidadesSet = new Map<string, string>();
    const cidadeSlugSet = new Map<string, string>();
    const catCidadeSet = new Map<string, string>();
    const categoriaSet = new Map<string, string>();

    const toSlug = (s: string) =>
      (s || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

    for (const e of empresasRes.data ?? []) {
      const est = (e.estado || "").toLowerCase().trim();
      const cid = (e.cidade || "").toLowerCase().trim();
      const cidSlug = toSlug(e.cidade);
      const catSlug = toSlug(e.nicho ?? "");
      if (est && cid) {
        const key = `${encodeURIComponent(est)}/${encodeURIComponent(cid)}`;
        if (!cidadesSet.has(key)) cidadesSet.set(key, e.updated_at);
      }
      if (cidSlug && !cidadeSlugSet.has(cidSlug)) cidadeSlugSet.set(cidSlug, e.updated_at);
      if (catSlug && !categoriaSet.has(catSlug)) categoriaSet.set(catSlug, e.updated_at);
      if (catSlug && cidSlug) {
        const k = `${catSlug}/${cidSlug}`;
        if (!catCidadeSet.has(k)) catCidadeSet.set(k, e.updated_at);
      }
    }
    const cidadeUrls = Array.from(cidadesSet.entries()).map(([k, lastmod]) => ({
      loc: `${SITE}/cidade/${k}`,
      lastmod: (lastmod || "").slice(0, 10),
      changefreq: "weekly",
      priority: "0.7",
    }));
    const cidadeSlugUrls = Array.from(cidadeSlugSet.entries()).map(([slug, lastmod]) => ({
      loc: `${SITE}/cidades/${slug}`,
      lastmod: (lastmod || "").slice(0, 10),
      changefreq: "weekly",
      priority: "0.8",
    }));
    const categoriaUrls = Array.from(categoriaSet.entries()).map(([slug, lastmod]) => ({
      loc: `${SITE}/empresas/${slug}`,
      lastmod: (lastmod || "").slice(0, 10),
      changefreq: "weekly",
      priority: "0.8",
    }));
    const catCidadeUrls = Array.from(catCidadeSet.entries()).map(([k, lastmod]) => ({
      loc: `${SITE}/empresas/${k}`,
      lastmod: (lastmod || "").slice(0, 10),
      changefreq: "weekly",
      priority: "0.8",
    }));

    const all = [
      ...staticUrls,
      ...clientUrls,
      ...serviceUrls,
      ...cidadeUrls,
      ...cidadeSlugUrls,
      ...categoriaUrls,
      ...catCidadeUrls,
      ...empresaUrls,
    ];
    const xmlBody = all
      .map(
        (u: any) =>
          `  <url>\n    <loc>${u.loc}</loc>\n${
            u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ""
          }    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
      )
      .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlBody}\n</urlset>`;

    return new Response(xml, {
      headers: { ...corsHeaders, "Content-Type": "application/xml; charset=utf-8" },
    });
  } catch (e) {
    return new Response(`<!-- error: ${e instanceof Error ? e.message : "x"} -->`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  }
});
