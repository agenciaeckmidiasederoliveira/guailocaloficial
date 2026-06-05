import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export function HomeStatsAndMarquee() {
  const [stats, setStats] = useState({
    empresas: 0,
    cidades: 0,
    estados: 0,
    premium: 0,
  });
  const [cidades, setCidades] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const { data: empData } = await supabase.from("empresas").select("cidade, estado, plano").eq("status", "aprovado");
        
        if (empData) {
          const totalEmpresas = empData.length;
          const totalPremium = empData.filter(e => e.plano === "premium").length;
          
          const cidadesUnicas = new Set(empData.map(e => `${e.cidade} - ${e.estado}`).filter(c => c && !c.includes("null")));
          const estadosUnicos = new Set(empData.map(e => e.estado).filter(Boolean));

          setStats({
            empresas: totalEmpresas,
            cidades: cidadesUnicas.size,
            estados: estadosUnicos.size,
            premium: totalPremium,
          });

          setCidades(Array.from(cidadesUnicas).slice(0, 20));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <section className="bg-slate-50 relative overflow-hidden py-8 border-y border-border">
      {/* Background Dots */}
      <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_2px_2px,_#cbd5e1_1px,_transparent_0)]" style={{ backgroundSize: "24px 24px" }} />
      
      <div className="container relative z-10 flex flex-col items-center">
        
        {/* Buscas Comuns */}
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600 mb-8">
          <span className="text-slate-400">Buscas comuns:</span>
          <span className="text-primary cursor-pointer hover:underline">Estética</span>
          <span className="text-primary cursor-pointer hover:underline">Pet Shop</span>
          <span className="text-primary cursor-pointer hover:underline">Disk Gás</span>
          <span className="text-primary cursor-pointer hover:underline">Advogado</span>
          <span className="text-primary cursor-pointer hover:underline">Mecânico</span>
        </div>

        {/* Marquee de Cidades */}
        <div className="w-full overflow-hidden border-b border-t border-slate-200 py-3 bg-white/50 backdrop-blur-sm relative">
          {/* Gradient Edges */}
          <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-slate-50 to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-slate-50 to-transparent z-10" />
          
          <div className="flex whitespace-nowrap animate-marquee">
            {[...cidades, ...cidades, ...cidades].map((cidade, idx) => (
              <div key={idx} className="flex items-center mx-6 text-slate-700 font-medium whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mr-3" />
                {cidade}
              </div>
            ))}
          </div>
        </div>

        {/* Estatísticas */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 bg-white/40">
          <div className="flex flex-col items-center justify-center text-center border-r border-slate-200 last:border-0 md:last:border-r-0">
            <span className="text-4xl font-bold text-slate-900">{stats.empresas}+</span>
            <span className="text-sm text-slate-500 mt-1">Empresas cadastradas</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center border-r border-slate-200 last:border-0 md:last:border-r-0">
            <span className="text-4xl font-bold text-slate-900">{stats.cidades}+</span>
            <span className="text-sm text-slate-500 mt-1">Cidades atendidas</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center border-r-0 md:border-r border-slate-200 last:border-0">
            <span className="text-4xl font-bold text-slate-900">{stats.estados}+</span>
            <span className="text-sm text-slate-500 mt-1">Estados cobertos</span>
          </div>
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-bold text-slate-900">{stats.premium}+</span>
            <span className="text-sm text-slate-500 mt-1">Membros premium</span>
          </div>
        </div>

      </div>
    </section>
  );
}
