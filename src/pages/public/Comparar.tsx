import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Check, X, ArrowLeft, ExternalLink, MessageCircle } from 'lucide-react'

export default function Comparar() {
  const [searchParams] = useSearchParams()
  const [empresas, setEmpresas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const ids = searchParams.get('ids')?.split(',') || []

  useEffect(() => {
    async function carregarEmpresas() {
      if (ids.length === 0) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('empresas')
        .select('*, cidades(nome), categorias(nome)')
        .in('id', ids)
      
      if (!error && data) {
        setEmpresas(data)
      }
      setLoading(false)
    }

    carregarEmpresas()
  }, [searchParams])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando comparação...</div>
  }

  if (empresas.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold mb-2">Nenhuma empresa selecionada</h2>
        <p className="text-gray-600 mb-6">Você precisa selecionar empresas para comparar.</p>
        <Link to="/" className="text-emerald-600 hover:underline">Voltar para a Home</Link>
      </div>
    )
  }

  // Verifica se a empresa A tem um valor melhor que a B (apenas para nota_media no momento)
  const isBest = (empresa: any, field: string) => {
    if (field === 'nota') {
      const maxNota = Math.max(...empresas.map(e => e.nota_media || 0))
      return (empresa.nota_media || 0) === maxNota && maxNota > 0
    }
    if (field === 'score') {
      const maxScore = Math.max(...empresas.map(e => e.score || 0))
      return (empresa.score || 0) === maxScore && maxScore > 0
    }
    return false
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link to="/" className="text-gray-500 hover:text-gray-900 flex items-center font-medium">
            <ArrowLeft className="w-5 h-5 mr-2" /> Voltar
          </Link>
          <h1 className="text-xl font-bold text-gray-900 ml-8 hidden md:block">
            Comparação de Empresas ({empresas.length}/3)
          </h1>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr>
                <th className="p-6 border-b border-gray-100 w-48 bg-gray-50">
                  <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">Atributos</span>
                </th>
                {empresas.map(emp => (
                  <th key={emp.id} className="p-6 border-b border-l border-gray-100 bg-white min-w-[250px] align-top text-center">
                    {emp.foto_capa ? (
                      <img src={emp.foto_capa} alt={emp.nome} className="w-20 h-20 rounded-full object-cover mx-auto mb-4 border-4 border-gray-50" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-100 mx-auto mb-4 flex items-center justify-center text-gray-400 font-bold text-xl">
                        {emp.nome.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <h3 className="font-bold text-lg text-gray-900 mb-1">{emp.nome}</h3>
                    <p className="text-xs text-gray-500">{emp.categorias?.nome} • {emp.cidades?.nome}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Score / Rank */}
              <tr>
                <td className="p-4 border-b border-gray-100 bg-gray-50 text-sm font-bold text-gray-700">Rank (Score)</td>
                {empresas.map(emp => (
                  <td key={emp.id} className={`p-4 border-b border-l border-gray-100 text-center font-bold ${isBest(emp, 'score') ? 'bg-green-50 text-green-700' : 'text-gray-900'}`}>
                    {emp.score || 0}/1000
                  </td>
                ))}
              </tr>
              {/* Avaliação */}
              <tr>
                <td className="p-4 border-b border-gray-100 bg-gray-50 text-sm font-bold text-gray-700">Avaliação Média</td>
                {empresas.map(emp => (
                  <td key={emp.id} className={`p-4 border-b border-l border-gray-100 text-center font-bold ${isBest(emp, 'nota') ? 'bg-green-50 text-green-700' : 'text-gray-900'}`}>
                    ⭐ {emp.nota_media?.toFixed(1) || '5.0'} ({emp.total_avaliacoes || 0} avaliações)
                  </td>
                ))}
              </tr>
              {/* WhatsApp */}
              <tr>
                <td className="p-4 border-b border-gray-100 bg-gray-50 text-sm font-bold text-gray-700">Atendimento WhatsApp</td>
                {empresas.map(emp => (
                  <td key={emp.id} className="p-4 border-b border-l border-gray-100 text-center">
                    {emp.whatsapp_vendas || emp.whatsapp_contato ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              {/* Delivery */}
              <tr>
                <td className="p-4 border-b border-gray-100 bg-gray-50 text-sm font-bold text-gray-700">Faz Delivery?</td>
                {empresas.map(emp => (
                  <td key={emp.id} className="p-4 border-b border-l border-gray-100 text-center">
                    {emp.faz_delivery ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
              {/* Endereço */}
              <tr>
                <td className="p-4 border-b border-gray-100 bg-gray-50 text-sm font-bold text-gray-700">Endereço</td>
                {empresas.map(emp => (
                  <td key={emp.id} className="p-4 border-b border-l border-gray-100 text-center text-sm text-gray-600">
                    {emp.endereco || '-'}
                  </td>
                ))}
              </tr>
              {/* CTAs */}
              <tr>
                <td className="p-6 bg-gray-50"></td>
                {empresas.map(emp => (
                  <td key={emp.id} className="p-6 border-l border-gray-100 text-center space-y-3">
                    <Link 
                      to={`/empresa/${emp.slug}`}
                      className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 rounded-xl transition-colors text-sm"
                    >
                      Ver Perfil <ExternalLink className="w-4 h-4 inline ml-1" />
                    </Link>
                    {(emp.whatsapp_vendas || emp.whatsapp_contato) && (
                      <a 
                        href={`https://wa.me/${(emp.whatsapp_vendas || emp.whatsapp_contato).replace(/\D/g, '')}?text=Ol%C3%A1,%20encontrei%20voc%C3%AAs%20no%20Guia%20Local%20BR.`}
                        target="_blank"
                        rel="noreferrer"
                        className="block w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-sm"
                      >
                        Contatar <MessageCircle className="w-4 h-4 inline ml-1" />
                      </a>
                    )}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
