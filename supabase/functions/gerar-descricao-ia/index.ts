import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { generateAI } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { nome, nicho, cidade, estado, endereco, modo } = await req.json();

    if (!nome) {
      return new Response(JSON.stringify({ error: "Nome da empresa é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sem checagens de chave: o _shared/ai.ts usa Lovable AI Gateway (Gemini 2.5 Flash)
    // por padrão e cai para OpenAI/Gemini direto se as chaves opcionais estiverem setadas.

    const system =
      "Você é um especialista em SEO e marketing digital para negócios locais no Brasil. Escreve em português brasileiro fluente, persuasivo e sem clichês.";

    const contexto = `Empresa: ${nome}
${nicho ? `Segmento: ${nicho}` : ""}
${cidade ? `Cidade: ${cidade}` : ""}
${estado ? `Estado: ${estado}` : ""}
${endereco ? `Endereço: ${endereco}` : ""}`.trim();

    // Modo legado: só descrição (mantém contrato antigo dos componentes existentes)
    if (modo !== "completo") {
      const prompt = `Crie uma descrição comercial otimizada para SEO para a seguinte empresa:

${contexto}

Requisitos:
- Até 200 palavras (pode ser menor se ficar mais natural)
- Linguagem persuasiva e profissional
- Inclua palavras-chave do segmento e da localização (SEO local)
- Destaque benefícios para o cliente
- Sem hashtags, emojis ou markdown
- Português brasileiro
- Estilo de descrição de Google Meu Negócio

Retorne APENAS o texto, sem aspas ou prefixos.`;

      const r = await generateAI([
        { role: "system", content: system },
        { role: "user", content: prompt },
      ]);
      const descricao = (r.text || "").trim();
      if (!descricao) throw new Error("Nenhuma descrição gerada");
      return new Response(JSON.stringify({ descricao, provider: r.provider }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Modo completo: descrição + meta_description (até 160) + 3 FAQs via tool calling
    const tool = {
      name: "gerar_conteudo_seo",
      description:
        "Gera conteúdo SEO completo (descrição comercial, meta description curta e FAQ) para uma empresa local.",
      parameters: {
        type: "object",
        properties: {
          descricao: {
            type: "string",
            description:
              "Descrição comercial persuasiva da empresa em português, até 200 palavras, sem markdown, com palavras-chave locais.",
          },
          meta_description: {
            type: "string",
            description:
              "Meta description SEO de no máximo 160 caracteres, em português, persuasiva e com a cidade.",
          },
          faq: {
            type: "array",
            description: "Exatamente 3 perguntas frequentes com respostas curtas (2-3 frases cada).",
            items: {
              type: "object",
              properties: {
                pergunta: { type: "string" },
                resposta: { type: "string" },
              },
              required: ["pergunta", "resposta"],
            },
            minItems: 3,
            maxItems: 3,
          },
        },
        required: ["descricao", "meta_description", "faq"],
      },
    };

    const r = await generateAI(
      [
        { role: "system", content: system },
        {
          role: "user",
          content: `Crie o pacote SEO completo (descrição + meta description + 3 FAQs) para:\n\n${contexto}\n\nGere conteúdo natural, sem clichês, focado em buscas locais.`,
        },
      ],
      tool,
    );

    const args = r.toolArgs || {};
    if (!args.descricao || !args.meta_description || !Array.isArray(args.faq)) {
      throw new Error("IA não retornou o pacote completo esperado");
    }
    // Garante limite de 160 caracteres no meta
    if (args.meta_description.length > 160) {
      args.meta_description = args.meta_description.slice(0, 157).trimEnd() + "...";
    }

    return new Response(
      JSON.stringify({
        descricao: args.descricao,
        meta_description: args.meta_description,
        faq: args.faq.slice(0, 3),
        provider: r.provider,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[gerar-descricao-ia] erro:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
