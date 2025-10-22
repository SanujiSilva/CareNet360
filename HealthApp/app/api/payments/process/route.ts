import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import type { Payment } from "@/lib/types"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { appointmentId, amount, paymentMethod, cardNumber, cardExpiry, cvv } = body

    if (!amount || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Simulate payment processing
    const isPaymentSuccessful = await processPayment({
      amount,
      paymentMethod,
      cardNumber,
      cardExpiry,
      cvv,
    })

    if (!isPaymentSuccessful) {
      return NextResponse.json({ error: "Payment failed" }, { status: 400 })
    }

    const db = await getDatabase()
    const paymentsCollection = db.collection<Payment>("payments")
    const appointmentsCollection = db.collection("appointments")

    const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    const newPayment: Payment = {
      userId: new ObjectId(session.userId),
      appointmentId: appointmentId ? new ObjectId(appointmentId) : undefined,
      amount: Number.parseFloat(amount),
      paymentMethod,
      status: "completed",
      transactionId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await paymentsCollection.insertOne(newPayment)

    // Update appointment payment status if appointmentId exists
    if (appointmentId) {
      await appointmentsCollection.updateOne(
        { _id: new ObjectId(appointmentId) },
        {
          $set: {
            paymentStatus: "paid",
            paymentId: result.insertedId,
            updatedAt: new Date(),
          },
        },
      )
    }

    return NextResponse.json({
      success: true,
      paymentId: result.insertedId.toString(),
      transactionId,
      message: "Payment processed successfully",
    })
  } catch (error) {
    console.error("[v0] Process payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Simulate payment gateway processing
async function processPayment(paymentData: any): Promise<boolean> {
  // In a real application, this would integrate with Stripe, PayPal, etc.
  // For demo purposes, we'll simulate a successful payment
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Simulate 95% success rate
  return Math.random() > 0.05
}
