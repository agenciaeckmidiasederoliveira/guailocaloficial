import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { Check, Info, Sparkles } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { gerarSeoEmpresaIA } from '../../lib/ai'
import ImportarDoGoogle from '../../components/parceiro/ImportarDoGoogle'

type FaqItem = {
  pergunta: string
  resposta: string
}

export default function NovaEmpresa() {
  const { parceiro } = useOutletContext<any>()
  const navigate = useNavigate()
  const { id } = useParams()

  const [passo, setPasso] = useState(1)
  const [cidades, setCidades] = useState<any[]>([])
  const [bairros, setBairros] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [loadingBairros, setLoadingBairros] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [gerandoIA, setGerandoIA] = useState(false)

  const [form, setForm] = useState<any>({
    plano: 'gratis',
    nome: '',
    cidade_id: '',
    bairro_id: '',
    categoria_id: '',
    whatsapp: '',
    descricao: '',
    descricao_otimizada: '',
    cnpj: '',
    endereco: '',
    cep: '',
    telefone: '',
    email_contato: '',
    site: '',
    seo_titulo: '',
    seo_descricao: '',
    faqs: [] as FaqItem[],
    meios_pagamento: [],
    redes_sociais: { instagram: '', facebook: '', linkedin: '' },
  })

  useEffect(() => {
    if (parceiro) {
      void carregarDadosBasicos()
    }
  }, [parceiro, id])

  async function carregarDadosBasicos() {
    const { data: mc } = await supabase
      .from('parceiro_cidades')
      .select('cidades(id, nome)')
      .eq('parceiro_id', parceiro.id)

    if (mc) setCidades(mc.map((m) => m.cidades))

    const { data: cats } = await supabase.from('categorias').select('id, nome').order('nome')
    if (cats) setCategorias(cats)

    if (!id) return

    const { data: empresa } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', id)
      .eq('parceiro_id', parceiro.id)
      .maybeSingle()

    if (!empresa) return

    setForm({
      plano: empresa.plano || 'gratis',
      nome: empresa.nome || '',
      cidade_id: empresa.cidade_id || '',
      bairro_id: empresa.bairro_id || '',
      categoria_id: empresa.categoria_id || '',
      whatsapp: empresa.whatsapp || '',
      descricao: empresa.descricao || '',
      descricao_otimizada: empresa.descricao_otimizada || '',
      cnpj: empresa.cnpj || '',
      endereco: empresa.endereco || '',
      cep: empresa.cep || '',
      telefone: empresa.telefone || '',
      email_contato: empresa.email_contato || '',
      site: empresa.site || '',
      seo_titulo: empresa.seo_titulo || '',
      seo_descricao: empresa.seo_descricao || '',
      faqs: empresa.faqs?.faqs || empresa.faqs || [],
      meios_pagamento: empresa.meios_pagamento || [],
      redes_sociais: empresa.redes_sociais || { instagram: '', facebook: '', linkedin: '' },
    })

    if (empresa.cidade_id) {
      const { data: bairrosData } = await supabase
        .from('bairros')
        .select('id, nome')
        .eq('cidade_id', empresa.cidade_id)
        .order('nome')
      setBairros(bairrosData || [])
    }
  }

  async function handleCidadeChange(cidadeId: string) {
    setForm({ ...form, cidade_id: cidadeId, bairro_id: '' })
    setLoadingBairros(true)

    const { data } = await supabase.from('bairros').select('id, nome').eq('cidade_id', cidadeId).order('nome')
    setBairros(data || [])
    setLoadingBairros(false)
  }

  function handleImportarGoogle(dados: any) {
    setForm((prev: any) => ({
      ...prev,
      nome: dados.nome || prev.nome,
      endereco: dados.endereco || prev.endereco,
      cep: dados.cep || prev.cep,
      telefone: dados.telefone || prev.telefone,
      site: dados.site || prev.site,
      seo_titulo:
        prev.seo_titulo || (dados.nome ? `${dados.nome} em ${cidades.find((c) => c.id === prev.cidade_id)?.nome}` : ''),
    }))
  }

  async function handleGerarIA() {
    if (!form.nome || !form.categoria_id || !form.cidade_id) {
      alert('Preencha nome, cidade e categoria antes de usar a IA.')
      return
    }

    const categoria = categorias.find((c) => c.id === form.categoria_id)?.nome || 'empresa local'
    const cidade = cidades.find((c) => c.id === form.cidade_id)?.nome || 'sua cidade'

    try {
      setGerandoIA(true)
      const resultado = await gerarSeoEmpresaIA({
        nome: form.nome,
        categoria,
        cidade,
        descricao: form.descricao,
      })

      setForm((prev: any) => ({
        ...prev,
        descricao_otimizada: resultado.descricao_otimizada,
        seo_titulo: resultado.seo_titulo,
        seo_descricao: resultado.seo_descricao,
        faqs: resultado.faqs,
      }))
    } catch (err: any) {
      alert(`Erro ao gerar conteúdo com IA: ${err.message}`)
    } finally {
      setGerandoIA(false)
    }
  }

  async function handleSalvar() {
    setSalvando(true)

    try {
      const payload = {
        parceiro_id: parceiro.id,
        plano: form.plano,
        nome: form.nome,
        cidade_id: form.cidade_id,
        bairro_id: form.bairro_id || null,
        categoria_id: form.categoria_id,
        whatsapp: form.whatsapp,
        descricao: form.plano === 'premium' ? form.descricao : null,
        descricao_otimizada: form.plano === 'premium' ? form.descricao_otimizada : null,
        cnpj: form.cnpj,
        endereco: form.endereco,
        cep: form.cep,
        telefone: form.telefone,
        email_contato: form.email_contato,
        site: form.site,
        seo_titulo: form.seo_titulo,
        seo_descricao: form.seo_descricao,
        faqs: form.plano === 'premium' ? { faqs: form.faqs } : null,
        ativa: true,
        slug: form.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000),
      }

      const operation = id
        ? supabase.from('empresas').update(payload).eq('id', id).eq('parceiro_id', parceiro.id).select().single()
        : supabase.from('empresas').insert(payload).select().single()

      const { data, error } = await operation
      if (error) throw error

      void supabase.functions.invoke('calcular-score', { body: { empresa_id: data.id } })

      alert(id ? 'Empresa atualizada com sucesso!' : 'Empresa cadastrada com sucesso!')
      navigate('/parceiro/empresas')
    } catch (err: any) {
      alert(`Erro: ${err.message}`)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{id ? 'Editar Empresa' : 'Nova Empresa'}</h1>
        <div className="text-sm text-gray-500">Passo {passo} de {form.plano === 'premium' ? 3 : 2}</div>
      </div>

      <div className="flex rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
        <div className={`flex-1 rounded-lg py-2 text-center text-sm font-bold ${passo >= 1 ? 'bg-blue-50 text-blue-700' : 'text-gray-400'}`}>
          1. Basico
        </div>
        {form.plano === 'premium' && (
          <div className={`flex-1 rounded-lg py-2 text-center text-sm font-bold ${passo >= 2 ? 'bg-blue-50 text-blue-700' : 'text-gray-400'}`}>
            2. Completo
          </div>
        )}
        <div className={`flex-1 rounded-lg py-2 text-center text-sm font-bold ${passo >= 3 ? 'bg-blue-50 text-blue-700' : 'text-gray-400'}`}>
          3. Final
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm md:p-8">
        {passo === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-center space-x-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <span className={`font-bold ${form.plano === 'gratis' ? 'text-gray-900' : 'text-gray-400'}`}>Plano Gratis</span>
              <button
                onClick={() => setForm({ ...form, plano: form.plano === 'gratis' ? 'premium' : 'gratis' })}
                className={`relative h-7 w-14 rounded-full transition-colors ${form.plano === 'premium' ? 'bg-emerald-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${form.plano === 'premium' ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
              <span className={`flex items-center font-bold ${form.plano === 'premium' ? 'text-emerald-600' : 'text-gray-400'}`}>
                <Sparkles className="mr-1 h-4 w-4" /> Premium
              </span>
            </div>

            {form.cidade_id ? (
              <ImportarDoGoogle
                cidadeNome={cidades.find((c) => c.id === form.cidade_id)?.nome || ''}
                estadoUf={cidades.find((c) => c.id === form.cidade_id)?.estados?.uf || ''}
                onImport={handleImportarGoogle}
              />
            ) : (
              <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                Selecione uma cidade abaixo primeiro para poder buscar e importar dados do Google.
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Nome da Empresa *</label>
                <input type="text" className="w-full rounded-lg border border-gray-300 px-4 py-2" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Categoria *</label>
                <select className="w-full rounded-lg border border-gray-300 px-4 py-2" value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })}>
                  <option value="">Selecione...</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Cidade *</label>
                <select className="w-full rounded-lg border border-gray-300 px-4 py-2" value={form.cidade_id} onChange={(e) => void handleCidadeChange(e.target.value)}>
                  <option value="">Selecione (Cidades marcadas)...</option>
                  {cidades.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Bairro {loadingBairros && '(carregando...)'}</label>
                <select className="w-full rounded-lg border border-gray-300 px-4 py-2" value={form.bairro_id} onChange={(e) => setForm({ ...form, bairro_id: e.target.value })}>
                  <option value="">Selecione...</option>
                  {bairros.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">WhatsApp *</label>
                <input type="text" placeholder="Ex: 5511999999999" className="w-full rounded-lg border border-gray-300 px-4 py-2" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-4">
              <button onClick={() => setPasso(form.plano === 'premium' ? 2 : 3)} disabled={!form.nome || !form.cidade_id || !form.categoria_id} className="rounded-lg bg-emerald-600 px-6 py-2 font-bold text-white disabled:opacity-50">
                Continuar
              </button>
            </div>
          </div>
        )}

        {passo === 2 && form.plano === 'premium' && (
          <div className="space-y-6">
            <div className="flex items-start rounded-lg bg-blue-50 p-4">
              <Info className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
              <p className="text-sm text-blue-900">Preencha o maximo de informacoes para obter um score de completude alto. Empresas com maior score aparecem primeiro nas buscas.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">Descricao</label>
                <textarea rows={4} className="w-full rounded-lg border border-gray-300 px-4 py-2" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Endereco Completo</label>
                <input type="text" className="w-full rounded-lg border border-gray-300 px-4 py-2" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">E-mail</label>
                <input type="email" className="w-full rounded-lg border border-gray-300 px-4 py-2" value={form.email_contato} onChange={(e) => setForm({ ...form, email_contato: e.target.value })} />
              </div>
            </div>

            <div className="flex justify-between border-t border-gray-100 pt-4">
              <button onClick={() => setPasso(1)} className="rounded-lg bg-gray-100 px-6 py-2 font-bold text-gray-700">
                Voltar
              </button>
              <button onClick={() => setPasso(3)} className="rounded-lg bg-emerald-600 px-6 py-2 font-bold text-white">
                Continuar
              </button>
            </div>
          </div>
        )}

        {passo === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold">Revisao e SEO</h3>

            {form.plano === 'premium' && (
              <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-6">
                <button onClick={handleGerarIA} disabled={gerandoIA} className="flex w-full items-center justify-center rounded-lg bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700 disabled:opacity-60">
                  <Sparkles className="mr-2 h-5 w-5" /> {gerandoIA ? 'Gerando com IA...' : 'Gerar descricao com IA'}
                </button>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Descricao Otimizada (IA)</label>
                  <textarea rows={4} className="w-full rounded-lg border border-gray-300 px-4 py-2" value={form.descricao_otimizada} onChange={(e) => setForm({ ...form, descricao_otimizada: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">SEO Title</label>
                    <input type="text" className="w-full rounded-lg border border-gray-300 px-4 py-2" value={form.seo_titulo} onChange={(e) => setForm({ ...form, seo_titulo: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">SEO Description</label>
                    <input type="text" className="w-full rounded-lg border border-gray-300 px-4 py-2" value={form.seo_descricao} onChange={(e) => setForm({ ...form, seo_descricao: e.target.value })} />
                  </div>
                </div>

                {form.faqs?.length > 0 && (
                  <div className="space-y-3">
                    <label className="mb-1 block text-sm font-medium text-gray-700">FAQ Gerado pela IA</label>
                    {form.faqs.map((faq: FaqItem, index: number) => (
                      <div key={index} className="rounded-lg border border-gray-200 bg-white p-4">
                        <p className="text-sm font-semibold text-gray-900">{faq.pergunta}</p>
                        <p className="mt-1 text-sm text-gray-600">{faq.resposta}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              Por favor, revise as informacoes. Apos salvar, a empresa estara publica na plataforma.
            </div>

            <div className="flex justify-between border-t border-gray-100 pt-4">
              <button onClick={() => setPasso(form.plano === 'premium' ? 2 : 1)} className="rounded-lg bg-gray-100 px-6 py-2 font-bold text-gray-700">
                Voltar
              </button>
              <button onClick={handleSalvar} disabled={salvando} className="flex items-center rounded-lg bg-green-600 px-8 py-2 font-bold text-white">
                {salvando ? 'Salvando...' : <><Check className="mr-2 h-5 w-5" /> Concluir e Salvar</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
