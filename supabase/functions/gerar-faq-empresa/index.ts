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

    // 1. Buscar dados da empresa
    const { data: empresa, error: errEmpresa } = await supabaseClient
      .from('empresas')
      .select('*, cidades(nome, estado), categorias(nome)')
      .eq('id', empresa_id)
      .single()

    if (errEmpresa || !empresa) throw new Error('Empresa não encontrada')

    const prompt = `Você é um especialista em SEO local brasileiro.
Baseado nos dados desta empresa, crie 5 perguntas e respostas
que clientes fariam ao buscar esse tipo de negócio no Google.

DADOS: 
Nome: ${empresa.nome}
Categoria: ${empresa.categorias?.nome}
Cidade: ${empresa.cidades?.nome} - ${empresa.cidades?.estado}
Endereço: ${empresa.endereco}
Telefone/WhatsApp: ${empresa.whatsapp_vendas || empresa.whatsapp_contato || 'Não informado'}
Horário: ${JSON.stringify(empresa.horario_funcionamento || 'Não informado')}
Descrição: ${empresa.descricao || 'Não informada'}

Regras:
- Perguntas reais que pessoas fazem no Google
- Inclua a cidade e tipo de negócio nas perguntas para SEO
- Respostas diretas, entre 40-80 palavras
- Use dados reais fornecidos (horário, endereço, WhatsApp)
- Inclua keywords como '${empresa.categorias?.nome} em ${empresa.cidades?.nome}' naturalmente

RETORNE APENAS JSON VÁLIDO EXATAMENTE NESTE FORMATO (sem markdown, sem \`\`\`json):
{
  "faqs": [
    { "pergunta": "string", "resposta": "string" }
  ]
}
Em português brasileiro.`;

    const apiKey = Deno.env.get('GEMINI_KEY_1') || Deno.env.get('GEMINI_KEY')
    if (!apiKey) throw new Error('Chave do Gemini não configurada')

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    })

    const geminiData = await response.json()
    const textResult = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!textResult) throw new Error('Falha ao gerar texto com a IA')

    const jsonResult = JSON.parse(textResult)

    // Salvar no banco
    const { error: errUpdate } = await supabaseClient
      .from('empresas')
      .update({ faqs: jsonResult })
      .eq('id', empresa_id)

    if (errUpdate) throw new Error('Erro ao salvar FAQs: ' + errUpdate.message)

    return new Response(
      JSON.stringify({ success: true, faqs: jsonResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
