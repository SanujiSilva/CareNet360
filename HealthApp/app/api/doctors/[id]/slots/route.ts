import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { DoctorSchedule, Appointment, DayOfWeek } from "@/lib/types"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // 👈 match Next.js 15 route signature
) {
  try {
    // ✅ Await params to safely extract doctor ID
    const { id } = await params

    const { searchParams } = new URL(request.url)
    const date = searchParams.get("date")

    // --- Validation Section --------------------------------------------------
    if (!id) {
      return NextResponse.json(
        {
          error: "Missing doctor id in path",
          userMessage: "Invalid request: missing doctor identifier.",
          severity: "error",
        },
        { status: 400 }
      )
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          error: "Invalid doctor id",
          userMessage: "Invalid doctor identifier provided.",
          severity: "error",
        },
        { status: 400 }
      )
    }

    if (!date) {
      return NextResponse.json(
        {
          error: "Missing date parameter",
          userMessage: "Please provide a date to see available slots.",
          severity: "warning",
        },
        { status: 400 }
      )
    }

    // --- Database Setup ------------------------------------------------------
    const db = await getDatabase()
    const schedulesCollection = db.collection<DoctorSchedule>("doctor_schedules")
    const appointmentsCollection = db.collection<Appointment>("appointments")

    const queryDate = new Date(date)
    const doctorObjectId = new ObjectId(id)

    // --- Find date-specific schedule ----------------------------------------
    const scheduleForDate = await schedulesCollection.findOne({
      doctorId: doctorObjectId,
      date: new Date(date),
    })

    let availableSlots: any[] = []

    if (scheduleForDate) {
      if (scheduleForDate.isAvailable === false) {
        return NextResponse.json({
          slots: [],
          userMessage: "Doctor is not available on this date.",
          severity: "info",
        })
      }
      availableSlots = scheduleForDate.slots || []
    } else {
      // --- Weekly fallback ---------------------------------------------------
      const weeklyDoc = await schedulesCollection.findOne({
        doctorId: doctorObjectId,
        weeklySchedule: { $exists: true },
      })

      if (!weeklyDoc) {
        return NextResponse.json({
          slots: [],
          userMessage: "No schedule found for this doctor.",
          severity: "info",
        })
      }

      const dayOfWeek = queryDate
        .toLocaleDateString("en-US", { weekday: "long" })
        .toLowerCase() as DayOfWeek

      const exceptionDay = weeklyDoc.exceptions?.find(
        (ex: any) => new Date(ex.date).toDateString() === queryDate.toDateString()
      )

      if (exceptionDay) {
        if (!exceptionDay.isAvailable) {
          return NextResponse.json({
            slots: [],
            userMessage: "Doctor is not available on this date.",
            severity: "info",
          })
        }
        availableSlots = exceptionDay.slots || []
      } else {
        const daySchedule = weeklyDoc.weeklySchedule?.[dayOfWeek]
        if (!daySchedule?.isAvailable) {
          return NextResponse.json({
            slots: [],
            userMessage: "Doctor is not available on this day.",
            severity: "info",
          })
        }
        availableSlots = daySchedule.slots || []
      }
    }

    // --- Get existing appointments for the date -----------------------------
    const startOfDay = new Date(queryDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(queryDate)
    endOfDay.setHours(23, 59, 59, 999)

    const existingAppointments = await appointmentsCollection
      .find({
        doctorId: doctorObjectId,
        date: {
          $gte: startOfDay,
          $lt: endOfDay,
        },
        status: { $nin: ["cancelled", "no-show"] },
      })
      .toArray()

    // --- Compute availability per slot --------------------------------------
    const processedSlots = availableSlots.map((slot) => {
      const bookedForSlot = existingAppointments.filter(
        (apt) => apt.time >= slot.startTime && apt.time < slot.endTime
      ).length

      return {
        ...slot,
        available: !slot.maxPatients || bookedForSlot < slot.maxPatients,
        bookedPatients: bookedForSlot,
      }
    })

    return NextResponse.json({ slots: processedSlots })
  } catch (error) {
    console.error("[v0] Get available slots error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
