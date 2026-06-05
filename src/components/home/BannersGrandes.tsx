import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink } from "lucide-react";

export function BannersGrandes() {
  const [banners, setBanners] = useState<any[]>([]);
  
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "center" }, [
    Autoplay({ delay: 5000, stopOnInteraction: true }),
  ]);

  useEffect(() => {
    async function load() {
      // Load companies with banner active
      const { data } = await supabase
        .from("empresas")
        .select("slug, nome, foto_principal, nicho")
        .eq("status", "aprovado")
        .eq("destaque_banner", true)
        .limit(2);
      
      // If we don't have enough banners, use placeholders
      if (data && data.length > 0) {
        setBanners(data);
      } else {
        setBanners([
          {
            nome: "Anuncie Aqui",
            nicho: "Seja visto por milhares",
            placeholder: true,
          },
          {
            nome: "Seu Negócio em Destaque",
            nicho: "Aumente suas vendas",
            placeholder: true,
          }
        ]);
      }
    }
    load();
  }, []);

  if (banners.length === 0) return null;

  return (
    <section className="py-8 bg-white border-b border-border">
      <div className="container">
        <div className="overflow-hidden rounded-2xl relative" ref={emblaRef}>
          <div className="flex">
            {banners.map((banner, idx) => (
              <div key={idx} className="flex-[0_0_100%] min-w-0 relative h-[180px] md:h-[250px] lg:h-[300px] bg-slate-900 overflow-hidden">
                {/* Image or gradient */}
                {banner.foto_principal ? (
                  <img src={banner.foto_principal} alt={banner.nome} className="w-full h-full object-cover opacity-60" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary to-emerald-800 opacity-80" />
                )}
                
                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white">
                  {banner.placeholder && (
                    <span className="bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 backdrop-blur-sm border border-white/30">
                      Espaço Publicitário
                    </span>
                  )}
                  <h2 className="text-3xl md:text-5xl font-display font-bold drop-shadow-lg mb-2">
                    {banner.nome}
                  </h2>
                  <p className="text-lg md:text-xl text-white/90 drop-shadow-md">
                    {banner.nicho}
                  </p>
                  
                  {banner.slug && (
                    <a href={`/empresa/${banner.slug}`} className="mt-6 inline-flex items-center justify-center rounded-full bg-white text-slate-900 px-6 py-2 font-semibold hover:bg-slate-100 transition-colors">
                      Conhecer Empresa <ExternalLink className="ml-2 w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
