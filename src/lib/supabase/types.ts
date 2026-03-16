// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: string | null
          id: string
          ip_address: string | null
          org_id: string
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: string | null
          id?: string
          ip_address?: string | null
          org_id: string
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: string | null
          id?: string
          ip_address?: string | null
          org_id?: string
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          client_name: string
          cnpj: string | null
          created_at: string | null
          id: string
          industry: string | null
          org_id: string
          user_id: string | null
        }
        Insert: {
          client_name: string
          cnpj?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          org_id: string
          user_id?: string | null
        }
        Update: {
          client_name?: string
          cnpj?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          org_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_rows: {
        Row: {
          created_at: string
          data: Json
          document_id: string
          id: string
          org_id: string
          row_index: number
        }
        Insert: {
          created_at?: string
          data: Json
          document_id: string
          id?: string
          org_id: string
          row_index: number
        }
        Update: {
          created_at?: string
          data?: Json
          document_id?: string
          id?: string
          org_id?: string
          row_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_rows_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_rows_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string | null
          description: string | null
          document_type: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          filename: string
          id: string
          is_archived: boolean | null
          metadata: Json | null
          mime_type: string | null
          org_id: string
          source: string | null
          status: string
          title: string
          updated_at: string | null
          user_id: string
          valuation_project_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_type?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          filename: string
          id?: string
          is_archived?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          org_id: string
          source?: string | null
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
          valuation_project_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_type?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          filename?: string
          id?: string
          is_archived?: boolean | null
          metadata?: Json | null
          mime_type?: string | null
          org_id?: string
          source?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          valuation_project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_created_by_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_documents_valuation_project_id"
            columns: ["valuation_project_id"]
            isOneToOne: false
            referencedRelation: "valuation_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_balancete: {
        Row: {
          account_description: string | null
          classification_code: string | null
          created_at: string | null
          credit: number | null
          current_balance: number | null
          debit: number | null
          document_id: string
          id: string
          org_id: string
          previous_balance: number | null
        }
        Insert: {
          account_description?: string | null
          classification_code?: string | null
          created_at?: string | null
          credit?: number | null
          current_balance?: number | null
          debit?: number | null
          document_id: string
          id?: string
          org_id: string
          previous_balance?: number | null
        }
        Update: {
          account_description?: string | null
          classification_code?: string | null
          created_at?: string | null
          credit?: number | null
          current_balance?: number | null
          debit?: number | null
          document_id?: string
          id?: string
          org_id?: string
          previous_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_balancete_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_balancete_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_balanco_patrimonial: {
        Row: {
          classification_code: string | null
          created_at: string | null
          description: string | null
          document_id: string
          id: string
          nature_year_n: string | null
          nature_year_n_minus_1: string | null
          org_id: string
          value_year_n: number | null
          value_year_n_minus_1: number | null
          year_n: number | null
          year_n_minus_1: number | null
        }
        Insert: {
          classification_code?: string | null
          created_at?: string | null
          description?: string | null
          document_id: string
          id?: string
          nature_year_n?: string | null
          nature_year_n_minus_1?: string | null
          org_id: string
          value_year_n?: number | null
          value_year_n_minus_1?: number | null
          year_n?: number | null
          year_n_minus_1?: number | null
        }
        Update: {
          classification_code?: string | null
          created_at?: string | null
          description?: string | null
          document_id?: string
          id?: string
          nature_year_n?: string | null
          nature_year_n_minus_1?: string | null
          org_id?: string
          value_year_n?: number | null
          value_year_n_minus_1?: number | null
          year_n?: number | null
          year_n_minus_1?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_balanco_patrimonial_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_balanco_patrimonial_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_data: {
        Row: {
          account_name: string | null
          created_at: string | null
          document_id: string
          id: string
          org_id: string
          period: string | null
          row_number: number | null
          value: number | null
        }
        Insert: {
          account_name?: string | null
          created_at?: string | null
          document_id: string
          id?: string
          org_id: string
          period?: string | null
          row_number?: number | null
          value?: number | null
        }
        Update: {
          account_name?: string | null
          created_at?: string | null
          document_id?: string
          id?: string
          org_id?: string
          period?: string | null
          row_number?: number | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_data_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "financial_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_data_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_documents: {
        Row: {
          created_at: string | null
          document_type: string | null
          file_name: string
          file_path: string | null
          file_size: number | null
          id: string
          metadata: Json | null
          org_id: string
          sharepoint_path: string | null
          status: string | null
          updated_at: string | null
          upload_date: string | null
          valuation_id: string
        }
        Insert: {
          created_at?: string | null
          document_type?: string | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          org_id: string
          sharepoint_path?: string | null
          status?: string | null
          updated_at?: string | null
          upload_date?: string | null
          valuation_id: string
        }
        Update: {
          created_at?: string | null
          document_type?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          metadata?: Json | null
          org_id?: string
          sharepoint_path?: string | null
          status?: string | null
          updated_at?: string | null
          upload_date?: string | null
          valuation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_documents_valuation_id_fkey"
            columns: ["valuation_id"]
            isOneToOne: false
            referencedRelation: "valuations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_dre: {
        Row: {
          balance: number | null
          created_at: string | null
          description: string | null
          document_id: string
          id: string
          org_id: string
          sum: number | null
          total: number | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          description?: string | null
          document_id: string
          id?: string
          org_id: string
          sum?: number | null
          total?: number | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          description?: string | null
          document_id?: string
          id?: string
          org_id?: string
          sum?: number | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_dre_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_dre_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_fluxo_caixa: {
        Row: {
          created_at: string | null
          description: string | null
          document_id: string
          id: string
          org_id: string
          period: string | null
          value: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_id: string
          id?: string
          org_id: string
          period?: string | null
          value?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_id?: string
          id?: string
          org_id?: string
          period?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_fluxo_caixa_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_fluxo_caixa_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      kb_documents: {
        Row: {
          content: string
          created_at: string | null
          document_id: string | null
          embedding: string | null
          id: string
          kb_id: string
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          kb_id: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          kb_id?: string
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kb_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kb_documents_kb_id_fkey"
            columns: ["kb_id"]
            isOneToOne: false
            referencedRelation: "knowledge_bases"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_bases: {
        Row: {
          created_at: string | null
          created_by_id: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          org_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by_id: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          org_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by_id?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          org_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_bases_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_bases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          logo_url: string | null
          name: string
          slug: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      password_reset_attempts: {
        Row: {
          attempted_at: string | null
          email: string
          id: string
          ip_address: string | null
          org_id: string
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string | null
          email: string
          id: string
          ip_address?: string | null
          org_id: string
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          org_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          is_used: boolean | null
          org_id: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          is_used?: boolean | null
          org_id: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          is_used?: boolean | null
          org_id?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_reset_tokens_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "password_reset_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          resource: string
          updated_at: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          resource: string
          updated_at?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          resource?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          allowed: boolean
          created_at: string | null
          permission_id: string
          role_id: string
        }
        Insert: {
          allowed?: boolean
          created_at?: string | null
          permission_id: string
          role_id: string
        }
        Update: {
          allowed?: boolean
          created_at?: string | null
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      two_factor_auth: {
        Row: {
          created_at: string | null
          disabled_at: string | null
          enabled_at: string | null
          id: string
          is_enabled: boolean | null
          is_verified: boolean | null
          last_used_at: string | null
          org_id: string
          secret: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          disabled_at?: string | null
          enabled_at?: string | null
          id?: string
          is_enabled?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string | null
          org_id: string
          secret: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          disabled_at?: string | null
          enabled_at?: string | null
          id?: string
          is_enabled?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string | null
          org_id?: string
          secret?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "two_factor_auth_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "two_factor_auth_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          last_login: string | null
          org_id: string
          password_hash: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_login?: string | null
          org_id: string
          password_hash?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          last_login?: string | null
          org_id?: string
          password_hash?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      users_roles: {
        Row: {
          created_at: string | null
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      valuation_projects: {
        Row: {
          company_name: string
          created_at: string | null
          description: string | null
          id: string
          org_id: string
          project_name: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string | null
          description?: string | null
          id?: string
          org_id: string
          project_name: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string | null
          description?: string | null
          id?: string
          org_id?: string
          project_name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "valuation_projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valuation_projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      valuations: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          org_id: string
          sharepoint_folder_path: string | null
          status: string | null
          valuation_name: string
          valuation_type: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          org_id: string
          sharepoint_folder_path?: string | null
          status?: string | null
          valuation_name: string
          valuation_type?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          org_id?: string
          sharepoint_folder_path?: string | null
          status?: string | null
          valuation_name?: string
          valuation_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "valuations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "valuations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_document_values: {
        Row: {
          custo: number | null
          document_id: string | null
          margem: number | null
          org_id: string | null
          receita: number | null
        }
        Insert: {
          custo?: never
          document_id?: string | null
          margem?: never
          org_id?: string | null
          receita?: never
        }
        Update: {
          custo?: never
          document_id?: string | null
          margem?: never
          org_id?: string | null
          receita?: never
        }
        Relationships: [
          {
            foreignKeyName: "document_rows_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_rows_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_user_org_id: { Args: never; Returns: string }
      get_user_role_name: { Args: never; Returns: string }
      has_permission: {
        Args: { p_action: string; p_resource: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const


// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: audit_logs
//   id: uuid (not null, default: gen_random_uuid())
//   org_id: uuid (not null)
//   user_id: uuid (nullable)
//   action: character varying (not null)
//   resource_type: character varying (nullable)
//   resource_id: character varying (nullable)
//   details: text (nullable)
//   ip_address: character varying (nullable)
//   user_agent: character varying (nullable)
//   created_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
// Table: clients
//   id: uuid (not null, default: gen_random_uuid())
//   org_id: uuid (not null)
//   user_id: uuid (nullable)
//   client_name: text (not null)
//   cnpj: text (nullable)
//   industry: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: document_rows
//   id: uuid (not null, default: gen_random_uuid())
//   org_id: uuid (not null)
//   document_id: uuid (not null)
//   row_index: integer (not null)
//   data: jsonb (not null)
//   created_at: timestamp with time zone (not null, default: now())
// Table: documents
//   id: uuid (not null, default: gen_random_uuid())
//   org_id: uuid (not null)
//   user_id: uuid (not null)
//   title: character varying (not null)
//   description: text (nullable)
//   file_path: character varying (nullable)
//   file_size: integer (nullable)
//   mime_type: character varying (nullable)
//   source: character varying (nullable, default: 'upload'::character varying)
//   is_archived: boolean (nullable, default: false)
//   created_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
//   updated_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
//   filename: character varying (not null)
//   file_type: character varying (nullable)
//   status: character varying (not null, default: 'Uploaded'::character varying)
//   valuation_project_id: uuid (nullable)
//   document_type: character varying (nullable)
//   metadata: jsonb (nullable)
// Table: financial_balancete
//   id: uuid (not null, default: gen_random_uuid())
//   org_id: uuid (not null)
//   document_id: uuid (not null)
//   classification_code: character varying (nullable)
//   account_description: text (nullable)
//   previous_balance: numeric (nullable)
//   debit: numeric (nullable)
//   credit: numeric (nullable)
//   current_balance: numeric (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: financial_balanco_patrimonial
//   id: uuid (not null, default: gen_random_uuid())
//   org_id: uuid (not null)
//   document_id: uuid (not null)
//   classification_code: character varying (nullable)
//   description: text (nullable)
//   value_year_n: numeric (nullable)
//   value_year_n_minus_1: numeric (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   nature_year_n: text (nullable)
//   nature_year_n_minus_1: text (nullable)
//   year_n: integer (nullable)
//   year_n_minus_1: integer (nullable)
// Table: financial_data
//   id: uuid (not null, default: gen_random_uuid())
//   org_id: uuid (not null)
//   document_id: uuid (not null)
//   row_number: integer (nullable)
//   account_name: text (nullable)
//   value: numeric (nullable)
//   period: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: financial_documents
//   id: uuid (not null, default: gen_random_uuid())
//   org_id: uuid (not null)
//   valuation_id: uuid (not null)
//   document_type: text (nullable)
//   file_name: text (not null)
//   sharepoint_path: text (nullable)
//   file_path: text (nullable)
//   file_size: integer (nullable)
//   status: text (nullable, default: 'Processado'::text)
//   metadata: jsonb (nullable)
//   upload_date: timestamp with time zone (nullable, default: now())
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable)
// Table: financial_dre
//   id: uuid (not null, default: gen_random_uuid())
//   org_id: uuid (not null)
//   document_id: uuid (not null)
//   description: text (nullable)
//   balance: numeric (nullable)
//   sum: numeric (nullable)
//   total: numeric (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: financial_fluxo_caixa
//   id: uuid (not null, default: gen_random_uuid())
//   org_id: uuid (not null)
//   document_id: uuid (not null)
//   description: text (nullable)
//   value: numeric (nullable)
//   period: character varying (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: kb_documents
//   id: uuid (not null, default: gen_random_uuid())
//   kb_id: uuid (not null)
//   document_id: uuid (nullable)
//   content: text (not null)
//   embedding: vector (nullable)
//   metadata: jsonb (nullable)
//   created_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
//   updated_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
// Table: knowledge_bases
//   id: uuid (not null, default: gen_random_uuid())
//   org_id: uuid (not null)
//   created_by_id: uuid (not null)
//   name: character varying (not null)
//   description: text (nullable)
//   is_active: boolean (nullable, default: true)
//   created_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
//   updated_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
// Table: organizations
//   id: uuid (not null, default: gen_random_uuid())
//   name: character varying (not null)
//   slug: character varying (not null)
//   description: character varying (nullable)
//   logo_url: character varying (nullable)
//   website: character varying (nullable)
//   is_active: boolean (nullable, default: true)
//   is_default: boolean (nullable, default: false)
//   created_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
//   updated_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
// Table: password_reset_attempts
//   id: character varying (not null)
//   email: character varying (not null)
//   org_id: character varying (not null)
//   attempted_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
//   ip_address: character varying (nullable)
//   user_agent: character varying (nullable)
// Table: password_reset_tokens
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   org_id: uuid (not null)
//   token_hash: character varying (not null)
//   is_used: boolean (nullable, default: false)
//   used_at: timestamp without time zone (nullable)
//   expires_at: timestamp without time zone (not null)
//   created_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
// Table: permissions
//   id: uuid (not null, default: gen_random_uuid())
//   resource: text (not null)
//   action: text (not null)
//   description: character varying (nullable)
//   is_active: boolean (nullable, default: true)
//   created_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
//   updated_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
// Table: role_permissions
//   role_id: uuid (not null)
//   permission_id: uuid (not null)
//   allowed: boolean (not null, default: true)
//   created_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
// Table: roles
//   id: uuid (not null, default: gen_random_uuid())
//   name: character varying (not null)
//   description: character varying (nullable)
//   is_active: boolean (nullable, default: true)
//   created_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
//   updated_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
// Table: two_factor_auth
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   org_id: uuid (not null)
//   secret: character varying (not null)
//   is_enabled: boolean (nullable, default: false)
//   is_verified: boolean (nullable, default: false)
//   enabled_at: timestamp without time zone (nullable)
//   disabled_at: timestamp without time zone (nullable)
//   last_used_at: timestamp without time zone (nullable)
//   created_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
//   updated_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
// Table: users
//   id: uuid (not null, default: gen_random_uuid())
//   org_id: uuid (not null)
//   email: character varying (not null)
//   full_name: character varying (nullable)
//   password_hash: character varying (nullable)
//   is_active: boolean (nullable, default: false)
//   is_verified: boolean (nullable, default: false)
//   last_login: timestamp without time zone (nullable)
//   created_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
//   updated_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
// Table: users_roles
//   user_id: uuid (not null)
//   role_id: uuid (not null)
//   created_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
// Table: v_document_values
//   org_id: uuid (nullable)
//   document_id: uuid (nullable)
//   receita: numeric (nullable)
//   custo: numeric (nullable)
//   margem: numeric (nullable)
// Table: valuation_projects
//   id: uuid (not null, default: gen_random_uuid())
//   org_id: uuid (not null)
//   user_id: uuid (not null)
//   project_name: character varying (not null)
//   company_name: character varying (not null)
//   description: text (nullable)
//   status: character varying (nullable, default: 'draft'::character varying)
//   created_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
//   updated_at: timestamp without time zone (nullable, default: CURRENT_TIMESTAMP)
// Table: valuations
//   id: uuid (not null, default: gen_random_uuid())
//   org_id: uuid (not null)
//   client_id: uuid (not null)
//   valuation_type: text (nullable)
//   valuation_name: text (not null)
//   sharepoint_folder_path: text (nullable)
//   status: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())

// --- CONSTRAINTS ---
// Table: audit_logs
//   FOREIGN KEY audit_logs_org_id_fkey: FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY audit_logs_pkey: PRIMARY KEY (id)
//   FOREIGN KEY audit_logs_user_id_fkey: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
// Table: clients
//   FOREIGN KEY clients_org_id_fkey: FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY clients_pkey: PRIMARY KEY (id)
//   FOREIGN KEY clients_user_id_fkey: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
// Table: document_rows
//   FOREIGN KEY document_rows_document_id_fkey: FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
//   FOREIGN KEY document_rows_org_id_fkey: FOREIGN KEY (org_id) REFERENCES organizations(id)
//   PRIMARY KEY document_rows_pkey: PRIMARY KEY (id)
// Table: documents
//   FOREIGN KEY documents_created_by_id_fkey: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
//   FOREIGN KEY documents_org_id_fkey: FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY documents_pkey: PRIMARY KEY (id)
//   FOREIGN KEY fk_documents_valuation_project_id: FOREIGN KEY (valuation_project_id) REFERENCES valuation_projects(id) ON DELETE SET NULL
// Table: financial_balancete
//   FOREIGN KEY financial_balancete_document_id_fkey: FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
//   FOREIGN KEY financial_balancete_org_id_fkey: FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY financial_balancete_pkey: PRIMARY KEY (id)
// Table: financial_balanco_patrimonial
//   FOREIGN KEY financial_balanco_patrimonial_document_id_fkey: FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
//   FOREIGN KEY financial_balanco_patrimonial_org_id_fkey: FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY financial_balanco_patrimonial_pkey: PRIMARY KEY (id)
// Table: financial_data
//   FOREIGN KEY financial_data_document_id_fkey: FOREIGN KEY (document_id) REFERENCES financial_documents(id) ON DELETE CASCADE
//   FOREIGN KEY financial_data_org_id_fkey: FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY financial_data_pkey: PRIMARY KEY (id)
// Table: financial_documents
//   CHECK financial_documents_document_type_check: CHECK ((document_type = ANY (ARRAY['Balanço'::text, 'Balancete'::text, 'DRE'::text, 'Fluxo de Caixa'::text])))
//   FOREIGN KEY financial_documents_org_id_fkey: FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY financial_documents_pkey: PRIMARY KEY (id)
//   FOREIGN KEY financial_documents_valuation_id_fkey: FOREIGN KEY (valuation_id) REFERENCES valuations(id) ON DELETE CASCADE
// Table: financial_dre
//   FOREIGN KEY financial_dre_document_id_fkey: FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
//   FOREIGN KEY financial_dre_org_id_fkey: FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY financial_dre_pkey: PRIMARY KEY (id)
// Table: financial_fluxo_caixa
//   FOREIGN KEY financial_fluxo_caixa_document_id_fkey: FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
//   FOREIGN KEY financial_fluxo_caixa_org_id_fkey: FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY financial_fluxo_caixa_pkey: PRIMARY KEY (id)
// Table: kb_documents
//   FOREIGN KEY kb_documents_document_id_fkey: FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
//   FOREIGN KEY kb_documents_kb_id_fkey: FOREIGN KEY (kb_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE
//   PRIMARY KEY kb_documents_pkey: PRIMARY KEY (id)
// Table: knowledge_bases
//   FOREIGN KEY knowledge_bases_created_by_id_fkey: FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE
//   FOREIGN KEY knowledge_bases_org_id_fkey: FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY knowledge_bases_pkey: PRIMARY KEY (id)
// Table: organizations
//   PRIMARY KEY organizations_pkey: PRIMARY KEY (id)
//   UNIQUE organizations_slug_key: UNIQUE (slug)
// Table: password_reset_attempts
//   PRIMARY KEY password_reset_attempts_pkey: PRIMARY KEY (id)
// Table: password_reset_tokens
//   FOREIGN KEY password_reset_tokens_org_id_fkey: FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY password_reset_tokens_pkey: PRIMARY KEY (id)
//   UNIQUE password_reset_tokens_token_hash_key: UNIQUE (token_hash)
//   FOREIGN KEY password_reset_tokens_user_id_fkey: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
// Table: permissions
//   PRIMARY KEY permissions_pkey: PRIMARY KEY (id)
//   UNIQUE permissions_resource_action_key: UNIQUE (resource, action)
// Table: role_permissions
//   FOREIGN KEY role_permissions_permission_id_fkey: FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
//   PRIMARY KEY role_permissions_pkey: PRIMARY KEY (role_id, permission_id)
//   FOREIGN KEY role_permissions_role_id_fkey: FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
// Table: roles
//   UNIQUE roles_name_key: UNIQUE (name)
//   PRIMARY KEY roles_pkey: PRIMARY KEY (id)
// Table: two_factor_auth
//   FOREIGN KEY two_factor_auth_org_id_fkey: FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY two_factor_auth_pkey: PRIMARY KEY (id)
//   FOREIGN KEY two_factor_auth_user_id_fkey: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
//   UNIQUE two_factor_auth_user_id_key: UNIQUE (user_id)
// Table: users
//   UNIQUE users_org_id_email_key: UNIQUE (org_id, email)
//   FOREIGN KEY users_org_id_fkey: FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY users_pkey: PRIMARY KEY (id)
// Table: users_roles
//   PRIMARY KEY users_roles_pkey: PRIMARY KEY (user_id, role_id)
//   FOREIGN KEY users_roles_role_id_fkey: FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
//   FOREIGN KEY users_roles_user_id_fkey: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
// Table: valuation_projects
//   FOREIGN KEY valuation_projects_org_id_fkey: FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY valuation_projects_pkey: PRIMARY KEY (id)
//   FOREIGN KEY valuation_projects_user_id_fkey: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
// Table: valuations
//   FOREIGN KEY valuations_client_id_fkey: FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
//   FOREIGN KEY valuations_org_id_fkey: FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
//   PRIMARY KEY valuations_pkey: PRIMARY KEY (id)
//   CHECK valuations_status_check: CHECK ((status = ANY (ARRAY['Em Andamento'::text, 'Concluído'::text])))
//   CHECK valuations_valuation_type_check: CHECK ((valuation_type = ANY (ARRAY['Valuation'::text, 'M&A'::text])))

// --- ROW LEVEL SECURITY POLICIES ---
// Table: clients
//   Policy "App_Delete_clients" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Insert_clients" (INSERT, PERMISSIVE) roles={authenticated,authenticator,dashboard_user,postgres,service_role,supabase_admin}
//     WITH CHECK: true
//   Policy "App_Select_clients" (SELECT, PERMISSIVE) roles={authenticated,authenticator,dashboard_user,postgres,service_role,supabase_admin}
//     USING: true
//   Policy "App_Update_clients" (UPDATE, PERMISSIVE) roles={authenticated,authenticator,dashboard_user,postgres,service_role,supabase_admin}
//     USING: true
//     WITH CHECK: true
//   Policy "admin_all_access_clients" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "tenant_isolation_clients" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (org_id = get_user_org_id())
// Table: document_rows
//   Policy "admin_all_access_document_rows" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "bypass_rls_rows_testing" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
// Table: documents
//   Policy "admin_all_access_documents" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "bypass_rls_for_testing" (ALL, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "documents_select_policy" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (org_id = get_user_org_id())
// Table: financial_balancete
//   Policy "App_Delete_financial_balancete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Insert_financial_balancete" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "App_Select_financial_balancete" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Update_financial_balancete" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "admin_all_access_financial_balancete" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "tenant_isolation_balancete" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (org_id = get_user_org_id())
// Table: financial_balanco_patrimonial
//   Policy "App_Delete_financial_balanco_patrimonial" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Insert_financial_balanco_patrimonial" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "App_Select_financial_balanco_patrimonial" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Update_financial_balanco_patrimonial" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "admin_all_access_financial_balanco_patrimonial" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "tenant_isolation_bp" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (org_id = get_user_org_id())
// Table: financial_data
//   Policy "App_Delete_financial_data" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Insert_financial_data" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "App_Select_financial_data" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Update_financial_data" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "admin_all_access_financial_data" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "tenant_isolation_financial_data" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (org_id = get_user_org_id())
// Table: financial_documents
//   Policy "App_Delete_financial_documents" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Insert_financial_documents" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "App_Select_financial_documents" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Update_financial_documents" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "admin_all_access_financial_documents" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "tenant_isolation_financial_documents" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (org_id = get_user_org_id())
// Table: financial_dre
//   Policy "App_Delete_financial_dre" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Insert_financial_dre" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "App_Select_financial_dre" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Update_financial_dre" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "admin_all_access_financial_dre" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "tenant_isolation_dre" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (org_id = get_user_org_id())
// Table: financial_fluxo_caixa
//   Policy "App_Delete_financial_fluxo_caixa" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Insert_financial_fluxo_caixa" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "App_Select_financial_fluxo_caixa" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Update_financial_fluxo_caixa" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "admin_all_access_financial_fluxo_caixa" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "tenant_isolation_fc" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (org_id = get_user_org_id())
// Table: kb_documents
//   Policy "admin_all_access_kb_documents" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
// Table: knowledge_bases
//   Policy "admin_all_access_knowledge_bases" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
// Table: organizations
//   Policy "App_Delete_organizations" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Insert_organizations" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "App_Select_organizations" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Update_organizations" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "admin_all_access_organizations" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "admin_orgs_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//   Policy "admin_orgs_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "admin_orgs_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//   Policy "orgs_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: permissions
//   Policy "admin_all_access_permissions" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "admin_permissions_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//   Policy "admin_permissions_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "admin_permissions_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "admin_permissions_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//   Policy "authenticated_read_permissions" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: role_permissions
//   Policy "App_Delete_role_permissions" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Insert_role_permissions" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "App_Select_role_permissions" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Update_role_permissions" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "admin_role_permissions_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//   Policy "admin_role_permissions_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "admin_role_permissions_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "admin_role_permissions_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//   Policy "authenticated_read_role_permissions" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: roles
//   Policy "App_Delete_roles" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Insert_roles" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "App_Select_roles" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Update_roles" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "admin_all_access_roles" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "admin_roles_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//   Policy "admin_roles_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "admin_roles_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//   Policy "roles_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: users
//   Policy "App_Delete_users" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Insert_users" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "App_Select_users" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Update_users" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "admin_all_access_users" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "admin_all_users_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//   Policy "admin_all_users_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "admin_all_users_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//   Policy "admin_all_users_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//   Policy "tenant_isolation_users_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: ((id = auth.uid()) OR (org_id = get_user_org_id()))
//   Policy "tenant_isolation_users_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (org_id = get_user_org_id())
// Table: users_roles
//   Policy "App_Delete_users_roles" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Insert_users_roles" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "App_Select_users_roles" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Update_users_roles" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "users_roles_delete" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM users target   WHERE ((target.id = users_roles.user_id) AND (target.org_id = get_user_org_id()))))
//   Policy "users_roles_insert" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: (EXISTS ( SELECT 1    FROM users target   WHERE ((target.id = users_roles.user_id) AND (target.org_id = get_user_org_id()))))
//   Policy "users_roles_select" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "users_roles_update" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: (EXISTS ( SELECT 1    FROM users target   WHERE ((target.id = users_roles.user_id) AND (target.org_id = get_user_org_id()))))
// Table: valuation_projects
//   Policy "admin_all_access_valuation_projects" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "valuation_projects_select_own_org" (SELECT, PERMISSIVE) roles={public}
//     USING: (org_id = (current_setting('app.current_org_id'::text))::uuid)
// Table: valuations
//   Policy "App_Delete_valuations" (DELETE, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Insert_valuations" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "App_Select_valuations" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
//   Policy "App_Update_valuations" (UPDATE, PERMISSIVE) roles={authenticated}
//     USING: true
//     WITH CHECK: true
//   Policy "admin_all_access_valuations" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (get_user_role_name() = 'Admin'::text)
//     WITH CHECK: (get_user_role_name() = 'Admin'::text)
//   Policy "tenant_isolation_valuations" (ALL, PERMISSIVE) roles={authenticated}
//     USING: (org_id = get_user_org_id())

// --- DATABASE FUNCTIONS ---
// FUNCTION get_user_org_id()
//   CREATE OR REPLACE FUNCTION public.get_user_org_id()
//    RETURNS uuid
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   DECLARE
//     v_org_id uuid;
//   BEGIN
//     SELECT org_id INTO v_org_id FROM public.users WHERE id = auth.uid() LIMIT 1;
//     RETURN v_org_id;
//   END;
//   $function$
//   
// FUNCTION get_user_role_name()
//   CREATE OR REPLACE FUNCTION public.get_user_role_name()
//    RETURNS text
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   DECLARE
//     v_role_name text;
//   BEGIN
//     SELECT r.name INTO v_role_name
//     FROM public.users_roles ur
//     JOIN public.roles r ON r.id = ur.role_id
//     WHERE ur.user_id = auth.uid() LIMIT 1;
//     RETURN v_role_name;
//   END;
//   $function$
//   
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//     v_org_id uuid;
//     v_is_new_org boolean := false;
//     v_role_id uuid;
//   BEGIN
//     -- Try to find an organization by name
//     SELECT id INTO v_org_id FROM public.organizations WHERE name = NEW.raw_user_meta_data->>'org_name' LIMIT 1;
//     
//     -- Create new org if none found
//     IF v_org_id IS NULL THEN
//       INSERT INTO public.organizations (name, slug)
//       VALUES (
//         COALESCE(NEW.raw_user_meta_data->>'org_name', 'Default Org'), 
//         regexp_replace(lower(COALESCE(NEW.raw_user_meta_data->>'org_name', 'default-org')), '[^a-z0-9]+', '-', 'g') || '-' || substr(md5(random()::text), 1, 6)
//       ) RETURNING id INTO v_org_id;
//       v_is_new_org := true;
//     END IF;
//   
//     -- Insert profile
//     INSERT INTO public.users (id, org_id, email, full_name, is_active)
//     VALUES (
//       NEW.id,
//       v_org_id,
//       NEW.email,
//       NEW.raw_user_meta_data->>'full_name',
//       v_is_new_org -- First user in new org is active Admin
//     );
//   
//     -- Assign Role
//     IF v_is_new_org THEN
//       SELECT id INTO v_role_id FROM public.roles WHERE name = 'Admin' LIMIT 1;
//     ELSE
//       SELECT id INTO v_role_id FROM public.roles WHERE name = 'Viewer' LIMIT 1;
//     END IF;
//   
//     IF v_role_id IS NOT NULL THEN
//       INSERT INTO public.users_roles (user_id, role_id) VALUES (NEW.id, v_role_id);
//     END IF;
//   
//     RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION has_permission(uuid, text, text)
//   CREATE OR REPLACE FUNCTION public.has_permission(p_user_id uuid, p_resource text, p_action text)
//    RETURNS boolean
//    LANGUAGE sql
//    STABLE
//   AS $function$
//       SELECT EXISTS (
//           SELECT 1
//           FROM public.users_roles ur
//           JOIN public.roles r ON r.id = ur.role_id
//           JOIN public.role_permissions rp ON rp.role_id = r.id
//           JOIN public.permissions p ON p.id = rp.permission_id
//           WHERE ur.user_id = p_user_id
//             AND p.resource = p_resource
//             AND p.action = p_action
//             AND rp.allowed IS TRUE
//             AND r.is_active IS TRUE
//       );
//   $function$
//   

// --- INDEXES ---
// Table: audit_logs
//   CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action)
//   CREATE INDEX idx_audit_logs_org_id_created_at ON public.audit_logs USING btree (org_id, created_at)
//   CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id)
// Table: document_rows
//   CREATE INDEX ix_document_rows_org_doc ON public.document_rows USING btree (org_id, document_id)
//   CREATE INDEX ix_document_rows_org_doc_row ON public.document_rows USING btree (org_id, document_id, row_index)
// Table: documents
//   CREATE INDEX idx_documents_created_by_id ON public.documents USING btree (user_id)
//   CREATE INDEX idx_documents_is_archived ON public.documents USING btree (is_archived)
//   CREATE INDEX idx_documents_org_id ON public.documents USING btree (org_id)
//   CREATE INDEX ix_documents_org_filename_status ON public.documents USING btree (org_id, filename, status)
//   CREATE INDEX ix_documents_org_valuation_project ON public.documents USING btree (org_id, valuation_project_id) WHERE (valuation_project_id IS NOT NULL)
//   CREATE INDEX ix_documents_user_id ON public.documents USING btree (user_id)
//   CREATE INDEX ix_documents_valuation_project_id ON public.documents USING btree (valuation_project_id)
// Table: kb_documents
//   CREATE INDEX idx_kb_documents_document_id ON public.kb_documents USING btree (document_id)
//   CREATE INDEX idx_kb_documents_embedding ON public.kb_documents USING ivfflat (embedding vector_cosine_ops)
//   CREATE INDEX idx_kb_documents_kb_id ON public.kb_documents USING btree (kb_id)
// Table: knowledge_bases
//   CREATE INDEX idx_knowledge_bases_created_by_id ON public.knowledge_bases USING btree (created_by_id)
//   CREATE INDEX idx_knowledge_bases_is_active ON public.knowledge_bases USING btree (is_active)
//   CREATE INDEX idx_knowledge_bases_org_id ON public.knowledge_bases USING btree (org_id)
// Table: organizations
//   CREATE INDEX idx_organizations_is_active ON public.organizations USING btree (is_active)
//   CREATE INDEX idx_organizations_is_default ON public.organizations USING btree (is_default)
//   CREATE INDEX idx_organizations_slug ON public.organizations USING btree (slug)
//   CREATE UNIQUE INDEX organizations_slug_key ON public.organizations USING btree (slug)
// Table: password_reset_attempts
//   CREATE INDEX idx_password_reset_attempts_email ON public.password_reset_attempts USING btree (email)
//   CREATE INDEX idx_password_reset_attempts_email_org_attempted_at ON public.password_reset_attempts USING btree (email, org_id, attempted_at)
//   CREATE INDEX idx_password_reset_attempts_org_id ON public.password_reset_attempts USING btree (org_id)
// Table: password_reset_tokens
//   CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens USING btree (expires_at)
//   CREATE INDEX idx_password_reset_tokens_org_id ON public.password_reset_tokens USING btree (org_id)
//   CREATE INDEX idx_password_reset_tokens_user_id_is_used ON public.password_reset_tokens USING btree (user_id, is_used)
//   CREATE UNIQUE INDEX password_reset_tokens_token_hash_key ON public.password_reset_tokens USING btree (token_hash)
// Table: permissions
//   CREATE INDEX idx_permissions_action ON public.permissions USING btree (action)
//   CREATE INDEX idx_permissions_is_active ON public.permissions USING btree (is_active)
//   CREATE INDEX idx_permissions_resource ON public.permissions USING btree (resource)
//   CREATE UNIQUE INDEX permissions_resource_action_key ON public.permissions USING btree (resource, action)
// Table: role_permissions
//   CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions USING btree (permission_id)
//   CREATE INDEX idx_role_permissions_role_id ON public.role_permissions USING btree (role_id)
// Table: roles
//   CREATE INDEX idx_roles_is_active ON public.roles USING btree (is_active)
//   CREATE INDEX idx_roles_name ON public.roles USING btree (name)
//   CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name)
// Table: two_factor_auth
//   CREATE INDEX idx_two_factor_auth_org_id ON public.two_factor_auth USING btree (org_id)
//   CREATE INDEX idx_two_factor_auth_user_id ON public.two_factor_auth USING btree (user_id)
//   CREATE INDEX idx_two_factor_auth_user_org ON public.two_factor_auth USING btree (user_id, org_id)
//   CREATE UNIQUE INDEX two_factor_auth_user_id_key ON public.two_factor_auth USING btree (user_id)
// Table: users
//   CREATE INDEX idx_users_email ON public.users USING btree (email)
//   CREATE INDEX idx_users_is_active ON public.users USING btree (is_active)
//   CREATE INDEX idx_users_org_id ON public.users USING btree (org_id)
//   CREATE INDEX idx_users_org_id_email ON public.users USING btree (org_id, email)
//   CREATE UNIQUE INDEX users_org_id_email_key ON public.users USING btree (org_id, email)
// Table: users_roles
//   CREATE INDEX idx_users_roles_role_id ON public.users_roles USING btree (role_id)
//   CREATE INDEX idx_users_roles_user_id ON public.users_roles USING btree (user_id)
// Table: valuation_projects
//   CREATE INDEX idx_valuation_projects_org_id ON public.valuation_projects USING btree (org_id)
//   CREATE INDEX idx_valuation_projects_status ON public.valuation_projects USING btree (status)
//   CREATE INDEX idx_valuation_projects_user_id ON public.valuation_projects USING btree (user_id)

