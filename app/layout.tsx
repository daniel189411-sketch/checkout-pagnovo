import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Lora } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' })

export const metadata: Metadata = {
  title: 'Finaliza tu compra | BetaCab México',
  description: 'Compra tu carro profesional BetaCab con 333 herramientas por MXN $419.00 y envío rastreado gratis.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f6f8f7',
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-MX" className="bg-background"><body className={`${geist.variable} ${lora.variable} font-sans antialiased`}>{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
