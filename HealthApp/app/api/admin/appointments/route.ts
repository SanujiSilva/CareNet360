import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const appointmentsCollection = db.collection("appointments")

    const appointments = await appointmentsCollection.find({}).sort({ date: -1 }).toArray()

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
