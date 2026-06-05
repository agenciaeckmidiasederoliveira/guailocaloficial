import { cn } from "@/lib/utils";

const GRADIENTES: Record<string, string> = {
  restaurante: "from-orange-400 to-red-500",
  alimentação: "from-orange-400 to-red-500",
  alimentacao: "from-orange-400 to-red-500",
  lanchonete: "from-amber-400 to-orange-500",
  pizzaria: "from-red-400 to-red-600",
  saúde: "from-emerald-400 to-teal-600",
  saude: "from-emerald-400 to-teal-600",
  médico: "from-blue-400 to-cyan-600",
  medico: "from-blue-400 to-cyan-600",
  beleza: "from-pink-400 to-purple-500",
  salão: "from-pink-400 to-rose-500",
  salao: "from-pink-400 to-rose-500",
  advocacia: "from-slate-500 to-slate-700",
  advogado: "from-slate-500 to-slate-700",
  tecnologia: "from-cyan-400 to-blue-600",
  farmácia: "from-green-400 to-emerald-600",
  farmacia: "from-green-400 to-emerald-600",
  academia: "from-orange-500 to-red-600",
  construção: "from-yellow-500 to-amber-600",
  construcao: "from-yellow-500 to-amber-600",
  imobiliária: "from-teal-400 to-green-600",
  imobiliaria: "from-teal-400 to-green-600",
  educação: "from-indigo-400 to-blue-600",
  educacao: "from-indigo-400 to-blue-600",
  pet: "from-green-300 to-teal-500",
  veterinário: "from-green-400 to-emerald-600",
  veterinario: "from-green-400 to-emerald-600",
  contabilidade: "from-blue-500 to-indigo-600",
  default: "from-blue-400 to-indigo-600",
};

interface Props {
  categoria?: string | null;
  nome?: string | null;
  fotoUrl?: string | null;
  altura?: string;
  className?: string;
}

export function BlogPlaceholder({ categoria, nome, fotoUrl, altura = "h-48", className }: Props) {
  const cat = (categoria || "").toLowerCase();
  const gradiente =
    Object.entries(GRADIENTES).find(([k]) => k !== "default" && cat.includes(k))?.[1] ||
    GRADIENTES.default;
  const inicial = (nome || "?").charAt(0).toUpperCase();

  if (fotoUrl) {
    return (
      <div className={cn("relative w-full overflow-hidden", altura, className)}>
        <img
          src={fotoUrl}
          alt={nome || "Imagem"}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full items-center justify-center bg-gradient-to-br",
        gradiente,
        altura,
        className
      )}
    >
      <span className="select-none text-5xl font-bold text-white drop-shadow-md">
        {inicial}
      </span>
    </div>
  );
}
