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
      boosted_listings: {
        Row: {
          bid_amount: number
          bidder_wallet: string
          created_at: string
          end_time: string | null
          id: string
          is_active: boolean
          nft_id: string
          start_time: string
          token_mint: string
          tx_signature: string
          updated_at: string
        }
        Insert: {
          bid_amount: number
          bidder_wallet: string
          created_at?: string
          end_time?: string | null
          id?: string
          is_active?: boolean
          nft_id: string
          start_time?: string
          token_mint: string
          tx_signature: string
          updated_at?: string
        }
        Update: {
          bid_amount?: number
          bidder_wallet?: string
          created_at?: string
          end_time?: string | null
          id?: string
          is_active?: boolean
          nft_id?: string
          start_time?: string
          token_mint?: string
          tx_signature?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_boost_nft"
            columns: ["nft_id"]
            isOneToOne: false
            referencedRelation: "nfts"
            referencedColumns: ["id"]
          },
        ]
      }
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
          {
            foreignKeyName: "collection_whitelist_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections_public"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          attributes: Json
          banner_image_url: string | null
          candy_machine_id: string | null
          category: string | null
          collection_mint_address: string | null
          created_at: string
          creator_address: string
          description: string | null
          enable_primary_sales: boolean
          explicit_content: boolean | null
          external_links: Json | null
          go_live_date: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_live: boolean
          items_available: number | null
          items_redeemed: number
          locked_fields: Json
          max_supply: number | null
          mint_end_at: string | null
          mint_price: number
          name: string
          onchain_description: string | null
          royalty_percentage: number
          site_description: string | null
          slug: string | null
          supply_mode: string
          symbol: string | null
          treasury_wallet: string
          updated_at: string
          verified: boolean | null
          whitelist_enabled: boolean
        }
        Insert: {
          attributes?: Json
          banner_image_url?: string | null
          candy_machine_id?: string | null
          category?: string | null
          collection_mint_address?: string | null
          created_at?: string
          creator_address: string
          description?: string | null
          enable_primary_sales?: boolean
          explicit_content?: boolean | null
          external_links?: Json | null
          go_live_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_live?: boolean
          items_available?: number | null
          items_redeemed?: number
          locked_fields?: Json
          max_supply?: number | null
          mint_end_at?: string | null
          mint_price?: number
          name: string
          onchain_description?: string | null
          royalty_percentage?: number
          site_description?: string | null
          slug?: string | null
          supply_mode?: string
          symbol?: string | null
          treasury_wallet: string
          updated_at?: string
          verified?: boolean | null
          whitelist_enabled?: boolean
        }
        Update: {
          attributes?: Json
          banner_image_url?: string | null
          candy_machine_id?: string | null
          category?: string | null
          collection_mint_address?: string | null
          created_at?: string
          creator_address?: string
          description?: string | null
          enable_primary_sales?: boolean
          explicit_content?: boolean | null
          external_links?: Json | null
          go_live_date?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_live?: boolean
          items_available?: number | null
          items_redeemed?: number
          locked_fields?: Json
          max_supply?: number | null
          mint_end_at?: string | null
          mint_price?: number
          name?: string
          onchain_description?: string | null
          royalty_percentage?: number
          site_description?: string | null
          slug?: string | null
          supply_mode?: string
          symbol?: string | null
          treasury_wallet?: string
          updated_at?: string
          verified?: boolean | null
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
            foreignKeyName: "marketplace_activities_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections_public"
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
          metadata: Json | null
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
          metadata?: Json | null
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
          metadata?: Json | null
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
          {
            foreignKeyName: "mint_jobs_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections_public"
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
          featured_at: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          is_listed: boolean
          listing_receipt: string | null
          metadata_uri: string | null
          mint_address: string
          name: string
          owner_address: string
          price: number | null
          symbol: string | null
          updated_at: string
          views: number
        }
        Insert: {
          attributes?: Json | null
          auction_house_address?: string | null
          collection_id?: string | null
          created_at?: string
          creator_address: string
          currency?: string | null
          description?: string | null
          featured_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_listed?: boolean
          listing_receipt?: string | null
          metadata_uri?: string | null
          mint_address: string
          name: string
          owner_address: string
          price?: number | null
          symbol?: string | null
          updated_at?: string
          views?: number
        }
        Update: {
          attributes?: Json | null
          auction_house_address?: string | null
          collection_id?: string | null
          created_at?: string
          creator_address?: string
          currency?: string | null
          description?: string | null
          featured_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_listed?: boolean
          listing_receipt?: string | null
          metadata_uri?: string | null
          mint_address?: string
          name?: string
          owner_address?: string
          price?: number | null
          symbol?: string | null
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "nfts_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nfts_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          banner_image_url: string | null
          bio: string | null
          bio_unlock_status: boolean | null
          created_at: string
          current_pfp_nft_mint_address: string | null
          discord_handle: string | null
          display_name: string | null
          id: string
          nickname: string | null
          pfp_unlock_status: boolean | null
          profile_image_url: string | null
          profile_rank: string | null
          trade_count: number | null
          twitter_handle: string | null
          updated_at: string
          verified: boolean
          wallet_address: string
          website_url: string | null
        }
        Insert: {
          banner_image_url?: string | null
          bio?: string | null
          bio_unlock_status?: boolean | null
          created_at?: string
          current_pfp_nft_mint_address?: string | null
          discord_handle?: string | null
          display_name?: string | null
          id?: string
          nickname?: string | null
          pfp_unlock_status?: boolean | null
          profile_image_url?: string | null
          profile_rank?: string | null
          trade_count?: number | null
          twitter_handle?: string | null
          updated_at?: string
          verified?: boolean
          wallet_address: string
          website_url?: string | null
        }
        Update: {
          banner_image_url?: string | null
          bio?: string | null
          bio_unlock_status?: boolean | null
          created_at?: string
          current_pfp_nft_mint_address?: string | null
          discord_handle?: string | null
          display_name?: string | null
          id?: string
          nickname?: string | null
          pfp_unlock_status?: boolean | null
          profile_image_url?: string | null
          profile_rank?: string | null
          trade_count?: number | null
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
      boosted_leaderboard: {
        Row: {
          bid_amount: number | null
          bid_rank: number | null
          bidder_wallet: string | null
          end_time: string | null
          id: string | null
          is_active: boolean | null
          nft_id: string | null
          nft_image_url: string | null
          nft_name: string | null
          owner_address: string | null
          start_time: string | null
          tier: string | null
          token_mint: string | null
          tx_signature: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_boost_nft"
            columns: ["nft_id"]
            isOneToOne: false
            referencedRelation: "nfts"
            referencedColumns: ["id"]
          },
        ]
      }
      collections_public: {
        Row: {
          banner_image_url: string | null
          candy_machine_id: string | null
          category: string | null
          collection_mint_address: string | null
          created_at: string | null
          creator_address: string | null
          description: string | null
          explicit_content: boolean | null
          external_links: Json | null
          go_live_date: string | null
          id: string | null
          image_url: string | null
          is_active: boolean | null
          is_live: boolean | null
          items_available: number | null
          items_redeemed: number | null
          max_supply: number | null
          mint_price: number | null
          name: string | null
          onchain_description: string | null
          royalty_percentage: number | null
          site_description: string | null
          slug: string | null
          symbol: string | null
          treasury_wallet: string | null
          updated_at: string | null
          verified: boolean | null
          whitelist_enabled: boolean | null
        }
        Insert: {
          banner_image_url?: string | null
          candy_machine_id?: string | null
          category?: string | null
          collection_mint_address?: string | null
          created_at?: string | null
          creator_address?: never
          description?: string | null
          explicit_content?: boolean | null
          external_links?: Json | null
          go_live_date?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_live?: boolean | null
          items_available?: number | null
          items_redeemed?: number | null
          max_supply?: number | null
          mint_price?: number | null
          name?: string | null
          onchain_description?: string | null
          royalty_percentage?: number | null
          site_description?: string | null
          slug?: string | null
          symbol?: string | null
          treasury_wallet?: never
          updated_at?: string | null
          verified?: boolean | null
          whitelist_enabled?: boolean | null
        }
        Update: {
          banner_image_url?: string | null
          candy_machine_id?: string | null
          category?: string | null
          collection_mint_address?: string | null
          created_at?: string | null
          creator_address?: never
          description?: string | null
          explicit_content?: boolean | null
          external_links?: Json | null
          go_live_date?: string | null
          id?: string | null
          image_url?: string | null
          is_active?: boolean | null
          is_live?: boolean | null
          items_available?: number | null
          items_redeemed?: number | null
          max_supply?: number | null
          mint_price?: number | null
          name?: string | null
          onchain_description?: string | null
          royalty_percentage?: number | null
          site_description?: string | null
          slug?: string | null
          symbol?: string | null
          treasury_wallet?: never
          updated_at?: string | null
          verified?: boolean | null
          whitelist_enabled?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_profile_rank: {
        Args: { trade_count: number }
        Returns: string
      }
      generate_collection_slug: {
        Args: { collection_name: string }
        Returns: string
      }
      get_collection_details: {
        Args: { collection_id: string }
        Returns: {
          attributes: Json
          banner_image_url: string
          candy_machine_id: string
          category: string
          collection_mint_address: string
          created_at: string
          creator_address: string
          description: string
          enable_primary_sales: boolean
          explicit_content: boolean
          external_links: Json
          go_live_date: string
          id: string
          image_url: string
          is_active: boolean
          is_live: boolean
          items_available: number
          items_redeemed: number
          locked_fields: Json
          max_supply: number
          mint_end_at: string
          mint_price: number
          name: string
          onchain_description: string
          royalty_percentage: number
          site_description: string
          slug: string
          supply_mode: string
          symbol: string
          treasury_wallet: string
          updated_at: string
          verified: boolean
          whitelist_enabled: boolean
        }[]
      }
      increment_user_trade_count: {
        Args: { user_wallet_address: string }
        Returns: undefined
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
