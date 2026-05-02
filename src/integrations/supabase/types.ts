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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          created_at: string
          date: string
          id: string
          time: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          time?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          time?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          automation_id: string
          contact_id: string
          created_at: string
          current_step: number
          id: string
          last_error: string | null
          next_run_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          automation_id: string
          contact_id: string
          created_at?: string
          current_step?: number
          id?: string
          last_error?: string | null
          next_run_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          automation_id?: string
          contact_id?: string
          created_at?: string
          current_step?: number
          id?: string
          last_error?: string | null
          next_run_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_steps: {
        Row: {
          action_config: Json
          action_type: string
          automation_id: string
          created_at: string
          delay_minutes: number
          id: string
          step_order: number
        }
        Insert: {
          action_config?: Json
          action_type: string
          automation_id: string
          created_at?: string
          delay_minutes?: number
          id?: string
          step_order: number
        }
        Update: {
          action_config?: Json
          action_type?: string
          automation_id?: string
          created_at?: string
          delay_minutes?: number
          id?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "automation_steps_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          trigger_config: Json
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string
          document_links: Json | null
          email: string | null
          id: string
          interest: string | null
          is_lead: boolean | null
          name: string
          next_contact_date: string | null
          notes: string | null
          optin_email: boolean
          optin_whatsapp: boolean
          origin: string | null
          phone: string | null
          potential_value: number | null
          stage: string | null
          status: string
          tag: string | null
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_links?: Json | null
          email?: string | null
          id?: string
          interest?: string | null
          is_lead?: boolean | null
          name: string
          next_contact_date?: string | null
          notes?: string | null
          optin_email?: boolean
          optin_whatsapp?: boolean
          origin?: string | null
          phone?: string | null
          potential_value?: number | null
          stage?: string | null
          status?: string
          tag?: string | null
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_links?: Json | null
          email?: string | null
          id?: string
          interest?: string | null
          is_lead?: boolean | null
          name?: string
          next_contact_date?: string | null
          notes?: string | null
          optin_email?: boolean
          optin_whatsapp?: boolean
          origin?: string | null
          phone?: string | null
          potential_value?: number | null
          stage?: string | null
          status?: string
          tag?: string | null
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_field_values: {
        Row: {
          contact_id: string
          created_at: string
          custom_field_id: string
          id: string
          value: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          custom_field_id: string
          id?: string
          value?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          custom_field_id?: string
          id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_custom_field_id_fkey"
            columns: ["custom_field_id"]
            isOneToOne: false
            referencedRelation: "custom_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_fields: {
        Row: {
          created_at: string
          field_type: string
          id: string
          name: string
          options: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          field_type?: string
          id?: string
          name: string
          options?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          field_type?: string
          id?: string
          name?: string
          options?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          id: string
          month: string
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          target_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interactions: {
        Row: {
          contact_id: string
          created_at: string
          date: string
          id: string
          note: string | null
          type: string
          user_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          type: string
          user_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      message_logs: {
        Row: {
          automation_id: string | null
          channel: string
          contact_id: string | null
          content: string | null
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipient: string
          sent_at: string | null
          status: string
          subject: string | null
          user_id: string
        }
        Insert: {
          automation_id?: string | null
          channel: string
          contact_id?: string | null
          content?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          user_id: string
        }
        Update: {
          automation_id?: string | null
          channel?: string
          contact_id?: string | null
          content?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          name: string
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          id: string
          name: string
          price: number
          recurrence: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price?: number
          recurrence?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price?: number
          recurrence?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          contact_id: string | null
          created_at: string
          done: boolean | null
          due_date: string | null
          id: string
          title: string
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          done?: boolean | null
          due_date?: string | null
          id?: string
          title: string
          user_id: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          done?: boolean | null
          due_date?: string | null
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          category: string
          contact_id: string | null
          created_at: string
          date: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          contact_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          contact_id?: string | null
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
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
