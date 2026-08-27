import { NextResponse } from 'next/server'
import { normalizeTransaction, pagnovo } from '@/lib/pagnovo'
import { sendMetaPurchase } from '@/lib/meta-conversions'

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')?.trim()
  if (!id || id.length > 120 || !/^[a-zA-Z0-9_-]+$/.test(id)) return NextResponse.json({ message: 'Identificador inválido.' }, { status: 400 })
  try {
    const { response, data, traceId } = await pagnovo(`/transactions/${encodeURIComponent(id)}`)
    if (!response.ok) return NextResponse.json({ message: data.message ?? 'No fue posible consultar el pago.', traceId }, { status: response.status })
    const transaction = normalizeTransaction(data, traceId)
    if (['PAID', 'APPROVED'].includes(transaction.status.toUpperCase())) {
      const url = new URL(request.url)
      await sendMetaPurchase({
        transactionId: transaction.id,
        sourceUrl: `${url.origin}/`,
        userAgent: request.headers.get('user-agent'),
        clientIp: request.headers.get('x-forwarded-for'),
      })
    }
    return NextResponse.json(transaction)
  } catch {
    return NextResponse.json({ message: 'No fue posible consultar el pago.' }, { status: 502 })
  }
}
