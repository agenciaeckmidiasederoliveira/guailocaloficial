import { z } from "zod";
import { ESTADOS_BR, NICHOS } from "@/lib/constants";

const SIGLAS = new Set(ESTADOS_BR.map((e) => e.sigla));
const NICHOS_SET = new Set(NICHOS.map((n) => n.toLowerCase()));

const onlyDigits = (s: string) => s.replace(/\D/g, "");
const optStr = z.string().trim().max(500).optional().or(z.literal(""));
const optUrl = optStr.refine(
  (v) => !v || /^https?:\/\/.+/.test(v),
  "Deve ser URL https://...",
);

export const MAX_FOTOS = 8;

export const importRowSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  nome: z.string().trim().min(2, "Nome muito curto").max(120),
  categoria: z
    .string()
    .trim()
    .min(2, "Categoria obrigatória")
    .refine((v) => NICHOS_SET.has(v.toLowerCase()), "Categoria não está na lista oficial"),
  estado: z
    .string()
    .trim()
    .transform((s) => s.toUpperCase())
    .refine((v) => SIGLAS.has(v), "UF deve ser sigla válida (SP, MG, PR…)"),
  cidade: z.string().trim().min(2, "Cidade obrigatória").max(80),
  bairros: optStr,
  endereco: z.string().trim().max(200).optional().or(z.literal("")),
  cep: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? onlyDigits(v) : ""))
    .refine((v) => !v || v.length === 8, "CEP deve ter 8 dígitos"),
  telefone: z
    .string()
    .trim()
    .min(8, "Telefone/WhatsApp obrigatório")
    .transform((s) => onlyDigits(s))
    .refine((s) => s.length >= 10 && s.length <= 13, "Telefone deve ter 10–13 dígitos"),
  whatsapp: z
    .string()
    .trim()
    .transform((s) => onlyDigits(s))
    .refine((s) => !s || (s.length >= 10 && s.length <= 13), "WhatsApp deve ter 10–13 dígitos")
    .optional()
    .or(z.literal("")),
  site: optUrl,
  descricao: z.string().trim().max(1500).optional().or(z.literal("")),
  plano: z
    .string()
    .trim()
    .toLowerCase()
    .default("free")
    .refine((v) => v === "free" || v === "premium", "Plano deve ser free ou premium"),
  status: z
    .string()
    .trim()
    .toLowerCase()
    .default("aprovado")
    .transform((v) =>
      v === "approved" || v === "aprovado"
        ? "aprovado"
        : v === "pending" || v === "pendente"
        ? "pendente"
        : v,
    )
    .refine((v) => v === "aprovado" || v === "pendente", "Status deve ser approved ou pending"),
  instagram: z.string().trim().max(150).optional().or(z.literal("")),
  facebook: z.string().trim().max(150).optional().or(z.literal("")),
  foto_1: optUrl,
  foto_2: optUrl,
  foto_3: optUrl,
  foto_4: optUrl,
  foto_5: optUrl,
  foto_6: optUrl,
  foto_7: optUrl,
  foto_8: optUrl,
});

export type ImportRow = z.infer<typeof importRowSchema>;

/** Cabeçalhos canônicos do modelo. */
export const IMPORT_HEADERS = [
  "id",
  "nome",
  "categoria",
  "estado",
  "cidade",
  "bairros",
  "endereco",
  "cep",
  "telefone",
  "whatsapp",
  "site",
  "instagram",
  "facebook",
  "descricao",
  "plano",
  "status",
  "foto_1",
  "foto_2",
  "foto_3",
  "foto_4",
  "foto_5",
  "foto_6",
  "foto_7",
  "foto_8",
] as const;

/** Normaliza o nome do cabeçalho removendo emojis, acentos, pontuação e espaços. */
function slugify(h: string): string {
  return String(h ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

const HEADER_ALIASES: Record<string, string> = {
  // identificador (usado para atualizações em massa)
  id: "id",
  // nome
  nome: "nome",
  nome_da_empresa: "nome",
  empresa: "nome",
  razao_social: "nome",
  // categoria
  categoria: "categoria",
  nicho: "categoria",
  segmento: "categoria",
  // estado
  estado: "estado",
  uf: "estado",
  // cidade
  cidade: "cidade",
  municipio: "cidade",
  // bairros
  bairro: "bairros",
  bairros: "bairros",
  // endereço
  endereco: "endereco",
  endereco_completo: "endereco",
  rua: "endereco",
  logradouro: "endereco",
  // cep
  cep: "cep",
  // telefones
  telefone: "telefone",
  fone: "telefone",
  telefone_whatsapp: "telefone",
  telefone_wpp: "telefone",
  contato: "telefone",
  whatsapp: "whatsapp",
  wpp: "whatsapp",
  zap: "whatsapp",
  // web/redes
  site: "site",
  site_url: "site",
  website: "site",
  url: "site",
  instagram: "instagram",
  insta: "instagram",
  facebook: "facebook",
  fb: "facebook",
  // descrição
  descricao: "descricao",
  descricao_curta: "descricao",
  descricao_longa: "descricao",
  sobre: "descricao",
  // plano/status
  plano: "plano",
  status: "status",
  // fotos
  foto: "foto_1",
  foto_url: "foto_1",
  foto_principal: "foto_1",
  logo: "foto_1",
  imagem: "foto_1",
  foto_1: "foto_1",
  foto_1_url: "foto_1",
  foto_2: "foto_2",
  foto_2_url: "foto_2",
  foto_3: "foto_3",
  foto_3_url: "foto_3",
  foto_4: "foto_4",
  foto_4_url: "foto_4",
  foto_5: "foto_5",
  foto_5_url: "foto_5",
  foto_6: "foto_6",
  foto_6_url: "foto_6",
  foto_7: "foto_7",
  foto_7_url: "foto_7",
  foto_8: "foto_8",
  foto_8_url: "foto_8",
};

export function normalizeHeader(h: string): string {
  const slug = slugify(h);
  if (HEADER_ALIASES[slug]) return HEADER_ALIASES[slug];
  // remove asteriscos (campos marcados como obrigatórios no template, ex. "Nome*")
  const noStar = slug.replace(/_+$/g, "");
  if (HEADER_ALIASES[noStar]) return HEADER_ALIASES[noStar];
  return slug;
}

/**
 * Detecta a linha de cabeçalho dentro das primeiras N linhas (a planilha oficial
 * tem título, subtítulo e legenda antes do cabeçalho real).
 */
export function detectHeaderRow(matrix: unknown[][]): number {
  const max = Math.min(matrix.length, 12);
  for (let i = 0; i < max; i++) {
    const row = matrix[i] || [];
    const slugs = row.map((c) => slugify(String(c ?? "")));
    const hits = slugs.filter((s) =>
      ["nome", "nome_da_empresa", "categoria", "cidade", "uf", "estado"].includes(s),
    ).length;
    if (hits >= 3) return i;
  }
  return 0;
}

/** Linha "EXEMPLO" deve ser ignorada na importação. */
export function isExampleRow(raw: Record<string, unknown>): boolean {
  const idVal = String((raw as any)._id ?? (raw as any).id ?? "").trim().toUpperCase();
  if (idVal === "EXEMPLO") return true;
  const nome = String((raw as any).nome ?? "").trim().toLowerCase();
  return nome === "pizzaria bella napoli" && String((raw as any).cidade ?? "").toLowerCase() === "maringá";
}

export const MAX_IMPORT_ROWS = 500;

export function buildRedesSociais(instagram?: string, facebook?: string) {
  const list: { platform: string; url: string }[] = [];
  if (instagram) list.push({ platform: "instagram", url: instagram });
  if (facebook) list.push({ platform: "facebook", url: facebook });
  return list;
}

export function parseBairros(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[|;]/)
    .map((b) => b.trim())
    .filter(Boolean);
}

/** Coleta as URLs de foto_1..foto_8 da linha validada (na ordem). */
export function collectFotos(d: ImportRow): string[] {
  const all = [
    d.foto_1,
    d.foto_2,
    d.foto_3,
    d.foto_4,
    d.foto_5,
    d.foto_6,
    d.foto_7,
    d.foto_8,
  ]
    .map((u) => (u || "").trim())
    .filter(Boolean);
  return all.slice(0, MAX_FOTOS);
}
