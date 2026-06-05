import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Sparkles,
  ExternalLink,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Layers,
} from "lucide-react";

interface Empresa {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  nicho: string | null;
  plano: string;
  status: string;
}

interface PageRow {
  id: string;
  business_id: string;
  slug: string;
  status: string;
  plano: string;
  visualizacoes: number;
  cliques_whatsapp: number;
  total_bairros: number;
  publicado_at: string | null;
  empresa_nome?: string;
}

export function AdminPaginasClientes() {
  const { toast } = useToast();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [paginas, setPaginas] = useState<PageRow[]>([]);
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    const [empResp, pagResp] = await Promise.all([
      supabase
        .from("empresas")
        .select("id, nome, cidade, estado, nicho, plano, status")
        .eq("status", "aprovado")
        .order("nome"),
      (supabase as any)
        .from("client_pages")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    setEmpresas((empResp.data as Empresa[]) || []);
    const pages = (pagResp.data as any[]) || [];
    const empMap = new Map(((empResp.data as Empresa[]) || []).map((e) => [e.id, e.nome]));
    setPaginas(
      pages.map((p) => ({ ...p, empresa_nome: empMap.get(p.business_id) || "—" })) as PageRow[],
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const paginasPorEmpresa = new Map(paginas.map((p) => [p.business_id, p]));
  const empresasComPagina = new Set(
    paginas.filter((p) => p.status !== "erro").map((p) => p.business_id),
  );
  const empresasFiltradas = empresas.filter(
    (e) =>
      !busca ||
      e.nome.toLowerCase().includes(busca.toLowerCase()) ||
      e.cidade.toLowerCase().includes(busca.toLowerCase()),
  );

  const toggleSelecionada = (id: string) => {
    setSelecionadas((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const selecionarTodasSemPagina = () => {
    const ids = empresasFiltradas
      .filter((e) => !empresasComPagina.has(e.id) || paginasPorEmpresa.get(e.id)?.status === "erro")
      .map((e) => e.id);
    setSelecionadas(new Set(ids));
  };

  const gerarPaginas = async (ids: string[]) => {
    if (ids.length === 0) {
      toast({ title: "Selecione ao menos uma empresa", variant: "destructive" });
      return;
    }
    setGerando(true);
    setProgresso(0);
    setLog([]);
    let ok = 0;
    let err = 0;
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const empresa = empresas.find((e) => e.id === id);
      const { data, error } = await supabase.functions.invoke("generate-client-page", {
        body: { business_id: id },
      });
      if (error || (data as any)?.error) {
        err++;
        setLog((prev) =>
          [`✗ ${empresa?.nome || id}: ${error?.message || (data as any)?.error}`, ...prev].slice(0, 50),
        );
      } else {
        ok++;
        setLog((prev) =>
          [`✓ ${empresa?.nome} → /${(data as any)?.slug}`, ...prev].slice(0, 50),
        );
      }
      setProgresso(Math.round(((i + 1) / ids.length) * 100));
      await new Promise((r) => setTimeout(r, 800));
    }
    setGerando(false);
    setSelecionadas(new Set());
    toast({ title: "Concluído", description: `✓ ${ok} geradas — ✗ ${err} erros` });
    fetchData();
  };

  const togglePausar = async (p: PageRow) => {
    const novoStatus = p.status === "ativo" ? "pausado" : "ativo";
    await (supabase as any).from("client_pages").update({ status: novoStatus }).eq("id", p.id);
    fetchData();
  };

  const excluir = async (p: PageRow) => {
    if (!confirm(`Excluir página /${p.slug}?`)) return;
    await (supabase as any).from("client_pages").delete().eq("id", p.id);
    toast({ title: "Página excluída" });
    fetchData();
  };

  const regenerar = async (p: PageRow) => {
    if (!confirm(`Regenerar conteúdo de /${p.slug} com IA?`)) return;
    await gerarPaginas([p.business_id]);
  };

  const gerarSubs = async (p: PageRow, qtd: number) => {
    if (!confirm(`Gerar ${qtd} subpáginas de serviço para /${p.slug}?`)) return;
    const { data, error } = await supabase.functions.invoke("generate-service-pages", {
      body: { business_id: p.business_id, quantidade: qtd },
    });
    if (error || (data as any)?.error) {
      toast({
        title: "Erro",
        description: (error?.message || (data as any)?.error) as string,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Subpáginas geradas",
        description: `${(data as any)?.sucesso || 0} criadas, ${(data as any)?.erros || 0} erros`,
      });
    }
  };

  const stats = {
    total: paginas.filter((p) => p.status === "ativo").length,
    pausadas: paginas.filter((p) => p.status === "pausado").length,
    visualizacoes: paginas.reduce((s, p) => s + (p.visualizacoes || 0), 0),
    cliques: paginas.reduce((s, p) => s + (p.cliques_whatsapp || 0), 0),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Páginas dos Clientes</h1>
        <p className="text-muted-foreground">
          Mini-sites IA com seções por bairro — uma página em <strong>guialocalbr.com.br/[slug]</strong> para cada empresa.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Páginas ativas</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pausadas</p>
            <p className="text-2xl font-bold">{stats.pausadas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Visualizações totais</p>
            <p className="text-2xl font-bold">{stats.visualizacoes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Cliques WhatsApp</p>
            <p className="text-2xl font-bold">{stats.cliques}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar páginas para empresas cadastradas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Buscar empresa por nome ou cidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="max-w-md"
            />
            <Button variant="outline" size="sm" onClick={selecionarTodasSemPagina}>
              Selecionar todas sem página
            </Button>
            <Button
              onClick={() => gerarPaginas(Array.from(selecionadas))}
              disabled={gerando || selecionadas.size === 0}
            >
              {gerando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Gerar {selecionadas.size > 0 ? `(${selecionadas.size})` : ""}
            </Button>
          </div>

          {gerando && (
            <div>
              <Progress value={progresso} />
              <p className="mt-1 text-xs text-muted-foreground">{progresso}%</p>
            </div>
          )}

          {log.length > 0 && (
            <div className="max-h-48 overflow-auto rounded-lg border bg-background p-3 font-mono text-xs">
              {log.map((l, i) => {
                const m = l.match(/\/([a-z0-9-]+)$/);
                if (m) {
                  const slug = m[1];
                  const prefix = l.slice(0, l.length - slug.length - 1);
                  return (
                    <div key={i}>
                      {prefix}
                      <a
                        href={`/${slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline hover:opacity-80"
                      >
                        /{slug}
                      </a>
                    </div>
                  );
                }
                return <div key={i}>{l}</div>;
              })}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Cidade/UF</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-center">Página</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {empresasFiltradas.slice(0, 100).map((e) => {
                    const pagina = paginasPorEmpresa.get(e.id);
                    const tem = !!pagina && pagina.status !== "erro";
                    const comErro = pagina?.status === "erro";
                    return (
                      <TableRow key={e.id}>
                        <TableCell>
                          {(!tem || comErro) && (
                            <Checkbox
                              checked={selecionadas.has(e.id)}
                              onCheckedChange={() => toggleSelecionada(e.id)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{e.nome}</TableCell>
                        <TableCell>{e.cidade}/{e.estado}</TableCell>
                        <TableCell>
                          <Badge variant={e.plano === "premium" ? "default" : "secondary"}>{e.plano}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {comErro ? (
                            <Badge variant="destructive">Erro — regerar</Badge>
                          ) : tem ? (
                            <Badge variant="default" className="bg-green-600">✓ Criada</Badge>
                          ) : (
                            <Badge variant="outline">—</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {empresasFiltradas.length > 100 && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Mostrando 100 de {empresasFiltradas.length}. Use a busca para filtrar.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Páginas criadas ({paginas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {paginas.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">Nenhuma página criada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead className="text-center">Bairros</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Views</TableHead>
                    <TableHead className="text-center">Cliques</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginas.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.empresa_nome}</TableCell>
                      <TableCell className="font-mono text-xs">
                        <a
                          href={`/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline hover:opacity-80"
                        >
                          /{p.slug}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.plano === "premium" ? "default" : "secondary"}>{p.plano}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{p.total_bairros || 0}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={p.status === "ativo" ? "default" : p.status === "gerando" ? "secondary" : "outline"}
                          className={p.status === "ativo" ? "bg-green-600" : ""}
                        >
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{p.visualizacoes || 0}</TableCell>
                      <TableCell className="text-center">{p.cliques_whatsapp || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="sm">
                            <a href={`/${p.slug}`} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => gerarSubs(p, 10)}
                            title="Gerar subpáginas de serviço (SEO)"
                          >
                            <Layers className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => regenerar(p)} title="Regenerar com IA">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => togglePausar(p)} title="Pausar/Ativar">
                            {p.status === "ativo" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => excluir(p)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
