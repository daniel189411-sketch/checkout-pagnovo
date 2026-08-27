import 'server-only'

const API_URL = process.env.PAGNOVO_API_URL ?? 'https://api.pagnovo.com'

export async function pagnovo(path: string, init?: RequestInit, secretKey: 'PAGNOVO_SECRET_KEY' | 'PAGNOVO_SECRET_KEY_2' = 'PAGNOVO_SECRET_KEY') {
  const secret = process.env[secretKey]
  if (!secret) throw new Error(`${secretKey} não configurada`)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
      headers: {
        Authorization: `Basic ${Buffer.from(`secret:${secret}`).toString('base64')}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    })
    const data = await response.json().catch(() => ({}))
    return { response, data, traceId: response.headers.get('x-trace-id') ?? undefined }
  } finally { clearTimeout(timeout) }
}

export function normalizeTransaction(data: Record<string, any>, traceId?: string) {
  const transaction = data.transaction ?? data.data ?? data
  const clabe = transaction.clabe ?? transaction.payment?.clabe ?? transaction.bankAccount?.clabe
  return {
    id: String(transaction.id ?? transaction.transactionId ?? transaction.externalId ?? ''),
    status: String(transaction.status ?? 'PENDING'),
    clabe: clabe ? String(clabe) : '',
    beneficiary: transaction.beneficiary ?? transaction.accountHolder ?? transaction.payment?.beneficiary,
    reference: transaction.reference ?? transaction.paymentReference ?? transaction.payment?.reference,
    traceId,
  }
}
