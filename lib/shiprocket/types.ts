// ============================================
// SHIPROCKET API TYPES
// ============================================

// Authentication
export interface ShipRocketAuthResponse {
  token: string
  id: number
  first_name: string
  last_name: string
  email: string
  company_id: number
}

// Courier/Serviceability
export interface CourierCompany {
  courier_company_id: number
  courier_name: string
  freight_charge: number
  cod_charges: number
  coverage_charges: number
  estimated_delivery_days: string
  etd: string
  rating: number
  min_weight: number
  rto_charges: number
  is_surface: boolean
  is_rto_address_available: boolean
  charge_weight: number
}

export interface ServiceabilityResponse {
  status: number
  data: {
    available_courier_companies: CourierCompany[]
    currency: string
  }
}

// Order Creation
export interface OrderItem {
  name: string
  sku: string
  units: number
  selling_price: number
  discount?: number
  tax?: number
  hsn?: number
}

export interface CreateOrderRequest {
  order_id: string
  order_date: string
  pickup_location: string
  channel_id?: string
  comment?: string
  billing_customer_name: string
  billing_last_name?: string
  billing_address: string
  billing_address_2?: string
  billing_city: string
  billing_pincode: string
  billing_state: string
  billing_country: string
  billing_email: string
  billing_phone: string
  billing_alternate_phone?: string
  shipping_is_billing: boolean
  shipping_customer_name?: string
  shipping_last_name?: string
  shipping_address?: string
  shipping_address_2?: string
  shipping_city?: string
  shipping_pincode?: string
  shipping_country?: string
  shipping_state?: string
  shipping_email?: string
  shipping_phone?: string
  order_items: OrderItem[]
  payment_method: 'Prepaid' | 'COD'
  shipping_charges?: number
  giftwrap_charges?: number
  transaction_charges?: number
  total_discount?: number
  sub_total: number
  length: number
  breadth: number
  height: number
  weight: number
}

export interface CreateOrderResponse {
  order_id: number
  shipment_id: number
  status: string
  status_code: number
  onboarding_completed_now: number
  awb_code: string
  courier_company_id: string
  courier_name: string
}

// AWB Assignment
export interface AWBAssignRequest {
  shipment_id: number
  courier_id?: number
}

export interface AWBAssignResponse {
  response: {
    data: {
      awb_code: string
      courier_company_id: number
      courier_name: string
      assigned_date_time: {
        date: string
        timezone_type: number
        timezone: string
      }
      routing_code: string
      pickup_scheduled_date: string
      applied_weight: number
    }
  }
}

// Pickup
export interface PickupRequest {
  shipment_id: number[]
}

export interface PickupResponse {
  pickup_status: number
  response: {
    pickup_scheduled_date: string
    pickup_token_number: string
    status: number
    others: string
    pickup_generated_date: {
      date: string
    }
  }
}

// Label
export interface LabelResponse {
  label_created: number
  response: string
  label_url: string
  not_created: string[]
}

// Manifest
export interface ManifestResponse {
  manifest_url: string
}

// Tracking
export interface TrackingActivity {
  date: string
  status: string
  activity: string
  location: string
  'sr-status': string
  'sr-status-label': string
}

export interface ShipmentTrack {
  id: number
  awb_code: string
  courier_company_id: number
  courier_name?: string // May not always be present in tracking response
  shipment_id: number
  order_id: number
  pickup_date: string
  delivered_date: string | null
  weight: string
  packages: number
  current_status: string
  delivered_to: string
  destination: string
  consignee_name: string
  origin: string
  courier_agent_details: unknown
  edd: string
}

export interface TrackingData {
  track_status: number
  shipment_status: number
  shipment_status_id: number
  shipment_track: ShipmentTrack[]
  shipment_track_activities: TrackingActivity[]
  track_url: string
  etd: string
}

export interface TrackingResponse {
  tracking_data: TrackingData
}

// Webhook
export interface WebhookPayload {
  awb: string
  courier_name: string
  current_status: string
  current_status_id: number
  shipment_status: string
  shipment_status_id: number
  order_id: string
  sr_order_id: number
  etd: string
  delivered_date: string | null
  scans: Array<{
    date: string
    activity: string
    location: string
  }>
}

// ============================================
// DATABASE TYPES
// ============================================

export interface ShipRocketSettings {
  id: string
  api_email: string
  api_password: string
  auth_token: string | null
  token_expires_at: string | null
  pickup_location_name: string
  pickup_address: string
  pickup_address_2: string | null
  pickup_city: string
  pickup_state: string
  pickup_pincode: string
  pickup_phone: string
  pickup_email: string | null
  enabled: boolean
  auto_assign_courier: boolean
  preferred_courier_id: number | null
  auto_create_order: boolean
  auto_schedule_pickup: boolean
  default_length: number
  default_breadth: number
  default_height: number
  default_weight: number
  webhook_secret: string | null
  created_at: string
  updated_at: string
}

export interface ShippingTrackingEvent {
  id: string
  order_id: string
  awb_code: string
  status: string
  status_code: number | null
  status_id: number | null
  activity: string | null
  location: string | null
  event_time: string | null
  remarks: string | null
  raw_payload: unknown
  created_at: string
}

// ============================================
// STATUS MAPPINGS
// ============================================

export const SHIPROCKET_STATUS_MAP: Record<number, string> = {
  1: 'AWB_ASSIGNED',
  2: 'LABEL_GENERATED',
  3: 'PICKUP_SCHEDULED',
  4: 'PICKUP_QUEUED',
  5: 'MANIFEST_GENERATED',
  6: 'PICKED_UP',
  7: 'DELIVERED',
  8: 'CANCELLED',
  9: 'RTO_INITIATED',
  10: 'RTO_DELIVERED',
  17: 'OUT_FOR_DELIVERY',
  18: 'IN_TRANSIT',
  19: 'LOST',
  20: 'PICKUP_ERROR',
  21: 'RTO_ACKNOWLEDGED',
  22: 'PICKUP_RESCHEDULED',
  38: 'REACHED_DESTINATION_HUB',
  40: 'RTO_IN_TRANSIT',
  43: 'RTO_OFD',
  44: 'RTO_NDR',
}

export const ORDER_STATUS_FROM_SHIPROCKET: Record<string, string> = {
  'PICKED_UP': 'shipped',
  'IN_TRANSIT': 'shipped',
  'OUT_FOR_DELIVERY': 'shipped',
  'REACHED_DESTINATION_HUB': 'shipped',
  'DELIVERED': 'delivered',
  'CANCELLED': 'cancelled',
  'RTO_INITIATED': 'cancelled',
  'RTO_DELIVERED': 'cancelled',
  'LOST': 'cancelled',
}

// ============================================
// API REQUEST/RESPONSE TYPES
// ============================================

export interface ShipRocketSettingsInput {
  api_email?: string
  api_password?: string
  pickup_location_name?: string
  pickup_address?: string
  pickup_address_2?: string
  pickup_city?: string
  pickup_state?: string
  pickup_pincode?: string
  pickup_phone?: string
  pickup_email?: string
  enabled?: boolean
  auto_assign_courier?: boolean
  preferred_courier_id?: number | null
  auto_create_order?: boolean
  auto_schedule_pickup?: boolean
  default_length?: number
  default_breadth?: number
  default_height?: number
  default_weight?: number
  webhook_secret?: string
}

export interface ShipRocketSettingsResponse {
  enabled: boolean
  hasCredentials: boolean
  tokenValid: boolean
  tokenExpiresAt: string | null
  pickupLocation: {
    name: string
    address: string
    address_2: string | null
    city: string
    state: string
    pincode: string
    phone: string
    email: string | null
  } | null
  autoAssignCourier: boolean
  preferredCourierId: number | null
  autoCreateOrder: boolean
  autoSchedulePickup: boolean
  defaultDimensions: {
    length: number
    breadth: number
    height: number
    weight: number
  }
}
