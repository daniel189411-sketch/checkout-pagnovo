'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Check, ChevronDown, Clipboard, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Payment = { id: string; status: string; clabe: string; beneficiary?: string; reference?: string; traceId?: string }
const finished = new Set(['PAID', 'APPROVED', 'REJECTED', 'REFUNDED', 'CANCELED', 'EXPIRED'])

export function Checkout() {
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!payment || finished.has(payment.status.toUpperCase())) return
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/pagnovo/status?id=${encodeURIComponent(payment.id)}`, { cache: 'no-store' })
      if (response.ok) {
        const next = (await response.json()) as Payment
        setPayment((current) => current ? { ...current, ...next } : current)
      }
    }, 5000)
    return () => window.clearInterval(timer)
  }, [payment?.id, payment?.status])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setLoading(true)
    const form = new FormData(event.currentTarget)
    const orderId = crypto.randomUUID()
    try {
      const response = await fetch('/api/pagnovo/create', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': orderId }, body: JSON.stringify({ name: form.get('name'), email: form.get('email'), phone: form.get('phone'), document: form.get('document'), orderId }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.message || 'No fue posible iniciar el pago.')
      setPayment(body)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Ocurrió un error inesperado.') }
    finally { setLoading(false) }
  }

  async function copyClabe() {
    if (!payment) return
    await navigator.clipboard.writeText(payment.clabe)
    setCopied(true); window.setTimeout(() => setCopied(false), 1800)
  }

  return <main className="min-h-screen bg-card text-foreground">
    <header className="border-b border-border"><div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5"><span className="text-2xl font-bold tracking-tight">BetaCab</span><span className="flex items-center gap-2 text-sm text-muted-foreground"><LockKeyhole className="size-4" /> Pago seguro</span></div></header>
    <MobileSummary />
    <div className="mx-auto grid min-h-[calc(100vh-77px)] max-w-5xl lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
      <section className="px-5 py-8 lg:pr-16 lg:py-12">
        {!payment ? <form onSubmit={submit} className="flex flex-col gap-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="text-primary">Carrito</span><span>/</span><span className="font-medium text-foreground">Información</span><span>/</span><span>Pago</span></div>
          <div className="flex flex-col gap-4"><div className="flex items-baseline justify-between gap-4"><h1 className="text-xl font-semibold">Información de contacto</h1><span className="text-sm text-muted-foreground">Pago único</span></div><Field label="Correo electrónico" name="email" type="email" autoComplete="email" placeholder="Correo electrónico" /></div>
          <div className="flex flex-col gap-4"><h2 className="text-xl font-semibold">Datos del comprador</h2><Field label="Nombre completo" name="name" autoComplete="name" placeholder="Nombre completo" /><Field label="Teléfono" name="phone" type="tel" autoComplete="tel" placeholder="Teléfono (+52)" /><Field label="RFC o CURP" name="document" autoComplete="off" placeholder="RFC o CURP" /></div>
          <div className="flex flex-col gap-4"><h2 className="text-xl font-semibold">Pago</h2><p className="text-sm text-muted-foreground">Todas las transacciones son seguras y están cifradas.</p><div className="overflow-hidden rounded-lg border border-primary"><div className="flex items-center justify-between gap-4 bg-secondary px-4 py-4"><span className="font-medium">Transferencia SPEI</span><span className="rounded border border-border bg-card px-2 py-1 text-xs font-semibold">SPEI</span></div><div className="flex flex-col items-center gap-3 border-t border-primary bg-background px-6 py-6 text-center"><ShieldCheck className="size-8 text-primary" /><p className="max-w-sm text-sm leading-relaxed text-muted-foreground">Después de confirmar, recibirás una CLABE para completar tu transferencia desde cualquier banco mexicano.</p></div></div></div>
          {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" disabled={loading} className="h-14 rounded-lg text-base font-semibold">{loading ? 'Preparando tu pago…' : 'Pagar ahora · MXN $419.00'}</Button>
          <FooterLinks />
        </form> : <PaymentDetails payment={payment} copied={copied} copyClabe={copyClabe} />}
      </section>
      <OrderSummary />
    </div>
  </main>
}

function Field(props: { label: string; name: string; type?: string; autoComplete: string; placeholder: string }) { return <label><span className="sr-only">{props.label}</span><input required {...props} maxLength={160} className="h-14 w-full rounded-lg border border-input bg-card px-4 text-base outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20" /></label> }
function MobileSummary() { return <details className="border-b border-border bg-background lg:hidden"><summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4"><span className="flex items-center gap-2 text-sm font-medium text-primary">Mostrar resumen del pedido <ChevronDown className="size-4" /></span><strong>MXN $419.00</strong></summary><div className="px-5 pb-5"><ProductRow /><Totals /></div></details> }
function OrderSummary() { return <aside className="hidden border-l border-border bg-background px-10 py-12 lg:block"><div className="sticky top-8 flex flex-col gap-6"><ProductRow /><Totals /><div className="flex flex-col gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-2"><Check className="size-4 text-primary" /> Envío rastreado y asegurado</span><span className="flex items-center gap-2"><Check className="size-4 text-primary" /> Garantía de devolución de 30 días</span><span className="flex items-center gap-2"><Check className="size-4 text-primary" /> Compra protegida y pago seguro</span></div></div></aside> }
function ProductRow() { return <div className="flex items-center gap-4"><div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-card"><img src="/images/betacab.webp" alt="Carro de herramientas profesional BetaCab en color naranja y negro" className="size-full object-cover" /><span className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-foreground text-xs text-card">1</span></div><div className="min-w-0 flex-1"><p className="font-medium text-pretty">BetaCab — Carro profesional para herramientas</p><p className="text-sm text-muted-foreground">Con ruedas · Kit completo de 333 piezas</p></div><span className="text-sm font-medium">$419.00</span></div> }
function Totals() { return <div className="flex flex-col gap-3 border-t border-border pt-5 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>$419.00</span></div><div className="flex justify-between"><span>Envío con rastreo</span><span className="font-medium text-primary">Gratis</span></div><div className="flex items-end justify-between border-t border-border pt-5"><strong className="text-base">Total</strong><div className="flex items-baseline gap-2"><span className="text-xs text-muted-foreground">MXN</span><strong className="text-2xl">$419.00</strong></div></div></div> }
function PaymentDetails({ payment, copied, copyClabe }: { payment: Payment; copied: boolean; copyClabe: () => void }) { return <div className="flex flex-col gap-6" aria-live="polite"><p className="text-sm text-muted-foreground">Información / <span className="text-foreground">Pago</span></p><div><h1 className="text-2xl font-semibold">Completa tu transferencia</h1><p className="mt-2 text-sm text-muted-foreground">Transfiere exactamente MXN $419.00 usando los datos siguientes.</p></div><div className="rounded-lg border border-border p-5 text-center"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CLABE</p><p className="mt-3 break-all font-mono text-xl font-semibold tracking-wider">{payment.clabe}</p><Button type="button" variant="outline" onClick={copyClabe} className="mt-5 w-full"><Clipboard />{copied ? 'CLABE copiada' : 'Copiar CLABE'}</Button></div><dl className="flex flex-col gap-3 rounded-lg bg-background p-5 text-sm"><Row label="Monto exacto" value="MXN $419.00" />{payment.beneficiary && <Row label="Beneficiario" value={payment.beneficiary} />}{payment.reference && <Row label="Referencia" value={payment.reference} />}</dl><div className="rounded-lg border border-border p-4"><p className="font-medium">{['PAID','APPROVED'].includes(payment.status.toUpperCase()) ? 'Pago confirmado' : 'Esperando transferencia'}</p><p className="mt-1 text-sm text-muted-foreground">Actualizaremos esta página automáticamente.</p></div>{payment.traceId && <p className="text-xs text-muted-foreground">ID de soporte: {payment.traceId}</p>}</div> }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{value}</dd></div> }
function FooterLinks() { return <nav aria-label="Políticas" className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5 text-xs text-primary"><a href="#">Política de reembolso</a><a href="#">Privacidad</a><a href="#">Términos</a></nav> }
