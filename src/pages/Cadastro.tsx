import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ESTADOS_BR, NICHOS, UPLOAD_LIMITS, PAYMENT_LINK, WHATSAPP_PREMIUM_LINK, PARCEIRO_LIMITS, SITE_URL } from "@/lib/constants";
import { Loader2, Upload, X, Crown, Check, ExternalLink, Sparkles, Copy, LinkIcon, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { HorarioFuncionamento } from "@/components/HorarioFuncionamento";
import { SocialLinksInput } from "@/components/SocialLinksInput";
import type { SocialLink } from "@/lib/social-utils";
import { isValidUrl } from "@/lib/utils";

export default function Cadastro() {
  const { user, isParceiro, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  // Parceiros sempre cadastram como Premium (cortesia, sem pagamento e sem limite)
  const [plano, setPlano] = useState<"free" | "premium">(isParceiro ? "premium" : "free");
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [successData, setSuccessData] = useState<{ nome: string; slug: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  // Form fields
  const [nome, setNome] = useState("");
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [telefone, setTelefone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [site, setSite] = useState("");
  const [nicho, setNicho] = useState("");
  const [horario, setHorario] = useState("");
  const handleHorarioChange = useCallback((val: string) => setHorario(val), []);
  const [redesSociais, setRedesSociais] = useState<SocialLink[]>([]);
  const [premiumCount, setPremiumCount] = useState(0);
  const [cotaPremium, setCotaPremium] = useState(PARCEIRO_LIMITS.premiumEmpresas);
  const [descricao, setDescricao] = useState("");
  const [gerandoDescricao, setGerandoDescricao] = useState(false);
  
  // Images
  const [fotoPrincipal, setFotoPrincipal] = useState<File | null>(null);
  const [fotoPrincipalPreview, setFotoPrincipalPreview] = useState<string>("");
  const [fotosAdicionais, setFotosAdicionais] = useState<File[]>([]);
  const [fotosAdicionaisPreview, setFotosAdicionaisPreview] = useState<string[]>([]);

  // Fetch premium count and individual quota for partners
  useEffect(() => {
    if (user && isParceiro) {
      supabase
        .from("empresas")
        .select("id", { count: "exact", head: true })
        .eq("usuario_id", user.id)
        .eq("plano", "premium")
        .then(({ count }) => setPremiumCount(count || 0));

      (supabase.rpc as any)("get_my_parceiro_info").then(({ data }: { data: { cota_premium: number }[] | null }) => {
        if (data && data.length > 0) {
          setCotaPremium(data[0].cota_premium);
        }
      });
    }
  }, [user, isParceiro]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Garante que parceiro sempre vê o plano Premium pré-selecionado (cortesia)
  useEffect(() => {
    if (isParceiro) setPlano("premium");
  }, [isParceiro]);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const validateFileSize = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo "${file.name}" excede o limite de 5MB. Escolha uma imagem menor.`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleFotoPrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFileSize(file)) {
      setFotoPrincipal(file);
      setFotoPrincipalPreview(URL.createObjectURL(file));
    }
  };

  const handleFotosAdicionaisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(validateFileSize);
    const maxPhotos = UPLOAD_LIMITS.premium.fotos - 1;
    const newFiles = files.slice(0, maxPhotos - fotosAdicionais.length);
    
    setFotosAdicionais(prev => [...prev, ...newFiles]);
    setFotosAdicionaisPreview(prev => [
      ...prev,
      ...newFiles.map(f => URL.createObjectURL(f))
    ]);
  };

  const removeFotoAdicional = (index: number) => {
    setFotosAdicionais(prev => prev.filter((_, i) => i !== index));
    setFotosAdicionaisPreview(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${path}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from("empresas")
      .upload(fileName, file);
    
    if (error) {
      if (import.meta.env.DEV) {
        console.error("Upload error:", error);
      }
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("empresas")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado", variant: "destructive" });
      return;
    }

    if (!nome.trim() || !endereco.trim() || !cidade.trim() || !estado || !telefone.trim() || !whatsapp.trim()) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    // Parceiros têm cadastro Premium ILIMITADO e gratuito (cortesia).
    // Sem checagem de cota — qualquer limite é apenas informativo.

    // Validar URL do site se preenchida
    if (site && site.trim() && !isValidUrl(site.trim())) {
      toast({ title: "Erro", description: "URL do site inválida. Use formato: https://seusite.com", variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      // Upload main photo
      let fotoPrincipalUrl = null;
      if (fotoPrincipal) {
        fotoPrincipalUrl = await uploadImage(fotoPrincipal, user.id);
      }

      // Upload additional photos (premium only)
      let fotosAdicionaisUrls: string[] = [];
      if (plano === "premium" && fotosAdicionais.length > 0) {
        const uploadPromises = fotosAdicionais.map(f => uploadImage(f, user.id));
        const results = await Promise.all(uploadPromises);
        fotosAdicionaisUrls = results.filter(Boolean) as string[];
      }

      // Determine status based on plan and partner status
      let status = "pendente";
      if (plano === "free") {
        status = "aprovado"; // Auto-approve free
      } else if (isParceiro) {
        status = "aprovado"; // Auto-approve for partners
      }

      // Insert empresa
      const { data: insertedData, error } = await supabase.from("empresas").insert({
        usuario_id: user.id,
        nome,
        endereco,
        cidade,
        estado,
        telefone,
        whatsapp,
        site: plano === "premium" ? site : null,
        nicho: nicho || null,
        horario: horario || null,
        foto_principal: fotoPrincipalUrl,
        fotos_adicionais: fotosAdicionaisUrls,
        redes_sociais: redesSociais as any,
        descricao: plano === "premium" && descricao ? descricao : null,
        plano,
        status,
      } as any).select("id, slug, nome").single();

      if (error) throw error;

      if (plano === "premium" && !isParceiro) {
        setShowPaymentInfo(true);
      } else {
        // Show success screen with persistent copy link
        const empresaSlug = insertedData?.slug || insertedData?.id;
        const url = `${SITE_URL}/empresa/${empresaSlug}`;
        setSuccessData({
          nome: insertedData?.nome || nome,
          slug: empresaSlug,
          url,
        });
        toast({
          title: "Empresa cadastrada!",
          description: "Copie o link e compartilhe com seus clientes.",
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Erro ao cadastrar empresa:", error);
      }
      toast({ title: "Erro", description: "Erro ao cadastrar empresa", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copySuccessLink = async () => {
    if (!successData) return;
    try {
      await navigator.clipboard.writeText(successData.url);
      setCopied(true);
      toast({ title: "✅ Link copiado!", description: successData.url });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast({ title: "Erro", description: "Não foi possível copiar o link", variant: "destructive" });
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }
  if (!user) return null;

  // Success screen — persistent link with copy button
  if (successData) {
    return (
      <Layout>
        <div className="container max-w-lg py-16">
          <Card className="border-green-500/30">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="font-display text-2xl">Empresa Cadastrada! 🎉</CardTitle>
              <CardDescription>
                <strong>{successData.nome}</strong> está {plano === "free" || isParceiro ? "online no Guia Local BR" : "aguardando aprovação"}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 p-4">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Link da sua empresa
                </Label>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 truncate rounded-md border border-border bg-background px-3 py-2 text-sm font-mono">
                    {successData.url}
                  </div>
                  <Button
                    type="button"
                    onClick={copySuccessLink}
                    variant={copied ? "default" : "outline"}
                    size="sm"
                    className={copied ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {copied ? (
                      <><Check className="mr-1 h-4 w-4" /> Copiado</>
                    ) : (
                      <><Copy className="mr-1 h-4 w-4" /> Copiar</>
                    )}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Compartilhe este link com seus clientes nas redes sociais, WhatsApp e cartão de visita.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button asChild variant="outline" className="w-full">
                  <a href={successData.url} target="_blank" rel="noopener noreferrer">
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Página
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const text = encodeURIComponent(`Confira: ${successData.nome} no Guia Local BR — ${successData.url}`);
                    window.open(`https://wa.me/?text=${text}`, "_blank");
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Compartilhar
                </Button>
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setSuccessData(null);
                    // Reset minimal form fields for new registration
                    setNome("");
                    setEndereco("");
                    setCidade("");
                    setEstado("");
                    setTelefone("");
                    setWhatsapp("");
                    setSite("");
                    setNicho("");
                    setHorario("");
                    setRedesSociais([]);
                    setDescricao("");
                    setFotoPrincipal(null);
                    setFotoPrincipalPreview("");
                    setFotosAdicionais([]);
                    setFotosAdicionaisPreview([]);
                  }}
                >
                  Cadastrar outra
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => navigate(isParceiro ? "/parceiro" : "/busca")}
                >
                  {isParceiro ? "Ir para Área do Parceiro" : "Explorar empresas"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (showPaymentInfo) {
    return (
      <Layout>
        <div className="container max-w-lg py-16">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
                <Crown className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="font-display text-2xl">Cadastro Recebido!</CardTitle>
              <CardDescription>
                Seu cadastro premium foi recebido. Para ativá-lo, siga os passos abaixo:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <h3 className="mb-2 font-semibold">Ative seu Premium pelo WhatsApp</h3>
                <p className="mb-3 text-sm text-muted-foreground">
                  O Premium é <strong>vitalício</strong>, com pagamento único. Fale com nosso time
                  no WhatsApp (35) 99948-3143 para consultar as condições e liberarmos seu cadastro.
                </p>
                <Button asChild className="w-full">
                  <a href={WHATSAPP_PREMIUM_LINK} target="_blank" rel="noopener noreferrer">
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    Falar no WhatsApp
                  </a>
                </Button>
              </div>

              <Button variant="ghost" onClick={() => navigate("/")} className="w-full">
                Voltar para o Início
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-hero py-12 text-primary-foreground">
        <div className="container">
          <h1 className="font-display text-3xl font-bold md:text-4xl">
            Cadastre Sua Empresa
          </h1>
          <p className="mt-2 text-primary-foreground/80">
            Aumente sua visibilidade e conecte-se com clientes locais
          </p>
        </div>
      </div>

      <div className="container max-w-3xl py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Stepper */}
          <div className="rounded-lg border border-border bg-card p-4">
            <ol className="flex items-center gap-2 sm:gap-4">
              {[
                { n: 1, label: "Plano e Dados" },
                { n: 2, label: "Detalhes" },
                { n: 3, label: "Confirmação" },
              ].map((s, idx, arr) => (
                <li key={s.n} className="flex flex-1 items-center gap-2">
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      step >= (s.n as 1 | 2 | 3)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step > s.n ? <Check className="h-4 w-4" /> : s.n}
                  </div>
                  <span
                    className={`hidden text-sm font-medium sm:inline ${
                      step === s.n ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                  {idx < arr.length - 1 && (
                    <div
                      className={`h-0.5 flex-1 transition-colors ${
                        step > s.n ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </li>
              ))}
            </ol>
          </div>

          <div className={step === 1 ? "space-y-8" : "hidden"}>
          {/* Plan Selection */}
          {isParceiro && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-50/50 p-4 dark:bg-amber-950/20">
              <div className="flex items-start gap-2 text-sm">
                <Crown className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <span className="font-medium">Parceiro — Premium Cortesia 🎁</span>
                  <p className="text-muted-foreground">
                    Como parceiro do Guia Local BR, todos os seus cadastros são <strong>Premium gratuitos e ilimitados</strong>.
                    Aproveite todos os recursos sem custo!
                  </p>
                </div>
              </div>
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Escolha seu Plano</CardTitle>
              <CardDescription>
                Selecione o plano ideal para o seu negócio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={plano}
                onValueChange={(v) => setPlano(v as "free" | "premium")}
                className="grid gap-4 md:grid-cols-2"
              >
                <Label
                  htmlFor="free"
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    plano === "free" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <RadioGroupItem value="free" id="free" className="sr-only" />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Grátis</span>
                    {plano === "free" && <Check className="h-5 w-5 text-primary" />}
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <li>• 1 foto</li>
                    <li>• Informações básicas</li>
                    <li>• Listagem padrão</li>
                  </ul>
                </Label>

                <Label
                  htmlFor="premium"
                  className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                    plano === "premium" ? "border-secondary bg-secondary/5" : "border-border"
                  }`}
                >
                  <RadioGroupItem value="premium" id="premium" className="sr-only" />
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold">
                      <Crown className="h-4 w-4 text-amber-500" />
                      Premium
                    </span>
                    {plano === "premium" && <Check className="h-5 w-5 text-secondary" />}
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <li>• Até 10 fotos</li>
                    <li>• 2 vídeos</li>
                    <li>• Link do site</li>
                    <li>• Destaque na busca</li>
                    <li>• Descrição SEO</li>
                  </ul>
                </Label>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome da Empresa *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Padaria do João"
                  required
                />
              </div>

              <div>
                <Label htmlFor="endereco">Endereço Completo *</Label>
                <Input
                  id="endereco"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Rua, número, bairro"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Ex: São Paulo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado *</Label>
                  <Select value={estado} onValueChange={setEstado} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map((e) => (
                        <SelectItem key={e.sigla} value={e.sigla}>
                          {e.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    className="h-11"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp *</Label>
                  <Input
                    id="whatsapp"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(11) 99999-9999"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          </div>

          <div className={step === 2 ? "space-y-8" : "hidden"}>
          {/* Categoria e Horário (todos os planos) */}
          <Card>
            <CardHeader>
              <CardTitle>Categoria e Horário</CardTitle>
              <CardDescription>
                Ajude os clientes a encontrarem seu negócio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nicho">Nicho/Categoria</Label>
                <Select value={nicho} onValueChange={setNicho}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o nicho" />
                  </SelectTrigger>
                  <SelectContent>
                    {NICHOS.map((n) => (
                      <SelectItem key={n} value={n}>
                        {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <HorarioFuncionamento
                value={horario}
                onChange={handleHorarioChange}
              />
            </CardContent>
          </Card>

          {/* Premium Fields */}
          {plano === "premium" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  Informações Premium
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="site">Site</Label>
                  <Input
                    id="site"
                    value={site}
                    onChange={(e) => setSite(e.target.value)}
                    placeholder="https://seusite.com.br"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="descricao">Descrição SEO</Label>
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
                            toast({ title: "Descrição gerada!", description: "Revise o texto antes de enviar." });
                          }
                        } catch (err: any) {
                          toast({ title: "Erro ao gerar", description: err.message, variant: "destructive" });
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
                    placeholder="Descreva sua empresa para melhorar o SEO..."
                  />
                </div>

                <SocialLinksInput value={redesSociais} onChange={setRedesSociais} />
              </CardContent>
            </Card>
          )}

          {/* Photos */}
          <Card>
            <CardHeader>
              <CardTitle>Fotos</CardTitle>
              <CardDescription>
                {plano === "free" 
                  ? "Adicione 1 foto da sua empresa"
                  : "Adicione até 10 fotos da sua empresa"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Foto Principal</Label>
                <div className="mt-2">
                  {fotoPrincipalPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={fotoPrincipalPreview}
                        alt="Preview"
                        className="h-32 w-32 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFotoPrincipal(null);
                          setFotoPrincipalPreview("");
                        }}
                        className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary">
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="mt-1 text-xs text-muted-foreground">Adicionar</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFotoPrincipalChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {plano === "premium" && (
                <div>
                  <Label>Fotos Adicionais (até 9)</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {fotosAdicionaisPreview.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="h-24 w-24 rounded-lg object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeFotoAdicional(index)}
                          className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {fotosAdicionais.length < 9 && (
                      <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border hover:border-primary">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                        <span className="mt-1 text-xs text-muted-foreground">Adicionar</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFotosAdicionaisChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </div>

          <div className={step === 3 ? "space-y-8" : "hidden"}>
            <Card>
              <CardHeader>
                <CardTitle>Confirmação</CardTitle>
                <CardDescription>Revise as informações antes de enviar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div><span className="text-muted-foreground">Empresa:</span> <strong>{nome || "—"}</strong></div>
                  <div><span className="text-muted-foreground">Plano:</span> <strong className="capitalize">{plano}</strong></div>
                  <div><span className="text-muted-foreground">Cidade:</span> <strong>{cidade || "—"}/{estado || "—"}</strong></div>
                  <div><span className="text-muted-foreground">Categoria:</span> <strong>{nicho || "—"}</strong></div>
                  <div className="sm:col-span-2"><span className="text-muted-foreground">WhatsApp:</span> <strong>{whatsapp || "—"}</strong></div>
                </div>
              </CardContent>
            </Card>

            {plano === "free" && !isParceiro && (
              <Card className="border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" />
                    Aproveite e libere o Premium
                  </CardTitle>
                  <CardDescription>
                    Plano <strong>vitalício</strong> — pagamento único, sem mensalidade. Consulte as condições e ative via WhatsApp.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ul className="grid gap-2 text-sm sm:grid-cols-2">
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-secondary" /> Até 10 fotos e 2 vídeos</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-secondary" /> Link clicável para seu site (DOFOLLOW)</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-secondary" /> Postagem no Blog</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-secondary" /> SEO por bairros da sua cidade</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-secondary" /> Destaque na busca</li>
                    <li className="flex items-center gap-2"><Check className="h-4 w-4 text-secondary" /> Descrição SEO com IA</li>
                  </ul>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                      onClick={() => {
                        setPlano("premium");
                        setStep(2);
                        toast({ title: "Plano Premium selecionado!", description: "Complete os campos extras na etapa 2." });
                      }}
                    >
                      <Crown className="mr-2 h-4 w-4" />
                      Quero Premium
                    </Button>
                    <Button type="button" variant="outline" className="flex-1" onClick={() => { /* fica no free */ }}>
                      Continuar grátis
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-3 sm:flex-row">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="sm:w-40"
                onClick={() => setStep((s) => (s === 3 ? 2 : 1) as 1 | 2 | 3)}
                disabled={loading}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
            )}
            {step < 3 ? (
              <Button
                type="button"
                size="lg"
                className="flex-1"
                onClick={() => {
                  if (step === 1) {
                    if (!nome || !endereco || !cidade || !estado || !telefone || !whatsapp) {
                      toast({ title: "Preencha os campos obrigatórios", description: "Nome, endereço, cidade, estado, telefone e WhatsApp são necessários.", variant: "destructive" });
                      return;
                    }
                    setStep(2);
                  } else if (step === 2) {
                    setStep(3);
                  }
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Continuar
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" size="lg" className="flex-1" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {plano === "premium" && !isParceiro
                  ? "Cadastrar e Ir para Pagamento"
                  : "Cadastrar Empresa"}
              </Button>
            )}
          </div>
        </form>
      </div>
    </Layout>
  );
}
