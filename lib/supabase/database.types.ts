export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          name: string
          series: string
          price: number
          year: number
          color: string
          rarity: 'Common' | 'Uncommon' | 'Rare' | 'Super Rare' | 'Treasure Hunt'
          image: string
          images: string[] | null
          rating: number
          review_count: number
          description: string | null
          stock: number
          featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          series: string
          price: number
          year: number
          color: string
          rarity: 'Common' | 'Uncommon' | 'Rare' | 'Super Rare' | 'Treasure Hunt'
          image: string
          images?: string[] | null
          rating?: number
          review_count?: number
          description?: string | null
          stock?: number
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          series?: string
          price?: number
          year?: number
          color?: string
          rarity?: 'Common' | 'Uncommon' | 'Rare' | 'Super Rare' | 'Treasure Hunt'
          image?: string
          images?: string[] | null
          rating?: number
          review_count?: number
          description?: string | null
          stock?: number
          featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          payment_status: 'pending' | 'verification_pending' | 'verified' | 'failed' | 'cod'
          payment_method: 'cod' | 'online'
          transaction_id: string | null
          payment_screenshot: string | null
          total: number
          discount_amount: number
          shipping_address: Json
          shipping_charges: number | null
          shipping_payment_screenshot: string | null
          shipping_payment_status: 'pending' | 'verified' | null
          // ShipRocket fields
          shiprocket_order_id: string | null
          shiprocket_shipment_id: string | null
          shiprocket_awb_code: string | null
          shiprocket_courier_id: number | null
          shiprocket_courier_name: string | null
          estimated_delivery_date: string | null
          shipping_label_url: string | null
          tracking_url: string | null
          shiprocket_status: string | null
          pickup_scheduled_date: string | null
          pickup_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          payment_status?: 'pending' | 'verification_pending' | 'verified' | 'failed' | 'cod'
          payment_method?: 'cod' | 'online'
          transaction_id?: string | null
          payment_screenshot?: string | null
          total: number
          discount_amount?: number
          shipping_address: Json
          shipping_charges?: number | null
          shipping_payment_screenshot?: string | null
          shipping_payment_status?: 'pending' | 'verified' | null
          // ShipRocket fields
          shiprocket_order_id?: string | null
          shiprocket_shipment_id?: string | null
          shiprocket_awb_code?: string | null
          shiprocket_courier_id?: number | null
          shiprocket_courier_name?: string | null
          estimated_delivery_date?: string | null
          shipping_label_url?: string | null
          tracking_url?: string | null
          shiprocket_status?: string | null
          pickup_scheduled_date?: string | null
          pickup_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          payment_status?: 'pending' | 'verification_pending' | 'verified' | 'failed' | 'cod'
          payment_method?: 'cod' | 'online'
          transaction_id?: string | null
          payment_screenshot?: string | null
          total?: number
          discount_amount?: number
          shipping_address?: Json
          shipping_charges?: number | null
          shipping_payment_screenshot?: string | null
          shipping_payment_status?: 'pending' | 'verified' | null
          // ShipRocket fields
          shiprocket_order_id?: string | null
          shiprocket_shipment_id?: string | null
          shiprocket_awb_code?: string | null
          shiprocket_courier_id?: number | null
          shiprocket_courier_name?: string | null
          estimated_delivery_date?: string | null
          shipping_label_url?: string | null
          tracking_url?: string | null
          shiprocket_status?: string | null
          pickup_scheduled_date?: string | null
          pickup_token?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          price?: number
          created_at?: string
        }
      }
      wishlist: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      store_settings: {
        Row: {
          id: string
          contact_phone: string | null
          contact_email: string | null
          contact_whatsapp: string | null
          upi_qr_code: string | null
          upi_id: string | null
          cod_enabled: boolean
          online_payment_enabled: boolean
          cod_charges: number
          discount_enabled: boolean
          discount_percentage: number
          discount_code: string | null
          store_name: string
          store_address: string | null
          shipping_charges_collection_enabled: boolean
          shipping_charges_amount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          contact_phone?: string | null
          contact_email?: string | null
          contact_whatsapp?: string | null
          upi_qr_code?: string | null
          upi_id?: string | null
          cod_enabled?: boolean
          online_payment_enabled?: boolean
          cod_charges?: number
          discount_enabled?: boolean
          discount_percentage?: number
          discount_code?: string | null
          store_name?: string
          store_address?: string | null
          shipping_charges_collection_enabled?: boolean
          shipping_charges_amount?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          contact_phone?: string | null
          contact_email?: string | null
          contact_whatsapp?: string | null
          upi_qr_code?: string | null
          upi_id?: string | null
          cod_enabled?: boolean
          online_payment_enabled?: boolean
          cod_charges?: number
          discount_enabled?: boolean
          discount_percentage?: number
          discount_code?: string | null
          store_name?: string
          store_address?: string | null
          shipping_charges_collection_enabled?: boolean
          shipping_charges_amount?: number
          created_at?: string
          updated_at?: string
        }
      }
      custom_cars: {
        Row: {
          id: string
          name: string
          series: string | null
          description: string | null
          price: number
          transparent_image: string
          video_url: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          series?: string | null
          description?: string | null
          price: number
          transparent_image: string
          video_url?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          series?: string | null
          description?: string | null
          price?: number
          transparent_image?: string
          video_url?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      custom_backgrounds: {
        Row: {
          id: string
          name: string
          image: string
          car_id: string | null
          is_common: boolean
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          image: string
          car_id?: string | null
          is_common?: boolean
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          image?: string
          car_id?: string | null
          is_common?: boolean
          active?: boolean
          created_at?: string
        }
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
  }
}

// Helper types for easier usage
export type Product = Database['public']['Tables']['products']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderItem = Database['public']['Tables']['order_items']['Row']
export type WishlistItem = Database['public']['Tables']['wishlist']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type StoreSettings = Database['public']['Tables']['store_settings']['Row']
export type CustomCar = Database['public']['Tables']['custom_cars']['Row']
export type CustomBackground = Database['public']['Tables']['custom_backgrounds']['Row']
