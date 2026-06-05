import { Layout } from "@/components/layout/Layout";
import { useSEO } from "@/hooks/useSEO";
import { SITE_NAME, SITE_URL, SOCIAL_LINKS } from "@/lib/constants";

export default function Privacidade() {
  useSEO({
    title: "Política de Privacidade",
    description: `Política de Privacidade do ${SITE_NAME}: como coletamos, usamos e protegemos seus dados, uso de cookies e exibição de anúncios.`,
    canonical: `${SITE_URL}/privacidade`,
  });

  return (
    <Layout>
      <article className="container max-w-3xl py-12 prose prose-slate dark:prose-invert">
        <h1 className="font-display text-4xl font-bold">Política de Privacidade</h1>
        <p className="text-sm text-muted-foreground">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>

        <p>
          O <strong>{SITE_NAME}</strong> respeita a sua privacidade e está comprometido com a proteção
          dos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
        </p>

        <h2>1. Dados que coletamos</h2>
        <ul>
          <li><strong>Cadastro:</strong> nome, e-mail, telefone, cidade e dados da empresa quando você se cadastra.</li>
          <li><strong>Navegação:</strong> páginas visitadas, dispositivo, navegador e endereço IP via cookies e ferramentas de analytics.</li>
          <li><strong>Localização:</strong> sua localização aproximada (com permissão) para mostrar negócios próximos.</li>
        </ul>

        <h2>2. Cookies</h2>
        <p>
          Utilizamos cookies próprios e de terceiros para melhorar sua experiência, lembrar preferências,
          medir audiência e exibir conteúdo relevante. Você pode desativar cookies nas configurações do
          seu navegador, mas algumas funcionalidades podem deixar de funcionar.
        </p>

        <h2>3. Anúncios e parceiros</h2>
        <p>
          Este site pode exibir <strong>anúncios</strong> e conteúdo patrocinado de empresas parceiras.
          Provedores terceirizados (como Google) podem utilizar cookies para veicular anúncios baseados
          em visitas anteriores ao nosso site ou a outros sites. Você pode optar por não usar o cookie
          da Google acessando as configurações de anúncios do Google.
        </p>

        <h2>4. Como usamos seus dados</h2>
        <ul>
          <li>Operar e melhorar a plataforma;</li>
          <li>Personalizar busca e recomendações de negócios locais;</li>
          <li>Enviar comunicações sobre sua conta, planos e novidades;</li>
          <li>Cumprir obrigações legais e prevenir fraudes.</li>
        </ul>

        <h2>5. Compartilhamento</h2>
        <p>
          Não vendemos seus dados. Compartilhamos apenas com provedores essenciais (hospedagem,
          pagamento, e-mail, analytics) e quando exigido por lei.
        </p>

        <h2>6. Seus direitos</h2>
        <p>
          Você pode solicitar acesso, correção, exclusão ou portabilidade dos seus dados, bem como
          revogar consentimentos a qualquer momento, escrevendo para{" "}
          <a href={`mailto:${SOCIAL_LINKS.email}`}>{SOCIAL_LINKS.email}</a>.
        </p>

        <h2>7. Segurança</h2>
        <p>
          Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não
          autorizado, perda ou alteração.
        </p>

        <h2>8. Alterações</h2>
        <p>
          Esta política pode ser atualizada. A versão vigente estará sempre disponível nesta página.
        </p>

        <h2>9. Contato</h2>
        <p>
          Dúvidas? Fale conosco em{" "}
          <a href={`mailto:${SOCIAL_LINKS.email}`}>{SOCIAL_LINKS.email}</a> ou pela página de{" "}
          <a href="/contato">Contato</a>.
        </p>
      </article>
    </Layout>
  );
}
