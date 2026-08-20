import { NextResponse } from 'next/server'
import { normalizeTransaction, pagnovo } from '@/lib/pagnovo'

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id')?.trim()
  if (!id || id.length > 120 || !/^[a-zA-Z0-9_-]+$/.test(id)) return NextResponse.json({ message: 'Identificador inválido.' }, { status: 400 })
  try {
    const { response, data, traceId } = await pagnovo(`/transactions/${encodeURIComponent(id)}`)
    if (!response.ok) return NextResponse.json({ message: data.message ?? 'No fue posible consultar el pago.', traceId }, { status: response.status })
    return NextResponse.json(normalizeTransaction(data, traceId))
  } catch {
    return NextResponse.json({ message: 'No fue posible consultar el pago.' }, { status: 502 })
  }
}
