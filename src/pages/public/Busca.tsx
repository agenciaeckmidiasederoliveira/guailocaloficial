import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { realizarBusca } from '../../lib/analytics'
import { getTenantFromURL } from '../../lib/tenant'
import { Search, MapPin, CheckCircle, MessageCircle, SlidersHorizontal, Grid, List, X, Zap, ShieldCheck } from 'lucide-react'

const CATEGORIAS_FIXAS = [
  'Restaurantes','Beleza & Estética','Saúde','Educação','Lojas & Comércio',
  'Serviços','Tecnologia','Automóveis','Pets','Imobiliárias','Turismo','Outros'
]

export default function Busca() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [empresas, setEmpresas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [estados, setEstados] = useState<any[]>([])
  const [cidades, setCidades] = useState<any[]>([])
  const [tenant, setTenant] = useState<any>(null)

  const q = searchParams.get('q') || ''
  const categoria = searchParams.get('categoria') || ''
  const estadoId = searchParams.get('estado') || ''
  const cidadeId = searchParams.get('cidade') || ''
  const ordenar = searchParams.get('ordenar') || 'score'
  const page = parseInt(searchParams.get('page') || '1')
  const PER_PAGE = 24

  useEffect(() => {
    void getTenantFromURL().then(setTenant)
    supabase.from('estados').select('*').order('nome').then(({ data }) => setEstados(data || []))
  }, [])

  useEffect(() => {
    if (estadoId) {
      supabase.from('cidades').select('*').eq('estado_id', estadoId).order('nome').then(({ data }) => setCidades(data || []))
    } else setCidades([])
  }, [estadoId])

  const buscar = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('empresas')
        .select(`id,nome,slug,descricao,whatsapp,foto_principal,verificada,plano,
          categorias(nome),cidades(nome,estados(uf)),bairros(nome)`, { count: 'exact' })
        .eq('ativo', true)

      if (tenant?.id) query = query.eq('tenant_id', tenant.id)

      if (q) query = query.ilike('nome', `%${q}%`)
      if (categoria) query = query.eq('categoria_id_fixa', categoria) // fallback search
      if (cidadeId) query = query.eq('cidade_id', cidadeId)
      
      if (ordenar === 'score') query = query.order('score_completude', { ascending: false })
      else if (ordenar === 'nome') query = query.order('nome')
      
      query = query.range((page - 1) * PER_PAGE, page * PER_PAGE - 1)
      const { data, count } = await query
      
      // Simulação sort Premium primeiro
      const sorted = (data || []).sort((a, b) => {
         if (a.plano === 'premium' && b.plano !== 'premium') return -1;
         if (b.plano === 'premium' && a.plano !== 'premium') return 1;
         return 0;
      })

      setEmpresas(sorted)
      setTotal(count || 0)
    } finally { setLoading(false) }
  }, [q, categoria, cidadeId, estadoId, ordenar, page, tenant?.id])

  useEffect(() => { buscar() }, [buscar])

  useEffect(() => {
    if (!q.trim()) return

    const cidadeNome = cidades.find((cidade) => cidade.id === cidadeId)?.nome || undefined
    void realizarBusca(q.trim(), cidadeNome)
  }, [q, cidadeId, cidades])

  const updateParam = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString())
    if (value) p.set(key, value); else p.delete(key)
    p.delete('page'); setSearchParams(p)
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0A1628] font-sans overflow-x-hidden pb-20">
      
      {/* HEADER */}
      <header className="border-b border-[#EEF3F8] bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1A6B4A] to-[#0D4DB5] flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 text-white fill-white" />
            </div>
            <span className="text-lg font-black text-[#0A1628]">
              Guia Local <span className="text-[#1A9B6A]">BR</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-1.5 text-xs text-[#5A6A7E] font-bold">
            <ShieldCheck className="w-4.5 h-4.5 text-[#1A9B6A]" /> Plataforma Oficial
          </div>
        </div>
      </header>

      {/* HERO BUSCA */}
      <div className="bg-white border-b border-[#EEF3F8] py-8 px-4 relative overflow-hidden">
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6A7E] w-5 h-5" />
              <input 
                type="text" 
                placeholder="Buscar empresa, categoria, cidade..."
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border border-[#EEF3F8] focus:border-[#1A9B6A] text-[#0A1628] placeholder-[#9AAAB8] text-base shadow-sm focus:outline-none transition-all focus:ring-1 focus:ring-[#1A9B6A]/30 font-medium"
                value={q} 
                onChange={e => updateParam('q', e.target.value)} 
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-white border border-[#EEF3F8] hover:border-[#1A9B6A] text-[#5A6A7E] hover:text-[#1A9B6A] px-5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <SlidersHorizontal className="w-4.5 h-4.5" />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">Filtros</span>
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 bg-white border border-[#EEF3F8] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-sm">
              <div>
                <label className="block text-[10px] font-bold text-[#5A6A7E] uppercase tracking-wider mb-2">Estado</label>
                <select 
                  className="w-full bg-white border border-[#EEF3F8] rounded-xl px-3.5 py-2.5 text-xs text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-medium"
                  value={estadoId} 
                  onChange={e => { updateParam('estado', e.target.value); updateParam('cidade','') }}
                >
                  <option value="">Todos os estados</option>
                  {estados.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#5A6A7E] uppercase tracking-wider mb-2">Cidade</label>
                <select 
                  className="w-full bg-white border border-[#EEF3F8] rounded-xl px-3.5 py-2.5 text-xs text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-medium"
                  value={cidadeId} 
                  onChange={e => updateParam('cidade', e.target.value)} 
                  disabled={!estadoId}
                >
                  <option value="">Todas as cidades</option>
                  {cidades.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#5A6A7E] uppercase tracking-wider mb-2">Ordenar Por</label>
                <select 
                  className="w-full bg-white border border-[#EEF3F8] rounded-xl px-3.5 py-2.5 text-xs text-[#0A1628] focus:outline-none focus:border-[#1A9B6A] font-medium"
                  value={ordenar} 
                  onChange={e => updateParam('ordenar', e.target.value)}
                >
                  <option value="score">Recomendados (Score)</option>
                  <option value="nome">Nome A-Z</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PILLS CATEGORIA */}
      <div className="bg-white border-b border-[#EEF3F8] py-4 px-4 overflow-x-auto scrollbar-none sticky top-[72px] z-40">
        <div className="max-w-6xl mx-auto flex gap-2 flex-nowrap">
          <button 
            onClick={() => updateParam('categoria','')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${!categoria ? 'bg-[#1A9B6A] border-[#1A9B6A] text-white shadow-md':'bg-white border-[#EEF3F8] text-[#5A6A7E] hover:text-[#1A9B6A] hover:border-[#1A9B6A]'}`}
          >
            Todos Negócios
          </button>
          {CATEGORIAS_FIXAS.map(cat => (
            <button 
              key={cat} 
              onClick={() => updateParam('categoria', cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${categoria===cat?'bg-[#1A9B6A] border-[#1A9B6A] text-white shadow-md':'bg-white border-[#EEF3F8] text-[#5A6A7E] hover:text-[#1A9B6A] hover:border-[#1A9B6A]'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* CONTEÚDO */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8 border-b border-[#EEF3F8] pb-5">
          <div>
            <h1 className="text-lg md:text-xl font-black text-[#0A1628]">
              {loading ? 'Buscando negócios...' : `${total.toLocaleString('pt-BR')} empresa${total !== 1?'s':''} encontrada${total !== 1?'s':''}`}
            </h1>
            {q && <p className="text-xs text-[#5A6A7E] mt-1 font-medium">Resultados para a busca "{q}"</p>}
          </div>
          <div className="flex items-center bg-white border border-[#EEF3F8] p-0.5 rounded-lg shadow-sm">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-2 rounded-md transition-all ${viewMode==='grid'?'bg-[#1A9B6A] text-white':'text-[#5A6A7E] hover:bg-[#F8FAFC]'}`}
            >
              <Grid className="w-4 h-4"/>
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-2 rounded-md transition-all ${viewMode==='list'?'bg-[#1A9B6A] text-white':'text-[#5A6A7E] hover:bg-[#F8FAFC]'}`}
            >
              <List className="w-4 h-4"/>
            </button>
          </div>
        </div>

        {loading ? (
          <div className={`grid ${viewMode==='grid'?'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3':'grid-cols-1'} gap-6`}>
            {Array.from({length:6}).map((_,i) => (
              <div key={i} className="bg-white border border-[#EEF3F8] rounded-2xl p-5 animate-pulse h-48 flex flex-col justify-between shadow-sm">
                <div>
                  <div className="h-4 bg-slate-100 rounded w-3/4 mb-3"/>
                  <div className="h-3 bg-slate-50 rounded w-1/2"/>
                </div>
                <div className="h-8 bg-slate-100 rounded w-full"/>
              </div>
            ))}
          </div>
        ) : empresas.length === 0 ? (
          <div className="text-center py-24 bg-white border border-[#EEF3F8] rounded-3xl p-8 max-w-xl mx-auto shadow-sm">
            <Search className="w-10 h-10 text-[#9AAAB8] mx-auto mb-4"/>
            <h2 className="text-lg font-black text-[#0A1628]">Nenhuma empresa encontrada</h2>
            <p className="text-[#5A6A7E] mt-2 font-medium text-sm leading-relaxed">Não encontramos registros correspondentes à pesquisa. Tente buscar termos mais simples ou limpe todos os filtros.</p>
            <button 
              onClick={() => setSearchParams({})} 
              className="mt-6 inline-flex items-center gap-1.5 bg-white border border-[#EEF3F8] hover:border-[#1A9B6A] hover:text-[#1A9B6A] text-[#5A6A7E] font-bold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
            >
              <X className="w-4 h-4"/> Limpar Filtros
            </button>
          </div>
        ) : (
          <div className={`grid ${viewMode==='grid'?'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3':'grid-cols-1'} gap-6`}>
            {empresas.map(emp => {
              const isPremium = emp.plano === 'premium';
              return (
                <Link 
                  key={emp.id} 
                  to={`/empresa/${emp.slug}`}
                  className={`group bg-white rounded-2xl hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 border overflow-hidden flex flex-col ${
                    isPremium ? 'border-[#FDE68A] shadow-md' : 'border-[#EEF3F8]'
                  } ${viewMode==='list'?'flex-row items-center !h-auto':''}`}
                >
                  <div className={`${viewMode==='list'?'w-32 h-32 flex-shrink-0':'h-44 w-full'} bg-[#F8FAFC] relative overflow-hidden flex-shrink-0`}>
                    {emp.foto_principal ? (
                      <img src={emp.foto_principal} alt={emp.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[#9AAAB8] text-4xl font-black bg-[#F8FAFC]">
                        {emp.nome?.charAt(0)}
                      </div>
                    )}
                    {isPremium && (
                      <span className="absolute top-3 right-3 bg-[#FF9800] text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                        ★ Premium
                      </span>
                    )}
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-[16px] text-[#0A1628] group-hover:text-[#1A9B6A] transition-colors leading-snug">
                        {emp.nome}
                        {emp.verificada && <CheckCircle className="inline w-4 h-4 text-[#1A9B6A] fill-[#1A9B6A]/20 ml-1.5"/>}
                      </h3>
                      {emp.categorias?.nome && <span className="text-[11px] text-[#5A6A7E] font-bold mt-1 block uppercase tracking-wider">{emp.categorias.nome}</span>}
                      
                      {emp.cidades?.nome && (
                        <p className="text-xs text-[#5A6A7E] mt-3 flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-[#9AAAB8]" />
                          {emp.cidades.nome}{emp.cidades.estados?.uf && `, ${emp.cidades.estados.uf}`}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-5 pt-4 border-t border-[#EEF3F8] flex items-center justify-between">
                      {emp.whatsapp ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#15803D] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1 rounded-full">
                          <MessageCircle className="w-3 h-3"/> WhatsApp Ativo
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#9AAAB8] font-bold">Sem WhatsApp</span>
                      )}
                      <span className="text-xs font-bold text-[#1A9B6A] group-hover:underline">Ver perfil →</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
