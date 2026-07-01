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
      applications: {
        Row: {
          cover_note: string | null
          created_at: string
          id: string
          opportunity_id: string
          status: Database["public"]["Enums"]["application_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          cover_note?: string | null
          created_at?: string
          id?: string
          opportunity_id: string
          status?: Database["public"]["Enums"]["application_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          cover_note?: string | null
          created_at?: string
          id?: string
          opportunity_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          created_at: string
          hours: number | null
          id: string
          issued_at: string
          opportunity_id: string | null
          org_id: string | null
          title: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          hours?: number | null
          id?: string
          issued_at?: string
          opportunity_id?: string | null
          org_id?: string | null
          title: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          hours?: number | null
          id?: string
          issued_at?: string
          opportunity_id?: string | null
          org_id?: string | null
          title?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["chat_role"]
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["chat_role"]
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["chat_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          host: string | null
          id: string
          location: string | null
          province: Database["public"]["Enums"]["province"] | null
          starts_at: string
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          host?: string | null
          id?: string
          location?: string | null
          province?: Database["public"]["Enums"]["province"] | null
          starts_at: string
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          host?: string | null
          id?: string
          location?: string | null
          province?: Database["public"]["Enums"]["province"] | null
          starts_at?: string
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      experience_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          experience_id: string
          id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          experience_id: string
          id?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          experience_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_comments_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_reactions: {
        Row: {
          created_at: string
          experience_id: string
          kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          experience_id: string
          kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          experience_id?: string
          kind?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_reactions_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          author_id: string
          body: string
          categories: string[]
          created_at: string
          id: string
          org_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          categories?: string[]
          created_at?: string
          id?: string
          org_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          categories?: string[]
          created_at?: string
          id?: string
          org_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          thread_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          thread_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "forum_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_threads: {
        Row: {
          author_id: string
          body: string
          category: Database["public"]["Enums"]["forum_category"]
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          category: Database["public"]["Enums"]["forum_category"]
          created_at?: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          category?: Database["public"]["Enums"]["forum_category"]
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          href: string | null
          id: string
          kind: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          href?: string | null
          id?: string
          kind?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          active: boolean
          categories: string[]
          commitment: string | null
          created_at: string
          created_by: string | null
          description: string
          hours_per_week: number | null
          id: string
          opp_type: Database["public"]["Enums"]["opportunity_type"]
          org_id: string
          requirements: string | null
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          categories?: string[]
          commitment?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          hours_per_week?: number | null
          id?: string
          opp_type?: Database["public"]["Enums"]["opportunity_type"]
          org_id: string
          requirements?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          categories?: string[]
          commitment?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          hours_per_week?: number | null
          id?: string
          opp_type?: Database["public"]["Enums"]["opportunity_type"]
          org_id?: string
          requirements?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          address: string | null
          categories: string[]
          city: string | null
          contact_email: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          province: Database["public"]["Enums"]["province"] | null
          slug: string
          updated_at: string
          verified: boolean
          website: string | null
        }
        Insert: {
          address?: string | null
          categories?: string[]
          city?: string | null
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          province?: Database["public"]["Enums"]["province"] | null
          slug: string
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          address?: string | null
          categories?: string[]
          city?: string | null
          contact_email?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          province?: Database["public"]["Enums"]["province"] | null
          slug?: string
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          degree: string | null
          email: string | null
          full_name: string
          grad_year: number | null
          id: string
          province: Database["public"]["Enums"]["province"] | null
          university: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          degree?: string | null
          email?: string | null
          full_name?: string
          grad_year?: number | null
          id: string
          province?: Database["public"]["Enums"]["province"] | null
          university?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          degree?: string | null
          email?: string | null
          full_name?: string
          grad_year?: number | null
          id?: string
          province?: Database["public"]["Enums"]["province"] | null
          university?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      psychologist_details: {
        Row: {
          category: string | null
          created_at: string
          hpcsa_number: string | null
          organisation: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          hpcsa_number?: string | null
          organisation?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          hpcsa_number?: string | null
          organisation?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      saved_opportunities: {
        Row: {
          created_at: string
          opportunity_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          opportunity_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          opportunity_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
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
          role: Database["public"]["Enums"]["app_role"]
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
      volunteer_hours: {
        Row: {
          created_at: string
          description: string | null
          hours: number
          id: string
          logged_at: string
          opportunity_id: string | null
          org_id: string | null
          skills: string[]
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          hours: number
          id?: string
          logged_at?: string
          opportunity_id?: string | null
          org_id?: string | null
          skills?: string[]
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          hours?: number
          id?: string
          logged_at?: string
          opportunity_id?: string | null
          org_id?: string | null
          skills?: string[]
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_hours_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_hours_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "student" | "psychologist" | "organisation" | "admin"
      application_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "withdrawn"
        | "completed"
      chat_role: "user" | "assistant" | "system"
      forum_category:
        | "Honours Applications"
        | "Research"
        | "Volunteer Advice"
        | "Clinical"
        | "Counselling"
        | "Study Tips"
        | "Mental Health"
        | "General"
      opportunity_type: "in_person" | "hybrid" | "remote"
      province:
        | "Eastern Cape"
        | "Free State"
        | "Gauteng"
        | "KwaZulu-Natal"
        | "Limpopo"
        | "Mpumalanga"
        | "Northern Cape"
        | "North West"
        | "Western Cape"
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
      app_role: ["student", "psychologist", "organisation", "admin"],
      application_status: [
        "pending",
        "accepted",
        "rejected",
        "withdrawn",
        "completed",
      ],
      chat_role: ["user", "assistant", "system"],
      forum_category: [
        "Honours Applications",
        "Research",
        "Volunteer Advice",
        "Clinical",
        "Counselling",
        "Study Tips",
        "Mental Health",
        "General",
      ],
      opportunity_type: ["in_person", "hybrid", "remote"],
      province: [
        "Eastern Cape",
        "Free State",
        "Gauteng",
        "KwaZulu-Natal",
        "Limpopo",
        "Mpumalanga",
        "Northern Cape",
        "North West",
        "Western Cape",
      ],
    },
  },
} as const
