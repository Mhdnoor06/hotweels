import { supabaseAdmin } from '@/lib/supabase/server'
import type { NotificationType } from '@/lib/supabase/database.types'

interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type: NotificationType
  orderId?: string
  metadata?: Record<string, unknown>
}

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  title,
  message,
  type,
  orderId,
  metadata = {},
}: CreateNotificationParams) {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        order_id: orderId,
        metadata,
      } as never)
      .select()
      .single()

    if (error) {
      console.error('Failed to create notification:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error creating notification:', error)
    return null
  }
}

/**
 * Get notification message for order status changes
 */
export function getOrderStatusNotification(
  status: string,
  orderId: string
): { title: string; message: string } | null {
  const shortOrderId = orderId.slice(0, 8).toUpperCase()

  switch (status.toLowerCase()) {
    case 'confirmed':
      return {
        title: 'Order Confirmed',
        message: `Your order #${shortOrderId} has been confirmed and is being prepared.`,
      }
    case 'processing':
      return {
        title: 'Order Processing',
        message: `Your order #${shortOrderId} is being processed for shipping.`,
      }
    case 'shipped':
      return {
        title: 'Order Shipped',
        message: `Great news! Your order #${shortOrderId} has been shipped and is on its way.`,
      }
    case 'delivered':
      return {
        title: 'Order Delivered',
        message: `Your order #${shortOrderId} has been delivered. Enjoy your Hot Wheels!`,
      }
    case 'cancelled':
      return {
        title: 'Order Cancelled',
        message: `Your order #${shortOrderId} has been cancelled.`,
      }
    default:
      return null
  }
}

/**
 * Send order status notification to user
 */
export async function notifyOrderStatusChange(
  userId: string,
  orderId: string,
  newStatus: string,
  metadata?: Record<string, unknown>
) {
  const notificationContent = getOrderStatusNotification(newStatus, orderId)

  if (!notificationContent) {
    return null
  }

  return createNotification({
    userId,
    title: notificationContent.title,
    message: notificationContent.message,
    type: 'order_status',
    orderId,
    metadata: {
      status: newStatus,
      ...metadata,
    },
  })
}

/**
 * Send shipping notification to user
 */
export async function notifyShippingUpdate(
  userId: string,
  orderId: string,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  return createNotification({
    userId,
    title,
    message,
    type: 'shipping',
    orderId,
    metadata,
  })
}

/**
 * Send payment notification to user
 */
export async function notifyPaymentUpdate(
  userId: string,
  orderId: string,
  title: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  return createNotification({
    userId,
    title,
    message,
    type: 'payment',
    orderId,
    metadata,
  })
}
