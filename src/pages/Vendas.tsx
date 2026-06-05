import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSEO } from "@/hooks/useSEO";
import { SITE_NAME, WHATSAPP_PREMIUM_LINK } from "@/lib/constants";
import {
  Check,
  X,
  Crown,
  Star,
  Zap,
  Shield,
  TrendingUp,
  Search,
  Smartphone,
  Globe,
  MessageCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";


const planos = [
  {
    nome: "Grátis",
    preco: "R$ 0",
    periodo: "/para sempre",
    descricao: "Ideal para começar sua presença digital local",
    destaque: false,
    features: [
      { texto: "Nome, endereço e contato", incluido: true },
      { texto: "1 foto do negócio", incluido: true },
      { texto: "WhatsApp clicável", incluido: true },
      { texto: "Nicho e horário de funcionamento", incluido: true },
      { texto: "Visibilidade na busca local", incluido: true },
      { texto: "Galeria com até 10 fotos", incluido: false },
      { texto: "Descrição SEO personalizada", incluido: false },
      { texto: "Link para site próprio", incluido: false },
      { texto: "Redes sociais integradas", incluido: false },
      { texto: "Vídeos do negócio", incluido: false },
      { texto: "Destaque em banner rotativo", incluido: false },
    ],
    cta: "Cadastre-se Grátis",
    ctaLink: "/cadastro",
  },
  {
    nome: "Premium",
    preco: "Vitalício",
    periodo: " — pagamento único",
    descricao: "Pague uma única vez e tenha todos os recursos desbloqueados para sempre. Consulte condições no WhatsApp.",
    destaque: true,
    features: [
      { texto: "Tudo do plano Grátis", incluido: true },
      { texto: "Galeria com até 10 fotos", incluido: true },
      { texto: "Descrição SEO personalizada", incluido: true },
      { texto: "Link DOFOLLOW para seu site — transfere autoridade SEO real do Google", incluido: true },
      { texto: "📝 Postagem exclusiva no Blog do Guia Local BR", incluido: true },
      { texto: "📍 SEO otimizado por bairros da sua cidade", incluido: true },
      { texto: "Redes sociais integradas", incluido: true },
      { texto: "Até 2 vídeos do negócio", incluido: true },
      { texto: "Destaque em banner rotativo", incluido: true },
      { texto: "Prioridade nos resultados de busca", incluido: true },
      { texto: "Selo Premium verificado", incluido: true },
      { texto: "Suporte prioritário via WhatsApp", incluido: true },
    ],
    cta: "Quero ser Premium",
  },
];

const beneficios = [
  { icon: Search, titulo: "SEO Local Otimizado", desc: "Sua empresa aparece nas buscas locais com otimização técnica profissional." },
  { icon: Smartphone, titulo: "100% Responsivo", desc: "Perfil perfeito em qualquer dispositivo: celular, tablet ou computador." },
  { icon: Globe, titulo: "Visibilidade Nacional", desc: "Seja encontrado por clientes de todo o Brasil com facilidade." },
  { icon: MessageCircle, titulo: "WhatsApp Direto", desc: "Botão de WhatsApp clicável para contato instantâneo com seus clientes." },
  { icon: TrendingUp, titulo: "Mais Clientes", desc: "Aumente suas vendas com uma presença digital profissional e completa." },
  { icon: Shield, titulo: "Plataforma Segura", desc: "Seus dados protegidos com criptografia e servidores de alta performance." },
];

const depoimentos = [
  { nome: "Maria S.", cidade: "São Paulo, SP", texto: "Depois que cadastrei minha loja no Guia Local BR, meus clientes no WhatsApp aumentaram em 40%! Recomendo demais.", estrelas: 5, nicho: "Loja de Roupas" },
  { nome: "Carlos R.", cidade: "Belo Horizonte, MG", texto: "O plano Premium fez toda a diferença. Minhas fotos e descrição aparecem lindas e profissionais. Valeu cada centavo!", estrelas: 5, nicho: "Restaurante" },
  { nome: "Ana L.", cidade: "Curitiba, PR", texto: "Simples de usar e muito eficiente. Em menos de 5 minutos meu negócio já estava cadastrado e visível.", estrelas: 5, nicho: "Salão de Beleza" },
  { nome: "Pedro M.", cidade: "Rio de Janeiro, RJ", texto: "A melhor plataforma de guia comercial que já usei. Interface moderna e suporte excepcional pelo WhatsApp.", estrelas: 4, nicho: "Pet Shop" },
];

const numeros = [
  { valor: "500+", label: "Empresas Cadastradas" },
  { valor: "50K+", label: "Buscas Mensais" },
  { valor: "27", label: "Estados Atendidos" },
  { valor: "98%", label: "Satisfação" },
];

export default function Vendas() {
  useSEO({
    title: "Planos",
    description: "Cadastre sua empresa no Guia Local BR. Plano Grátis vitalício ou Premium pagamento único (vitalício). Postagem no blog e SEO por bairros. Consulte o Premium pelo WhatsApp.",
    canonical: "https://guialocalbr.com.br/planos",
  });

  const handlePremiumClick = () => {
    window.open(WHATSAPP_PREMIUM_LINK, "_blank", "noopener,noreferrer");
  };


  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 py-20 text-primary-foreground lg:py-28">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMkgydjJoMzR6TTIgMjBoMzR2MkgydjJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-6 bg-secondary/20 text-secondary-foreground backdrop-blur border-secondary/30 px-4 py-1.5 text-sm">
              <Sparkles className="mr-1.5 h-4 w-4" />
              A plataforma #1 de guias comerciais locais
            </Badge>
            <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Coloque seu negócio no{" "}
              <span className="bg-gradient-to-r from-secondary to-emerald-300 bg-clip-text text-transparent">
                mapa digital
              </span>
            </h1>
            <p className="mt-6 text-lg text-primary-foreground/80 sm:text-xl">
              Milhares de clientes procuram por negócios como o seu todos os dias.
              Esteja presente quando eles procurarem.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base px-8" asChild>
                <Link to="/cadastro">
                  Cadastrar minha empresa
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground text-base px-8" asChild>
                <a href="#planos">Ver Planos</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Números */}
      <section className="border-b border-border bg-card py-12">
        <div className="container">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {numeros.map((n) => (
              <div key={n.label} className="text-center">
                <p className="font-display text-3xl font-extrabold text-primary sm:text-4xl">{n.valor}</p>
                <p className="mt-1 text-sm text-muted-foreground">{n.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">
              Por que escolher o <span className="text-gradient">{SITE_NAME}</span>?
            </h2>
            <p className="mt-4 text-muted-foreground">Tudo o que seu negócio precisa para ser encontrado online</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {beneficios.map((b) => (
              <Card key={b.titulo} className="group border-border/50 transition-all hover:border-secondary/50 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-secondary/10 group-hover:text-secondary">
                    <b.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-foreground">{b.titulo}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="bg-muted/50 py-16 lg:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">Escolha o plano ideal para você</h2>
            <p className="mt-4 text-muted-foreground">Comece gratuitamente ou desbloqueie todo o potencial com o Premium</p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:mx-auto lg:max-w-4xl">
            {planos.map((plano) => (
              <Card
                key={plano.nome}
                className={`relative overflow-hidden transition-all ${
                  plano.destaque
                    ? "border-2 border-secondary shadow-xl shadow-secondary/10 scale-[1.02]"
                    : "border-border"
                }`}
              >
                {plano.destaque && (
                  <div className="absolute right-0 top-0 rounded-bl-xl bg-secondary px-4 py-1.5 text-xs font-bold text-secondary-foreground">
                    <Crown className="mr-1 inline h-3 w-3" />
                    Mais Popular
                  </div>
                )}
                <CardContent className="p-8">
                  <h3 className="font-display text-xl font-bold text-foreground">{plano.nome}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{plano.descricao}</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-extrabold text-foreground">{plano.preco}</span>
                    <span className="text-muted-foreground">{plano.periodo}</span>
                  </div>
                  <ul className="mt-8 space-y-3">
                    {plano.features.map((f) => (
                      <li key={f.texto} className="flex items-start gap-3">
                        {f.incluido ? (
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-secondary" />
                        ) : (
                          <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground/40" />
                        )}
                        <span className={`text-sm ${f.incluido ? "text-foreground" : "text-muted-foreground/50 line-through"}`}>
                          {f.texto}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    {plano.destaque ? (
                      <Button
                        className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        size="lg"
                        onClick={handlePremiumClick}
                      >
                        <Crown className="mr-2 h-4 w-4" />
                        {plano.cta}
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full" size="lg" asChild>
                        <Link to={plano.ctaLink!}>{plano.cta}</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold text-foreground">O que nossos clientes dizem</h2>
            <p className="mt-4 text-muted-foreground">Empresas reais, resultados reais</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {depoimentos.map((d) => (
              <Card key={d.nome} className="border-border/50 transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < d.estrelas ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">"{d.texto}"</p>
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-sm font-semibold text-foreground">{d.nome}</p>
                    <p className="text-xs text-muted-foreground">{d.nicho} • {d.cidade}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="bg-gradient-to-r from-primary to-primary/80 py-16 text-primary-foreground">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Pronto para crescer?</h2>
            <p className="mt-4 text-primary-foreground/80 text-lg">
              Cadastre sua empresa agora e comece a ser encontrado por milhares de clientes. É rápido, fácil e gratuito.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-base px-8" asChild>
                <Link to="/cadastro">
                  <Zap className="mr-2 h-5 w-5" />
                  Cadastrar Grátis Agora
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 text-base px-8" asChild>
                <a href={WHATSAPP_PREMIUM_LINK} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container">
          <h2 className="mx-auto max-w-2xl text-center font-display text-3xl font-bold text-foreground">Perguntas Frequentes</h2>
          <div className="mx-auto mt-10 max-w-2xl space-y-6">
            {[
              { p: "Preciso pagar para cadastrar minha empresa?", r: "Não! O plano Grátis é totalmente gratuito e não tem prazo de validade. Você pode fazer upgrade para o Premium a qualquer momento." },
              { p: "Quanto tempo leva para meu cadastro ficar ativo?", r: "Após o cadastro, nossa equipe revisa e aprova em até 24 horas úteis. Cadastros Premium são aprovados com prioridade." },
              { p: "O plano Premium é vitalício mesmo?", r: "Sim! Pagamento único e você tem acesso a todos os recursos Premium para sempre, sem mensalidades nem renovação. Consulte as condições no WhatsApp." },
              { p: "Como contrato o Premium?", r: "Clique em 'Quero ser Premium' e fale com nosso time pelo WhatsApp (35) 99948-3143. Combinamos a forma de pagamento (PIX, cartão ou outro) e ativamos seu Premium manualmente." },
              { p: "Como funciona o destaque em banner?", r: "Empresas Premium podem ser destacadas no banner rotativo da página inicial, garantindo máxima exposição para seu negócio." },
            ].map((faq) => (
              <div key={faq.p} className="rounded-xl border border-border bg-card p-6">
                <h3 className="font-display font-bold text-foreground">{faq.p}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{faq.r}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </Layout>
  );
}
