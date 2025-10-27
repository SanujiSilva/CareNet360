import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import type { DoctorSchedule } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get("doctorId")

    const db = await getDatabase()
    const schedulesCollection = db.collection<DoctorSchedule>("doctor_schedules")

    let query = {}
    if (doctorId) {
      query = { doctorId: new ObjectId(doctorId) }
    }

    const schedules = await schedulesCollection.find(query).toArray()
    return NextResponse.json({ schedules })
  } catch (error) {
    console.error("[v0] Get doctor schedules error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { doctorId, weeklySchedule, exceptions } = body

    if (!doctorId || !weeklySchedule) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const schedulesCollection = db.collection<DoctorSchedule>("doctor_schedules")

    // Check if schedule already exists for this doctor
    const existingSchedule = await schedulesCollection.findOne({ doctorId: new ObjectId(doctorId) })
    if (existingSchedule) {
      return NextResponse.json({ error: "Schedule already exists for this doctor" }, { status: 400 })
    }

    const newSchedule: DoctorSchedule = {
      doctorId: new ObjectId(doctorId),
      weeklySchedule,
      exceptions: exceptions || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await schedulesCollection.insertOne(newSchedule)
    return NextResponse.json({
      success: true,
      scheduleId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("[v0] Create doctor schedule error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { doctorId, weeklySchedule, exceptions } = body

    if (!doctorId || !weeklySchedule) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const schedulesCollection = db.collection<DoctorSchedule>("doctor_schedules")

    const updateData: Partial<DoctorSchedule> = {
      weeklySchedule,
      exceptions: exceptions || [],
      updatedAt: new Date(),
    }

    const result = await schedulesCollection.updateOne(
      { doctorId: new ObjectId(doctorId) },
      { $set: updateData },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Update doctor schedule error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get("doctorId")

    if (!doctorId) {
      return NextResponse.json({ error: "Missing doctorId" }, { status: 400 })
    }

    const db = await getDatabase()
    const schedulesCollection = db.collection<DoctorSchedule>("doctor_schedules")

    const result = await schedulesCollection.deleteOne({ doctorId: new ObjectId(doctorId) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete doctor schedule error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}