import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, MapPin, MessageCircle, ChevronLeft, ChevronRight, Star, BadgeCheck } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

const GRADIENT_FALLBACKS = [
  "linear-gradient(135deg,#10B981,#06B6D4)",
  "linear-gradient(135deg,#8B5CF6,#EC4899)",
  "linear-gradient(135deg,#F59E0B,#EF4444)",
  "linear-gradient(135deg,#3B82F6,#8B5CF6)",
  "linear-gradient(135deg,#14B8A6,#22C55E)",
  "linear-gradient(135deg,#F97316,#FBBF24)",
];

export function EmpresasDestaqueCarrossel() {
  const [empresas, setEmpresas] = useState<any[]>([]);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { align: "start", loop: true, dragFree: true },
    [Autoplay({ delay: 4500, stopOnInteraction: true })]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("empresas")
        .select("id, slug, nome, cidade, estado, whatsapp, nicho, foto_principal, plano, verificada")
        .eq("status", "aprovado")
        .order("plano", { ascending: false })
        .limit(14);
      if (data) setEmpresas(data);
    }
    load();
  }, []);

  if (empresas.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-slate-50 border-y border-slate-100">
      <div className="container">

        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-1 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 text-[11px] font-black uppercase tracking-[2px]">Vagas rotativas</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Empresas em <span className="text-emerald-600">Destaque</span>
            </h2>
            <p className="text-slate-500 text-sm mt-1">Negócios verificados prontos para te atender agora</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={scrollPrev} className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:border-emerald-500 hover:text-emerald-600 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={scrollNext} className="w-10 h-10 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:border-emerald-500 hover:text-emerald-600 transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 md:gap-5 pb-2">
            {empresas.map((empresa, idx) => {
              const isPremium = empresa.plano === "premium";
              const fallback = GRADIENT_FALLBACKS[idx % GRADIENT_FALLBACKS.length];

              return (
                <div key={idx} className="flex-[0_0_260px] md:flex-[0_0_285px] min-w-0 flex-shrink-0">
                  <Link
                    to={`/empresa/${empresa.slug || empresa.id}`}
                    className={`block rounded-2xl overflow-hidden bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl group ${
                      isPremium
                        ? "ring-2 ring-amber-400 shadow-[0_4px_20px_rgba(251,191,36,0.2)]"
                        : "border border-slate-100 shadow-sm"
                    }`}
                  >
                    {/* Image */}
                    <div className="relative h-44 bg-white border-b border-slate-50 flex items-center justify-center overflow-hidden">
                      {empresa.foto_principal ? (
                        <img
                          src={empresa.foto_principal}
                          alt={empresa.nome}
                          className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: fallback }}>
                          <span className="text-5xl font-black text-white/30 select-none">{empresa.nome?.charAt(0)}</span>
                        </div>
                      )}

                      {isPremium && (
                        <span className="absolute top-3 left-3 flex items-center gap-1 bg-amber-400 text-slate-900 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                          ⭐ Premium
                        </span>
                      )}
                      {empresa.verificada && (
                        <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white shadow flex items-center justify-center">
                          <BadgeCheck className="w-4 h-4 text-emerald-500" />
                        </div>
                      )}
                      {empresa.nicho && (
                        <span className="absolute bottom-3 left-3 bg-slate-900/70 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {empresa.nicho}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-black text-slate-900 text-[15px] leading-tight line-clamp-1 mb-1.5 group-hover:text-emerald-700 transition-colors">
                        {empresa.nome}
                      </h3>
                      <div className="flex items-center gap-1 text-slate-400 text-xs font-semibold mb-3">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{empresa.cidade} · {empresa.estado}</span>
                      </div>
                      <div className="flex items-center gap-0.5 mb-4">
                        {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                        <span className="text-[11px] text-slate-400 font-semibold ml-1.5">5.0</span>
                      </div>
                      {empresa.whatsapp && (
                        <a
                          href={`https://wa.me/55${empresa.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center justify-center gap-2 w-full border border-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-xl hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all"
                        >
                          <MessageCircle className="w-4 h-4" />
                          WhatsApp
                        </a>
                      )}
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-8">
          <Link to="/busca" className="inline-flex items-center gap-2 text-slate-600 font-bold text-sm border border-slate-200 hover:border-emerald-400 hover:text-emerald-600 px-6 py-3 rounded-full transition-all">
            Ver todas as empresas <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
