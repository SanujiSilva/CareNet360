"use client"

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { startCheckoutSession } from "@/app/actions/stripe"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StripeCheckoutProps {
  productId: string
  appointmentId?: string
  onPaymentComplete?: (transactionId: string) => Promise<void> // ✅ new callback prop
}

export default function StripeCheckout({ productId, appointmentId, onPaymentComplete }: StripeCheckoutProps) {
  // ✅ This function must always return a string
  const startCheckout = async (): Promise<string> => {
    const secret = await startCheckoutSession(productId, appointmentId)
    if (!secret || typeof secret !== "string") throw new Error("Failed to start checkout session.")
    return secret
  }

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{
          fetchClientSecret: startCheckout,
          // ✅ Triggered when payment is completed and user sees the OK/Done button
          onComplete: async () => {
            const transactionId = "stripe-" + Date.now()

            // Call parent callback to record in DB and refresh history
            if (onPaymentComplete) {
              await onPaymentComplete(transactionId)
            }
          },
        }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
