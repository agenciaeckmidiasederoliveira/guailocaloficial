import { Link } from "react-router-dom";
import {
  UtensilsCrossed, Scissors, Car, ShoppingBag, Heart, GraduationCap,
  Home, Wrench, Camera, Music, PawPrint, Dumbbell, Paintbrush, Stethoscope,
  Monitor, Briefcase, Sparkles, MoreHorizontal
} from "lucide-react";

const CATEGORIAS = [
  { nome: "Alimentação", icon: UtensilsCrossed, cor: "bg-orange-500/10 text-orange-600" },
  { nome: "Beleza e Estética", icon: Scissors, cor: "bg-pink-500/10 text-pink-600" },
  { nome: "Automotivo", icon: Car, cor: "bg-blue-500/10 text-blue-600" },
  { nome: "Moda", icon: ShoppingBag, cor: "bg-purple-500/10 text-purple-600" },
  { nome: "Saúde", icon: Heart, cor: "bg-red-500/10 text-red-600" },
  { nome: "Educação", icon: GraduationCap, cor: "bg-emerald-500/10 text-emerald-600" },
  { nome: "Casa e Decoração", icon: Home, cor: "bg-amber-500/10 text-amber-600" },
  { nome: "Serviços Gerais", icon: Wrench, cor: "bg-slate-500/10 text-slate-600" },
  { nome: "Fotografia", icon: Camera, cor: "bg-indigo-500/10 text-indigo-600" },
  { nome: "Música", icon: Music, cor: "bg-violet-500/10 text-violet-600" },
  { nome: "Pet Shop", icon: PawPrint, cor: "bg-lime-500/10 text-lime-600" },
  { nome: "Esportes", icon: Dumbbell, cor: "bg-cyan-500/10 text-cyan-600" },
  { nome: "Construção", icon: Paintbrush, cor: "bg-yellow-500/10 text-yellow-600" },
  { nome: "Tecnologia", icon: Monitor, cor: "bg-teal-500/10 text-teal-600" },
  { nome: "Consultoria", icon: Briefcase, cor: "bg-sky-500/10 text-sky-600" },
  { nome: "Salão de Beleza", icon: Sparkles, cor: "bg-fuchsia-500/10 text-fuchsia-600" },
  { nome: "Veterinária", icon: Stethoscope, cor: "bg-green-500/10 text-green-600" },
  { nome: "Outros", icon: MoreHorizontal, cor: "bg-gray-500/10 text-gray-600" },
];

export function CategoriasSection() {
  return (
    <section className="py-12 lg:py-16">
      <div className="container">
        <h2 className="text-center font-display text-2xl font-bold text-foreground md:text-3xl">
          Explore por <span className="text-gradient">Categoria</span>
        </h2>
        <p className="mt-2 text-center text-muted-foreground">
          Encontre rapidamente o que você precisa
        </p>

        <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9">
          {CATEGORIAS.map((cat) => (
            <Link
              key={cat.nome}
              to={`/busca?nicho=${encodeURIComponent(cat.nome)}`}
              className="group flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3 transition-all hover:border-primary hover:shadow-md hover:-translate-y-0.5"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cat.cor} transition-transform group-hover:scale-110`}>
                <cat.icon className="h-5 w-5" />
              </div>
              <span className="text-center text-xs font-medium text-foreground line-clamp-2 leading-tight">
                {cat.nome}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
