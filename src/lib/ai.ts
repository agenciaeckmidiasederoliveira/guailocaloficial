import { chamarGemini } from './gemini'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

function limparJson(texto: string) {
  return texto.replace(/```json|```/g, '').trim()
}

async function chamarOpenAI(prompt: string, maxTokens = 1200) {
  if (!OPENAI_API_KEY) {
    throw new Error('Fallback OpenAI não configurado')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

export async function gerarJsonComIA<T>(prompt: string, maxTokens = 1200): Promise<T> {
  try {
    const resposta = await chamarGemini(prompt, { maxTokens })
    return JSON.parse(limparJson(resposta)) as T
  } catch {
    const fallback = await chamarOpenAI(prompt, maxTokens)
    return JSON.parse(limparJson(fallback)) as T
  }
}

export interface ResultadoSeoEmpresa {
  descricao_otimizada: string
  seo_titulo: string
  seo_descricao: string
  faqs: Array<{ pergunta: string; resposta: string }>
}

export async function gerarSeoEmpresaIA(input: {
  nome: string
  categoria: string
  cidade: string
  descricao?: string
}): Promise<ResultadoSeoEmpresa> {
  const prompt = `
Você é um especialista em SEO local brasileiro.

Crie uma descrição curta e persuasiva para a empresa abaixo e também um FAQ com 3 perguntas e respostas.

DADOS:
- Nome: ${input.nome}
- Categoria: ${input.categoria}
- Cidade: ${input.cidade}
- Informações extras: ${input.descricao || 'não informado'}

REGRAS:
- Português brasileiro
- descricao_otimizada com no máximo 160 caracteres
- seo_titulo com no máximo 60 caracteres
- seo_descricao com no máximo 160 caracteres
- faqs com exatamente 3 itens
- Cada pergunta deve soar natural para busca local
- Cada resposta deve ter 1 ou 2 frases curtas
- Não invente dados específicos que não foram fornecidos

RETORNE APENAS JSON:
{
  "descricao_otimizada": "string",
  "seo_titulo": "string",
  "seo_descricao": "string",
  "faqs": [
    { "pergunta": "string", "resposta": "string" }
  ]
}
`

  return gerarJsonComIA<ResultadoSeoEmpresa>(prompt, 1200)
}
