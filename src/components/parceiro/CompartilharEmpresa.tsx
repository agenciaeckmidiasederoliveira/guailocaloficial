import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { QRCodeCanvas as QRCode } from 'qrcode.react'
import { Download, CheckCircle, Share2, Copy } from 'lucide-react'

interface CompartilharProps {
  empresa: any
}

export default function CompartilharEmpresa({ empresa }: CompartilharProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [gerando, setGerando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const urlEmpresa = `https://guialocalbr.com.br/empresa/${empresa?.slug}`
  
  const legendaSugerida = `🌟 Já conheceu a ${empresa?.nome}? 🌟\n\nAgora você nos encontra no maior guia de negócios da nossa cidade!\nConfira nosso perfil verificado, avaliações reais e horários de funcionamento.\n\nAcesse pelo link na bio ou leia o QR Code na imagem!\n\n#GuiaLocalBR #${empresa?.cidades?.nome.replace(/\s+/g, '')} #${empresa?.categorias?.nome.replace(/\s+/g, '')} #NegocioLocal`

  const gerarEBaixar = async () => {
    if (!cardRef.current) return
    setGerando(true)
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // alta resolução
        useCORS: true, // para imagens externas
        backgroundColor: '#ffffff'
      })
      
      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = `post-${empresa?.slug}.png`
      link.click()
    } catch (err) {
      console.error("Erro ao gerar card:", err)
      alert("Houve um erro ao gerar a imagem. Tente novamente.")
    } finally {
      setGerando(false)
    }
  }

  const copiarLegenda = () => {
    navigator.clipboard.writeText(legendaSugerida)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (!empresa) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900 flex items-center"><Share2 className="w-5 h-5 mr-2 text-emerald-600"/> Compartilhar no Instagram</h3>
          <p className="text-gray-500 text-sm mt-1">Gere um card profissional para postar nas suas redes sociais.</p>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Lado Esquerdo: O Canvas invisivel ou visivel em scale menor */}
        <div>
          <div className="bg-gray-100 p-4 rounded-xl flex items-center justify-center overflow-hidden">
            <div 
              ref={cardRef} 
              className="bg-white relative shadow-xl" 
              style={{ width: '540px', height: '540px', transform: 'scale(0.65)', transformOrigin: 'top left', marginBottom: '-180px' }}
            >
              {/* Background Elements */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent"></div>
              
              <div className="p-10 h-full flex flex-col">
                {/* Header Logo */}
                <div className="flex justify-between items-start mb-10">
                  <h2 className="text-3xl font-black text-emerald-600 tracking-tighter">Guia Local BR<span className="text-[#10b981]">.</span></h2>
                  <div className="flex items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-full font-bold">
                    <CheckCircle className="w-5 h-5 mr-2" /> Empresa Verificada
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="flex-1 flex flex-col justify-center">
                  <span className="text-gray-500 font-bold uppercase tracking-widest mb-4 block text-lg">
                    {empresa?.categorias?.nome} em {empresa?.cidades?.nome}
                  </span>
                  <h1 className="text-6xl font-black text-gray-900 leading-tight mb-6">
                    {empresa?.nome}
                  </h1>
                  
                  {empresa?.plano === 'premium' || empresa?.plano === 'turbo' ? (
                    <div className="inline-flex items-center bg-gradient-to-r from-yellow-400 to-yellow-600 text-white font-bold px-6 py-3 rounded-xl text-xl shadow-lg w-max">
                      🏆 Escolha Premium da Cidade
                    </div>
                  ) : null}
                </div>

                {/* Footer com QR Code */}
                <div className="border-t-2 border-gray-100 pt-8 flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 font-medium mb-1 text-lg">Aponte a câmera e veja o perfil completo</p>
                    <p className="text-emerald-600 font-bold text-2xl">{urlEmpresa.replace('https://', '')}</p>
                  </div>
                  <div className="p-2 bg-white rounded-xl shadow-md border border-gray-100">
                    <QRCode value={urlEmpresa} size={100} level="H" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Direito: Ações */}
        <div className="flex flex-col justify-center space-y-6">
          <button 
            onClick={gerarEBaixar}
            disabled={gerando}
            className="w-full bg-emerald-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {gerando ? 'Gerando Imagem...' : <><Download className="w-6 h-6 mr-2" /> Baixar Post para Instagram (PNG)</>}
          </button>

          <div className="bg-blue-50 p-5 rounded-xl border border-blue-100">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-blue-900">Legenda Sugerida (IA)</h4>
              <button 
                onClick={copiarLegenda}
                className="text-emerald-600 hover:text-blue-800 flex items-center text-sm font-bold bg-white px-3 py-1 rounded shadow-sm"
              >
                {copiado ? <CheckCircle className="w-4 h-4 mr-1"/> : <Copy className="w-4 h-4 mr-1"/>}
                {copiado ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="text-sm text-blue-800 whitespace-pre-wrap font-medium">
              {legendaSugerida}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
