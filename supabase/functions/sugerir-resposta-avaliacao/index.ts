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
    const { avaliacao_id } = await req.json()
    if (!avaliacao_id) throw new Error('avaliacao_id não fornecido')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Buscar dados
    const { data: avaliacao, error: errAv } = await supabaseClient
      .from('avaliacoes')
      .select('*, empresas(nome, cidades(nome), categorias(nome))')
      .eq('id', avaliacao_id)
      .single()

    if (errAv || !avaliacao) throw new Error('Avaliação não encontrada')

    const prompt = `Você é o dono de uma empresa local brasileira.
Um cliente deixou esta avaliação:
Nota: ${avaliacao.nota}/5
Comentário: '${avaliacao.comentario || 'Sem comentário escrito, apenas a nota.'}'

Empresa: ${avaliacao.empresas?.nome} | Categoria: ${avaliacao.empresas?.categorias?.nome} | Cidade: ${avaliacao.empresas?.cidades?.nome}

Escreva uma resposta profissional, cordial e personalizada (não genérica).
- Se nota >= 4: agradeça de forma calorosa, mencione algo específico do comentário
- Se nota <= 2: reconheça o problema sem se defender, ofereça solução, convide de volta
- Se nota = 3: agradeça e pergunte como melhorar
- Máximo 100 palavras, tom humano e caloroso
- Termine com: 'Att, equipe ${avaliacao.empresas?.nome}'
- Em português brasileiro, linguagem acessível

RETORNE APENAS O TEXTO DA RESPOSTA. NADA MAIS.`;

    const apiKey = Deno.env.get('GEMINI_KEY_1') || Deno.env.get('GEMINI_KEY')
    if (!apiKey) throw new Error('Chave do Gemini não configurada')

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    })

    const geminiData = await response.json()
    const textResult = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    
    if (!textResult) throw new Error('Falha ao gerar texto com a IA')

    // Atualiza a coluna de sugestão da IA (a resposta final depende do humano salvar)
    await supabaseClient
      .from('avaliacoes')
      .update({ resposta_gerada_ia: textResult })
      .eq('id', avaliacao_id)

    return new Response(
      JSON.stringify({ success: true, sugestao: textResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
