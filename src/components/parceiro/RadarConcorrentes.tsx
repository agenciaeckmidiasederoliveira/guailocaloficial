import { useState, useEffect } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts'
import { AlertTriangle, Crosshair, CheckCircle, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface RadarConcorrentesProps {
  empresaId: string
  scoreEmpresa: number
}

export default function RadarConcorrentes({ empresaId, scoreEmpresa }: RadarConcorrentesProps) {
  const [analise, setAnalise] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Exemplo de dados fictícios para o gráfico (na prática, viriam do backend calculados)
  const chartData = [
    { subject: 'Fotos/Mídia', A: 80, B: 60, fullMark: 100 },
    { subject: 'Avaliações', A: 45, B: 85, fullMark: 100 },
    { subject: 'Infos (Horários)', A: 100, B: 90, fullMark: 100 },
    { subject: 'Cliques WhatsApp', A: 30, B: 75, fullMark: 100 },
    { subject: 'Visitas Perfil', A: 50, B: 80, fullMark: 100 },
    { subject: 'Resposta a Leads', A: 20, B: 65, fullMark: 100 },
  ]

  const gerarRadar = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: fnError } = await supabase.functions.invoke('radar-concorrentes', {
        body: { empresa_id: empresaId }
      })

      if (fnError) throw fnError
      if (data.error) throw new Error(data.error)

      setAnalise(data.analise)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Erro ao gerar análise de concorrentes.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    gerarRadar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId])

  if (loading && !analise) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-gray-200">
        <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
        <p className="text-gray-600 font-medium">A IA está varrendo a cidade e analisando a concorrência...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Crosshair className="w-5 h-5 mr-2 text-indigo-600"/> Radar de Concorrentes (IA)
          </h3>
          <p className="text-gray-500 text-sm mt-1">Descubra o que falta para sua empresa dominar a região.</p>
        </div>
        <button 
          onClick={gerarRadar} 
          disabled={loading}
          className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center"
        >
          {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin"/> : <RefreshCw className="w-4 h-4 mr-2"/>}
          Atualizar Análise
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Lado Esquerdo: Gráfico Radar */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm h-80 flex flex-col items-center">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Desempenho vs Média Local</h4>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
              <Radar name="Sua Empresa" dataKey="A" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.5} />
              <Radar name="Média da Categoria" dataKey="B" stroke="#9ca3af" fill="#e5e7eb" fillOpacity={0.5} strokeDasharray="5 5" />
              <Legend wrapperStyle={{ fontSize: '12px' }}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Lado Direito: Insights da IA */}
        {error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        ) : analise ? (
          <div className="space-y-6">
            <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl">
              <h4 className="text-indigo-900 font-bold mb-2">Estratégia Recomendada</h4>
              <p className="text-indigo-800 text-sm">{analise.resumo_posicao}</p>
              <p className="text-indigo-900 text-sm mt-3 font-medium bg-white p-3 rounded border border-indigo-200">
                💡 {analise.estrategia_recomendada}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 text-amber-500" /> O que você precisa arrumar agora:
              </h4>
              <div className="space-y-3">
                {analise.gaps_criticos?.map((gap: any, i: number) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-gray-900 text-sm">{gap.gap}</span>
                      <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full ${
                        gap.dificuldade === 'fácil' ? 'bg-green-100 text-green-700' :
                        gap.dificuldade === 'médio' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {gap.dificuldade}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Impacto: {gap.impacto_estimado}</p>
                    <button className="text-xs font-bold text-emerald-600 hover:text-blue-800 self-start">
                      → {gap.acao}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" /> Suas Vantagens Competitivas:
              </h4>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                {analise.vantagens_competitivas?.map((vant: string, i: number) => (
                  <li key={i}>{vant}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
