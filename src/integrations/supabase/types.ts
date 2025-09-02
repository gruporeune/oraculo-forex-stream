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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_earnings_history: {
        Row: {
          created_at: string
          date: string
          id: string
          operations_count: number
          plan_earnings: Json | null
          total_commissions: number
          total_earnings: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          operations_count?: number
          plan_earnings?: Json | null
          total_commissions?: number
          total_earnings?: number
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          operations_count?: number
          plan_earnings?: Json | null
          total_commissions?: number
          total_earnings?: number
          user_id?: string
        }
        Relationships: []
      }
      manual_pix_payments: {
        Row: {
          amount_brl: number
          created_at: string
          email: string
          id: string
          plan_name: string
          proof_image_path: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_brl: number
          created_at?: string
          email: string
          id?: string
          plan_name: string
          proof_image_path?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_brl?: number
          created_at?: string
          email?: string
          id?: string
          plan_name?: string
          proof_image_path?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      material_suggestions: {
        Row: {
          created_at: string
          id: string
          suggestion: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          suggestion: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          suggestion?: string
          user_id?: string
        }
        Relationships: []
      }
      materials: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          file_type: string
          file_url: string
          id: string
          is_active: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_type: string
          file_url: string
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_type?: string
          file_url?: string
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          external_id: string
          id: string
          paid_at: string | null
          payment_provider: string | null
          plan_name: string
          qr_code: string | null
          qr_code_text: string | null
          status: string
          transaction_data: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          external_id: string
          id?: string
          paid_at?: string | null
          payment_provider?: string | null
          plan_name: string
          qr_code?: string | null
          qr_code_text?: string | null
          status?: string
          transaction_data?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          external_id?: string
          id?: string
          paid_at?: string | null
          payment_provider?: string | null
          plan_name?: string
          qr_code?: string | null
          qr_code_text?: string | null
          status?: string
          transaction_data?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auto_operations_completed_today: number | null
          auto_operations_paused: boolean | null
          auto_operations_started: boolean | null
          available_balance: number | null
          avatar_url: string | null
          broker_id: string | null
          cycle_start_time: string | null
          daily_commissions: number | null
          daily_earnings: number | null
          daily_referral_commissions: number | null
          daily_signals_used: number | null
          full_name: string | null
          id: string
          last_reset_date: string | null
          phone: string | null
          plan: string | null
          referral_code: string | null
          referred_by: string | null
          total_referral_commissions: number | null
          updated_at: string
          username: string | null
          welcome_sent: boolean | null
        }
        Insert: {
          auto_operations_completed_today?: number | null
          auto_operations_paused?: boolean | null
          auto_operations_started?: boolean | null
          available_balance?: number | null
          avatar_url?: string | null
          broker_id?: string | null
          cycle_start_time?: string | null
          daily_commissions?: number | null
          daily_earnings?: number | null
          daily_referral_commissions?: number | null
          daily_signals_used?: number | null
          full_name?: string | null
          id: string
          last_reset_date?: string | null
          phone?: string | null
          plan?: string | null
          referral_code?: string | null
          referred_by?: string | null
          total_referral_commissions?: number | null
          updated_at?: string
          username?: string | null
          welcome_sent?: boolean | null
        }
        Update: {
          auto_operations_completed_today?: number | null
          auto_operations_paused?: boolean | null
          auto_operations_started?: boolean | null
          available_balance?: number | null
          avatar_url?: string | null
          broker_id?: string | null
          cycle_start_time?: string | null
          daily_commissions?: number | null
          daily_earnings?: number | null
          daily_referral_commissions?: number | null
          daily_signals_used?: number | null
          full_name?: string | null
          id?: string
          last_reset_date?: string | null
          phone?: string | null
          plan?: string | null
          referral_code?: string | null
          referred_by?: string | null
          total_referral_commissions?: number | null
          updated_at?: string
          username?: string | null
          welcome_sent?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "users_with_creation_date"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_commissions: {
        Row: {
          commission_amount: number
          commission_level: number
          created_at: string | null
          id: string
          plan_name: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          commission_amount?: number
          commission_level: number
          created_at?: string | null
          id?: string
          plan_name: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          commission_amount?: number
          commission_level?: number
          created_at?: string | null
          id?: string
          plan_name?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "users_with_creation_date"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users_with_creation_date"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          analysis: string | null
          asset_pair: string
          confidence_percentage: number
          created_at: string | null
          entry_time: string
          expiration_time: number
          id: string
          is_automatic: boolean | null
          profit: number | null
          signal_type: string
          status: string | null
          user_id: string
        }
        Insert: {
          analysis?: string | null
          asset_pair: string
          confidence_percentage: number
          created_at?: string | null
          entry_time: string
          expiration_time: number
          id?: string
          is_automatic?: boolean | null
          profit?: number | null
          signal_type: string
          status?: string | null
          user_id: string
        }
        Update: {
          analysis?: string | null
          asset_pair?: string
          confidence_percentage?: number
          created_at?: string | null
          entry_time?: string
          expiration_time?: number
          id?: string
          is_automatic?: boolean | null
          profit?: number | null
          signal_type?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_with_creation_date"
            referencedColumns: ["id"]
          },
        ]
      }
      usdt_payments: {
        Row: {
          admin_notes: string | null
          amount_usd: number
          created_at: string
          id: string
          plan_name: string
          processed_at: string | null
          processed_by: string | null
          proof_image_path: string | null
          status: string
          transaction_hash: string
          updated_at: string
          user_id: string
          user_wallet: string | null
          wallet_address: string
        }
        Insert: {
          admin_notes?: string | null
          amount_usd?: number
          created_at?: string
          id?: string
          plan_name?: string
          processed_at?: string | null
          processed_by?: string | null
          proof_image_path?: string | null
          status?: string
          transaction_hash: string
          updated_at?: string
          user_id: string
          user_wallet?: string | null
          wallet_address?: string
        }
        Update: {
          admin_notes?: string | null
          amount_usd?: number
          created_at?: string
          id?: string
          plan_name?: string
          processed_at?: string | null
          processed_by?: string | null
          proof_image_path?: string | null
          status?: string
          transaction_hash?: string
          updated_at?: string
          user_id?: string
          user_wallet?: string | null
          wallet_address?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          auto_operations_completed_today: number
          auto_operations_paused: boolean
          auto_operations_started: boolean
          created_at: string
          cycle_start_time: string | null
          daily_earnings: number
          daily_signals_used: number
          id: string
          is_active: boolean
          last_reset_date: string
          plan_name: string
          purchase_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_operations_completed_today?: number
          auto_operations_paused?: boolean
          auto_operations_started?: boolean
          created_at?: string
          cycle_start_time?: string | null
          daily_earnings?: number
          daily_signals_used?: number
          id?: string
          is_active?: boolean
          last_reset_date?: string
          plan_name: string
          purchase_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_operations_completed_today?: number
          auto_operations_paused?: boolean
          auto_operations_started?: boolean
          created_at?: string
          cycle_start_time?: string | null
          daily_earnings?: number
          daily_signals_used?: number
          id?: string
          is_active?: boolean
          last_reset_date?: string
          plan_name?: string
          purchase_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_referrals: {
        Row: {
          commission_earned: number | null
          created_at: string | null
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          commission_earned?: number | null
          created_at?: string | null
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          commission_earned?: number | null
          created_at?: string | null
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "users_with_creation_date"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users_with_creation_date"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          full_name: string | null
          id: string
          pix_key: string | null
          pix_key_type: string | null
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          secretpay_transfer_id: string | null
          status: string
          transfer_data: Json | null
          usdt_wallet: string | null
          user_id: string
          withdrawal_type: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          full_name?: string | null
          id?: string
          pix_key?: string | null
          pix_key_type?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          secretpay_transfer_id?: string | null
          status?: string
          transfer_data?: Json | null
          usdt_wallet?: string | null
          user_id: string
          withdrawal_type?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          full_name?: string | null
          id?: string
          pix_key?: string | null
          pix_key_type?: string | null
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          secretpay_transfer_id?: string | null
          status?: string
          transfer_data?: Json | null
          usdt_wallet?: string | null
          user_id?: string
          withdrawal_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      users_with_creation_date: {
        Row: {
          auto_operations_completed_today: number | null
          auto_operations_paused: boolean | null
          auto_operations_started: boolean | null
          available_balance: number | null
          avatar_url: string | null
          broker_id: string | null
          created_at: string | null
          cycle_start_time: string | null
          daily_commissions: number | null
          daily_earnings: number | null
          daily_referral_commissions: number | null
          daily_signals_used: number | null
          full_name: string | null
          id: string | null
          last_reset_date: string | null
          phone: string | null
          plan: string | null
          referral_code: string | null
          referred_by: string | null
          total_referral_commissions: number | null
          updated_at: string | null
          username: string | null
          welcome_sent: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "users_with_creation_date"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_plan_commission: {
        Args: { plan_name: string }
        Returns: number
      }
      calculate_plan_commission_level: {
        Args: { level: number; plan_name: string }
        Returns: number
      }
      get_user_creation_date: {
        Args: { user_uuid: string }
        Returns: string
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      make_user_admin: {
        Args: { target_email: string }
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
