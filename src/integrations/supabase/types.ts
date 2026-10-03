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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          severity: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          reference_id?: string | null
          severity?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          severity?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          category: string
          created_at: string
          id: string
          limit_cents: number
          month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          limit_cents: number
          month: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          limit_cents?: number
          month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      challenge_progress: {
        Row: {
          completed: boolean
          completed_on: string | null
          created_at: string
          day_number: number
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_on?: string | null
          created_at?: string
          day_number: number
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          completed?: boolean
          completed_on?: string | null
          created_at?: string
          day_number?: number
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      debt_diagnostics: {
        Row: {
          can_pay_essentials: boolean
          created_at: string
          debt_id: string | null
          has_offer: boolean
          has_savings: boolean
          high_interest: string
          id: string
          is_overdue: boolean
          strains_budget: boolean
          suggested_strategy: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_pay_essentials: boolean
          created_at?: string
          debt_id?: string | null
          has_offer: boolean
          has_savings: boolean
          high_interest: string
          id?: string
          is_overdue: boolean
          strains_budget: boolean
          suggested_strategy: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          can_pay_essentials?: boolean
          created_at?: string
          debt_id?: string | null
          has_offer?: boolean
          has_savings?: boolean
          high_interest?: string
          id?: string
          is_overdue?: boolean
          strains_budget?: boolean
          suggested_strategy?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_diagnostics_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debt_payments: {
        Row: {
          amount_cents: number
          created_at: string
          debt_id: string
          id: string
          notes: string | null
          paid_on: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          debt_id: string
          id?: string
          notes?: string | null
          paid_on?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          debt_id?: string
          id?: string
          notes?: string | null
          paid_on?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debt_payments_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
      debts: {
        Row: {
          created_at: string
          creditor: string
          debt_type: string
          id: string
          installment_amount_cents: number
          monthly_interest_rate: number
          name: string
          next_due_date: string | null
          notes: string | null
          original_amount_cents: number
          paid_amount_cents: number
          paid_installments: number
          paid_off_at: string | null
          status: string
          total_installments: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          creditor?: string
          debt_type: string
          id?: string
          installment_amount_cents?: number
          monthly_interest_rate?: number
          name: string
          next_due_date?: string | null
          notes?: string | null
          original_amount_cents: number
          paid_amount_cents?: number
          paid_installments?: number
          paid_off_at?: string | null
          status?: string
          total_installments?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          creditor?: string
          debt_type?: string
          id?: string
          installment_amount_cents?: number
          monthly_interest_rate?: number
          name?: string
          next_due_date?: string | null
          notes?: string | null
          original_amount_cents?: number
          paid_amount_cents?: number
          paid_installments?: number
          paid_off_at?: string | null
          status?: string
          total_installments?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount_cents: number
          category: string
          created_at: string
          description: string
          id: string
          notes: string | null
          occurred_on: string
          payment_method: string | null
          recurring_transaction_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          category: string
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          occurred_on?: string
          payment_method?: string | null
          recurring_transaction_id?: string | null
          type: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount_cents?: number
          category?: string
          created_at?: string
          description?: string
          id?: string
          notes?: string | null
          occurred_on?: string
          payment_method?: string | null
          recurring_transaction_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_recurring_fkey"
            columns: ["recurring_transaction_id"]
            isOneToOne: false
            referencedRelation: "recurring_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      piggy_banks: {
        Row: {
          category: string
          created_at: string
          current_amount_cents: number
          icon: string
          id: string
          name: string
          objective: string
          status: string
          target_amount_cents: number
          target_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          current_amount_cents?: number
          icon?: string
          id?: string
          name: string
          objective?: string
          status?: string
          target_amount_cents: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          category?: string
          created_at?: string
          current_amount_cents?: number
          icon?: string
          id?: string
          name?: string
          objective?: string
          status?: string
          target_amount_cents?: number
          target_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      piggy_movements: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          movement_type: string
          notes: string | null
          occurred_on: string
          piggy_bank_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          movement_type: string
          notes?: string | null
          occurred_on?: string
          piggy_bank_id: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          movement_type?: string
          notes?: string | null
          occurred_on?: string
          piggy_bank_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "piggy_movements_piggy_bank_id_fkey"
            columns: ["piggy_bank_id"]
            isOneToOne: false
            referencedRelation: "piggy_banks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          amount_cents: number
          category: string
          created_at: string
          description: string
          end_date: string | null
          frequency: string
          id: string
          is_active: boolean
          next_occurrence: string
          payment_method: string | null
          start_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          category: string
          created_at?: string
          description: string
          end_date?: string | null
          frequency: string
          id?: string
          is_active?: boolean
          next_occurrence: string
          payment_method?: string | null
          start_date: string
          type: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          amount_cents?: number
          category?: string
          created_at?: string
          description?: string
          end_date?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          next_occurrence?: string
          payment_method?: string | null
          start_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      renegotiation_proposals: {
        Row: {
          created_at: string
          debt_id: string
          discount_cents: number
          down_payment_cents: number
          id: string
          installment_amount_cents: number
          installment_count: number
          interest_rate: number
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          debt_id: string
          discount_cents?: number
          down_payment_cents?: number
          id?: string
          installment_amount_cents: number
          installment_count: number
          interest_rate?: number
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          debt_id?: string
          discount_cents?: number
          down_payment_cents?: number
          id?: string
          installment_amount_cents?: number
          installment_count?: number
          interest_rate?: number
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "renegotiation_proposals_debt_id_fkey"
            columns: ["debt_id"]
            isOneToOne: false
            referencedRelation: "debts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
