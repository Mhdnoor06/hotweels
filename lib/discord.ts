/**
 * Discord Webhook Integration for Wheels Frames
 * Sends notifications to Discord when orders are placed or users sign up
 */

// Get webhook URLs at runtime (not module load time) for Edge compatibility
function getOrdersWebhookUrl() {
  return process.env.DISCORD_ORDERS_WEBHOOK_URL
}

function getSignupsWebhookUrl() {
  return process.env.DISCORD_SIGNUPS_WEBHOOK_URL
}

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
  console.log('Discord: Attempting to send message, webhook URL exists:', !!webhookUrl)

  if (!webhookUrl) {
    console.warn('Discord webhook URL not configured - check environment variables')
    return false
  }

  try {
    console.log('Discord: Sending to webhook...')
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Discord webhook failed:', response.status, errorText)
      return false
    }

    console.log('Discord: Message sent successfully')
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
  const location = [order.shippingAddress.city, order.shippingAddress.state]
    .filter(Boolean)
    .join(', ') || 'N/A'
  const payment = order.paymentMethod === 'cod' ? 'COD' : 'Online'

  const embed: DiscordEmbed = {
    title: `New Order #${shortOrderId}`,
    color: 0x22c55e,
    description: [
      `**${order.customerName || 'Customer'}** placed an order`,
      ``,
      `Amount: **₹${order.total.toLocaleString('en-IN')}** (${order.itemCount} items)`,
      `Payment: ${payment}`,
      `Location: ${location}`,
      `Email: ${order.customerEmail || 'N/A'}`,
    ].join('\n'),
    timestamp: new Date().toISOString(),
  }

  return sendDiscordMessage(getOrdersWebhookUrl(), { embeds: [embed] })
}

/**
 * Send notification when a new user signs up
 */
export async function notifyNewSignup(user: {
  email: string
  name?: string
  provider?: string
}): Promise<boolean> {
  const provider = user.provider || 'Email'
  const name = user.name || 'New user'

  const embed: DiscordEmbed = {
    title: 'New Signup',
    color: 0x3b82f6,
    description: [
      `**${name}** signed up via ${provider}`,
      ``,
      `Email: ${user.email}`,
    ].join('\n'),
    timestamp: new Date().toISOString(),
  }

  return sendDiscordMessage(getSignupsWebhookUrl(), { embeds: [embed] })
}

/**
 * Send a custom notification
 * @param channel - 'orders' or 'signups' to specify which Discord channel
 */
export async function notifyDiscord(
  title: string,
  description: string,
  color: number = 0x6b7280,
  channel: 'orders' | 'signups' = 'orders'
): Promise<boolean> {
  const embed: DiscordEmbed = {
    title,
    description,
    color,
    timestamp: new Date().toISOString(),
  }

  const webhookUrl = channel === 'signups' ? getSignupsWebhookUrl() : getOrdersWebhookUrl()
  return sendDiscordMessage(webhookUrl, { embeds: [embed] })
}
