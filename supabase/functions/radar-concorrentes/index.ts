import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { empresa_id } = await req.json()
    if (!empresa_id) throw new Error('empresa_id não fornecido')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Buscar a empresa alvo
    const { data: alvo, error: errAlvo } = await supabaseClient
      .from('empresas')
      .select('*, cidades(nome), categorias(nome)')
      .eq('id', empresa_id)
      .single()

    if (errAlvo || !alvo) throw new Error('Empresa não encontrada')

    // 2. Buscar concorrentes (mesma cidade e categoria, exceto ela mesma)
    const { data: concorrentes, error: errConc } = await supabaseClient
      .from('empresas')
      .select('id, nome, score, avaliacao, total_avaliacoes, visualizacoes')
      .eq('cidade_id', alvo.cidade_id)
      .eq('categoria_id', alvo.categoria_id)
      .neq('id', alvo.id)
      .order('score', { ascending: false })
      .limit(10)

    const dadosComparativos = {
      alvo: {
        nome: alvo.nome,
        score: alvo.score || 0,
        avaliacao: alvo.avaliacao || 0,
        avaliacoes: alvo.total_avaliacoes || 0,
        visitas: alvo.visualizacoes || 0,
      },
      concorrentes: concorrentes?.map(c => ({
        score: c.score || 0,
        avaliacao: c.avaliacao || 0,
        visitas: c.visualizacoes || 0,
      })) || [],
      total_concorrentes: concorrentes?.length || 0
    }

    const prompt = `Você é um consultor de marketing de negócios locais no Brasil.
Analise a competitividade desta empresa vs seus concorrentes na mesma categoria e cidade.

DADOS DA EMPRESA ALVO:
${JSON.stringify(dadosComparativos.alvo)}

DADOS DOS CONCORRENTES (top 10):
${JSON.stringify(dadosComparativos.concorrentes)}

Gere uma análise estratégica em JSON EXATAMENTE NESTE FORMATO:
{
  "resumo_posicao": "uma frase direta sobre onde a empresa está vs concorrentes",
  "vantagens_competitivas": ["lista de 1 a 3 coisas que a empresa faz melhor"],
  "gaps_criticos": [
    {
      "gap": "o que está faltando ou o que está fraco",
      "impacto_estimado": "o que acontece se resolver",
      "dificuldade": "fácil|médio|difícil",
      "acao": "como resolver especificamente"
    }
  ],
  "estrategia_recomendada": "parágrafo com a estratégia principal para subir no ranking",
  "tempo_estimado_melhora": "30 dias | 60 dias | 90 dias"
}
Retorne APENAS O JSON VÁLIDO. Sem marcações \`\`\`json.`;

    const apiKey = Deno.env.get('GEMINI_KEY_1') || Deno.env.get('GEMINI_KEY')
    if (!apiKey) throw new Error('Chave do Gemini não configurada')

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    })

    const geminiData = await response.json()
    const textResult = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!textResult) throw new Error('Falha ao gerar análise com a IA')

    const jsonResult = JSON.parse(textResult)

    return new Response(
      JSON.stringify({ success: true, analise: jsonResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
