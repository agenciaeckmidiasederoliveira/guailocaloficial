import { Layout } from "@/components/layout/Layout";
import { useSEO } from "@/hooks/useSEO";
import { SITE_NAME, SITE_URL, SOCIAL_LINKS } from "@/lib/constants";

export default function Termos() {
  useSEO({
    title: "Termos de Uso",
    description: `Termos de Uso do ${SITE_NAME}: regras para utilização da plataforma, cadastro de empresas, planos e responsabilidades.`,
    canonical: `${SITE_URL}/termos`,
  });

  return (
    <Layout>
      <article className="container max-w-3xl py-12 prose prose-slate dark:prose-invert">
        <h1 className="font-display text-4xl font-bold">Termos de Uso</h1>
        <p className="text-sm text-muted-foreground">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

        <p>
          Ao acessar ou utilizar o <strong>{SITE_NAME}</strong> ({SITE_URL}), você concorda com estes
          Termos de Uso. Caso não concorde, por favor não utilize a plataforma.
        </p>

        <h2>1. Sobre a plataforma</h2>
        <p>
          O {SITE_NAME} é um guia digital de negócios locais que conecta consumidores a empresas em
          todo o Brasil. Oferecemos planos gratuito e premium para empresas que desejam mais visibilidade.
        </p>

        <h2>2. Cadastro</h2>
        <ul>
          <li>O cadastro é gratuito e exige dados verídicos.</li>
          <li>O usuário é responsável por manter a confidencialidade da sua senha.</li>
          <li>Empresas devem fornecer informações reais e atualizadas sobre seu negócio.</li>
        </ul>

        <h2>3. Planos e pagamentos</h2>
        <p>
          O plano <strong>Premium é vitalício</strong> com pagamento único, e a ativação é manual
          após contato pelo WhatsApp (35) 99948-3143. Valores e condições são informados diretamente
          no atendimento. Não há cobranças recorrentes nem renovação anual.
        </p>

        <h2>4. Conteúdo do usuário</h2>
        <p>
          Você é responsável por todo conteúdo (textos, fotos, vídeos, avaliações) que publicar.
          É proibido conteúdo ilegal, ofensivo, enganoso, com direitos autorais de terceiros ou que
          viole a LGPD. Reservamo-nos o direito de remover qualquer conteúdo a qualquer momento.
        </p>

        <h2>5. Avaliações</h2>
        <p>
          Avaliações devem ser honestas e baseadas em experiência real. Avaliações falsas, ofensivas
          ou em massa serão removidas e podem resultar em banimento.
        </p>

        <h2>6. Anúncios</h2>
        <p>
          A plataforma exibe anúncios próprios e de terceiros. O {SITE_NAME} não se responsabiliza
          pelo conteúdo de anunciantes externos.
        </p>

        <h2>7. Propriedade intelectual</h2>
        <p>
          Todo o conteúdo da plataforma (marca, código, layout, textos editoriais) pertence ao
          {" "}{SITE_NAME} e é protegido por lei. É proibida a reprodução sem autorização.
        </p>

        <h2>8. Limitação de responsabilidade</h2>
        <p>
          O {SITE_NAME} é um intermediário entre consumidores e empresas. Não nos responsabilizamos
          por negócios fechados, qualidade de produtos/serviços, divergências entre as partes ou
          informações fornecidas por anunciantes.
        </p>

        <h2>9. Cancelamento</h2>
        <p>
          Você pode solicitar exclusão da sua conta a qualquer momento via{" "}
          <a href={`mailto:${SOCIAL_LINKS.email}`}>{SOCIAL_LINKS.email}</a>. Reembolsos de planos
          pagos seguem o Código de Defesa do Consumidor (7 dias de arrependimento).
        </p>

        <h2>10. Alterações</h2>
        <p>
          Estes termos podem ser atualizados. Mudanças relevantes serão comunicadas pela plataforma.
        </p>

        <h2>11. Foro</h2>
        <p>
          Fica eleito o foro da comarca de Pouso Alegre/MG para dirimir quaisquer questões oriundas
          destes Termos.
        </p>

        <h2>12. Contato</h2>
        <p>
          Dúvidas sobre estes termos? Escreva para{" "}
          <a href={`mailto:${SOCIAL_LINKS.email}`}>{SOCIAL_LINKS.email}</a>.
        </p>
      </article>
    </Layout>
  );
}
