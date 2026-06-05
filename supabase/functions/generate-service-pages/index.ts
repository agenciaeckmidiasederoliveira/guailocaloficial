// Edge function: gera N subpáginas de serviço (longtail SEO) para uma empresa.
// POST { business_id: string, quantidade?: number, servicos?: Array<{nome, descricao?, cidade?}> }
// Se servicos for omitido, gera a partir de client_pages.servicos
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { generateAI } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://www.guialocalbr.com.br";

function slugify(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function safeText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function parseJsonArgs(args: string): any {
  try {
    return JSON.parse(args);
  } catch {
    return JSON.parse(args.replace(/,\s*([}\]])/g, "$1"));
  }
}

function normalizeQuantidade(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(10, Math.max(1, Math.round(n)));
}

function fallbackServicos(empresa: any): ServicoInput[] {
  const nicho = safeText(empresa.nicho, "Serviços locais");
  const cidade = safeText(empresa.cidade, "sua cidade");
  return [
    { nome: nicho, descricao: `Atendimento em ${nicho}`, cidade },
    {
      nome: `Atendimento de ${nicho}`,
      descricao: `Informações e contato para ${nicho}`,
      cidade,
    },
    {
      nome: `${nicho} perto de mim`,
      descricao: `Busca local por ${nicho}`,
      cidade,
    },
    {
      nome: `Empresa de ${nicho}`,
      descricao: `Empresa local especializada em ${nicho}`,
      cidade,
    },
    {
      nome: `${nicho} com WhatsApp`,
      descricao: `Contato rápido pelo WhatsApp`,
      cidade,
    },
    {
      nome: `${nicho} no centro`,
      descricao: `Atendimento para clientes da região central`,
      cidade,
    },
    {
      nome: `${nicho} para residências`,
      descricao: `Soluções para clientes residenciais`,
      cidade,
    },
    {
      nome: `${nicho} para empresas`,
      descricao: `Soluções para clientes comerciais`,
      cidade,
    },
    {
      nome: `${nicho} urgente`,
      descricao: `Atendimento ágil conforme disponibilidade`,
      cidade,
    },
    {
      nome: `Orçamento de ${nicho}`,
      descricao: `Pedido de orçamento e informações`,
      cidade,
    },
  ];
}

interface ServicoInput {
  nome: string;
  descricao?: string;
  cidade?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { business_id, quantidade, servicos } = await req.json();
    if (!business_id) {
      return new Response(
        JSON.stringify({ error: "business_id obrigatório" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!Deno.env.get("GEMINI_API_KEY") && !Deno.env.get("OPENAI_API_KEY"))
      throw new Error("Configure GEMINI_API_KEY ou OPENAI_API_KEY");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Busca página principal
    const { data: page, error: pageErr } = await supabase
      .from("client_pages")
      .select("*")
      .eq("business_id", business_id)
      .maybeSingle();

    if (pageErr || !page) {
      return new Response(
        JSON.stringify({
          error: "Página principal não encontrada. Gere a landing primeiro.",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 2) Busca empresa
    const { data: empresa } = await supabase
      .from("empresas")
      .select("*")
      .eq("id", business_id)
      .maybeSingle();

    if (!empresa) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Monta lista de combinações (serviço + cidade-alvo)
    const servicosOrigem: ServicoInput[] =
      Array.isArray(servicos) && servicos.length > 0
        ? servicos
        : (Array.isArray(page.servicos) && page.servicos.length > 0
          ? page.servicos
          : fallbackServicos(empresa));

    const servicosBase = servicosOrigem
      .map((s: any) => ({
        nome: safeText(s?.nome, safeText(empresa.nicho, "Serviço local")),
        descricao: safeText(
          s?.descricao,
          `Atendimento de ${
            safeText(s?.nome, safeText(empresa.nicho, "serviço local"))
          }`,
        ),
        cidade: safeText(s?.cidade, empresa.cidade),
      }))
      .filter((s) => s.nome && s.cidade);

    if (servicosBase.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Nenhum serviço disponível para gerar subpáginas.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Cidades-alvo: cidade da empresa + lista de cidades vizinhas se necessário
    const cidadesPadrao = [empresa.cidade];
    const target = normalizeQuantidade(
      quantidade,
      Math.min(10, servicosBase.length * cidadesPadrao.length),
    );

    // Constrói combinações
    const combinacoes: ServicoInput[] = [];
    let i = 0;
    while (
      combinacoes.length < target &&
      i < servicosBase.length * Math.max(cidadesPadrao.length, 1) * 5
    ) {
      const servico = servicosBase[i % servicosBase.length];
      const cidade = servico.cidade ||
        cidadesPadrao[
          Math.floor(i / servicosBase.length) % cidadesPadrao.length
        ];
      const slugServico = slugify(`${servico.nome}-em-${cidade}`);
      if (
        !combinacoes.find((c) =>
          slugify(`${c.nome}-em-${c.cidade}`) === slugServico
        )
      ) {
        combinacoes.push({ ...servico, cidade });
      }
      i++;
    }

    const resultados: Array<{ slug: string; ok: boolean; error?: string }> = [];

    // 4) Para cada combinação, gera conteúdo via IA
    for (const item of combinacoes) {
      const slugServico = slugify(`${item.nome}-em-${item.cidade}`);

      // Pula se já existe
      const { data: existing } = await supabase
        .from("client_service_pages")
        .select("id")
        .eq("page_id", page.id)
        .eq("slug_servico", slugServico)
        .maybeSingle();
      if (existing) {
        resultados.push({ slug: slugServico, ok: true, error: "já existia" });
        continue;
      }

      const userPrompt = `Crie uma subpágina SEO sobre o serviço específico:

Empresa: ${empresa.nome}
Serviço: ${item.nome}
Descrição do serviço: ${item.descricao || "—"}
Cidade-alvo: ${item.cidade}
Estado: ${empresa.estado}

Tom humano, persuasivo, focado em conversão. Mencione naturalmente "${item.nome} em ${item.cidade}" como expressão-chave. NÃO invente preços nem prazos exatos.`;

      const subSchema = {
        type: "object",
        properties: {
          hero_titulo: { type: "string" },
          hero_subtitulo: { type: "string" },
          intro: { type: "string", description: "Parágrafo introdutório de 120 palavras" },
          secoes: {
            type: "array",
            minItems: 3,
            maxItems: 4,
            items: {
              type: "object",
              properties: {
                titulo: { type: "string" },
                conteudo: { type: "string", description: "150 palavras" },
              },
              required: ["titulo", "conteudo"],
            },
          },
          faq: {
            type: "array",
            minItems: 3,
            maxItems: 5,
            items: {
              type: "object",
              properties: {
                pergunta: { type: "string" },
                resposta: { type: "string" },
              },
              required: ["pergunta", "resposta"],
            },
          },
          meta_title: { type: "string" },
          meta_description: { type: "string" },
        },
        required: [
          "hero_titulo",
          "hero_subtitulo",
          "intro",
          "secoes",
          "faq",
          "meta_title",
          "meta_description",
        ],
      };

      let c: any;
      try {
        const r = await generateAI(
          [
            {
              role: "system",
              content: "Você é copywriter especialista em SEO local. Responda APENAS chamando a função fornecida.",
            },
            { role: "user", content: userPrompt },
          ],
          {
            name: "criar_subpagina",
            description: "Retorna conteúdo da subpágina de serviço",
            parameters: subSchema,
          },
        );
        if (!r.toolArgs) {
          resultados.push({ slug: slugServico, ok: false, error: "sem tool_call" });
          continue;
        }
        c = r.toolArgs;
      } catch (e: any) {
        console.error("AI error subpagina", e?.message);
        resultados.push({ slug: slugServico, ok: false, error: e?.message || "IA erro" });
        continue;
      }

      const schema_json = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: item.nome,
        description: c.meta_description,
        provider: {
          "@type": "LocalBusiness",
          name: empresa.nome,
          address: {
            "@type": "PostalAddress",
            addressLocality: empresa.cidade,
            addressRegion: empresa.estado,
            addressCountry: "BR",
          },
        },
        areaServed: item.cidade,
        url: `${SITE}/${page.slug}/${slugServico}`,
      };

      const { error: insErr } = await supabase.from("client_service_pages")
        .insert({
          page_id: page.id,
          business_id,
          slug_servico: slugServico,
          servico_nome: item.nome,
          servico_descricao: item.descricao || null,
          cidade_alvo: item.cidade,
          status: "ativo",
          hero_titulo: safeText(
            c.hero_titulo,
            `${item.nome} em ${item.cidade}`,
          ),
          hero_subtitulo: safeText(
            c.hero_subtitulo,
            `Conheça ${empresa.nome} para ${item.nome} em ${item.cidade}.`,
          ),
          intro: safeText(
            c.intro,
            `${empresa.nome} atende clientes que procuram ${item.nome} em ${item.cidade}, com contato fácil e foco em atendimento local.`,
          ),
          secoes: Array.isArray(c.secoes) ? c.secoes : [],
          faq: Array.isArray(c.faq) ? c.faq : [],
          meta_title: safeText(
            c.meta_title,
            `${item.nome} em ${item.cidade} | ${empresa.nome}`,
          ).slice(0, 80),
          meta_description: safeText(
            c.meta_description,
            `Veja informações sobre ${item.nome} em ${item.cidade} com ${empresa.nome}. Fale pelo WhatsApp.`,
          ).slice(0, 180),
          schema_json,
        });

      if (insErr) {
        resultados.push({
          slug: slugServico,
          ok: false,
          error: insErr.message,
        });
      } else {
        resultados.push({ slug: slugServico, ok: true });
      }

      // Throttle leve para não estourar rate limit
      await new Promise((r) => setTimeout(r, 400));
    }

    return new Response(
      JSON.stringify({
        ok: true,
        total: resultados.length,
        sucesso: resultados.filter((r) => r.ok).length,
        erros: resultados.filter((r) => !r.ok).length,
        resultados,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-service-pages error", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Erro desconhecido",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
