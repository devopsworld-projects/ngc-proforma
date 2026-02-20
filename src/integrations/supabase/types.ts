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
      addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          address_type: string
          city: string
          country: string
          created_at: string
          customer_id: string
          id: string
          is_default: boolean
          postal_code: string
          state: string
          state_code: string | null
          updated_at: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          address_type: string
          city: string
          country?: string
          created_at?: string
          customer_id: string
          id?: string
          is_default?: boolean
          postal_code: string
          state: string
          state_code?: string | null
          updated_at?: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          address_type?: string
          city?: string
          country?: string
          created_at?: string
          customer_id?: string
          id?: string
          is_default?: boolean
          postal_code?: string
          state?: string
          state_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string
          email: string | null
          gstin: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string[] | null
          postal_code: string | null
          state: string | null
          state_code: string | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          logo_url?: string | null
          name: string
          phone?: string[] | null
          postal_code?: string | null
          state?: string | null
          state_code?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string[] | null
          postal_code?: string | null
          state?: string | null
          state_code?: string | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          customer_type: string | null
          email: string | null
          gstin: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          state: string | null
          state_code: string | null
          tax_type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_type?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          state_code?: string | null
          tax_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_type?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          state?: string | null
          state_code?: string | null
          tax_type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number
          brand: string | null
          created_at: string
          description: string
          discount_percent: number | null
          gst_amount: number | null
          gst_percent: number | null
          id: string
          invoice_id: string
          product_image: string | null
          quantity: number
          rate: number
          serial_numbers: string[] | null
          size_label: string | null
          sl_no: number
          unit: string
        }
        Insert: {
          amount: number
          brand?: string | null
          created_at?: string
          description: string
          discount_percent?: number | null
          gst_amount?: number | null
          gst_percent?: number | null
          id?: string
          invoice_id: string
          product_image?: string | null
          quantity: number
          rate: number
          serial_numbers?: string[] | null
          size_label?: string | null
          sl_no: number
          unit?: string
        }
        Update: {
          amount?: number
          brand?: string | null
          created_at?: string
          description?: string
          discount_percent?: number | null
          gst_amount?: number | null
          gst_percent?: number | null
          id?: string
          invoice_id?: string
          product_image?: string | null
          quantity?: number
          rate?: number
          serial_numbers?: string[] | null
          size_label?: string | null
          sl_no?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_in_words: string | null
          applied_markup_percent: number | null
          billing_address_id: string | null
          created_at: string
          customer_id: string | null
          customer_snapshot: Json | null
          date: string
          deleted_at: string | null
          discount_amount: number | null
          discount_percent: number | null
          e_way_bill_no: string | null
          grand_total: number
          id: string
          invoice_no: string
          is_recurring: boolean
          next_invoice_date: string | null
          other_references: string | null
          quote_for: string | null
          recurring_frequency: string | null
          round_off: number | null
          shipping_address_id: string | null
          status: string
          subtotal: number
          supplier_invoice_date: string | null
          supplier_invoice_no: string | null
          tax_amount: number | null
          tax_rate: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_in_words?: string | null
          applied_markup_percent?: number | null
          billing_address_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_snapshot?: Json | null
          date?: string
          deleted_at?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          e_way_bill_no?: string | null
          grand_total?: number
          id?: string
          invoice_no: string
          is_recurring?: boolean
          next_invoice_date?: string | null
          other_references?: string | null
          quote_for?: string | null
          recurring_frequency?: string | null
          round_off?: number | null
          shipping_address_id?: string | null
          status?: string
          subtotal?: number
          supplier_invoice_date?: string | null
          supplier_invoice_no?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_in_words?: string | null
          applied_markup_percent?: number | null
          billing_address_id?: string | null
          created_at?: string
          customer_id?: string | null
          customer_snapshot?: Json | null
          date?: string
          deleted_at?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          e_way_bill_no?: string | null
          grand_total?: number
          id?: string
          invoice_no?: string
          is_recurring?: boolean
          next_invoice_date?: string | null
          other_references?: string | null
          quote_for?: string | null
          recurring_frequency?: string | null
          round_off?: number | null
          shipping_address_id?: string | null
          status?: string
          subtotal?: number
          supplier_invoice_date?: string | null
          supplier_invoice_no?: string | null
          tax_amount?: number | null
          tax_rate?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_billing_address_id_fkey"
            columns: ["billing_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_shipping_address_id_fkey"
            columns: ["shipping_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      pdf_template_settings: {
        Row: {
          accent_color: string
          bank_account_no: string | null
          bank_branch: string | null
          bank_ifsc: string | null
          bank_name: string | null
          bill_to_label: string
          border_style: string
          compact_header: boolean
          created_at: string
          custom_canvas_data: Json | null
          custom_footer_text: string | null
          font_body: string
          font_heading: string
          font_mono: string
          font_size_scale: string
          footer_padding: string
          grand_total_bg: string
          grand_total_text: string
          header_layout: string
          header_layout_style: string
          header_padding: string
          header_text_color: string
          id: string
          invoice_details_label: string
          invoice_title: string
          logo_size: string
          primary_color: string
          secondary_color: string
          section_order: string[]
          section_spacing: string
          show_amount_words: boolean
          show_brand_column: boolean
          show_company_state: boolean
          show_contact_header: boolean
          show_customer_email: boolean
          show_customer_phone: boolean
          show_discount_column: boolean
          show_gst: boolean
          show_gstin_header: boolean
          show_image_column: boolean
          show_invoice_title: boolean
          show_logo: boolean
          show_serial_numbers: boolean
          show_shipping_address: boolean
          show_signature: boolean
          show_terms: boolean
          show_unit_column: boolean
          table_border_color: string
          table_header_bg: string
          table_header_text: string
          table_row_padding: string
          table_text_color: string
          template_style: string
          terms_line1: string | null
          terms_line2: string | null
          terms_line3: string | null
          terms_line4: string | null
          terms_line5: string | null
          terms_line6: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string
          bank_account_no?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          bill_to_label?: string
          border_style?: string
          compact_header?: boolean
          created_at?: string
          custom_canvas_data?: Json | null
          custom_footer_text?: string | null
          font_body?: string
          font_heading?: string
          font_mono?: string
          font_size_scale?: string
          footer_padding?: string
          grand_total_bg?: string
          grand_total_text?: string
          header_layout?: string
          header_layout_style?: string
          header_padding?: string
          header_text_color?: string
          id?: string
          invoice_details_label?: string
          invoice_title?: string
          logo_size?: string
          primary_color?: string
          secondary_color?: string
          section_order?: string[]
          section_spacing?: string
          show_amount_words?: boolean
          show_brand_column?: boolean
          show_company_state?: boolean
          show_contact_header?: boolean
          show_customer_email?: boolean
          show_customer_phone?: boolean
          show_discount_column?: boolean
          show_gst?: boolean
          show_gstin_header?: boolean
          show_image_column?: boolean
          show_invoice_title?: boolean
          show_logo?: boolean
          show_serial_numbers?: boolean
          show_shipping_address?: boolean
          show_signature?: boolean
          show_terms?: boolean
          show_unit_column?: boolean
          table_border_color?: string
          table_header_bg?: string
          table_header_text?: string
          table_row_padding?: string
          table_text_color?: string
          template_style?: string
          terms_line1?: string | null
          terms_line2?: string | null
          terms_line3?: string | null
          terms_line4?: string | null
          terms_line5?: string | null
          terms_line6?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string
          bank_account_no?: string | null
          bank_branch?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          bill_to_label?: string
          border_style?: string
          compact_header?: boolean
          created_at?: string
          custom_canvas_data?: Json | null
          custom_footer_text?: string | null
          font_body?: string
          font_heading?: string
          font_mono?: string
          font_size_scale?: string
          footer_padding?: string
          grand_total_bg?: string
          grand_total_text?: string
          header_layout?: string
          header_layout_style?: string
          header_padding?: string
          header_text_color?: string
          id?: string
          invoice_details_label?: string
          invoice_title?: string
          logo_size?: string
          primary_color?: string
          secondary_color?: string
          section_order?: string[]
          section_spacing?: string
          show_amount_words?: boolean
          show_brand_column?: boolean
          show_company_state?: boolean
          show_contact_header?: boolean
          show_customer_email?: boolean
          show_customer_phone?: boolean
          show_discount_column?: boolean
          show_gst?: boolean
          show_gstin_header?: boolean
          show_image_column?: boolean
          show_invoice_title?: boolean
          show_logo?: boolean
          show_serial_numbers?: boolean
          show_shipping_address?: boolean
          show_signature?: boolean
          show_terms?: boolean
          show_unit_column?: boolean
          table_border_color?: string
          table_header_bg?: string
          table_header_text?: string
          table_row_padding?: string
          table_text_color?: string
          template_style?: string
          terms_line1?: string | null
          terms_line2?: string | null
          terms_line3?: string | null
          terms_line4?: string | null
          terms_line5?: string | null
          terms_line6?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing_settings: {
        Row: {
          created_at: string
          customer_markup_percent: number | null
          dealer_markup_percent: number | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_markup_percent?: number | null
          dealer_markup_percent?: number | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_markup_percent?: number | null
          dealer_markup_percent?: number | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          gst_percent: number | null
          hsn_code: string | null
          id: string
          image_url: string | null
          is_active: boolean
          model_spec: string | null
          name: string
          purchase_price: number | null
          rate: number
          size_label: string | null
          sku: string | null
          stock_quantity: number | null
          supplier_contact: string | null
          supplier_name: string | null
          unit: string
          updated_at: string
          user_id: string | null
          warranty_months: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          gst_percent?: number | null
          hsn_code?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          model_spec?: string | null
          name: string
          purchase_price?: number | null
          rate?: number
          size_label?: string | null
          sku?: string | null
          stock_quantity?: number | null
          supplier_contact?: string | null
          supplier_name?: string | null
          unit?: string
          updated_at?: string
          user_id?: string | null
          warranty_months?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          gst_percent?: number | null
          hsn_code?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          model_spec?: string | null
          name?: string
          purchase_price?: number | null
          rate?: number
          size_label?: string | null
          sku?: string | null
          stock_quantity?: number | null
          supplier_contact?: string | null
          supplier_name?: string | null
          unit?: string
          updated_at?: string
          user_id?: string | null
          warranty_months?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_approved: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_approved?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      revenue_settings: {
        Row: {
          baseline_date: string | null
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          baseline_date?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          baseline_date?: string | null
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
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
      user_sessions: {
        Row: {
          browser: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          is_active: boolean
          logged_in_at: string
          os: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          logged_in_at?: string
          os?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          logged_in_at?: string
          os?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_archive_all_invoices: { Args: never; Returns: Json }
      admin_create_user: {
        Args: {
          user_email: string
          user_full_name?: string
          user_password: string
        }
        Returns: Json
      }
      admin_delete_all_invoices: { Args: never; Returns: Json }
      admin_set_revenue_baseline: { Args: { baseline: string }; Returns: Json }
      approve_user: {
        Args: { approved: boolean; target_user_id: string }
        Returns: boolean
      }
      delete_user: { Args: { target_user_id: string }; Returns: boolean }
      get_admin_user_sessions: {
        Args: { target_user_id?: string }
        Returns: {
          browser: string
          device_type: string
          id: string
          ip_address: string
          is_active: boolean
          logged_in_at: string
          os: string
          user_agent: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_admin_user_stats: {
        Args: never
        Returns: {
          created_at: string
          customer_count: number
          email: string
          email_confirmed_at: string
          full_name: string
          invoice_count: number
          is_admin: boolean
          is_approved: boolean
          total_revenue: number
          user_id: string
        }[]
      }
      get_user_invoices_admin: {
        Args: { target_user_id: string }
        Returns: {
          created_at: string
          customer_name: string
          date: string
          grand_total: number
          id: string
          invoice_no: string
          status: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      toggle_admin_role: {
        Args: { make_admin: boolean; target_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      customer_type: "customer" | "dealer"
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
      customer_type: ["customer", "dealer"],
    },
  },
} as const
