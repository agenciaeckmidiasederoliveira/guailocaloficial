import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { CheckCircle, MapPin, Star, ArrowRight } from 'lucide-react'

export default function Checkin() {
  const { slug } = useParams()
  const [empresa, setEmpresa] = useState<any>(null)
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    async function realizarCheckin() {
      try {
        // 1. Buscar a empresa pelo slug
        const { data: emp, error: errEmp } = await supabase
          .from('empresas')
          .select('id, nome, foto_capa, nota_media, cidades(nome)')
          .eq('slug', slug)
          .single()

        if (errEmp || !emp) throw new Error('Empresa não encontrada.')
        setEmpresa(emp)

        // Simulação simples de sessão (na prática seria um cookie/IP tracking no backend)
        const sessaoId = localStorage.getItem('glb_session_id') || Math.random().toString(36).substring(7)
        localStorage.setItem('glb_session_id', sessaoId)

        // 2. Tentar registrar checkin no banco
        const { error: errCheck } = await supabase.from('checkins').insert({
          empresa_id: emp.id,
          sessao_id: sessaoId
        })

        if (errCheck) {
          // Se falhar silenciosamente (ex: anti-spam constraint), a gente ignora pro usuário final
          console.warn('Checkin não computado:', errCheck)
        } else {
          // Incrementa os contadores da empresa via RPC ou apenas deixa pra um trigger no banco
          // Vamos atualizar o contador total manual só pra garantir
          const { data: currentCounters } = await supabase.from('empresas').select('total_checkins, checkins_mes_atual').eq('id', emp.id).single()
          if (currentCounters) {
            await supabase.from('empresas').update({
              total_checkins: (currentCounters.total_checkins || 0) + 1,
              checkins_mes_atual: (currentCounters.checkins_mes_atual || 0) + 1
            }).eq('id', emp.id)
          }
        }

        setStatus('success')
        setMensagem('Check-in realizado com sucesso!')
      } catch (err: any) {
        setStatus('error')
        setMensagem(err.message)
      }
    }

    if (slug) realizarCheckin()
  }, [slug])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
        <p className="text-gray-600 font-bold">Registrando sua visita...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Ops!</h2>
        <p className="text-gray-600 mb-6">{mensagem}</p>
        <Link to="/" className="text-emerald-600 hover:underline">Ir para a Home</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">
      {/* Imagem de Capa */}
      <div className="h-64 bg-gray-200 relative">
        {empresa?.foto_capa ? (
          <img src={empresa.foto_capa} alt={empresa.nome} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-indigo-800"></div>
        )}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Conteúdo do Check-in */}
      <div className="flex-1 -mt-20 px-4 pb-12 relative z-10 flex flex-col items-center">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center border border-gray-100">
          
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-white">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-2">Check-in Realizado!</h1>
          <p className="text-gray-500 mb-6 font-medium">Você registrou sua visita na empresa:</p>

          <h2 className="text-2xl font-bold text-blue-900 mb-1">{empresa?.nome}</h2>
          <p className="text-gray-500 flex items-center justify-center text-sm mb-4">
            <MapPin className="w-4 h-4 mr-1" /> {empresa?.cidades?.nome}
          </p>

          <div className="flex items-center justify-center text-amber-500 font-bold mb-8 bg-amber-50 w-max mx-auto px-4 py-2 rounded-full">
            <Star className="w-4 h-4 mr-1 fill-amber-500" /> {empresa?.nota_media || 5.0} de avaliação
          </div>

          <hr className="border-gray-100 mb-8" />

          <h3 className="font-bold text-gray-900 mb-4">Gostou da experiência?</h3>
          <p className="text-sm text-gray-600 mb-6">Ajude outras pessoas deixando sua avaliação sincera no Guia Local BR.</p>

          <div className="space-y-3">
            <Link 
              to={`/empresa/${slug}#avaliar`}
              className="block w-full bg-emerald-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-blue-200"
            >
              Avaliar Empresa
            </Link>
            
            <Link 
              to={`/empresa/${slug}`}
              className="block w-full bg-white hover:bg-gray-50 text-emerald-600 font-bold py-4 rounded-xl border border-blue-200 transition-colors flex justify-center items-center"
            >
              Ver perfil completo <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
