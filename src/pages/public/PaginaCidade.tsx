import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { verCidade, clicarWhatsapp, verEmpresa } from '../../lib/analytics'
import { getTenantFromURL } from '../../lib/tenant'
import CarrosselDestaque from '../../components/public/CarrosselDestaque'
import BannerCidade from '../../components/public/BannerCidade'
import { Star, MapPin, CheckCircle, MessageCircle, ChevronRight, List, Map as MapIcon, Zap, ArrowLeft, ShieldCheck } from 'lucide-react'
import MapaEmpresas from '../../components/MapaEmpresas'

export default function PaginaCidade() {
  const { estado, cidade: cidadeSlug } = useParams()
  const [cidade, setCidade] = useState<any>(null)
  const [empresas, setEmpresas] = useState<any[]>([])
  const [bairros, setBairros] = useState<any[]>([])
  const [parceiro, setParceiro] = useState<any>(null)
  const [tenant, setTenant] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'lista' | 'mapa'>('lista')

  useEffect(() => {
    if (cidadeSlug) {
      carregarDados()
    }
  }, [cidadeSlug])

  const carregarDados = async () => {
    try {
      // Busca Cidade
      const { data: cityData } = await supabase
        .from('cidades')
        .select('id, nome, latitude, longitude, estados(uf, nome)')
        .eq('slug', cidadeSlug)
        .single()
      
      if (cityData) {
        setCidade(cityData)
        void verCidade(cityData.id, cityData.nome)

        // Busca Empresas
        const tenant = await getTenantFromURL()
        setTenant(tenant)
        let companiesQuery = supabase
          .from('empresas')
          .select('*, categorias(nome)')
          .eq('cidade_id', cityData.id)
          .eq('ativa', true)
          .order('score_completude', { ascending: false })
          .limit(24)

        if (tenant?.id) {
          companiesQuery = companiesQuery.eq('tenant_id', tenant.id)
        }

        const { data: companies } = await companiesQuery
        
        // Simulação sort Premium primeiro
        const sorted = (companies || []).sort((a, b) => {
           if (a.plano === 'premium' && b.plano !== 'premium') return -1;
           if (b.plano === 'premium' && a.plano !== 'premium') return 1;
           return 0;
        })
        setEmpresas(sorted)

        // Busca Parceiro Responsável
        const { data: parcCidade } = await supabase
          .from('parceiro_cidades')
          .select('parceiros(id, whatsapp_vendas)')
          .eq('cidade_id', cityData.id)
          .single()
        
        if (parcCidade && parcCidade.parceiros) {
           setParceiro(parcCidade.parceiros)
        }

        // Busca Bairros
        const { data: bData } = await supabase.from('bairros').select('*').eq('cidade_id', cityData.id).limit(10)
        setBairros(bData || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleVerPerfil = (empId: string, empSlug: string) => {
     if (cidade) void verEmpresa(empId, cidade.nome)
  }

  const handleWhatsapp = (empId: string, phone: string) => {
     if (cidade) void clicarWhatsapp(empId, { cidade: cidade.nome, origem: 'pagina_cidade' })
     window.open(`https://wa.me/${phone}?text=Olá!`, '_blank')
  }

  const msgParceiro = cidade ? `Olá! Vi o Guia Local BR e tenho interesse em conhecer o plano premium para minha empresa em ${cidade.nome}. Pode me ajudar?` : ''

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-emerald-400"></div>
          <span className="text-sm font-medium text-slate-400">Buscando empresas locais...</span>
        </div>
      </div>
    )
  }

  if (!cidade) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Cidade não encontrada</h2>
          <p className="text-slate-400 mb-6 font-light">Verifique o endereço digitado ou retorne à página inicial.</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-all">
            <ArrowLeft className="w-4 h-4" /> Voltar para o Início
          </Link>
        </div>
      </div>
    )
  }

  const premiumCompanies = empresas.filter(e => e.plano === 'premium')

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 font-sans overflow-x-hidden pb-20">
      
      {/* GLOW DE FUNDO */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-64 left-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* HEADER PREMIUM */}
      <header className="border-b border-slate-800/60 bg-[#090d16]/85 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 text-white fill-white" />
            </div>
            <span className="text-lg font-black text-white">
              Guia Local <span className="text-emerald-400">BR</span>
            </span>
          </Link>
          <div className="text-xs md:text-sm text-slate-400 flex items-center bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-full shadow-inner">
            <MapPin className="w-4 h-4 mr-1 text-emerald-400" />
            <span className="font-semibold text-slate-200">{cidade.nome}</span>, {cidade.estados?.uf}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-10">
        
        {/* BANNER DA CIDADE */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800/60 pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                Guia Regional Oficial
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Melhores Empresas em <span className="bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">{cidade.nome} - {cidade.estados?.uf}</span>
            </h1>
            <p className="text-slate-400 mt-2 font-light text-sm md:text-base">
              Explore e faça contato direto com {empresas.length} comércios e prestadores de serviços recomendados.
            </p>
          </div>
          
          {/* Seletor Lista/Mapa */}
          <div className="bg-slate-900/90 border border-slate-800 p-1 rounded-xl flex self-start md:self-auto shadow-inner">
            <button 
              onClick={() => setViewMode('lista')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center transition-all ${viewMode === 'lista' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <List className="w-4 h-4 mr-1.5" /> Lista
            </button>
            <button 
              onClick={() => setViewMode('mapa')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center transition-all ${viewMode === 'mapa' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <MapIcon className="w-4 h-4 mr-1.5" /> Mapa
            </button>
          </div>
        </div>

        <div className="mb-8 space-y-6">
          <BannerCidade cidade={cidade.nome} uf={cidade.estados?.uf} tenantId={tenant?.id} />
          <CarrosselDestaque cidade={cidade.nome} uf={cidade.estados?.uf} tenantId={tenant?.id} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* CONTEÚDO PRINCIPAL (ESQUERDA) */}
          <div className="lg:col-span-3 space-y-8">
            
            {viewMode === 'mapa' ? (
              <div className="bg-slate-900/40 p-2.5 rounded-2xl shadow-2xl border border-slate-800/80 overflow-hidden">
                <MapaEmpresas 
                  empresas={empresas.map(e => ({
                    ...e, 
                    lat: e.latitude || cidade.latitude || 0, 
                    lng: e.longitude || cidade.longitude || 0 
                  }))} 
                  cidadeCenter={{ lat: cidade.latitude || -23.55, lng: cidade.longitude || -46.63 }} 
                  altura="550px" 
                />
              </div>
            ) : (
              <>
                {/* LISTAGEM EM GRADE DE VIDRO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {empresas.map((emp) => {
                    const isPremium = emp.plano === 'premium';
                    return (
                      <div 
                        key={emp.id} 
                        className={`group bg-slate-900/30 border rounded-2xl overflow-hidden hover:bg-slate-900/50 hover:shadow-2xl transition-all duration-300 flex flex-col ${
                          isPremium ? 'border-amber-500/20 shadow-lg shadow-amber-500/5 hover:border-amber-500/40' : 'border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        {/* Foto de Capa */}
                        <div className="h-40 bg-slate-950 w-full relative overflow-hidden">
                          {emp.foto_principal ? (
                            <img src={emp.foto_principal} alt={emp.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-800 text-6xl font-black bg-slate-900">
                              {emp.nome?.charAt(0)}
                            </div>
                          )}
                          
                          {isPremium ? (
                            <div className="absolute top-3 right-3 bg-amber-500/90 text-slate-950 text-[10px] font-black tracking-widest px-2.5 py-1 rounded-md shadow-lg">
                              PREMIUM
                            </div>
                          ) : (
                            <div className="absolute top-3 right-3 bg-slate-800/90 text-slate-300 text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-md shadow-lg">
                              GRATUITO
                            </div>
                          )}
                        </div>

                        <div className="p-5 flex-1 flex flex-col">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-extrabold text-base md:text-lg text-white leading-snug group-hover:text-emerald-400 transition-colors">
                              {emp.nome}
                              {emp.verificada && <CheckCircle className="w-4 h-4 inline ml-1.5 text-emerald-400 fill-emerald-400/20" />}
                            </h3>
                          </div>
                          
                          <span className="text-xs text-indigo-400 font-semibold mb-4 block">
                            {emp.categorias?.nome || 'Serviços'}
                          </span>
                          
                          {emp.descricao && (
                            <p className="text-slate-400 text-xs md:text-sm font-light line-clamp-2 mb-6 leading-relaxed">
                              {emp.descricao}
                            </p>
                          )}
                          
                          <div className="mt-auto pt-4 flex gap-3 border-t border-slate-800/50">
                            <Link 
                              to={`/empresa/${emp.slug}`} 
                              onClick={() => handleVerPerfil(emp.id, emp.slug)}
                              className="flex-1 text-center bg-slate-800 hover:bg-slate-700/80 border border-slate-700/50 text-slate-200 hover:text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
                            >
                              Ver Perfil
                            </Link>
                            {emp.whatsapp && (
                              <button 
                                onClick={() => handleWhatsapp(emp.id, emp.whatsapp)}
                                className="flex-1 flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 hover:shadow-emerald-500/20 hover:shadow-lg text-slate-950 font-extrabold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                              >
                                <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}

          </div>

          {/* SIDEBAR (DIREITA) */}
          <div className="space-y-6">
            
            {/* Divulgar */}
            <div className="bg-gradient-to-br from-indigo-900/80 to-indigo-950 border border-indigo-500/20 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[40px]" />
              <h3 className="font-extrabold text-lg mb-2">Quer Destacar Sua Empresa Aqui?</h3>
              <p className="text-indigo-200 text-xs md:text-sm font-light mb-6 leading-relaxed">
                Coloque seu negócio no topo das buscas regionais, ganhe selo de verificado e receba contatos diretos de clientes da sua cidade.
              </p>
              
              <div className="space-y-3 relative z-10">
                <Link to="/cadastre-sua-empresa" className="block text-center w-full bg-white hover:bg-slate-100 text-indigo-950 font-black py-3 rounded-xl transition text-xs shadow-lg">
                  Cadastro Rápido Grátis
                </Link>
                {parceiro?.whatsapp_vendas && (
                  <a 
                    href={`https://wa.me/${parceiro.whatsapp_vendas}?text=${encodeURIComponent(msgParceiro)}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="block text-center w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition text-xs border border-indigo-500 shadow-md"
                  >
                    Falar com Parceiro Regional
                  </a>
                )}
              </div>
            </div>

            {/* Bairros */}
            {bairros.length > 0 && (
              <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/80 shadow-lg">
                <h3 className="font-bold text-white text-sm mb-4">Bairros Populares</h3>
                <ul className="space-y-2.5">
                  {bairros.map(b => (
                    <li key={b.id}>
                      <Link to={`/${estado}/${cidadeSlug}/${b.slug}`} className="text-slate-400 hover:text-emerald-400 flex items-center text-xs md:text-sm font-medium transition-colors">
                        <ChevronRight className="w-3.5 h-3.5 mr-1 text-slate-600 group-hover:text-emerald-400" /> {b.nome}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Selo de Confiança */}
            <div className="bg-slate-900/10 rounded-2xl p-6 border border-slate-800/40 text-center">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
              <h4 className="text-xs font-bold text-white mb-1">Guia Auditado e Seguro</h4>
              <p className="text-[10px] text-slate-500 font-light leading-relaxed">
                Todas as marcas listadas passam por auditoria de completude de dados comerciais.
              </p>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}
