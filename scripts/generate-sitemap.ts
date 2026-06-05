// Gera public/sitemap.xml dinamicamente buscando empresas aprovadas e cidades únicas
// no Supabase. Roda nos hooks `predev` e `prebuild`.
//
// IMPORTANTE: usa apenas anon key + leitura pública das tabelas (empresas aprovadas
// são publicamente legíveis via RLS). Nada de service_role aqui.

import { writeFileSync } from "fs";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

const BASE_URL = "https://guialocalbr.com.br";

// Lovable injeta essas vars em build. Usa fallback hardcoded para o ref do projeto.
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://cogcidjnhnjlgvmbbgab.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNvZ2NpZGpuaG5qbGd2bWJiZ2FiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1NDU2MjAsImV4cCI6MjA4NDEyMTYyMH0.d5r5N1hZEG7CpMTWFFM5qeB958h39_OIPg8LV_ZdODA";

interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderSitemap(entries: SitemapEntry[]) {
  const urls = entries.map((e) => {
    const parts = [
      `  <url>`,
      `    <loc>${xmlEscape(e.loc)}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ].filter(Boolean);
    return parts.join("\n");
  });
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
    "",
  ].join("\n");
}

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const entries: SitemapEntry[] = [
    { loc: `${BASE_URL}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${BASE_URL}/busca`, changefreq: "daily", priority: "0.9" },
    { loc: `${BASE_URL}/cadastro`, changefreq: "weekly", priority: "0.7" },
    { loc: `${BASE_URL}/cidades`, changefreq: "weekly", priority: "0.7" },
    { loc: `${BASE_URL}/categorias`, changefreq: "weekly", priority: "0.7" },
    { loc: `${BASE_URL}/planos`, changefreq: "monthly", priority: "0.6" },
    { loc: `${BASE_URL}/sobre`, changefreq: "monthly", priority: "0.5" },
  ];

  // 1) Empresas aprovadas — paginação por blocos de 1000
  let from = 0;
  const pageSize = 1000;
  const cidadesUf = new Map<string, string>(); // "cidade|UF" -> updated_at mais recente
  while (true) {
    const { data, error } = await supabase
      .from("empresas")
      .select("slug, id, plano, updated_at, cidade, estado")
      .eq("status", "aprovado")
      .order("updated_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const e of data) {
      const slug = e.slug || e.id;
      if (!slug) continue;
      const lastmod = (e.updated_at as string | null)?.slice(0, 10);
      entries.push({
        loc: `${BASE_URL}/empresa/${slug}`,
        lastmod,
        changefreq: "weekly",
        priority: e.plano === "premium" ? "0.8" : "0.5",
      });
      if (e.cidade && e.estado) {
        const key = `${e.cidade}|${e.estado.toUpperCase()}`;
        const prev = cidadesUf.get(key);
        if (!prev || (lastmod && lastmod > prev)) cidadesUf.set(key, lastmod || "");
      }
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  // 2) Páginas de cidade (uma por cidade/UF distinta)
  for (const [key, lastmod] of cidadesUf.entries()) {
    const [cidade, uf] = key.split("|");
    entries.push({
      loc: `${BASE_URL}/cidade/${uf.toLowerCase()}/${slugify(cidade)}`,
      lastmod: lastmod || undefined,
      changefreq: "weekly",
      priority: "0.6",
    });
  }

  // 3) Blog posts publicados
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, atualizado_em")
    .eq("status", "publicado");
  for (const p of posts || []) {
    if (!p.slug) continue;
    entries.push({
      loc: `${BASE_URL}/blog/${p.slug}`,
      lastmod: (p.atualizado_em as string | null)?.slice(0, 10),
      changefreq: "monthly",
      priority: "0.6",
    });
  }

  const xml = renderSitemap(entries);
  const outPath = resolve("public/sitemap.xml");
  writeFileSync(outPath, xml, "utf-8");
  console.log(`sitemap.xml gerado com ${entries.length} URLs em ${outPath}`);
}

main().catch((e) => {
  console.error("[generate-sitemap] falhou:", e?.message || e);
  // Não falha o build — apenas mantém o sitemap.xml existente.
  process.exit(0);
});
