import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, ExternalLink, Eye, MessageCircle, Sparkles, Globe, MapPin, TrendingUp, Wallet, PiggyBank, Copy, ShieldCheck,
} from "lucide-react";

interface Empresa {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  plano: string;
  status: string;
  slug: string | null;
}

interface ClientPage {
  id: string;
  slug: string;
  status: string;
  visualizacoes: number;
  cliques_whatsapp: number;
  total_bairros: number;
  bairros: Array<{ nome: string }>;
  posicao_estimada: number;
  cpc_equivalente: number;
  cliques_mes_estimado: number;
  economia_ads_anual: number;
  categoria: string;
  cidade: string;
  publicado_at: string | null;
}

const SITE = "guialocalbr.com.br";

const LOADING_MESSAGES = [
  "✨ Criando sua página personalizada com IA...",
  "📍 Identificando os melhores bairros da sua cidade...",
  "✍️ Gerando conteúdo único para cada região...",
  "🎯 Otimizando para o Google...",
  "🚀 Finalizando sua página...",
];

export default function MinhaPagina() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [page, setPage] = useState<ClientPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const { data: emps } = await supabase
      .from("empresas")
      .select("id, nome, cidade, estado, plano, status, slug")
      .eq("usuario_id", user.id)
      .eq("status", "aprovado")
      .order("criado_em", { ascending: false })
      .limit(1);

    const emp = emps?.[0] || null;
    setEmpresa(emp);

    if (emp) {
      const { data: pageData } = await (supabase as any)
        .from("client_pages")
        .select("*")
        .eq("business_id", emp.id)
        .maybeSingle();
      setPage(pageData as ClientPage);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  // rotaciona mensagem de loading durante geração
  useEffect(() => {
    if (!gerando) return;
    const t = setInterval(() => {
      setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(t);
  }, [gerando]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const gerarLanding = async () => {
    if (!empresa) return;
    setGerando(true);
    setLoadingMsgIdx(0);
    const { data, error } = await supabase.functions.invoke("generate-client-page", {
      body: { business_id: empresa.id },
    });
    setGerando(false);
    if (error || (data as any)?.error) {
      toast({
        title: "Erro ao gerar página",
        description: (error?.message || (data as any)?.error) as string,
        variant: "destructive",
      });
    } else {
      toast({
        title: "🎉 Sua página está no ar!",
        description: `${SITE}/${(data as any)?.slug}`,
      });
      fetchAll();
    }
  };

  const copiarLink = async () => {
    if (!page) return;
    await navigator.clipboard.writeText(`https://${SITE}/${page.slug}`);
    toast({ title: "Link copiado!" });
  };

  const economiaMensal = page
    ? Math.round((page.cpc_equivalente || 12) * (page.cliques_mes_estimado || 60))
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Minha Página</h1>
          <p className="text-muted-foreground">
            Sua presença automática no Google, gerada por IA exclusiva do GuiaLocalBR.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !empresa ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="mb-4 text-muted-foreground">
                Você ainda não tem empresa aprovada. Cadastre-se para liberar sua página personalizada.
              </p>
              <Button asChild><Link to="/cadastro">Cadastrar empresa</Link></Button>
            </CardContent>
          </Card>
        ) : !page ? (
          <Card className="border-primary/30">
            <CardContent className="py-10 text-center">
              {gerando ? (
                <div className="space-y-4">
                  <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
                  <p className="text-lg font-medium">{LOADING_MESSAGES[loadingMsgIdx]}</p>
                  <p className="text-sm text-muted-foreground">Isso pode levar 1 a 2 minutos.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Sparkles className="mx-auto h-10 w-10 text-primary" />
                  <p className="text-lg font-medium">Sua página personalizada ainda não foi gerada</p>
                  <p className="text-sm text-muted-foreground">
                    A IA vai criar uma página com conteúdo único para cada bairro de {empresa.cidade}.
                  </p>
                  <Button onClick={gerarLanding} size="lg">
                    <Sparkles className="mr-2 h-5 w-5" /> Gerar minha página agora
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {/* CARD 1 — Página no ar */}
            <Card className="md:col-span-2 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-emerald-600" />
                    <Badge className="bg-emerald-600">Ativa</Badge>
                  </div>
                  <p className="truncate text-lg font-bold">{SITE}/{page.slug}</p>
                  <p className="text-xs text-muted-foreground">Sua página principal no ar</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={copiarLink}>
                    <Copy className="mr-1 h-4 w-4" /> Copiar
                  </Button>
                  <Button asChild size="sm">
                    <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1 h-4 w-4" /> Ver página
                    </a>
                  </Button>
                  {empresa.slug && (
                    <Button asChild size="sm" variant="secondary">
                      <Link to={`/badge/${empresa.slug}`}>
                        <ShieldCheck className="mr-1 h-4 w-4" /> Obter meu badge
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* CARD 2 — Posição Google */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Posição estimada no Google</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-emerald-600">{page.posicao_estimada || 3}º</span>
                  <Badge variant="outline">Orgânico</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  para "{page.categoria || "serviço"} em {page.cidade}"
                </p>
              </CardContent>
            </Card>

            {/* CARD 3 — Economia mensal */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Wallet className="h-4 w-4" /> Economia mensal equivalente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">R$ {economiaMensal.toLocaleString("pt-BR")}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Você economizaria isso por mês em Google Ads
                </p>
              </CardContent>
            </Card>

            {/* CARD 4 — Economia anual */}
            <Card className="border-yellow-500/30 bg-yellow-50/40 dark:bg-yellow-950/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <PiggyBank className="h-4 w-4 text-yellow-600" /> Economia anual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
                  R$ {Math.round(page.economia_ads_anual || 0).toLocaleString("pt-BR")}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Investimento equivalente em anúncios salvo por ano
                </p>
              </CardContent>
            </Card>

            {/* CARD 5 — Visualizações */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Eye className="h-4 w-4" /> Visualizações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{page.visualizacoes || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Visitas reais à sua página</p>
              </CardContent>
            </Card>

            {/* CARD 6 — Cliques WhatsApp */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MessageCircle className="h-4 w-4 text-emerald-600" /> Contatos via WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-emerald-600">{page.cliques_whatsapp || 0}</p>
                <p className="mt-1 text-xs text-muted-foreground">Cliques no botão WhatsApp</p>
              </CardContent>
            </Card>

            {/* CARD 7 — Bairros cobertos */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  Bairros cobertos ({page.total_bairros || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">
                  Sua página cobre {page.total_bairros} regiões de {page.cidade}.
                </p>
                <div className="flex flex-wrap gap-2">
                  {page.bairros?.map((b, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {b.nome}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Regenerar */}
            <Card className="md:col-span-2">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Quer atualizar o conteúdo da sua página?
                </div>
                <Button variant="outline" size="sm" onClick={gerarLanding} disabled={gerando}>
                  {gerando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Regenerar com IA
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
