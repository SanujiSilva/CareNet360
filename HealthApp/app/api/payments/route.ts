import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import type { Payment } from "@/lib/types"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const paymentsCollection = db.collection<Payment>("payments")

    const query: any = {}
    if (session.role === "patient") {
      query.userId = new ObjectId(session.userId)
    }

    const payments = await paymentsCollection.find(query).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({ payments })
  } catch (error) {
    console.error("[v0] Get payments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { appointmentId, amount, paymentMethod } = body

    if (!amount || !paymentMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const paymentsCollection = db.collection<Payment>("payments")

    const newPayment: Payment = {
      userId: new ObjectId(session.userId),
      appointmentId: appointmentId ? new ObjectId(appointmentId) : undefined,
      amount: Number.parseFloat(amount),
      paymentMethod,
      status: "completed",
      transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await paymentsCollection.insertOne(newPayment)

    return NextResponse.json({
      success: true,
      paymentId: result.insertedId.toString(),
      transactionId: newPayment.transactionId,
    })
  } catch (error) {
    console.error("[v0] Create payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
