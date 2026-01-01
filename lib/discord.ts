/**
 * Discord Webhook Integration for Wheels Frames
 * Sends notifications to Discord when orders are placed or users sign up
 */

// Separate webhook URLs for different channels
const DISCORD_ORDERS_WEBHOOK_URL = process.env.DISCORD_ORDERS_WEBHOOK_URL
const DISCORD_SIGNUPS_WEBHOOK_URL = process.env.DISCORD_SIGNUPS_WEBHOOK_URL

interface DiscordEmbed {
  title: string
  description?: string
  color?: number
  fields?: Array<{
    name: string
    value: string
    inline?: boolean
  }>
  footer?: {
    text: string
  }
  timestamp?: string
}

interface DiscordMessage {
  content?: string
  embeds?: DiscordEmbed[]
}

async function sendDiscordMessage(webhookUrl: string | undefined, message: DiscordMessage): Promise<boolean> {
  if (!webhookUrl) {
    console.warn('Discord webhook URL not configured')
    return false
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      console.error('Discord webhook failed:', response.status, await response.text())
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending Discord message:', error)
    return false
  }
}

/**
 * Send notification when a new order is placed
 */
export async function notifyNewOrder(order: {
  id: string
  total: number
  itemCount: number
  customerName: string
  customerEmail: string
  paymentMethod: string
  shippingAddress: {
    city?: string
    state?: string
    pincode?: string
  }
}): Promise<boolean> {
  const shortOrderId = order.id.slice(0, 8).toUpperCase()

  const embed: DiscordEmbed = {
    title: '🛒 New Order Placed!',
    description: `Order **#${shortOrderId}** has been placed`,
    color: 0x22c55e, // Green
    fields: [
      {
        name: '👤 Customer',
        value: order.customerName || 'Unknown',
        inline: true,
      },
      {
        name: '📧 Email',
        value: order.customerEmail || 'N/A',
        inline: true,
      },
      {
        name: '💰 Total',
        value: `₹${order.total.toLocaleString('en-IN')}`,
        inline: true,
      },
      {
        name: '📦 Items',
        value: `${order.itemCount} item(s)`,
        inline: true,
      },
      {
        name: '💳 Payment',
        value: order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment',
        inline: true,
      },
      {
        name: '📍 Location',
        value: [order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.pincode]
          .filter(Boolean)
          .join(', ') || 'N/A',
        inline: true,
      },
    ],
    footer: {
      text: 'Wheels Frames',
    },
    timestamp: new Date().toISOString(),
  }

  return sendDiscordMessage(DISCORD_ORDERS_WEBHOOK_URL, { embeds: [embed] })
}

/**
 * Send notification when a new user signs up
 */
export async function notifyNewSignup(user: {
  email: string
  name?: string
  provider?: string
}): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: '🎉 New User Signup!',
    description: `A new user has joined Wheels Frames`,
    color: 0x3b82f6, // Blue
    fields: [
      {
        name: '👤 Name',
        value: user.name || 'Not provided',
        inline: true,
      },
      {
        name: '📧 Email',
        value: user.email,
        inline: true,
      },
      {
        name: '🔐 Method',
        value: user.provider || 'Email/Password',
        inline: true,
      },
    ],
    footer: {
      text: 'Wheels Frames',
    },
    timestamp: new Date().toISOString(),
  }

  return sendDiscordMessage(DISCORD_SIGNUPS_WEBHOOK_URL, { embeds: [embed] })
}

/**
 * Send a custom notification
 * @param channel - 'orders' or 'signups' to specify which Discord channel
 */
export async function notifyDiscord(
  title: string,
  description: string,
  color: number = 0x6b7280,
  fields?: DiscordEmbed['fields'],
  channel: 'orders' | 'signups' = 'orders'
): Promise<boolean> {
  const embed: DiscordEmbed = {
    title,
    description,
    color,
    fields,
    footer: {
      text: 'Wheels Frames',
    },
    timestamp: new Date().toISOString(),
  }

  const webhookUrl = channel === 'signups' ? DISCORD_SIGNUPS_WEBHOOK_URL : DISCORD_ORDERS_WEBHOOK_URL
  return sendDiscordMessage(webhookUrl, { embeds: [embed] })
}
