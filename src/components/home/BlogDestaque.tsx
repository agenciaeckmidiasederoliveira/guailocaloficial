import { Link } from "react-router-dom";
import { ArrowRight, Star, Award, MapPin } from "lucide-react";

export function BlogDestaque() {
  const posts = [
    {
      badge: "DICAS DE NEGÓCIO",
      title: "Como colocar sua empresa no topo das buscas locais do Google em 2026",
      date: "02 Jun 2026",
      readTime: "5 min de leitura",
      icon: Star,
      bgClass: "bg-emerald-100",
      iconClass: "text-emerald-400"
    },
    {
      badge: "PREMIUM",
      title: "Por que empresas premium recebem 10x mais cliques no WhatsApp",
      date: "01 Jun 2026",
      readTime: "3 min",
      icon: Award,
      bgClass: "bg-blue-100",
      iconClass: "text-blue-400"
    },
    {
      badge: "PARCEIROS",
      title: "Seja o consultor exclusivo do Guia Local BR na sua cidade",
      date: "30 Mai 2026",
      readTime: "4 min",
      icon: MapPin,
      bgClass: "bg-amber-100",
      iconClass: "text-amber-400"
    }
  ];

  return (
    <section className="py-16 bg-slate-50">
      <div className="container">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-slate-900">
              Fique por dentro do <span className="text-primary">Blog</span>
            </h2>
            <p className="text-slate-500 mt-1">Dicas de marketing local, vendas e segredos para destacar seu negócio</p>
          </div>
          <Link
            to="/"
            className="flex items-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Ver tudo <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col h-[320px]">
              {/* Top Colored Banner with Icon */}
              <div className={`h-40 flex items-center justify-center ${post.bgClass}`}>
                <post.icon className={`w-16 h-16 opacity-50 ${post.iconClass}`} />
              </div>
              
              {/* Content */}
              <div className="p-5 flex flex-col flex-grow">
                <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-sm mb-3 uppercase tracking-wide w-fit ${
                  post.badge === 'PREMIUM' ? 'bg-amber-100 text-amber-700' :
                  post.badge === 'PARCEIROS' ? 'bg-blue-100 text-blue-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {post.badge}
                </span>
                
                <h3 className="font-bold text-slate-900 leading-snug mb-auto">
                  {post.title}
                </h3>
                
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-4">
                  <span>📅 {post.date}</span>
                  <span>·</span>
                  <span>{post.readTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
