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

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      // Extract error message from various ShipRocket error formats
      const errorMessage =
        data.message ||
        data.error ||
        data.errors?.join(', ') ||
        (typeof data === 'string' ? data : null) ||
        `API request failed: ${response.status}`
      throw new Error(errorMessage)
    }

    // ShipRocket sometimes returns errors with 200 status
    if (data.status_code === 0 || data.status === 0) {
      throw new Error(data.message || data.error || 'ShipRocket API returned an error')
    }

    return data as T
  }

  // ============================================
  // PICKUP LOCATIONS
  // ============================================

  /**
   * Get all registered pickup locations
   */
  async getPickupLocations(): Promise<{
    id: number
    pickup_location: string
    address: string
    city: string
    state: string
    pin_code: string
    phone: string
    email: string
  }[]> {
    const response = await this.request<{
      data: {
        shipping_address: {
          id: number
          pickup_location: string
          address: string
          address_2?: string
          city: string
          state: string
          pin_code: string
          phone: string
          email: string
        }[]
      }
    }>('/settings/company/pickup')

    return response.data.shipping_address || []
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
   * Get order details from ShipRocket
   */
  async getOrderDetails(shiprocketOrderId: string): Promise<{
    order_id: number
    channel_order_id: string
    shipment_id: number | null
    status: string
    status_code: number
    awb_code: string | null
    courier_company_id: number | null
    courier_name: string | null
  }> {
    const response = await this.request<{
      data: {
        id: number
        channel_order_id: string
        shipments: {
          id: number
          awb_code: string | null
          courier_company_id: number | null
          courier: string | null
          status: string
          status_code: number
        }[]
        status: string
        status_code: number
      }
    }>(`/orders/show/${shiprocketOrderId}`)

    const shipment = response.data.shipments?.[0]

    return {
      order_id: response.data.id,
      channel_order_id: response.data.channel_order_id,
      shipment_id: shipment?.id || null,
      status: shipment?.status || response.data.status,
      status_code: shipment?.status_code || response.data.status_code,
      awb_code: shipment?.awb_code || null,
      courier_company_id: shipment?.courier_company_id || null,
      courier_name: shipment?.courier || null,
    }
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

    // Log the response for debugging
    console.log('AWB assign response:', JSON.stringify(response, null, 2))

    // Handle different response structures from ShipRocket
    const data = response.response?.data || (response as any).data || response

    if (!data || !data.awb_code) {
      // Check for error message in response
      const errorMsg = (response as any).message || (response as any).error || 'AWB generation failed - no AWB code in response'
      throw new Error(errorMsg)
    }

    // Handle assigned_date_time which can be a string or an object with a date property
    let assignedDateTime: string = new Date().toISOString()
    if (data.assigned_date_time) {
      if (typeof data.assigned_date_time === 'string') {
        assignedDateTime = data.assigned_date_time
      } else if (typeof data.assigned_date_time === 'object' && data.assigned_date_time.date) {
        assignedDateTime = data.assigned_date_time.date
      }
    }

    return {
      awb_code: data.awb_code,
      courier_company_id: data.courier_company_id || 0,
      courier_name: data.courier_name || '',
      assigned_date_time: assignedDateTime,
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

    // Log response for debugging
    console.log('Pickup schedule response:', JSON.stringify(response, null, 2))

    // Handle response - check different possible structures
    const pickupData = response.response || (response as unknown as PickupResponse['response'])

    if (!pickupData || !pickupData.pickup_scheduled_date) {
      throw new Error((response as { message?: string }).message || 'Failed to schedule pickup - no pickup date in response')
    }

    return {
      pickup_scheduled_date: pickupData.pickup_scheduled_date,
      pickup_token_number: pickupData.pickup_token_number || '',
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

    // Log response for debugging
    console.log('Generate label response:', JSON.stringify(response, null, 2))

    // Handle different possible response structures
    const labelUrl = response.label_url || (response as { label_url?: string }).label_url

    if (!labelUrl) {
      // Check if there's an error about not_created
      const notCreated = response.not_created
      if (notCreated && notCreated.length > 0) {
        throw new Error(`Failed to generate label: ${notCreated.join(', ')}`)
      }
      throw new Error((response as { message?: string }).message || 'Failed to generate label - no URL in response')
    }

    return labelUrl
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
    courier_company_id: number | null
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

    // Log response for debugging
    console.log('Track by AWB response:', JSON.stringify(response, null, 2))

    const trackingData = response.tracking_data
    if (!trackingData) {
      throw new Error('No tracking data in response')
    }

    const track = trackingData.shipment_track?.[0]

    return {
      awb: track?.awb_code || awbCode,
      courier: track?.courier_name || '', // Note: courier_name may not always be present
      courier_company_id: track?.courier_company_id || null,
      current_status: track?.current_status || 'Unknown',
      current_status_id: trackingData.shipment_status_id || 0,
      events: trackingData.shipment_track_activities || [],
      etd: track?.edd || trackingData.etd || '',
      delivered_date: track?.delivered_date || null,
      track_url: trackingData.track_url || '',
    }
  }

  /**
   * Track shipment by Shipment ID
   */
  async trackByShipmentId(shipmentId: number): Promise<{
    awb: string
    courier: string
    courier_company_id: number | null
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

    const trackingData = response.tracking_data
    if (!trackingData) {
      throw new Error('No tracking data in response')
    }

    const track = trackingData.shipment_track?.[0]

    return {
      awb: track?.awb_code || '',
      courier: track?.courier_name || '',
      courier_company_id: track?.courier_company_id || null,
      current_status: track?.current_status || 'Unknown',
      current_status_id: trackingData.shipment_status_id || 0,
      events: trackingData.shipment_track_activities || [],
      etd: track?.edd || trackingData.etd || '',
      delivered_date: track?.delivered_date || null,
      track_url: trackingData.track_url || '',
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
