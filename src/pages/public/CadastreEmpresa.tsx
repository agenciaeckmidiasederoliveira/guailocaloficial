import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Star, Store, MapPin, MousePointerClick, ShieldCheck, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function CadastreEmpresa() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nome: '', categoria_id: '', estado_id: '', cidade_id: '', bairro_id: '', whatsapp: '', plano: 'gratis'
  })
  const [estados, setEstados] = useState<any[]>([])
  const [cidades, setCidades] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [bairros, setBairros] = useState<any[]>([])
  const [loadingBairros, setLoadingBairros] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [parceiroLocal, setParceiroLocal] = useState<any>(null)

  useEffect(() => {
    async function carregarListas() {
      const { data: ests } = await supabase.from('estados').select('id, nome, uf').order('nome')
      setEstados(ests || [])
    }
    carregarListas()
  }, [])

  const handleEstadoChange = async (estado_id: string) => {
    setForm({ ...form, estado_id, cidade_id: '', bairro_id: '' })
    setCidades([])
    if (estado_id) {
      const { data: cids } = await supabase.from('cidades').select('id, nome').eq('estado_id', estado_id).order('nome')
      setCidades(cids || [])
    }
  }
  
  useEffect(() => {
    async function loadCats() {
      const { data } = await supabase.from('categorias').select('id, nome').order('nome')
      if(data) setCategorias(data)
    }
    loadCats()
  }, [])

  const handleCidadeChange = async (cidade_id: string) => {
    setForm({ ...form, cidade_id, bairro_id: '' })
    setLoadingBairros(true)
    setParceiroLocal(null)

    // Buscar bairros
    const { data: b } = await supabase.from('bairros').select('id, nome').eq('cidade_id', cidade_id).order('nome')
    setBairros(b || [])
    setLoadingBairros(false)

    // Buscar parceiro dono da cidade
    const { data: pc } = await supabase.from('parceiro_cidades').select('parceiros(id, nome_comercial, whatsapp_contato)').eq('cidade_id', cidade_id).maybeSingle()
    if (pc && pc.parceiros) {
      setParceiroLocal(pc.parceiros)
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Tentar encontrar se a cidade tem parceiro para atribuir o lead/empresa
      const { data: pc } = await supabase.from('parceiro_cidades').select('parceiro_id').eq('cidade_id', form.cidade_id).single()

      // Gera slug fake pro cadastro rapido
      const slugFake = form.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random()*1000)

      await supabase.from('empresas').insert({
         nome: form.nome,
         categoria_id: form.categoria_id,
         cidade_id: form.cidade_id,
         whatsapp: form.whatsapp,
         plano: 'gratis',
         ativa: true,
         parceiro_id: pc?.parceiro_id || null, // Se null, é o admin quem gerencia
         slug: slugFake
      })

      setSucesso(true)
    } catch(err) {
      alert("Erro ao processar.")
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg border border-gray-100">
           <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
             <Check className="w-8 h-8" />
           </div>
           <h2 className="text-2xl font-bold text-gray-900 mb-2">Empresa Cadastrada!</h2>
           <p className="text-gray-600 mb-8">Sua empresa grátis foi ativada. Quer conhecer o plano completo e ser o número 1 na sua região?</p>
           
           <button onClick={() => alert("Chama zap do parceiro local")} className="w-full bg-emerald-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl mb-3 shadow-md">
             Falar com Especialista
           </button>
           <button onClick={() => navigate('/')} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl">
             Voltar ao início
           </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* HERO */}
      <section className="bg-gradient-to-br from-[#1a365d] to-[#10b981] py-16 md:py-24 px-4 text-center text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10 pattern-dots" />
        <div className="container mx-auto relative z-10 max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 text-white tracking-tight">
            Cadastre sua empresa no Guia Local BR
          </h1>
          <p className="text-lg md:text-xl text-blue-100 mb-0">
            Conecte-se com clientes da sua cidade agora mesmo. É fácil, rápido e <span className="font-bold underline text-white">totalmente gratuito</span>.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-50 px-4">
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row gap-12">
          
          {/* FORMS LADO ESQUERDO */}
          <div className="flex-1 bg-white rounded-2xl shadow-xl p-8 border border-gray-100 relative -mt-24 z-20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Comece agora mesmo</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da sua Empresa *</label>
                <input type="text" required className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition" value={form.nome} onChange={e=>setForm({...form, nome: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp de Contato *</label>
                <input type="text" required placeholder="(XX) 99999-9999" className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none transition" value={form.whatsapp} onChange={e=>setForm({...form, whatsapp: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                  <select required className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 outline-none" value={form.categoria_id} onChange={e=>setForm({...form, categoria_id: e.target.value})}>
                    <option value="">Selecione...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                  <select required className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 outline-none" value={form.estado_id} onChange={e=>handleEstadoChange(e.target.value)}>
                    <option value="">Selecione...</option>
                    {estados.map(e => <option key={e.id} value={e.id}>{e.nome} ({e.uf})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                  <select required disabled={!form.estado_id} className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-gray-50 outline-none disabled:opacity-50" value={form.cidade_id} onChange={e=>handleCidadeChange(e.target.value)}>
                    <option value="">Selecione...</option>
                    {cidades.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
              </div>

              {form.plano === 'premium' && parceiroLocal?.whatsapp_contato ? (
                <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                  <h3 className="text-xl font-bold text-green-800 mb-2">Ótima escolha!</h3>
                  <p className="text-green-700 mb-6">
                    A sua cidade é atendida pelo consultor exclusivo <strong>{parceiroLocal.nome_comercial}</strong>. 
                    Para ativar o plano Premium e destravar todos os recursos, chame-o no WhatsApp agora mesmo.
                  </p>
                  <a 
                    href={`https://wa.me/${parceiroLocal.whatsapp_contato.replace(/\D/g, '')}?text=Ol%C3%A1!%20Gostaria%20de%20cadastrar%20minha%20empresa%20${form.nome}%20no%20plano%20Premium.`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                  >
                    Falar com Consultor no WhatsApp
                  </a>
                </div>
              ) : (
                <button disabled={loading} type="submit" className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 mt-8 flex items-center justify-center">
                  {loading ? 'Processando...' : 'Cadastrar Gratuitamente'} <ArrowRight className="w-5 h-5 ml-2" />
                </button>
              )}
            </form>
          </div>

          {/* BENEFICIOS LADO DIREITO */}
          <div className="flex-1 md:pt-10">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Quer mais visibilidade?</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Descubra os benefícios exclusivos do plano <span className="font-bold text-emerald-600">Premium</span> e impulsione suas vendas de forma extraordinária na sua região.
            </p>

            <ul className="space-y-4 mb-10">
              <li className="flex items-start"><Star className="w-6 h-6 text-yellow-500 mr-3 flex-shrink-0" /><span className="text-gray-700 font-medium">Destaque absoluto no topo das buscas da sua cidade</span></li>
              <li className="flex items-start"><Store className="w-6 h-6 text-emerald-500 mr-3 flex-shrink-0" /><span className="text-gray-700 font-medium">Mini-site profissional completo com galeria de fotos e horários</span></li>
              <li className="flex items-start"><MapPin className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" /><span className="text-gray-700 font-medium">Exibição nos banners rotativos para milhares de visitantes</span></li>
              <li className="flex items-start"><ShieldCheck className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" /><span className="text-gray-700 font-medium">Selo de empresa Verificada e artigos no nosso Blog</span></li>
            </ul>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center shadow-inner">
               <p className="font-bold text-blue-900 mb-4">Interessado no Plano Premium?</p>
               <button onClick={() => alert("Inicia conversa whatsapp de leads")} className="w-full bg-white border border-blue-300 text-emerald-600 hover:bg-blue-100 font-bold py-3 rounded-lg flex items-center justify-center transition-colors">
                 <MousePointerClick className="w-5 h-5 mr-2" /> Falar com Especialista
               </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
