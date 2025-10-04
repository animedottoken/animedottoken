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
      anime_stakes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_reward_claim: string | null
          staked_amount: number
          staked_at: string
          unlock_at: string | null
          updated_at: string
          user_id: string
          wallet_address: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_reward_claim?: string | null
          staked_amount?: number
          staked_at?: string
          unlock_at?: string | null
          updated_at?: string
          user_id: string
          wallet_address: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_reward_claim?: string | null
          staked_amount?: number
          staked_at?: string
          unlock_at?: string | null
          updated_at?: string
          user_id?: string
          wallet_address?: string
        }
        Relationships: []
      }
      anime_staking_rewards: {
        Row: {
          claimed_at: string | null
          created_at: string
          id: string
          reward_amount: number
          reward_period_end: string
          reward_period_start: string
          reward_type: Database["public"]["Enums"]["anime_reward_type"]
          stake_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          id?: string
          reward_amount?: number
          reward_period_end: string
          reward_period_start: string
          reward_type: Database["public"]["Enums"]["anime_reward_type"]
          stake_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          id?: string
          reward_amount?: number
          reward_period_end?: string
          reward_period_start?: string
          reward_type?: Database["public"]["Enums"]["anime_reward_type"]
          stake_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anime_staking_rewards_stake_id_fkey"
            columns: ["stake_id"]
            isOneToOne: false
            referencedRelation: "anime_stakes"
            referencedColumns: ["id"]
          },
        ]
      }
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
      collection_likes: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_likes_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
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
          creator_user_id: string | null
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
          network: string | null
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
          creator_user_id?: string | null
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
          network?: string | null
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
          creator_user_id?: string | null
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
          network?: string | null
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
      creator_follows: {
        Row: {
          created_at: string
          creator_user_id: string
          follower_user_id: string
          id: string
        }
        Insert: {
          created_at?: string
          creator_user_id: string
          follower_user_id: string
          id?: string
        }
        Update: {
          created_at?: string
          creator_user_id?: string
          follower_user_id?: string
          id?: string
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
      marketplace_settings: {
        Row: {
          allowlist_only: boolean | null
          created_at: string
          id: string
          is_paused: boolean | null
          pause_message: string | null
          platform_fee_percentage: number
          platform_wallet_address: string
          updated_at: string
        }
        Insert: {
          allowlist_only?: boolean | null
          created_at?: string
          id?: string
          is_paused?: boolean | null
          pause_message?: string | null
          platform_fee_percentage?: number
          platform_wallet_address?: string
          updated_at?: string
        }
        Update: {
          allowlist_only?: boolean | null
          created_at?: string
          id?: string
          is_paused?: boolean | null
          pause_message?: string | null
          platform_fee_percentage?: number
          platform_wallet_address?: string
          updated_at?: string
        }
        Relationships: []
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
        ]
      }
      newsletter_rate_limits: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          email_domain: string
          id: string
          operation_type: string
          window_start: string | null
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          email_domain: string
          id?: string
          operation_type: string
          window_start?: string | null
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          email_domain?: string
          id?: string
          operation_type?: string
          window_start?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          confirmed_at: string | null
          created_at: string
          email: string
          id: string
          opt_in_token: string
          status: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          email: string
          id?: string
          opt_in_token: string
          status?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          email?: string
          id?: string
          opt_in_token?: string
          status?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      nft_likes: {
        Row: {
          created_at: string
          id: string
          nft_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nft_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nft_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nft_likes_nft_id_fkey"
            columns: ["nft_id"]
            isOneToOne: false
            referencedRelation: "nfts"
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
          creator_user_id: string | null
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
          network: string | null
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
          creator_user_id?: string | null
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
          network?: string | null
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
          creator_user_id?: string | null
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
          network?: string | null
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
        ]
      }
      payments: {
        Row: {
          amount_anime: number
          amount_usdt: number
          anime_price: number
          collection_id: string
          created_at: string
          id: string
          payment_type: string
          tx_signature: string
          verified: boolean
          wallet_address: string
        }
        Insert: {
          amount_anime: number
          amount_usdt: number
          anime_price: number
          collection_id: string
          created_at?: string
          id?: string
          payment_type: string
          tx_signature: string
          verified?: boolean
          wallet_address: string
        }
        Update: {
          amount_anime?: number
          amount_usdt?: number
          anime_price?: number
          collection_id?: string
          created_at?: string
          id?: string
          payment_type?: string
          tx_signature?: string
          verified?: boolean
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          request_count: number | null
          user_wallet: string
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          request_count?: number | null
          user_wallet: string
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          request_count?: number | null
          user_wallet?: string
          window_start?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          operation: string
          table_name: string
          user_wallet: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation: string
          table_name: string
          user_wallet?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          operation?: string
          table_name?: string
          user_wallet?: string | null
        }
        Relationships: []
      }
      security_event_rate_limits: {
        Row: {
          created_at: string
          event_count: number
          id: string
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          event_count?: number
          id?: string
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          event_count?: number
          id?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          banner_image_url: string | null
          bio: string | null
          bio_unlock_status: boolean | null
          collection_count: number | null
          created_at: string
          current_pfp_nft_mint_address: string | null
          discord_handle: string | null
          display_name: string | null
          id: string
          nft_count: number | null
          nickname: string | null
          pfp_unlock_status: boolean | null
          profile_image_url: string | null
          profile_rank: string | null
          trade_count: number | null
          twitter_handle: string | null
          updated_at: string
          user_id: string | null
          verified: boolean
          wallet_address: string | null
          website_url: string | null
        }
        Insert: {
          banner_image_url?: string | null
          bio?: string | null
          bio_unlock_status?: boolean | null
          collection_count?: number | null
          created_at?: string
          current_pfp_nft_mint_address?: string | null
          discord_handle?: string | null
          display_name?: string | null
          id?: string
          nft_count?: number | null
          nickname?: string | null
          pfp_unlock_status?: boolean | null
          profile_image_url?: string | null
          profile_rank?: string | null
          trade_count?: number | null
          twitter_handle?: string | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean
          wallet_address?: string | null
          website_url?: string | null
        }
        Update: {
          banner_image_url?: string | null
          bio?: string | null
          bio_unlock_status?: boolean | null
          collection_count?: number | null
          created_at?: string
          current_pfp_nft_mint_address?: string | null
          discord_handle?: string | null
          display_name?: string | null
          id?: string
          nft_count?: number | null
          nickname?: string | null
          pfp_unlock_status?: boolean | null
          profile_image_url?: string | null
          profile_rank?: string | null
          trade_count?: number | null
          twitter_handle?: string | null
          updated_at?: string
          user_id?: string | null
          verified?: boolean
          wallet_address?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          created_at: string
          id: string
          is_verified: boolean
          linked_at: string
          updated_at: string
          user_id: string
          wallet_address: string
          wallet_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_verified?: boolean
          linked_at?: string
          updated_at?: string
          user_id: string
          wallet_address: string
          wallet_type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_verified?: boolean
          linked_at?: string
          updated_at?: string
          user_id?: string
          wallet_address?: string
          wallet_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_pending_rewards: {
        Args: { p_stake_id: string }
        Returns: number
      }
      calculate_profile_rank: {
        Args: { trade_count: number }
        Returns: string
      }
      check_newsletter_rate_limit: {
        Args: {
          p_email: string
          p_max_attempts?: number
          p_operation: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_max_requests?: number
          p_user_wallet: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_security_event_rate_limit: {
        Args: {
          p_max_events?: number
          p_user_id: string
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_vault_access: {
        Args: { p_minimum_stake?: number; p_wallet_address: string }
        Returns: boolean
      }
      cleanup_user_primary_wallets: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      encrypt_email: {
        Args: { email_text: string }
        Returns: string
      }
      generate_collection_slug: {
        Args: { collection_name: string }
        Returns: string
      }
      get_boosted_leaderboard: {
        Args: Record<PropertyKey, never>
        Returns: {
          bid_amount: number
          bid_rank: number
          bidder_wallet: string
          end_time: string
          id: string
          is_active: boolean
          nft_id: string
          nft_image_url: string
          nft_name: string
          owner_address: string
          start_time: string
          tier: string
          token_mint: string
          tx_signature: string
        }[]
      }
      get_boosted_listings_authenticated: {
        Args: Record<PropertyKey, never>
        Returns: {
          bid_amount: number
          bid_rank: number
          bidder_wallet: string
          end_time: string
          id: string
          is_active: boolean
          nft_id: string
          nft_image_url: string
          nft_name: string
          owner_address: string
          start_time: string
          tier: string
          token_mint: string
          tx_signature: string
        }[]
      }
      get_boosted_listings_public: {
        Args: Record<PropertyKey, never>
        Returns: {
          bid_amount: number
          bid_rank: number
          bidder_wallet_masked: string
          end_time: string
          id: string
          is_active: boolean
          nft_id: string
          nft_image_url: string
          nft_name: string
          owner_address_masked: string
          start_time: string
          tier: string
          token_mint: string
          tx_signature: string
        }[]
      }
      get_collection_creator_wallet: {
        Args: { collection_id: string }
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
      get_collection_like_counts: {
        Args: Record<PropertyKey, never>
        Returns: {
          collection_id: string
          like_count: number
        }[]
      }
      get_collection_like_counts_public: {
        Args: Record<PropertyKey, never>
        Returns: {
          collection_id: string
          like_count: number
        }[]
      }
      get_collections_authenticated: {
        Args: Record<PropertyKey, never>
        Returns: {
          banner_image_url: string
          category: string
          collection_mint_address: string
          created_at: string
          creator_address: string
          description: string
          explicit_content: boolean
          external_links: Json
          go_live_date: string
          id: string
          image_url: string
          is_active: boolean
          is_live: boolean
          items_available: number
          items_redeemed: number
          max_supply: number
          mint_price: number
          name: string
          onchain_description: string
          royalty_percentage: number
          site_description: string
          slug: string
          symbol: string
          treasury_wallet: string
          updated_at: string
          verified: boolean
          whitelist_enabled: boolean
        }[]
      }
      get_collections_public: {
        Args: Record<PropertyKey, never>
        Returns: {
          banner_image_url: string
          candy_machine_id: string
          category: string
          collection_mint_address: string
          created_at: string
          creator_address: string
          description: string
          explicit_content: boolean
          external_links: Json
          go_live_date: string
          id: string
          image_url: string
          is_active: boolean
          is_live: boolean
          items_available: number
          items_redeemed: number
          max_supply: number
          mint_price: number
          name: string
          onchain_description: string
          royalty_percentage: number
          site_description: string
          slug: string
          symbol: string
          treasury_wallet: string
          updated_at: string
          verified: boolean
          whitelist_enabled: boolean
        }[]
      }
      get_collections_public_explore: {
        Args: Record<PropertyKey, never>
        Returns: {
          banner_image_url: string
          category: string
          collection_mint_address: string
          created_at: string
          creator_address: string
          creator_nickname: string
          creator_verified: boolean
          description: string
          explicit_content: boolean
          external_links: Json
          go_live_date: string
          id: string
          image_url: string
          is_active: boolean
          is_live: boolean
          items_available: number
          items_redeemed: number
          max_supply: number
          mint_price: number
          name: string
          onchain_description: string
          royalty_percentage: number
          site_description: string
          slug: string
          symbol: string
          treasury_wallet: string
          updated_at: string
          verified: boolean
          whitelist_enabled: boolean
        }[]
      }
      get_collections_public_masked: {
        Args: Record<PropertyKey, never>
        Returns: {
          banner_image_url: string
          category: string
          collection_mint_address: string
          created_at: string
          creator_address_masked: string
          description: string
          explicit_content: boolean
          external_links: Json
          go_live_date: string
          id: string
          image_url: string
          is_active: boolean
          is_live: boolean
          items_available: number
          items_redeemed: number
          max_supply: number
          mint_price: number
          name: string
          onchain_description: string
          royalty_percentage: number
          site_description: string
          slug: string
          symbol: string
          treasury_wallet_masked: string
          updated_at: string
          verified: boolean
          whitelist_enabled: boolean
        }[]
      }
      get_creator_collection_like_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          collection_likes_count: number
          creator_user_id: string
        }[]
      }
      get_creator_follow_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          creator_user_id: string
          follower_count: number
        }[]
      }
      get_creator_like_stats_by_user_id: {
        Args: { p_user_id: string }
        Returns: {
          collection_likes_count: number
          nft_likes_count: number
          total_likes_count: number
        }[]
      }
      get_creator_nft_like_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          creator_user_id: string
          nft_likes_count: number
        }[]
      }
      get_creators_public_explore: {
        Args: Record<PropertyKey, never>
        Returns: {
          collection_likes_count: number
          created_collection_count: number
          created_nft_count: number
          creator_user_id: string
          follower_count: number
          nft_likes_count: number
          nickname: string
          profile_image_url: string
          profile_rank: string
          total_likes_count: number
          verified: boolean
          wallet_address: string
        }[]
      }
      get_creators_public_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          collection_likes_count: number
          creator_user_id: string
          follower_count: number
          nft_likes_count: number
          total_likes_count: number
        }[]
      }
      get_marketplace_activities_authenticated: {
        Args: Record<PropertyKey, never>
        Returns: {
          activity_type: string
          block_time: string
          collection_id: string
          created_at: string
          currency: string
          from_address: string
          id: string
          nft_id: string
          price: number
          to_address: string
          transaction_signature: string
        }[]
      }
      get_marketplace_activities_public: {
        Args: Record<PropertyKey, never>
        Returns: {
          activity_type: string
          block_time: string
          collection_id: string
          created_at: string
          currency: string
          from_address_masked: string
          id: string
          nft_id: string
          price: number
          to_address_masked: string
          transaction_signature_masked: string
        }[]
      }
      get_marketplace_activities_public_masked: {
        Args: Record<PropertyKey, never>
        Returns: {
          activity_type: string
          block_time: string
          collection_id: string
          created_at: string
          currency: string
          from_address_masked: string
          id: string
          nft_id: string
          price: number
          to_address_masked: string
          transaction_signature_masked: string
        }[]
      }
      get_marketplace_fees_public: {
        Args: Record<PropertyKey, never>
        Returns: {
          platform_fee_percentage: number
        }[]
      }
      get_marketplace_info_public: {
        Args: Record<PropertyKey, never>
        Returns: {
          allowlist_only: boolean
          is_paused: boolean
          pause_message: string
          platform_fee_percentage: number
          updated_at: string
        }[]
      }
      get_marketplace_settings_authenticated: {
        Args: Record<PropertyKey, never>
        Returns: {
          allowlist_only: boolean
          created_at: string
          id: string
          is_paused: boolean
          pause_message: string
          platform_fee_percentage: number
          platform_wallet_address: string
          updated_at: string
        }[]
      }
      get_newsletter_subscriber_status: {
        Args: { p_email: string }
        Returns: Json
      }
      get_nft_like_counts_public: {
        Args: Record<PropertyKey, never>
        Returns: {
          like_count: number
          nft_id: string
        }[]
      }
      get_nfts_authenticated: {
        Args: Record<PropertyKey, never>
        Returns: {
          attributes: Json
          collection_id: string
          created_at: string
          creator_address: string
          currency: string
          description: string
          featured_at: string
          id: string
          image_url: string
          is_featured: boolean
          is_listed: boolean
          metadata_uri: string
          mint_address: string
          name: string
          owner_address: string
          price: number
          symbol: string
          updated_at: string
          views: number
        }[]
      }
      get_nfts_public: {
        Args: Record<PropertyKey, never>
        Returns: {
          attributes: Json
          collection_id: string
          created_at: string
          creator_address_masked: string
          currency: string
          description: string
          featured_at: string
          id: string
          image_url: string
          is_featured: boolean
          is_listed: boolean
          metadata_uri: string
          mint_address: string
          name: string
          owner_address_masked: string
          price: number
          symbol: string
          updated_at: string
          views: number
        }[]
      }
      get_nfts_public_explore: {
        Args: Record<PropertyKey, never>
        Returns: {
          attributes: Json
          collection_id: string
          created_at: string
          creator_address: string
          creator_nickname: string
          creator_verified: boolean
          currency: string
          description: string
          featured_at: string
          id: string
          image_url: string
          is_featured: boolean
          is_listed: boolean
          metadata_uri: string
          mint_address: string
          name: string
          owner_address: string
          owner_nickname: string
          owner_verified: boolean
          price: number
          symbol: string
          updated_at: string
          views: number
        }[]
      }
      get_profiles_authenticated: {
        Args: Record<PropertyKey, never>
        Returns: {
          banner_image_url: string
          bio: string
          created_at: string
          discord_handle: string
          display_name: string
          id: string
          nickname: string
          profile_image_url: string
          profile_rank: string
          trade_count: number
          twitter_handle: string
          updated_at: string
          verified: boolean
          wallet_address: string
          website_url: string
        }[]
      }
      get_profiles_public: {
        Args: Record<PropertyKey, never>
        Returns: {
          banner_image_url: string
          bio: string
          created_at: string
          discord_handle: string
          display_name: string
          id: string
          profile_image_url: string
          profile_rank: string
          trade_count: number
          twitter_handle: string
          verified: boolean
          wallet_address_masked: string
          website_url: string
        }[]
      }
      get_public_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          display_name: string
          profile_image_url: string
          profile_rank: string
          trade_count: number
          verified: boolean
          wallet_address: string
        }[]
      }
      get_user_primary_wallet: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_user_total_staked: {
        Args: { p_wallet_address: string }
        Returns: number
      }
      get_user_wallets: {
        Args: { p_user_id: string }
        Returns: {
          id: string
          is_verified: boolean
          linked_at: string
          wallet_address: string
          wallet_type: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_user_trade_count: {
        Args: { user_wallet_address: string }
        Returns: undefined
      }
      secure_newsletter_confirm: {
        Args: { p_email: string; p_opt_in_token: string }
        Returns: Json
      }
      secure_newsletter_subscribe: {
        Args: { p_email: string; p_opt_in_token?: string }
        Returns: Json
      }
      secure_newsletter_unsubscribe: {
        Args: { p_email: string; p_opt_in_token?: string }
        Returns: Json
      }
      unstake_anime: {
        Args: { p_amount: number; p_stake_id: string }
        Returns: Json
      }
      update_user_asset_counts: {
        Args: { p_wallet_address: string }
        Returns: undefined
      }
      verify_wallet_securely: {
        Args: {
          p_message: string
          p_signature: string
          p_user_id: string
          p_wallet_address: string
          p_wallet_type: string
        }
        Returns: Json
      }
    }
    Enums: {
      anime_reward_type: "vault_access" | "governance" | "yield_share"
      app_role: "admin" | "moderator" | "user"
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
      anime_reward_type: ["vault_access", "governance", "yield_share"],
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
