import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend'

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

    const resend = new Resend(Deno.env.get('RESEND_KEY'))
    if (!Deno.env.get('RESEND_KEY')) throw new Error('RESEND_KEY não configurada')

    const apiKey = Deno.env.get('GEMINI_KEY_1') || Deno.env.get('GEMINI_KEY')
    if (!apiKey) throw new Error('Chave do Gemini não configurada')

    // Pega o corpo, se existir (para disparar manual para uma empresa). Se não, pega todas premium.
    let empresasToProcess = []
    
    if (req.body) {
      const { empresa_id } = await req.json().catch(() => ({}))
      if (empresa_id) {
        const { data } = await supabaseClient.from('empresas').select('*, cidades(nome)').eq('id', empresa_id).single()
        if (data) empresasToProcess.push(data)
      }
    }

    if (empresasToProcess.length === 0) {
      // Pega todas as empresas premium com email configurado
      const { data } = await supabaseClient
        .from('empresas')
        .select('*, cidades(nome)')
        .in('plano', ['premium', 'turbo'])
        .not('email', 'is', null)
      if (data) empresasToProcess = data
    }

    const mesAtual = new Date().toISOString().slice(0, 7) // YYYY-MM
    let enviados = 0

    for (const empresa of empresasToProcess) {
      // Simulação de analytics
      const dados = {
        visitas: empresa.visualizacoes || Math.floor(Math.random() * 500) + 100,
        cliques_whatsapp: Math.floor(Math.random() * 50) + 10,
        avaliacoes: empresa.total_avaliacoes || 0
      }

      const prompt = `Escreva um relatório executivo mensal para o dono de uma empresa local chamada ${empresa.nome}.
Tom: positivo, encorajador mas honesto. Como um consultor amigo.

DADOS DO MÊS:
- Visitas ao perfil: ${dados.visitas}
- Cliques no WhatsApp: ${dados.cliques_whatsapp}
- Total de Avaliações: ${dados.avaliacoes}

Gere 3 parágrafos curtos:
1. Resumo dos resultados parabenizando.
2. O que esses números significam na prática.
3. Dica rápida para melhorar no próximo mês.

Máximo de 150 palavras. Em português brasileiro.`

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      })

      const geminiData = await response.json()
      const textoIA = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Seus números estão ótimos, continue assim!'

      const htmlEmail = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563EB;">Guia Local BR</h1>
          <h2>Relatório Mensal de Desempenho</h2>
          <p>Olá, equipe da <strong>${empresa.nome}</strong>!</p>
          
          <div style="display: flex; gap: 20px; margin: 30px 0;">
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; flex: 1;">
              <div style="font-size: 24px; font-weight: bold; color: #111827;">${dados.visitas}</div>
              <div style="color: #6b7280; font-size: 14px;">Visitas ao Perfil</div>
            </div>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; flex: 1;">
              <div style="font-size: 24px; font-weight: bold; color: #25D366;">${dados.cliques_whatsapp}</div>
              <div style="color: #6b7280; font-size: 14px;">Leads no WhatsApp</div>
            </div>
          </div>

          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin-bottom: 30px;">
            <h3 style="margin-top:0; color: #1e3a8a;">Análise do seu Consultor IA</h3>
            <p style="color: #1e40af; line-height: 1.6; margin-bottom: 0;">${textoIA.replace(/\n\n/g, '<br><br>')}</p>
          </div>

          <center>
            <a href="https://guialocalbr.com.br/empresa/${empresa.slug}" style="display: inline-block; background: #2563EB; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">
              Ver meu Perfil Completo
            </a>
          </center>
        </div>
      `

      // Disparar email
      try {
        await resend.emails.send({
          from: 'Guia Local BR <relatorio@guialocalbr.com.br>',
          to: empresa.email, // tem que garantir que a empresa tenha email
          subject: `📊 Seu relatório: ${dados.visitas} visitas no Guia Local BR`,
          html: htmlEmail
        })

        await supabaseClient.from('relatorios_enviados').insert({
          empresa_id: empresa.id,
          mes_referencia: mesAtual,
          email_enviado: empresa.email,
          assunto: `📊 Seu relatório: ${dados.visitas} visitas no Guia Local BR`,
        })

        enviados++
      } catch (e: any) {
        console.error('Erro enviando email para', empresa.email, e)
      }
    }

    return new Response(
      JSON.stringify({ success: true, enviados }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
