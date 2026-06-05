import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Verificar se já dispensou nos últimos 7 dias
    const lastDismissed = localStorage.getItem('pwa_dismissed')
    if (lastDismissed) {
      const daysSince = (Date.now() - parseInt(lastDismissed)) / (1000 * 60 * 60 * 24)
      if (daysSince < 7) return
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Mostrar banner sutil após 10 segundos para não ser intrusivo
      setTimeout(() => setShowBanner(true), 10000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('pwa_dismissed', Date.now().toString())
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl p-5 shadow-2xl border border-blue-100 z-50 flex items-start gap-4 animate-in slide-in-from-bottom-5">
      <div className="bg-blue-50 p-3 rounded-xl flex-shrink-0">
        <Download className="w-6 h-6 text-emerald-600" />
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-900 text-sm">Instale o Guia Local BR</h4>
        <p className="text-xs text-gray-600 mt-1 mb-3">Tenha acesso rápido a todas as empresas da sua cidade direto na tela inicial.</p>
        <div className="flex gap-2">
          <button 
            onClick={handleInstall}
            className="bg-emerald-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors flex-1"
          >
            Instalar agora
          </button>
          <button 
            onClick={handleDismiss}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Agora não
          </button>
        </div>
      </div>
      <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 absolute top-3 right-3">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
