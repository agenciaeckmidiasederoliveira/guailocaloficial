import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, ComponentType } from "react";
import { AuthProvider } from "@/hooks/useAuth";
import { FavoritosProvider } from "@/contexts/FavoritosContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// Rotas críticas (eager) - carregam imediatamente
import Home from "./pages/public/Home";
import Auth from "./pages/Auth";
import Busca from "./pages/Busca";
import NotFound from "./pages/NotFound";

// Lazy com retry: se o chunk falha (build novo, chunk antigo sumiu),
// força reload uma vez para baixar o manifesto atualizado.
const lazyWithRetry = <T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) =>
  lazy(async () => {
    try {
      return await factory();
    } catch (err) {
      const key = "__chunk_reload_attempted__";
      if (typeof window !== "undefined" && !sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        // bloqueia render até o reload acontecer
        return await new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });

// Rotas secundárias (lazy) - code-splitting para reduzir bundle inicial
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const Cadastro = lazyWithRetry(() => import("./pages/Cadastro"));
const Sobre = lazyWithRetry(() => import("./pages/Sobre"));
const Privacidade = lazyWithRetry(() => import("./pages/Privacidade"));
const Termos = lazyWithRetry(() => import("./pages/Termos"));
const Contato = lazyWithRetry(() => import("./pages/Contato"));
const Vendas = lazyWithRetry(() => import("./pages/Vendas"));
const Parceiro = lazyWithRetry(() => import("./pages/Parceiro"));
const ParceiroNotificacoes = lazyWithRetry(() => import("./pages/ParceiroNotificacoes"));
const Parceiros = lazyWithRetry(() => import("./pages/Parceiros"));
const Empresa = lazyWithRetry(() => import("./pages/Empresa"));
const Favoritos = lazyWithRetry(() => import("./pages/Favoritos"));
const Admin = lazyWithRetry(() => import("./pages/Admin"));
const Cidade = lazyWithRetry(() => import("./pages/Cidade"));
const ClientLanding = lazyWithRetry(() => import("./pages/ClientLanding"));
const NegocioRedirect = lazyWithRetry(() => import("./pages/NegocioRedirect"));
const MinhaPagina = lazyWithRetry(() => import("./pages/MinhaPagina"));
const MinhasEstatisticas = lazyWithRetry(() => import("./pages/MinhasEstatisticas"));
const BadgeEmpresa = lazyWithRetry(() => import("./pages/BadgeEmpresa"));
const Categorias = lazyWithRetry(() => import("./pages/Categorias"));
const Cidades = lazyWithRetry(() => import("./pages/Cidades"));
const BlogHome = lazyWithRetry(() => import("./pages/BlogHome"));
const BlogPostPage = lazyWithRetry(() => import("./pages/BlogPostPage"));
const EmpresasFiltro = lazyWithRetry(() => import("./pages/EmpresasFiltro"));
const CidadeSlug = lazyWithRetry(() => import("./pages/CidadeSlug"));
const ParceiroPublico = lazyWithRetry(() => import("./pages/ParceiroPublico"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1min — reduz refetch desnecessário
      gcTime: 5 * 60 * 1000, // 5min em cache
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <LoadingSpinner />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <FavoritosProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/busca" element={<Busca />} />
                  <Route path="/cadastro" element={<Cadastro />} />
                  <Route path="/sobre" element={<Sobre />} />
                  <Route path="/privacidade" element={<Privacidade />} />
                  <Route path="/termos" element={<Termos />} />
                  <Route path="/contato" element={<Contato />} />
                  <Route path="/planos" element={<Vendas />} />
                  <Route path="/empresa/:slugOrId" element={<Empresa />} />
                  <Route path="/badge/:slug" element={<BadgeEmpresa />} />
                  <Route path="/favoritos" element={<Favoritos />} />
                  <Route path="/parceiro" element={<Parceiro />} />
                  <Route path="/parceiro/notificacoes" element={<ParceiroNotificacoes />} />
                  <Route path="/parceiro-local/:slug" element={<ParceiroPublico />} />
                  <Route path="/parceiros" element={<Parceiros />} />
                  <Route path="/cidade/:estado/:cidade" element={<Cidade />} />
                  <Route path="/categorias" element={<Categorias />} />
                  <Route path="/cidades" element={<Cidades />} />
                  <Route path="/cidades/:cidade" element={<CidadeSlug />} />
                  <Route path="/empresas/:categoria/:cidade" element={<EmpresasFiltro />} />
                  <Route path="/empresas/:categoria" element={<EmpresasFiltro />} />
                  <Route path="/admin/*" element={<Admin />} />
                  <Route path="/minha-pagina" element={<MinhaPagina />} />
                  <Route path="/minhas-estatisticas" element={<MinhasEstatisticas />} />
                  {/* Blog */}
                  <Route path="/blog" element={<BlogHome />} />
                  <Route path="/blog/empresas/:slug" element={<BlogPostPage tipo="empresa" />} />
                  <Route path="/blog/artigos/:slug" element={<BlogPostPage tipo="artigo" />} />
                  {/* Redirect 301-like de URLs antigas */}
                  <Route path="/negocio/:slug" element={<NegocioRedirect />} />
                  <Route path="/negocio/:slug/:servico" element={<NegocioRedirect />} />
                  {/* Landing IA do cliente — DEVE FICAR ANTES do 404 */}
                  <Route path="/:slug" element={<ClientLanding />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </TooltipProvider>
          </FavoritosProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
