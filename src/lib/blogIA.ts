import { chamarGemini } from './gemini'

export interface EmpresaParaArtigo {
  nome: string
  categoria?: { nome: string }
  cidade?: { nome: string; estado?: { uf: string } }
  bairro?: { nome: string }
  descricao?: string
  descricao_otimizada?: string
  meios_pagamento?: string[]
  horario_funcionamento?: any
  whatsapp: string
}

export interface ArtigoGerado {
  titulo: string
  slug: string
  resumo: string
  conteudo_html: string
  tags: string[]
  seo_titulo: string
  seo_descricao: string
}

export async function gerarArtigoEmpresa(empresa: EmpresaParaArtigo): Promise<ArtigoGerado> {
  const prompt = `
    Você é um redator especialista em marketing digital local brasileiro.
    
    Escreva um artigo de blog profissional e otimizado para SEO sobre a empresa abaixo.
    
    DADOS DA EMPRESA:
    - Nome: ${empresa.nome}
    - Categoria: ${empresa.categoria?.nome || ''}
    - Cidade: ${empresa.cidade?.nome || ''} - ${empresa.cidade?.estado?.uf || ''}
    - Bairro: ${empresa.bairro?.nome || 'não informado'}
    - Descrição: ${empresa.descricao || 'não informada'}
    - Serviços/descrição otimizada: ${empresa.descricao_otimizada || empresa.descricao || ''}
    - Meios de pagamento: ${empresa.meios_pagamento?.join(', ') || 'não informado'}
    - Horário: ${empresa.horario_funcionamento ? 'disponível' : 'não informado'}
    - WhatsApp: ${empresa.whatsapp}
    
    INSTRUÇÕES:
    - Escreva em português brasileiro, tom profissional mas acessível
    - Inclua palavras-chave naturais: "${empresa.nome}", "${empresa.categoria?.nome} em ${empresa.cidade?.nome}"
    - Estrutura: introdução (2 parágrafos), 3 seções com subtítulos H2, conclusão com CTA
    - CTA final: incentivar contato via WhatsApp
    - Tamanho: 600-900 palavras
    - Use dados reais fornecidos, não invente informações
    
    RETORNE APENAS JSON (sem markdown, sem explicações):
    {
      "titulo": "título atraente com keyword",
      "slug": "slug-url-amigavel",
      "resumo": "resumo de 150 caracteres",
      "conteudo_html": "<article>...</article>",
      "tags": ["tag1", "tag2", "tag3"],
      "seo_titulo": "título SEO com até 60 chars",
      "seo_descricao": "meta description até 155 chars"
    }
  `
  
  const resposta = await chamarGemini(prompt, { maxTokens: 3000 })
  const jsonLimpo = resposta.replace(/```json|```/g, '').trim()
  return JSON.parse(jsonLimpo)
}
