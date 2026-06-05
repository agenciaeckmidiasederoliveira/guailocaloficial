// Edge function: gera artigo completo de blog via Lovable AI (Gemini Flash)
// POST { modo: 'empresa' | 'tematico', empresa_id?, tipoArtigo?, tom?, tema?, foco?, publicoAlvo?, tipoConteudo? }
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { generateAI } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

async function uniqueSlug(supabase: any, base: string): Promise<string> {
  let candidate = base || `post-${Date.now()}`;
  let n = 1;
  while (true) {
    const { data } = await supabase.from("blog_posts").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
    if (n > 50) return `${base}-${Date.now()}`;
  }
}

const SCHEMA = {
  type: "object",
  properties: {
    titulo: { type: "string", description: "Máx 70 caracteres, com palavra-chave principal no início" },
    subtitulo: { type: "string", description: "Máx 140 caracteres, complementar ao título, com LSI/sinônimos" },
    conteudo_html: {
      type: "string",
      description: "Artigo COMPLETO em HTML válido usando apenas h2, h3, p, ul, ol, li, strong, em, blockquote, a (com href absoluto). Entre 1400 e 2200 palavras, denso semanticamente, com seções H2 múltiplas, listas, entidades nomeadas, sinônimos LSI, perguntas naturais respondidas no corpo, sem repetição. NUNCA inclua tags de imagem (<img>) nem URLs de imagens.",
    },
    resumo: { type: "string", description: "2 a 3 frases atrativas com palavra-chave" },
    tags: { type: "array", items: { type: "string" }, minItems: 5, maxItems: 10 },
    seo_title: { type: "string", description: "Máx 60 caracteres" },
    seo_description: { type: "string", description: "Máx 160 caracteres" },
    seo_keywords: { type: "string", description: "8 a 14 palavras-chave (head + long tail + LSI) separadas por vírgula" },
    tempo_leitura: { type: "number", description: "Em minutos, entre 6 e 14" },
    faq: {
      type: "array",
      minItems: 4,
      maxItems: 8,
      description: "Perguntas e respostas reais que o leitor faria sobre o tema/empresa. Cada resposta com 2 a 4 frases.",
      items: {
        type: "object",
        properties: {
          pergunta: { type: "string" },
          resposta: { type: "string" },
        },
        required: ["pergunta", "resposta"],
      },
    },
    entidades: {
      type: "array",
      items: { type: "string" },
      description: "Entidades semânticas mencionadas (lugares, marcas, conceitos) — 6 a 15 itens",
      minItems: 6,
      maxItems: 15,
    },
  },
  required: ["titulo", "subtitulo", "conteudo_html", "resumo", "tags", "seo_title", "seo_description", "seo_keywords", "tempo_leitura", "faq", "entidades"],
};

async function callAI(systemMsg: string, userMsg: string, _apiKey: string, toolName = "responder", toolSchema: any = SCHEMA, toolDesc = "Retornar artigo de blog estruturado") {
  const r = await generateAI(
    [
      { role: "system", content: systemMsg },
      { role: "user", content: userMsg },
    ],
    { name: toolName, description: toolDesc, parameters: toolSchema },
  );
  if (!r.toolArgs) throw new Error("Resposta AI sem tool_call");
  return r.toolArgs;
}

function buildPromptEmpresa(empresa: any, tipoArtigo: string, tom: string, contexto: any) {
  const relacionadas = (contexto?.relacionadas || [])
    .map((r: any) => `- ${r.nome} (${r.nicho || "serviço"}) — ${r.cidade}/${r.estado}${r.descricao ? ` — ${String(r.descricao).slice(0, 140)}` : ""}`)
    .join("\n") || "(nenhuma)";
  const cidadeStats = contexto?.cidadeStats || {};
  const nichoStats = contexto?.nichoStats || {};

  return `Escreva um ARTIGO LONGO, DENSO E SEMANTICAMENTE FORTE em PORTUGUÊS BRASILEIRO sobre a empresa abaixo, publicado no blog do Guia Local BR (diretório de empresas locais brasileiras).

==== DADOS PRIMÁRIOS DA EMPRESA ====
- Nome: ${empresa.nome}
- Categoria/Nicho: ${empresa.nicho || "serviços"}
- Cidade/Estado: ${empresa.cidade} - ${empresa.estado}
- Endereço: ${empresa.endereco || "não informado"}
- Telefone: ${empresa.telefone || "não informado"}
- WhatsApp: ${empresa.whatsapp || "não informado"}
- Site: ${empresa.site || "não informado"}
- Horário: ${empresa.horario || "não informado"}
- Descrição própria: ${empresa.descricao || "não informada"}
- Redes sociais cadastradas: ${Array.isArray(empresa.redes_sociais) ? empresa.redes_sociais.map((r: any) => r?.tipo || r?.url).filter(Boolean).join(", ") || "—" : "—"}

==== CONTEXTO LOCAL (use para enriquecer semanticamente) ====
- Total de empresas aprovadas em ${empresa.cidade}/${empresa.estado}: ${cidadeStats.total || 0}
- Total de empresas no nicho "${empresa.nicho}" na cidade: ${nichoStats.cidade || 0}
- Total de empresas no nicho "${empresa.nicho}" no Brasil (no guia): ${nichoStats.brasil || 0}
- Outras empresas do mesmo nicho/cidade (use para mencionar o ECOSSISTEMA local, NÃO para comparar negativamente):
${relacionadas}

TIPO DE ARTIGO: ${tipoArtigo}
TOM: ${tom}

==== REGRAS DE CONTEÚDO (OBRIGATÓRIO) ====
1. Entre 1500 e 2200 palavras. Conteúdo DENSO, sem enrolação, sem clichês de IA ("no mundo de hoje", "na era digital", etc.).
2. Estrutura mínima: introdução curta → 5 a 8 H2s temáticos → FAQ embutida (além da estruturada via tool) → seção final "Como entrar em contato e encontrar ${empresa.nome} no Guia Local BR".
3. Subseções H3 quando útil. Pelo menos 3 listas (ul/ol) ao longo do texto.
4. SEO SEMÂNTICO: trabalhe a entidade principal (${empresa.nome}) + entidade categoria (${empresa.nicho}) + entidade geográfica (${empresa.cidade}/${empresa.estado}) + sinônimos/LSI da categoria + intenções de busca (informacional, comparativa e transacional).
5. Mencione ao menos uma vez bairros, regiões ou pontos de referência REAIS da cidade ${empresa.cidade}/${empresa.estado} quando fizer sentido para SEO local. NÃO INVENTE bairros que você não tem certeza que existem; quando não souber, fale em termos gerais ("região central", "bairros residenciais", etc.).
6. Cite o nome da empresa de formas variadas (nome completo, pronome, "a empresa", categoria + cidade).
7. Use as outras empresas listadas como contexto do ECOSSISTEMA local do Guia Local BR (ex.: "no diretório, ${empresa.cidade} conta também com..."), sem desmerecer ninguém. Liste no máximo 3 dessas como exemplos.
8. NUNCA invente: telefone, endereço, preços, anos de fundação, prêmios, número de clientes, certificações. Se o dado não está acima, NÃO MENCIONE.
9. Inclua links internos absolutos (use <a href>) para:
   - Perfil da empresa: https://guialocalbr.com.br/empresa/${empresa.slug || empresa.id}
   - Página da cidade: https://guialocalbr.com.br/cidade/${(empresa.estado || "").toLowerCase()}/${slugify(empresa.cidade || "")}
   - Página do guia: https://guialocalbr.com.br
10. NÃO inclua nenhuma imagem, <img>, URL de foto, banner ou referência a fotos externas. Texto puro + links internos. A única imagem do artigo será a foto principal já cadastrada no Guia Local BR (gerenciada fora do HTML).
11. Termine com CTA natural (1 parágrafo) convidando o leitor a abrir o perfil da empresa no Guia Local BR e entrar em contato pelos canais oficiais.
12. Retorne TUDO via tool call 'responder'.`;
}

function buildPromptTematico(tema: string, foco: string, publico: string, tipoConteudo: string, contexto: any) {
  const topNichos = (contexto?.topNichos || []).slice(0, 10).join(", ") || "diversos nichos";
  const topCidades = (contexto?.topCidades || []).slice(0, 8).join(", ") || "diversas cidades";
  const empresasExemplo = (contexto?.empresasExemplo || [])
    .map((e: any) => `- ${e.nome} (${e.nicho || "serviço"}) — ${e.cidade}/${e.estado} — https://guialocalbr.com.br/empresa/${e.slug || e.id}`)
    .join("\n") || "(sem exemplos)";

  return `Escreva um ARTIGO LONGO, DENSO E SEMANTICAMENTE FORTE em PORTUGUÊS BRASILEIRO para o blog do Guia Local BR.

TEMA PRINCIPAL: ${tema}
FOCO ESPECÍFICO / TÍTULO BASE: ${foco}
PÚBLICO-ALVO: ${publico}
TIPO DE CONTEÚDO: ${tipoConteudo}

==== CONTEXTO REAL DO GUIA LOCAL BR (use para citar dados verdadeiros) ====
- Nichos mais cadastrados: ${topNichos}
- Cidades mais ativas: ${topCidades}
- Exemplos de empresas reais cadastradas (linke ao menos 3 delas no corpo do texto, naturalmente, como exemplos do que o tema discute):
${empresasExemplo}

==== REGRAS DE CONTEÚDO (OBRIGATÓRIO) ====
1. Entre 1600 e 2200 palavras. Profundidade real, sem enrolação, sem clichês de IA.
2. Mínimo 6 seções H2 + H3 quando útil + pelo menos 3 listas (ul/ol).
3. SEO SEMÂNTICO: trabalhe a query principal + variações long tail + LSI/sinônimos + perguntas relacionadas respondidas no corpo.
4. Cite estatísticas, conceitos, ferramentas e plataformas REAIS (Google Meu Negócio, WhatsApp Business, SEO local, avaliações, NAP, Schema.org etc.) sem inventar números.
5. Insira no texto, naturalmente, ao menos 3 links internos absolutos para empresas reais listadas acima (use <a href="...">Nome</a>) como ilustração prática do tema.
6. Inclua também 1 link para https://guialocalbr.com.br e, quando fizer sentido, para /cidade/UF/cidade-slug das cidades mencionadas.
7. NUNCA inclua tags <img>, URLs de imagens, banners ou referências a fotos externas. Texto puro + links internos. A capa do post no blog usa imagens já existentes no Guia Local BR e é gerenciada fora do HTML.
8. Encerre com CTA suave para o leitor cadastrar a empresa dele no Guia Local BR e/ou explorar o diretório.
9. Retorne TUDO via tool call 'responder'.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json();
    const { modo, empresa_id, tipoArtigo, tom, tema, foco, publicoAlvo, tipoConteudo } = body;

    const LOVABLE_API_KEY = "unused";
    if (!Deno.env.get("GEMINI_API_KEY") && !Deno.env.get("OPENAI_API_KEY"))
      throw new Error("Configure GEMINI_API_KEY ou OPENAI_API_KEY");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const SYS = "Você é redator sênior especialista em SEO local, Google Meu Negócio e marketing para pequenas empresas brasileiras. Escreve em português brasileiro fluente, prático e útil. Responda APENAS via tool call 'responder'.";

    let result: any;
    let empresa: any = null;
    let baseSlug: string;
    let tipo: "empresa" | "artigo";

    if (modo === "sugerir-temas") {
      // Levanta categorias e cidades mais frequentes do guia
      const { data: emps } = await supabase
        .from("empresas")
        .select("nicho, cidade, estado")
        .eq("status", "aprovado")
        .limit(500);
      const nichos: Record<string, number> = {};
      const cidades: Record<string, number> = {};
      (emps || []).forEach((e: any) => {
        if (e.nicho) nichos[e.nicho] = (nichos[e.nicho] || 0) + 1;
        if (e.cidade) cidades[`${e.cidade}/${e.estado || ""}`] = (cidades[`${e.cidade}/${e.estado || ""}`] || 0) + 1;
      });
      const topNichos = Object.entries(nichos).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => `${k} (${v})`);
      const topCidades = Object.entries(cidades).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k]) => k);

      const SUGEST_SCHEMA = {
        type: "object",
        properties: {
          sugestoes: {
            type: "array",
            minItems: 6,
            maxItems: 8,
            items: {
              type: "object",
              properties: {
                tema: { type: "string", description: "Tema curto (ex: Google Meu Negócio)" },
                foco: { type: "string", description: "Foco específico/título sugerido" },
                publicoAlvo: { type: "string" },
                tipoConteudo: { type: "string" },
                justificativa: { type: "string", description: "Por que este tema é relevante agora" },
              },
              required: ["tema", "foco", "publicoAlvo", "tipoConteudo", "justificativa"],
            },
          },
        },
        required: ["sugestoes"],
      };

      const userMsg = `Sugira de 6 a 8 temas QUENTES de blog para o Guia Local BR (diretório de empresas locais brasileiras).

CONTEXTO DO SITE — nichos mais cadastrados:
${topNichos.join(", ") || "geral"}

PRINCIPAIS CIDADES:
${topCidades.join(", ") || "diversas"}

CRITÉRIOS:
- Misture temas evergreen de SEO local / Google Meu Negócio com tendências atuais (IA aplicada a pequenos negócios, WhatsApp Business, vídeo curto, novas regras de avaliações Google, etc.)
- Cada sugestão deve ser ÚTIL para os donos de negócio dos nichos listados acima
- Foco específico deve ser um título já quase pronto, prático e clicável
- Sem clichês genéricos. Não repita o mesmo tema.
- Retorne APENAS via tool call.`;

      const sysSugerir = "Você é estrategista de conteúdo SEO para o Guia Local BR. Conhece tendências atuais de marketing local no Brasil. Responda APENAS via tool call 'sugerir_temas'.";
      const sugest = await callAI(sysSugerir, userMsg, LOVABLE_API_KEY, "sugerir_temas", SUGEST_SCHEMA, "Lista de sugestões de temas de blog");
      return new Response(JSON.stringify({ ok: true, sugestoes: sugest.sugestoes || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (modo === "empresa") {
      if (!empresa_id) throw new Error("empresa_id obrigatório no modo empresa");
      const { data: emp, error: empErr } = await supabase
        .from("empresas").select("*").eq("id", empresa_id).maybeSingle();
      if (empErr || !emp) throw new Error("Empresa não encontrada");
      empresa = emp;
      tipo = "empresa";

      const [{ data: relacionadas }, { count: cidadeTotal }, { count: nichoCidade }, { count: nichoBrasil }] = await Promise.all([
        supabase.from("empresas")
          .select("nome, nicho, cidade, estado, descricao, slug, id")
          .eq("status", "aprovado")
          .eq("cidade", emp.cidade)
          .eq("nicho", emp.nicho || "")
          .neq("id", emp.id)
          .limit(6),
        supabase.from("empresas").select("id", { count: "exact", head: true })
          .eq("status", "aprovado").eq("cidade", emp.cidade),
        supabase.from("empresas").select("id", { count: "exact", head: true })
          .eq("status", "aprovado").eq("cidade", emp.cidade).eq("nicho", emp.nicho || ""),
        supabase.from("empresas").select("id", { count: "exact", head: true })
          .eq("status", "aprovado").eq("nicho", emp.nicho || ""),
      ]);

      const contexto = {
        relacionadas: relacionadas || [],
        cidadeStats: { total: cidadeTotal || 0 },
        nichoStats: { cidade: nichoCidade || 0, brasil: nichoBrasil || 0 },
      };

      result = await callAI(SYS, buildPromptEmpresa(emp, tipoArtigo || "Perfil completo da empresa", tom || "Profissional e informativo", contexto), LOVABLE_API_KEY);
      baseSlug = slugify(`${emp.nome}-${emp.cidade}`);
    } else if (modo === "tematico") {
      if (!tema || !foco) throw new Error("tema e foco obrigatórios no modo tematico");
      tipo = "artigo";

      const { data: emps } = await supabase
        .from("empresas").select("nome, nicho, cidade, estado, slug, id")
        .eq("status", "aprovado").limit(500);
      const nichos: Record<string, number> = {};
      const cidades: Record<string, number> = {};
      (emps || []).forEach((e: any) => {
        if (e.nicho) nichos[e.nicho] = (nichos[e.nicho] || 0) + 1;
        if (e.cidade) cidades[`${e.cidade}/${e.estado || ""}`] = (cidades[`${e.cidade}/${e.estado || ""}`] || 0) + 1;
      });
      const topNichos = Object.entries(nichos).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k]) => k);
      const topCidades = Object.entries(cidades).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k]) => k);
      const temaLower = `${tema} ${foco}`.toLowerCase();
      const matchedNichos = topNichos.filter((n) => temaLower.includes(n.toLowerCase()));
      const exemplosPool = (emps || []).filter((e: any) =>
        matchedNichos.length ? matchedNichos.includes(e.nicho) : true
      );
      const empresasExemplo = exemplosPool.sort(() => Math.random() - 0.5).slice(0, 6);

      const contexto = { topNichos, topCidades, empresasExemplo };

      result = await callAI(SYS, buildPromptTematico(tema, foco, publicoAlvo || "Donos de pequenas empresas", tipoConteudo || "Guia prático (passo a passo)", contexto), LOVABLE_API_KEY);
      baseSlug = slugify(result.titulo);
    } else {
      throw new Error("modo inválido (use 'empresa', 'tematico' ou 'sugerir-temas')");
    }

    const slug = await uniqueSlug(supabase, baseSlug);
    const url = `${SITE}/blog/${tipo === "empresa" ? "empresas" : "artigos"}/${slug}`;

    const schema_json: any[] = [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: result.titulo,
        description: result.resumo,
        author: { "@type": "Organization", name: "Guia Local BR", url: SITE },
        publisher: {
          "@type": "Organization", name: "Guia Local BR", url: SITE,
          logo: { "@type": "ImageObject", url: `${SITE}/icon-512.png` },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        keywords: result.seo_keywords,
        about: (result.entidades || []).map((e: string) => ({ "@type": "Thing", name: e })),
        inLanguage: "pt-BR",
        datePublished: new Date().toISOString(),
        dateModified: new Date().toISOString(),
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: SITE },
          { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE}/blog` },
          { "@type": "ListItem", position: 3, name: result.titulo, item: url },
        ],
      },
    ];

    if (Array.isArray(result.faq) && result.faq.length) {
      schema_json.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: result.faq.map((q: any) => ({
          "@type": "Question",
          name: q.pergunta,
          acceptedAnswer: { "@type": "Answer", text: q.resposta },
        })),
      });
    }

    if (tipo === "empresa" && empresa) {
      schema_json.push({
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: empresa.nome,
        url: `${SITE}/empresa/${empresa.slug || empresa.id}`,
        telephone: empresa.telefone || undefined,
        address: {
          "@type": "PostalAddress",
          streetAddress: empresa.endereco,
          addressLocality: empresa.cidade,
          addressRegion: empresa.estado,
          addressCountry: "BR",
        },
      });
    }

    // Anexa FAQ ao final do HTML (além do schema FAQPage)
    if (Array.isArray(result.faq) && result.faq.length) {
      const faqHtml = `\n<h2>Perguntas frequentes</h2>\n` +
        result.faq.map((q: any) => `<h3>${q.pergunta}</h3><p>${q.resposta}</p>`).join("\n");
      result.conteudo_html = (result.conteudo_html || "") + faqHtml;
    }

    // Sanitização: remove qualquer imagem que a IA tenha inserido (artigo é texto puro)
    result.conteudo_html = String(result.conteudo_html || "")
      .replace(/<img[^>]*>/gi, "")
      .replace(/<\/?(figure|picture|source)[^>]*>/gi, "");

    const post = {
      slug,
      tipo,
      status: "rascunho" as const,
      titulo: result.titulo,
      subtitulo: result.subtitulo,
      conteudo: result.conteudo_html,
      resumo: result.resumo,
      tags: result.tags || [],
      seo_title: result.seo_title,
      seo_description: result.seo_description,
      seo_keywords: result.seo_keywords,
      tempo_leitura: Math.max(3, Math.min(15, Math.round(result.tempo_leitura || 6))),
      schema_json,
      empresa_id: empresa?.id || null,
      empresa_nome: empresa?.nome || null,
      empresa_cidade: empresa?.cidade || null,
      empresa_categoria: empresa?.nicho || null,
      empresa_telefone: empresa?.telefone || null,
      empresa_whatsapp: empresa?.whatsapp || null,
      empresa_site: empresa?.site || null,
      empresa_endereco: empresa?.endereco || null,
      empresa_foto_url: empresa?.foto_principal || null,
    };

    return new Response(JSON.stringify({ ok: true, post }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-blog-post error", e);
    if (e?.status === 429) {
      return new Response(JSON.stringify({ error: "Limite de IA atingido, tente em alguns minutos." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (e?.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
