import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import type { Appointment } from "@/lib/types"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const db = await getDatabase()
    const appointmentsCollection = db.collection<Appointment>("appointments")

    const query: any = {}

    if (session.role === "patient") {
      query.patientId = new ObjectId(session.userId)
    } else if (session.role === "doctor") {
      query.doctorId = new ObjectId(session.userId)
    }

    if (status) {
      query.status = status
    }

    const appointments = await appointmentsCollection.find(query).sort({ date: -1 }).toArray()

    // Populate user details
    const usersCollection = db.collection("users")
    const populatedAppointments = await Promise.all(
      appointments.map(async (apt) => {
        const patient = await usersCollection.findOne({ _id: apt.patientId }, { projection: { password: 0 } })
        const doctor = await usersCollection.findOne({ _id: apt.doctorId }, { projection: { password: 0 } })
        return {
          ...apt,
          _id: apt._id?.toString(),
          patientId: apt.patientId.toString(),
          doctorId: apt.doctorId.toString(),
          patient,
          doctor,
        }
      }),
    )

    return NextResponse.json({ appointments: populatedAppointments })
  } catch (error) {
    console.error("[v0] Get appointments error:", error)
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
    const { doctorId, date, time, reason } = body

    if (!doctorId || !date || !time || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const appointmentsCollection = db.collection<Appointment>("appointments")

    const newAppointment: Appointment = {
      patientId: new ObjectId(session.userId),
      doctorId: new ObjectId(doctorId),
      date: new Date(date),
      time,
      status: "scheduled",
      reason,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await appointmentsCollection.insertOne(newAppointment)

    return NextResponse.json({
      success: true,
      appointmentId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("[v0] Create appointment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
