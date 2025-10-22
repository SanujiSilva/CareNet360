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

    const [totalUsers, totalAppointments, totalPrescriptions, totalRecords] = await Promise.all([
      db.collection("users").countDocuments(),
      db.collection("appointments").countDocuments(),
      db.collection("prescriptions").countDocuments(),
      db.collection("medical_records").countDocuments(),
    ])

    const usersByRole = await db
      .collection("users")
      .aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    const appointmentsByStatus = await db
      .collection("appointments")
      .aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    const recentAppointments = await db.collection("appointments").find({}).sort({ createdAt: -1 }).limit(10).toArray()

    return NextResponse.json({
      stats: {
        totalUsers,
        totalAppointments,
        totalPrescriptions,
        totalRecords,
        usersByRole,
        appointmentsByStatus,
        recentAppointments,
      },
    })
  } catch (error) {
    console.error("[v0] Get stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
