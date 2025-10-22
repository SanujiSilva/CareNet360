import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import type { Prescription } from "@/lib/types"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { patientId, medicineId, medicineName, dosage, frequency, duration, instructions } = body

    if (!patientId || !medicineName || !dosage || !frequency || !duration) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const prescriptionsCollection = db.collection<Prescription>("prescriptions")

    const newPrescription: Prescription = {
      patientId: new ObjectId(patientId),
      doctorId: new ObjectId(session.userId),
      medicineId: medicineId ? new ObjectId(medicineId) : new ObjectId(),
      medicineName,
      dosage,
      frequency,
      duration,
      instructions,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await prescriptionsCollection.insertOne(newPrescription)

    return NextResponse.json({
      success: true,
      prescriptionId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("[v0] Create prescription error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
