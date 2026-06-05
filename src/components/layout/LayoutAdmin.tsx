import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Store, Users, BarChart2, PenTool,
  Settings, LogOut, Menu, MapPin, Bot, ArrowLeft, Plus,
  Sparkles, Layers, Key, Globe, Zap
} from 'lucide-react'
import { useSupabaseSession, supabase } from '../../lib/supabase'

const MENU = [
  { label: 'Visão Geral', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Empresas & Destaques', path: '/admin/empresas', icon: Store },
  { label: 'Consultores/Parceiros', path: '/admin/parceiros', icon: Users },
  { label: 'Licenciamentos', path: '/admin/licenciamentos', icon: Key },
  { label: 'Analytics Master', path: '/admin/analytics', icon: BarChart2 },
  { label: 'Cidades & Territórios', path: '/admin/cidades', icon: MapPin },
  { label: 'Artigos & IA', path: '/admin/blog', icon: PenTool },
  { label: 'Indexador IA em Massa', path: '/admin/gerar-seo', icon: Bot, badge: 'AUTO' },
  { label: 'Domínios Regionais', path: '/admin/dominios', icon: Globe },
]

export default function LayoutAdmin() {
  const { profile } = useSupabaseSession()
  const [open, setOpen] = useState(false)
  const [activeLicensesCount, setActiveLicensesCount] = useState<number | null>(null)
  const location = useLocation()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Carregar contagem de licenças ativas em tempo real
  useEffect(() => {
    const fetchLicensesCount = async () => {
      try {
        const { count, error } = await supabase
          .from('licencas')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'ativo')

        if (!error && count !== null) {
          setActiveLicensesCount(count)
        }
      } catch (err) {
        console.error('Erro ao carregar contagem de licenças:', err)
      }
    }
    fetchLicensesCount()
  }, [])

  const menuItems = MENU.map(item => {
    if (item.path === '/admin/licenciamentos' && activeLicensesCount !== null && activeLicensesCount > 0) {
      return { ...item, badge: activeLicensesCount.toString() }
    }
    return item
  })

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0A1628] font-sans selection:bg-[#1A9B6A]/10 selection:text-[#1A9B6A]">
      {/* Mobile Sidebar Backdrop */}
      {open && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* SIDEBAR - Light Premium */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col
        lg:translate-x-0 lg:static
        transform transition-all duration-300 ease-out
        bg-white text-[#5A6A7E] border-r border-[#EEF3F8] shadow-[4px_0_24px_rgba(238,243,248,0.5)]
        ${open ? 'translate-x-0 w-64' : '-translate-x-full lg:w-64'}
      `} style={{ width: '260px' }}>

        {/* Logo Header */}
        <div className="px-6 py-6 border-b border-[#EEF3F8] relative overflow-hidden group">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-base shadow-lg shadow-[#1A9B6A]/20 bg-gradient-to-br from-[#1A6B4A] to-[#0D4DB5]">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            <div>
              <span className="text-[#0A1628] font-bold text-sm tracking-tight block">Guia Local BR</span>
              <span className="text-[#1A9B6A] text-[10px] font-black tracking-widest uppercase">Admin Panel</span>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname.startsWith(item.path)
            return (
              <Link key={item.path} to={item.path} onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold transition-all duration-200 relative overflow-hidden group
                  ${active 
                    ? 'bg-[#1A9B6A] text-white shadow-md shadow-[#1A9B6A]/20' 
                    : 'text-[#5A6A7E] hover:text-[#0A1628] hover:bg-[#F8FAFC]'
                  }
                `}
              >
                {active && <span className="absolute left-0 top-1/4 bottom-1/4 w-[3px] bg-white rounded-r"></span>}
                <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-white' : 'text-[#9AAAB8] group-hover:text-[#1A9B6A]'}`} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm border border-[#EEF3F8] ${
                    active ? 'bg-white text-[#1A9B6A]' : 'bg-[#1A9B6A] text-white border-transparent'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-[#EEF3F8] bg-white">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#EEF3F8] mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1A6B4A] to-[#0D4DB5] flex items-center justify-center text-white text-sm font-black shadow-md">
              {profile?.email?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-[#0A1628] truncate">{profile?.nome || 'Administrador'}</p>
              <p className="text-[10px] font-medium text-[#9AAAB8] truncate">{profile?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-[12px] font-bold rounded-xl text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 transition-all duration-200"
          >
            <LogOut className="w-3.5 h-3.5" /> Sair do Painel
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-[#F8FAFC]">
        {/* Soft Glow */}
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-[#1A9B6A]/5 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Topbar */}
        <header className="h-16 bg-white border-b border-[#EEF3F8] flex items-center px-6 gap-4 sticky top-0 z-30">
          <button className="lg:hidden p-2 text-[#5A6A7E] hover:text-[#0A1628] transition-colors" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-200 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Conexão Supabase Ativa
          </div>

          <div className="ml-auto flex items-center gap-3">
            <a href="/"
              className="flex items-center gap-2 text-[12px] font-bold text-[#5A6A7E] hover:text-[#1A9B6A] bg-white hover:bg-[#F8FAFC] border-[1.5px] border-[#EEF3F8] hover:border-[#1A9B6A] px-4 py-2 rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Guia Público
            </a>
          </div>
        </header>

        {/* Content Outlet */}
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto z-10 relative">
          <Outlet context={{ profile }} />
        </div>
      </main>
    </div>
  )
}
