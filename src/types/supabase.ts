export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      daily_challenges: {
        Row: {
          id: string;
          title: string;
          description: string;
          points_reward: number;
          start_date: string;
          end_date: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          points_reward: number;
          start_date: string;
          end_date: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          points_reward?: number;
          start_date?: string;
          end_date?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      points_transactions: {
        Row: {
          id: string;
          user_id: string;
          points: number;
          source: string;
          receipt_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          points: number;
          source: string;
          receipt_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          points?: number;
          source?: string;
          receipt_id?: string | null;
          created_at?: string;
        };
      };
      receipt_analysis: {
        Row: {
          id: string;
          receipt_id: string;
          items: Json;
          total: number;
          store: string;
          date: string;
          confidence_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          receipt_id: string;
          items: Json;
          total: number;
          store: string;
          date: string;
          confidence_score: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          receipt_id?: string;
          items?: Json;
          total?: number;
          store?: string;
          date?: string;
          confidence_score?: number;
          created_at?: string;
        };
      };
      receipt_items: {
        Row: {
          id: string;
          receipt_id: string;
          name: string;
          price: number;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          receipt_id: string;
          name: string;
          price: number;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          receipt_id?: string;
          name?: string;
          price?: number;
          category?: string | null;
          created_at?: string;
        };
      };
      receipts: {
        Row: {
          id: string;
          user_id: string;
          image_url: string | null;
          total: number;
          store: string | null;
          points_earned: number;
          created_at: string;
          category: string | null;
          fraud_score: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          image_url?: string | null;
          total: number;
          store?: string | null;
          points_earned?: number;
          created_at?: string;
          category?: string | null;
          fraud_score?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          image_url?: string | null;
          total?: number;
          store?: string | null;
          points_earned?: number;
          created_at?: string;
          category?: string | null;
          fraud_score?: number | null;
        };
      };
      rewards: {
        Row: {
          id: string;
          title: string;
          description: string;
          points_cost: number;
          image_url: string;
          stock: number | null;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          points_cost: number;
          image_url: string;
          stock?: number | null;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          points_cost?: number;
          image_url?: string;
          stock?: number | null;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      system_logs: {
        Row: {
          id: string;
          operation: string;
          status: string;
          details: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          operation: string;
          status: string;
          details?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          operation?: string;
          status?: string;
          details?: string | null;
          created_at?: string;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          avatar_url: string | null;
          total_points: number;
          level: number;
          achievements: string[];
          created_at: string;
          updated_at: string;
          totp_secret: string | null;
          mfa_enabled: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          display_name: string;
          avatar_url?: string | null;
          total_points?: number;
          level?: number;
          achievements?: string[];
          created_at?: string;
          updated_at?: string;
          totp_secret?: string | null;
          mfa_enabled?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          display_name?: string;
          avatar_url?: string | null;
          total_points?: number;
          level?: number;
          achievements?: string[];
          created_at?: string;
          updated_at?: string;
          totp_secret?: string | null;
          mfa_enabled?: boolean;
        };
      };
      users: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      leaderboard: {
        Row: {
          user_id: string;
          display_name: string | null;
          avatar_url: string | null;
          points: number | null;
          rank: number | null;
        };
        Insert: never;
        Update: never;
      };
    };
    Functions: {
      reset_monthly_points: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      reset_weekly_points: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;
