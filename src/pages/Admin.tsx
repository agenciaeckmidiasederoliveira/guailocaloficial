import { useState, useEffect } from "react";
import { useNavigate, Routes, Route, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Plus,
  Sparkles,
  FileText,
  TrendingUp,
  Star,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminEmpresas } from "@/components/admin/AdminEmpresas";
import { AdminParceiros } from "@/components/admin/AdminParceiros";
import { AdminConfiguracoes } from "@/components/admin/AdminConfiguracoes";
import { AdminCadastroEmpresa } from "@/components/admin/AdminCadastroEmpresa";
import { AdminEditarEmpresa } from "@/components/admin/AdminEditarEmpresa";
import { AdminPaginasClientes } from "@/components/admin/AdminPaginasClientes";
import { AdminBlog } from "@/components/admin/AdminBlog";
import { AdminBlogEditar } from "@/components/admin/AdminBlogEditar";
import { AdminBlogNovo } from "@/components/admin/AdminBlogNovo";
import { AdminSEO } from "@/components/admin/AdminSEO";
import { AdminGerarArtigo } from "@/components/admin/AdminGerarArtigo";
import { AdminAvaliacoes } from "@/components/admin/AdminAvaliacoes";
import { AdminParceirosAnalytics } from "@/components/admin/AdminParceirosAnalytics";
import { AdminParceiroDetalhe } from "@/components/admin/AdminParceiroDetalhe";
import { AdminTenants } from "@/components/admin/AdminTenants";
import { supabase } from "@/integrations/supabase/client";

export default function Admin() {
  const { isAdmin, loading, signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (!loading && user && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate, user]);

  // Fetch pending count
  useEffect(() => {
    if (!isAdmin) return;
    const fetchPending = async () => {
      const { count } = await supabase
        .from("empresas")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente");
      setPendingCount(count || 0);
    };
    fetchPending();

    // Refresh every 30s
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
    { to: "/admin/empresas", icon: Building2, label: "Empresas", badge: pendingCount > 0 ? pendingCount : undefined },
    { to: "/admin/parceiros", icon: Users, label: "Parceiros" },
    { to: "/admin/parceiros-analytics", icon: TrendingUp, label: "Analytics Parceiros" },
    { to: "/admin/paginas-clientes", icon: Sparkles, label: "Páginas Clientes" },
    { to: "/admin/blog", icon: FileText, label: "Blog" },
    { to: "/admin/gerar-artigo", icon: Sparkles, label: "Gerador IA", badge: "NOVO" as any, badgeNew: true },
    { to: "/admin/seo", icon: TrendingUp, label: "SEO" },
    { to: "/admin/avaliacoes", icon: Star, label: "Avaliações" },
    { to: "/admin/tenants", icon: Globe, label: "Tenants/Cidades" },
    { to: "/admin/configuracoes", icon: Settings, label: "Configurações" },
  ];

  return (
    <div className="flex min-h-screen bg-muted">
      {/* Mobile Header */}
      <div className="fixed inset-x-0 top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
            <span className="text-sm font-bold text-primary-foreground">G</span>
          </div>
          <span className="font-display font-bold text-primary">Admin</span>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-[10px]">
              {pendingCount}
            </Badge>
          )}
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <span className="text-lg font-bold text-sidebar-primary-foreground">G</span>
            </div>
            <div>
              <span className="font-display font-bold">Guia Local BR</span>
              <p className="text-xs text-sidebar-foreground/70">Painel Admin</p>
            </div>
          </div>
        </div>

        {/* Back to Site Button */}
        <div className="border-b border-sidebar-border p-4">
          <Button
            variant="outline"
            asChild
            className="w-full justify-start border-sidebar-border bg-sidebar-accent/30 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Voltar ao Site
            </Link>
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to) && location.pathname !== "/admin/empresas/nova";
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <Badge
                    variant={(item as any).badgeNew ? "default" : "destructive"}
                    className={cn(
                      "h-5 min-w-[20px] px-1.5 text-[10px]",
                      (item as any).badgeNew && "bg-blue-500 hover:bg-blue-600 text-white",
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
          
          {/* Quick action: New empresa */}
          <Link
            to="/admin/empresas/nova"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "mt-4 flex items-center gap-3 rounded-lg border border-dashed border-sidebar-border px-3 py-2 text-sm font-medium transition-colors",
              location.pathname === "/admin/empresas/nova"
                ? "border-solid bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <Plus className="h-5 w-5" />
            Nova Empresa
          </Link>
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="mb-3 text-xs text-sidebar-foreground/70">
            Logado como: {user?.email}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pt-16 lg:ml-64 lg:pt-0">
        <div className="p-6 lg:p-8">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="empresas" element={<AdminEmpresas />} />
            <Route path="empresas/nova" element={<AdminCadastroEmpresa />} />
            <Route path="empresas/editar/:id" element={<AdminEditarEmpresa />} />
            <Route path="parceiros" element={<AdminParceiros />} />
            <Route path="parceiros-analytics" element={<AdminParceirosAnalytics />} />
            <Route path="parceiros-analytics/:id" element={<AdminParceiroDetalhe />} />
            <Route path="paginas-clientes" element={<AdminPaginasClientes />} />
            <Route path="blog" element={<AdminBlog />} />
            <Route path="blog/novo" element={<AdminBlogNovo />} />
            <Route path="blog/editar/:id" element={<AdminBlogEditar />} />
            <Route path="seo" element={<AdminSEO />} />
            <Route path="gerar-artigo" element={<AdminGerarArtigo />} />
            <Route path="avaliacoes" element={<AdminAvaliacoes />} />
            <Route path="tenants" element={<AdminTenants />} />
            <Route path="configuracoes" element={<AdminConfiguracoes />} />
          </Routes>
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
