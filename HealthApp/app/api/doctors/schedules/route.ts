import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"
import type { DoctorSchedule } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await request.json()
    const { date, timeRanges, maxPatientsPerSlot, isAvailable } = data

    // Validate timeRanges
    if (!Array.isArray(timeRanges) || timeRanges.length === 0) {
      return NextResponse.json({ error: "Invalid time ranges" }, { status: 400 })
    }

    // Generate 10-minute slots from timeRanges
    // Enforce maxPatientsPerSlot = 1 for each 10-minute slot
    const slots = timeRanges.flatMap(range => {
      const slots = []
      const start = new Date(`${date}T${range.start}`)
      const end = new Date(`${date}T${range.end}`)

      while (start < end) {
        const slotEnd = new Date(start.getTime() + 10 * 60 * 1000) // 10 minutes in milliseconds
        if (slotEnd > end) break

        slots.push({
          startTime: start.toLocaleTimeString("en-US", { 
            hour: "2-digit", 
            minute: "2-digit",
            hour12: true 
          }),
          endTime: slotEnd.toLocaleTimeString("en-US", { 
            hour: "2-digit", 
            minute: "2-digit",
            hour12: true 
          }),
          // force single-patient slots
          maxPatients: 1,
        })

        start.setTime(start.getTime() + 10 * 60 * 1000) // Move to next slot
      }
      return slots
    })

    const db = await getDatabase()
    const schedulesCollection = db.collection<DoctorSchedule>("doctor_schedules")

    // Update or insert the schedule
    await schedulesCollection.updateOne(
      { 
        doctorId: new ObjectId(session.userId),
        date: new Date(date)
      },
      {
        $set: {
          doctorId: new ObjectId(session.userId),
          date: new Date(date),
          slots,
          isAvailable
        }
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Create schedule error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
  const doctorId = searchParams.get("doctorId") || session.userId
    const date = searchParams.get("date")

    if (!doctorId) {
      return NextResponse.json({ error: "Missing doctor ID" }, { status: 400 })
    }

    const db = await getDatabase()
    const schedulesCollection = db.collection<DoctorSchedule>("doctor_schedules")

    const query: any = { doctorId: new ObjectId(doctorId) }
    if (date) {
      query.date = new Date(date)
    }

    const schedules = await schedulesCollection
      .find(query)
      .sort({ date: 1 })
      .toArray()

    return NextResponse.json({ schedules })
  } catch (error) {
    console.error("[v0] Get schedules error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}