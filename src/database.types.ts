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
