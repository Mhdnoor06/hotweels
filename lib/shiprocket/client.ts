import { createClient } from '@supabase/supabase-js'
import type {
  ShipRocketAuthResponse,
  ServiceabilityResponse,
  CourierCompany,
  CreateOrderRequest,
  CreateOrderResponse,
  AWBAssignResponse,
  PickupResponse,
  LabelResponse,
  ManifestResponse,
  TrackingResponse,
  TrackingActivity,
  ShipRocketSettings,
} from './types'

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external'

// Token validity buffer (1 hour before expiry)
const TOKEN_BUFFER_MS = 60 * 60 * 1000

interface ShipRocketConfig {
  email: string
  password: string
}

export class ShipRocketClient {
  private token: string | null = null
  private tokenExpiry: Date | null = null
  private config: ShipRocketConfig

  constructor(config: ShipRocketConfig) {
    this.config = config
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  /**
   * Authenticate with ShipRocket API
   */
  async authenticate(): Promise<string> {
    const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: this.config.email,
        password: this.config.password,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `Authentication failed: ${response.status}`)
    }

    const data: ShipRocketAuthResponse = await response.json()
    this.token = data.token

    // Token valid for 10 days (240 hours)
    this.tokenExpiry = new Date(Date.now() + 240 * 60 * 60 * 1000)

    return this.token
  }

  /**
   * Get valid token, refreshing if needed
   */
  async getValidToken(): Promise<string> {
    const isExpired =
      !this.token ||
      !this.tokenExpiry ||
      this.tokenExpiry.getTime() - Date.now() < TOKEN_BUFFER_MS

    if (isExpired) {
      await this.authenticate()
    }

    return this.token!
  }

  /**
   * Set token from cached value (from database)
   */
  setToken(token: string, expiresAt: Date): void {
    this.token = token
    this.tokenExpiry = expiresAt
  }

  /**
   * Get current token info
   */
  getTokenInfo(): { token: string | null; expiresAt: Date | null } {
    return {
      token: this.token,
      expiresAt: this.tokenExpiry,
    }
  }

  /**
   * Check if current token is valid
   */
  isTokenValid(): boolean {
    if (!this.token || !this.tokenExpiry) return false
    return this.tokenExpiry.getTime() - Date.now() > TOKEN_BUFFER_MS
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getValidToken()

    const response = await fetch(`${SHIPROCKET_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(
        error.message || `API request failed: ${response.status}`
      )
    }

    return response.json()
  }

  // ============================================
  // SERVICEABILITY
  // ============================================

  /**
   * Check if delivery is available between pincodes
   */
  async checkServiceability(
    pickupPincode: string,
    deliveryPincode: string,
    weight: number,
    isCOD: boolean = false,
    declaredValue?: number
  ): Promise<{ available: boolean; couriers: CourierCompany[] }> {
    const params = new URLSearchParams({
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      weight: weight.toString(),
      cod: isCOD ? '1' : '0',
    })

    if (declaredValue) {
      params.append('declared_value', declaredValue.toString())
    }

    const response = await this.request<ServiceabilityResponse>(
      `/courier/serviceability/?${params}`
    )

    const couriers = response.data?.available_courier_companies || []

    return {
      available: couriers.length > 0,
      couriers,
    }
  }

  // ============================================
  // ORDER MANAGEMENT
  // ============================================

  /**
   * Create order in ShipRocket
   */
  async createOrder(payload: CreateOrderRequest): Promise<CreateOrderResponse> {
    return this.request<CreateOrderResponse>('/orders/create/adhoc', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderIds: number[]): Promise<{ status: number; message: string }> {
    return this.request('/orders/cancel', {
      method: 'POST',
      body: JSON.stringify({ ids: orderIds }),
    })
  }

  // ============================================
  // AWB & SHIPPING
  // ============================================

  /**
   * Generate AWB and assign courier
   */
  async generateAWB(
    shipmentId: number,
    courierId?: number
  ): Promise<{
    awb_code: string
    courier_company_id: number
    courier_name: string
    assigned_date_time: string
  }> {
    const body: { shipment_id: number; courier_id?: number } = {
      shipment_id: shipmentId,
    }

    if (courierId) {
      body.courier_id = courierId
    }

    const response = await this.request<AWBAssignResponse>('/courier/assign/awb', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    return {
      awb_code: response.response.data.awb_code,
      courier_company_id: response.response.data.courier_company_id,
      courier_name: response.response.data.courier_name,
      assigned_date_time: response.response.data.assigned_date_time.date,
    }
  }

  /**
   * Schedule pickup
   */
  async schedulePickup(shipmentIds: number[]): Promise<{
    pickup_scheduled_date: string
    pickup_token_number: string
  }> {
    const response = await this.request<PickupResponse>('/courier/generate/pickup', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: shipmentIds }),
    })

    return {
      pickup_scheduled_date: response.response.pickup_scheduled_date,
      pickup_token_number: response.response.pickup_token_number,
    }
  }

  /**
   * Generate shipping label
   */
  async generateLabel(shipmentIds: number[]): Promise<string> {
    const response = await this.request<LabelResponse>('/courier/generate/label', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: shipmentIds }),
    })

    return response.label_url
  }

  /**
   * Generate manifest
   */
  async generateManifest(shipmentIds: number[]): Promise<string> {
    const response = await this.request<ManifestResponse>('/manifests/generate', {
      method: 'POST',
      body: JSON.stringify({ shipment_id: shipmentIds }),
    })

    return response.manifest_url
  }

  // ============================================
  // TRACKING
  // ============================================

  /**
   * Track shipment by AWB
   */
  async trackByAWB(awbCode: string): Promise<{
    awb: string
    courier: string
    current_status: string
    current_status_id: number
    events: TrackingActivity[]
    etd: string
    delivered_date: string | null
    track_url: string
  }> {
    const response = await this.request<TrackingResponse>(
      `/courier/track/awb/${awbCode}`
    )

    const track = response.tracking_data.shipment_track[0]

    return {
      awb: track?.awb_code || awbCode,
      courier: track?.courier_company_id?.toString() || '',
      current_status: track?.current_status || 'Unknown',
      current_status_id: response.tracking_data.shipment_status_id,
      events: response.tracking_data.shipment_track_activities || [],
      etd: track?.edd || response.tracking_data.etd,
      delivered_date: track?.delivered_date || null,
      track_url: response.tracking_data.track_url,
    }
  }

  /**
   * Track shipment by Shipment ID
   */
  async trackByShipmentId(shipmentId: number): Promise<{
    awb: string
    courier: string
    current_status: string
    current_status_id: number
    events: TrackingActivity[]
    etd: string
    delivered_date: string | null
    track_url: string
  }> {
    const response = await this.request<TrackingResponse>(
      `/courier/track/shipment/${shipmentId}`
    )

    const track = response.tracking_data.shipment_track[0]

    return {
      awb: track?.awb_code || '',
      courier: track?.courier_company_id?.toString() || '',
      current_status: track?.current_status || 'Unknown',
      current_status_id: response.tracking_data.shipment_status_id,
      events: response.tracking_data.shipment_track_activities || [],
      etd: track?.edd || response.tracking_data.etd,
      delivered_date: track?.delivered_date || null,
      track_url: response.tracking_data.track_url,
    }
  }
}

// ============================================
// SINGLETON INSTANCE MANAGEMENT
// ============================================

let clientInstance: ShipRocketClient | null = null

/**
 * Get ShipRocket client instance with credentials from database
 */
export async function getShipRocketClient(): Promise<ShipRocketClient> {
  // Create Supabase admin client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch settings from database
  const { data: settings, error } = await supabase
    .from('shiprocket_settings' as never)
    .select('*')
    .limit(1)
    .single()

  if (error || !settings) {
    throw new Error('ShipRocket settings not configured. Please configure in admin settings.')
  }

  const typedSettings = settings as ShipRocketSettings

  if (!typedSettings.enabled) {
    throw new Error('ShipRocket integration is disabled.')
  }

  // Create new client or reuse existing
  if (!clientInstance ||
      clientInstance['config'].email !== typedSettings.api_email) {
    clientInstance = new ShipRocketClient({
      email: typedSettings.api_email,
      password: typedSettings.api_password,
    })
  }

  // If we have a cached token that's still valid, use it
  if (typedSettings.auth_token && typedSettings.token_expires_at) {
    const expiry = new Date(typedSettings.token_expires_at)
    if (expiry.getTime() - Date.now() > TOKEN_BUFFER_MS) {
      clientInstance.setToken(typedSettings.auth_token, expiry)
    }
  }

  // If token is not valid, authenticate and save new token
  if (!clientInstance.isTokenValid()) {
    await clientInstance.authenticate()

    const tokenInfo = clientInstance.getTokenInfo()

    // Save new token to database
    await supabase
      .from('shiprocket_settings' as never)
      .update({
        auth_token: tokenInfo.token,
        token_expires_at: tokenInfo.expiresAt?.toISOString(),
      } as never)
      .eq('id', typedSettings.id)
  }

  return clientInstance
}

/**
 * Get ShipRocket client for testing credentials (doesn't require enabled setting)
 */
export async function getShipRocketClientForTest(
  email: string,
  password: string
): Promise<ShipRocketClient> {
  const client = new ShipRocketClient({ email, password })
  await client.authenticate()
  return client
}

/**
 * Reset client instance (useful when settings change)
 */
export function resetShipRocketClient(): void {
  clientInstance = null
}
