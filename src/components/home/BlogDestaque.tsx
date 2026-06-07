import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Clock, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PLACEHOLDER_POSTS = [
  {
    badge: "DICAS DE NEGÓCIO",
    badgeColor: "bg-emerald-100 text-emerald-700",
    title: "Como colocar sua empresa no topo das buscas locais do Google em 2026",
    excerpt: "Aprenda estratégias comprovadas de SEO local para atrair mais clientes da sua região sem gastar uma fortuna.",
    date: "02 Jun 2026",
    readTime: "5 min de leitura",
    cover: "https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=600&auto=format&fit=crop&q=80",
    slug: null,
  },
  {
    badge: "PREMIUM",
    badgeColor: "bg-amber-100 text-amber-700",
    title: "Por que empresas premium recebem 10x mais cliques no WhatsApp",
    excerpt: "Descubra o que diferencia os anúncios que convertem dos que ficam invisíveis para os clientes.",
    date: "01 Jun 2026",
    readTime: "3 min de leitura",
    cover: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&auto=format&fit=crop&q=80",
    slug: null,
  },
  {
    badge: "PARCEIROS",
    badgeColor: "bg-blue-100 text-blue-700",
    title: "Seja o consultor exclusivo do Guia Local BR na sua cidade",
    excerpt: "Exclusividade territorial, renda recorrente e suporte completo de uma plataforma de alta tecnologia.",
    date: "30 Mai 2026",
    readTime: "4 min de leitura",
    cover: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=600&auto=format&fit=crop&q=80",
    slug: null,
  },
];

export function BlogDestaque() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("artigos")
        .select("id, titulo, slug, imagem_capa, publicado_em, resumo")
        .eq("publicado", true)
        .order("publicado_em", { ascending: false })
        .limit(3);

      if (data && data.length > 0) {
        setPosts(data.map((a, i) => ({
          badge: PLACEHOLDER_POSTS[i % 3].badge,
          badgeColor: PLACEHOLDER_POSTS[i % 3].badgeColor,
          title: a.titulo,
          excerpt: a.resumo || "Leia mais sobre esse tema no nosso blog.",
          date: a.publicado_em ? new Date(a.publicado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "",
          readTime: "5 min de leitura",
          cover: a.imagem_capa || PLACEHOLDER_POSTS[i % 3].cover,
          slug: `/blog/artigos/${a.slug}`,
        })));
      } else {
        setPosts(PLACEHOLDER_POSTS);
      }
    }
    load();
  }, []);

  return (
    <section className="py-16 md:py-20 bg-slate-50 border-t border-slate-100">
      <div className="container">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-1 rounded-full bg-emerald-500" />
              <span className="text-emerald-600 text-[11px] font-black uppercase tracking-[2px]">Blog & Dicas</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Fique por dentro do <span className="text-emerald-600">Blog</span>
            </h2>
            <p className="text-slate-500 text-sm mt-1">Dicas de marketing local, vendas e como destacar seu negócio</p>
          </div>
          <Link to="/blog" className="text-emerald-600 font-bold text-sm flex items-center gap-1 hover:text-emerald-700 transition-colors">
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map((post, idx) => (
            <Link
              key={idx}
              to={post.slug || "/blog"}
              className="group bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col"
            >
              {/* Cover image */}
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img
                  src={post.cover}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={e => {
                    const colors = ["#10B981","#3B82F6","#F59E0B"];
                    (e.target as HTMLImageElement).style.display = "none";
                    ((e.target as HTMLImageElement).parentElement as HTMLElement).style.background = colors[idx % 3];
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                <span className={`absolute top-3 left-3 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${post.badgeColor}`}>
                  {post.badge}
                </span>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-grow">
                <h3 className="font-black text-slate-900 text-[15px] leading-snug mb-2 line-clamp-3 group-hover:text-emerald-700 transition-colors">
                  {post.title}
                </h3>
                {post.excerpt && (
                  <p className="text-slate-500 text-xs font-medium leading-relaxed mb-4 line-clamp-2 flex-grow">
                    {post.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-3 text-slate-400 text-xs font-semibold mt-auto pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {post.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
