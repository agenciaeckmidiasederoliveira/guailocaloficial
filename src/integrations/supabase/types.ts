export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics: {
        Row: {
          busca_termo: string | null
          cidade_usuario: string | null
          data_hora: string | null
          dispositivo: string | null
          empresa_id: string | null
          id: string
          ip_hash: string | null
          metadata: Json | null
          pagina: string | null
          referrer: string | null
          session_id: string | null
          tenant_id: string | null
          tipo_evento: string
          user_id: string | null
        }
        Insert: {
          busca_termo?: string | null
          cidade_usuario?: string | null
          data_hora?: string | null
          dispositivo?: string | null
          empresa_id?: string | null
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          pagina?: string | null
          referrer?: string | null
          session_id?: string | null
          tenant_id?: string | null
          tipo_evento: string
          user_id?: string | null
        }
        Update: {
          busca_termo?: string | null
          cidade_usuario?: string | null
          data_hora?: string | null
          dispositivo?: string | null
          empresa_id?: string | null
          id?: string
          ip_hash?: string | null
          metadata?: Json | null
          pagina?: string | null
          referrer?: string | null
          session_id?: string | null
          tenant_id?: string | null
          tipo_evento?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes: {
        Row: {
          aprovado: boolean
          comentario: string | null
          created_at: string
          empresa_id: string
          id: string
          nome_avaliador: string | null
          nota: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          aprovado?: boolean
          comentario?: string | null
          created_at?: string
          empresa_id: string
          id?: string
          nome_avaliador?: string | null
          nota: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          aprovado?: boolean
          comentario?: string | null
          created_at?: string
          empresa_id?: string
          id?: string
          nome_avaliador?: string | null
          nota?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          atualizado_em: string | null
          conteudo: string
          criado_em: string | null
          empresa_categoria: string | null
          empresa_cidade: string | null
          empresa_endereco: string | null
          empresa_foto_url: string | null
          empresa_id: string | null
          empresa_nome: string | null
          empresa_site: string | null
          empresa_telefone: string | null
          empresa_whatsapp: string | null
          id: string
          publicado_em: string | null
          resumo: string | null
          schema_json: Json | null
          seo_description: string | null
          seo_keywords: string | null
          seo_title: string | null
          slug: string
          status: string
          subtitulo: string | null
          tags: string[] | null
          tempo_leitura: number | null
          tipo: string
          titulo: string
          visualizacoes: number | null
        }
        Insert: {
          atualizado_em?: string | null
          conteudo: string
          criado_em?: string | null
          empresa_categoria?: string | null
          empresa_cidade?: string | null
          empresa_endereco?: string | null
          empresa_foto_url?: string | null
          empresa_id?: string | null
          empresa_nome?: string | null
          empresa_site?: string | null
          empresa_telefone?: string | null
          empresa_whatsapp?: string | null
          id?: string
          publicado_em?: string | null
          resumo?: string | null
          schema_json?: Json | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          subtitulo?: string | null
          tags?: string[] | null
          tempo_leitura?: number | null
          tipo: string
          titulo: string
          visualizacoes?: number | null
        }
        Update: {
          atualizado_em?: string | null
          conteudo?: string
          criado_em?: string | null
          empresa_categoria?: string | null
          empresa_cidade?: string | null
          empresa_endereco?: string | null
          empresa_foto_url?: string | null
          empresa_id?: string | null
          empresa_nome?: string | null
          empresa_site?: string | null
          empresa_telefone?: string | null
          empresa_whatsapp?: string | null
          id?: string
          publicado_em?: string | null
          resumo?: string | null
          schema_json?: Json | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          subtitulo?: string | null
          tags?: string[] | null
          tempo_leitura?: number | null
          tipo?: string
          titulo?: string
          visualizacoes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      client_pages: {
        Row: {
          agendamento_ativo: boolean | null
          agendamento_link: string | null
          bairros: Json | null
          blog_posts: Json | null
          business_id: string
          categoria: string | null
          cidade: string | null
          cliques_mes_estimado: number | null
          cliques_whatsapp: number | null
          contatos_gerados: number | null
          cor_primaria: string | null
          cpc_equivalente: number | null
          created_at: string
          depoimentos: Json | null
          descricao_original: string | null
          diferenciais: Json | null
          economia_ads_anual: number | null
          email_contato: string | null
          endereco: string | null
          estado: string | null
          faq: Json | null
          fotos: Json | null
          hero_cta_texto: string | null
          hero_subtitulo: string | null
          hero_titulo: string | null
          horario_funcionamento: Json | null
          id: string
          meta_description: string | null
          meta_title: string | null
          nome_empresa: string | null
          plano: string
          posicao_estimada: number | null
          publicado_at: string | null
          schema_json: Json | null
          servicos: Json | null
          slug: string
          sobre_texto: string | null
          status: string
          telefone: string | null
          total_bairros: number | null
          updated_at: string
          visualizacoes: number | null
          whatsapp: string | null
        }
        Insert: {
          agendamento_ativo?: boolean | null
          agendamento_link?: string | null
          bairros?: Json | null
          blog_posts?: Json | null
          business_id: string
          categoria?: string | null
          cidade?: string | null
          cliques_mes_estimado?: number | null
          cliques_whatsapp?: number | null
          contatos_gerados?: number | null
          cor_primaria?: string | null
          cpc_equivalente?: number | null
          created_at?: string
          depoimentos?: Json | null
          descricao_original?: string | null
          diferenciais?: Json | null
          economia_ads_anual?: number | null
          email_contato?: string | null
          endereco?: string | null
          estado?: string | null
          faq?: Json | null
          fotos?: Json | null
          hero_cta_texto?: string | null
          hero_subtitulo?: string | null
          hero_titulo?: string | null
          horario_funcionamento?: Json | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          nome_empresa?: string | null
          plano?: string
          posicao_estimada?: number | null
          publicado_at?: string | null
          schema_json?: Json | null
          servicos?: Json | null
          slug: string
          sobre_texto?: string | null
          status?: string
          telefone?: string | null
          total_bairros?: number | null
          updated_at?: string
          visualizacoes?: number | null
          whatsapp?: string | null
        }
        Update: {
          agendamento_ativo?: boolean | null
          agendamento_link?: string | null
          bairros?: Json | null
          blog_posts?: Json | null
          business_id?: string
          categoria?: string | null
          cidade?: string | null
          cliques_mes_estimado?: number | null
          cliques_whatsapp?: number | null
          contatos_gerados?: number | null
          cor_primaria?: string | null
          cpc_equivalente?: number | null
          created_at?: string
          depoimentos?: Json | null
          descricao_original?: string | null
          diferenciais?: Json | null
          economia_ads_anual?: number | null
          email_contato?: string | null
          endereco?: string | null
          estado?: string | null
          faq?: Json | null
          fotos?: Json | null
          hero_cta_texto?: string | null
          hero_subtitulo?: string | null
          hero_titulo?: string | null
          horario_funcionamento?: Json | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          nome_empresa?: string | null
          plano?: string
          posicao_estimada?: number | null
          publicado_at?: string | null
          schema_json?: Json | null
          servicos?: Json | null
          slug?: string
          sobre_texto?: string | null
          status?: string
          telefone?: string | null
          total_bairros?: number | null
          updated_at?: string
          visualizacoes?: number | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_pages_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      client_service_pages: {
        Row: {
          business_id: string
          cidade_alvo: string | null
          contatos_gerados: number | null
          created_at: string
          faq: Json | null
          hero_subtitulo: string | null
          hero_titulo: string | null
          id: string
          intro: string | null
          meta_description: string | null
          meta_title: string | null
          page_id: string
          schema_json: Json | null
          secoes: Json | null
          servico_descricao: string | null
          servico_nome: string
          slug_servico: string
          status: string
          updated_at: string
          visualizacoes: number | null
        }
        Insert: {
          business_id: string
          cidade_alvo?: string | null
          contatos_gerados?: number | null
          created_at?: string
          faq?: Json | null
          hero_subtitulo?: string | null
          hero_titulo?: string | null
          id?: string
          intro?: string | null
          meta_description?: string | null
          meta_title?: string | null
          page_id: string
          schema_json?: Json | null
          secoes?: Json | null
          servico_descricao?: string | null
          servico_nome: string
          slug_servico: string
          status?: string
          updated_at?: string
          visualizacoes?: number | null
        }
        Update: {
          business_id?: string
          cidade_alvo?: string | null
          contatos_gerados?: number | null
          created_at?: string
          faq?: Json | null
          hero_subtitulo?: string | null
          hero_titulo?: string | null
          id?: string
          intro?: string | null
          meta_description?: string | null
          meta_title?: string | null
          page_id?: string
          schema_json?: Json | null
          secoes?: Json | null
          servico_descricao?: string | null
          servico_nome?: string
          slug_servico?: string
          status?: string
          updated_at?: string
          visualizacoes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "business_service_pages_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "client_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa_milestones: {
        Row: {
          atingido_em: string
          empresa_id: string
          id: string
          marco: number
        }
        Insert: {
          atingido_em?: string
          empresa_id: string
          id?: string
          marco: number
        }
        Update: {
          atingido_em?: string
          empresa_id?: string
          id?: string
          marco?: number
        }
        Relationships: [
          {
            foreignKeyName: "empresa_milestones_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          bairros: string[] | null
          cep: string | null
          cidade: string
          criado_em: string | null
          data_expiracao_destaque: string | null
          descricao: string | null
          destaque_banner: boolean | null
          destaque_rotacao: boolean | null
          endereco: string
          estado: string
          faq: Json | null
          foto_principal: string | null
          fotos_adicionais: string[] | null
          horario: string | null
          id: string
          imported_at: string | null
          imported_by: string | null
          link_type: string
          meta_description: string | null
          nicho: string | null
          nome: string
          plano: string | null
          redes_sociais: Json | null
          schema_type: string
          site: string | null
          slug: string | null
          status: string | null
          telefone: string
          tenant_id: string | null
          updated_at: string | null
          usuario_id: string | null
          videos: string[] | null
          whatsapp: string
        }
        Insert: {
          bairros?: string[] | null
          cep?: string | null
          cidade: string
          criado_em?: string | null
          data_expiracao_destaque?: string | null
          descricao?: string | null
          destaque_banner?: boolean | null
          destaque_rotacao?: boolean | null
          endereco: string
          estado: string
          faq?: Json | null
          foto_principal?: string | null
          fotos_adicionais?: string[] | null
          horario?: string | null
          id?: string
          imported_at?: string | null
          imported_by?: string | null
          link_type?: string
          meta_description?: string | null
          nicho?: string | null
          nome: string
          plano?: string | null
          redes_sociais?: Json | null
          schema_type?: string
          site?: string | null
          slug?: string | null
          status?: string | null
          telefone: string
          tenant_id?: string | null
          updated_at?: string | null
          usuario_id?: string | null
          videos?: string[] | null
          whatsapp: string
        }
        Update: {
          bairros?: string[] | null
          cep?: string | null
          cidade?: string
          criado_em?: string | null
          data_expiracao_destaque?: string | null
          descricao?: string | null
          destaque_banner?: boolean | null
          destaque_rotacao?: boolean | null
          endereco?: string
          estado?: string
          faq?: Json | null
          foto_principal?: string | null
          fotos_adicionais?: string[] | null
          horario?: string | null
          id?: string
          imported_at?: string | null
          imported_by?: string | null
          link_type?: string
          meta_description?: string | null
          nicho?: string | null
          nome?: string
          plano?: string | null
          redes_sociais?: Json | null
          schema_type?: string
          site?: string | null
          slug?: string | null
          status?: string | null
          telefone?: string
          tenant_id?: string | null
          updated_at?: string | null
          usuario_id?: string | null
          videos?: string[] | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "empresas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      favoritos: {
        Row: {
          created_at: string | null
          empresa_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          empresa_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          empresa_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      import_logs: {
        Row: {
          created_at: string
          error_count: number
          errors: Json | null
          filename: string
          id: string
          success_count: number
          total_rows: number
          user_id: string
        }
        Insert: {
          created_at?: string
          error_count?: number
          errors?: Json | null
          filename: string
          id?: string
          success_count?: number
          total_rows?: number
          user_id: string
        }
        Update: {
          created_at?: string
          error_count?: number
          errors?: Json | null
          filename?: string
          id?: string
          success_count?: number
          total_rows?: number
          user_id?: string
        }
        Relationships: []
      }
      notificacoes_parceiro: {
        Row: {
          created_at: string
          empresa_id: string | null
          id: string
          lida: boolean
          mensagem: string
          parceiro_id: string
          tipo: string
          titulo: string
        }
        Insert: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          lida?: boolean
          mensagem: string
          parceiro_id: string
          tipo: string
          titulo: string
        }
        Update: {
          created_at?: string
          empresa_id?: string | null
          id?: string
          lida?: boolean
          mensagem?: string
          parceiro_id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_parceiro_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_parceiro_parceiro_id_fkey"
            columns: ["parceiro_id"]
            isOneToOne: false
            referencedRelation: "parceiros"
            referencedColumns: ["id"]
          },
        ]
      }
      pagamentos: {
        Row: {
          asaas_customer_id: string | null
          asaas_payment_id: string | null
          created_at: string
          empresa_id: string | null
          id: string
          invoice_url: string | null
          metodo_pagamento: string | null
          status: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          asaas_customer_id?: string | null
          asaas_payment_id?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          invoice_url?: string | null
          metodo_pagamento?: string | null
          status?: string
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          asaas_customer_id?: string | null
          asaas_payment_id?: string | null
          created_at?: string
          empresa_id?: string | null
          id?: string
          invoice_url?: string | null
          metodo_pagamento?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      parceiros: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cidades_atendidas: Json
          convite_token: string
          cota_free: number | null
          cota_premium: number
          data_adicao: string | null
          email: string
          id: string
          is_master: boolean
          nivel: string
          nome: string | null
          slug: string | null
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cidades_atendidas?: Json
          convite_token?: string
          cota_free?: number | null
          cota_premium?: number
          data_adicao?: string | null
          email?: string
          id?: string
          is_master?: boolean
          nivel?: string
          nome?: string | null
          slug?: string | null
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cidades_atendidas?: Json
          convite_token?: string
          cota_free?: number | null
          cota_premium?: number
          data_adicao?: string | null
          email?: string
          id?: string
          is_master?: boolean
          nivel?: string
          nome?: string | null
          slug?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          role?: string | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          ativo: boolean
          created_at: string
          dominio_customizado: string | null
          id: string
          nome_cidade: string
          parceiro_id: string | null
          slug: string
          subdominio: string | null
          uf: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          dominio_customizado?: string | null
          id?: string
          nome_cidade: string
          parceiro_id?: string | null
          slug: string
          subdominio?: string | null
          uf: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          dominio_customizado?: string | null
          id?: string
          nome_cidade?: string
          parceiro_id?: string | null
          slug?: string
          subdominio?: string | null
          uf?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_parceiro_detalhe: {
        Args: { p_parceiro_id: string }
        Returns: Json
      }
      admin_get_parceiros_analytics: {
        Args: never
        Returns: {
          cidades_count: number
          email: string
          nivel: string
          nome: string
          parceiro_id: string
          slug: string
          total_empresas: number
          total_free: number
          total_pagamentos_confirmados: number
          total_premium: number
          total_telefone: number
          total_vendas: number
          total_views: number
          total_whatsapp: number
        }[]
      }
      admin_get_parceiros_overview: { Args: never; Returns: Json }
      check_empresa_milestones: {
        Args: { p_empresa_id: string }
        Returns: undefined
      }
      claim_parceiro_invite: { Args: { p_token: string }; Returns: boolean }
      count_minhas_notificacoes_nao_lidas: { Args: never; Returns: number }
      generate_slug: { Args: { input_name: string }; Returns: string }
      get_auth_email: { Args: never; Returns: string }
      get_empresa_parceiro: {
        Args: { p_empresa_id: string }
        Returns: {
          nivel: string
          nome: string
        }[]
      }
      get_empresas_das_minhas_cidades: {
        Args: never
        Returns: {
          bairros: string[] | null
          cep: string | null
          cidade: string
          criado_em: string | null
          data_expiracao_destaque: string | null
          descricao: string | null
          destaque_banner: boolean | null
          destaque_rotacao: boolean | null
          endereco: string
          estado: string
          faq: Json | null
          foto_principal: string | null
          fotos_adicionais: string[] | null
          horario: string | null
          id: string
          imported_at: string | null
          imported_by: string | null
          link_type: string
          meta_description: string | null
          nicho: string | null
          nome: string
          plano: string | null
          redes_sociais: Json | null
          schema_type: string
          site: string | null
          slug: string | null
          status: string | null
          telefone: string
          tenant_id: string | null
          updated_at: string | null
          usuario_id: string | null
          videos: string[] | null
          whatsapp: string
        }[]
        SetofOptions: {
          from: "*"
          to: "empresas"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_my_parceiro_info: {
        Args: never
        Returns: {
          cota_free: number
          cota_premium: number
          id: string
          nivel: string
          nome: string
        }[]
      }
      get_parceiro_local_por_cidade: {
        Args: { p_cidade: string; p_estado: string }
        Returns: {
          avatar_url: string
          id: string
          nivel: string
          nome: string
          slug: string
          whatsapp: string
        }[]
      }
      get_parceiro_por_slug: {
        Args: { p_slug: string }
        Returns: {
          avatar_url: string
          bio: string
          cidades_atendidas: Json
          id: string
          nivel: string
          nome: string
          slug: string
          total_empresas: number
          whatsapp: string
        }[]
      }
      get_parceiros_ranking: {
        Args: never
        Returns: {
          id: string
          nivel: string
          nome: string
          total_empresas: number
          total_premium: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_client_page_views: {
        Args: { p_slug: string }
        Returns: undefined
      }
      increment_client_page_whatsapp: {
        Args: { p_slug: string }
        Returns: undefined
      }
      incrementar_visualizacao_post: {
        Args: { post_slug: string }
        Returns: undefined
      }
      marcar_notificacoes_lidas: { Args: never; Returns: undefined }
      unaccent_simple: { Args: { t: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "parceiro" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "parceiro", "user"],
    },
  },
} as const
