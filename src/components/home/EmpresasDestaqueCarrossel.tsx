import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Star, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PASTEL_COLORS = [
  "bg-emerald-100 text-emerald-500",
  "bg-amber-100 text-amber-500",
  "bg-blue-100 text-blue-500",
  "bg-yellow-100 text-yellow-500",
  "bg-pink-100 text-pink-500",
  "bg-purple-100 text-purple-500",
];

export function EmpresasDestaqueCarrossel() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: true,
    dragFree: true,
  });

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("empresas")
        .select("slug, nome, cidade, estado, telefone, whatsapp, nicho")
        .eq("status", "aprovado")
        // .eq("destaque_rotacao", true) // Remove this filter for now to guarantee 10 results
        .limit(10);
      if (data) setEmpresas(data);
    }
    load();
  }, []);

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  if (empresas.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center gap-4">
            <h2 className="font-display text-3xl font-bold text-slate-900">
              Empresas em <span className="text-primary">Destaque</span>
            </h2>
            <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200 uppercase tracking-wider text-xs font-bold px-3 py-1">
              ⭐ 5 Vagas Rotativas
            </Badge>
          </div>
          <Link
            to="/busca?destaque=true"
            className="flex items-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Ver todas <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4 sm:gap-6 ml-2 py-4">
              {empresas.map((empresa, index) => {
                const colorClass = PASTEL_COLORS[index % PASTEL_COLORS.length];
                
                return (
                  <div key={index} className="flex-[0_0_280px] min-w-[280px] h-[360px] flex flex-col bg-white border border-slate-100 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all">
                    
                    {/* Top Header / Icon */}
                    <div className={cn("relative h-32 flex items-center justify-center p-4", colorClass.split(" ")[0])}>
                      <Badge className="absolute top-3 left-3 bg-amber-500 text-white border-0 font-bold uppercase text-[10px]">
                        Destaque
                      </Badge>
                      <Star className={cn("w-12 h-12 opacity-80", colorClass.split(" ")[1])} />
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-grow">
                      <h3 className="font-bold text-slate-900 text-lg leading-tight line-clamp-2 mb-2">
                        {empresa.nome}
                      </h3>
                      
                      <div className="flex items-center text-slate-500 text-sm mb-3">
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        <span className="truncate">{empresa.cidade} - {empresa.estado}</span>
                      </div>
                      
                      {/* 5 Stars */}
                      <div className="flex gap-1 text-amber-400 mb-auto">
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                        <Star className="w-4 h-4 fill-current" />
                      </div>

                      <Button variant="outline" className="w-full mt-4 rounded-xl border-slate-200 hover:bg-slate-50 font-semibold" asChild>
                        <a href={`https://wa.me/${empresa.whatsapp?.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          WhatsApp
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button onClick={scrollPrev} className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-primary z-10 hidden md:flex">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={scrollNext} className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-100 flex items-center justify-center text-slate-600 hover:text-primary z-10 hidden md:flex">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
