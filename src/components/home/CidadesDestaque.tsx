import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function CidadesDestaque() {
  const [cidades, setCidades] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      // Fake query to get some cities with count
      const { data } = await supabase
        .from("empresas")
        .select("cidade, estado")
        .eq("status", "aprovado");

      if (data) {
        const counts: Record<string, { cidade: string; estado: string; count: number; desc: string }> = {};
        data.forEach(e => {
          if (!e.cidade) return;
          const key = `${e.cidade} - ${e.estado}`;
          if (!counts[key]) {
            counts[key] = { cidade: e.cidade, estado: e.estado, count: 0, desc: "Polo Regional" };
          }
          counts[key].count++;
        });

        // Add some hardcoded descriptions for realism based on the screenshot
        if (counts["Paiçandu - PR"]) counts["Paiçandu - PR"].desc = "Principal território do guia";
        if (counts["Maringá - PR"]) counts["Maringá - PR"].desc = "Hub regional do Paraná";
        if (counts["Pouso Alegre - MG"]) counts["Pouso Alegre - MG"].desc = "Sul de Minas Gerais";
        if (counts["Curitiba - PR"]) counts["Curitiba - PR"].desc = "Capital paranaense";
        if (counts["Sarandi - PR"]) counts["Sarandi - PR"].desc = "Região metropolitana";
        if (counts["Vila Velha - ES"]) counts["Vila Velha - ES"].desc = "Espírito Santo";

        const top = Object.values(counts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);
          
        setCidades(top);
      }
    }
    load();
  }, []);

  if (cidades.length === 0) return null;

  const bgClasses = [
    "bg-emerald-900", // Large
    "bg-indigo-950", // Normal
    "bg-purple-950", // Normal
    "bg-emerald-950", // Normal
    "bg-[#3d2714]", // Normal
    "bg-indigo-950", // Normal
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-slate-900">
              Cidades em <span className="text-primary">Destaque</span>
            </h2>
            <p className="text-slate-500 mt-1">Explore empresas nos polos mais ativos do guia</p>
          </div>
          <Link
            to="/busca"
            className="flex items-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Ver todas as cidades <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        {/* CSS Grid that mimics the screenshot */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cidades.map((cidade, index) => {
            // First item is wider (col-span-2)
            const isFirst = index === 0;
            const bgClass = bgClasses[index % bgClasses.length];
            
            return (
              <div 
                key={index}
                className={`${isFirst ? 'md:col-span-2 lg:col-span-2' : 'col-span-1'} ${bgClass} rounded-2xl p-6 flex flex-col justify-end min-h-[160px] text-white overflow-hidden relative group hover:-translate-y-1 transition-transform cursor-pointer shadow-md`}
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-50" />
                
                <div className="relative z-10">
                  <span className="inline-block bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm mb-2 uppercase tracking-wide">
                    {cidade.count} Empresas
                  </span>
                  <h3 className="font-bold text-xl md:text-2xl leading-tight mb-1">
                    {cidade.cidade} · {cidade.estado}
                  </h3>
                  <p className="text-white/80 text-sm">
                    {cidade.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
