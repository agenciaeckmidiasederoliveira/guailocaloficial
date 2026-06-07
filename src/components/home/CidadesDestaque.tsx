import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Fotos de cidades brasileiras (Unsplash, gratuitas)
const CIDADE_PHOTOS: Record<string, string> = {
  "Pouso Alegre": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Pouso_Alegre_-_Centro_hist%C3%B3rico.jpg/1280px-Pouso_Alegre_-_Centro_hist%C3%B3rico.jpg",
  "Maringá": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Maringa_Cathedral_aerial_view.jpg/1280px-Maringa_Cathedral_aerial_view.jpg",
  "Paiçandu": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&auto=format&fit=crop&q=80",
  "Curitiba": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Curitiba_2012.jpg/1280px-Curitiba_2012.jpg",
  "São Paulo": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Sao-paulo-skyline-2017.jpg/1280px-Sao-paulo-skyline-2017.jpg",
  "Rio de Janeiro": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Rio_de_Janeiro_-_Panoramic_view_of_city_from_Sugarloaf.jpg/1280px-Rio_de_Janeiro_-_Panoramic_view_of_city_from_Sugarloaf.jpg",
  "Belo Horizonte": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Aerial_view_of_Belo_Horizonte.jpg/1280px-Aerial_view_of_Belo_Horizonte.jpg",
  "default": "https://images.unsplash.com/photo-1569949381669-ecf31ae8e613?w=600&auto=format&fit=crop&q=80",
};

const GRADIENT_OVERLAYS = [
  "from-emerald-900/90 to-emerald-700/60",
  "from-blue-900/90 to-blue-700/60",
  "from-purple-900/90 to-purple-700/60",
  "from-slate-900/90 to-slate-700/60",
  "from-amber-900/90 to-amber-700/60",
  "from-rose-900/90 to-rose-700/60",
];

export function CidadesDestaque() {
  const [cidades, setCidades] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("empresas")
        .select("cidade, estado")
        .eq("status", "aprovado");

      if (data) {
        const counts: Record<string, { cidade: string; estado: string; count: number }> = {};
        data.forEach(e => {
          if (!e.cidade || e.cidade === "null") return;
          const key = `${e.cidade}-${e.estado}`;
          if (!counts[key]) counts[key] = { cidade: e.cidade, estado: e.estado, count: 0 };
          counts[key].count++;
        });

        const top = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 6);
        setCidades(top);
      }
    }
    load();
  }, []);

  if (cidades.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-1 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 text-[11px] font-black uppercase tracking-[2px]">Explore por Região</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Cidades em <span className="text-emerald-600">Destaque</span>
            </h2>
            <p className="text-slate-500 text-sm mt-1">Explore negócios nos polos mais ativos do guia</p>
          </div>
          <Link to="/busca" className="text-emerald-600 font-bold text-sm flex items-center gap-1 hover:text-emerald-700 transition-colors">
            Ver todas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid de cidades — primeiro item é 2x maior */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cidades.map((cidade, idx) => {
            const isFirst = idx === 0;
            const photo = CIDADE_PHOTOS[cidade.cidade] || CIDADE_PHOTOS["default"];
            const gradient = GRADIENT_OVERLAYS[idx % GRADIENT_OVERLAYS.length];

            return (
              <Link
                key={idx}
                to={`/busca?cidade=${encodeURIComponent(cidade.cidade)}`}
                className={`relative overflow-hidden rounded-2xl group cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl ${
                  isFirst ? "col-span-2 md:col-span-1 md:row-span-2" : ""
                }`}
                style={{ minHeight: isFirst ? "320px" : "150px" }}
              >
                {/* Photo background */}
                <img
                  src={photo}
                  alt={cidade.cidade}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  onError={e => {
                    (e.target as HTMLImageElement).src = CIDADE_PHOTOS["default"];
                  }}
                />

                {/* Dark gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${gradient}`} />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                      {cidade.count} {cidade.count === 1 ? "Empresa" : "Empresas"}
                    </span>
                  </div>
                  <h3 className={`font-black text-white leading-tight tracking-tight ${isFirst ? "text-2xl md:text-3xl" : "text-lg"}`}>
                    {cidade.cidade}
                  </h3>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-white/60" />
                    <span className="text-white/70 text-xs font-semibold">{cidade.estado}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
