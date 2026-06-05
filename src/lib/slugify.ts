/**
 * Converte texto em slug URL-friendly:
 * lowercase, sem acentos, espaços e símbolos viram hífen.
 */
export function toSlug(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Volta um slug a uma forma legível em Title Case. */
export function unslug(slug: string | null | undefined): string {
  if (!slug) return "";
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
