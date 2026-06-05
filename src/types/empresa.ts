// Tipos centralizados para Empresa

export interface EmpresaBase {
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
  site?: string | null;
  horario?: string | null;
}

export interface EmpresaCard extends EmpresaBase {
  site: string | null;
  horario: string | null;
}

export interface EmpresaDetalhes extends EmpresaBase {
  fotos_adicionais: string[];
  videos: string[];
  descricao: string | null;
}
