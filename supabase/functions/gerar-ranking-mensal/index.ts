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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const mesReferencia = new Date().toISOString().slice(0, 7) // Ex: "2026-05"
    let rankingsCriados = 0

    // 1. Buscar cidades que têm empresas
    // Simplificação: Vamos buscar todas as categorias de todas as empresas e agrupar
    const { data: todasEmpresas } = await supabaseClient
      .from('empresas')
      .select('id, nome, cidade_id, categoria_id, visualizacoes, total_avaliacoes, nota_media, score, plano')
      .in('plano', ['premium', 'turbo']) // Só rankea quem paga
      .not('cidade_id', 'is', null)
      .not('categoria_id', 'is', null)

    if (!todasEmpresas || todasEmpresas.length === 0) {
      return new Response(JSON.stringify({ success: true, message: 'Nenhuma empresa premium encontrada.' }), { headers: corsHeaders })
    }

    // Agrupar por cidade_id e categoria_id
    const grupos = {} as any
    todasEmpresas.forEach(emp => {
      const chave = `${emp.cidade_id}_${emp.categoria_id}`
      if (!grupos[chave]) grupos[chave] = []
      grupos[chave].push(emp)
    })

    // Processar cada grupo que tenha mais de 1 empresa para fazer sentido um ranking
    for (const chave in grupos) {
      const empresasDoGrupo = grupos[chave]
      
      // Regra de pontuação para o ranking (simplificada)
      // Score base do perfil (peso 50%) + (Visualizações * 2) + (Avaliações * 5)
      empresasDoGrupo.forEach((e: any) => {
        e.pontuacao_final = (e.score || 0) * 0.5 + (e.visualizacoes || 0) * 2 + (e.total_avaliacoes || 0) * 5
        if (e.plano === 'turbo') e.pontuacao_final += 500 // Turbo tem boost massivo
      })

      // Ordenar decrescente
      empresasDoGrupo.sort((a: any, b: any) => b.pontuacao_final - a.pontuacao_final)

      // Pegar o Top 10 e salvar
      const top10 = empresasDoGrupo.slice(0, 10)
      
      for (let i = 0; i < top10.length; i++) {
        const emp = top10[i]
        const posicao = i + 1

        // Inserir no histórico de rankings mensais
        await supabaseClient.from('rankings_mensais').insert({
          cidade_id: emp.cidade_id,
          categoria_id: emp.categoria_id,
          mes_referencia: mesReferencia,
          posicao: posicao,
          empresa_id: emp.id,
          pontuacao: emp.pontuacao_final,
          visitas: emp.visualizacoes || 0,
          nota_media: emp.nota_media || 0
        })

        // Atualizar o field `ultimo_ranking` direto na empresa para carregar fácil na interface
        await supabaseClient.from('empresas').update({
          ultimo_ranking: {
            posicao: posicao,
            mes: mesReferencia
          }
        }).eq('id', emp.id)

        rankingsCriados++
      }
    }

    return new Response(
      JSON.stringify({ success: true, rankings_criados: rankingsCriados, mes: mesReferencia }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
