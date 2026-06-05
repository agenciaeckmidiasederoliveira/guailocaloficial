import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Rocket, X } from "lucide-react";
import { useBlogPostById, useSalvarPost } from "@/hooks/useBlog";
import { toast } from "@/hooks/use-toast";

export function AdminBlogEditar() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: post, isLoading } = useBlogPostById(id);
  const salvar = useSalvarPost();

  const [form, setForm] = useState<any>(null);
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    if (post) setForm({ ...post });
  }, [post]);

  if (isLoading || !form) {
    return <div className="p-12 text-center text-muted-foreground">Carregando...</div>;
  }

  const update = (patch: any) => setForm((f: any) => ({ ...f, ...patch }));

  const addTag = (t: string) => {
    const v = t.trim();
    if (!v) return;
    if ((form.tags || []).includes(v)) return;
    update({ tags: [...(form.tags || []), v] });
    setTagInput("");
  };

  const removeTag = (t: string) => {
    update({ tags: (form.tags || []).filter((x: string) => x !== t) });
  };

  const handleSalvar = async (publicar: boolean) => {
    try {
      const payload: any = { ...form };
      if (publicar) payload.status = "publicado";
      await salvar.mutateAsync(payload);
      toast({ title: publicar ? "Publicado!" : "Salvo" });
      if (publicar) navigate("/admin/blog");
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message, variant: "destructive" });
    }
  };

  const seoTitleLen = (form.seo_title || "").length;
  const seoDescLen = (form.seo_description || "").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/blog")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-2xl font-bold">Editar Post</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => handleSalvar(false)} disabled={salvar.isPending}>
            <Save className="mr-2 h-4 w-4" /> Salvar
          </Button>
          <Button onClick={() => handleSalvar(true)} disabled={salvar.isPending}>
            <Rocket className="mr-2 h-4 w-4" /> Publicar
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulário */}
        <Card>
          <CardContent className="space-y-4 p-5">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input value={form.titulo || ""} onChange={(e) => update({ titulo: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Subtítulo</label>
              <Input value={form.subtitulo || ""} onChange={(e) => update({ subtitulo: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onValueChange={(v) => update({ status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rascunho">Rascunho</SelectItem>
                    <SelectItem value="publicado">Publicado</SelectItem>
                    <SelectItem value="arquivado">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <Select value={form.tipo} onValueChange={(v) => update({ tipo: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empresa">Empresa</SelectItem>
                    <SelectItem value="artigo">Artigo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Resumo</label>
              <Textarea value={form.resumo || ""} onChange={(e) => update({ resumo: e.target.value })} rows={2} />
            </div>

            <div>
              <label className="text-sm font-medium">Tags (Enter ou vírgula para adicionar)</label>
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag(tagInput.replace(",", ""));
                  }
                }}
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {(form.tags || []).map((t: string) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button onClick={() => removeTag(t)}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            </div>

            <details className="rounded-md border border-border p-3">
              <summary className="cursor-pointer text-sm font-medium">SEO</summary>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs">SEO Title <span className={seoTitleLen > 60 ? "text-destructive" : "text-muted-foreground"}>({seoTitleLen}/60)</span></label>
                  <Input value={form.seo_title || ""} onChange={(e) => update({ seo_title: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs">SEO Description <span className={seoDescLen > 160 ? "text-destructive" : "text-muted-foreground"}>({seoDescLen}/160)</span></label>
                  <Textarea value={form.seo_description || ""} onChange={(e) => update({ seo_description: e.target.value })} rows={2} />
                </div>
                <div>
                  <label className="text-xs">SEO Keywords</label>
                  <Input value={form.seo_keywords || ""} onChange={(e) => update({ seo_keywords: e.target.value })} />
                </div>
                <div className="rounded-md border border-border bg-muted/40 p-3 text-xs">
                  <div className="text-blue-700">{form.seo_title || form.titulo}</div>
                  <div className="text-green-700">www.guialocalbr.com.br/blog/{form.tipo === "empresa" ? "empresas" : "artigos"}/{form.slug}</div>
                  <div className="text-muted-foreground">{form.seo_description || form.resumo}</div>
                </div>
              </div>
            </details>

            <div>
              <label className="text-sm font-medium">Conteúdo (HTML)</label>
              <Textarea
                value={form.conteudo || ""}
                onChange={(e) => update({ conteudo: e.target.value })}
                rows={20}
                className="font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardContent className="p-5">
            <p className="mb-3 text-xs uppercase text-muted-foreground">Preview</p>
            <h2 className="font-display text-2xl font-bold">{form.titulo}</h2>
            {form.subtitulo && <p className="mt-1 text-muted-foreground">{form.subtitulo}</p>}
            <div className="mt-4 prose-blog" dangerouslySetInnerHTML={{ __html: form.conteudo || "" }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
