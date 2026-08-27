import 'server-only'

import { createHash } from 'node:crypto'

const PIXEL_ID = '1004239935961760'

function sha256(value: string) {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export async function sendMetaPurchase({
  transactionId,
  sourceUrl,
  userAgent,
  clientIp,
}: {
  transactionId: string
  sourceUrl: string
  userAgent?: string | null
  clientIp?: string | null
}) {
  const token = process.env.META_CONVERSIONS_API_TOKEN
  if (!token) return

  const userData: Record<string, string | string[]> = {
    external_id: [sha256(transactionId)],
  }
  if (userAgent) userData.client_user_agent = userAgent
  if (clientIp) userData.client_ip_address = clientIp.split(',')[0].trim()

  try {
    await fetch(`https://graph.facebook.com/v23.0/${PIXEL_ID}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
      body: JSON.stringify({
        access_token: token,
        data: [{
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: transactionId,
          action_source: 'website',
          event_source_url: sourceUrl,
          user_data: userData,
          custom_data: {
            value: 419,
            currency: 'MXN',
            content_ids: ['betacab-333'],
            content_type: 'product',
          },
        }],
      }),
    })
  } catch {
    // Analytics must never block payment confirmation.
  }
}
