// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5'
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
            foreignKeyName: 'audit_logs_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'audit_logs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
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
            foreignKeyName: 'clients_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'clients_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
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
            foreignKeyName: 'document_rows_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'document_rows_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      documento_conta_mapping: {
        Row: {
          created_at: string | null
          id: string
          id_conta: string
          id_documento: string
          ordem: number | null
          org_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_conta: string
          id_documento: string
          ordem?: number | null
          org_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          id_conta?: string
          id_documento?: string
          ordem?: number | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'documento_conta_mapping_id_conta_fkey'
            columns: ['id_conta']
            isOneToOne: false
            referencedRelation: 'plano_contas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documento_conta_mapping_id_documento_fkey'
            columns: ['id_documento']
            isOneToOne: false
            referencedRelation: 'tipos_documentos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documento_conta_mapping_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      documents: {
        Row: {
          client_id: string | null
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
          client_id?: string | null
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
          client_id?: string | null
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
            foreignKeyName: 'documents_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_created_by_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'documents_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fk_documents_valuation_project_id'
            columns: ['valuation_project_id']
            isOneToOne: false
            referencedRelation: 'valuation_projects'
            referencedColumns: ['id']
          },
        ]
      }
      embedded_reports: {
        Row: {
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          org_id: string
          params: Json | null
          report_type: string
          resource_id: number
          title: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          org_id: string
          params?: Json | null
          report_type: string
          resource_id: number
          title: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          org_id?: string
          params?: Json | null
          report_type?: string
          resource_id?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'embedded_reports_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'embedded_reports_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      extrato_lancamentos: {
        Row: {
          banco: string | null
          client_id: string
          conta_bancaria: string | null
          conta_id: string | null
          created_at: string
          data: string
          descricao_normalizada: string
          descricao_original: string
          documento_ref: string | null
          fitid: string | null
          fora_do_padrao: boolean
          hash_dedup: string
          id: string
          metadata: Json | null
          org_id: string
          score_sugestao: number | null
          status: string
          sugestoes: Json | null
          tipo_arquivo: string
          tipo_movimento: string
          updated_at: string
          valor: number
        }
        Insert: {
          banco?: string | null
          client_id: string
          conta_bancaria?: string | null
          conta_id?: string | null
          created_at?: string
          data: string
          descricao_normalizada: string
          descricao_original: string
          documento_ref?: string | null
          fitid?: string | null
          fora_do_padrao?: boolean
          hash_dedup: string
          id?: string
          metadata?: Json | null
          org_id: string
          score_sugestao?: number | null
          status?: string
          sugestoes?: Json | null
          tipo_arquivo?: string
          tipo_movimento: string
          updated_at?: string
          valor: number
        }
        Update: {
          banco?: string | null
          client_id?: string
          conta_bancaria?: string | null
          conta_id?: string | null
          created_at?: string
          data?: string
          descricao_normalizada?: string
          descricao_original?: string
          documento_ref?: string | null
          fitid?: string | null
          fora_do_padrao?: boolean
          hash_dedup?: string
          id?: string
          metadata?: Json | null
          org_id?: string
          score_sugestao?: number | null
          status?: string
          sugestoes?: Json | null
          tipo_arquivo?: string
          tipo_movimento?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: 'extrato_lancamentos_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'extrato_lancamentos_conta_id_fkey'
            columns: ['conta_id']
            isOneToOne: false
            referencedRelation: 'plano_contas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'extrato_lancamentos_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      financial_balancete: {
        Row: {
          account_code: string | null
          account_description: string | null
          classification_code: string | null
          client_id: string | null
          conta_id: string | null
          created_at: string | null
          credit: number | null
          current_balance: number | null
          debit: number | null
          document_id: string
          id: string
          ordem: number | null
          org_id: string
          previous_balance: number | null
        }
        Insert: {
          account_code?: string | null
          account_description?: string | null
          classification_code?: string | null
          client_id?: string | null
          conta_id?: string | null
          created_at?: string | null
          credit?: number | null
          current_balance?: number | null
          debit?: number | null
          document_id: string
          id?: string
          ordem?: number | null
          org_id: string
          previous_balance?: number | null
        }
        Update: {
          account_code?: string | null
          account_description?: string | null
          classification_code?: string | null
          client_id?: string | null
          conta_id?: string | null
          created_at?: string | null
          credit?: number | null
          current_balance?: number | null
          debit?: number | null
          document_id?: string
          id?: string
          ordem?: number | null
          org_id?: string
          previous_balance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'financial_balancete_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_balancete_conta_id_fkey'
            columns: ['conta_id']
            isOneToOne: false
            referencedRelation: 'plano_contas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_balancete_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_balancete_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      financial_balanco_patrimonial: {
        Row: {
          account_code: string | null
          classification_code: string | null
          client_id: string | null
          conta_id: string | null
          created_at: string | null
          description: string | null
          document_id: string
          id: string
          nature_year_n: string | null
          nature_year_n_minus_1: string | null
          ordem: number | null
          org_id: string
          value_year_n: number | null
          value_year_n_minus_1: number | null
          year_n: number | null
          year_n_minus_1: number | null
        }
        Insert: {
          account_code?: string | null
          classification_code?: string | null
          client_id?: string | null
          conta_id?: string | null
          created_at?: string | null
          description?: string | null
          document_id: string
          id?: string
          nature_year_n?: string | null
          nature_year_n_minus_1?: string | null
          ordem?: number | null
          org_id: string
          value_year_n?: number | null
          value_year_n_minus_1?: number | null
          year_n?: number | null
          year_n_minus_1?: number | null
        }
        Update: {
          account_code?: string | null
          classification_code?: string | null
          client_id?: string | null
          conta_id?: string | null
          created_at?: string | null
          description?: string | null
          document_id?: string
          id?: string
          nature_year_n?: string | null
          nature_year_n_minus_1?: string | null
          ordem?: number | null
          org_id?: string
          value_year_n?: number | null
          value_year_n_minus_1?: number | null
          year_n?: number | null
          year_n_minus_1?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'financial_balanco_patrimonial_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_balanco_patrimonial_conta_id_fkey'
            columns: ['conta_id']
            isOneToOne: false
            referencedRelation: 'plano_contas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_balanco_patrimonial_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_balanco_patrimonial_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      financial_data: {
        Row: {
          account_name: string | null
          client_id: string | null
          conta_id: string | null
          created_at: string | null
          document_id: string
          id: string
          ordem: number | null
          org_id: string
          period: string | null
          row_number: number | null
          value: number | null
        }
        Insert: {
          account_name?: string | null
          client_id?: string | null
          conta_id?: string | null
          created_at?: string | null
          document_id: string
          id?: string
          ordem?: number | null
          org_id: string
          period?: string | null
          row_number?: number | null
          value?: number | null
        }
        Update: {
          account_name?: string | null
          client_id?: string | null
          conta_id?: string | null
          created_at?: string | null
          document_id?: string
          id?: string
          ordem?: number | null
          org_id?: string
          period?: string | null
          row_number?: number | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'financial_data_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_data_conta_id_fkey'
            columns: ['conta_id']
            isOneToOne: false
            referencedRelation: 'plano_contas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_data_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'financial_documents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_data_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      financial_documents: {
        Row: {
          client_id: string | null
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
          client_id?: string | null
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
          client_id?: string | null
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
            foreignKeyName: 'financial_documents_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_documents_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_documents_valuation_id_fkey'
            columns: ['valuation_id']
            isOneToOne: false
            referencedRelation: 'valuations'
            referencedColumns: ['id']
          },
        ]
      }
      financial_dre: {
        Row: {
          balance: number | null
          client_id: string | null
          conta_id: string | null
          created_at: string | null
          description: string | null
          document_id: string
          id: string
          ordem: number | null
          org_id: string
          sum: number | null
          total: number | null
        }
        Insert: {
          balance?: number | null
          client_id?: string | null
          conta_id?: string | null
          created_at?: string | null
          description?: string | null
          document_id: string
          id?: string
          ordem?: number | null
          org_id: string
          sum?: number | null
          total?: number | null
        }
        Update: {
          balance?: number | null
          client_id?: string | null
          conta_id?: string | null
          created_at?: string | null
          description?: string | null
          document_id?: string
          id?: string
          ordem?: number | null
          org_id?: string
          sum?: number | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'financial_dre_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_dre_conta_id_fkey'
            columns: ['conta_id']
            isOneToOne: false
            referencedRelation: 'plano_contas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_dre_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_dre_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      financial_fluxo_caixa: {
        Row: {
          client_id: string | null
          conta_id: string | null
          created_at: string | null
          description: string | null
          document_id: string
          id: string
          ordem: number | null
          org_id: string
          period: string | null
          planned_value: number | null
          realized_value: number | null
          value: number | null
        }
        Insert: {
          client_id?: string | null
          conta_id?: string | null
          created_at?: string | null
          description?: string | null
          document_id: string
          id?: string
          ordem?: number | null
          org_id: string
          period?: string | null
          planned_value?: number | null
          realized_value?: number | null
          value?: number | null
        }
        Update: {
          client_id?: string | null
          conta_id?: string | null
          created_at?: string | null
          description?: string | null
          document_id?: string
          id?: string
          ordem?: number | null
          org_id?: string
          period?: string | null
          planned_value?: number | null
          realized_value?: number | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'financial_fluxo_caixa_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_fluxo_caixa_conta_id_fkey'
            columns: ['conta_id']
            isOneToOne: false
            referencedRelation: 'plano_contas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_fluxo_caixa_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'financial_fluxo_caixa_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
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
          org_id: string | null
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
          org_id?: string | null
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
          org_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'kb_documents_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'kb_documents_kb_id_fkey'
            columns: ['kb_id']
            isOneToOne: false
            referencedRelation: 'knowledge_bases'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'kb_documents_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
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
            foreignKeyName: 'knowledge_bases_created_by_id_fkey'
            columns: ['created_by_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'knowledge_bases_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
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
            foreignKeyName: 'password_reset_tokens_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'password_reset_tokens_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
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
      plano_contas: {
        Row: {
          ativo: boolean | null
          client_id: string | null
          codigo: string | null
          created_at: string | null
          data_cadastro: string | null
          descricao: string | null
          grupo: string | null
          id: string
          natureza: string | null
          nome_conta: string
          ordem: number | null
          org_id: string
          tipo: string | null
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          client_id?: string | null
          codigo?: string | null
          created_at?: string | null
          data_cadastro?: string | null
          descricao?: string | null
          grupo?: string | null
          id?: string
          natureza?: string | null
          nome_conta?: string
          ordem?: number | null
          org_id: string
          tipo?: string | null
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          client_id?: string | null
          codigo?: string | null
          created_at?: string | null
          data_cadastro?: string | null
          descricao?: string | null
          grupo?: string | null
          id?: string
          natureza?: string | null
          nome_conta?: string
          ordem?: number | null
          org_id?: string
          tipo?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'plano_contas_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'plano_contas_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      plano_contas_mapping: {
        Row: {
          confianca: number
          contador_uso: number
          created_at: string
          id: string
          id_conta: string
          org_id: string
          origem: string
          texto_normalizado: string
          texto_original: string
          updated_at: string
        }
        Insert: {
          confianca?: number
          contador_uso?: number
          created_at?: string
          id?: string
          id_conta: string
          org_id: string
          origem?: string
          texto_normalizado: string
          texto_original: string
          updated_at?: string
        }
        Update: {
          confianca?: number
          contador_uso?: number
          created_at?: string
          id?: string
          id_conta?: string
          org_id?: string
          origem?: string
          texto_normalizado?: string
          texto_original?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'plano_contas_mapping_id_conta_fkey'
            columns: ['id_conta']
            isOneToOne: false
            referencedRelation: 'plano_contas'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'plano_contas_mapping_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      plano_contas_taxonomia: {
        Row: {
          ativo: boolean | null
          categoria: string
          created_at: string | null
          descricao: string
          id: string
          org_id: string
        }
        Insert: {
          ativo?: boolean | null
          categoria: string
          created_at?: string | null
          descricao: string
          id?: string
          org_id: string
        }
        Update: {
          ativo?: boolean | null
          categoria?: string
          created_at?: string | null
          descricao?: string
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'plano_contas_taxonomia_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      processamento_pdf: {
        Row: {
          created_at: string | null
          dados_extraidos: Json | null
          id: string
          mensagem_erro: string | null
          org_id: string | null
          sharepoint_file_name: string
          sharepoint_folder_path: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dados_extraidos?: Json | null
          id?: string
          mensagem_erro?: string | null
          org_id?: string | null
          sharepoint_file_name: string
          sharepoint_folder_path?: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dados_extraidos?: Json | null
          id?: string
          mensagem_erro?: string | null
          org_id?: string | null
          sharepoint_file_name?: string
          sharepoint_folder_path?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'processamento_pdf_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
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
            foreignKeyName: 'role_permissions_permission_id_fkey'
            columns: ['permission_id']
            isOneToOne: false
            referencedRelation: 'permissions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'role_permissions_role_id_fkey'
            columns: ['role_id']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['id']
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
      tipos_documentos: {
        Row: {
          ativo: boolean | null
          created_at: string | null
          descricao: string
          id: string
          org_id: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          ativo?: boolean | null
          created_at?: string | null
          descricao: string
          id?: string
          org_id: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          ativo?: boolean | null
          created_at?: string | null
          descricao?: string
          id?: string
          org_id?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'tipos_documentos_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
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
            foreignKeyName: 'two_factor_auth_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'two_factor_auth_user_id_fkey'
            columns: ['user_id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
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
          avatar_url?: string | null
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
          avatar_url?: string | null
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
            foreignKeyName: 'users_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
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
            foreignKeyName: 'users_roles_role_id_fkey'
            columns: ['role_id']
            isOneToOne: false
            referencedRelation: 'roles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'users_roles_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
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
            foreignKeyName: 'valuation_projects_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'valuation_projects_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
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
            foreignKeyName: 'valuations_client_id_fkey'
            columns: ['client_id']
            isOneToOne: false
            referencedRelation: 'clients'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'valuations_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
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
            foreignKeyName: 'document_rows_document_id_fkey'
            columns: ['document_id']
            isOneToOne: false
            referencedRelation: 'documents'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'document_rows_org_id_fkey'
            columns: ['org_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
