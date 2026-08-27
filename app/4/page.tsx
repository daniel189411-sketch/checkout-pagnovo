import { Checkout } from '@/components/checkout'

export default function Page() {
  return (
    <Checkout
      apiBase="/api/pagnovo-4"
      amount={152}
      storeName="CasaPráctica"
      productName="Kit de 2 mesas plegables de 1.80 m"
      productSubtitle="Plegables · Tipo maleta con asa"
      productImage="/images/folding-tables.png"
      productImageAlt="Kit de dos mesas plegables blancas de 1.80 metros"
    />
  )
}
