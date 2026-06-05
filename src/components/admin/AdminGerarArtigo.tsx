import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Sparkles,
  Copy,
  Eye,
  RotateCw,
  Check,
  KeyRound,
  ArrowRight,
  Loader2,
} from "lucide-react";

const LS_OPENAI = "guia_openai_key";
const LS_GEMINI = "guia_gemini_key";

interface ArticleResult {
  conteudo_markdown: string;
  meta_description: string;
  slug: string;
  tags: string[];
  resumo: string;
}

const CATEGORIAS = [
  "Alimentação",
  "Saúde & Beleza",
  "Automotivo",
  "Construção",
  "Educação",
  "Comércio",
  "Outros",
];

const INTENCOES = ["Informacional", "Comercial", "Transacional"];

const CAT_COLORS: Record<string, string> = {
  "Alimentação": "bg-orange-500",
  "Saúde & Beleza": "bg-pink-500",
  "Automotivo": "bg-slate-700",
  "Construção": "bg-amber-600",
  "Educação": "bg-blue-500",
  "Comércio": "bg-emerald-500",
  "Outros": "bg-zinc-500",
};

const LOADING_MSGS = [
  "✍️ Gerando introdução...",
  "📐 Estruturando os H2...",
  "🔍 Otimizando para SEO...",
  "🏁 Finalizando o artigo...",
];

const SYSTEM_PROMPT =
  "Você é um redator especialista em SEO local brasileiro. Escreva artigos completos e otimizados para o blog do guialocalbr.com.br — um diretório de empresas locais de todo o Brasil. Responda SOMENTE com JSON válido, sem markdown, sem blocos de código, sem texto antes ou depois do JSON.";

function buildUserPrompt(f: {
  titulo: string;
  keyword: string;
  categoria: string;
  intencao: string;
  cta: string;
  cidade: string;
}) {
  const cidade = f.cidade.trim() || "Nacional";
  return `Gere um artigo SEO completo com os dados abaixo.

Título: ${f.titulo}
Keyword principal: ${f.keyword}
Categoria: ${f.categoria}
Intenção de busca: ${f.intencao}
CTA final para: ${f.cta}
Cidade/abrangência: ${cidade}

Estrutura obrigatória:
1. Introdução (2 parágrafos) — problema do leitor e como o artigo resolve
2. H2: [subtema 1] — ponto prático com exemplos reais
3. H2: [subtema 2] — dicas com lista bullet obrigatória
4. H2: [subtema 3] — comparativo ou cenário prático
5. H2: Como encontrar ${f.cta} perto de você — mencione o diretório com link: [encontre ${f.cta} no Guia Local BR](https://guialocalbr.com.br)
6. Conclusão — resumo + CTA

Regras de SEO:
- Keyword nos primeiros 100 caracteres
- Keyword repetida 3 a 5 vezes naturalmente
- 2 a 3 variações semânticas
- Mínimo 950 palavras
- Tom: direto, útil, português brasileiro informal mas profissional
- NÃO mencione concorrentes
- NÃO use "no mundo atual" ou "nos dias de hoje"

Parágrafo final obrigatório:
"Está procurando ${f.cta} de confiança perto de você? No Guia Local BR você encontra empresas avaliadas, com contato direto e endereço verificado. [Busque ${f.cta} agora →](https://guialocalbr.com.br)"

Retorne APENAS este JSON:
{
  "conteudo_markdown": "artigo completo em markdown",
  "meta_description": "texto de 150 a 160 caracteres com a keyword incluída",
  "slug": "slug-url-sem-acentos-sem-espacos",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "resumo": "1 parágrafo curto para preview do post"
}`;
}

function parseResposta(texto: string): ArticleResult {
  try {
    return JSON.parse(texto);
  } catch {
    const match = texto.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Resposta da IA não é um JSON válido.");
  }
}

async function chamarOpenAI(userPrompt: string, key: string): Promise<ArticleResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 3500,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI erro ${res.status}`);
  const data = await res.json();
  return parseResposta(data.choices[0].message.content);
}

async function chamarGemini(userPrompt: string, key: string): Promise<ArticleResult> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\n" + userPrompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 3500 },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini erro ${res.status}`);
  const data = await res.json();
  return parseResposta(data.candidates[0].content.parts[0].text);
}

export function AdminGerarArtigo() {
  // Form
  const [titulo, setTitulo] = useState("");
  const [keyword, setKeyword] = useState("");
  const [categoria, setCategoria] = useState("Outros");
  const [intencao, setIntencao] = useState("Informacional");
  const [cta, setCta] = useState("");
  const [cidade, setCidade] = useState("");

  // Keys
  const [openaiKey, setOpenaiKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");

  // Generation state
  const [gerando, setGerando] = useState(false);
  const [statusGeracao, setStatusGeracao] = useState(LOADING_MSGS[0]);
  const [resultado, setResultado] = useState<ArticleResult | null>(null);
  const [provedorUsado, setProvedorUsado] = useState<string>("");
  const [verModal, setVerModal] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    setOpenaiKey(localStorage.getItem(LS_OPENAI) || "");
    setGeminiKey(localStorage.getItem(LS_GEMINI) || "");
  }, []);

  function saveKey(which: "openai" | "gemini", value: string) {
    if (which === "openai") {
      setOpenaiKey(value);
      if (value) localStorage.setItem(LS_OPENAI, value);
      else localStorage.removeItem(LS_OPENAI);
    } else {
      setGeminiKey(value);
      if (value) localStorage.setItem(LS_GEMINI, value);
      else localStorage.removeItem(LS_GEMINI);
    }
  }

  const podeGerar =
    titulo.trim().length > 0 &&
    keyword.trim().length > 0 &&
    (openaiKey.length > 0 || geminiKey.length > 0) &&
    !gerando;

  function startLoadingRotator() {
    let i = 0;
    setStatusGeracao(LOADING_MSGS[0]);
    intervalRef.current = window.setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length;
      setStatusGeracao(LOADING_MSGS[i]);
    }, 2000);
  }
  function stopLoadingRotator() {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
  }

  async function gerarComFallback(prompt: string) {
    const ok = localStorage.getItem(LS_OPENAI);
    const gk = localStorage.getItem(LS_GEMINI);

    if (gk) {
      try {
        const r = await chamarGemini(prompt, gk);
        return { resultado: r, provedorUsado: "Gemini 2.5 Flash" };
      } catch (err) {
        console.warn("Gemini falhou, tentando OpenAI...", err);
        toast.warning("⚠️ Gemini indisponível — usando OpenAI automaticamente", {
          className: "border-amber-500",
        });
        setStatusGeracao("Gemini indisponível, tentando OpenAI...");
      }
    }
    if (ok) {
      try {
        const r = await chamarOpenAI(prompt, ok);
        return { resultado: r, provedorUsado: "OpenAI GPT-4o-mini" };
      } catch {
        throw new Error("Ambas as APIs falharam. Verifique suas chaves e conexão.");
      }
    }
    throw new Error("Nenhuma chave de API configurada.");
  }

  async function handleGerar() {
    if (!podeGerar) return;
    setResultado(null);
    setProvedorUsado("");
    setGerando(true);
    startLoadingRotator();
    try {
      const prompt = buildUserPrompt({ titulo, keyword, categoria, intencao, cta, cidade });
      const { resultado: r, provedorUsado: p } = await gerarComFallback(prompt);
      setResultado(r);
      setProvedorUsado(p);
      toast.success(`Artigo gerado com ${p}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar artigo");
    } finally {
      stopLoadingRotator();
      setGerando(false);
    }
  }

  function copiarArtigo() {
    if (!resultado) return;
    navigator.clipboard.writeText(resultado.conteudo_markdown);
    setCopiado(true);
    toast.success("Artigo copiado!");
    setTimeout(() => setCopiado(false), 2000);
  }

  function copiarSlug() {
    if (!resultado) return;
    navigator.clipboard.writeText(`/blog/${resultado.slug}`);
    toast.success("Slug copiado");
  }

  function resetar() {
    setResultado(null);
    setProvedorUsado("");
  }

  const metaLen = resultado?.meta_description.length || 0;
  const metaOk = metaLen >= 150 && metaLen <= 160;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Sparkles className="h-6 w-6 text-primary" />
          Gerador de artigos com IA
        </h1>
        <p className="text-sm text-muted-foreground">
          Alternância automática entre Gemini 2.5 Flash e OpenAI GPT-4o-mini com fallback.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card esquerdo — Formulário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Briefing do artigo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: Como escolher uma boa pizzaria em São Paulo"
              />
            </div>
            <div>
              <Label htmlFor="keyword">Keyword principal *</Label>
              <Input
                id="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Ex: melhor pizzaria"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Intenção</Label>
                <Select value={intencao} onValueChange={setIntencao}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INTENCOES.map((i) => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="cta">CTA categoria</Label>
              <Input
                id="cta"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
                placeholder="ex: restaurantes, mecânicas"
              />
            </div>
            <div>
              <Label htmlFor="cidade">Cidade (opcional)</Label>
              <Input
                id="cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="Nacional"
              />
            </div>
          </CardContent>
        </Card>

        {/* Card direito — APIs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" /> Chaves de API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="gemini">Gemini 2.5 Flash (Principal)</Label>
              <Input
                id="gemini"
                type="password"
                value={geminiKey}
                onChange={(e) => saveKey("gemini", e.target.value)}
                placeholder="AIza..."
                autoComplete="off"
              />
            </div>
            <div>
              <Label htmlFor="openai">OpenAI GPT-4o-mini (Fallback)</Label>
              <Input
                id="openai"
                type="password"
                value={openaiKey}
                onChange={(e) => saveKey("openai", e.target.value)}
                placeholder="sk-..."
                autoComplete="off"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              As chaves ficam salvas apenas no seu navegador.
            </p>

            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="mb-2 text-xs font-medium text-muted-foreground">
                Ordem de tentativa
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">1º Gemini 2.5 Flash</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary">2º OpenAI GPT-4o-mini</Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Se a primeira falhar, a segunda é usada automaticamente.
              </p>
            </div>

            <Button
              size="lg"
              className="w-full"
              disabled={!podeGerar}
              onClick={handleGerar}
            >
              {gerando ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando…</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Gerar artigo com IA</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Loading card */}
      {gerando && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-6">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="font-medium">{statusGeracao}</span>
          </CardContent>
        </Card>
      )}

      {/* Resultado */}
      {resultado && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-600 hover:bg-emerald-700">
                ✅ Gerado com {provedorUsado}
              </Badge>
              <Badge className={`${CAT_COLORS[categoria] || "bg-zinc-500"} text-white`}>
                {categoria}
              </Badge>
            </div>
            <CardTitle className="mt-3 text-xl">{titulo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="text-xs font-medium text-muted-foreground">
                Meta description
              </div>
              <p className="mt-1 italic text-muted-foreground">
                {resultado.meta_description}
              </p>
              <p className={`mt-1 text-xs font-semibold ${metaOk ? "text-emerald-600" : "text-red-600"}`}>
                {metaLen} caracteres {metaOk ? "✓" : "(ideal: 150–160)"}
              </p>
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground">Slug</div>
              <div className="mt-1 flex items-center gap-2">
                <code className="rounded bg-muted px-2 py-1 text-sm">
                  /blog/{resultado.slug}
                </code>
                <Button size="sm" variant="ghost" onClick={copiarSlug}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-muted-foreground">Tags</div>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {resultado.tags.map((t) => (
                  <Badge key={t} variant="outline" className="cursor-pointer">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="text-xs font-medium text-muted-foreground">Resumo</div>
              <p className="mt-1 text-sm">{resultado.resumo}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={copiarArtigo}>
                {copiado ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                Copiar artigo completo
              </Button>
              <Button variant="outline" onClick={() => setVerModal(true)}>
                <Eye className="mr-2 h-4 w-4" /> Visualizar artigo
              </Button>
              <Button variant="ghost" onClick={resetar}>
                <RotateCw className="mr-2 h-4 w-4" /> Gerar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de visualização */}
      <Dialog open={verModal} onOpenChange={setVerModal}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
          </DialogHeader>
          {resultado && (
            <Textarea
              readOnly
              value={resultado.conteudo_markdown}
              className="min-h-[60vh] font-mono text-xs"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
