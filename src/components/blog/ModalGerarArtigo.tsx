import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Sparkles, Search, X, Loader2, RefreshCw, Save, Rocket, Building2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { gerarArtigoIA, sugerirTemasIA, useSalvarPost, type SugestaoTema } from "@/hooks/useBlog";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

type Modo = "escolher" | "empresa" | "tematico";
type Step = "selecionar" | "configurar" | "gerando" | "preview";

const TEMAS = [
  { titulo: "Google Meu Negócio", icone: "📍" },
  { titulo: "SEO Local", icone: "🔍" },
  { titulo: "Gestão de Negócios", icone: "💼" },
  { titulo: "Marketing Digital", icone: "📱" },
  { titulo: "Avaliações Online", icone: "⭐" },
  { titulo: "Presença Digital", icone: "🗺️" },
  { titulo: "Casos de Sucesso", icone: "🏆" },
  { titulo: "Métricas e Resultados", icone: "📊" },
  { titulo: "Dicas para Empresas", icone: "💡" },
  { titulo: "Atendimento ao Cliente", icone: "🤝" },
];

const LOADING_MSGS = [
  "Analisando dados...",
  "Estruturando o conteúdo...",
  "Otimizando para SEO...",
  "Gerando Schema.org...",
  "Finalizando o artigo...",
];

export function ModalGerarArtigo({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const navigate = useNavigate();
  const salvar = useSalvarPost();

  const [modo, setModo] = useState<Modo>("escolher");
  const [step, setStep] = useState<Step>("selecionar");

  // Empresa flow
  const [busca, setBusca] = useState("");
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [empresaSel, setEmpresaSel] = useState<any | null>(null);
  const [tipoArtigo, setTipoArtigo] = useState("Perfil completo da empresa");
  const [tom, setTom] = useState("Profissional e informativo");

  // Tematico flow
  const [tema, setTema] = useState<string>("");
  const [foco, setFoco] = useState("");
  const [publicoAlvo, setPublicoAlvo] = useState("Donos de pequenas empresas");
  const [tipoConteudo, setTipoConteudo] = useState("Guia prático (passo a passo)");

  // Loading rotativo
  const [loadingIdx, setLoadingIdx] = useState(0);
  useEffect(() => {
    if (step !== "gerando") return;
    const i = setInterval(() => setLoadingIdx((x) => (x + 1) % LOADING_MSGS.length), 1800);
    return () => clearInterval(i);
  }, [step]);

  // Preview state
  const [postGerado, setPostGerado] = useState<any | null>(null);

  // Sugestões de IA
  const [sugestoes, setSugestoes] = useState<SugestaoTema[]>([]);
  const [carregandoSugestoes, setCarregandoSugestoes] = useState(false);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setModo("escolher");
        setStep("selecionar");
        setBusca(""); setEmpresas([]); setEmpresaSel(null);
        setTema(""); setFoco("");
        setPostGerado(null);
        setSugestoes([]);
      }, 300);
    }
  }, [open]);

  const carregarSugestoes = async () => {
    setCarregandoSugestoes(true);
    try {
      const s = await sugerirTemasIA();
      setSugestoes(s);
      if (s.length === 0) toast({ title: "Nenhuma sugestão retornada", variant: "destructive" });
    } catch (e: any) {
      toast({ title: "Erro ao sugerir temas", description: e?.message, variant: "destructive" });
    } finally {
      setCarregandoSugestoes(false);
    }
  };

  // Busca de empresas (debounce)
  useEffect(() => {
    if (modo !== "empresa" || !busca || busca.length < 2) {
      setEmpresas([]);
      return;
    }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("empresas")
        .select("id, nome, cidade, estado, nicho, foto_principal, telefone, whatsapp, site, descricao, endereco")
        .ilike("nome", `%${busca}%`)
        .eq("status", "aprovado")
        .limit(10);
      setEmpresas((data || []) as any[]);
    }, 300);
    return () => clearTimeout(t);
  }, [busca, modo]);

  const escolherModo = (m: Modo) => {
    setModo(m);
    setStep(m === "empresa" ? "selecionar" : "selecionar");
  };

  const gerar = async () => {
    setStep("gerando");
    try {
      let post;
      if (modo === "empresa" && empresaSel) {
        post = await gerarArtigoIA({ modo: "empresa", empresa_id: empresaSel.id, tipoArtigo, tom });
      } else if (modo === "tematico" && tema && foco) {
        post = await gerarArtigoIA({ modo: "tematico", tema, foco, publicoAlvo, tipoConteudo });
      } else {
        throw new Error("Dados insuficientes");
      }
      setPostGerado(post);
      setStep("preview");
    } catch (e: any) {
      toast({ title: "Erro ao gerar", description: e?.message || "Tente novamente", variant: "destructive" });
      setStep("configurar");
    }
  };

  const regenerar = async () => { await gerar(); };

  const salvarComo = async (publicar: boolean) => {
    if (!postGerado) return;
    try {
      const saved = await salvar.mutateAsync({
        ...postGerado,
        status: publicar ? "publicado" : "rascunho",
      });
      toast({ title: publicar ? "Publicado!" : "Salvo como rascunho" });
      onOpenChange(false);
      navigate(`/admin/blog/editar/${saved.id}`);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e?.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar Artigo com IA
          </DialogTitle>
        </DialogHeader>

        {/* ESCOLHER MODO */}
        {modo === "escolher" && (
          <div className="grid gap-4 md:grid-cols-2">
            <button
              onClick={() => escolherModo("empresa")}
              className="group flex flex-col items-center gap-3 rounded-lg border-2 border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg"
            >
              <Building2 className="h-12 w-12 text-primary" />
              <h3 className="text-lg font-semibold">Sobre uma Empresa</h3>
              <p className="text-center text-sm text-muted-foreground">
                Artigo personalizado sobre uma empresa cadastrada no guia
              </p>
            </button>
            <button
              onClick={() => escolherModo("tematico")}
              className="group flex flex-col items-center gap-3 rounded-lg border-2 border-border bg-card p-8 transition-all hover:border-primary hover:shadow-lg"
            >
              <BookOpen className="h-12 w-12 text-primary" />
              <h3 className="text-lg font-semibold">Artigo Temático</h3>
              <p className="text-center text-sm text-muted-foreground">
                SEO local, Google Meu Negócio, dicas para empresas
              </p>
            </button>
          </div>
        )}

        {/* FLUXO EMPRESA */}
        {modo === "empresa" && step === "selecionar" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar empresa pelo nome..."
                className="pl-10"
              />
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {empresas.map((e) => (
                <button
                  key={e.id}
                  onClick={() => { setEmpresaSel(e); setStep("configurar"); }}
                  className="flex w-full items-center justify-between rounded-md border border-border bg-card p-3 text-left hover:border-primary"
                >
                  <div>
                    <div className="font-medium">{e.nome}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.nicho} • {e.cidade} - {e.estado}
                    </div>
                  </div>
                </button>
              ))}
              {busca.length >= 2 && empresas.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma empresa encontrada</p>
              )}
            </div>
          </div>
        )}

        {modo === "empresa" && step === "configurar" && empresaSel && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-md bg-muted p-3">
              <span className="font-medium">{empresaSel.nome}</span>
              <span className="text-sm text-muted-foreground">— {empresaSel.cidade}/{empresaSel.estado}</span>
              <Button size="icon" variant="ghost" className="ml-auto h-7 w-7" onClick={() => { setEmpresaSel(null); setStep("selecionar"); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium">Tipo de artigo</label>
              <Select value={tipoArtigo} onValueChange={setTipoArtigo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Perfil completo da empresa">Perfil completo da empresa</SelectItem>
                  <SelectItem value="Destaques e diferenciais">Destaques e diferenciais</SelectItem>
                  <SelectItem value="Serviços e especialidades">Serviços e especialidades</SelectItem>
                  <SelectItem value="Por que escolher esta empresa">Por que escolher esta empresa</SelectItem>
                  <SelectItem value="História e trajetória">História e trajetória</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Tom do texto</label>
              <Select value={tom} onValueChange={setTom}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Profissional e informativo">Profissional e informativo</SelectItem>
                  <SelectItem value="Descontraído e próximo">Descontraído e próximo</SelectItem>
                  <SelectItem value="Técnico e detalhado">Técnico e detalhado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={gerar} className="w-full" size="lg">
              <Sparkles className="mr-2 h-4 w-4" /> Gerar Artigo
            </Button>
          </div>
        )}

        {/* FLUXO TEMATICO */}
        {modo === "tematico" && step === "selecionar" && (
          <div className="space-y-4">
            {/* IA sugere temas */}
            <div className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold flex items-center gap-1">
                    <Sparkles className="h-4 w-4 text-primary" /> Deixe a IA sugerir temas quentes
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Baseado nos nichos cadastrados no guia e tendências atuais.
                  </p>
                </div>
                <Button size="sm" onClick={carregarSugestoes} disabled={carregandoSugestoes}>
                  {carregandoSugestoes ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {sugestoes.length ? "Sugerir novamente" : "Sugerir temas"}
                </Button>
              </div>
              {sugestoes.length > 0 && (
                <div className="mt-3 grid gap-2">
                  {sugestoes.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setTema(s.tema);
                        setFoco(s.foco);
                        setPublicoAlvo(s.publicoAlvo);
                        setTipoConteudo(s.tipoConteudo);
                        setStep("configurar");
                      }}
                      className="rounded-md border border-border bg-card p-3 text-left hover:border-primary"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{s.tema}</Badge>
                        <span className="text-sm font-medium">{s.foco}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{s.justificativa}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground">Ou escolha um tema manual:</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {TEMAS.map((t) => (
                <button
                  key={t.titulo}
                  onClick={() => { setTema(t.titulo); setStep("configurar"); }}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition ${
                    tema === t.titulo ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl">{t.icone}</span>
                  <span className="text-center text-xs font-medium">{t.titulo}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {modo === "tematico" && step === "configurar" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-md bg-muted p-3">
              <Badge>{tema}</Badge>
              <Button size="icon" variant="ghost" className="ml-auto h-7 w-7" onClick={() => setStep("selecionar")}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <label className="text-sm font-medium">Sobre o que especificamente?</label>
              <Input
                value={foco}
                onChange={(e) => setFoco(e.target.value)}
                placeholder="ex: como responder avaliações negativas no Google"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Público-alvo</label>
              <Select value={publicoAlvo} onValueChange={setPublicoAlvo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Donos de pequenas empresas">Donos de pequenas empresas</SelectItem>
                  <SelectItem value="Profissionais autônomos">Profissionais autônomos</SelectItem>
                  <SelectItem value="Restaurantes e alimentação">Restaurantes e alimentação</SelectItem>
                  <SelectItem value="Prestadores de serviço">Prestadores de serviço</SelectItem>
                  <SelectItem value="Comércio local">Comércio local</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Tipo de conteúdo</label>
              <Select value={tipoConteudo} onValueChange={setTipoConteudo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Guia prático (passo a passo)">Guia prático (passo a passo)</SelectItem>
                  <SelectItem value="Lista de dicas">Lista de dicas</SelectItem>
                  <SelectItem value="Explicação e contexto">Explicação e contexto</SelectItem>
                  <SelectItem value="Erros comuns e como evitar">Erros comuns e como evitar</SelectItem>
                  <SelectItem value="Tendências e novidades">Tendências e novidades</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={gerar} disabled={!foco} className="w-full" size="lg">
              <Sparkles className="mr-2 h-4 w-4" /> Gerar Artigo
            </Button>
          </div>
        )}

        {/* GERANDO */}
        {step === "gerando" && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-base font-medium">{LOADING_MSGS[loadingIdx]}</p>
            <p className="text-xs text-muted-foreground">Isso costuma levar de 8 a 20 segundos</p>
          </div>
        )}

        {/* PREVIEW */}
        {step === "preview" && postGerado && (
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">Título</p>
              <Input
                value={postGerado.titulo}
                onChange={(e) => setPostGerado({ ...postGerado, titulo: e.target.value })}
                className="mt-1 text-lg font-semibold"
              />
              <p className="mt-3 text-xs uppercase text-muted-foreground">Subtítulo</p>
              <Input
                value={postGerado.subtitulo || ""}
                onChange={(e) => setPostGerado({ ...postGerado, subtitulo: e.target.value })}
                className="mt-1"
              />
              <p className="mt-3 text-xs uppercase text-muted-foreground">SEO Title ({(postGerado.seo_title || "").length}/60)</p>
              <Input
                value={postGerado.seo_title || ""}
                onChange={(e) => setPostGerado({ ...postGerado, seo_title: e.target.value })}
                className="mt-1"
              />
              <p className="mt-3 text-xs uppercase text-muted-foreground">SEO Description ({(postGerado.seo_description || "").length}/160)</p>
              <Textarea
                value={postGerado.seo_description || ""}
                onChange={(e) => setPostGerado({ ...postGerado, seo_description: e.target.value })}
                className="mt-1"
                rows={2}
              />
              <p className="mt-3 text-xs uppercase text-muted-foreground">Tags</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {(postGerado.tags || []).map((t: string, i: number) => (
                  <Badge key={i} variant="secondary">{t}</Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs uppercase text-muted-foreground">Preview do conteúdo</p>
              <div
                className="prose-blog max-h-96 overflow-y-auto rounded-md border border-border bg-card p-4"
                dangerouslySetInnerHTML={{ __html: postGerado.conteudo }}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={regenerar}>
                <RefreshCw className="mr-2 h-4 w-4" /> Regenerar
              </Button>
              <Button variant="secondary" onClick={() => salvarComo(false)} disabled={salvar.isPending}>
                <Save className="mr-2 h-4 w-4" /> Salvar Rascunho
              </Button>
              <Button onClick={() => salvarComo(true)} disabled={salvar.isPending}>
                <Rocket className="mr-2 h-4 w-4" /> Publicar Agora
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
