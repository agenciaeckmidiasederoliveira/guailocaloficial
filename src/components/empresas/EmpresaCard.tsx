import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Phone, Globe, MessageCircle, Heart, Loader2, BadgeCheck, Star } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useFavoritosContext } from "@/contexts/FavoritosContext";
import { isEmpresaAberta, isValidUrl } from "@/lib/utils";
import { useAvaliacaoMedia } from "./AvaliacoesSection";

interface Empresa {
  id: string;
  slug?: string | null;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  telefone: string;
  whatsapp: string;
  foto_principal: string | null;
  plano: "free" | "premium";
  nicho: string | null;
  site?: string | null;
  horario?: string | null;
  verificada?: boolean | null;
}

export function EmpresaCard({ empresa }: { empresa: Empresa }) {
  const { trackEmpresaClick, trackWhatsAppClick, trackSiteClick } = useAnalytics();
  const { isFavorito, toggleFavorito } = useFavoritosContext();
  const [togglingFavorite, setTogglingFavorite] = useState(false);
  const avaliacaoStats = useAvaliacaoMedia(empresa.id);

  const isFav = isFavorito(empresa.id);
  const abertaAgora = isEmpresaAberta(empresa.horario || null);
  const isPremium = empresa.plano === "premium";

  const handleFavoritoClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (togglingFavorite) return;
    setTogglingFavorite(true);
    await toggleFavorito(empresa.id);
    setTogglingFavorite(false);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    trackWhatsAppClick(empresa.id);
    window.open(`https://wa.me/55${empresa.whatsapp.replace(/\D/g, "")}`, "_blank", "noopener,noreferrer");
  };

  const handleSiteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (empresa.site && isValidUrl(empresa.site)) {
      trackSiteClick(empresa.id);
      window.open(empresa.site, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Link
      to={`/empresa/${empresa.slug || empresa.id}`}
      onClick={() => trackEmpresaClick(empresa.id)}
      className="block group"
    >
      <div className={`rounded-2xl overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        isPremium
          ? "shadow-md ring-2 ring-amber-400"
          : "shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-slate-100"
      }`}>

        {/* Image — object-contain para mostrar o logo completo */}
        <div className="relative h-44 bg-white flex items-center justify-center overflow-hidden border-b border-slate-50">
          {empresa.foto_principal ? (
            <img
              src={empresa.foto_principal}
              alt={empresa.nome}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center">
              <span className="text-6xl font-black text-slate-200 select-none">
                {empresa.nome.charAt(0)}
              </span>
            </div>
          )}

          {/* Premium badge */}
          {isPremium && (
            <span className="absolute top-3 left-3 flex items-center gap-1 bg-amber-400 text-slate-900 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
              ⭐ Premium
            </span>
          )}

          {/* Aberto badge */}
          {abertaAgora && (
            <span className="absolute top-3 left-3 mt-7 flex items-center gap-1.5 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Aberto
            </span>
          )}

          {/* Favorito */}
          <button
            onClick={handleFavoritoClick}
            disabled={togglingFavorite}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-md border border-slate-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-all disabled:opacity-50"
            aria-label={isFav ? "Remover favorito" : "Adicionar favorito"}
          >
            {togglingFavorite
              ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              : <Heart className={`w-4 h-4 ${isFav ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
            }
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Nome + verificada */}
          <div className="flex items-center gap-1.5 mb-1">
            <h3 className="font-bold text-slate-900 text-[15px] leading-snug line-clamp-1 group-hover:text-emerald-700 transition-colors">
              {empresa.nome}
            </h3>
            {empresa.verificada && (
              <BadgeCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            )}
          </div>

          {/* Nicho pill */}
          {empresa.nicho && (
            <span className="inline-block bg-slate-100 text-slate-500 text-[11px] font-semibold px-2.5 py-0.5 rounded-full mb-2">
              {empresa.nicho}
            </span>
          )}

          {/* Rating */}
          {avaliacaoStats.total > 0 && (
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`w-3 h-3 ${i < Math.round(avaliacaoStats.media) ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-200"}`} />
              ))}
              <span className="text-[11px] text-slate-400 font-semibold ml-1">({avaliacaoStats.total})</span>
            </div>
          )}

          {/* Localização */}
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold mb-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{empresa.cidade}, {empresa.estado}</span>
          </div>

          {/* Telefone */}
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-4">
            <Phone className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{empresa.telefone}</span>
          </div>

          {/* Botões de ação */}
          {(empresa.whatsapp || (empresa.site && isValidUrl(empresa.site))) && (
            <div className="flex gap-2 border-t border-slate-100 pt-3">
              {empresa.whatsapp && (
                <button
                  onClick={handleWhatsAppClick}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-xl hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </button>
              )}
              {empresa.site && isValidUrl(empresa.site) && (
                <button
                  onClick={handleSiteClick}
                  className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Site
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
