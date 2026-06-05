import { Link } from "react-router-dom";
import { SOCIAL_LINKS, SITE_NAME } from "@/lib/constants";
import {
  Youtube,
  Instagram,
  Linkedin,
  Facebook,
  Mail,
  ExternalLink,
} from "lucide-react";
import { getSocialIcon } from "@/lib/social-utils";
import logotipo from "@/assets/logotipo.png";

const socialIcons = [
  { href: SOCIAL_LINKS.youtube, platform: "youtube", label: "YouTube" },
  { href: SOCIAL_LINKS.instagram, platform: "instagram", label: "Instagram" },
  { href: SOCIAL_LINKS.tiktok, platform: "tiktok", label: "TikTok" },
  { href: SOCIAL_LINKS.facebook, platform: "facebook", label: "Facebook" },
  { href: SOCIAL_LINKS.linkedin, platform: "linkedin", label: "LinkedIn" },
  { href: SOCIAL_LINKS.pinterest, platform: "pinterest", label: "Pinterest" },
  { href: SOCIAL_LINKS.threads, platform: "threads", label: "Threads" },
  { href: SOCIAL_LINKS.gmn, platform: "google-meu-negocio", label: "Google Meu Negócio" },
  { href: `mailto:${SOCIAL_LINKS.email}`, icon: Mail, label: "E-mail" },
];

const quickLinks = [
  { to: "/", label: "Início" },
  { to: "/busca", label: "Buscar Empresas" },
  { to: "/categorias", label: "Categorias" },
  { to: "/cidades", label: "Cidades" },
  { to: "/blog", label: "Blog" },
  { to: "/cadastro", label: "Cadastrar Empresa" },
  { to: "/planos", label: "Planos e Preços" },
  { to: "/parceiros", label: "Programa de Parceiros" },
  { to: "/sobre", label: "Sobre Nós" },
  { to: "/contato", label: "Contato" },
  { to: "/privacidade", label: "Política de Privacidade" },
  { to: "/termos", label: "Termos de Uso" },
  { to: "/templates/GuiaLocalBR_Template_Importacao.xlsx", label: "Baixar Planilha Modelo (.xlsx)", external: true },
];

const cidadesPopulares = [
  { estado: "SP", cidade: "Sao-Paulo", label: "São Paulo" },
  { estado: "RJ", cidade: "Rio-de-Janeiro", label: "Rio de Janeiro" },
  { estado: "MG", cidade: "Belo-Horizonte", label: "Belo Horizonte" },
  { estado: "PR", cidade: "Curitiba", label: "Curitiba" },
  { estado: "RS", cidade: "Porto-Alegre", label: "Porto Alegre" },
  { estado: "BA", cidade: "Salvador", label: "Salvador" },
  { estado: "CE", cidade: "Fortaleza", label: "Fortaleza" },
  { estado: "DF", cidade: "Brasilia", label: "Brasília" },
];

const ecosystemLinks = [
  { href: SOCIAL_LINKS.siteOficial, label: "Eder Oliveira Digital" },
  { href: SOCIAL_LINKS.gmnTurbo, label: "GMN Turbo" },
  { href: SOCIAL_LINKS.blog, label: "Blog" },
  { href: SOCIAL_LINKS.qrCodeReview, label: "QRCode Review" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2">
              <img
                src={logotipo}
                alt={SITE_NAME}
                className="h-12 w-auto rounded-lg brightness-110"
              />
            </Link>
            <p className="mt-4 text-sm text-primary-foreground/80">
              Conecte-se aos melhores negócios locais do Brasil. A plataforma definitiva 
              para impulsionar a visibilidade do seu negócio.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-display text-lg font-semibold">Links Rápidos</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.to}>
                  {(link as any).external ? (
                    <a
                      href={link.to}
                      download
                      className="text-sm text-primary-foreground/80 transition-colors hover:text-secondary"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={link.to}
                      className="text-sm text-primary-foreground/80 transition-colors hover:text-secondary"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Ecosystem Links */}
          <div>
            <h3 className="mb-4 font-display text-lg font-semibold">Nosso Ecossistema</h3>
            <ul className="space-y-2">
              {ecosystemLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary-foreground/80 transition-colors hover:text-secondary"
                  >
                    {link.label}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Cidades Populares */}
          <div>
            <h3 className="mb-4 font-display text-lg font-semibold">Cidades Populares</h3>
            <ul className="space-y-2">
              {cidadesPopulares.map((c) => (
                <li key={c.cidade}>
                  <Link
                    to={`/cidade/${c.estado}/${c.cidade}`}
                    className="text-sm text-primary-foreground/80 transition-colors hover:text-secondary"
                  >
                    {c.label}, {c.estado}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="mb-4 font-display text-lg font-semibold">Redes Sociais</h3>
            <div className="flex flex-wrap gap-3">
              {socialIcons.map((social) => {
                const hasIcon = 'icon' in social && social.icon;
                const hasPlatform = 'platform' in social && social.platform;
                const svgIcon = hasPlatform ? getSocialIcon(social.platform!) : null;
                const isImg = typeof svgIcon === "string";

                return (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/10 transition-colors hover:bg-secondary hover:text-secondary-foreground"
                    aria-label={social.label}
                    title={social.label}
                  >
                    {hasIcon ? (
                      <social.icon className="h-5 w-5" />
                    ) : isImg ? (
                      <img src={svgIcon as string} alt={social.label} className="h-6 w-6 rounded-sm" />
                    ) : (
                      <ExternalLink className="h-5 w-5" />
                    )}
                  </a>
                );
              })}
            </div>
            <div className="mt-4">
              <a
                href={SOCIAL_LINKS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Fale Conosco
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-primary-foreground/20 pt-8 text-center">
          <p className="text-sm text-primary-foreground/60">
            © {new Date().getFullYear()} {SITE_NAME} por Eder Oliveira Digital. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
