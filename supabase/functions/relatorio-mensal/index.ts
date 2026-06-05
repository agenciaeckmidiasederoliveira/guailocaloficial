import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("VITE_SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const chaveGemini = Deno.env.get("VITE_GEMINI_KEY_1");

    // Buscar empresas premium que têm email configurado
    const { data: empresas } = await supabase
      .from('empresas')
      .select('id, nome, email_contato, slug')
      .eq('plano', 'premium')
      .not('email_contato', 'is', null);

    if (!empresas) return new Response("Sem empresas");

    const hoje = new Date();
    hoje.setDate(1);
    hoje.setHours(0,0,0,0);
    const trintaDiasAtras = new Date(hoje);
    trintaDiasAtras.setMonth(trintaDiasAtras.getMonth() - 1); // Mock mes passado

    for (const empresa of empresas) {
       // Buscar Analytics do mes
       const { data: analitico } = await supabase
         .from('analytics_eventos')
         .select('tipo')
         .eq('empresa_id', empresa.id)
         .gte('criado_em', trintaDiasAtras.toISOString());
       
       const visitas = analitico?.filter(a => a.tipo === 'visita_empresa').length || 0;
       const zap = analitico?.filter(a => a.tipo === 'clique_whatsapp').length || 0;
       const site = analitico?.filter(a => a.tipo === 'clique_site').length || 0;

       // Chamar Gemini para resumo (Opcional, com try catch pra não travar loop)
       let resumoIA = "O mês foi excelente para a sua empresa! Continue publicando conteúdo e mantendo seu perfil atualizado para atrair ainda mais visitantes.";
       try {
         const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${chaveGemini}`;
         const r = await fetch(url, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify({
             contents: [{ parts: [{ text: `Gere um relatório executivo curto em português animador. Empresa: ${empresa.nome}. Visitas: ${visitas}. Cliques Whatsapp: ${zap}.` }] }]
           })
         });
         const d = await r.json();
         if(d.candidates?.[0]?.content?.parts?.[0]?.text) {
           resumoIA = d.candidates[0].content.parts[0].text;
         }
       } catch (e) {
         console.log("Gemini falhou para", empresa.nome);
       }

       // HTML do Email
       const htmlEmail = `
         <div style="font-family: Arial; max-width: 600px; margin: 0 auto;">
           <h1 style="color: #2563EB;">Guia Local BR - Seu Relatório</h1>
           <p>Olá equipe da <strong>${empresa.nome}</strong>!</p>
           <p>${resumoIA}</p>
           <div style="background: #f3f4f6; padding: 20px; border-radius: 8px;">
             <h3>Resultados do Mês:</h3>
             <ul>
               <li>👀 Visitas no perfil: <b>${visitas}</b></li>
               <li>💬 Cliques no WhatsApp: <b>${zap}</b></li>
               <li>🌐 Cliques no Site: <b>${site}</b></li>
             </ul>
           </div>
           <br/>
           <a href="https://guialocalbr.com.br/empresa/${empresa.slug}" style="background: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Ver Perfil Completo</a>
         </div>
       `;

       // Descomentar em PROD pra enviar mesmo
       /*
       await resend.emails.send({
         from: 'relatorios@guialocalbr.com.br',
         to: empresa.email_contato,
         subject: 'Seu Relatório Mensal de Desempenho - Guia Local BR',
         html: htmlEmail
       });
       */
       console.log(`Relatorio enviado (simulado) para ${empresa.email_contato}`);
    }

    return new Response(JSON.stringify({ ok: true, processadas: empresas.length }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
