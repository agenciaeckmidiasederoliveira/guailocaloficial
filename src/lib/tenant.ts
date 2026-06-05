/**
 * Multi-tenant resolution helper.
 *
 * Resolve o tenant ativo com base no hostname atual:
 *  - Subdomínio de guialocalbr.com.br (ex: maringa.guialocalbr.com.br) → busca pelo slug "maringa"
 *  - Domínio customizado (ex: guiamaringa.com.br) → busca por dominio_customizado
 *  - Domínio raiz / Lovable preview / localhost → null (sem filtro de tenant)
 *
 * O resultado é cacheado em memória pela sessão para evitar refetch.
 */

import { supabase } from "@/integrations/supabase/client";

export interface Tenant {
  id: string;
  slug: string;
  nome_cidade: string;
  uf: string;
  parceiro_id: string | null;
  dominio_customizado: string | null;
  subdominio: string | null;
  ativo: boolean;
}

const ROOT_DOMAINS = new Set([
  "guialocalbr.com.br",
  "www.guialocalbr.com.br",
  "guia-local-br.lovable.app",
  "localhost",
  "127.0.0.1",
]);

const LOVABLE_PREVIEW_SUFFIXES = [".lovable.app", ".lovableproject.com"];

let cachedPromise: Promise<Tenant | null> | null = null;
let cachedHostname: string | null = null;

function isRootOrPreviewHost(hostname: string): boolean {
  if (ROOT_DOMAINS.has(hostname)) return true;
  return LOVABLE_PREVIEW_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
}

function extractSubdomain(hostname: string, root: string): string | null {
  if (!hostname.endsWith("." + root)) return null;
  const sub = hostname.slice(0, -1 * (root.length + 1));
  // Ignora www e variações vazias
  if (!sub || sub === "www") return null;
  // Pega apenas o primeiro segmento (ex: "maringa.app" → "maringa")
  return sub.split(".")[0];
}

export async function getTenantFromURL(): Promise<Tenant | null> {
  if (typeof window === "undefined") return null;
  const hostname = window.location.hostname.toLowerCase();

  if (cachedPromise && cachedHostname === hostname) {
    return cachedPromise;
  }
  cachedHostname = hostname;

  cachedPromise = (async () => {
    // 1) Subdomínio de guialocalbr.com.br
    const sub = extractSubdomain(hostname, "guialocalbr.com.br");
    if (sub) {
      const { data } = await supabase
        .from("tenants" as any)
        .select("*")
        .eq("slug", sub)
        .eq("ativo", true)
        .maybeSingle();
      if (data) return data as unknown as Tenant;
    }

    // 2) Domínio raiz / preview → sem tenant
    if (isRootOrPreviewHost(hostname)) {
      return null;
    }

    // 3) Domínio customizado
    const { data } = await supabase
      .from("tenants" as any)
      .select("*")
      .eq("dominio_customizado", hostname)
      .eq("ativo", true)
      .maybeSingle();
    if (data) return data as unknown as Tenant;

    return null;
  })();

  return cachedPromise;
}

/**
 * Versão síncrona usada em UI: retorna `undefined` enquanto carrega.
 * Use junto com useState/useEffect.
 */
export function clearTenantCache() {
  cachedPromise = null;
  cachedHostname = null;
}
