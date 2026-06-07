import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const BANNER_GRADIENTS = [
  "linear-gradient(135deg,#0A3D28,#115E40)",
  "linear-gradient(135deg,#0A1A3D,#122A5E)",
  "linear-gradient(135deg,#2D1B3D,#4A2D64)",
  "linear-gradient(135deg,#3D280A,#5E4011)",
];

export function BannersGrandes() {
  const [banners, setBanners] = useState<any[]>([]);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "center" },
    [Autoplay({ delay: 5000, stopOnInteraction: false })]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const update = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", update);
    return () => { emblaApi.off("select", update); };
  }, [emblaApi]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("empresas")
        .select("slug, nome, foto_principal, nicho, cidade, estado")
        .eq("status", "aprovado")
        .eq("destaque_banner", true)
        .limit(5);

      if (data && data.length > 0) {
        setBanners(data);
      } else {
        setBanners([
          { nome: "Anuncie Aqui no Destaque Banner", nicho: "Seja visto por milhares de clientes locais", placeholder: true, cidade: "Todo o Brasil", estado: "" },
          { nome: "Seu Negócio em Destaque", nicho: "Aumente suas vendas e alcance novos clientes", placeholder: true, cidade: "Sua Cidade", estado: "" },
          { nome: "Plano Premium — Vagas Limitadas", nicho: "Apareça no topo antes dos concorrentes", placeholder: true, cidade: "Brasil", estado: "" },
        ]);
      }
    }
    load();
  }, []);

  if (banners.length === 0) return null;

  return (
    <section className="py-6 bg-white">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl shadow-xl" ref={emblaRef}>
          <div className="flex">
            {banners.map((banner, idx) => (
              <div
                key={idx}
                className="flex-[0_0_100%] min-w-0 relative h-[220px] md:h-[300px] lg:h-[360px] overflow-hidden"
              >
                {/* Background */}
                {banner.foto_principal ? (
                  <>
                    <img src={banner.foto_principal} alt={banner.nome} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                  </>
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ background: BANNER_GRADIENTS[idx % BANNER_GRADIENTS.length] }}
                  />
                )}

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 text-white">
                  {banner.placeholder && (
                    <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur border border-white/30 text-white text-[10px] font-black uppercase tracking-[2px] px-3 py-1 rounded-full w-fit mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Espaço Publicitário
                    </span>
                  )}
                  {(banner.cidade || banner.estado) && !banner.placeholder && (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full w-fit mb-4">
                      📍 {banner.cidade}{banner.estado ? ` · ${banner.estado}` : ""}
                    </span>
                  )}
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-black leading-tight drop-shadow-lg mb-2 max-w-xl">
                    {banner.nome}
                  </h2>
                  <p className="text-white/80 text-sm md:text-base font-medium max-w-md">
                    {banner.nicho}
                  </p>
                  {banner.slug && (
                    <Link
                      to={`/empresa/${banner.slug}`}
                      className="mt-6 inline-flex items-center gap-2 bg-white text-slate-900 font-black text-sm px-5 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-all w-fit shadow-lg"
                    >
                      Conhecer Empresa <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                  {banner.placeholder && (
                    <Link
                      to="/planos"
                      className="mt-6 inline-flex items-center gap-2 bg-emerald-500 text-white font-black text-sm px-5 py-2.5 rounded-xl hover:bg-emerald-600 transition-all w-fit shadow-lg"
                    >
                      Anunciar Aqui <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation arrows */}
          <button
            onClick={scrollPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-all z-10"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={scrollNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center text-white hover:bg-white/40 transition-all z-10"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`rounded-full transition-all ${i === selectedIndex ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
