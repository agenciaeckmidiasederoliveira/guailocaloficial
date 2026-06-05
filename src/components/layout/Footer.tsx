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
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
