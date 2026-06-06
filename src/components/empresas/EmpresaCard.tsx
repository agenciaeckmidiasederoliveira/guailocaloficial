import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { BadgePremium } from "@/components/ui/badge-premium";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Globe, MessageCircle, Heart, Loader2, Check } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useFavoritosContext } from "@/contexts/FavoritosContext";
import { isEmpresaAberta, isValidUrl } from "@/lib/utils";
import { useAvaliacaoMedia } from "./AvaliacoesSection";
import { StarRatingDisplay } from "./StarRating";

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

interface EmpresaCardProps {
  empresa: Empresa;
}

export function EmpresaCard({ empresa }: EmpresaCardProps) {
  const { trackEmpresaClick, trackWhatsAppClick, trackSiteClick } = useAnalytics();
  const { isFavorito, toggleFavorito } = useFavoritosContext();
  const [togglingFavorite, setTogglingFavorite] = useState(false);
  const avaliacaoStats = useAvaliacaoMedia(empresa.id);

  const isFav = isFavorito(empresa.id);
  const abertaAgora = isEmpresaAberta(empresa.horario || null);

  const handleClick = () => {
    trackEmpresaClick(empresa.id);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    trackWhatsAppClick(empresa.id);
    const phone = empresa.whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/55${phone}`, "_blank", "noopener,noreferrer");
  };

  const handleSiteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (empresa.site && isValidUrl(empresa.site)) {
      trackSiteClick(empresa.id);
      window.open(empresa.site, "_blank", "noopener,noreferrer");
    }
  };

  const handleFavoritoClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (togglingFavorite) return;
    
    setTogglingFavorite(true);
    await toggleFavorito(empresa.id);
    setTogglingFavorite(false);
  };

  const hasQuickActions = empresa.whatsapp || (empresa.site && isValidUrl(empresa.site));

  return (
    <Link to={`/empresa/${empresa.slug || empresa.id}`} onClick={handleClick} className="block touch-target">
      <Card className="group overflow-hidden transition-all hover-lift hover:border-secondary">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
          {empresa.foto_principal ? (
            <img
              src={empresa.foto_principal}
              alt={empresa.nome}
              loading="lazy"
              decoding="async"
              width={400}
              height={225}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
              <span className="text-4xl font-bold text-primary/30">
                {empresa.nome.charAt(0)}
              </span>
            </div>
          )}
          
          {/* Top badges row */}
          <div className="absolute inset-x-2 top-2 flex items-start justify-between">
            <div className="flex flex-col gap-1">
              {empresa.plano === "premium" && <BadgePremium size="sm" />}
              {abertaAgora && (
                <Badge className="bg-green-500 hover:bg-green-600 text-white text-[10px] px-1.5 py-0.5">
                  Aberto
                </Badge>
              )}
            </div>
            
            {/* Favorito button */}
            <button
              onClick={handleFavoritoClick}
              disabled={togglingFavorite}
              className="rounded-full bg-background/80 p-1.5 backdrop-blur transition-colors hover:bg-background disabled:opacity-50"
              aria-label={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              {togglingFavorite ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Heart
                  className={`h-4 w-4 transition-colors ${
                    isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"
                  }`}
                />
              )}
            </button>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display text-lg font-semibold text-foreground line-clamp-1">
              {empresa.nome}
            </h3>
            {empresa.verificada && (
              <div 
                className="flex items-center justify-center rounded-full bg-green-500 p-0.5" 
                title="Empresa Verificada"
              >
                <Check className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
          {empresa.nicho && (
            <span className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {empresa.nicho}
            </span>
          )}
          {avaliacaoStats.total > 0 && (
            <div className="mt-1">
              <StarRatingDisplay rating={avaliacaoStats.media} count={avaliacaoStats.total} />
            </div>
          )}
          <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">
              {empresa.cidade}, {empresa.estado}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Phone className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{empresa.telefone}</span>
          </div>

          {hasQuickActions && (
            <div className="mt-3 flex gap-2 border-t border-border pt-3">
              {empresa.whatsapp && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleWhatsAppClick}
                  className="flex-1 gap-1.5 text-xs min-h-[40px] hover:bg-green-50 hover:text-green-600 hover:border-green-300"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </Button>
              )}
              {empresa.site && isValidUrl(empresa.site) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSiteClick}
                  className="flex-1 gap-1.5 text-xs min-h-[40px] hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Site
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
