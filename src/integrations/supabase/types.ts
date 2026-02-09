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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          id: string
          is_current: boolean | null
          semester: string
          year_end: number
          year_start: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_current?: boolean | null
          semester: string
          year_end: number
          year_start: number
        }
        Update: {
          created_at?: string
          id?: string
          is_current?: boolean | null
          semester?: string
          year_end?: number
          year_start?: number
        }
        Relationships: []
      }
      attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          notes: string | null
          prefect_id: string
          status: string | null
          time_in: string | null
          time_out: string | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          notes?: string | null
          prefect_id: string
          status?: string | null
          time_in?: string | null
          time_out?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          prefect_id?: string
          status?: string | null
          time_in?: string | null
          time_out?: string | null
        }
        Relationships: []
      }
      complaint_messages: {
        Row: {
          complaint_id: string
          created_at: string
          id: string
          message: string
          sender_id: string
        }
        Insert: {
          complaint_id: string
          created_at?: string
          id?: string
          message: string
          sender_id: string
        }
        Update: {
          complaint_id?: string
          created_at?: string
          id?: string
          message?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_messages_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string
          id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          subject: string
          submitted_by: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description: string
          id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          subject: string
          submitted_by: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string
          id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          subject?: string
          submitted_by?: string
          updated_at?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      duty_assignments: {
        Row: {
          assigned_by: string
          created_at: string
          description: string | null
          duty_date: string
          end_time: string | null
          id: string
          location: string | null
          prefect_id: string
          start_time: string | null
          status: Database["public"]["Enums"]["duty_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          created_at?: string
          description?: string | null
          duty_date: string
          end_time?: string | null
          id?: string
          location?: string | null
          prefect_id: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["duty_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          description?: string | null
          duty_date?: string
          end_time?: string | null
          id?: string
          location?: string | null
          prefect_id?: string
          start_time?: string | null
          status?: Database["public"]["Enums"]["duty_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      duty_reports: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          issues_encountered: string | null
          prefect_id: string
          report: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          issues_encountered?: string | null
          prefect_id: string
          report: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          issues_encountered?: string | null
          prefect_id?: string
          report?: string
        }
        Relationships: [
          {
            foreignKeyName: "duty_reports_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "duty_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      event_assignments: {
        Row: {
          created_at: string
          event_id: string
          id: string
          prefect_id: string
          role_in_event: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          prefect_id: string
          role_in_event?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          prefect_id?: string
          role_in_event?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_assignments_event_id_fkey"
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
          created_by: string
          description: string | null
          end_time: string | null
          event_date: string
          id: string
          location: string | null
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          location?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          location?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      gate_assistance_logs: {
        Row: {
          created_at: string
          id: string
          log_date: string
          notes: string | null
          prefect_id: string
          time_in: string
          time_out: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          log_date: string
          notes?: string | null
          prefect_id: string
          time_in: string
          time_out?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          log_date?: string
          notes?: string | null
          prefect_id?: string
          time_in?: string
          time_out?: string | null
        }
        Relationships: []
      }
      incident_reports: {
        Row: {
          created_at: string
          description: string
          id: string
          incident_date: string
          is_resolved: boolean | null
          location: string | null
          reported_by: string
          resolved_at: string | null
          resolved_by: string | null
          severity: Database["public"]["Enums"]["incident_severity"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          incident_date?: string
          is_resolved?: boolean | null
          location?: string | null
          reported_by: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          incident_date?: string
          is_resolved?: boolean | null
          location?: string | null
          reported_by?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: Database["public"]["Enums"]["incident_severity"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      performance_evaluations: {
        Row: {
          academic_year_id: string | null
          comments: string | null
          created_at: string
          evaluator_id: string
          id: string
          prefect_id: string
          rating: number | null
        }
        Insert: {
          academic_year_id?: string | null
          comments?: string | null
          created_at?: string
          evaluator_id: string
          id?: string
          prefect_id: string
          rating?: number | null
        }
        Update: {
          academic_year_id?: string | null
          comments?: string | null
          created_at?: string
          evaluator_id?: string
          id?: string
          prefect_id?: string
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_evaluations_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      prefect_applications: {
        Row: {
          academic_year_id: string
          applicant_id: string
          created_at: string
          gpa: number | null
          id: string
          review_notes: string | null
          reviewed_by: string | null
          statement: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          applicant_id: string
          created_at?: string
          gpa?: number | null
          id?: string
          review_notes?: string | null
          reviewed_by?: string | null
          statement: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          applicant_id?: string
          created_at?: string
          gpa?: number | null
          id?: string
          review_notes?: string | null
          reviewed_by?: string | null
          statement?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prefect_applications_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          section: string | null
          student_id: string | null
          updated_at: string
          year_level: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email: string
          first_name: string
          id: string
          last_name: string
          phone?: string | null
          section?: string | null
          student_id?: string | null
          updated_at?: string
          year_level?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          section?: string | null
          student_id?: string | null
          updated_at?: string
          year_level?: number | null
        }
        Relationships: []
      }
      training_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      training_materials: {
        Row: {
          category_id: string
          content: string | null
          created_at: string
          created_by: string
          file_url: string | null
          id: string
          is_published: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id: string
          content?: string | null
          created_at?: string
          created_by: string
          file_url?: string | null
          id?: string
          is_published?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          content?: string | null
          created_at?: string
          created_by?: string
          file_url?: string | null
          id?: string
          is_published?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_materials_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "training_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_reports: {
        Row: {
          achievements: string | null
          challenges: string | null
          created_at: string
          id: string
          prefect_id: string
          summary: string
          week_end: string
          week_start: string
        }
        Insert: {
          achievements?: string | null
          challenges?: string | null
          created_at?: string
          id?: string
          prefect_id: string
          summary: string
          week_end: string
          week_start: string
        }
        Update: {
          achievements?: string | null
          challenges?: string | null
          created_at?: string
          id?: string
          prefect_id?: string
          summary?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "prefect" | "faculty" | "student"
      application_status: "pending" | "under_review" | "approved" | "rejected"
      complaint_status: "pending" | "in_progress" | "resolved" | "dismissed"
      duty_status: "assigned" | "completed" | "missed"
      incident_severity: "low" | "medium" | "high" | "critical"
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
      app_role: ["admin", "prefect", "faculty", "student"],
      application_status: ["pending", "under_review", "approved", "rejected"],
      complaint_status: ["pending", "in_progress", "resolved", "dismissed"],
      duty_status: ["assigned", "completed", "missed"],
      incident_severity: ["low", "medium", "high", "critical"],
    },
  },
} as const
