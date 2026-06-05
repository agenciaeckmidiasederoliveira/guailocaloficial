import { useEffect } from "react";
import { SITE_NAME } from "@/lib/constants";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
}

export function useSEO({ title, description, canonical, ogImage }: SEOProps) {
  useEffect(() => {
    // Title
    const fullTitle = title
      ? `${title} | ${SITE_NAME}`
      : `${SITE_NAME} - Conecte-se aos Melhores Negócios Locais`;
    document.title = fullTitle;

    // Meta description
    if (description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) {
        meta.setAttribute("content", description);
      }
    }

    // OG tags
    const ogTags: Record<string, string> = {
      "og:title": fullTitle,
      ...(description && { "og:description": description }),
      ...(ogImage && { "og:image": ogImage }),
      ...(canonical && { "og:url": canonical }),
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      const meta = document.querySelector(`meta[property="${property}"]`);
      if (meta) {
        meta.setAttribute("content", content);
      }
    });

    // Twitter tags
    const twitterTags: Record<string, string> = {
      "twitter:title": fullTitle,
      ...(description && { "twitter:description": description }),
      ...(ogImage && { "twitter:image": ogImage }),
    };

    Object.entries(twitterTags).forEach(([name, content]) => {
      const meta = document.querySelector(`meta[name="${name}"]`);
      if (meta) {
        meta.setAttribute("content", content);
      }
    });

    // Canonical
    if (canonical) {
      const link = document.querySelector('link[rel="canonical"]');
      if (link) {
        link.setAttribute("href", canonical);
      }
    }

    // Cleanup - restore defaults
    return () => {
      document.title = `${SITE_NAME} - Conecte-se aos Melhores Negócios Locais`;
    };
  }, [title, description, canonical, ogImage]);
}
