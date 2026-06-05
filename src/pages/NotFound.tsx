import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";
import logotipo from "@/assets/logotipo.png";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <Layout>
      <div className="flex flex-1 items-center justify-center py-20">
        <div className="text-center px-4">
          <img
            src={logotipo}
            alt="Guia Local BR"
            className="mx-auto mb-6 h-16 w-auto"
          />
          <h1 className="mb-2 font-display text-6xl font-bold text-primary">404</h1>
          <p className="mb-2 text-xl font-semibold text-foreground">
            Página não encontrada
          </p>
          <p className="mb-8 text-muted-foreground max-w-md mx-auto">
            A página que você está procurando não existe ou foi movida. 
            Verifique o endereço ou volte para o início.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Voltar para o Início
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/busca">
                <Search className="mr-2 h-4 w-4" />
                Buscar Empresas
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
