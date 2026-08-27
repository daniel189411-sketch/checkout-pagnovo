'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Check, Clipboard, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { trackPurchase } from '@/components/meta-pixel'

type Payment = { id: string; status: string; clabe: string; beneficiary?: string; reference?: string; traceId?: string }
const finished = new Set(['PAID', 'APPROVED', 'REJECTED', 'REFUNDED', 'CANCELED', 'EXPIRED'])

export function Checkout() {
  const [payment, setPayment] = useState<Payment | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)

  useEffect(() => {
    if (payment && ['PAID', 'APPROVED'].includes(payment.status.toUpperCase())) {
      trackPurchase(payment.id)
    }
  }, [payment?.id, payment?.status])

  useEffect(() => {
    if (!payment || finished.has(payment.status.toUpperCase())) return
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/pagnovo/status?id=${encodeURIComponent(payment.id)}`, { cache: 'no-store' })
      if (response.ok) {
        const next = (await response.json()) as Partial<Payment>
        setPayment((current) => current ? {
          ...current,
          ...next,
          clabe: next.clabe?.trim() || current.clabe,
        } : current)
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
    setCopyError(false)
    try {
      if (navigator.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(payment.clabe)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = payment.clabe
        textArea.setAttribute('readonly', '')
        textArea.style.position = 'fixed'
        textArea.style.opacity = '0'
        document.body.appendChild(textArea)
        textArea.select()
        const copiedSuccessfully = document.execCommand('copy')
        textArea.remove()
        if (!copiedSuccessfully) throw new Error('Copy command failed')
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      setCopyError(true)
    }
  }

  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-card"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><span className="text-2xl font-bold tracking-tight">BetaCab</span><span className="flex items-center gap-2 text-sm text-muted-foreground"><LockKeyhole className="size-4" /> Pago 100% seguro</span></div></header>
    <MobileSummary />
    <div className="mx-auto flex min-h-[calc(100vh-77px)] max-w-6xl flex-col-reverse lg:flex-row">
      <section className="bg-card px-5 py-8 lg:w-[58%] lg:border-l lg:border-border lg:px-14 lg:py-12">
        {!payment ? <form onSubmit={submit} className="mx-auto flex max-w-xl flex-col gap-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="text-primary">Carrito</span><span>›</span><span className="font-medium text-foreground">Información</span><span>›</span><span>Pago</span></div>
          <div className="flex flex-col gap-4"><div className="flex items-baseline justify-between gap-4"><h1 className="text-xl font-semibold">Información de contacto</h1><span className="text-sm text-muted-foreground">Pago único</span></div><Field label="Correo electrónico" name="email" type="email" autoComplete="email" placeholder="Correo electrónico" /></div>
          <div className="flex flex-col gap-4"><h2 className="text-xl font-semibold">Datos del comprador</h2><Field label="Nombre completo" name="name" autoComplete="name" placeholder="Nombre completo" /><Field label="Teléfono" name="phone" type="tel" autoComplete="tel" placeholder="Teléfono (+52)" /><Field label="RFC o CURP" name="document" autoComplete="off" placeholder="RFC o CURP" /></div>
          <div className="flex flex-col gap-4"><div><h2 className="text-xl font-semibold">Dirección de envío</h2><p className="mt-1 text-sm text-muted-foreground">Ingresa la dirección donde deseas recibir tu BetaCab.</p></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Código postal" name="postalCode" autoComplete="postal-code" placeholder="Código postal" inputMode="numeric" pattern="[0-9]{5}" maxLength={5} /><Field label="Estado" name="state" autoComplete="address-level1" placeholder="Estado" /><Field label="Municipio o alcaldía" name="city" autoComplete="address-level2" placeholder="Municipio o alcaldía" /><Field label="Colonia" name="neighborhood" autoComplete="address-level3" placeholder="Colonia" /></div><Field label="Calle" name="street" autoComplete="address-line1" placeholder="Calle" /><div className="grid grid-cols-2 gap-4"><Field label="Número exterior" name="exteriorNumber" autoComplete="address-line2" placeholder="Núm. exterior" /><Field label="Número interior" name="interiorNumber" autoComplete="address-line3" placeholder="Núm. interior (opcional)" required={false} /></div></div>
          <div className="flex flex-col gap-4"><h2 className="text-xl font-semibold">Pago</h2><p className="text-sm text-muted-foreground">Todas las transacciones son seguras y están cifradas.</p><div className="overflow-hidden rounded-lg border border-primary"><div className="flex items-center justify-between gap-4 bg-secondary px-4 py-4"><span className="font-medium">Transferencia SPEI</span><span className="rounded border border-border bg-card px-2 py-1 text-xs font-semibold">SPEI</span></div><div className="flex flex-col items-center gap-3 border-t border-primary bg-background px-6 py-6 text-center"><ShieldCheck className="size-8 text-primary" /><p className="max-w-sm text-sm leading-relaxed text-muted-foreground">Después de confirmar, recibirás una CLABE para completar tu transferencia desde cualquier banco mexicano.</p><p className="rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground">Precio promocional de MXN $419.00 válido exclusivamente pagando por SPEI.</p></div></div></div>
          {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" disabled={loading} className="h-14 rounded-md text-base font-bold shadow-sm">{loading ? 'Preparando tu pago…' : 'FINALIZAR COMPRA · MXN $419.00'}</Button>
          <FooterLinks />
        </form> : <PaymentDetails payment={payment} copied={copied} copyError={copyError} copyClabe={copyClabe} />}
      </section>
      <OrderSummary />
    </div>
  </main>
}

function Field({ label, required = true, maxLength = 160, ...inputProps }: { label: string; name: string; type?: string; autoComplete: string; placeholder: string; required?: boolean; maxLength?: number; inputMode?: 'numeric'; pattern?: string }) { return <label><span className="sr-only">{label}</span><input required={required} maxLength={maxLength} {...inputProps} aria-label={label} className="h-14 w-full rounded-md border border-input bg-card px-4 text-base outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/15" /></label> }
function MobileSummary() { return <section aria-labelledby="mobile-order-summary" className="border-b border-border bg-card px-5 py-5 lg:hidden"><div className="flex flex-col gap-5"><div className="flex items-center justify-between gap-4"><h2 id="mobile-order-summary" className="font-semibold">Resumen del pedido</h2><span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">Oferta limitada</span></div><ProductRow /><Totals /><p className="rounded-md border border-primary/25 bg-secondary px-3 py-2 text-center text-sm font-semibold text-secondary-foreground">Últimas unidades al precio promocional SPEI de MXN $419.00.</p></div></section> }
function OrderSummary() { return <aside className="hidden bg-background px-12 py-12 lg:block lg:w-[42%]"><div className="sticky top-8 flex flex-col gap-7"><div className="flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">Resumen del pedido</h2><span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">Oferta limitada</span></div><ProductRow /><Totals /><p className="rounded-md border border-primary/25 bg-secondary px-3 py-2 text-center text-sm font-semibold text-secondary-foreground">Últimas unidades al precio promocional SPEI de MXN $419.00.</p><div className="flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground"><span className="flex items-center gap-3"><Check className="size-4 text-primary" /> Envío rastreado y asegurado</span><span className="flex items-center gap-3"><Check className="size-4 text-primary" /> Garantía de devolución de 30 días</span><span className="flex items-center gap-3"><Check className="size-4 text-primary" /> Compra protegida y pago seguro</span></div></div></aside> }
function ProductRow() { return <div className="flex items-center gap-4"><div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-border bg-card"><img src="/images/betacab.webp" alt="Carro de herramientas profesional BetaCab en color naranja y negro" className="size-full object-cover" /><span className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-foreground text-xs text-card">1</span></div><div className="min-w-0 flex-1"><p className="font-medium text-pretty">BetaCab — Carro profesional para herramientas</p><p className="text-sm text-muted-foreground">Con ruedas · Kit completo de 333 piezas</p></div><span className="text-sm font-medium">$419.00</span></div> }
function Totals() { return <div className="flex flex-col gap-3 border-t border-border pt-5 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>$419.00</span></div><div className="flex justify-between"><span>Envío con rastreo</span><span className="font-medium text-primary">Gratis</span></div><div className="flex items-end justify-between border-t border-border pt-5"><strong className="text-base">Total</strong><div className="flex items-baseline gap-2"><span className="text-xs text-muted-foreground">MXN</span><strong className="text-2xl">$419.00</strong></div></div></div> }
function PaymentDetails({ payment, copied, copyError, copyClabe }: { payment: Payment; copied: boolean; copyError: boolean; copyClabe: () => void }) { return <div className="flex flex-col gap-6" aria-live="polite"><p className="text-sm text-muted-foreground">Información / <span className="text-foreground">Pago</span></p><div><h1 className="text-2xl font-semibold text-balance">Completa tu transferencia SPEI</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Abre la aplicación de tu banco y transfiere exactamente <strong className="text-foreground">MXN $419.00</strong> a la CLABE indicada.</p></div><div className="overflow-hidden rounded-xl border border-border bg-background"><div className="p-5 text-center"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CLABE interbancaria</p><p className="mt-3 select-all break-all font-mono text-xl font-semibold tracking-wider text-foreground">{payment.clabe}</p></div><Button type="button" onClick={copyClabe} className="h-14 w-full rounded-none text-base font-semibold">{copied ? <Check data-icon="inline-start" /> : <Clipboard data-icon="inline-start" />}{copied ? 'CLABE copiada' : 'Copiar CLABE'}</Button></div>{copyError && <p role="alert" className="text-sm text-destructive">No pudimos copiarla automáticamente. Mantén presionado el número para copiarlo.</p>}<section className="flex flex-col gap-4"><h2 className="text-lg font-semibold">¿Cómo pagar?</h2><ol className="flex flex-col gap-4"><PaymentStep number="1" title="Copia la CLABE" description="Toca el botón de arriba para copiar los 18 dígitos." /><PaymentStep number="2" title="Abre la app de tu banco" description="Elige Transferir, SPEI o Nueva transferencia y pega la CLABE." /><PaymentStep number="3" title="Envía exactamente MXN $419.00" description="Confirma la operación y vuelve aquí. Detectaremos tu pago automáticamente." /></ol></section><dl className="flex flex-col gap-3 rounded-lg bg-background p-5 text-sm"><Row label="Monto exacto" value="MXN $419.00" />{payment.beneficiary && <Row label="Beneficiario" value={payment.beneficiary} />}{payment.reference && <Row label="Referencia" value={payment.reference} />}</dl><div className="rounded-lg border border-border p-4"><p className="font-medium">{['PAID','APPROVED'].includes(payment.status.toUpperCase()) ? 'Pago confirmado' : 'Esperando transferencia'}</p><p className="mt-1 text-sm text-muted-foreground">No cierres esta página. El estado se actualizará automáticamente.</p></div>{payment.traceId && <p className="text-xs text-muted-foreground">ID de soporte: {payment.traceId}</p>}</div> }
function PaymentStep({ number, title, description }: { number: string; title: string; description: string }) { return <li className="flex gap-3"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-primary">{number}</span><div><p className="font-medium">{title}</p><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p></div></li> }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium">{value}</dd></div> }
function FooterLinks() { return <nav aria-label="Políticas" className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-5 text-xs text-primary"><a href="#">Política de reembolso</a><a href="#">Privacidad</a><a href="#">Términos</a></nav> }
