import { UserPlus, Search, Star, TrendingUp } from "lucide-react";

const STEPS = [
  {
    icon: UserPlus,
    title: "Cadastre Grátis",
    description: "Crie o perfil da sua empresa em menos de 2 minutos.",
    step: "01",
  },
  {
    icon: Search,
    title: "Seja Encontrado",
    description: "Clientes buscam por categoria, cidade ou nome e encontram você.",
    step: "02",
  },
  {
    icon: Star,
    title: "Ganhe Avaliações",
    description: "Receba avaliações de clientes e construa sua reputação.",
    step: "03",
  },
  {
    icon: TrendingUp,
    title: "Cresça Mais",
    description: "Vire Premium e destaque sua empresa para milhares de pessoas.",
    step: "04",
  },
];

export function ComoFuncionaSection() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container">
        <h2 className="text-center font-display text-3xl font-bold text-foreground md:text-4xl">
          Como <span className="text-gradient">Funciona</span>?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-muted-foreground">
          Em 4 passos simples, sua empresa ganha visibilidade em todo o Brasil
        </p>

        <div className="relative mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Connecting line (desktop) */}
          <div className="absolute left-0 right-0 top-12 hidden h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 lg:block" />

          {STEPS.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 mb-4 flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-primary/20 bg-card shadow-lg transition-all hover:border-primary hover:shadow-xl">
                <step.icon className="h-10 w-10 text-primary" />
                <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow">
                  {step.step}
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
