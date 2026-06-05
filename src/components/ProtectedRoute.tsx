import { Navigate, Outlet } from 'react-router-dom'
import { useSupabaseSession } from '../lib/supabase'

interface ProtectedRouteProps {
  requiredRole?: 'admin' | 'parceiro_master' | 'sub_parceiro' | 'empresa_premium' | 'empresa_gratis' | 'parceiro_any'
}

const ADMIN_EMAILS = ['gestorederoliveira@gmail.com', 'eder@guialocalbr.com.br']
const PARCEIRO_EMAILS = ['ojulio.domingos@gmail.com']

export default function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { session, profile, loading } = useSupabaseSession()

  // Ainda carregando — mostrar spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  // Sem sessão — vai pro login
  if (!session) {
    return <Navigate to="/entrar" replace />
  }

  // Determinar o role efetivo:
  // Prioridade 1: o que está no banco (profile.role)
  // Prioridade 2: se o email está listado como admin ou parceiro, usa mapeamento estático
  const userEmail = session.user?.email || ''
  const staticFallbackRole = ADMIN_EMAILS.includes(userEmail) ? 'admin'
    : PARCEIRO_EMAILS.includes(userEmail) ? 'parceiro_master'
    : 'empresa_gratis'
  const effectiveRole = profile?.role || staticFallbackRole

  // Verificar permissão por role
  if (requiredRole) {
    if (effectiveRole === 'admin') {
      // Admin tem acesso a tudo
      return <Outlet />
    }

    if (requiredRole === 'parceiro_any') {
      if (effectiveRole !== 'parceiro_master' && effectiveRole !== 'sub_parceiro') {
        return <Navigate to="/entrar" replace />
      }
    } else if (effectiveRole !== requiredRole) {
      return <Navigate to="/" replace />
    }
  }

  return <Outlet />
}
