import { NextResponse } from 'next/server'
import { normalizeTransaction, pagnovo } from '@/lib/pagnovo'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = String(body.name ?? '').trim().slice(0, 100)
    const email = String(body.email ?? '').trim().toLowerCase().slice(0, 160)
    const phone = String(body.phone ?? '').replace(/[^0-9+]/g, '').slice(0, 16)
    const orderId = String(body.orderId ?? request.headers.get('idempotency-key') ?? '').slice(0, 80)

    if (name.length < 3 || !emailPattern.test(email) || phone.length < 10 || !orderId) {
      return NextResponse.json({ message: 'Revisa tus datos e inténtalo nuevamente.' }, { status: 400 })
    }

    const { response, data, traceId } = await pagnovo('/transactions/v2/purchase', {
      method: 'POST',
      body: JSON.stringify({
        amount: 41900,
        currency: 'MXN',
        paymentMethod: 'SPEI',
        externalId: `mxn-419-${orderId}`,
        payer: { name, email, phone },
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ message: data.message ?? 'No fue posible generar la transferencia.', traceId }, { status: response.status })
    }
    const transaction = normalizeTransaction(data, traceId)
    if (!transaction.id || !transaction.clabe) {
      return NextResponse.json({ message: 'La respuesta no incluyó una CLABE válida.', traceId }, { status: 502 })
    }
    return NextResponse.json(transaction)
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error && error.name === 'AbortError' ? 'El servicio tardó demasiado. Inténtalo de nuevo.' : 'No fue posible conectar con el servicio de pago.' }, { status: 502 })
  }
}
