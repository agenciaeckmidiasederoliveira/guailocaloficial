import { useEffect, useState } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Store, Plus, Search, CheckCircle, MapPin, Edit, Eye, Star, Sparkles, Upload } from 'lucide-react'

export default function ParceiroEmpresas() {
  const { parceiro } = useOutletContext<any>()
  const [empresas, setEmpresas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroPlano, setFiltroPlano] = useState('')

  const [showDestaqueModal, setShowDestaqueModal] = useState(false)
  const [empresaDestaque, setEmpresaDestaque] = useState<any>(null)
  const [destaqueForm, setDestaqueForm] = useState({
    tipo: 'carrossel',
    cidade: '',
    uf: '',
    data_inicio: '',
    data_fim: '',
    valor_mensal: '0',
  })

  const [showImportModal, setShowImportModal] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    if (!parceiro?.id) return
    supabase
      .from('empresas')
      .select(`id,nome,slug,plano,ativo,verificada,score_completude,whatsapp,
        categorias(nome),cidades(nome,estados(uf)),bairros(nome)`)
      .eq('parceiro_id', parceiro.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setEmpresas(data || []); setLoading(false) })
  }, [parceiro?.id])

  const filtradas = empresas.filter(e => {
    const buscaOk = !busca || e.nome.toLowerCase().includes(busca.toLowerCase())
    const planoOk = !filtroPlano || e.plano === filtroPlano
    return buscaOk && planoOk
  })

  const premiums = empresas.filter(e => e.plano === 'premium').length
  const gratis = empresas.filter(e => e.plano !== 'premium').length

  const openDestaqueModal = (emp: any) => {
    setEmpresaDestaque(emp)
    setDestaqueForm({
      tipo: 'carrossel',
      cidade: emp.cidades?.nome || '',
      uf: emp.cidades?.estados?.uf || '',
      data_inicio: new Date().toISOString().slice(0, 10),
      data_fim: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      valor_mensal: '0',
    })
    setShowDestaqueModal(true)
  }

  const salvarDestaque = async () => {
    if (!empresaDestaque?.id || !destaqueForm.cidade || !destaqueForm.uf || !destaqueForm.data_inicio || !destaqueForm.data_fim) {
      alert('Preencha cidade, UF e período do destaque.')
      return
    }

    const { error } = await supabase.from('empresa_destaques').insert({
      empresa_id: empresaDestaque.id,
      cidade: destaqueForm.cidade,
      uf: destaqueForm.uf,
      tipo: destaqueForm.tipo,
      valor_mensal: Number(destaqueForm.valor_mensal || 0),
      ativo: true,
      data_inicio: destaqueForm.data_inicio,
      data_fim: destaqueForm.data_fim,
    })

    if (error) {
      alert(`Erro ao salvar destaque: ${error.message}`)
      return
    }

    alert('Empresa colocada em destaque!')
    setShowDestaqueModal(false)
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minhas Empresas</h1>
          <p className="text-gray-500 text-sm mt-1">{empresas.length} empresa{empresas.length !== 1 ? 's' : ''} cadastrada{empresas.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm">
            <Upload className="w-4 h-4" /> Importar CSV
          </button>
          <Link to="/parceiro/empresas/nova"
            className="inline-flex items-center gap-2 bg-[#1a365d] hover:bg-[#153054] text-white px-5 py-2.5 rounded-xl font-semibold transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Nova Empresa
          </Link>
        </div>
      </div>

      {/* CARDS DE RESUMO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total', value: empresas.length, color: 'bg-blue-50 text-blue-700' },
          { label: 'Premium (ilimitado)', value: premiums, color: 'bg-amber-50 text-amber-700' },
          { label: 'Grátis', value: gratis, color: 'bg-green-50 text-green-700' },
          { label: 'Verificadas', value: empresas.filter(e => e.verificada).length, color: 'bg-emerald-50 text-emerald-700' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl p-4 ${c.color}`}>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-sm font-medium opacity-80">{c.label}</p>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input type="text" placeholder="Buscar por nome..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={busca} onChange={e => setBusca(e.target.value)} />
        </div>
        <select value={filtroPlano} onChange={e => setFiltroPlano(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">Todos os planos</option>
          <option value="premium">Premium</option>
          <option value="gratis">Grátis</option>
        </select>
      </div>

      {/* LISTA */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-200 rounded-xl" />
              <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-1/3 mb-2" /><div className="h-3 bg-gray-100 rounded w-1/2" /></div>
            </div>
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Nenhuma empresa encontrada</p>
          <Link to="/parceiro/empresas/nova" className="mt-3 inline-flex items-center gap-1 text-emerald-600 hover:underline text-sm">
            <Plus className="w-4 h-4" /> Cadastrar primeira empresa
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map(emp => (
            <div key={emp.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#1a365d] to-[#0d9488] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                {emp.nome?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">{emp.nome}</h3>
                  {emp.verificada && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${emp.plano === 'premium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                    {emp.plano === 'premium' ? 'Premium' : 'Grátis'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {emp.categorias?.nome && <span>{emp.categorias.nome}</span>}
                  {emp.cidades?.nome && (
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{emp.cidades.nome}</span>
                  )}
                  <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" /> Score: {emp.score_completude || 0}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => openDestaqueModal(emp)}
                  className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors" title="Colocar em Destaque">
                  <Sparkles className="w-4 h-4" />
                </button>
                <Link to={`/empresa/${emp.slug}`} target="_blank"
                  className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver no site">
                  <Eye className="w-4 h-4" />
                </Link>
                <Link to={`/parceiro/empresas/${emp.id}`}
                  className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                  <Edit className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DESTAQUE */}
      {showDestaqueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowDestaqueModal(false)} />
          <div className="relative z-10 w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900">Colocar em Destaque</h3>
            <p className="mt-1 text-sm text-gray-500">{empresaDestaque?.nome}</p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <select className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm" value={destaqueForm.tipo} onChange={e => setDestaqueForm(prev => ({ ...prev, tipo: e.target.value }))}>
                <option value="carrossel">Carrossel (Página Cidade)</option>
                <option value="banner_topo">Banner (Topo)</option>
              </select>
              <input className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm" placeholder="Cidade" value={destaqueForm.cidade} onChange={e => setDestaqueForm(prev => ({ ...prev, cidade: e.target.value }))} />
              <input className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm" placeholder="UF" value={destaqueForm.uf} onChange={e => setDestaqueForm(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))} />
              <input className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm" placeholder="Valor mensal" value={destaqueForm.valor_mensal} onChange={e => setDestaqueForm(prev => ({ ...prev, valor_mensal: e.target.value }))} />
              <input type="date" className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm" value={destaqueForm.data_inicio} onChange={e => setDestaqueForm(prev => ({ ...prev, data_inicio: e.target.value }))} />
              <input type="date" className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm" value={destaqueForm.data_fim} onChange={e => setDestaqueForm(prev => ({ ...prev, data_fim: e.target.value }))} />
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowDestaqueModal(false)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600">
                Cancelar
              </button>
              <button onClick={salvarDestaque} className="flex-1 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white">
                Salvar destaque
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IMPORTAÇÃO */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowImportModal(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900">Importação em Massa</h3>
            <p className="mt-1 text-sm text-gray-500">Envie um arquivo CSV para importar empresas. As colunas esperadas são: Nome, WhatsApp, Cidade, UF.</p>
            
            <div className="mt-5 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <input type="file" accept=".csv" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setShowImportModal(false)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600">
                Cancelar
              </button>
              <button onClick={() => alert("Em breve: Importação automática com inteligência de cidade.")} className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white">
                Importar CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
