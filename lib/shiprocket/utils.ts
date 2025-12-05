import { SHIPROCKET_STATUS_MAP, ORDER_STATUS_FROM_SHIPROCKET } from './types'

/**
 * Format date for ShipRocket API (YYYY-MM-DD HH:mm)
 */
export function formatOrderDate(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * Generate unique order ID for ShipRocket
 * ShipRocket requires alphanumeric order IDs
 */
export function generateShipRocketOrderId(orderId: string): string {
  // Remove any special characters (like hyphens from UUID)
  const cleanId = orderId.replace(/[^a-zA-Z0-9]/g, '')
  // Take first 20 chars to keep it manageable
  const shortId = cleanId.substring(0, 20)
  return `HW-${shortId}`
}

/**
 * Calculate total weight for order items
 */
export function calculateOrderWeight(
  items: Array<{ quantity: number; weight?: number }>,
  defaultWeight: number = 0.1
): number {
  const totalWeight = items.reduce((total, item) => {
    const itemWeight = item.weight || defaultWeight
    return total + itemWeight * item.quantity
  }, 0)

  // Round to 2 decimal places
  return Math.round(totalWeight * 100) / 100
}

/**
 * Calculate package dimensions based on quantity
 * For Hot Wheels, items can be stacked
 */
export function calculatePackageDimensions(
  itemCount: number,
  defaults: { length: number; breadth: number; height: number }
): { length: number; breadth: number; height: number } {
  // 4 items per layer assumption
  const stackMultiplier = Math.ceil(itemCount / 4)

  return {
    length: defaults.length,
    breadth: defaults.breadth,
    height: Math.round(defaults.height * stackMultiplier * 100) / 100,
  }
}

/**
 * Split full name into first and last name
 */
export function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' }
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

/**
 * Validate Indian pincode (6 digits, first digit not 0)
 */
export function isValidPincode(pincode: string): boolean {
  return /^[1-9][0-9]{5}$/.test(pincode)
}

/**
 * Validate Indian phone number
 */
export function isValidPhone(phone: string): boolean {
  // Remove spaces and country code
  const cleaned = phone.replace(/\s+/g, '').replace(/^\+91/, '')
  return /^[6-9][0-9]{9}$/.test(cleaned)
}

/**
 * Clean phone number for ShipRocket (10 digits only)
 */
export function cleanPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '')

  // Remove country code if present (91)
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return digitsOnly.substring(2)
  }

  // Return last 10 digits
  return digitsOnly.slice(-10)
}

/**
 * Truncate address to max length (ShipRocket has 80 char limit)
 */
export function truncateAddress(address: string, maxLength: number = 80): string {
  if (address.length <= maxLength) {
    return address
  }
  return address.substring(0, maxLength - 3) + '...'
}

/**
 * Truncate city name (ShipRocket has 30 char limit)
 */
export function truncateCity(city: string, maxLength: number = 30): string {
  if (city.length <= maxLength) {
    return city
  }
  return city.substring(0, maxLength)
}

/**
 * Get estimated delivery text from days string
 */
export function getDeliveryText(days: string): string {
  if (!days) return 'Delivery date will be confirmed'

  const daysNum = parseInt(days.split('-')[0])

  if (daysNum <= 2) return 'Express Delivery (1-2 days)'
  if (daysNum <= 4) return 'Standard Delivery (3-4 days)'
  return `Delivery in ${days} days`
}

/**
 * Get status label from status ID
 */
export function getStatusLabel(statusId: number): string {
  return SHIPROCKET_STATUS_MAP[statusId] || 'PROCESSING'
}

/**
 * Map ShipRocket status to order status
 */
export function mapShipRocketStatus(
  srStatus: string | number
): 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' {
  const normalizedStatus =
    typeof srStatus === 'number'
      ? getStatusLabel(srStatus)
      : srStatus.toUpperCase().replace(/ /g, '_')

  return (ORDER_STATUS_FROM_SHIPROCKET[normalizedStatus] as
    'shipped' | 'delivered' | 'cancelled') || 'processing'
}

/**
 * Verify webhook signature using HMAC
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (typeof window !== 'undefined') {
    // This should only run on server
    console.warn('verifyWebhookSignature should only be called on server')
    return false
  }

  try {
    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')

    return signature === expectedSignature
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

/**
 * Get user-friendly error message from ShipRocket API error
 */
export function getShipRocketErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (message.includes('401') || message.includes('authentication')) {
      return 'ShipRocket authentication failed. Please check your API credentials.'
    }
    if (message.includes('pincode') || message.includes('serviceability')) {
      return 'Delivery not available to this pincode.'
    }
    if (message.includes('phone')) {
      return 'Invalid phone number format. Please use 10-digit Indian mobile number.'
    }
    if (message.includes('address')) {
      return 'Address is too long or invalid. Please shorten the address.'
    }
    if (message.includes('order_id') || message.includes('duplicate')) {
      return 'This order has already been processed in ShipRocket.'
    }
    if (message.includes('weight')) {
      return 'Package weight mismatch. Please verify package dimensions.'
    }

    return error.message
  }

  return 'An unexpected error occurred with shipping service.'
}

/**
 * Indian states list for validation/dropdown
 */
export const INDIAN_STATES = [
  'Andaman and Nicobar Islands',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chandigarh',
  'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Ladakh',
  'Lakshadweep',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Puducherry',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
]

/**
 * Validate state name
 */
export function isValidState(state: string): boolean {
  return INDIAN_STATES.some(
    (s) => s.toLowerCase() === state.toLowerCase()
  )
}

/**
 * Normalize state name to proper format
 */
export function normalizeState(state: string): string {
  const found = INDIAN_STATES.find(
    (s) => s.toLowerCase() === state.toLowerCase()
  )
  return found || state
}
