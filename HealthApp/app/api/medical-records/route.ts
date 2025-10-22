import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const medicalRecordsCollection = db.collection("medical_records")

    const query: any = {}
    if (session.role === "patient") {
      query.patientId = new ObjectId(session.userId)
    } else if (session.role === "doctor") {
      query.doctorId = new ObjectId(session.userId)
    }

    const records = await medicalRecordsCollection.find(query).sort({ createdAt: -1 }).toArray()

    // Populate user details
    const usersCollection = db.collection("users")
    const populatedRecords = await Promise.all(
      records.map(async (record) => {
        const patient = await usersCollection.findOne({ _id: record.patientId }, { projection: { password: 0 } })
        const doctor = await usersCollection.findOne({ _id: record.doctorId }, { projection: { password: 0 } })
        return {
          ...record,
          _id: record._id?.toString(),
          patientId: record.patientId.toString(),
          doctorId: record.doctorId.toString(),
          patient,
          doctor,
        }
      }),
    )

    return NextResponse.json({ records: populatedRecords })
  } catch (error) {
    console.error("[v0] Get medical records error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
