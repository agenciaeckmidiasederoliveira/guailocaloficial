import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Loader2, AlertCircle, MapPin } from 'lucide-react'

const ADMIN_EMAILS = ['gestorederoliveira@gmail.com', 'eder@guialocalbr.com.br']
const PARCEIRO_EMAILS = ['ojulio.domingos@gmail.com']

export default function Entrar() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErro('E-mail ou senha incorretos.')
        } else if (error.message.includes('Email not confirmed')) {
          setErro('Confirme seu e-mail antes de entrar.')
        } else {
          setErro(error.message)
        }
        setLoading(false)
        return
      }

      const userId = data.user.id
      const userEmail = data.user.email || email

      // Garantir que o perfil existe no banco
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

      let role = profileData?.role

      if (!role) {
        // Criar perfil automaticamente
        role = ADMIN_EMAILS.includes(userEmail) ? 'admin'
          : PARCEIRO_EMAILS.includes(userEmail) ? 'parceiro_master'
          : 'empresa_gratis'

        await supabase.from('profiles').upsert({
          id: userId,
          email: userEmail,
          nome: userEmail.split('@')[0],
          role,
        }, { onConflict: 'id' })
      }

      // Garantir registro de parceiro se for parceiro
      if (role === 'parceiro_master') {
        const { data: parceiroExiste } = await supabase
          .from('parceiros')
          .select('id')
          .eq('profile_id', userId)
          .maybeSingle()

        if (!parceiroExiste) {
          const whatsapp = userEmail === 'ojulio.domingos@gmail.com' ? '5544988436180' : null
          await supabase.from('parceiros').insert({
            profile_id: userId,
            nome_comercial: userEmail.split('@')[0],
            whatsapp_contato: whatsapp,
            whatsapp_vendas: whatsapp,
            nivel: 1,
            slug: userEmail.split('@')[0].toLowerCase().replace(/\s+/g, '-'),
          })
        }
      }

      // Redirecionar conforme role
      if (role === 'admin') {
        navigate('/admin/dashboard', { replace: true })
      } else if (role === 'parceiro_master' || role === 'sub_parceiro') {
        navigate('/parceiro/dashboard', { replace: true })
      } else {
        navigate('/', { replace: true })
      }

    } catch (err: any) {
      console.error('Erro no login:', err)
      setErro('Erro inesperado. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a365d] via-[#1e4080] to-[#0d9488] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-black text-white tracking-tight">
              Guia Local <span className="text-emerald-300">BR</span>
            </span>
          </div>
          <p className="text-white/70 font-medium">Painel de Controle</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Bem-vindo de volta 👋</h2>
          <p className="text-gray-500 text-sm mb-7">Entre com suas credenciais para acessar o painel</p>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">E-mail</label>
              <input
                type="email"
                required
                autoComplete="email"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900 placeholder:text-gray-400"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Senha</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-gray-900 placeholder:text-gray-400"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {erro && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a365d] hover:bg-[#153054] disabled:bg-gray-300 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Entrando...
                </>
              ) : 'Entrar no Painel'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Problemas para acessar? Entre em contato com o administrador.
            </p>
          </div>
        </div>

        <p className="text-center text-white/60 text-sm mt-6">
          <a href="/" className="hover:text-white transition-colors">← Voltar para o site</a>
        </p>
      </div>
    </div>
  )
}
