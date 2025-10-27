import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import type { Appointment } from "@/lib/types"
import { ObjectId } from "mongodb"

const toObjectId = (id: unknown) => {
  try {
    if (typeof id === "string" && ObjectId.isValid(id)) return new ObjectId(id)
  } catch (e) {
    /* ignore */
  }
  return id
}

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
      query.patientId = toObjectId(session.userId)
    } else if (session.role === "doctor") {
      query.doctorId = toObjectId(session.userId)
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
    const schedulesCollection = db.collection("doctor_schedules")

    // Check slot availability before creating appointment
    const queryDate = new Date(date)
    const startOfDay = new Date(queryDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(queryDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Try date-specific schedule first
  const scheduleForDate = await schedulesCollection.findOne({ doctorId: toObjectId(doctorId), date: new Date(date) })

    let slotMaxPatients = 1
    if (scheduleForDate && Array.isArray(scheduleForDate.slots)) {
      const slot = scheduleForDate.slots.find((s: any) => s.startTime === time)
      if (slot) slotMaxPatients = slot.maxPatients || 1
    } else {
      // fallback: find weekly schedule and exceptions
      const weeklyDoc = await schedulesCollection.findOne({ doctorId: new ObjectId(doctorId), weeklySchedule: { $exists: true } })
      if (weeklyDoc) {
        const dayOfWeek = queryDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase()
        const exception = weeklyDoc.exceptions?.find((ex: any) => new Date(ex.date).toDateString() === queryDate.toDateString())
        if (exception && exception.slots) {
          const slot = exception.slots.find((s: any) => s.startTime === time)
          if (slot) slotMaxPatients = slot.maxPatients || 1
        } else if (weeklyDoc.weeklySchedule?.[dayOfWeek]) {
          const slot = weeklyDoc.weeklySchedule[dayOfWeek].slots.find((s: any) => s.startTime === time)
          if (slot) slotMaxPatients = slot.maxPatients || 1
        }
      }
    }

    // Count existing appointments for that doctor/date/time (excluding cancelled/no-show)
    const existingCount = await appointmentsCollection.countDocuments({
      doctorId: toObjectId(doctorId),
      date: { $gte: startOfDay, $lt: endOfDay },
      time,
      status: { $nin: ["cancelled", "no-show"] },
    })

    if (existingCount >= slotMaxPatients) {
      return NextResponse.json({ error: "Selected time slot is no longer available" }, { status: 409 })
    }

    const newAppointment: Appointment = {
      patientId: toObjectId(session.userId) as any,
      doctorId: toObjectId(doctorId) as any,
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
