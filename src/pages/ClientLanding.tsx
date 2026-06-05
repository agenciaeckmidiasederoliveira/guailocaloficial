import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSEO } from "@/hooks/useSEO";
import { Loader2, MessageCircle, MapPin, Star, ShieldCheck, Clock, Phone, Mail } from "lucide-react";

interface BairroContent {
  nome: string;
  slug: string;
  titulo_secao: string;
  paragrafo_1: string;
  subtitulo_1: string;
  paragrafo_2: string;
  subtitulo_2: string;
  paragrafo_3: string;
  cta_texto: string;
  cta_emoji: string;
}

interface ClientPage {
  id: string;
  slug: string;
  status: string;
  hero_titulo: string;
  hero_subtitulo: string;
  sobre_texto: string;
  bairros: BairroContent[];
  total_bairros: number;
  meta_title: string;
  meta_description: string;
  schema_json: Record<string, unknown>;
  nome_empresa: string;
  categoria: string;
  whatsapp: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  email_contato: string | null;
  fotos: string[];
}

const SITE = "https://www.guialocalbr.com.br";

export default function ClientLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<ClientPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await (supabase as any)
        .from("client_pages")
        .select("*")
        .eq("slug", slug)
        .eq("status", "ativo")
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
      } else {
        setPage(data as ClientPage);
        // incrementa visualização (RPC pública SECURITY DEFINER)
        (supabase as any).rpc("increment_client_page_views", { p_slug: slug });
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [slug]);

  useSEO({
    title: page?.meta_title,
    description: page?.meta_description,
    canonical: page ? `${SITE}/${page.slug}` : undefined,
    ogImage: page?.fotos?.[0],
  });

  useEffect(() => {
    if (!page?.schema_json) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(page.schema_json);
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [page?.schema_json]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (notFound || !page) return <Navigate to="/" replace />;

  const wa = page.whatsapp ? `https://wa.me/55${page.whatsapp.replace(/\D/g, "")}` : "#";
  const tel = page.telefone ? `tel:${page.telefone.replace(/\D/g, "")}` : "#";

  const trackWhats = () => {
    (supabase as any).rpc("increment_client_page_whatsapp", { p_slug: page.slug });
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* HEADER FIXO */}
      <header className="sticky top-0 z-40 border-b bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-sm font-bold text-emerald-700">GuiaLocalBR</Link>
          <span className="hidden truncate px-2 text-sm font-semibold sm:block">{page.nome_empresa}</span>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackWhats}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#25d366] px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-[#1ebd5a]"
          >
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
          </a>
        </div>
      </header>

      {/* HERO */}
      <section
        className="px-4 py-16 text-white sm:py-24"
        style={{ background: "linear-gradient(135deg, #1e3a2f 0%, #16a34a 100%)" }}
      >
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
            <ShieldCheck className="h-3.5 w-3.5" /> Empresa verificada pelo GuiaLocalBR
          </div>
          <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-5xl">{page.hero_titulo}</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg opacity-95">{page.hero_subtitulo}</p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={tel}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-emerald-700 shadow-lg transition hover:scale-105"
            >
              <Phone className="h-5 w-5" /> LIGAR
            </a>
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackWhats}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25d366] px-6 py-3 font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-[#1ebd5a]"
            >
              <MessageCircle className="h-5 w-5" /> WHATSAPP
            </a>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <section className="border-b bg-slate-50 px-4 py-4 text-sm">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <div className="flex items-center justify-center gap-1.5"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /> Avaliação 5.0</div>
          <div className="flex items-center justify-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Empresa verificada</div>
          <div className="flex items-center justify-center gap-1.5"><Clock className="h-4 w-4 text-emerald-600" /> Resposta rápida</div>
          <div className="flex items-center justify-center gap-1.5"><MapPin className="h-4 w-4 text-emerald-600" /> {page.cidade} e região</div>
        </div>
      </section>

      {/* SEÇÕES POR BAIRRO */}
      {page.bairros?.map((b, i) => (
        <section
          key={b.slug || i}
          id={`bairro-${b.slug || i}`}
          className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
        >
          <div className="mx-auto max-w-[860px] px-5 py-[60px]">
            <h2 className="mb-6 text-2xl font-bold text-emerald-800 sm:text-3xl">
              {b.cta_emoji} {b.titulo_secao}
            </h2>
            <p className="mb-6 leading-relaxed text-slate-700">{b.paragrafo_1}</p>

            <div className="my-6 text-center">
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackWhats}
                className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-6 py-3 font-bold text-white shadow-lg shadow-emerald-200 transition hover:scale-105 hover:bg-[#1ebd5a]"
              >
                <MessageCircle className="h-5 w-5" /> {b.cta_texto}
              </a>
            </div>

            <h3 className="mb-3 mt-8 text-xl font-semibold text-emerald-800">{b.subtitulo_1}</h3>
            <p className="mb-6 leading-relaxed text-slate-700">{b.paragrafo_2}</p>

            <h3 className="mb-3 mt-8 text-xl font-semibold text-emerald-800">{b.subtitulo_2}</h3>
            <p className="mb-6 leading-relaxed text-slate-700">{b.paragrafo_3}</p>

            <div className="my-6 text-center">
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                onClick={trackWhats}
                className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-6 py-3 font-bold text-white shadow-lg shadow-emerald-200 transition hover:scale-105 hover:bg-[#1ebd5a]"
              >
                <MessageCircle className="h-5 w-5" /> {b.cta_texto}
              </a>
            </div>
          </div>
        </section>
      ))}

      {/* SOBRE NÓS */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="mb-4 text-3xl font-bold">Sobre {page.nome_empresa}</h2>
            <p className="whitespace-pre-line leading-relaxed text-slate-700">{page.sobre_texto}</p>
          </div>
          <aside className="rounded-xl border border-slate-200 bg-slate-50 p-6">
            <h3 className="mb-4 font-semibold">Fale conosco</h3>
            {page.endereco && (
              <p className="mb-3 flex items-start gap-2 text-sm text-slate-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {page.endereco}, {page.cidade}/{page.estado}
              </p>
            )}
            {page.telefone && (
              <p className="mb-3 flex items-center gap-2 text-sm text-slate-700">
                <Phone className="h-4 w-4 text-emerald-600" /> {page.telefone}
              </p>
            )}
            {page.email_contato && (
              <p className="mb-3 flex items-center gap-2 text-sm text-slate-700">
                <Mail className="h-4 w-4 text-emerald-600" /> {page.email_contato}
              </p>
            )}
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackWhats}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25d366] px-4 py-2.5 font-semibold text-white shadow hover:bg-[#1ebd5a]"
            >
              <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
            </a>
          </aside>
        </div>
      </section>

      {/* CTA FINAL */}
      <section
        className="px-4 py-20 text-white"
        style={{ background: "linear-gradient(135deg, #16a34a 0%, #1e3a2f 100%)" }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-3 text-3xl font-bold sm:text-4xl">
            Precisa de {page.categoria || "atendimento"} em {page.cidade}?
          </h2>
          <p className="mb-8 text-lg opacity-95">
            Entre em contato agora e receba atendimento rápido.
          </p>
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackWhats}
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-emerald-700 shadow-2xl transition hover:scale-105"
          >
            <MessageCircle className="h-6 w-6" /> Falar no WhatsApp
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#1e3a2f] px-4 py-10 text-white/80">
        <div className="mx-auto max-w-5xl text-center text-sm">
          <p className="mb-2 font-semibold text-white">{page.nome_empresa}</p>
          {page.endereco && <p className="mb-1">{page.endereco}, {page.cidade}/{page.estado}</p>}
          {page.telefone && <p className="mb-1">{page.telefone}</p>}
          <p className="mt-4 text-xs">
            <Link to="/" className="text-emerald-300 hover:underline">Powered by GuiaLocalBR</Link>
          </p>
        </div>
      </footer>

      {/* BOTÃO FLUTUANTE */}
      <a
        href={wa}
        target="_blank"
        rel="noopener noreferrer"
        onClick={trackWhats}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-5 py-3 font-bold text-white shadow-2xl shadow-emerald-500/50 transition hover:scale-110"
        style={{ boxShadow: "0 8px 24px rgba(37, 211, 102, 0.5)" }}
      >
        <MessageCircle className="h-5 w-5" /> Falar agora
      </a>
    </div>
  );
}
