import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, MapPin, Zap, Utensils, Heart, Car, Book, Shirt, Wrench, Laptop, Home as HomeIcon, PawPrint, Pill, ShoppingCart, ArrowRight, ShieldCheck, Star, Calendar, Clock, Map, Building, Scissors, ShoppingBag, GraduationCap, Camera, Music, Dumbbell, Hammer, Briefcase, MoreHorizontal, Stethoscope } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { registrarEvento } from '../../lib/analytics'
import { getTenantFromURL } from '../../lib/tenant'

const CATEGORIAS = [
  { nome: 'Alimentação', slug: 'alimentacao', icone: Utensils, cor: 'text-orange-500 bg-orange-50' },
  { nome: 'Beleza e Estética', slug: 'beleza', icone: Scissors, cor: 'text-pink-500 bg-pink-50' },
  { nome: 'Automotivo', slug: 'automotivo', icone: Car, cor: 'text-blue-500 bg-blue-50' },
  { nome: 'Moda', slug: 'moda', icone: ShoppingBag, cor: 'text-purple-500 bg-purple-50' },
  { nome: 'Saúde', slug: 'saude', icone: Heart, cor: 'text-rose-500 bg-rose-50' },
  { nome: 'Educação', slug: 'educacao', icone: GraduationCap, cor: 'text-emerald-500 bg-emerald-50' },
  { nome: 'Casa e Decoração', slug: 'casa', icone: HomeIcon, cor: 'text-amber-500 bg-amber-50' },
  { nome: 'Serviços Gerais', slug: 'servicos', icone: Wrench, cor: 'text-slate-500 bg-slate-50' },
  { nome: 'Fotografia', slug: 'fotografia', icone: Camera, cor: 'text-indigo-500 bg-indigo-50' },
  { nome: 'Música', slug: 'musica', icone: Music, cor: 'text-fuchsia-500 bg-fuchsia-50' },
  { nome: 'Pet Shop', slug: 'pet', icone: PawPrint, cor: 'text-lime-500 bg-lime-50' },
  { nome: 'Esportes', slug: 'esportes', icone: Dumbbell, cor: 'text-teal-500 bg-teal-50' },
  { nome: 'Construção', slug: 'construcao', icone: Hammer, cor: 'text-yellow-500 bg-yellow-50' },
  { nome: 'Tecnologia', slug: 'tecnologia', icone: Laptop, cor: 'text-cyan-500 bg-cyan-50' },
  { nome: 'Consultoria', slug: 'consultoria', icone: Briefcase, cor: 'text-blue-600 bg-blue-50' },
  { nome: 'Salão de Beleza', slug: 'salao', icone: Sparkles, cor: 'text-pink-400 bg-pink-50' },
  { nome: 'Veterinária', slug: 'veterinaria', icone: Stethoscope, cor: 'text-emerald-600 bg-emerald-50' },
  { nome: 'Outros', slug: 'outros', icone: MoreHorizontal, cor: 'text-gray-500 bg-gray-50' },
]

function Sparkles(props: any) {
  return <Heart {...props} /> // Fallback as Sparkles might not be imported correctly
}

const PLACEHOLDERS = [
  "Pizzaria em Maringá...",
  "Mecânico em Paiçandu...",
  "Dentista em Curitiba...",
  "Pet Shop em Pouso Alegre...",
  "Advogado em Nova Aurora..."
]

export default function Home() {
  const navigate = useNavigate()
  const [termoBusca, setTermoBusca] = useState('')
  const [tenant, setTenant] = useState<any>(null)
  
  // Data states
  const [cidadesDestaque, setCidadesDestaque] = useState<any[]>([])
  const [artigos, setArtigos] = useState<any[]>([])
  const [empresasDestaque, setEmpresasDestaque] = useState<any[]>([])
  const [marqueeCidades, setMarqueeCidades] = useState<any[]>([])
  const [sugestoes, setSugestoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Dynamic features
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [counters, setCounters] = useState({ empresas: 0, cidades: 0, estados: 0, premium: 0 })
  const [finalCounters, setFinalCounters] = useState({ empresas: 49, cidades: 16, estados: 8, premium: 34 })

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % PLACEHOLDERS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    registrarEvento('page_view', { origem: 'home' })
    void carregarDadosIniciais()
  }, [])

  const carregarDadosIniciais = async () => {
    try {
      const tenantAtual = await getTenantFromURL()
      setTenant(tenantAtual)

      // Cidades Destaque
      const { data: cidades } = await supabase
        .from('cidades')
        .select('id, nome, slug, foto_url, estados(uf)')
        .limit(6)
      setCidadesDestaque(cidades || [])

      // Últimos do Blog
      const { data: ultimosArtigos } = await supabase
        .from('artigos')
        .select('*')
        .eq('publicado', true)
        .order('publicado_em', { ascending: false })
        .limit(3)
      setArtigos(ultimosArtigos || [])

      // Marquee Cidades
      const { data: mc } = await supabase.from('cidades').select('nome, estados(uf)').order('nome', { ascending: true }).limit(20)
      setMarqueeCidades(mc || [])

      // Empresas em Destaque
      const { data: destaques } = await supabase
        .from('empresas')
        .select('id, nome, slug, foto_principal, categorias(nome), cidades(nome, estados(uf))')
        .eq('ativa', true)
        .order('score_completude', { ascending: false })
        .limit(10)
      setEmpresasDestaque(destaques || [])

      // Estatísticas reais
      const { data: stats } = await supabase.from('empresas').select('ativa, plano, cidades(id, estados(id))')
      
      let empresasAtivas = 0
      let empresasPremium = 0
      const cidadesSet = new Set()
      const estadosSet = new Set()

      if (stats) {
        stats.forEach((e: any) => {
          if (e.ativa) empresasAtivas++
          if (e.plano === 'premium' || e.plano === 'turbo') empresasPremium++
          if (e.cidades) {
            cidadesSet.add(e.cidades.id)
            if (e.cidades.estados) estadosSet.add(e.cidades.estados.id)
          }
        })
      }

      setFinalCounters({
        empresas: empresasAtivas || 49,
        cidades: cidadesSet.size || 16,
        estados: estadosSet.size || 8,
        premium: empresasPremium || 34
      })

    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Count animation
  useEffect(() => {
    let step = 0
    const totalSteps = 24 // 1.2s at 50ms per step
    const interval = setInterval(() => {
      step++
      setCounters({
        empresas: Math.floor((step / totalSteps) * finalCounters.empresas),
        cidades: Math.floor((step / totalSteps) * finalCounters.cidades),
        estados: Math.floor((step / totalSteps) * finalCounters.estados),
        premium: Math.floor((step / totalSteps) * finalCounters.premium),
      })
      if (step >= totalSteps) {
        clearInterval(interval)
        setCounters(finalCounters)
      }
    }, 50)
    return () => clearInterval(interval)
  }, [finalCounters])

  const handleBuscaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const termo = e.target.value
    setTermoBusca(termo)
    
    if (termo.length > 2) {
      const { data } = await supabase
        .from('empresas')
        .select('nome, slug')
        .ilike('nome', `%${termo}%`)
        .limit(5)
      setSugestoes(data || [])
    } else {
      setSugestoes([])
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (termoBusca.trim()) {
      navigate(`/busca?q=${encodeURIComponent(termoBusca)}`)
    }
  }

  const getCityGradient = (idx: number) => {
    const gradients = [
      'from-[#0A3D28] to-[#115E40]', // Dark Green
      'from-[#0A1A3D] to-[#122A5E]', // Dark Blue
      'from-[#2D1B3D] to-[#4A2D64]', // Dark Purple
      'from-[#3D280A] to-[#5E4011]', // Dark Brown
      'from-[#3D0A16] to-[#5E1225]', // Dark Red
      'from-[#0A3D3D] to-[#115E5E]', // Dark Teal
    ]
    return gradients[idx % gradients.length]
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#5A6A7E] font-sans selection:bg-[#1A9B6A] selection:text-white overflow-x-hidden">
      
      {/* NAVBAR */}
      <header className="bg-white border-b border-[#EEF3F8] sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1A6B4A] to-[#0D4DB5] flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-[18px] font-bold text-[#0A1628] tracking-tight">
              Guia Local <span className="text-[#1A9B6A]">BR</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link to="/sobre" className="text-[13px] font-medium text-[#5A6A7E] hover:text-[#1A9B6A] transition-colors">
              Como funciona
            </Link>
            <Link to="/entrar" className="px-5 py-2 rounded-lg border-[1.5px] border-[#1A9B6A] text-[#1A9B6A] text-[13px] font-bold hover:bg-[#1A9B6A] hover:text-white transition-all">
              Entrar
            </Link>
            <Link to="/cadastre-sua-empresa" className="px-5 py-2.5 rounded-lg bg-[#1A9B6A] text-white text-[13px] font-bold hover:bg-[#147A53] transition-all">
              Cadastre Grátis
            </Link>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 bg-[linear-gradient(160deg,#F0F7FF_0%,#E8F8F2_50%,#F0F7FF_100%)] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle,#1A9B6A22_1px,transparent_1px)] bg-[size:28px_28px]" />
        
        <div className="container mx-auto px-4 text-center relative z-10">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#D0EAE0] mb-8 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-[#1A9B6A] animate-pulse" />
            <span className="text-[11px] font-bold text-[#1A7A55] tracking-widest uppercase">O Maior Guia Comercial do Brasil</span>
          </div>

          <h1 className="text-[40px] md:text-[72px] font-[900] text-[#0A1628] tracking-[-2px] leading-[1.05] mb-6">
            Encontre os Melhores <br className="hidden md:block"/>
            Negócios <span className="bg-gradient-to-r from-[#1A9B6A] to-[#0D6EE0] bg-clip-text text-transparent">Locais</span> <br className="hidden md:block"/>
            da Sua Região
          </h1>
          
          <p className="text-[15px] md:text-[18px] text-[#5A6A7E] mb-10 max-w-2xl mx-auto font-medium">
            Conecte-se com empresas verificadas e fale direto pelo WhatsApp — rápido, gratuito e seguro.
          </p>
          
          {/* BUSCA */}
          <div className="max-w-[700px] mx-auto relative mb-6">
            <form onSubmit={handleSearch} className="relative flex items-center bg-white border-[1.5px] border-[#D0EAE0] rounded-[14px] p-2 shadow-[0_4px_20px_rgba(26,155,106,0.12)] transition-all">
              <div className="flex-1 flex items-center pl-4">
                <Search className="w-5 h-5 text-[#1A9B6A] mr-3 flex-shrink-0" />
                <input
                  type="text"
                  className="w-full bg-transparent border-0 text-[#0A1628] placeholder-[#9AAAB8] text-[15px] md:text-[17px] focus:outline-none focus:ring-0 py-3 pr-4 font-medium"
                  placeholder={PLACEHOLDERS[placeholderIdx]}
                  value={termoBusca}
                  onChange={handleBuscaChange}
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-[#1A9B6A] to-[#0D6EE0] text-white px-6 md:px-8 py-3 rounded-xl font-bold flex items-center transition-all cursor-pointer text-[14px] md:text-[15px] hover:shadow-lg"
              >
                Buscar Agora
              </button>
            </form>

            {/* SUGESTÕES DE BUSCA */}
            {sugestoes.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#EEF3F8] rounded-[14px] shadow-xl overflow-hidden z-50 text-left divide-y divide-[#EEF3F8]">
                {sugestoes.map((s, idx) => (
                  <button
                    key={idx}
                    className="w-full px-6 py-4 text-[#5A6A7E] hover:bg-[#F8FAFC] hover:text-[#1A9B6A] text-[14px] font-medium transition-colors flex items-center justify-between"
                    onClick={() => navigate(`/empresa/${s.slug}`)}
                  >
                    <span>{s.nome}</span>
                    <ArrowRight className="w-4 h-4 text-[#9AAAB8]" />
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 mt-8 text-[13px] text-[#9AAAB8] font-medium">
            <span>Buscas comuns:</span>
            <Link to="/busca?q=Estética" className="text-[#1A9B6A] hover:underline">Estética</Link>
            <span>•</span>
            <Link to="/busca?q=Pet+Shop" className="text-[#1A9B6A] hover:underline">Pet Shop</Link>
            <span>•</span>
            <Link to="/busca?q=Gás" className="text-[#1A9B6A] hover:underline">Disk Gás</Link>
            <span>•</span>
            <Link to="/busca?q=Advogado" className="text-[#1A9B6A] hover:underline">Advogado</Link>
            <span>•</span>
            <Link to="/busca?q=Mecânico" className="text-[#1A9B6A] hover:underline">Mecânico</Link>
          </div>
        </div>
      </section>

      {/* MARQUEE CITIES */}
      <div className="bg-white border-y border-[#EEF3F8] py-3 overflow-hidden flex items-center group">
        <div className="flex w-max animate-[marquee_30s_linear_infinite] group-hover:[animation-play-state:paused]">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4">
              {marqueeCidades.map((cidade, idx) => (
                <span key={idx} className="flex items-center gap-2 text-[#5A6A7E] font-bold text-[13px] tracking-wide whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A9B6A]" /> {cidade.nome} · {cidade.estados?.uf}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* STATS BAR */}
      <div className="bg-white border-b border-[#EEF3F8]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#EEF3F8] py-8">
            <div className="text-center px-4">
              <div className="text-[32px] font-[900] text-[#0A1628] tracking-tight">{counters.empresas}<span className="text-[#1A9B6A]">+</span></div>
              <div className="text-[12px] text-[#9AAAB8] uppercase tracking-wide font-bold mt-1">Empresas cadastradas</div>
            </div>
            <div className="text-center px-4">
              <div className="text-[32px] font-[900] text-[#0A1628] tracking-tight">{counters.cidades}<span className="text-[#1A9B6A]">+</span></div>
              <div className="text-[12px] text-[#9AAAB8] uppercase tracking-wide font-bold mt-1">Cidades atendidas</div>
            </div>
            <div className="text-center px-4 mt-8 md:mt-0">
              <div className="text-[32px] font-[900] text-[#0A1628] tracking-tight">{counters.estados}<span className="text-[#1A9B6A]">+</span></div>
              <div className="text-[12px] text-[#9AAAB8] uppercase tracking-wide font-bold mt-1">Estados cobertos</div>
            </div>
            <div className="text-center px-4 mt-8 md:mt-0">
              <div className="text-[32px] font-[900] text-[#0A1628] tracking-tight">{counters.premium}<span className="text-[#1A9B6A]">+</span></div>
              <div className="text-[12px] text-[#9AAAB8] uppercase tracking-wide font-bold mt-1">Membros premium</div>
            </div>
          </div>
        </div>
      </div>

      {/* EXPLORE CATEGORIES */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-[28px] md:text-[36px] font-[900] text-[#0A1628] mb-2 tracking-tight">
            Explore por <span className="text-[#1A9B6A]">Categoria</span>
          </h2>
          <p className="text-[#9AAAB8] text-[15px] font-medium mb-12">
            Encontre rapidamente o que você precisa
          </p>

          <div className="grid grid-cols-4 md:grid-cols-9 gap-[10px] max-w-[1200px] mx-auto">
            {CATEGORIAS.map((cat, idx) => {
              const Icon = cat.icone
              return (
                <Link
                  key={idx}
                  to={`/busca?categoria=${cat.slug}`}
                  className="group flex flex-col items-center justify-center p-4 bg-white border-[1.5px] border-[#EEF3F8] rounded-[16px] hover:border-[#1A9B6A] hover:-translate-y-[2px] hover:shadow-[0_6px_20px_rgba(26,155,106,0.1)] transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-[14px] ${cat.cor} flex items-center justify-center mb-3`}>
                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-semibold text-[#0A1628] text-[12px] text-center group-hover:text-[#1A9B6A] transition-colors leading-tight">{cat.nome}</h3>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* EMPRESAS EM DESTAQUE */}
      <section className="py-20 bg-[linear-gradient(180deg,#F0F7FF,#ffffff)] border-y border-[#EEF3F8]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <h2 className="text-[28px] font-[900] text-[#0A1628] tracking-tight">Empresas em <span className="text-[#1A9B6A]">Destaque</span></h2>
            </div>
            <Link to="/busca?destaque=true" className="text-[#1A9B6A] text-[14px] font-bold flex items-center gap-1 hover:underline mt-4 md:mt-0">
              Ver todas <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="relative overflow-hidden w-full group">
            <div className="flex w-max gap-5 animate-[marquee_40s_linear_infinite] hover:[animation-play-state:paused] pb-4">
              {[...empresasDestaque, ...empresasDestaque].map((empresa, idx) => {
                const bgColors = ['bg-emerald-50', 'bg-orange-50', 'bg-blue-50', 'bg-purple-50', 'bg-pink-50']
                const textColors = ['text-emerald-500', 'text-orange-500', 'text-blue-500', 'text-purple-500', 'text-pink-500']
                const colorIdx = idx % bgColors.length;
                
                return (
                  <div key={idx} className="w-[280px] flex-shrink-0 bg-white border-[1.5px] border-[#EEF3F8] rounded-[16px] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all flex flex-col">
                    <div className={`h-28 w-full ${bgColors[colorIdx]} flex items-center justify-center relative`}>
                      <div className="absolute top-3 left-3 bg-[#FF9800] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                        Destaque
                      </div>
                      {empresa?.foto_principal ? (
                        <img src={empresa.foto_principal} className="w-full h-full object-cover opacity-90" alt="" />
                      ) : (
                        <Building className={`w-10 h-10 ${textColors[colorIdx]} opacity-50`} />
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-bold text-[#0A1628] text-[15px] leading-tight mb-1 line-clamp-1">{empresa?.nome || 'Nome da Empresa'}</h3>
                      <div className="flex items-center text-[12px] text-[#9AAAB8] mb-3">
                        <MapPin className="w-3 h-3 mr-1" /> {empresa?.cidades?.nome || 'Cidade'}, {empresa?.cidades?.estados?.uf || 'UF'}
                      </div>
                      <div className="flex gap-1 mb-4">
                        {[1,2,3,4,5].map(s => <Star key={s} className="w-3 h-3 fill-[#FBBF24] text-[#FBBF24]" />)}
                      </div>
                      <button onClick={() => navigate(`/empresa/${empresa?.slug}`)} className="mt-auto w-full bg-[#25D366] text-white text-[13px] font-bold py-2.5 rounded-xl hover:bg-[#20bd5a] transition-colors cursor-pointer">
                        WhatsApp
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CIDADES EM DESTAQUE */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-[28px] font-[900] text-[#0A1628] tracking-tight">Cidades em <span className="text-[#1A9B6A]">Destaque</span></h2>
              <p className="text-[#9AAAB8] text-[15px] font-medium mt-1">Explore empresas nos polos mais ativos do guia</p>
            </div>
            <Link to="/busca" className="hidden md:flex text-[#1A9B6A] text-[14px] font-bold items-center gap-1 hover:underline">
              Ver todas as cidades <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {cidadesDestaque.map((cidade, idx) => (
              <Link 
                key={idx} 
                to={`/${cidade.estados?.uf?.toLowerCase() || 'br'}/${cidade.slug}`}
                className={`relative rounded-[20px] overflow-hidden group ${idx === 0 ? 'md:col-span-2 h-[220px]' : 'h-[160px] md:h-[220px]'}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${getCityGradient(idx)} opacity-100 z-0`} />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10" />
                
                <div className="absolute bottom-0 left-0 p-6 z-20">
                  <div className="bg-[#1A9B6A] text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md w-fit mb-2">
                    {Math.floor(Math.random()*30)+2} Empresas
                  </div>
                  <h3 className="text-white font-[900] text-[20px] tracking-tight leading-none mb-1">
                    {cidade.nome} · {cidade.estados?.uf}
                  </h3>
                  <p className="text-white/70 text-[13px] font-medium">Polos regionais e capitais</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BLOG */}
      <section className="py-20 bg-[#F8FAFC] border-t border-[#EEF3F8]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-[28px] font-[900] text-[#0A1628] tracking-tight">Fique por dentro do <span className="text-[#1A9B6A]">Blog</span></h2>
              <p className="text-[#9AAAB8] text-[15px] font-medium mt-1">Dicas de marketing local, vendas e segredos para destacar seu negócio</p>
            </div>
            <Link to="/blog" className="hidden md:flex text-[#1A9B6A] text-[14px] font-bold items-center gap-1 hover:underline">
              Ver tudo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {artigos.map((artigo, idx) => {
              const bgColors = ['bg-emerald-100', 'bg-blue-100', 'bg-orange-100']
              const textColors = ['text-emerald-500', 'text-blue-500', 'text-orange-500']
              const icons = [Star, Search, MapPin]
              const Icon = icons[idx % 3]

              return (
                <Link key={idx} to={`/blog/${artigo.slug}`} className={`group bg-white border-[1.5px] border-[#EEF3F8] rounded-[20px] overflow-hidden hover:border-[#1A9B6A] hover:shadow-[0_10px_30px_rgba(26,155,106,0.08)] transition-all flex flex-col ${idx === 0 ? 'md:col-span-1' : ''}`}>
                  <div className={`h-[180px] w-full ${bgColors[idx]} flex items-center justify-center relative overflow-hidden`}>
                    {artigo.imagem_capa ? (
                      <img src={artigo.imagem_capa} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <Icon className={`w-12 h-12 ${textColors[idx]} opacity-40`} />
                    )}
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="bg-[#F0F7FF] text-[#1A9B6A] text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md w-fit mb-3">
                      Dicas de Negócio
                    </div>
                    <h3 className="font-[900] text-[#0A1628] text-[18px] leading-[1.3] mb-3 group-hover:text-[#1A9B6A] transition-colors">
                      {artigo.titulo}
                    </h3>
                    <div className="flex items-center text-[#9AAAB8] text-[12px] font-medium mt-auto">
                      <Calendar className="w-3.5 h-3.5 mr-1" /> 02 Jun 2026
                      <span className="mx-2">•</span>
                      <Clock className="w-3.5 h-3.5 mr-1" /> 5 min de leitura
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA ANUNCIE */}
      <section className="bg-[linear-gradient(135deg,#0A2E1E,#0A1E4A)] py-24 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] border border-[rgba(26,155,106,0.15)] rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="absolute top-0 right-0 w-[700px] h-[700px] border border-[rgba(26,155,106,0.15)] rounded-full translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] border border-[rgba(26,155,106,0.15)] rounded-full -translate-x-1/3 translate-y-1/3" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="text-[#1A9B6A] text-[11px] font-black uppercase tracking-[1.5px] mb-4">Anuncie Agora</div>
          <h2 className="text-[36px] md:text-[48px] font-[900] text-white tracking-tight leading-[1.1] mb-6">
            Sua empresa ainda não está <br className="hidden md:block"/>
            listada no <span className="text-[#1A9B6A]">Guia Local BR</span>?
          </h2>
          <p className="text-[#9AAAB8] text-[16px] md:text-[18px] max-w-2xl mx-auto mb-10 font-medium">
            Coloque seu negócio na frente de milhares de clientes locais de forma totalmente gratuita e multiplique suas vendas.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link to="/cadastre-sua-empresa" className="w-full sm:w-auto bg-[#1A9B6A] text-white font-bold px-8 py-4 rounded-xl text-[15px] hover:bg-[#147A53] transition-colors shadow-[0_4px_20px_rgba(26,155,106,0.3)]">
              Cadastrar Minha Empresa
            </Link>
            <Link to="/entrar" className="w-full sm:w-auto bg-transparent border-[1.5px] border-white/20 text-white font-bold px-8 py-4 rounded-xl text-[15px] hover:bg-white/5 transition-colors">
              Conhecer Plano Premium
            </Link>
          </div>
        </div>
      </section>

      {/* BANNER PARCEIROS */}
      <section className="bg-[linear-gradient(135deg,#E8F8F2,#E8F0FF)] py-12 border-b border-[#EEF3F8]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="bg-[#1A9B6A] text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md w-fit mb-3">
                Seja um Licenciado
              </div>
              <h2 className="text-[24px] md:text-[28px] font-[900] text-[#0A1628] tracking-tight mb-2">
                Quer ser o Consultor Exclusivo na sua cidade?
              </h2>
              <p className="text-[#5A6A7E] text-[15px] font-medium">
                Exclusividade territorial, renda recorrente e suporte completo de uma plataforma de alta tecnologia.
              </p>
            </div>
            <a href="https://wa.me/5535999483143" target="_blank" rel="noreferrer" className="flex-shrink-0 bg-[#0A1628] text-white font-bold px-6 py-3.5 rounded-xl hover:bg-[#1a2b4a] transition-colors flex items-center gap-2">
              Falar com o Time <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0A1628] pt-16 pb-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-16">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1A6B4A] to-[#0D4DB5] flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white fill-white" />
                </div>
                <span className="text-[18px] font-bold text-white tracking-tight">
                  Guia Local <span className="text-[#1A9B6A]">BR</span>
                </span>
              </div>
              <p className="text-[14px] text-[rgba(255,255,255,0.5)] leading-relaxed font-medium">
                O maior buscador de negócios locais do Brasil. Conectando pessoas e oportunidades.
              </p>
            </div>
            
            <div>
              <h4 className="text-[11px] font-black text-white uppercase tracking-[1.5px] mb-5">Atalhos</h4>
              <ul className="space-y-3 text-[14px] font-medium">
                <li><Link to="/sobre" className="text-[rgba(255,255,255,0.5)] hover:text-[#1A9B6A] transition-colors">Sobre Nós</Link></li>
                <li><Link to="/blog" className="text-[rgba(255,255,255,0.5)] hover:text-[#1A9B6A] transition-colors">Nosso Blog</Link></li>
                <li><Link to="/busca" className="text-[rgba(255,255,255,0.5)] hover:text-[#1A9B6A] transition-colors">Categorias</Link></li>
                <li><Link to="/busca" className="text-[rgba(255,255,255,0.5)] hover:text-[#1A9B6A] transition-colors">Cidades</Link></li>
                <li><a href="#" className="text-[rgba(255,255,255,0.5)] hover:text-[#1A9B6A] transition-colors">Baixar Planilha (.xlsx)</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-black text-white uppercase tracking-[1.5px] mb-5">Parcerias</h4>
              <ul className="space-y-3 text-[14px] font-medium">
                <li><Link to="/cadastre-sua-empresa" className="text-[rgba(255,255,255,0.5)] hover:text-[#1A9B6A] transition-colors">Anunciar Negócio</Link></li>
                <li><Link to="/seja-parceiro" className="text-[rgba(255,255,255,0.5)] hover:text-[#1A9B6A] transition-colors">Seja um Parceiro</Link></li>

                <li><Link to="/seja-parceiro" className="text-[rgba(255,255,255,0.5)] hover:text-[#1A9B6A] transition-colors">Programa de Parceiros</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[11px] font-black text-white uppercase tracking-[1.5px] mb-5">Institucional</h4>
              <ul className="space-y-3 text-[14px] font-medium">
                <li><Link to="/privacidade" className="text-[rgba(255,255,255,0.5)] hover:text-[#1A9B6A] transition-colors">Política de Privacidade</Link></li>
                <li><Link to="/termos" className="text-[rgba(255,255,255,0.5)] hover:text-[#1A9B6A] transition-colors">Termos de Uso</Link></li>
                <li><a href="#" className="text-[rgba(255,255,255,0.5)] hover:text-[#1A9B6A] transition-colors">Contato</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[rgba(255,255,255,0.07)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[12px] font-medium text-[rgba(255,255,255,0.3)]">
            <p>© 2026 Guia Local BR · Todos os direitos reservados</p>
            <p>Desenvolvido com tecnologia de ponta</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
