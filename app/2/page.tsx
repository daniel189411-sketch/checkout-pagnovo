import { Checkout } from '@/components/checkout'
import { MetaPixel } from '@/components/meta-pixel'

export default function Page() {
  return <><MetaPixel /><Checkout apiBase="/api/pagnovo-2" trackCheckout /></>
}
