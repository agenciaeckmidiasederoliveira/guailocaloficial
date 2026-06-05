import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

export function GrandesEmpresas() {
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "center" }, [
    Autoplay({ delay: 3000, stopOnInteraction: false }),
  ]);

  const logos = [
    { name: "Empresa 1", color: "bg-slate-200" },
    { name: "Empresa 2", color: "bg-slate-200" },
    { name: "Empresa 3", color: "bg-slate-200" },
    { name: "Empresa 4", color: "bg-slate-200" },
    { name: "Empresa 5", color: "bg-slate-200" },
    { name: "Empresa 6", color: "bg-slate-200" },
    { name: "Empresa 7", color: "bg-slate-200" },
    { name: "Empresa 8", color: "bg-slate-200" },
  ];

  return (
    <section className="py-12 bg-white border-y border-border">
      <div className="container">
        <h2 className="text-center font-display text-2xl font-bold text-slate-400 mb-8 uppercase tracking-widest text-sm">
          Grandes empresas já estão aqui
        </h2>
        
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex items-center gap-12 ml-4">
            {logos.map((logo, idx) => (
              <div key={idx} className="flex-[0_0_120px] min-w-[120px] h-16 flex items-center justify-center grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all">
                <div className={`w-full h-full ${logo.color} rounded-lg flex items-center justify-center text-slate-500 font-bold`}>
                  LOGO
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
