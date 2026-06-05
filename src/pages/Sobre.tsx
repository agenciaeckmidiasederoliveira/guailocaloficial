import { Layout } from "@/components/layout/Layout";
import { SOCIAL_LINKS, SITE_NAME } from "@/lib/constants";
import { Mail, ExternalLink } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import { getSocialIcon, getSocialLabel } from "@/lib/social-utils";

const redesSociais = [
  { href: SOCIAL_LINKS.youtube, platform: "youtube" },
  { href: SOCIAL_LINKS.instagram, platform: "instagram" },
  { href: SOCIAL_LINKS.tiktok, platform: "tiktok" },
  { href: SOCIAL_LINKS.facebook, platform: "facebook" },
  { href: SOCIAL_LINKS.linkedin, platform: "linkedin" },
  { href: SOCIAL_LINKS.pinterest, platform: "pinterest" },
  { href: SOCIAL_LINKS.threads, platform: "threads" },
  { href: SOCIAL_LINKS.gmn, platform: "google-meu-negocio" },
];

const ecossistema = [
  { href: SOCIAL_LINKS.siteOficial, label: "Eder Oliveira Digital", desc: "Site oficial" },
  { href: SOCIAL_LINKS.gmnTurbo, label: "GMN Turbo", desc: "Gestão de Google Meu Negócio" },
  { href: SOCIAL_LINKS.qrCodeReview, label: "QRCode Review", desc: "Placas de avaliação QRCode" },
  { href: SOCIAL_LINKS.guiaLocalBr, label: "Guia Local BR", desc: "Guia de negócios locais" },
  { href: SOCIAL_LINKS.blog, label: "Blog", desc: "Conteúdo sobre marketing digital" },
];

export default function Sobre() {
  useSEO({
    title: "Sobre",
    description: "Conheça o Guia Local BR, a plataforma premium para conectar negócios locais aos seus clientes. Criado por Eder Oliveira, especialista em Marketing Digital.",
    canonical: "https://guialocalbr.com.br/sobre",
  });

  return (
    <Layout>
      <div className="container py-12">
        <h1 className="font-display text-4xl font-bold text-foreground">
          Sobre o <span className="text-gradient">{SITE_NAME}</span>
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-muted-foreground">
          O Guia Local BR é a plataforma premium para conectar negócios locais aos seus clientes.
          Com foco em SEO local e visibilidade, ajudamos empresas de todo o Brasil a crescer.
        </p>

        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">Sobre Eder Oliveira</h2>
          <p className="mt-4 text-muted-foreground">
            Especialista em Marketing Digital e Google Meu Negócio (GMN), Eder Oliveira criou
            o Guia Local BR para democratizar o acesso à visibilidade online para pequenos negócios.
          </p>
          
          {/* Redes Sociais com ícones coloridos */}
          <h3 className="mt-8 font-display text-lg font-semibold">Redes Sociais</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {redesSociais.map((social) => {
              const icon = getSocialIcon(social.platform);
              const label = getSocialLabel(social.platform);
              const isImg = typeof icon === "string";
              return (
                <a
                  key={social.href}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-secondary-foreground"
                >
              {isImg ? (
                    <img src={icon as string} alt={label} className="h-5 w-5 rounded-sm" />
                  ) : (() => {
                    const IconComp = icon as React.ComponentType<{ className?: string }>;
                    return <IconComp className="h-4 w-4" />;
                  })()}
                  {label}
                </a>
              );
            })}
            <a
              href={`mailto:${SOCIAL_LINKS.email}`}
              className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-secondary-foreground"
            >
              <Mail className="h-4 w-4" />
              E-mail
            </a>
            <a
              href={SOCIAL_LINKS.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary hover:text-secondary-foreground"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>

          {/* Ecossistema */}
          <h3 className="mt-10 font-display text-lg font-semibold">Ecossistema Eder Oliveira</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ecossistema.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col gap-1 rounded-lg border border-border bg-card p-4 transition-colors hover:border-secondary"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{link.label}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-xs text-muted-foreground">{link.desc}</span>
              </a>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
