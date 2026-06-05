import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";
import { useSalvarPost } from "@/hooks/useBlog";
import { toast } from "@/hooks/use-toast";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export function AdminBlogNovo() {
  const navigate = useNavigate();
  const salvar = useSalvarPost();

  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [tipo, setTipo] = useState<"artigo" | "empresa">("artigo");
  const [conteudo, setConteudo] = useState("<h2>Introdução</h2><p>Escreva aqui...</p>");
  const [resumo, setResumo] = useState("");

  const handleSalvar = async () => {
    if (!titulo) {
      toast({ title: "Título é obrigatório", variant: "destructive" });
      return;
    }
    try {
      const post = await salvar.mutateAsync({
        titulo,
        subtitulo,
        tipo,
        conteudo,
        resumo,
        status: "rascunho",
        slug: slugify(titulo) || `post-${Date.now()}`,
        tags: [],
        tempo_leitura: 5,
      });
      toast({ title: "Rascunho criado" });
      navigate(`/admin/blog/editar/${post.id}`);
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/blog")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-display text-2xl font-bold">Novo Post</h1>
        </div>
        <Button onClick={handleSalvar} disabled={salvar.isPending}>
          <Save className="mr-2 h-4 w-4" /> Criar Rascunho
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <label className="text-sm font-medium">Título *</label>
            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Subtítulo</label>
            <Input value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Tipo</label>
            <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="artigo">Artigo</SelectItem>
                <SelectItem value="empresa">Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Resumo</label>
            <Textarea value={resumo} onChange={(e) => setResumo(e.target.value)} rows={2} />
          </div>
          <div>
            <label className="text-sm font-medium">Conteúdo (HTML)</label>
            <Textarea value={conteudo} onChange={(e) => setConteudo(e.target.value)} rows={12} className="font-mono text-xs" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
