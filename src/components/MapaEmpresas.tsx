import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Link } from 'react-router-dom'
import { ExternalLink, Star } from 'lucide-react'
import { useEffect } from 'react'

// Corrigir ícone padrão do Leaflet que quebra no React
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface EmpresaMap {
  id: string
  nome: string
  slug: string
  endereco: string
  lat?: number
  lng?: number
  plano: string
  nota_media?: number
  foto_capa?: string
  categorias?: { nome: string }
}

interface MapaEmpresasProps {
  empresas: EmpresaMap[]
  cidadeCenter: { lat: number; lng: number }
  altura?: string
}

function ChangeView({ center }: { center: { lat: number, lng: number } }) {
  const map = useMap()
  useEffect(() => {
    map.setView([center.lat, center.lng], 13)
  }, [center, map])
  return null
}

export default function MapaEmpresas({ empresas, cidadeCenter, altura = '400px' }: MapaEmpresasProps) {
  
  // Custom icons based on plan
  const createIcon = (plano: string) => {
    let color = '#9ca3af' // gratis
    if (plano === 'premium') color = '#2563eb'
    if (plano === 'turbo') color = '#d97706' // amber

    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    })
  }

  // Filtrar apenas empresas que têm lat/lng válidos
  const empresasValidas = empresas.filter(e => e.lat && e.lng)

  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200 z-0 relative" style={{ height: altura }}>
      <MapContainer center={[cidadeCenter.lat, cidadeCenter.lng]} zoom={13} style={{ height: '100%', width: '100%', zIndex: 0 }}>
        <ChangeView center={cidadeCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {empresasValidas.map((empresa) => (
          <Marker 
            key={empresa.id} 
            position={[empresa.lat!, empresa.lng!]}
            icon={createIcon(empresa.plano)}
          >
            <Popup className="custom-popup">
              <div className="w-48">
                {empresa.foto_capa && (
                  <img src={empresa.foto_capa} alt={empresa.nome} className="w-full h-24 object-cover rounded-t-lg mb-2" />
                )}
                <div className="p-2">
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{empresa.nome}</h4>
                  <div className="flex items-center text-xs text-yellow-500 font-bold mb-2">
                    <Star className="w-3 h-3 mr-1" /> {empresa.nota_media || 5.0} 
                    <span className="text-gray-400 font-normal ml-1">• {empresa.categorias?.nome}</span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 mb-3">{empresa.endereco}</p>
                  
                  <Link 
                    to={`/empresa/${empresa.slug}`}
                    className="block w-full text-center bg-emerald-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded transition-colors"
                  >
                    Ver Perfil <ExternalLink className="w-3 h-3 inline ml-1" />
                  </Link>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
