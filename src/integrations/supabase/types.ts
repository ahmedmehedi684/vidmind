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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_notes: {
        Row: {
          channel_id: string | null
          created_at: string
          id: string
          text: string
          title: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          id?: string
          text: string
          title?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          id?: string
          text?: string
          title?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          admin_note: string | null
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          payment_details: string
          payment_method: string
          processed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          affiliate_id: string
          amount?: number
          created_at?: string
          id?: string
          payment_details?: string
          payment_method?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          payment_details?: string
          payment_method?: string
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          commission_amount: number
          created_at: string
          id: string
          referred_user_id: string
          status: string
          subscription_id: string | null
        }
        Insert: {
          affiliate_id: string
          commission_amount?: number
          created_at?: string
          id?: string
          referred_user_id: string
          status?: string
          subscription_id?: string | null
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          created_at?: string
          id?: string
          referred_user_id?: string
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          commission_percent: number
          created_at: string
          date_of_birth: string | null
          id: string
          occupation: string | null
          payment_method: string | null
          payment_method_locked_at: string | null
          payment_number: string | null
          phone: string | null
          profile_completed: boolean | null
          promo_code: string | null
          referral_code: string
          social_media_link: string | null
          status: string
          total_earnings: number
          total_referrals: number
          updated_at: string
          user_id: string
          wallet_balance: number | null
          wallet_currency: string | null
        }
        Insert: {
          commission_percent?: number
          created_at?: string
          date_of_birth?: string | null
          id?: string
          occupation?: string | null
          payment_method?: string | null
          payment_method_locked_at?: string | null
          payment_number?: string | null
          phone?: string | null
          profile_completed?: boolean | null
          promo_code?: string | null
          referral_code: string
          social_media_link?: string | null
          status?: string
          total_earnings?: number
          total_referrals?: number
          updated_at?: string
          user_id: string
          wallet_balance?: number | null
          wallet_currency?: string | null
        }
        Update: {
          commission_percent?: number
          created_at?: string
          date_of_birth?: string | null
          id?: string
          occupation?: string | null
          payment_method?: string | null
          payment_method_locked_at?: string | null
          payment_number?: string | null
          phone?: string | null
          profile_completed?: boolean | null
          promo_code?: string | null
          referral_code?: string
          social_media_link?: string | null
          status?: string
          total_earnings?: number
          total_referrals?: number
          updated_at?: string
          user_id?: string
          wallet_balance?: number | null
          wallet_currency?: string | null
        }
        Relationships: []
      }
      books: {
        Row: {
          author: string | null
          buy_link: string | null
          cover_url: string | null
          created_at: string
          currency: string
          id: string
          note: string | null
          price: number
          reading_status: string
          reminded_at: string | null
          status: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author?: string | null
          buy_link?: string | null
          cover_url?: string | null
          created_at?: string
          currency?: string
          id?: string
          note?: string | null
          price?: number
          reading_status?: string
          reminded_at?: string | null
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author?: string | null
          buy_link?: string | null
          cover_url?: string | null
          created_at?: string
          currency?: string
          id?: string
          note?: string | null
          price?: number
          reading_status?: string
          reminded_at?: string | null
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bug_reports: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          title: string
          user_id: string
          username: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          title?: string
          user_id: string
          username?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          title?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      channels: {
        Row: {
          created_at: string
          id: string
          name: string
          platform: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          platform?: string
          url?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          platform?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number
          min_purchase: number
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          min_purchase?: number
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number
          min_purchase?: number
          used_count?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          benefits: string | null
          created_at: string
          description: string | null
          id: string
          plan: string | null
          profit_estimate: string | null
          profit_timeline: string | null
          progress_percent: number
          status: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          benefits?: string | null
          created_at?: string
          description?: string | null
          id?: string
          plan?: string | null
          profit_estimate?: string | null
          profit_timeline?: string | null
          progress_percent?: number
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          benefits?: string | null
          created_at?: string
          description?: string | null
          id?: string
          plan?: string | null
          profit_estimate?: string | null
          profit_timeline?: string | null
          progress_percent?: number
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      important_links: {
        Row: {
          channel_id: string | null
          created_at: string
          id: string
          note: string
          title: string
          url: string
          user_id: string
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          id?: string
          note?: string
          title: string
          url?: string
          user_id: string
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          id?: string
          note?: string
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "important_links_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_showcase: {
        Row: {
          channel_name: string
          created_at: string
          display_date: string
          id: string
          sort_order: number
          tags: string[]
          thumbnail_url: string
          title: string
          video_url: string
        }
        Insert: {
          channel_name?: string
          created_at?: string
          display_date?: string
          id?: string
          sort_order?: number
          tags?: string[]
          thumbnail_url?: string
          title: string
          video_url?: string
        }
        Update: {
          channel_name?: string
          created_at?: string
          display_date?: string
          id?: string
          sort_order?: number
          tags?: string[]
          thumbnail_url?: string
          title?: string
          video_url?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_global: boolean
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_global?: boolean
          is_read?: boolean
          message: string
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_global?: boolean
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_name: string
          account_number: string
          created_at: string
          currency: string
          icon: string
          id: string
          instructions: string
          is_active: boolean
          name: string
          sort_order: number
        }
        Insert: {
          account_name?: string
          account_number?: string
          created_at?: string
          currency?: string
          icon?: string
          id?: string
          instructions?: string
          is_active?: boolean
          name: string
          sort_order?: number
        }
        Update: {
          account_name?: string
          account_number?: string
          created_at?: string
          currency?: string
          icon?: string
          id?: string
          instructions?: string
          is_active?: boolean
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      payment_orders: {
        Row: {
          admin_note: string | null
          amount: number
          coupon_code: string | null
          created_at: string
          id: string
          payment_method: string
          payment_number: string | null
          plan_id: string | null
          status: string
          subscription_id: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount?: number
          coupon_code?: string | null
          created_at?: string
          id?: string
          payment_method?: string
          payment_number?: string | null
          plan_id?: string | null
          status?: string
          subscription_id?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          coupon_code?: string | null
          created_at?: string
          id?: string
          payment_method?: string
          payment_number?: string | null
          plan_id?: string | null
          status?: string
          subscription_id?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_orders_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_orders_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      study_reminders: {
        Row: {
          created_at: string
          id: string
          is_enabled: boolean
          last_notified_on: string | null
          remind_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_notified_on?: string | null
          remind_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_enabled?: boolean
          last_notified_on?: string | null
          remind_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          button_text: string
          compare_price: number | null
          created_at: string
          currency: string
          description: string | null
          duration_days: number
          duration_months: number | null
          features: Json
          id: string
          is_active: boolean
          is_popular: boolean
          limit_period: string
          limits: Json
          name: string
          price: number
          sort_order: number
        }
        Insert: {
          button_text?: string
          compare_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number
          duration_months?: number | null
          features?: Json
          id?: string
          is_active?: boolean
          is_popular?: boolean
          limit_period?: string
          limits?: Json
          name: string
          price?: number
          sort_order?: number
        }
        Update: {
          button_text?: string
          compare_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          duration_days?: number
          duration_months?: number | null
          features?: Json
          id?: string
          is_active?: boolean
          is_popular?: boolean
          limit_period?: string
          limits?: Json
          name?: string
          price?: number
          sort_order?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string | null
          starts_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string | null
          starts_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string | null
          starts_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      summaries: {
        Row: {
          bullet_points: Json
          conversation: Json | null
          created_at: string
          how_to_apply: Json
          id: string
          input_type: string
          input_value: string
          main_story: string
          user_id: string
        }
        Insert: {
          bullet_points?: Json
          conversation?: Json | null
          created_at?: string
          how_to_apply?: Json
          id?: string
          input_type?: string
          input_value: string
          main_story: string
          user_id: string
        }
        Update: {
          bullet_points?: Json
          conversation?: Json | null
          created_at?: string
          how_to_apply?: Json
          id?: string
          input_type?: string
          input_value?: string
          main_story?: string
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_reply: string | null
          created_at: string
          id: string
          message: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      task_day_completions: {
        Row: {
          created_at: string
          day: string
          id: string
          status: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          id?: string
          status: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          status?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_day_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category: string
          created_at: string
          description: string | null
          due_date: string | null
          due_time: string | null
          estimated_minutes: number | null
          id: string
          notes: string | null
          parent_task_id: string | null
          priority: string
          sort_order: number | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          estimated_minutes?: number | null
          id?: string
          notes?: string | null
          parent_task_id?: string | null
          priority?: string
          sort_order?: number | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          estimated_minutes?: number | null
          id?: string
          notes?: string | null
          parent_task_id?: string | null
          priority?: string
          sort_order?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          created_by: string
          email: string
          id: string
          name: string
          role: string
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          id?: string
          name: string
          role?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          id?: string
          name?: string
          role?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          id: string
          loan_person_name: string | null
          notes: string | null
          priority: string | null
          transaction_date: string
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          loan_person_name?: string | null
          notes?: string | null
          priority?: string | null
          transaction_date?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          loan_person_name?: string | null
          notes?: string | null
          priority?: string | null
          transaction_date?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          api_keys: Json
          created_at: string
          id: string
          model: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_keys?: Json
          created_at?: string
          id?: string
          model?: string
          provider?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_keys?: Json
          created_at?: string
          id?: string
          model?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          current_streak: number
          id: string
          last_active_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_active_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_active_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_xp: {
        Row: {
          id: string
          rank: string
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          id?: string
          rank?: string
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          id?: string
          rank?: string
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      web_links: {
        Row: {
          category: string
          created_at: string
          id: string
          purpose: string
          site_name: string
          site_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          purpose?: string
          site_name: string
          site_url: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          purpose?: string
          site_name?: string
          site_url?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_coupon_usage: { Args: { _code: string }; Returns: undefined }
    }
    Enums: {
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
