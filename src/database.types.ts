export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      decks: {
        Row: {
          cover_card_id: number | null
          created_at: string
          format: string
          id: string
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_card_id?: number | null
          created_at?: string
          format: string
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          cover_card_id?: number | null
          created_at?: string
          format?: string
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      deck_entries: {
        Row: {
          card_id: number
          count: number
          deck_id: string
          id: string
          user_id: string
          zone: string
        }
        Insert: {
          card_id: number
          count: number
          deck_id: string
          id?: string
          user_id?: string
          zone: string
        }
        Update: {
          card_id?: number
          count?: number
          deck_id?: string
          id?: string
          user_id?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "deck_entries_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          }
        ]
      }
      tournaments: {
        Row: {
          created_at: string
          date: string
          format: string
          id: string
          location: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          format: string
          id?: string
          location?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          format?: string
          id?: string
          location?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_decks: {
        Row: {
          cover_card_id: number | null
          created_at: string
          format: string
          id: string
          name: string
          placement: string
          player_name: string | null
          source_url: string | null
          status: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          cover_card_id?: number | null
          created_at?: string
          format: string
          id?: string
          name: string
          placement: string
          player_name?: string | null
          source_url?: string | null
          status?: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          cover_card_id?: number | null
          created_at?: string
          format?: string
          id?: string
          name?: string
          placement?: string
          player_name?: string | null
          source_url?: string | null
          status?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_decks_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_deck_entries: {
        Row: {
          card_id: number
          count: number
          id: string
          tournament_deck_id: string
          zone: string
        }
        Insert: {
          card_id: number
          count: number
          id?: string
          tournament_deck_id: string
          zone: string
        }
        Update: {
          card_id?: number
          count?: number
          id?: string
          tournament_deck_id?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_deck_entries_tournament_deck_id_fkey"
            columns: ["tournament_deck_id"]
            isOneToOne: false
            referencedRelation: "tournament_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          added_at: string
          card_id: number
          count: number
          id: string
          obtained_at: string | null
          rarity: string
          user_id: string
        }
        Insert: {
          added_at?: string
          card_id: number
          count: number
          id?: string
          obtained_at?: string | null
          rarity: string
          user_id?: string
        }
        Update: {
          added_at?: string
          card_id?: number
          count?: number
          id?: string
          obtained_at?: string | null
          rarity?: string
          user_id?: string
        }
        Relationships: []
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
