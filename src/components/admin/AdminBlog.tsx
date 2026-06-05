import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles, Pencil, Trash2, Eye, ExternalLink, FileText } from "lucide-react";
import { useBlogPostsAdmin, useExcluirPost, usePublicarPost } from "@/hooks/useBlog";
import { ModalGerarArtigo } from "@/components/blog/ModalGerarArtigo";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type FiltroTipo = "todos" | "empresa" | "artigo" | "rascunho" | "publicado";

export function AdminBlog() {
  const navigate = useNavigate();
  const { data: posts = [], isLoading } = useBlogPostsAdmin();
  const excluir = useExcluirPost();
  const publicar = usePublicarPost();

  const [modalOpen, setModalOpen] = useState(false);
  const [filtro, setFiltro] = useState<FiltroTipo>("todos");
  const [busca, setBusca] = useState("");

  const stats = useMemo(() => ({
    total: posts.length,
    publicados: posts.filter((p) => p.status === "publicado").length,
    rascunhos: posts.filter((p) => p.status === "rascunho").length,
    visualizacoes: posts.reduce((s, p) => s + (p.visualizacoes || 0), 0),
  }), [posts]);

  const filtrados = useMemo(() => {
    let res = posts;
    if (filtro === "empresa" || filtro === "artigo") res = res.filter((p) => p.tipo === filtro);
    else if (filtro === "rascunho" || filtro === "publicado") res = res.filter((p) => p.status === filtro);
    if (busca) res = res.filter((p) => p.titulo.toLowerCase().includes(busca.toLowerCase()));
    return res;
  }, [posts, filtro, busca]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Blog do Guia Local</h1>
          <p className="text-sm text-muted-foreground">Gere e gerencie os artigos do blog</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/admin/blog/novo")}>
            <FileText className="mr-2 h-4 w-4" /> Escrever manualmente
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4" /> Gerar Artigo com IA
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Publicados</p>
          <p className="text-2xl font-bold text-green-600">{stats.publicados}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Rascunhos</p>
          <p className="text-2xl font-bold text-slate-600">{stats.rascunhos}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-muted-foreground">Visualizações</p>
          <p className="text-2xl font-bold">{stats.visualizacoes}</p>
        </CardContent></Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: "todos", label: "Todos" },
          { id: "empresa", label: "Empresas" },
          { id: "artigo", label: "Artigos" },
          { id: "rascunho", label: "Rascunhos" },
          { id: "publicado", label: "Publicados" },
        ].map((f) => (
          <Button key={f.id} size="sm" variant={filtro === f.id ? "default" : "outline"} onClick={() => setFiltro(f.id as FiltroTipo)}>
            {f.label}
          </Button>
        ))}
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por título..."
          className="ml-auto max-w-xs"
        />
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center text-muted-foreground">Carregando...</div>
          ) : filtrados.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">Nenhum post encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="p-3">Título</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Empresa</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Views</th>
                    <th className="p-3">Data</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="p-3 font-medium">{p.titulo}</td>
                      <td className="p-3">
                        <Badge variant={p.tipo === "empresa" ? "default" : "secondary"}>
                          {p.tipo === "empresa" ? "Empresa" : "Artigo"}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">{p.empresa_nome || "—"}</td>
                      <td className="p-3">
                        <Badge variant={p.status === "publicado" ? "default" : p.status === "rascunho" ? "secondary" : "destructive"}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">{p.visualizacoes || 0}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(p.criado_em).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => navigate(`/admin/blog/editar/${p.id}`)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={async () => {
                              await publicar.mutateAsync({ id: p.id, publicar: p.status !== "publicado" });
                              toast({ title: p.status !== "publicado" ? "Publicado" : "Despublicado" });
                            }}
                            title={p.status === "publicado" ? "Despublicar" : "Publicar"}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {p.status === "publicado" && (
                            <Button asChild size="icon" variant="ghost">
                              <Link to={`/blog/${p.tipo === "empresa" ? "empresas" : "artigos"}/${p.slug}`} target="_blank">
                                <ExternalLink className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir post?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O post "{p.titulo}" será removido permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={async () => {
                                  await excluir.mutateAsync(p.id);
                                  toast({ title: "Excluído" });
                                }}>Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ModalGerarArtigo open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
