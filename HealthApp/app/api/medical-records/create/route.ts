import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import type { MedicalRecord } from "@/lib/types"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { patientId, appointmentId, diagnosis, symptoms, treatment, prescriptions, labResults, notes } = body

    if (!patientId || !diagnosis || !symptoms || !treatment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const medicalRecordsCollection = db.collection<MedicalRecord>("medical_records")

    const newRecord: MedicalRecord = {
      patientId: new ObjectId(patientId),
      doctorId: new ObjectId(session.userId),
      appointmentId: appointmentId ? new ObjectId(appointmentId) : undefined,
      diagnosis,
      symptoms: Array.isArray(symptoms) ? symptoms : [symptoms],
      treatment,
      prescriptions: prescriptions || [],
      labResults,
      notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await medicalRecordsCollection.insertOne(newRecord)

    return NextResponse.json({
      success: true,
      recordId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("[v0] Create medical record error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
