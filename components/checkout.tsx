'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Check, Clipboard, LockKeyhole, ShieldCheck } from 'lucide-react'
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
    event.preventDefault()
    setError(''); setLoading(true)
    const form = new FormData(event.currentTarget)
    const orderId = crypto.randomUUID()
    try {
      const response = await fetch('/api/pagnovo/create', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': orderId }, body: JSON.stringify({ name: form.get('name'), email: form.get('email'), phone: form.get('phone'), orderId }) })
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

  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-card"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><span className="font-serif text-xl font-bold">Impulso</span><span className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><LockKeyhole className="size-4" /> Pago seguro</span></div></header>
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-8 lg:grid-cols-[1fr_440px] lg:py-14">
      <section className="flex flex-col gap-8 lg:py-5"><div className="flex flex-col gap-4"><p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Acceso inmediato</p><h1 className="max-w-2xl font-serif text-4xl font-bold leading-tight text-balance md:text-5xl">Da el siguiente paso con un método práctico y comprobado.</h1><p className="max-w-xl text-lg leading-relaxed text-muted-foreground">Obtén el contenido completo, recursos de apoyo y una ruta clara para avanzar desde hoy.</p></div>
        <ul className="grid gap-4 sm:grid-cols-2">{['Acceso digital inmediato', 'Contenido paso a paso', 'Actualizaciones incluidas', 'Garantía de 7 días'].map(item => <li key={item} className="flex items-center gap-3 text-sm font-semibold"><span className="flex size-7 items-center justify-center rounded-full bg-accent text-accent-foreground"><Check className="size-4" /></span>{item}</li>)}</ul>
        <div className="rounded-2xl border border-border bg-card p-5"><p className="font-serif text-lg font-semibold">Compra protegida</p><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Tienes 7 días para conocer el contenido. Si no es para ti, solicita la devolución conforme a los términos de la oferta.</p></div>
      </section>
      <section className="rounded-3xl border border-border bg-card p-5 shadow-xl shadow-primary/5 sm:p-7" aria-labelledby="checkout-title">
        {!payment ? <form onSubmit={submit} className="flex flex-col gap-6"><div className="flex items-start justify-between gap-4 border-b border-border pb-5"><div><h2 id="checkout-title" className="font-serif text-2xl font-bold">Finaliza tu compra</h2><p className="mt-1 text-sm text-muted-foreground">Completa tus datos para pagar por SPEI.</p></div><ShieldCheck className="size-7 text-primary" /></div>
          <div className="flex flex-col gap-4"><Field label="Nombre completo" name="name" autoComplete="name" placeholder="Tu nombre" /><Field label="Correo electrónico" name="email" type="email" autoComplete="email" placeholder="tu@correo.com" /><Field label="Teléfono" name="phone" type="tel" autoComplete="tel" placeholder="+52 55 1234 5678" /></div>
          <div className="rounded-2xl bg-secondary p-4"><div className="flex justify-between gap-4 text-sm"><span className="text-muted-foreground">Producto digital</span><span>MXN $419.00</span></div><div className="mt-3 flex items-end justify-between gap-4 border-t border-border pt-3"><strong>Total</strong><strong className="font-serif text-2xl">MXN $419.00</strong></div></div>
          {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p>}<Button type="submit" size="lg" disabled={loading} className="h-14 rounded-xl text-base font-bold">{loading ? 'Generando pago seguro…' : 'Pagar MXN $419 por SPEI'}</Button><p className="text-center text-xs leading-relaxed text-muted-foreground">Tus datos se transmiten de forma segura. El monto final es MXN $419.00, sin cargos ocultos.</p>
        </form> : <div className="flex flex-col gap-6" aria-live="polite"><div className="flex flex-col gap-2"><p className="text-sm font-bold uppercase tracking-[0.16em] text-primary">Transferencia SPEI</p><h2 id="checkout-title" className="font-serif text-3xl font-bold">Realiza tu transferencia</h2><p className="text-sm leading-relaxed text-muted-foreground">Copia la CLABE y transfiere exactamente el monto indicado desde tu banca móvil.</p></div><div className="rounded-2xl bg-secondary p-5 text-center"><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">CLABE</p><p className="mt-2 break-all font-mono text-xl font-bold tracking-wider">{payment.clabe}</p><Button type="button" variant="outline" onClick={copyClabe} className="mt-4 w-full rounded-xl"><Clipboard />{copied ? 'CLABE copiada' : 'Copiar CLABE'}</Button></div><dl className="flex flex-col gap-3 text-sm"><Row label="Monto exacto" value="MXN $419.00" />{payment.beneficiary && <Row label="Beneficiario" value={payment.beneficiary} />}{payment.reference && <Row label="Referencia" value={payment.reference} />}</dl><div className="rounded-xl border border-border p-4"><p className="font-semibold">Estado: {['PAID','APPROVED'].includes(payment.status.toUpperCase()) ? 'Pago confirmado' : 'Esperando transferencia'}</p><p className="mt-1 text-sm text-muted-foreground">La confirmación se actualizará automáticamente.</p></div>{payment.traceId && <p className="text-center text-xs text-muted-foreground">Soporte: {payment.traceId}</p>}</div>}
      </section>
    </div>
  </main>
}

function Field(props: { label: string; name: string; type?: string; autoComplete: string; placeholder: string }) { return <label className="flex flex-col gap-2 text-sm font-semibold">{props.label}<input required {...props} maxLength={160} className="h-12 rounded-xl border border-input bg-background px-4 text-base font-normal outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15" /></label> }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-4"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-semibold">{value}</dd></div> }
