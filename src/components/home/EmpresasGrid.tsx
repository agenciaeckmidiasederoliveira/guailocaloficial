import { useState, useEffect, memo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { EmpresaCard } from "@/components/empresas/EmpresaCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { SkeletonCardGrid } from "@/components/ui/skeleton-card";
import { getTenantFromURL, type Tenant } from "@/lib/tenant";

// Memoized EmpresaCard para evitar re-renders desnecessários
const MemoizedEmpresaCard = memo(EmpresaCard);

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

export function EmpresasGrid() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const { cidade, estado } = useGeolocation();

  useEffect(() => {
    fetchEmpresas();
  }, [cidade, estado]);

  const fetchEmpresas = async () => {
    const tenant = await getTenantFromURL();

    let query = supabase
      .from("empresas")
      .select(`
        id, slug, nome, endereco, telefone, whatsapp, foto_principal, plano, site, horario_funcionamento,
        cidades(nome, estados(uf)),
        categorias(nome)
      `)
      .eq("ativa", true)
      .order("plano", { ascending: false })
      .order("banner_ativo", { ascending: false })
      .limit(8);

    if (tenant) {
      query = query.eq("tenant_id", tenant.id);
    }

    // Priorize local businesses se geolocation available
    // (Ajustar de acordo com a forma que as tabelas relacionadas são consultadas)
    // Supabase não suporta "ilike" em tabelas relacionadas no root query tão fácil,
    // Então vamos apenas carregar normal se não puder filtrar.
    if (cidade) {
      // Removeremos os filtros de geolocation complexos pra não quebrar
    }

    const { data, error } = await query;

    if (!error && data) {
      const mapped = data.map((d: any) => ({
        id: d.id,
        slug: d.slug,
        nome: d.nome,
        endereco: d.endereco,
        cidade: d.cidades?.nome || "",
        estado: d.cidades?.estados?.uf || "",
        telefone: d.telefone || "",
        whatsapp: d.whatsapp || "",
        foto_principal: d.foto_principal,
        plano: d.plano || "free",
        nicho: d.categorias?.nome || null,
        site: d.site,
        horario: d.horario_funcionamento,
      }));
      setEmpresas(mapped);
    }

    // If no local results, fetch any businesses
    if (data && data.length === 0) {
      let fallbackQuery = supabase
        .from("empresas")
        .select(`
          id, slug, nome, endereco, telefone, whatsapp, foto_principal, plano, site, horario_funcionamento,
          cidades(nome, estados(uf)),
          categorias(nome)
        `)
        .eq("ativa", true)
        .order("plano", { ascending: false })
        .order("banner_ativo", { ascending: false })
        .limit(8);
      
      if (tenant) {
        fallbackQuery = fallbackQuery.eq("tenant_id", tenant.id);
      }

      const { data: allData } = await fallbackQuery;

      if (allData) {
        const mapped = allData.map((d: any) => ({
          id: d.id,
          slug: d.slug,
          nome: d.nome,
          endereco: d.endereco,
          cidade: d.cidades?.nome || "",
          estado: d.cidades?.estados?.uf || "",
          telefone: d.telefone || "",
          whatsapp: d.whatsapp || "",
          foto_principal: d.foto_principal,
          plano: d.plano || "free",
          nicho: d.categorias?.nome || null,
          site: d.site,
          horario: d.horario_funcionamento,
        }));
        setEmpresas(mapped);
      }
    }

    setLoading(false);
  };

  return (
    <section className="py-16">
      <div className="container">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              Empresas {cidade ? `em ${cidade}` : "em Destaque"}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {cidade
                ? "Negócios próximos a você"
                : "Conheça os melhores negócios locais"}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/busca">
              Ver Todas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <SkeletonCardGrid count={8} />
        ) : empresas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <p className="text-lg text-muted-foreground">
              Nenhuma empresa cadastrada ainda.
            </p>
            <Button asChild className="mt-4">
              <Link to="/cadastro">Seja o primeiro!</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {empresas.map((empresa) => (
              <MemoizedEmpresaCard key={empresa.id} empresa={empresa} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
