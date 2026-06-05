import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Check, Copy, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/useSEO";
import { SITE_URL } from "@/lib/constants";

interface EmpresaBadge {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  slug: string | null;
}

export default function BadgeEmpresa() {
  const { slug } = useParams<{ slug: string }>();
  const [empresa, setEmpresa] = useState<EmpresaBadge | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<"html" | "md" | null>(null);
  const { toast } = useToast();

  useSEO({
    title: empresa ? `Badge oficial — ${empresa.nome}` : "Badge da empresa",
    description: empresa
      ? `Exiba no seu site o selo oficial de que ${empresa.nome} está presente no Guia Local BR.`
      : "Selo oficial de empresa cadastrada no Guia Local BR.",
    canonical: empresa ? `${SITE_URL}/badge/${empresa.slug || empresa.id}` : undefined,
  });

  useEffect(() => {
    if (!slug) return;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    const q = supabase
      .from("empresas")
      .select("id, nome, cidade, estado, slug")
      .eq("status", "aprovado");
    (isUuid ? q.eq("id", slug) : q.eq("slug", slug))
      .single()
      .then(({ data }) => {
        if (data) setEmpresa(data as EmpresaBadge);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!empresa) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold">Empresa não encontrada</h1>
          <Button asChild className="mt-4"><Link to="/busca">Voltar</Link></Button>
        </div>
      </Layout>
    );
  }

  const empresaSlug = empresa.slug || empresa.id;
  const empresaUrl = `${SITE_URL}/empresa/${empresaSlug}`;
  const badgeImg = `${SITE_URL}/badge.svg`;

  const htmlCode = `<a href="${empresaUrl}" rel="dofollow" title="${empresa.nome} no Guia Local BR" target="_blank">
  <img src="${badgeImg}" alt="${empresa.nome} — Presente no Guia Local BR" width="180" height="60" loading="lazy" />
</a>`;

  const markdownCode = `[![${empresa.nome} no Guia Local BR](${badgeImg})](${empresaUrl})`;

  const copy = async (text: string, key: "html" | "md") => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    toast({ title: "Copiado!", description: "Cole no código do seu site." });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Layout>
      <div className="container max-w-3xl py-10">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Selo Oficial
          </div>
          <h1 className="font-display text-3xl font-bold md:text-4xl">Badge da {empresa.nome}</h1>
          <p className="mt-2 text-muted-foreground">
            Adicione este selo no seu site e ganhe um backlink dofollow do Guia Local BR — fortalecendo seu SEO no Google.
          </p>
        </div>

        {/* Preview do badge */}
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <a href={empresaUrl} target="_blank" rel="noopener noreferrer">
              <img
                src="/badge.svg"
                alt={`${empresa.nome} — Presente no Guia Local BR`}
                width={180}
                height={60}
              />
            </a>
            <p className="text-center text-xs text-muted-foreground">
              Clique no badge para ver como ele linka para seu perfil
            </p>
            <Button asChild variant="outline" size="sm">
              <a href={empresaUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" /> Ver meu perfil
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* HTML */}
        <Card className="mb-4">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Código HTML (recomendado para sites)</h2>
              <Button size="sm" onClick={() => copy(htmlCode, "html")}>
                {copied === "html" ? (
                  <><Check className="mr-1 h-4 w-4" /> Copiado</>
                ) : (
                  <><Copy className="mr-1 h-4 w-4" /> Copiar</>
                )}
              </Button>
            </div>
            <Textarea readOnly value={htmlCode} rows={4} className="font-mono text-xs" />
            <p className="mt-2 text-xs text-muted-foreground">
              Cole esse código no rodapé do seu site ou em uma página "Sobre".
            </p>
          </CardContent>
        </Card>

        {/* Markdown */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Markdown (para README e blogs)</h2>
              <Button size="sm" variant="outline" onClick={() => copy(markdownCode, "md")}>
                {copied === "md" ? (
                  <><Check className="mr-1 h-4 w-4" /> Copiado</>
                ) : (
                  <><Copy className="mr-1 h-4 w-4" /> Copiar</>
                )}
              </Button>
            </div>
            <Textarea readOnly value={markdownCode} rows={2} className="font-mono text-xs" />
          </CardContent>
        </Card>

        <div className="mt-8 rounded-lg border border-emerald-500/30 bg-emerald-50/50 p-4 text-sm dark:bg-emerald-950/20">
          <p className="font-semibold text-emerald-700 dark:text-emerald-300">
            💡 Por que usar o badge?
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            <li>Backlink <strong>dofollow</strong> direto para o seu perfil</li>
            <li>Transmite confiança e autoridade para visitantes do seu site</li>
            <li>Ajuda seu ranqueamento no Google (SEO)</li>
            <li>Reciprocidade: você ajuda o diretório, o diretório ajuda você</li>
          </ul>
        </div>
      </div>
    </Layout>
  );
}
