import { Link } from "react-router-dom";
import {
  UtensilsCrossed, Scissors, Car, ShoppingBag, Heart, GraduationCap,
  Home, Wrench, Camera, Music, PawPrint, Dumbbell, Paintbrush, Stethoscope,
  Monitor, Briefcase, Sparkles, MoreHorizontal
} from "lucide-react";

const CATEGORIAS = [
  {
    nome: "Alimentação",
    icon: UtensilsCrossed,
    gradient: "from-orange-400 to-red-400",
    bg: "bg-gradient-to-br from-orange-50 to-red-50",
    border: "border-orange-100",
    shadow: "hover:shadow-orange-100",
    text: "text-orange-600",
    hover: "hover:border-orange-300",
  },
  {
    nome: "Beleza e Estética",
    icon: Scissors,
    gradient: "from-pink-400 to-fuchsia-400",
    bg: "bg-gradient-to-br from-pink-50 to-fuchsia-50",
    border: "border-pink-100",
    shadow: "hover:shadow-pink-100",
    text: "text-pink-600",
    hover: "hover:border-pink-300",
  },
  {
    nome: "Automotivo",
    icon: Car,
    gradient: "from-blue-400 to-indigo-400",
    bg: "bg-gradient-to-br from-blue-50 to-indigo-50",
    border: "border-blue-100",
    shadow: "hover:shadow-blue-100",
    text: "text-blue-600",
    hover: "hover:border-blue-300",
  },
  {
    nome: "Moda",
    icon: ShoppingBag,
    gradient: "from-purple-400 to-violet-400",
    bg: "bg-gradient-to-br from-purple-50 to-violet-50",
    border: "border-purple-100",
    shadow: "hover:shadow-purple-100",
    text: "text-purple-600",
    hover: "hover:border-purple-300",
  },
  {
    nome: "Saúde",
    icon: Heart,
    gradient: "from-red-400 to-rose-400",
    bg: "bg-gradient-to-br from-red-50 to-rose-50",
    border: "border-red-100",
    shadow: "hover:shadow-red-100",
    text: "text-red-600",
    hover: "hover:border-red-300",
  },
  {
    nome: "Educação",
    icon: GraduationCap,
    gradient: "from-emerald-400 to-teal-400",
    bg: "bg-gradient-to-br from-emerald-50 to-teal-50",
    border: "border-emerald-100",
    shadow: "hover:shadow-emerald-100",
    text: "text-emerald-600",
    hover: "hover:border-emerald-300",
  },
  {
    nome: "Casa e Decoração",
    icon: Home,
    gradient: "from-amber-400 to-yellow-400",
    bg: "bg-gradient-to-br from-amber-50 to-yellow-50",
    border: "border-amber-100",
    shadow: "hover:shadow-amber-100",
    text: "text-amber-600",
    hover: "hover:border-amber-300",
  },
  {
    nome: "Serviços",
    icon: Wrench,
    gradient: "from-slate-400 to-gray-500",
    bg: "bg-gradient-to-br from-slate-50 to-gray-50",
    border: "border-slate-100",
    shadow: "hover:shadow-slate-100",
    text: "text-slate-600",
    hover: "hover:border-slate-300",
  },
  {
    nome: "Fotografia",
    icon: Camera,
    gradient: "from-indigo-400 to-blue-400",
    bg: "bg-gradient-to-br from-indigo-50 to-blue-50",
    border: "border-indigo-100",
    shadow: "hover:shadow-indigo-100",
    text: "text-indigo-600",
    hover: "hover:border-indigo-300",
  },
  {
    nome: "Música",
    icon: Music,
    gradient: "from-violet-400 to-purple-500",
    bg: "bg-gradient-to-br from-violet-50 to-purple-50",
    border: "border-violet-100",
    shadow: "hover:shadow-violet-100",
    text: "text-violet-600",
    hover: "hover:border-violet-300",
  },
  {
    nome: "Pet Shop",
    icon: PawPrint,
    gradient: "from-lime-400 to-green-400",
    bg: "bg-gradient-to-br from-lime-50 to-green-50",
    border: "border-lime-100",
    shadow: "hover:shadow-lime-100",
    text: "text-lime-600",
    hover: "hover:border-lime-300",
  },
  {
    nome: "Esportes",
    icon: Dumbbell,
    gradient: "from-cyan-400 to-sky-400",
    bg: "bg-gradient-to-br from-cyan-50 to-sky-50",
    border: "border-cyan-100",
    shadow: "hover:shadow-cyan-100",
    text: "text-cyan-600",
    hover: "hover:border-cyan-300",
  },
  {
    nome: "Construção",
    icon: Paintbrush,
    gradient: "from-yellow-400 to-amber-500",
    bg: "bg-gradient-to-br from-yellow-50 to-amber-50",
    border: "border-yellow-100",
    shadow: "hover:shadow-yellow-100",
    text: "text-yellow-600",
    hover: "hover:border-yellow-300",
  },
  {
    nome: "Tecnologia",
    icon: Monitor,
    gradient: "from-teal-400 to-emerald-500",
    bg: "bg-gradient-to-br from-teal-50 to-emerald-50",
    border: "border-teal-100",
    shadow: "hover:shadow-teal-100",
    text: "text-teal-600",
    hover: "hover:border-teal-300",
  },
  {
    nome: "Consultoria",
    icon: Briefcase,
    gradient: "from-sky-400 to-blue-500",
    bg: "bg-gradient-to-br from-sky-50 to-blue-50",
    border: "border-sky-100",
    shadow: "hover:shadow-sky-100",
    text: "text-sky-600",
    hover: "hover:border-sky-300",
  },
  {
    nome: "Salão de Beleza",
    icon: Sparkles,
    gradient: "from-fuchsia-400 to-pink-500",
    bg: "bg-gradient-to-br from-fuchsia-50 to-pink-50",
    border: "border-fuchsia-100",
    shadow: "hover:shadow-fuchsia-100",
    text: "text-fuchsia-600",
    hover: "hover:border-fuchsia-300",
  },
  {
    nome: "Veterinária",
    icon: Stethoscope,
    gradient: "from-green-400 to-emerald-400",
    bg: "bg-gradient-to-br from-green-50 to-emerald-50",
    border: "border-green-100",
    shadow: "hover:shadow-green-100",
    text: "text-green-600",
    hover: "hover:border-green-300",
  },
  {
    nome: "Outros",
    icon: MoreHorizontal,
    gradient: "from-gray-400 to-slate-400",
    bg: "bg-gradient-to-br from-gray-50 to-slate-50",
    border: "border-gray-100",
    shadow: "hover:shadow-gray-100",
    text: "text-gray-600",
    hover: "hover:border-gray-300",
  },
];

export function CategoriasSection() {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-50 rounded-full filter blur-3xl opacity-60 -z-10" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-50 rounded-full filter blur-3xl opacity-60 -z-10" />

      <div className="container relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-100 shadow-sm mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Explore por Segmento</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Explore por{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Categoria
            </span>
          </h2>
          <p className="text-slate-500 text-base font-medium max-w-md mx-auto">
            Encontre rapidamente o negócio certo para cada necessidade
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9">
          {CATEGORIAS.map((cat, idx) => (
            <Link
              key={cat.nome}
              to={`/busca?nicho=${encodeURIComponent(cat.nome)}`}
              className={`group relative flex flex-col items-center gap-2.5 rounded-2xl border ${cat.border} ${cat.bg} ${cat.hover} p-3 md:p-4 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg ${cat.shadow} cursor-pointer`}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              {/* Icon with gradient bg */}
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${cat.gradient} shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300`}
              >
                <cat.icon className="h-5 w-5 text-white" strokeWidth={1.8} />
              </div>

              {/* Label */}
              <span className={`text-center text-[10px] md:text-xs font-bold ${cat.text} line-clamp-2 leading-tight transition-colors duration-200`}>
                {cat.nome}
              </span>

              {/* Hover glow effect */}
              <div
                className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${cat.gradient} blur-xl -z-10`}
                style={{ opacity: 0 }}
              />
            </Link>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10">
          <Link
            to="/busca"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-200 text-slate-700 font-bold text-sm hover:border-emerald-400 hover:text-emerald-600 hover:shadow-md transition-all duration-300"
          >
            Ver todas as categorias
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
