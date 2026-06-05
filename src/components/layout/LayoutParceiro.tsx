import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Store, MapPin, Users, PhoneIncoming,
  BarChart2, PenTool, Settings, LogOut, Menu, Globe,
  ChevronRight, Lock
} from 'lucide-react'
import { useSupabaseSession, supabase } from '../../lib/supabase'

const MENU = [
  { label: 'Dashboard', path: '/parceiro/dashboard', icon: LayoutDashboard },
  { label: 'Minhas Empresas', path: '/parceiro/empresas', icon: Store },
  { label: 'Território / Cidades', path: '/parceiro/cidades', icon: MapPin },
  { label: 'Leads Recebidos', path: '/parceiro/leads', icon: PhoneIncoming },
  { label: 'Analytics', path: '/parceiro/analytics', icon: BarChart2 },
  { label: 'Blog & IA', path: '/parceiro/blog', icon: PenTool },
  { label: 'Configurações', path: '/parceiro/configuracoes', icon: Settings },
]

// Modal de troca de senha obrigatória
function TrocaSenhaModal({ onDone }: { onDone: () => void }) {
  const [nova, setNova] = useState('')
  const [confirma, setConfirma] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  const handleSalvar = async () => {
    if (nova.length < 8) { setErro('Mínimo 8 caracteres.'); return }
    if (nova !== confirma) { setErro('As senhas não coincidem.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password: nova })
    if (error) { setErro(error.message); setLoading(false); return }
    // Marcar no user_metadata que já trocou a senha
    await supabase.auth.updateUser({ data: { force_password_reset: false } })
    if (profile?.id) {
      await supabase.from('profiles').update({ deve_trocar_senha: false }).eq('id', profile.id)
    }
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
          <Lock className="w-7 h-7 text-amber-600" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Crie sua nova senha</h2>
        <p className="text-gray-500 text-sm mb-6">
          Por segurança, você precisa criar uma nova senha antes de continuar.
          Use algo que apenas você saiba.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1.5">Nova Senha</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900"
              placeholder="Mínimo 8 caracteres"
              value={nova}
              onChange={e => setNova(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-700 block mb-1.5">Confirmar Nova Senha</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-gray-900"
              placeholder="Repita a senha acima"
              value={confirma}
              onChange={e => setConfirma(e.target.value)}
            />
          </div>

          {erro && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-200">
              ⚠️ {erro}
            </div>
          )}

          <button
            onClick={handleSalvar}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/25 mt-2"
          >
            {loading ? 'Salvando...' : 'Salvar Nova Senha e Continuar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LayoutParceiro() {
  const { session, profile } = useSupabaseSession()
  const [parceiro, setParceiro] = useState<any>(null)
  const [open, setOpen] = useState(false)
  const [deveTrocar, setDeveTrocar] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (profile?.id) {
      carregarParceiro()
      // Checar se precisa trocar senha
      const forceFromMeta = session?.user?.user_metadata?.force_password_reset === true;
      const forceFromProfile = !!profile?.deve_trocar_senha;
      setDeveTrocar(forceFromMeta || forceFromProfile);
    }
  }, [profile, session])

  const carregarParceiro = async () => {
    const { data } = await supabase
      .from('parceiros')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle()
    if (data) setParceiro(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const menuFiltrado = profile?.role === 'parceiro_master'
    ? [...MENU.slice(0, 3), { label: 'Sub-parceiros', path: '/parceiro/sub-parceiros', icon: Users }, ...MENU.slice(3)]
    : MENU

  const currentLabel = menuFiltrado.find(m => location.pathname.startsWith(m.path))?.label || 'Painel'

  return (
    <div className="min-h-screen flex bg-[#0f0f1a]">
      {/* Modal de troca de senha */}
      {deveTrocar && <TrocaSenhaModal onDone={() => setDeveTrocar(false)} />}

      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 z-50 flex flex-col
        bg-[#13131f] border-r border-white/5
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-none">Guia Local BR</p>
              <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Hub do Parceiro</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {menuFiltrado.map((item) => {
            const Icon = item.icon
            const active = location.pathname.startsWith(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? 'bg-emerald-500/10 text-blue-400 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-blue-400' : 'text-slate-500'}`} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3 h-3 text-emerald-500" />}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {profile?.nome?.charAt(0)?.toUpperCase() || 'P'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{parceiro?.nome_comercial || profile?.nome}</p>
              <p className="text-slate-500 text-[10px]">
                {profile?.role === 'parceiro_master' ? 'Master' : 'Sub-parceiro'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-slate-400 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair do sistema
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc]">
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-30 shadow-sm">
          <button className="lg:hidden p-2 text-gray-500" onClick={() => setOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-gray-900">{currentLabel}</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Parceiro Ativo
            </span>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <Outlet context={{ parceiro, profile }} />
        </div>
      </main>
    </div>
  )
}
