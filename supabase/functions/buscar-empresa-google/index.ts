import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestData {
  nome: string;
  cidade: string;
  estado: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { nome, cidade, estado } = await req.json() as RequestData;
    if (!nome || !cidade) {
      return new Response(JSON.stringify({ error: 'Nome e cidade obrigatórios' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const query = `${nome} ${cidade} ${estado || ''}`.trim();

    let fonte = 'nenhuma';
    let data: any = null;
    let alternativas: any[] = [];

    // 1ª Tentativa: Serper.dev
    const serperKey = Deno.env.get('SERPER_KEY');
    if (serperKey) {
      try {
        const serperRes = await fetch('https://google.serper.dev/places', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ q: query, gl: 'br', hl: 'pt' })
        });
        
        if (serperRes.ok) {
          const json = await serperRes.json();
          if (json.places && json.places.length > 0) {
            fonte = 'serper';
            data = json.places[0];
            alternativas = json.places.slice(1, 4); // pegar proximas 3
          }
        }
      } catch (err) {
        console.error("Erro Serper:", err);
      }
    }

    // 2ª Tentativa (Fallback): SerpAPI
    if (fonte === 'nenhuma') {
      const serpapiKey = Deno.env.get('SERPAPI_KEY');
      if (serpapiKey) {
        try {
          const serpRes = await fetch(`https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(query)}&api_key=${serpapiKey}&hl=pt&gl=br`);
          if (serpRes.ok) {
            const json = await serpRes.json();
            if (json.local_results && json.local_results.length > 0) {
              fonte = 'serpapi';
              data = json.local_results[0];
              alternativas = json.local_results.slice(1, 4);
            }
          }
        } catch (err) {
          console.error("Erro SerpAPI:", err);
        }
      }
    }

    if (fonte === 'nenhuma') {
      return new Response(JSON.stringify({ 
        encontrado: false, 
        aviso: `Não encontramos '${nome}' no Google para ${cidade}. Preencha manualmente.` 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // FUNÇÕES DE NORMALIZAÇÃO
    const parseHorario = (horarioStr: string) => {
      if (!horarioStr) return null;
      const lower = horarioStr.toLowerCase();
      if (lower.includes('closed') || lower.includes('fechado')) return { abre: null, fecha: null, fechado: true };
      if (lower.includes('24 hours') || lower.includes('24 horas')) return { abre: '00:00', fecha: '23:59', fechado: false };
      
      // Ex: "9 AM–6 PM"
      let partes = lower.split('–').map(s => s.trim());
      if (partes.length !== 2) return null; // Fallback se o formato não for reconhecido

      const convertTo24 = (time: string) => {
        let isPM = time.includes('pm');
        let t = time.replace(/[^\d:]/g, '');
        if (!t.includes(':')) t += ':00';
        let [h, m] = t.split(':');
        let hours = parseInt(h);
        if (isPM && hours < 12) hours += 12;
        if (!isPM && hours === 12) hours = 0;
        return `${hours.toString().padStart(2, '0')}:${m.padStart(2, '0')}`;
      }
      
      return { abre: convertTo24(partes[0]), fecha: convertTo24(partes[1]), fechado: false };
    };

    const normalizar = (item: any, source: string) => {
      let horarioNormalizado: any = { seg: null, ter: null, qua: null, qui: null, sex: null, sab: null, dom: null };
      let cep = null;
      let telefone = null;
      
      if (item.address) {
        const cepMatch = item.address.match(/\d{5}-\d{3}/);
        if (cepMatch) cep = cepMatch[0];
      }
      if (item.phone) {
        telefone = item.phone.replace(/\D/g, '');
      }

      // Normaliza horários do Serper (geralmente formato string simples ou não vem quebrado no places básico)
      // Como o Serper ou Serpapi podem vir formatados diferente, usamos null se n conseguir mapear
      // O prompt indicou que vem um array ou objeto: { Monday: '9am-6pm' }
      if (item.hours) {
        const mapping: Record<string, string> = {
          monday: 'seg', tuesday: 'ter', wednesday: 'qua', thursday: 'qui', friday: 'sex', saturday: 'sab', sunday: 'dom'
        };
        
        if (Array.isArray(item.hours)) {
           // Às vezes Serper retorna array
        } else if (typeof item.hours === 'object') {
           Object.keys(item.hours).forEach(day => {
              const mappedDay = mapping[day.toLowerCase()];
              if (mappedDay) {
                horarioNormalizado[mappedDay] = parseHorario(item.hours[day]);
              }
           });
        }
      }

      let lat = source === 'serpapi' ? item.gps_coordinates?.latitude : item.latitude;
      let lng = source === 'serpapi' ? item.gps_coordinates?.longitude : item.longitude;
      let placeId = source === 'serpapi' ? item.place_id : item.cid;

      let confianca = 'baixa';
      if (item.title && item.title.toLowerCase().includes(nome.toLowerCase())) confianca = 'alta';

      return {
        fonte: source,
        nome: item.title || null,
        endereco: item.address || null,
        cep: cep,
        telefone: telefone,
        site: item.website || null,
        nota_media: item.rating || null,
        total_avaliacoes: item.reviews || null,
        categoria_google: item.category || item.type || null,
        horario_raw: item.hours || null,
        horario_normalizado: horarioNormalizado,
        latitude: lat || null,
        longitude: lng || null,
        google_place_id: placeId || null,
        confianca
      };
    };

    const dadosNormalizados = normalizar(data, fonte);
    const alternativasNorm = alternativas.map(a => normalizar(a, fonte));

    return new Response(JSON.stringify({
      encontrado: true,
      dados: dadosNormalizados,
      alternativas: alternativasNorm,
      aviso: "Dados importados do Google. Revise e complemente antes de salvar."
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error(err);
    return new Response(JSON.stringify({ 
      encontrado: false, 
      aviso: "Falha na comunicação com o Google, preencha manualmente." 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
