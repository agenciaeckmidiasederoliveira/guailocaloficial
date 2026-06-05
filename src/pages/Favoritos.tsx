import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { EmpresaCard } from "@/components/empresas/EmpresaCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFavoritosContext } from "@/contexts/FavoritosContext";
import { Loader2, Heart, Search } from "lucide-react";

interface Empresa {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  estado: string;
  telefone: string;
  whatsapp: string;
  foto_principal: string | null;
  plano: "free" | "premium";
  nicho: string | null;
  site: string | null;
  horario: string | null;
}

export default function Favoritos() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const { favoritos, loading: favLoading } = useFavoritosContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (favoritos.length > 0) {
      fetchEmpresas();
    } else if (!favLoading) {
      setLoading(false);
      setEmpresas([]);
    }
  }, [favoritos, favLoading]);

  const fetchEmpresas = async () => {
    if (favoritos.length === 0) {
      setEmpresas([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("empresas")
      .select("id, slug, nome, endereco, cidade, estado, telefone, whatsapp, foto_principal, plano, nicho, site, horario")
      .in("id", favoritos)
      .eq("status", "aprovado");

    if (!error && data) {
      setEmpresas(data as Empresa[]);
    }
    setLoading(false);
  };

  if (authLoading || favLoading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gradient-hero py-12 text-primary-foreground">
        <div className="container">
          <div className="flex items-center gap-3">
            <Heart className="h-8 w-8 fill-current" />
            <div>
              <h1 className="font-display text-3xl font-bold md:text-4xl">
                Meus Favoritos
              </h1>
              <p className="mt-1 text-primary-foreground/80">
                Empresas que você salvou
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : empresas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <Heart className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg text-muted-foreground">
              Você ainda não tem empresas favoritas.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Clique no coração nos cards de empresa para adicionar aos favoritos.
            </p>
            <Button asChild className="mt-6">
              <Link to="/busca">
                <Search className="mr-2 h-4 w-4" />
                Buscar Empresas
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {empresas.map((empresa) => (
              <EmpresaCard key={empresa.id} empresa={empresa} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
