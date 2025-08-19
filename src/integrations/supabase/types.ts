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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      collection_whitelist: {
        Row: {
          collection_id: string | null
          created_at: string
          id: string
          max_mint_count: number
          minted_count: number
          wallet_address: string
        }
        Insert: {
          collection_id?: string | null
          created_at?: string
          id?: string
          max_mint_count?: number
          minted_count?: number
          wallet_address: string
        }
        Update: {
          collection_id?: string | null
          created_at?: string
          id?: string
          max_mint_count?: number
          minted_count?: number
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_whitelist_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          candy_machine_id: string | null
          created_at: string
          creator_address: string
          description: string | null
          go_live_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_live: boolean
          items_available: number
          items_redeemed: number
          max_supply: number
          mint_price: number
          name: string
          royalty_percentage: number
          symbol: string
          treasury_wallet: string
          updated_at: string
          whitelist_enabled: boolean
        }
        Insert: {
          candy_machine_id?: string | null
          created_at?: string
          creator_address: string
          description?: string | null
          go_live_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_live?: boolean
          items_available?: number
          items_redeemed?: number
          max_supply?: number
          mint_price?: number
          name: string
          royalty_percentage?: number
          symbol: string
          treasury_wallet: string
          updated_at?: string
          whitelist_enabled?: boolean
        }
        Update: {
          candy_machine_id?: string | null
          created_at?: string
          creator_address?: string
          description?: string | null
          go_live_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_live?: boolean
          items_available?: number
          items_redeemed?: number
          max_supply?: number
          mint_price?: number
          name?: string
          royalty_percentage?: number
          symbol?: string
          treasury_wallet?: string
          updated_at?: string
          whitelist_enabled?: boolean
        }
        Relationships: []
      }
      marketplace_activities: {
        Row: {
          activity_type: string
          block_time: string | null
          collection_id: string | null
          created_at: string
          currency: string | null
          from_address: string | null
          id: string
          nft_id: string | null
          price: number | null
          to_address: string | null
          transaction_signature: string | null
        }
        Insert: {
          activity_type: string
          block_time?: string | null
          collection_id?: string | null
          created_at?: string
          currency?: string | null
          from_address?: string | null
          id?: string
          nft_id?: string | null
          price?: number | null
          to_address?: string | null
          transaction_signature?: string | null
        }
        Update: {
          activity_type?: string
          block_time?: string | null
          collection_id?: string | null
          created_at?: string
          currency?: string | null
          from_address?: string | null
          id?: string
          nft_id?: string | null
          price?: number | null
          to_address?: string | null
          transaction_signature?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_activities_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_activities_nft_id_fkey"
            columns: ["nft_id"]
            isOneToOne: false
            referencedRelation: "nfts"
            referencedColumns: ["id"]
          },
        ]
      }
      mint_job_items: {
        Row: {
          batch_number: number
          created_at: string
          error_message: string | null
          id: string
          max_retries: number
          mint_job_id: string
          nft_mint_address: string | null
          processed_at: string | null
          retry_count: number
          status: string
          transaction_signature: string | null
          updated_at: string
        }
        Insert: {
          batch_number: number
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number
          mint_job_id: string
          nft_mint_address?: string | null
          processed_at?: string | null
          retry_count?: number
          status?: string
          transaction_signature?: string | null
          updated_at?: string
        }
        Update: {
          batch_number?: number
          created_at?: string
          error_message?: string | null
          id?: string
          max_retries?: number
          mint_job_id?: string
          nft_mint_address?: string | null
          processed_at?: string | null
          retry_count?: number
          status?: string
          transaction_signature?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mint_job_items_mint_job_id_fkey"
            columns: ["mint_job_id"]
            isOneToOne: false
            referencedRelation: "mint_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      mint_jobs: {
        Row: {
          collection_id: string | null
          completed_at: string | null
          completed_quantity: number
          created_at: string
          error_message: string | null
          failed_quantity: number
          id: string
          started_at: string | null
          status: string
          total_cost: number
          total_quantity: number
          updated_at: string
          user_id: string | null
          wallet_address: string
        }
        Insert: {
          collection_id?: string | null
          completed_at?: string | null
          completed_quantity?: number
          created_at?: string
          error_message?: string | null
          failed_quantity?: number
          id?: string
          started_at?: string | null
          status?: string
          total_cost?: number
          total_quantity: number
          updated_at?: string
          user_id?: string | null
          wallet_address: string
        }
        Update: {
          collection_id?: string | null
          completed_at?: string | null
          completed_quantity?: number
          created_at?: string
          error_message?: string | null
          failed_quantity?: number
          id?: string
          started_at?: string | null
          status?: string
          total_cost?: number
          total_quantity?: number
          updated_at?: string
          user_id?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "mint_jobs_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      nfts: {
        Row: {
          attributes: Json | null
          auction_house_address: string | null
          collection_id: string | null
          created_at: string
          creator_address: string
          currency: string | null
          description: string | null
          id: string
          image_url: string | null
          is_listed: boolean
          listing_receipt: string | null
          metadata_uri: string | null
          mint_address: string
          name: string
          owner_address: string
          price: number | null
          symbol: string | null
          updated_at: string
        }
        Insert: {
          attributes?: Json | null
          auction_house_address?: string | null
          collection_id?: string | null
          created_at?: string
          creator_address: string
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_listed?: boolean
          listing_receipt?: string | null
          metadata_uri?: string | null
          mint_address: string
          name: string
          owner_address: string
          price?: number | null
          symbol?: string | null
          updated_at?: string
        }
        Update: {
          attributes?: Json | null
          auction_house_address?: string | null
          collection_id?: string | null
          created_at?: string
          creator_address?: string
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_listed?: boolean
          listing_receipt?: string | null
          metadata_uri?: string | null
          mint_address?: string
          name?: string
          owner_address?: string
          price?: number | null
          symbol?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nfts_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          banner_image_url: string | null
          bio: string | null
          created_at: string
          discord_handle: string | null
          display_name: string | null
          id: string
          profile_image_url: string | null
          twitter_handle: string | null
          updated_at: string
          verified: boolean
          wallet_address: string
          website_url: string | null
        }
        Insert: {
          banner_image_url?: string | null
          bio?: string | null
          created_at?: string
          discord_handle?: string | null
          display_name?: string | null
          id?: string
          profile_image_url?: string | null
          twitter_handle?: string | null
          updated_at?: string
          verified?: boolean
          wallet_address: string
          website_url?: string | null
        }
        Update: {
          banner_image_url?: string | null
          bio?: string | null
          created_at?: string
          discord_handle?: string | null
          display_name?: string | null
          id?: string
          profile_image_url?: string | null
          twitter_handle?: string | null
          updated_at?: string
          verified?: boolean
          wallet_address?: string
          website_url?: string | null
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
