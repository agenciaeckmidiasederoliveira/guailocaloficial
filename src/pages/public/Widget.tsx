import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Star, CheckCircle, ArrowRight } from 'lucide-react'

export default function Widget() {
  const { slug } = useParams()
  const [empresa, setEmpresa] = useState<any>(null)

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('empresas')
        .select('nome, nota_media, total_avaliacoes, plano')
        .eq('slug', slug)
        .single()
      
      if (data) setEmpresa(data)

      // Registrar métrica de visualização do widget
      // Poderiamos ter uma tabela `analytics_widget` pra registrar isso.
    }
    if (slug) carregar()
  }, [slug])

  if (!empresa) return null

  const urlCompleta = `https://guialocalbr.com.br/empresa/${slug}?utm_source=widget`

  return (
    <div className="w-[300px] h-[180px] bg-white border border-emerald-600 rounded-xl shadow-lg flex flex-col overflow-hidden font-sans hover:shadow-xl transition-shadow group relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-white opacity-50 z-0"></div>
      
      <div className="p-4 flex-1 z-10 flex flex-col justify-center">
        <div className="flex items-center text-amber-500 font-bold text-sm mb-2">
          <Star className="w-4 h-4 fill-amber-500 mr-1" />
          {empresa.nota_media?.toFixed(1) || '5.0'}
          <span className="text-gray-400 font-normal ml-1 text-xs">
            ({empresa.total_avaliacoes || 0} avaliações)
          </span>
        </div>
        
        <h3 className="font-black text-gray-900 text-lg leading-tight line-clamp-2 mb-1">
          {empresa.nome}
        </h3>
        
        <div className="flex items-center text-xs text-blue-700 font-bold bg-blue-50 w-max px-2 py-1 rounded">
          <CheckCircle className="w-3 h-3 mr-1" /> Verificado no Guia Local BR
        </div>
      </div>

      <a 
        href={urlCompleta}
        target="_blank"
        rel="noreferrer"
        className="h-10 bg-emerald-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center transition-colors z-10"
      >
        Ver perfil completo <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
      </a>
    </div>
  )
}
