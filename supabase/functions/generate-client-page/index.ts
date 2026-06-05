// Edge function: gera mini-site personalizado por IA com seções por bairro.
// Estratégia:
// 1) Busca lista REAL de bairros da cidade via Overpass API (OpenStreetMap)
// 2) Pede à IA contexto da cidade (avenidas, regiões, landmarks)
// 3) Gera conteúdo SEO local fortíssimo por bairro, em paralelo, para TODOS os bairros do plano
// POST { business_id: string }
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

const RESERVED_SLUGS = new Set([
  "auth","reset-password","busca","cadastro","sobre","planos","empresa",
  "favoritos","parceiro","parceiros","cidade","admin","minha-pagina",
  "negocio","api","404","assets",
]);

async function generateUniqueSlug(supabase: any, base: string): Promise<string> {
  let candidate = base;
  let n = 1;
  while (true) {
    if (!RESERVED_SLUGS.has(candidate)) {
      const { data } = await supabase.from("client_pages").select("id").eq("slug", candidate).maybeSingle();
      if (!data) return candidate;
    }
    n += 1;
    candidate = `${base}-${n}`;
    if (n > 50) return `${base}-${Date.now()}`;
  }
}

// Limites por plano: o sistema busca SEMPRE TODOS os bairros reais da cidade.
// O plano só define o MÍNIMO garantido e um teto de segurança bem alto.
function planoBairrosMax(plano: string): { min: number; max: number } {
  // Sem teto prático — geramos para TODOS os bairros reais retornados pelo OSM.
  if (plano === "premium") return { min: 30, max: 2000 };
  if (plano === "profissional") return { min: 20, max: 2000 };
  return { min: 15, max: 2000 };
}

function parseNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[^0-9,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}
function parseInteger(v: unknown, f: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(parseNumber(v, f))));
}
function parseMoney(v: unknown, f: number) {
  return Math.max(0, Number(parseNumber(v, f).toFixed(2)));
}
function safeText(v: unknown, fb: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fb;
}

// ============== OSM Overpass: bairros REAIS (todos) ==============
const ESTADOS_NOME: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia",
  CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás",
  MA: "Maranhão", MT: "Mato Grosso", MS: "Mato Grosso do Sul", MG: "Minas Gerais",
  PA: "Pará", PB: "Paraíba", PR: "Paraná", PE: "Pernambuco", PI: "Piauí",
  RJ: "Rio de Janeiro", RN: "Rio Grande do Norte", RS: "Rio Grande do Sul",
  RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina", SP: "São Paulo",
  SE: "Sergipe", TO: "Tocantins",
};

function buildOverpassQueries(cidade: string, estado: string): Array<{ label: string; query: string }> {
  const estadoNome = ESTADOS_NOME[estado?.toUpperCase()] || estado;
  const areaScoped = (body: string) => `
[out:json][timeout:90];
area["name"="${estadoNome}"]["admin_level"="4"]->.estado;
area["name"="${cidade}"]["boundary"="administrative"]["admin_level"~"^(7|8)$"](area.estado)->.cidade;
(
${body}
);
out tags;
  `.trim();
  const cityScoped = (body: string) => `
[out:json][timeout:90];
area["name"="${cidade}"]["boundary"="administrative"]["admin_level"~"^(7|8)$"]->.cidade;
(
${body}
);
out tags;
  `.trim();

  const placeBody = `
  node["place"~"^(suburb|neighbourhood|quarter|borough|locality|hamlet|village)$"](area.cidade);
  way["place"~"^(suburb|neighbourhood|quarter|borough|locality|hamlet|village)$"](area.cidade);
  relation["place"~"^(suburb|neighbourhood|quarter|borough|locality|hamlet|village)$"](area.cidade);`;
  const adminBody = `
  relation["boundary"="administrative"]["admin_level"~"^(9|10|11)$"](area.cidade);
  way["boundary"="administrative"]["admin_level"~"^(9|10|11)$"](area.cidade);`;
  const addressBody = `
  node["addr:suburb"](area.cidade);
  way["addr:suburb"](area.cidade);
  relation["addr:suburb"](area.cidade);
  node["addr:neighbourhood"](area.cidade);
  way["addr:neighbourhood"](area.cidade);
  relation["addr:neighbourhood"](area.cidade);`;

  return [
    { label: "place-state", query: areaScoped(placeBody) },
    { label: "admin-state", query: areaScoped(adminBody) },
    { label: "address-state", query: areaScoped(addressBody) },
    { label: "place-city", query: cityScoped(placeBody) },
    { label: "admin-city", query: cityScoped(adminBody) },
  ];
}

async function fetchWithTimeout(url: string, init: RequestInit, ms = 6500): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeBairroName(nome: string): string {
  return nome
    .trim()
    .replace(/^bairro\s+/i, "")
    .replace(/\s+/g, " ")
    .replace(/\s+-\s+.*$/, "");
}

function isLikelyBairro(nome: string): boolean {
  const n = normalizeBairroName(nome);
  if (n.length < 3 || n.length > 80) return false;
  if (/^(br|pr|sp|rj|mg|rodovia|avenida|av\.?|rua|travessa|estrada)\b/i.test(n)) return false;
  if (/\b(panificadora|mercado|engenharia|lanch|loja|hotel|restaurante|posto|farm[aá]cia|igreja|escola|faculdade|universidade|edif[ií]cio)\b/i.test(n)) return false;
  return true;
}

async function fetchOSMBairros(
  cidade: string,
  estado: string,
): Promise<Array<{ nome: string; slug: string }>> {
  const endpoints = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.osm.ch/api/interpreter",
  ];
  const queries = buildOverpassQueries(cidade, estado);
  const all: Array<{ nome: string; slug: string }> = [];

  for (let qi = 0; qi < queries.length; qi++) {
    const { label, query } = queries[qi];
    let queryWorked = false;
    for (const url of endpoints) {
      try {
        const r = await fetchWithTimeout(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "GuiaLocalBR SEO local contato@guialocalbr.com.br",
          },
          body: `data=${encodeURIComponent(query)}`,
        }, 10000); // timeout curto: cidades pequenas não retornam nada; grandes respondem rápido
        if (!r.ok) {
          console.warn(`[OSM] ${label} ${url} retornou ${r.status}`);
          continue;
        }
        const data = await r.json();
        const out: Array<{ nome: string; slug: string }> = [];
        for (const el of data?.elements || []) {
          const tags = el?.tags || {};
          const nomes = [tags.name, tags["addr:suburb"], tags["addr:neighbourhood"], tags["official_name"], tags["alt_name"]];
          for (const raw of nomes) {
            if (!raw || typeof raw !== "string") continue;
            const nome = normalizeBairroName(raw);
            if (!isLikelyBairro(nome)) continue;
            const slug = slugify(nome);
            if (!slug) continue;
            out.push({ nome, slug });
          }
        }
        console.log(`[OSM] ${cidade}/${estado}: ${out.length} candidatos via ${label} em ${url}`);
        all.push(...out);
        queryWorked = true;
        break; // evita bater em todos os mirrors quando a consulta já funcionou
      } catch (e) {
        console.warn(`[OSM] falha em ${label} ${url}:`, (e as Error).message);
      }
    }
    const consolidated = dedupeBairros(all, 2000);
    if (consolidated.length >= 220) return consolidated;
    if (!queryWorked) console.warn(`[OSM] consulta ${label} não retornou dados utilizáveis`);
    // Early-exit: após 2 queries sem nenhum resultado, desiste do OSM (cidade mal mapeada) — IA assume.
    if (consolidated.length === 0 && qi >= 1) {
      console.log(`[OSM] desistindo do OSM para ${cidade}/${estado} (sem dados; IA fará fallback)`);
      break;
    }
  }
  return dedupeBairros(all, 2000);
}

function dedupeBairros(items: Array<{ nome: string; slug?: string }>, max: number) {
  const seen = new Set<string>();
  const out: Array<{ nome: string; slug: string }> = [];
  for (const it of items) {
    const nome = safeText(it?.nome, "");
    const slug = slugify(it?.slug || nome);
    if (!nome || !slug || seen.has(slug)) continue;
    seen.add(slug);
    out.push({ nome, slug });
    if (out.length >= max) break;
  }
  return out;
}

async function fetchCachedBairros(supabase: any, cidade: string, estado: string, currentBusinessId: string, max: number) {
  const { data } = await supabase
    .from("client_pages")
    .select("bairros,total_bairros")
    .eq("cidade", cidade)
    .eq("estado", estado)
    .neq("business_id", currentBusinessId)
    .not("bairros", "is", null)
    .order("total_bairros", { ascending: false })
    .limit(5);
  const items = (data || []).flatMap((p: any) => Array.isArray(p.bairros) ? p.bairros : []);
  return dedupeBairros(items.map((b: any) => ({ nome: b?.nome, slug: b?.slug })), max);
}

// ============== AI helper ==============
async function callAI(systemMsg: string, userMsg: string, schema: any, retries = 2): Promise<any> {
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const r = await generateAI(
        [{ role: "system", content: systemMsg }, { role: "user", content: userMsg }],
        { name: "responder", description: "Retornar resposta estruturada", parameters: schema },
      );
      if (!r.toolArgs) throw new Error("Resposta AI sem tool_call");
      return r.toolArgs;
    } catch (e: any) {
      lastErr = e;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
        continue;
      }
    }
  }
  throw lastErr;
}

// ============== Fallback per bairro ==============
function fallbackBairroContent(empresa: any, b: { nome: string; slug: string }) {
  const nicho = empresa.nicho || "atendimento de qualidade";
  return {
    ...b,
    titulo_secao: `${empresa.nicho || "Atendimento"} no ${b.nome}, ${empresa.cidade}`,
    paragrafo_1: `Moradores do ${b.nome}, conheçam ${empresa.nome}, referência local em ${nicho} para quem está em ${empresa.cidade}-${empresa.estado}. Atendemos rapidamente e com foco em quem precisa de solução perto de casa.`,
    subtitulo_1: `Como atendemos quem é do ${b.nome}`,
    paragrafo_2: `O atendimento é pensado para facilitar o contato, tirar dúvidas com clareza e direcionar cada cliente do ${b.nome} para a melhor solução disponível em ${empresa.cidade}.`,
    subtitulo_2: `Região do ${b.nome} atendida`,
    paragrafo_3: `Atendemos moradores do ${b.nome} e bairros vizinhos de ${empresa.cidade}, com agilidade, transparência e atendimento humano.`,
    cta_texto: "FALAR NO WHATSAPP AGORA",
    cta_emoji: "💬",
  };
}

function sanitizeBairroContent(empresa: any, b: { nome: string; slug: string }, c: any) {
  const fb = fallbackBairroContent(empresa, b);
  const emoji = typeof c?.cta_emoji === "string" &&
      /^[\p{Emoji}\uFE0F\u200D\s]{1,8}$/u.test(c.cta_emoji.trim())
    ? c.cta_emoji.trim() : fb.cta_emoji;
  return {
    ...b,
    titulo_secao: safeText(c?.titulo_secao, fb.titulo_secao),
    paragrafo_1: safeText(c?.paragrafo_1, fb.paragrafo_1),
    subtitulo_1: safeText(c?.subtitulo_1, fb.subtitulo_1),
    paragrafo_2: safeText(c?.paragrafo_2, fb.paragrafo_2),
    subtitulo_2: safeText(c?.subtitulo_2, fb.subtitulo_2),
    paragrafo_3: safeText(c?.paragrafo_3, fb.paragrafo_3),
    cta_texto: safeText(c?.cta_texto, fb.cta_texto),
    cta_emoji: emoji,
  };
}

function listText(items: unknown, fallback = "regiões próximas"): string {
  const arr = Array.isArray(items) ? items.filter((x) => typeof x === "string" && x.trim()).slice(0, 4) : [];
  return arr.length ? arr.join(", ") : fallback;
}

function semanticBairroContent(empresa: any, b: { nome: string; slug: string }, ctx: any, vizinhos: string[]) {
  const nicho = empresa.nicho || "serviços locais";
  const lsi = listText(ctx?.sinonimos_servico, nicho);
  const regioes = listText(ctx?.regioes, `regiões de ${empresa.cidade}`);
  const referencias = listText(ctx?.landmarks, `pontos conhecidos de ${empresa.cidade}`);
  const avenidas = listText(ctx?.avenidas_principais, `vias de acesso de ${empresa.cidade}`);
  const entorno = vizinhos.length ? vizinhos.join(", ") : `bairros próximos ao ${b.nome}`;

  return {
    ...b,
    titulo_secao: `${nicho} no ${b.nome} em ${empresa.cidade}`,
    paragrafo_1: `Quem mora no ${b.nome} e procura ${nicho} em ${empresa.cidade} precisa encontrar uma opção local com contato rápido, informação clara e atendimento confiável. A ${empresa.nome} aparece como uma alternativa prática para moradores do ${b.nome} que desejam resolver tudo sem perder tempo pesquisando em vários lugares. Nesta página, o conteúdo foi organizado para fortalecer buscas locais como “${nicho} no ${b.nome}”, “${nicho} perto de mim” e “${nicho} em ${empresa.cidade}”, usando contexto semântico da cidade e termos relacionados como ${lsi}.`,
    subtitulo_1: `Atendimento para moradores do ${b.nome}`,
    paragrafo_2: `O atendimento da ${empresa.nome} valoriza proximidade, resposta direta e orientação objetiva para quem está no ${b.nome}. A proposta é facilitar o primeiro contato pelo WhatsApp ou telefone, entender a necessidade do cliente e indicar o melhor caminho conforme o serviço procurado. Para quem compara opções de ${nicho}, ${lsi}, a presença local em ${empresa.cidade}-${empresa.estado} ajuda a transmitir confiança e reduz a distância entre pesquisa e contratação.`,
    subtitulo_2: `Cobertura local no entorno do ${b.nome}`,
    paragrafo_3: `Além do ${b.nome}, a página reforça presença em áreas próximas como ${entorno}, conectando o negócio ao mapa real de ${empresa.cidade}. O texto considera regiões como ${regioes}, referências urbanas como ${referencias} e acessos por ${avenidas}, sem inventar endereço ou promessa falsa. Isso cria um contexto local mais completo para o Google entender a relação entre ${empresa.nome}, ${nicho}, ${b.nome} e ${empresa.cidade}.`,
    cta_texto: "FALAR NO WHATSAPP AGORA",
    cta_emoji: "💬",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let supabaseRef: any = null;
  let pageIdRef: string | null = null;

  try {
    const { business_id } = await req.json();
    if (!business_id) {
      return new Response(JSON.stringify({ error: "business_id obrigatório" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Deno.env.get("GEMINI_API_KEY") && !Deno.env.get("OPENAI_API_KEY"))
      throw new Error("Configure GEMINI_API_KEY ou OPENAI_API_KEY");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    supabaseRef = supabase;

    const { data: empresa, error: empErr } = await supabase
      .from("empresas").select("*").eq("id", business_id).maybeSingle();
    if (empErr || !empresa) {
      return new Response(JSON.stringify({ error: "Empresa não encontrada" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planoNorm = empresa.plano === "premium" ? "premium"
      : empresa.plano === "profissional" ? "profissional" : "basico";
    const { min: MIN_B, max: MAX_B } = planoBairrosMax(planoNorm);

    // Slug + upsert pendente
    const { data: existing } = await supabase
      .from("client_pages").select("id, slug").eq("business_id", business_id).maybeSingle();

    let slug: string;
    let pageId: string;
    if (existing) {
      slug = existing.slug;
      pageId = existing.id;
      await supabase.from("client_pages").update({ status: "gerando" }).eq("id", existing.id);
    } else {
      const baseSlug = slugify(`${empresa.nome}-${empresa.cidade}`);
      slug = await generateUniqueSlug(supabase, baseSlug || `negocio-${business_id.slice(0, 8)}`);
      const { data: ins, error: insErr } = await supabase.from("client_pages").insert({
        business_id, slug, status: "gerando", plano: planoNorm,
        nome_empresa: empresa.nome, categoria: empresa.nicho,
        cidade: empresa.cidade, estado: empresa.estado,
        telefone: empresa.telefone, whatsapp: empresa.whatsapp,
        endereco: empresa.endereco, descricao_original: empresa.descricao,
      }).select("id").single();
      if (insErr) throw insErr;
      pageId = ins.id;
    }
    pageIdRef = pageId;

    // ============ FASE 1: Buscar bairros REAIS via OSM + contexto da cidade em paralelo ============
    console.log(`[gen] Iniciando geração para ${empresa.nome} em ${empresa.cidade}-${empresa.estado}`);

    const cityContextSchema = {
      type: "object",
      properties: {
        avenidas_principais: { type: "array", items: { type: "string" }, description: "5-12 avenidas/ruas REAIS importantes da cidade" },
        landmarks: { type: "array", items: { type: "string" }, description: "5-10 pontos de referência REAIS (shoppings, parques, hospitais, terminais)" },
        regioes: { type: "array", items: { type: "string" }, description: "Macro-regiões da cidade (ex: Zona Sul, Centro, Zona Norte)" },
        bairros_extra: { type: "array", items: { type: "object", properties: { nome: { type: "string" }, slug: { type: "string" } }, required: ["nome","slug"] }, description: "Lista complementar de bairros REAIS (caso a fonte oficial não cubra todos)" },
        sinonimos_servico: { type: "array", items: { type: "string" }, description: "5-10 termos LSI/sinônimos para SEO do segmento (ex: para 'pet shop' → banho e tosa, ração, veterinário, acessórios pet, hotel pet)" },
        publico_alvo: { type: "string", description: "Perfil típico do cliente do segmento na cidade" },
        diferencial_local: { type: "string", description: "1 frase forte sobre por que escolher um negócio LOCAL desse segmento em " + empresa.cidade },
      },
      required: ["avenidas_principais","landmarks","regioes","bairros_extra","sinonimos_servico","publico_alvo","diferencial_local"],
    };

    const emptyCityCtx = {
      avenidas_principais: [],
      landmarks: [],
      regioes: [],
      bairros_extra: [],
      sinonimos_servico: [],
      publico_alvo: "moradores e empresas locais",
      diferencial_local: `Atendimento local em ${empresa.cidade} com proximidade, agilidade e confiança.`,
    };

    const baseSchema = {
      type: "object",
      properties: {
        hero_titulo: { type: "string", description: "max 70 chars, com cidade e segmento, persuasivo" },
        hero_subtitulo: { type: "string", description: "1 frase forte com benefício + cidade" },
        sobre_texto: { type: "string", description: "250-350 palavras, tom humano, mencione cidade, segmento, sinônimos LSI, diferenciais" },
        meta_title: { type: "string", description: "max 60 chars, terminar com | GuiaLocalBR" },
        meta_description: { type: "string", description: "max 155 chars com cidade+categoria+CTA" },
        posicao_estimada: { type: "number", description: "1 a 5" },
        cpc_equivalente: { type: "number", description: "CPC médio em reais para esse segmento+cidade" },
      },
      required: ["hero_titulo","hero_subtitulo","sobre_texto","meta_title","meta_description","posicao_estimada","cpc_equivalente"],
    };

    const [osmBairros, cachedBairros, cityCtxRaw, baseContentRaw] = await Promise.all([
      fetchOSMBairros(empresa.cidade, empresa.estado),
      fetchCachedBairros(supabase, empresa.cidade, empresa.estado, business_id, MAX_B),
      callAI(
        "Você é especialista em geografia urbana e SEO local brasileiro. Conhece a fundo as cidades do Brasil. Responda APENAS via tool call com dados REAIS verificáveis.",
        `Cidade: ${empresa.cidade}-${empresa.estado}. Segmento do negócio: ${empresa.nicho || "serviços locais"}.
Forneça contexto urbano REAL para enriquecer um conteúdo SEO local sobre essa cidade.
NÃO invente nomes. Se não souber com certeza, deixe a lista menor.`,
        cityContextSchema,
        2,
      ).catch((e) => {
        console.warn("[AI] contexto urbano falhou, seguindo com fallback:", e?.message || e);
        return emptyCityCtx;
      }),
      callAI(
        "Você é copywriter sênior de marketing local e SEO técnico brasileiro. Escreve textos longos, semanticamente ricos, com LSI keywords e tom humano. Responda APENAS via tool call.",
        `Negócio: "${empresa.nome}" — segmento "${empresa.nicho || "serviços"}" em ${empresa.cidade}-${empresa.estado}.
Endereço: ${empresa.endereco || "não informado"}.
Descrição original (se houver): ${empresa.descricao || "n/a"}.

Gere hero forte, texto sobre rico (250-350 palavras com LSI keywords e menção a ${empresa.cidade}), e meta-tags otimizadas para SEO local.`,
        baseSchema,
        2,
      ).catch((e) => {
        console.warn("[AI] conteúdo base falhou, seguindo com fallback:", e?.message || e);
        return {};
      }),
    ]);
    const cityCtx = { ...emptyCityCtx, ...(cityCtxRaw || {}) };
    const baseContent = baseContentRaw || {};

    // ============ FASE 2: Consolidar lista de bairros (OSM = fonte de verdade, IA complementa) ============
    let combinados = dedupeBairros(
      [...osmBairros, ...cachedBairros, ...(cityCtx?.bairros_extra || [])],
      MAX_B,
    );

    // Cobertura SEO local: queremos a CIDADE TODA. Se OSM não cobriu bem
    // (cidades mal mapeadas ou médias/grandes com poucos resultados),
    // pedimos à IA uma lista expandida e MESCLAMOS com o que já temos.
    const COVERAGE_TARGET = 120; // alvo para cobertura forte de cidade média/grande
    let iaExpansaoCount = 0;
    if (combinados.length < COVERAGE_TARGET) {
      try {
        const jaTemos = combinados.map((b) => b.nome).slice(0, 200);
        const expandido = await callAI(
          "Você é geógrafo brasileiro especialista em divisão territorial urbana (bairros, distritos, jardins, vilas, parques, conjuntos habitacionais, residenciais, núcleos, zonas e setores). Responda APENAS via tool call com bairros REAIS verificáveis. NÃO invente nomes.",
          `Liste TODOS os bairros REAIS de ${empresa.cidade}-${empresa.estado} que você conhece (inclua Jardins, Vilas, Parques, Conjuntos, Residenciais, Núcleos, Chácaras, Distritos e Zonas). Quanto MAIS bairros reais, melhor — o objetivo é cobertura SEO de toda a cidade.
${jaTemos.length ? `Já temos esta lista parcial (não repita, mas pode complementar): ${jaTemos.join(", ")}.` : ""}
Mínimo 80, máximo 300. Se a cidade for grande (Maringá, Curitiba, SP, Rio etc.) tente passar de 150.`,
          {
            type: "object",
            properties: {
              bairros: {
                type: "array", minItems: 60, maxItems: 300,
                items: { type: "object", properties: { nome: { type: "string" }, slug: { type: "string" } }, required: ["nome", "slug"] },
              },
            },
            required: ["bairros"],
          },
          2,
        );
        const expandidoList = expandido?.bairros || [];
        iaExpansaoCount = expandidoList.length;
        combinados = dedupeBairros([...combinados, ...expandidoList], MAX_B);
      } catch (e) {
        console.warn("[gen] expansão IA falhou:", (e as Error)?.message || e);
      }
    }

    const bairrosBase = combinados;
    if (bairrosBase.length === 0) {
      throw new Error("Nenhum bairro encontrado para esta cidade.");
    }

    console.log(`[gen] ${bairrosBase.length} bairros consolidados (OSM=${osmBairros.length}, cache=${cachedBairros.length}, IA-extra=${cityCtx?.bairros_extra?.length || 0}, IA-expansão=${iaExpansaoCount})`);

    const posicaoEstimada = parseInteger(baseContent.posicao_estimada, 3, 1, 5);
    const cpcEquivalente = parseMoney(baseContent.cpc_equivalente, 12);

    // ============ FASE 3: Conteúdo por bairro com contexto da cidade ============
    const ctxString = `
CONTEXTO DA CIDADE (use para mencionar elementos REAIS, sem inventar):
- Macro-regiões: ${(cityCtx?.regioes || []).join(", ") || "—"}
- Avenidas/ruas principais: ${(cityCtx?.avenidas_principais || []).join(", ") || "—"}
- Pontos de referência: ${(cityCtx?.landmarks || []).join(", ") || "—"}
- Sinônimos/LSI do segmento (use 2-3 ao longo do texto): ${(cityCtx?.sinonimos_servico || []).join(", ") || "—"}
- Público-alvo típico: ${cityCtx?.publico_alvo || "—"}
- Diferencial de comprar local: ${cityCtx?.diferencial_local || "—"}`;

    const sysBairro =
      "Você é copywriter de marketing local + SEO técnico brasileiro. Escreve com tom humano, informal e persuasivo, usando LSI keywords (sinônimos do serviço), menções a regiões reais e CTAs naturais. NÃO invente nomes de ruas: use apenas as fornecidas no contexto, ou cite genericamente 'ruas e avenidas do bairro'. Responda APENAS via tool call.";

    const schemaBairro = {
      type: "object",
      properties: {
        titulo_secao: { type: "string", description: "Título H2 com bairro + segmento + cidade. Ex: 'Pet Shop no Bairro X em Cidade Y'" },
        paragrafo_1: { type: "string", description: "150-200 palavras. Comece interpelando o morador do bairro. Mencione o nome do bairro 2x, o segmento (com 1 sinônimo LSI) e a cidade. Tom de conversa." },
        subtitulo_1: { type: "string", description: "H3 sobre como funciona o atendimento, mencionando o bairro" },
        paragrafo_2: { type: "string", description: "120-180 palavras sobre o processo de atendimento, vantagens e diferenciais. Use 1-2 sinônimos LSI do serviço. Mencione o bairro 1x." },
        subtitulo_2: { type: "string", description: "H3 sobre a região atendida (ex: 'Atendimento em todo o entorno do [bairro]')" },
        paragrafo_3: { type: "string", description: "120-160 palavras citando macro-região (Zona Sul/Centro/etc), avenidas/landmarks REAIS do contexto se fizer sentido geográfico, e bairros vizinhos. NUNCA invente nomes de ruas." },
        cta_texto: { type: "string", description: "CTA forte em CAPS, 4-7 palavras" },
        cta_emoji: { type: "string", description: "1 emoji relevante" },
      },
      required: ["titulo_secao","paragrafo_1","subtitulo_1","paragrafo_2","subtitulo_2","paragrafo_3","cta_texto","cta_emoji"],
    };

    console.log(`[gen] Gerando conteúdo SEO para ${bairrosBase.length} bairros...`);
    const bairrosFinal: any[] = [];
    const USE_AI_PER_BAIRRO = bairrosBase.length <= 30;
    const BATCH = USE_AI_PER_BAIRRO ? 4 : 40;

    for (let i = 0; i < bairrosBase.length; i += BATCH) {
      const lote = bairrosBase.slice(i, i + BATCH);
      const results = await Promise.all(lote.map(async (b) => {
        const vizinhos = bairrosBase.filter(x => x.slug !== b.slug).slice(0, 8).map(x => x.nome);
        if (!USE_AI_PER_BAIRRO) return semanticBairroContent(empresa, b, cityCtx, vizinhos);
        try {
          const c = await callAI(
            sysBairro,
            `Empresa: ${empresa.nome}
Segmento: ${empresa.nicho || "serviços"}
Cidade: ${empresa.cidade}-${empresa.estado}
Bairro alvo: ${b.nome}
WhatsApp: ${empresa.whatsapp}
${ctxString}

Bairros vizinhos (cite 2-3 que fizerem sentido): ${vizinhos.join(", ")}

Gere conteúdo SEO local FORTE para o bairro ${b.nome}. Escreva pensando em ranquear no Google para buscas como "${empresa.nicho || "serviço"} ${b.nome} ${empresa.cidade}".`,
            schemaBairro,
            0,
          );
          return sanitizeBairroContent(empresa, b, c);
        } catch (err: any) {
          console.error(`[gen] erro bairro ${b.nome}:`, err?.message);
          return semanticBairroContent(empresa, b, cityCtx, vizinhos);
        }
      }));
      bairrosFinal.push(...results);
      // Throttle leve entre lotes para evitar rate limit
      if (i + BATCH < bairrosBase.length) {
        await new Promise((r) => setTimeout(r, USE_AI_PER_BAIRRO ? 500 : 80));
      }
    }

    // ============ FASE 4: Schema.org LocalBusiness enriquecido ============
    const schema_json = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: empresa.nome,
      description: baseContent.meta_description,
      url: `${SITE}/${slug}`,
      telephone: empresa.telefone || empresa.whatsapp,
      address: {
        "@type": "PostalAddress",
        streetAddress: empresa.endereco,
        addressLocality: empresa.cidade,
        addressRegion: empresa.estado,
        addressCountry: "BR",
      },
      areaServed: bairrosFinal.map((b) => ({
        "@type": "Place",
        name: `${b.nome}, ${empresa.cidade} - ${empresa.estado}`,
      })),
      knowsAbout: cityCtx?.sinonimos_servico || [],
      priceRange: "$$",
      image: empresa.foto_principal || undefined,
    };

    const cliques_mes = posicaoEstimada <= 3 ? 150 : 60;
    const economia_ads_anual = parseMoney(cliques_mes * cpcEquivalente * 12, 21600);

    const fotosIniciais = [empresa.foto_principal, ...(empresa.fotos_adicionais || [])]
      .filter(Boolean).slice(0, 8);

    const { data: saved, error: upErr } = await supabase
      .from("client_pages")
      .update({
        status: "ativo",
        publicado_at: new Date().toISOString(),
        hero_titulo: safeText(baseContent.hero_titulo, `${empresa.nome} em ${empresa.cidade}`),
        hero_subtitulo: safeText(baseContent.hero_subtitulo, `Conheça ${empresa.nome}, opção local em ${empresa.cidade}-${empresa.estado}.`),
        sobre_texto: safeText(baseContent.sobre_texto, `${empresa.nome} atende clientes em ${empresa.cidade} com foco em qualidade, praticidade e relacionamento local.`),
        bairros: bairrosFinal,
        total_bairros: bairrosFinal.length,
        meta_title: safeText(baseContent.meta_title, `${empresa.nome} em ${empresa.cidade} | GuiaLocalBR`).slice(0, 80),
        meta_description: safeText(baseContent.meta_description, `Encontre ${empresa.nome} em ${empresa.cidade}-${empresa.estado}. Veja informações, bairros atendidos e fale pelo WhatsApp.`).slice(0, 180),
        schema_json,
        nome_empresa: empresa.nome,
        categoria: empresa.nicho,
        whatsapp: empresa.whatsapp,
        telefone: empresa.telefone,
        endereco: empresa.endereco,
        cidade: empresa.cidade,
        estado: empresa.estado,
        descricao_original: empresa.descricao,
        fotos: fotosIniciais,
        posicao_estimada: posicaoEstimada,
        cliques_mes_estimado: cliques_mes,
        cpc_equivalente: cpcEquivalente,
        economia_ads_anual,
      })
      .eq("id", pageId).select().single();

    if (upErr) throw upErr;

    return new Response(JSON.stringify({
      ok: true, page: saved, slug,
      stats: {
        bairros_total: bairrosFinal.length,
        fonte_osm: osmBairros.length,
        fonte_ia_extra: cityCtx?.bairros_extra?.length || 0,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("generate-client-page error", e);
    if (supabaseRef && pageIdRef) {
      try { await supabaseRef.from("client_pages").update({ status: "erro" }).eq("id", pageIdRef); } catch (_) {}
    }
    if (e?.status === 429) {
      return new Response(JSON.stringify({ error: "Limite de IA atingido, tente em alguns minutos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (e?.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
