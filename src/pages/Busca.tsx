import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { EmpresaCard } from "@/components/empresas/EmpresaCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { ESTADOS_BR, NICHOS } from "@/lib/constants";
import { useGeolocation } from "@/hooks/useGeolocation";
import { isEmpresaAberta } from "@/lib/utils";
import { getTenantFromURL, type Tenant } from "@/lib/tenant";
import { Search, MapPin, Filter, Loader2, Clock, SlidersHorizontal } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useSEO } from "@/hooks/useSEO";

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

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function Busca() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [hasTracked, setHasTracked] = useState(false);
  const [geoApplied, setGeoApplied] = useState(false);

  // Read filters from URL
  const searchTerm = searchParams.get("q") || "";
  const estado = searchParams.get("estado") || "";
  const cidade = searchParams.get("cidade") || "";
  const nicho = searchParams.get("nicho") || "";
  const abertoAgora = searchParams.get("aberto") === "1";

  const { estado: userEstado, cidade: userCidade } = useGeolocation();
  const { trackPageView, trackBusca } = useAnalytics();
  const ITEMS_PER_PAGE = 12;

  useSEO({
    title: nicho ? `${nicho} - Buscar Empresas` : "Buscar Empresas",
    description: `Encontre os melhores negócios locais${cidade ? ` em ${cidade}` : ""}${estado ? ` - ${estado}` : ""}. Busque por nome, categoria, estado e cidade no Guia Local BR.`,
    canonical: "https://guialocalbr.com.br/busca",
  });

  const debouncedSearch = useDebounce(searchTerm, 400);
  const debouncedCidade = useDebounce(cidade, 400);
  const debouncedSearchForTracking = useDebounce(searchTerm, 1500);

  // Helper to update URL params
  const updateParam = useCallback((key: string, value: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    if (!hasTracked) {
      trackPageView("/busca");
      setHasTracked(true);
    }
  }, [hasTracked, trackPageView]);

  useEffect(() => {
    if (debouncedSearchForTracking && debouncedSearchForTracking.length >= 2) {
      trackBusca(debouncedSearchForTracking);
    }
  }, [debouncedSearchForTracking, trackBusca]);

  // Apply geolocation only once if no URL filters exist
  useEffect(() => {
    if (geoApplied) return;
    const hasUrlFilters = searchParams.has("q") || searchParams.has("estado") || searchParams.has("cidade") || searchParams.has("nicho");
    if (hasUrlFilters) {
      setGeoApplied(true);
      return;
    }
    if (userEstado && !estado) {
      const found = ESTADOS_BR.find(e => e.nome.toLowerCase() === userEstado.toLowerCase());
      if (found) updateParam("estado", found.sigla);
    }
    if (userCidade && !cidade) {
      updateParam("cidade", userCidade);
    }
    if (userEstado || userCidade) setGeoApplied(true);
  }, [userEstado, userCidade, geoApplied]);

  const fetchEmpresas = useCallback(async (reset = false, pageOverride?: number) => {
    setLoading(true);
    const currentPage = reset ? 0 : (pageOverride ?? page);
    const tenant = await getTenantFromURL();

    let query = supabase
      .from("empresas")
      .select("id, slug, nome, endereco, cidade, estado, telefone, whatsapp, foto_principal, plano, nicho, site, horario")
      .eq("status", "aprovado")
      .order("plano", { ascending: false })
      .order("criado_em", { ascending: false })
      .range(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE - 1);

    if (tenant) query = query.eq("tenant_id", tenant.id);

    if (debouncedSearch) query = query.ilike("nome", `%${debouncedSearch}%`);
    if (estado) query = query.eq("estado", estado);
    if (debouncedCidade) query = query.ilike("cidade", `%${debouncedCidade}%`);
    if (nicho) query = query.eq("nicho", nicho);

    const { data, error } = await query;

    if (!error && data) {
      let filteredData = data as Empresa[];
      if (abertoAgora) {
        filteredData = filteredData.filter((e) => isEmpresaAberta(e.horario));
      }
      if (reset) {
        setEmpresas(filteredData);
        setPage(0);
      } else {
        setEmpresas(prev => [...prev, ...filteredData]);
      }
      const hasMoreFromDB = data.length === ITEMS_PER_PAGE;
      setHasMore(hasMoreFromDB && (!abertoAgora || filteredData.length > 0));
    }
    setLoading(false);
  }, [debouncedSearch, estado, debouncedCidade, nicho, abertoAgora, page]);

  useEffect(() => {
    fetchEmpresas(true);
  }, [debouncedSearch, estado, debouncedCidade, nicho, abertoAgora]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchEmpresas(false, nextPage);
  };

  const clearFilters = () => {
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = searchTerm || estado || cidade || nicho || abertoAgora;

  return (
    <Layout>
      <div className="bg-gradient-hero py-12 text-primary-foreground">
        <div className="container">
          <h1 className="font-display text-3xl font-bold md:text-4xl">
            Encontre Empresas Locais
          </h1>
          <p className="mt-2 text-primary-foreground/80">
            Busque negócios na sua cidade ou região
          </p>
        </div>
      </div>

      <div className="container py-8">
        {/* Filters */}
        <div className="mb-8 rounded-xl border border-border bg-card p-4 shadow-sm">
          {/* Mobile: search + drawer trigger */}
          <div className="flex gap-2 md:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => updateParam("q", e.target.value)}
                className="pl-10 h-11"
                inputMode="search"
                autoComplete="off"
              />
            </div>
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" className="h-11 shrink-0 relative">
                  <SlidersHorizontal className="h-4 w-4" />
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary" />
                  )}
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Filtros</DrawerTitle>
                </DrawerHeader>
                <div className="space-y-4 px-4 pb-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Estado</Label>
                    <Select value={estado || "all"} onValueChange={(v) => updateParam("estado", v === "all" ? "" : v)}>
                      <SelectTrigger className="h-11 mt-1">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os estados</SelectItem>
                        {ESTADOS_BR.map((e) => (
                          <SelectItem key={e.sigla} value={e.sigla}>{e.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Cidade</Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Cidade"
                        value={cidade}
                        onChange={(e) => updateParam("cidade", e.target.value)}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground">Nicho</Label>
                    <Select value={nicho || "all"} onValueChange={(v) => updateParam("nicho", v === "all" ? "" : v)}>
                      <SelectTrigger className="h-11 mt-1">
                        <SelectValue placeholder="Nicho" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os nichos</SelectItem>
                        {NICHOS.map((n) => (
                          <SelectItem key={n} value={n}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <Label htmlFor="aberto-mobile" className="cursor-pointer text-sm font-medium">
                        Aberto agora
                      </Label>
                    </div>
                    <Switch
                      id="aberto-mobile"
                      checked={abertoAgora}
                      onCheckedChange={(v) => updateParam("aberto", v ? "1" : "")}
                    />
                  </div>
                </div>
                <DrawerFooter>
                  {hasActiveFilters && (
                    <Button variant="outline" onClick={clearFilters}>
                      Limpar Filtros
                    </Button>
                  )}
                  <DrawerClose asChild>
                    <Button>Aplicar</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Desktop: full filter grid */}
          <div className="hidden md:grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome..."
                value={searchTerm}
                onChange={(e) => updateParam("q", e.target.value)}
                className="pl-10 h-11"
                inputMode="search"
                autoComplete="off"
              />
            </div>

            <Select value={estado || "all"} onValueChange={(v) => updateParam("estado", v === "all" ? "" : v)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                {ESTADOS_BR.map((e) => (
                  <SelectItem key={e.sigla} value={e.sigla}>{e.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cidade"
                value={cidade}
                onChange={(e) => updateParam("cidade", e.target.value)}
                className="pl-10 h-11"
                inputMode="text"
                autoComplete="address-level2"
              />
            </div>

            <Select value={nicho || "all"} onValueChange={(v) => updateParam("nicho", v === "all" ? "" : v)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Nicho" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os nichos</SelectItem>
                {NICHOS.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 hidden md:flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
              <Clock className="h-4 w-4 text-green-600" />
              <Label htmlFor="aberto-agora" className="cursor-pointer text-sm font-medium">
                Aberto agora
              </Label>
              <Switch
                id="aberto-agora"
                checked={abertoAgora}
                onCheckedChange={(v) => updateParam("aberto", v ? "1" : "")}
              />
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 touch-target">
                <Filter className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        {!loading && empresas.length > 0 && (
          <p className="mb-4 text-sm text-muted-foreground">
            {empresas.length} empresa{empresas.length !== 1 ? "s" : ""} encontrada{empresas.length !== 1 ? "s" : ""}
          </p>
        )}

        <div aria-live="polite" aria-atomic="true">
          {loading && empresas.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="sr-only">Carregando empresas...</span>
            </div>
          ) : empresas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <p className="text-lg text-muted-foreground">
                Nenhuma empresa encontrada com os filtros selecionados.
              </p>
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {empresas.map((empresa) => (
                  <EmpresaCard key={empresa.id} empresa={empresa} />
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 text-center">
                  <Button variant="outline" onClick={loadMore} disabled={loading} className="min-h-[44px]">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Carregar Mais
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
