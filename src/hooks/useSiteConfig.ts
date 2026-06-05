import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface SiteConfig {
  subdominio: string
  label: string
  cidades_ids: string[]
}

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig | null>(null)
  
  useEffect(() => {
    const hostname = window.location.hostname
    const sub = hostname.replace('www.', '').split('.')[0]
    
    // Supondo guialocalbr ou localhost sendo a base, se for localhost mockamos nulo
    if (sub === 'guialocalbr' || sub === 'localhost' || sub === '127') {
      setConfig(null)
      return
    }

    // Busca tabela subdominios
    supabase.from('subdominios')
      .select('*')
      .eq('subdominio', sub)
      .single()
      .then(({ data }) => {
        if (data) setConfig(data)
      })
  }, [])
  
  return config
}
