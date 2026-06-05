import { supabase } from "@/integrations/supabase/client";
import { useGeolocation } from "./useGeolocation";
import { useCallback, useRef } from "react";

// Tipos novos + legados (todos aceitos pela RLS)
type TipoEvento =
  // legados
  | "page_view"
  | "click_empresa"
  | "click_whatsapp"
  | "click_telefone"
  | "click_site"
  | "busca"
  | "favorito_add"
  | "favorito_remove"
  | "cadastro_inicio"
  | "cadastro_completo"
  | "banner_click"
  | "share"
  // novos
  | "whatsapp_click"
  | "site_click"
  | "phone_click"
  | "foto_view"
  | "avaliacao_enviada";

// Session id persistente por aba
function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem("glbr_session_id");
    if (!sid) {
      sid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem("glbr_session_id", sid);
    }
    return sid;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

function getDispositivo(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

function getReferrer(): string {
  return document.referrer || "direct";
}

/**
 * Função global silenciosa para registrar eventos.
 * Nunca lança erro para o usuário. Pode ser chamada de qualquer lugar.
 */
export async function trackEvent(
  tipo: TipoEvento,
  empresaId?: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const sessionId = getSessionId();
    let userId: string | null = null;
    try {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    } catch {
      /* anônimo */
    }

    const payload: Record<string, unknown> = {
      tipo_evento: tipo,
      empresa_id: empresaId || null,
      pagina: typeof window !== "undefined" ? window.location.pathname : null,
      session_id: sessionId,
      user_id: userId,
      dispositivo: typeof navigator !== "undefined" ? getDispositivo() : null,
      referrer: typeof document !== "undefined" ? getReferrer() : null,
      metadata: metadata ?? null,
      busca_termo:
        metadata && typeof metadata.termo === "string"
          ? (metadata.termo as string)
          : null,
    };

    await supabase.from("analytics").insert(payload as never);

    // Best-effort: dispara checagem de marcos quando for view de empresa
    if (tipo === "page_view" && empresaId) {
      supabase
        .rpc("check_empresa_milestones" as never, { p_empresa_id: empresaId } as never)
        .then(() => {});
    }
  } catch (e) {
    if (import.meta.env.DEV) console.warn("[trackEvent] silencioso:", e);
  }
}

/**
 * Hook conveniente para uso em componentes React, com cidade automática.
 */
export function useAnalytics() {
  const { cidade } = useGeolocation();
  const sessionId = useRef(getSessionId());

  const track = useCallback(
    async (
      tipo: TipoEvento,
      empresaId?: string,
      pagina?: string,
      buscaTermo?: string,
      metadata?: Record<string, unknown>,
    ) => {
      try {
        let userId: string | null = null;
        try {
          const { data } = await supabase.auth.getUser();
          userId = data.user?.id ?? null;
        } catch {
          /* anônimo */
        }

        await supabase.from("analytics").insert({
          tipo_evento: tipo,
          empresa_id: empresaId || null,
          pagina: pagina || window.location.pathname,
          cidade_usuario: cidade,
          busca_termo: buscaTermo || null,
          dispositivo: getDispositivo(),
          referrer: getReferrer(),
          session_id: sessionId.current,
          user_id: userId,
          metadata: metadata ?? null,
        } as never);

        if (tipo === "page_view" && empresaId) {
          supabase
            .rpc("check_empresa_milestones" as never, { p_empresa_id: empresaId } as never)
            .then(() => {});
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error("Erro ao registrar analytics:", error);
      }
    },
    [cidade],
  );

  return {
    trackEvent: track,
    trackPageView: useCallback((pagina?: string) => track("page_view", undefined, pagina), [track]),
    trackEmpresaClick: useCallback((id: string) => track("click_empresa", id), [track]),
    trackWhatsAppClick: useCallback((id: string) => track("click_whatsapp", id), [track]),
    trackTelefoneClick: useCallback((id: string) => track("click_telefone", id), [track]),
    trackSiteClick: useCallback((id: string) => track("click_site", id), [track]),
    trackBusca: useCallback(
      (termo: string) => track("busca", undefined, "/busca", termo, { termo, cidade }),
      [track, cidade],
    ),
    trackFavoritoAdd: useCallback((id: string) => track("favorito_add", id), [track]),
    trackFavoritoRemove: useCallback((id: string) => track("favorito_remove", id), [track]),
    trackCadastroInicio: useCallback(() => track("cadastro_inicio", undefined, "/cadastro"), [track]),
    trackCadastroCompleto: useCallback(
      (id: string) => track("cadastro_completo", id, "/cadastro"),
      [track],
    ),
    trackBannerClick: useCallback((id: string) => track("banner_click", id), [track]),
    trackFotoView: useCallback((id: string) => track("foto_view", id), [track]),
    trackAvaliacaoEnviada: useCallback((id: string) => track("avaliacao_enviada", id), [track]),
  };
}
