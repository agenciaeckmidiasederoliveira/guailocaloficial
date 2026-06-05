import { useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";

/**
 * Redirect 301 SEO-safe: /negocio/:slug -> /:slug (mesma URL nova).
 * O React Router não emite 301 real (é client-side), mas combinamos com
 * canonical na nova página + meta refresh para garantir que crawlers sigam.
 */
export default function NegocioRedirect() {
  const { slug, servico } = useParams<{ slug: string; servico?: string }>();
  const target = servico ? `/${slug}#servico-${servico}` : `/${slug}`;

  useEffect(() => {
    // Tag canonical já é injetada pela página de destino (useSEO).
    // Adiciona meta refresh como fallback semântico para crawlers.
    const meta = document.createElement("meta");
    meta.httpEquiv = "refresh";
    meta.content = `0; url=${target}`;
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, [target]);

  return <Navigate to={target} replace />;
}
