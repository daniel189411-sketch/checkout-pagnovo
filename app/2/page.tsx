import { Checkout } from '@/components/checkout'
import { MetaPixel } from '@/components/meta-pixel'

export default function Page() {
  return <><MetaPixel pixelId="1281889474066272" /><Checkout apiBase="/api/pagnovo-2" trackCheckout /></>
}
