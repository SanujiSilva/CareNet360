import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import type { HealthCard } from "@/lib/types"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "patient") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const healthCardsCollection = db.collection<HealthCard>("health_cards")

    const healthCard = await healthCardsCollection.findOne({
      patientId: new ObjectId(session.userId),
    })

    if (!healthCard) {
      // Create a new health card
      const cardNumber = `HC${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
        JSON.stringify({ cardNumber, patientId: session.userId }),
      )}`

      const newHealthCard: HealthCard = {
        patientId: new ObjectId(session.userId),
        cardNumber,
        qrCode,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await healthCardsCollection.insertOne(newHealthCard)

      return NextResponse.json({
        healthCard: {
          ...newHealthCard,
          _id: result.insertedId.toString(),
          patientId: newHealthCard.patientId.toString(),
        },
      })
    }

    return NextResponse.json({
      healthCard: {
        ...healthCard,
        _id: healthCard._id?.toString(),
        patientId: healthCard.patientId.toString(),
      },
    })
  } catch (error) {
    console.error("[v0] Get health card error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "patient") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { bloodGroup, allergies, emergencyContact, medicalConditions } = body

    const db = await getDatabase()
    const healthCardsCollection = db.collection("health_cards")

    const updateData: any = { updatedAt: new Date() }
    if (bloodGroup) updateData.bloodGroup = bloodGroup
    if (allergies) updateData.allergies = allergies
    if (emergencyContact) updateData.emergencyContact = emergencyContact
    if (medicalConditions) updateData.medicalConditions = medicalConditions

    const result = await healthCardsCollection.updateOne(
      { patientId: new ObjectId(session.userId) },
      { $set: updateData },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Health card not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Update health card error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
