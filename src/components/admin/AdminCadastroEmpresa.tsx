import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ESTADOS_BR, NICHOS } from "@/lib/constants";
import { Loader2, Upload, X, Crown, Check, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { HorarioFuncionamento } from "@/components/HorarioFuncionamento";
import { SocialLinksInput } from "@/components/SocialLinksInput";
import type { SocialLink } from "@/lib/social-utils";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function AdminCadastroEmpresa() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [plano, setPlano] = useState<"free" | "premium">("free");
  const [status, setStatus] = useState<"aprovado" | "pendente">("aprovado");
  const [destaqueBanner, setDestaqueBanner] = useState(false);
  const [destaqueRotacao, setDestaqueRotacao] = useState(false);

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
  const [descricao, setDescricao] = useState("");
  const [redesSociais, setRedesSociais] = useState<SocialLink[]>([]);

  // Images
  const [fotoPrincipal, setFotoPrincipal] = useState<File | null>(null);
  const [fotoPrincipalPreview, setFotoPrincipalPreview] = useState<string>("");
  const [fotosAdicionais, setFotosAdicionais] = useState<File[]>([]);
  const [fotosAdicionaisPreview, setFotosAdicionaisPreview] = useState<string[]>([]);

  const validateFileSize = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Arquivo muito grande",
        description: `O arquivo "${file.name}" excede o limite de 5MB. Tamanho: ${(file.size / 1024 / 1024).toFixed(1)}MB`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleFotoPrincipalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!validateFileSize(file)) return;
      setFotoPrincipal(file);
      setFotoPrincipalPreview(URL.createObjectURL(file));
    }
  };

  const handleFotosAdicionaisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(validateFileSize);
    const maxPhotos = 9;
    const newFiles = validFiles.slice(0, maxPhotos - fotosAdicionais.length);

    setFotosAdicionais((prev) => [...prev, ...newFiles]);
    setFotosAdicionaisPreview((prev) => [
      ...prev,
      ...newFiles.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeFotoAdicional = (index: number) => {
    setFotosAdicionais((prev) => prev.filter((_, i) => i !== index));
    setFotosAdicionaisPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (file: File, path: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${path}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage.from("empresas").upload(fileName, file);

    if (error) {
      if (import.meta.env.DEV) console.error("Upload error:", error);
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("empresas").getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome || !endereco || !cidade || !estado || !telefone || !whatsapp) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Upload main photo
      let fotoPrincipalUrl = null;
      if (fotoPrincipal) {
        fotoPrincipalUrl = await uploadImage(fotoPrincipal, "admin");
      }

      // Upload additional photos
      let fotosAdicionaisUrls: string[] = [];
      if (fotosAdicionais.length > 0) {
        const uploadPromises = fotosAdicionais.map((f) => uploadImage(f, "admin"));
        const results = await Promise.all(uploadPromises);
        fotosAdicionaisUrls = results.filter(Boolean) as string[];
      }

      // Admin always saves all fields regardless of plan
      const { error } = await supabase.from("empresas").insert({
        nome,
        endereco,
        cidade,
        estado,
        telefone,
        whatsapp,
        site: site || null,
        nicho: nicho || null,
        horario: horario || null,
        descricao: descricao || null,
        foto_principal: fotoPrincipalUrl,
        fotos_adicionais: fotosAdicionaisUrls,
        redes_sociais: redesSociais as any,
        plano,
        status,
        destaque_banner: destaqueBanner,
        destaque_rotacao: destaqueRotacao,
      } as any);

      if (error) throw error;

      toast({ title: "Sucesso!", description: "Empresa cadastrada com sucesso!" });
      navigate("/admin/empresas");
    } catch (error) {
      if (import.meta.env.DEV) console.error(error);
      toast({ title: "Erro", description: "Erro ao cadastrar empresa", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/empresas">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Cadastrar Nova Empresa
          </h1>
          <p className="text-muted-foreground">Adicione uma empresa manualmente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Plan & Status */}
        <Card>
          <CardHeader>
            <CardTitle>Plano e Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-3 block">Plano</Label>
              <RadioGroup
                value={plano}
                onValueChange={(v) => setPlano(v as "free" | "premium")}
                className="flex gap-4"
              >
                <Label
                  htmlFor="admin-free"
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                    plano === "free" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <RadioGroupItem value="free" id="admin-free" />
                  Grátis
                </Label>
                <Label
                  htmlFor="admin-premium"
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                    plano === "premium" ? "border-secondary bg-secondary/5" : "border-border"
                  }`}
                >
                  <RadioGroupItem value="premium" id="admin-premium" />
                  <Crown className="h-4 w-4 text-amber-500" />
                  Premium
                </Label>
              </RadioGroup>
            </div>

            <div>
              <Label className="mb-3 block">Status Inicial</Label>
              <RadioGroup
                value={status}
                onValueChange={(v) => setStatus(v as "aprovado" | "pendente")}
                className="flex gap-4"
              >
                <Label
                  htmlFor="admin-aprovado"
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                    status === "aprovado" ? "border-secondary bg-secondary/5" : "border-border"
                  }`}
                >
                  <RadioGroupItem value="aprovado" id="admin-aprovado" />
                  <Check className="h-4 w-4 text-secondary" />
                  Aprovado
                </Label>
                <Label
                  htmlFor="admin-pendente"
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 transition-all ${
                    status === "pendente" ? "border-warning bg-warning/5" : "border-border"
                  }`}
                >
                  <RadioGroupItem value="pendente" id="admin-pendente" />
                  Pendente
                </Label>
              </RadioGroup>
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-3">
                <Switch
                  id="destaque-banner"
                  checked={destaqueBanner}
                  onCheckedChange={setDestaqueBanner}
                />
                <Label htmlFor="destaque-banner">Destaque em Banner 24h</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="destaque-rotacao"
                  checked={destaqueRotacao}
                  onCheckedChange={setDestaqueRotacao}
                />
                <Label htmlFor="destaque-rotacao">Destaque em Rotação</Label>
              </div>
            </div>
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
                <Select value={estado} onValueChange={setEstado}>
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
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All fields always visible for admin */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Informações Completas
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

            <div>
              <Label htmlFor="descricao">Descrição SEO</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição otimizada para SEO..."
                rows={4}
              />
            </div>

            <SocialLinksInput value={redesSociais} onChange={setRedesSociais} />
          </CardContent>
        </Card>

        {/* Photos - always show all options for admin */}
        <Card>
          <CardHeader>
            <CardTitle>Fotos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Foto Principal <span className="text-xs text-muted-foreground">(máx. 5MB)</span></Label>
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
                  <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 hover:bg-muted">
                    <Upload className="mb-2 h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Adicionar</span>
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

            <div>
              <Label>Fotos Adicionais (até 9) <span className="text-xs text-muted-foreground">(máx. 5MB cada)</span></Label>
              <div className="mt-2 flex flex-wrap gap-3">
                {fotosAdicionaisPreview.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Foto ${index + 1}`}
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
                {fotosAdicionaisPreview.length < 9 && (
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 hover:bg-muted">
                    <Upload className="mb-1 h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">+</span>
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
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/empresas")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cadastrar Empresa
          </Button>
        </div>
      </form>
    </div>
  );
}
