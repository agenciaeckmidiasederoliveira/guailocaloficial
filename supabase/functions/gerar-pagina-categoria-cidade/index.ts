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
    const { cidade_id, categoria_id } = await req.json()
    if (!cidade_id || !categoria_id) throw new Error('cidade_id ou categoria_id faltando')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Verificar se a página já existe (para evitar duplicatas)
    const { data: pageExists } = await supabaseClient
      .from('paginas_categoria_cidade')
      .select('id')
      .eq('cidade_id', cidade_id)
      .eq('categoria_id', categoria_id)
      .maybeSingle()

    if (pageExists) {
      return new Response(JSON.stringify({ success: true, message: 'Página já existe.' }), { headers: corsHeaders })
    }

    // 2. Buscar cidade e categoria
    const { data: cidade } = await supabaseClient.from('cidades').select('nome, estado').eq('id', cidade_id).single()
    const { data: categoria } = await supabaseClient.from('categorias').select('nome, slug').eq('id', categoria_id).single()

    if (!cidade || !categoria) throw new Error('Cidade ou categoria não encontrada')

    // 3. Buscar Top Empresas
    const { data: empresas } = await supabaseClient
      .from('empresas')
      .select('nome, descricao, nota_media')
      .eq('cidade_id', cidade_id)
      .eq('categoria_id', categoria_id)
      .in('plano', ['premium', 'turbo'])
      .limit(5)

    const topEmpresasList = empresas?.map(e => `- ${e.nome} (Nota: ${e.nota_media}): ${e.descricao || 'Excelente opção na região.'}`).join('\n') || 'Nenhuma empresa premium cadastrada ainda.'

    const prompt = `Crie conteúdo HTML otimizado para SEO sobre ${categoria.nome} em ${cidade.nome}.
   
Estrutura obrigatória:
<h1>Melhores ${categoria.nome} em ${cidade.nome}, ${cidade.estado}</h1>
<p>Parágrafo introdutório atraente sobre ${categoria.nome} em ${cidade.nome} (150-200 palavras).</p>
<h2>Por que usar o Guia Local BR para encontrar ${categoria.nome} em ${cidade.nome}?</h2>
<p>Benefícios de consultar nosso guia (100 palavras).</p>
<h2>Destaques de ${categoria.nome} em ${cidade.nome}</h2>
<p>${topEmpresasList}</p>
<h2>Como funciona o Guia Local BR</h2>
<p>Explicação breve de como conectamos clientes a negócios locais de confiança.</p>

Regras:
- Tom informativo e local.
- Use a keyword '${categoria.nome} em ${cidade.nome}' ao menos 4 vezes.
- Inclua '${cidade.nome} ${cidade.estado}' pelo menos 2 vezes.
- RETORNE APENAS O HTML (sem tags de markdown, sem DOCTYPE, sem \`\`\`html).`

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
    const htmlResult = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    
    if (!htmlResult) throw new Error('Falha ao gerar HTML com a IA')

    // Limpar o markdown
    const cleanHtml = htmlResult.replace(/^```html\n?/, '').replace(/\n?```$/, '')

    // 4. Salvar
    const slugFormatado = `${categoria.slug}-em-${cidade.nome.toLowerCase().replace(/ /g, '-')}-${cidade.estado.toLowerCase()}`
    
    const { error: errInsert } = await supabaseClient.from('paginas_categoria_cidade').insert({
      cidade_id,
      categoria_id,
      titulo: `Melhores ${categoria.nome} em ${cidade.nome}`,
      slug: slugFormatado,
      conteudo_html: cleanHtml,
      seo_titulo: `Melhores ${categoria.nome} em ${cidade.nome} - ${cidade.estado} | Guia Local BR`,
      seo_descricao: `Encontre as melhores opções de ${categoria.nome} em ${cidade.nome}. Confira avaliações, horários e contatos no Guia Local BR.`,
      publicada: true,
      gerada_em: new Date().toISOString()
    })

    if (errInsert) throw new Error(errInsert.message)

    return new Response(
      JSON.stringify({ success: true, slug: slugFormatado }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
