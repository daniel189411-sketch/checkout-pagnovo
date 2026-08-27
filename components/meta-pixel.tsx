'use client'

import Script from 'next/script'

const PIXEL_ID = '1004239935961760'

export function MetaPixel() {
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
    </Script>
  )
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export function trackInitiateCheckout(eventId: string, value: number) {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq('track', 'InitiateCheckout', { value, currency: 'MXN', content_ids: ['betacab-333'], content_type: 'product', num_items: 1 }, { eventID: eventId })
}

export function trackPurchase(transactionId: string, value: number) {
  if (typeof window === 'undefined' || !window.fbq) return
  const storageKey = `meta-purchase-${transactionId}`
  if (window.sessionStorage.getItem(storageKey)) return
  window.fbq('track', 'Purchase', { value, currency: 'MXN', content_ids: ['betacab-333'], content_type: 'product' }, { eventID: transactionId })
  window.sessionStorage.setItem(storageKey, '1')
}
