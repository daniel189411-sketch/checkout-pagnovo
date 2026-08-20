import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Lora } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' })

export const metadata: Metadata = {
  title: 'Finaliza tu compra | Impulso',
  description: 'Checkout seguro en México por MXN $419.00 mediante transferencia SPEI.',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f6f8f7',
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-MX" className="bg-background"><body className={`${geist.variable} ${lora.variable} font-sans antialiased`}>{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
