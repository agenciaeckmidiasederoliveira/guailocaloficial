import { supabase } from './supabase'

export type AnalyticsEventType =
  | 'page_view'
  | 'whatsapp_click'
  | 'site_click'
  | 'phone_click'
  | 'favorito_add'
  | 'favorito_remove'
  | 'busca'
  | 'foto_view'
  | 'avaliacao_enviada'
  | 'banner_click'

type TrackMetadata = Record<string, unknown>

const SESSION_KEY = 'guialocalbr_session_id'

function getSessionId() {
  try {
    const current = sessionStorage.getItem(SESSION_KEY)
    if (current) return current

    const next = crypto.randomUUID()
    sessionStorage.setItem(SESSION_KEY, next)
    return next
  } catch {
    return crypto.randomUUID()
  }
}

export async function trackEvent(
  tipo: AnalyticsEventType,
  empresaId?: string | null,
  metadata?: TrackMetadata
) {
  try {
    const { data } = await supabase.auth.getUser()

    const payload = {
      tipo,
      empresa_id: empresaId || null,
      user_id: data.user?.id || null,
      session_id: getSessionId(),
      referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      cidade: typeof metadata?.cidade === 'string' ? metadata.cidade : null,
      termo_busca: typeof metadata?.termo === 'string' ? metadata.termo : null,
      metadata: metadata || null,
    }

    await supabase.from('analytics_events').insert(payload)
  } catch {
    // Falha silenciosa para nunca bloquear a UX.
  }
}

export function registrarEvento(tipo: AnalyticsEventType, dados: TrackMetadata = {}) {
  void trackEvent(tipo, (dados.empresa_id as string | undefined) || null, dados)
}

export const verCidade = (cidadeId: string, cidadeNome?: string) =>
  trackEvent('page_view', null, { cidade_id: cidadeId, cidade: cidadeNome, origem: 'pagina_cidade' })

export const verEmpresa = (empresaId: string, cidade?: string) =>
  trackEvent('page_view', empresaId, { cidade, origem: 'perfil_empresa' })

export const clicarWhatsapp = (empresaId: string, metadata: TrackMetadata = {}) =>
  trackEvent('whatsapp_click', empresaId, metadata)

export const clicarSite = (empresaId: string, metadata: TrackMetadata = {}) =>
  trackEvent('site_click', empresaId, metadata)

export const clicarTelefone = (empresaId: string, metadata: TrackMetadata = {}) =>
  trackEvent('phone_click', empresaId, metadata)

export const realizarBusca = (termo: string, cidade?: string) =>
  trackEvent('busca', null, { termo, cidade })

export const verBanner = (empresaId: string, tipo: string) =>
  trackEvent('banner_click', empresaId, { tipo })
