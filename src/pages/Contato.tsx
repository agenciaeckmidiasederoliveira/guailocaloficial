import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useSEO } from "@/hooks/useSEO";
import { SITE_NAME, SITE_URL, SOCIAL_LINKS, WHATSAPP_NUMBER } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageCircle, MapPin } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

const contactSchema = z.object({
  nome: z.string().trim().min(2, "Nome muito curto").max(100),
  email: z.string().trim().email("E-mail inválido").max(255),
  assunto: z.string().trim().min(2).max(150),
  mensagem: z.string().trim().min(10, "Mensagem muito curta").max(2000),
});

export default function Contato() {
  useSEO({
    title: "Contato",
    description: `Fale com a equipe do ${SITE_NAME}. Envie sua mensagem por e-mail, WhatsApp ou pelo formulário de contato.`,
    canonical: `${SITE_URL}/contato`,
  });

  const [form, setForm] = useState({ nome: "", email: "", assunto: "", mensagem: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Verifique os campos");
      return;
    }
    setSending(true);
    const { nome, email, assunto, mensagem } = parsed.data;
    const body = encodeURIComponent(
      `Nome: ${nome}\nE-mail: ${email}\n\n${mensagem}`
    );
    const subject = encodeURIComponent(`[${SITE_NAME}] ${assunto}`);
    window.location.href = `mailto:${SOCIAL_LINKS.email}?subject=${subject}&body=${body}`;
    setTimeout(() => setSending(false), 800);
  };

  return (
    <Layout>
      <div className="container max-w-5xl py-12">
        <h1 className="font-display text-4xl font-bold">Fale com o {SITE_NAME}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Tem dúvidas, sugestões, parcerias ou precisa de suporte? Escolha o canal que preferir —
          respondemos em até 24h úteis.
        </p>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {/* Canais diretos */}
          <div className="space-y-4">
            <a
              href={`mailto:${SOCIAL_LINKS.email}`}
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-secondary"
            >
              <Mail className="h-6 w-6 text-primary" />
              <div>
                <div className="font-semibold">E-mail</div>
                <div className="text-sm text-muted-foreground">{SOCIAL_LINKS.email}</div>
              </div>
            </a>

            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-secondary"
            >
              <MessageCircle className="h-6 w-6 text-primary" />
              <div>
                <div className="font-semibold">WhatsApp</div>
                <div className="text-sm text-muted-foreground">
                  +55 {WHATSAPP_NUMBER.slice(2, 4)} {WHATSAPP_NUMBER.slice(4, 9)}-{WHATSAPP_NUMBER.slice(9)}
                </div>
              </div>
            </a>

            <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
              <MapPin className="h-6 w-6 text-primary" />
              <div>
                <div className="font-semibold">Localização</div>
                <div className="text-sm text-muted-foreground">Pouso Alegre, MG — Brasil</div>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-border bg-card p-6 space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                maxLength={100}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                maxLength={255}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assunto">Assunto</Label>
              <Input
                id="assunto"
                value={form.assunto}
                onChange={(e) => setForm({ ...form, assunto: e.target.value })}
                maxLength={150}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mensagem">Mensagem</Label>
              <Textarea
                id="mensagem"
                rows={6}
                value={form.mensagem}
                onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
                maxLength={2000}
                required
              />
            </div>
            <Button type="submit" disabled={sending} className="w-full">
              {sending ? "Enviando..." : "Enviar mensagem"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Ao enviar, você concorda com nossa{" "}
              <a href="/privacidade" className="underline">Política de Privacidade</a>.
            </p>
          </form>
        </div>
      </div>
    </Layout>
  );
}
