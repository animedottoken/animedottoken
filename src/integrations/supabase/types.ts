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
      community_submissions: {
        Row: {
          author: string
          author_bio: string | null
          caption: string
          contact: string | null
          created_at: string
          edition_type: Database["public"]["Enums"]["edition_type"] | null
          external_id: string | null
          id: string
          image_url: string
          name: string | null
          nft_address: string | null
          status: Database["public"]["Enums"]["submission_status"]
          submission_source: Database["public"]["Enums"]["submission_source"]
          tags: string[] | null
          theme: Database["public"]["Enums"]["theme_type"] | null
          type: Database["public"]["Enums"]["submission_type"]
          updated_at: string
        }
        Insert: {
          author: string
          author_bio?: string | null
          caption: string
          contact?: string | null
          created_at?: string
          edition_type?: Database["public"]["Enums"]["edition_type"] | null
          external_id?: string | null
          id?: string
          image_url: string
          name?: string | null
          nft_address?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submission_source?: Database["public"]["Enums"]["submission_source"]
          tags?: string[] | null
          theme?: Database["public"]["Enums"]["theme_type"] | null
          type?: Database["public"]["Enums"]["submission_type"]
          updated_at?: string
        }
        Update: {
          author?: string
          author_bio?: string | null
          caption?: string
          contact?: string | null
          created_at?: string
          edition_type?: Database["public"]["Enums"]["edition_type"] | null
          external_id?: string | null
          id?: string
          image_url?: string
          name?: string | null
          nft_address?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          submission_source?: Database["public"]["Enums"]["submission_source"]
          tags?: string[] | null
          theme?: Database["public"]["Enums"]["theme_type"] | null
          type?: Database["public"]["Enums"]["submission_type"]
          updated_at?: string
        }
        Relationships: []
      }
      featured_content: {
        Row: {
          created_at: string
          featured_at: string
          id: string
          position: number
          submission_id: string
        }
        Insert: {
          created_at?: string
          featured_at?: string
          id?: string
          position: number
          submission_id: string
        }
        Update: {
          created_at?: string
          featured_at?: string
          id?: string
          position?: number
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_content_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "community_submissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_content_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "public_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_submissions: {
        Row: {
          author: string | null
          author_bio: string | null
          caption: string | null
          created_at: string | null
          edition_type: Database["public"]["Enums"]["edition_type"] | null
          id: string | null
          image_url: string | null
          name: string | null
          nft_address: string | null
          status: Database["public"]["Enums"]["submission_status"] | null
          submission_source:
            | Database["public"]["Enums"]["submission_source"]
            | null
          tags: string[] | null
          theme: Database["public"]["Enums"]["theme_type"] | null
          type: Database["public"]["Enums"]["submission_type"] | null
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          author_bio?: string | null
          caption?: string | null
          created_at?: string | null
          edition_type?: Database["public"]["Enums"]["edition_type"] | null
          id?: string | null
          image_url?: string | null
          name?: string | null
          nft_address?: string | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          submission_source?:
            | Database["public"]["Enums"]["submission_source"]
            | null
          tags?: string[] | null
          theme?: Database["public"]["Enums"]["theme_type"] | null
          type?: Database["public"]["Enums"]["submission_type"] | null
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          author_bio?: string | null
          caption?: string | null
          created_at?: string | null
          edition_type?: Database["public"]["Enums"]["edition_type"] | null
          id?: string | null
          image_url?: string | null
          name?: string | null
          nft_address?: string | null
          status?: Database["public"]["Enums"]["submission_status"] | null
          submission_source?:
            | Database["public"]["Enums"]["submission_source"]
            | null
          tags?: string[] | null
          theme?: Database["public"]["Enums"]["theme_type"] | null
          type?: Database["public"]["Enums"]["submission_type"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      edition_type: "standard" | "limited" | "exclusive"
      submission_source: "discord" | "twitter" | "form"
      submission_status: "pending" | "approved" | "rejected"
      submission_type:
        | "art"
        | "meme"
        | "story"
        | "picture"
        | "music"
        | "other"
        | "video"
        | "animation"
      theme_type:
        | "anime"
        | "digital_culture"
        | "meme"
        | "ai"
        | "new_internet_money"
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
      app_role: ["admin", "user"],
      edition_type: ["standard", "limited", "exclusive"],
      submission_source: ["discord", "twitter", "form"],
      submission_status: ["pending", "approved", "rejected"],
      submission_type: [
        "art",
        "meme",
        "story",
        "picture",
        "music",
        "other",
        "video",
        "animation",
      ],
      theme_type: [
        "anime",
        "digital_culture",
        "meme",
        "ai",
        "new_internet_money",
      ],
    },
  },
} as const
