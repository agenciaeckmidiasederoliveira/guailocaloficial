import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
)

const ADMIN_EMAILS = ['gestorederoliveira@gmail.com', 'eder@guialocalbr.com.br']
const PARCEIRO_EMAILS = ['ojulio.domingos@gmail.com']

// Hook personalizado para sessão e perfil
export function useSupabaseSession() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string, userEmail: string) => {
    try {
      // Tenta buscar o perfil existente
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // usa maybeSingle para não dar erro se não achar

      if (data && !error) {
        setProfile(data)
        return
      }

      // Perfil não existe — criar automaticamente com role correto
      const role = ADMIN_EMAILS.includes(userEmail) ? 'admin' 
        : PARCEIRO_EMAILS.includes(userEmail) ? 'parceiro_master'
        : 'empresa_gratis'

      const { data: novo, error: errInsert } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: userEmail,
          nome: userEmail.split('@')[0],
          role,
        }, { onConflict: 'id' })
        .select()
        .single()

      if (!errInsert && novo) {
        setProfile(novo)
      } else {
        // Fallback: montar profile manualmente a partir dos dados do auth
        setProfile({
          id: userId,
          email: userEmail,
          role,
        })
      }
    } catch (err) {
      console.error('fetchProfile error:', err)
      const role = ADMIN_EMAILS.includes(userEmail) ? 'admin' 
        : PARCEIRO_EMAILS.includes(userEmail) ? 'parceiro_master'
        : 'empresa_gratis'
      // Mesmo com erro, montar fallback para não bloquear o acesso
      setProfile({
        id: userId,
        email: userEmail,
        role,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Pegar sessão inicial
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      if (s?.user) {
        fetchProfile(s.user.id, s.user.email || '')
      } else {
        setLoading(false)
      }
    })

    // Escutar mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s?.user) {
        fetchProfile(s.user.id, s.user.email || '')
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { session, profile, loading }
}
