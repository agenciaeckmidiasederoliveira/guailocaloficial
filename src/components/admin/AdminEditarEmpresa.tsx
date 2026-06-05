import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ESTADOS_BR, NICHOS } from "@/lib/constants";
import { HorarioFuncionamento } from "@/components/HorarioFuncionamento";
import { ArrowLeft, Loader2, Save, Sparkles, Wand2, Trash2, Plus } from "lucide-react";
import { SocialLinksInput } from "@/components/SocialLinksInput";
import type { SocialLink } from "@/lib/social-utils";

type FAQItem = { pergunta: string; resposta: string };

export function AdminEditarEmpresa() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gerandoDescricao, setGerandoDescricao] = useState(false);
  const [gerandoPacote, setGerandoPacote] = useState(false);

  // Form state
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [site, setSite] = useState("");
  const [descricao, setDescricao] = useState("");
  const [horario, setHorario] = useState("");
  const [nicho, setNicho] = useState("");
  const [plano, setPlano] = useState<"free" | "premium">("free");
  const [status, setStatus] = useState<"pendente" | "aprovado" | "rejeitado">("pendente");
  const [destaqueBanner, setDestaqueBanner] = useState(false);
  const [destaqueRotacao, setDestaqueRotacao] = useState(false);
  const [dataExpiracaoDestaque, setDataExpiracaoDestaque] = useState<string>("");
  const [redesSociais, setRedesSociais] = useState<SocialLink[]>([]);
  const [metaDescription, setMetaDescription] = useState("");
  const [faq, setFaq] = useState<FAQItem[]>([]);

  useEffect(() => {
    if (id) {
      fetchEmpresa();
    }
  }, [id]);

  const fetchEmpresa = async () => {
    const { data, error } = await supabase
      .from("empresas")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast({ title: "Erro", description: "Empresa não encontrada", variant: "destructive" });
      navigate("/admin/empresas");
      return;
    }

    if (data) {
      setNome(data.nome || "");
      setEndereco(data.endereco || "");
      setCidade(data.cidade || "");
      setEstado(data.estado || "");
      setTelefone(data.telefone || "");
      setWhatsapp(data.whatsapp || "");
      setSite(data.site || "");
      setDescricao(data.descricao || "");
      setHorario(data.horario || "");
      setNicho(data.nicho || "");
      setPlano((data.plano as "free" | "premium") || "free");
      setStatus((data.status as "pendente" | "aprovado" | "rejeitado") || "pendente");
      setDestaqueBanner(data.destaque_banner || false);
      setDestaqueRotacao(data.destaque_rotacao || false);
      const exp = (data as any).data_expiracao_destaque as string | null;
      setDataExpiracaoDestaque(exp ? exp.substring(0, 10) : "");
      setRedesSociais(Array.isArray(data.redes_sociais) ? (data.redes_sociais as unknown as SocialLink[]) : []);
      setMetaDescription((data as any).meta_description || "");
      const rawFaq = (data as any).faq;
      setFaq(Array.isArray(rawFaq) ? (rawFaq as FAQItem[]) : []);
    }
    setLoading(false);
  };

  const handleHorarioChange = useCallback((val: string) => setHorario(val), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from("empresas")
      .update({
        nome,
        endereco,
        cidade,
        estado,
        telefone,
        whatsapp,
        site,
        descricao,
        horario,
        nicho,
        plano,
        status,
        destaque_banner: destaqueBanner,
        destaque_rotacao: destaqueRotacao,
        data_expiracao_destaque: dataExpiracaoDestaque ? new Date(dataExpiracaoDestaque + "T23:59:59").toISOString() : null,
        redes_sociais: redesSociais as any,
        meta_description: metaDescription || null,
        faq: faq as any,
      } as any)
      .eq("id", id);

    setSaving(false);

    if (error) {
      toast({ title: "Erro", description: "Falha ao salvar alterações", variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Empresa atualizada!" });
      navigate("/admin/empresas");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/empresas")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Editar Empresa</h1>
          <p className="text-muted-foreground">{nome}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Empresa *</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nicho">Nicho</Label>
                <Select value={nicho} onValueChange={setNicho}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nicho" />
                  </SelectTrigger>
                  <SelectContent>
                    {NICHOS.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={gerandoDescricao || !nome}
                    onClick={async () => {
                      setGerandoDescricao(true);
                      try {
                        const { data, error } = await supabase.functions.invoke("gerar-descricao-ia", {
                          body: { nome, nicho, cidade, estado, endereco },
                        });
                        if (error) throw error;
                        if (data?.descricao) {
                          setDescricao(data.descricao);
                          toast({ title: "Descrição gerada!", description: "Revise o texto antes de salvar." });
                        }
                      } catch (err: any) {
                        toast({ title: "Erro ao gerar descrição", description: err.message, variant: "destructive" });
                      } finally {
                        setGerandoDescricao(false);
                      }
                    }}
                  >
                    {gerandoDescricao ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                    Gerar com IA
                  </Button>
                </div>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={4}
                  placeholder="Descreva a empresa..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card>
            <CardHeader>
              <CardTitle>Localização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço *</Label>
                <Input id="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} required />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input id="cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado *</Label>
                  <Select value={estado} onValueChange={setEstado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map((e) => (
                        <SelectItem key={e.sigla} value={e.sigla}>{e.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="site">Site</Label>
                <Input id="site" value={site} onChange={(e) => setSite(e.target.value)} placeholder="https://..." />
              </div>

              <SocialLinksInput value={redesSociais} onChange={setRedesSociais} />
            </CardContent>
          </Card>

          {/* Status e Plano */}
          <Card>
            <CardHeader>
              <CardTitle>Status e Plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Plano</Label>
                  <Select value={plano} onValueChange={(v) => setPlano(v as "free" | "premium")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Grátis</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="rejeitado">Rejeitado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Destaque Banner</Label>
                    <p className="text-sm text-muted-foreground">Exibir no banner principal</p>
                  </div>
                  <Switch checked={destaqueBanner} onCheckedChange={setDestaqueBanner} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Destaque Rotação</Label>
                    <p className="text-sm text-muted-foreground">Exibir na rotação</p>
                  </div>
                  <Switch checked={destaqueRotacao} onCheckedChange={setDestaqueRotacao} />
                </div>
                {(destaqueBanner || destaqueRotacao) && (
                  <div className="space-y-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-3 dark:bg-amber-950/20">
                    <Label htmlFor="exp-destaque">Data de expiração do destaque</Label>
                    <Input
                      id="exp-destaque"
                      type="date"
                      value={dataExpiracaoDestaque}
                      onChange={(e) => setDataExpiracaoDestaque(e.target.value)}
                      min={new Date().toISOString().substring(0, 10)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Deixe em branco para destaque permanente. Destaques expirados são desativados automaticamente todos os dias às 03h.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pacote SEO IA (Premium) */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5 text-primary" />
                    Pacote SEO com IA
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Gera descrição (até 200 palavras), meta description (até 160 caracteres) e 3 perguntas frequentes otimizadas para busca local.
                    {plano !== "premium" && " Disponível apenas para empresas Premium."}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  disabled={gerandoPacote || plano !== "premium" || !nome}
                  onClick={async () => {
                    setGerandoPacote(true);
                    try {
                      const { data, error } = await supabase.functions.invoke("gerar-descricao-ia", {
                        body: { nome, nicho, cidade, estado, endereco, modo: "completo" },
                      });
                      if (error) throw error;
                      if (data?.descricao) setDescricao(data.descricao);
                      if (data?.meta_description) setMetaDescription(data.meta_description);
                      if (Array.isArray(data?.faq)) setFaq(data.faq);
                      toast({
                        title: "Pacote SEO gerado!",
                        description: "Revise descrição, meta e FAQ antes de salvar.",
                      });
                    } catch (err: any) {
                      toast({
                        title: "Erro ao gerar pacote",
                        description: err.message,
                        variant: "destructive",
                      });
                    } finally {
                      setGerandoPacote(false);
                    }
                  }}
                >
                  {gerandoPacote ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Gerar pacote SEO (descrição + meta + FAQ)
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="meta-description">Meta description (SEO)</Label>
                  <span
                    className={`text-xs ${
                      metaDescription.length > 160 ? "text-destructive" : "text-muted-foreground"
                    }`}
                  >
                    {metaDescription.length}/160
                  </span>
                </div>
                <Textarea
                  id="meta-description"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={2}
                  maxLength={200}
                  placeholder="Texto exibido nos resultados do Google (máx 160 caracteres)..."
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>FAQ (Perguntas frequentes)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFaq([...faq, { pergunta: "", resposta: "" }])}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Adicionar
                  </Button>
                </div>
                {faq.length === 0 && (
                  <p className="rounded-md border border-dashed bg-muted/40 px-3 py-4 text-center text-sm text-muted-foreground">
                    Nenhuma pergunta cadastrada. Use o botão "Gerar pacote SEO" ou adicione manualmente.
                  </p>
                )}
                {faq.map((item, idx) => (
                  <div key={idx} className="space-y-2 rounded-lg border bg-card p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Pergunta {idx + 1}
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setFaq(faq.filter((_, i) => i !== idx))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={item.pergunta}
                      onChange={(e) => {
                        const next = [...faq];
                        next[idx] = { ...next[idx], pergunta: e.target.value };
                        setFaq(next);
                      }}
                      placeholder="Ex: Vocês atendem aos finais de semana?"
                    />
                    <Textarea
                      value={item.resposta}
                      onChange={(e) => {
                        const next = [...faq];
                        next[idx] = { ...next[idx], resposta: e.target.value };
                        setFaq(next);
                      }}
                      rows={2}
                      placeholder="Resposta curta e objetiva..."
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Horário */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Horário de Funcionamento</CardTitle>
            </CardHeader>
            <CardContent>
              <HorarioFuncionamento value={horario} onChange={handleHorarioChange} />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/empresas")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Salvar Alterações
          </Button>
        </div>
      </form>
    </div>
  );
}
