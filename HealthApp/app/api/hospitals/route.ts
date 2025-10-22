import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAuth } from "@/lib/auth"
import type { Hospital } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const hospitalsCollection = db.collection<Hospital>("hospitals")

    const hospitals = await hospitalsCollection.find({ status: "active" }).toArray()

    return NextResponse.json({ hospitals })
  } catch (error) {
    console.error("[v0] Fetch hospitals error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth()
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, address, phone, email, registrationNumber, type, departments, facilities, operatingHours } = body

    if (!name || !address || !phone || !email || !registrationNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const hospitalsCollection = db.collection<Hospital>("hospitals")

    const newHospital: Hospital = {
      name,
      address,
      phone,
      email,
      registrationNumber,
      type: type || "private",
      departments: departments || [],
      facilities: facilities || [],
      operatingHours: operatingHours || { open: "09:00", close: "17:00" },
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await hospitalsCollection.insertOne(newHospital)

    return NextResponse.json({
      success: true,
      hospital: { ...newHospital, _id: result.insertedId },
    })
  } catch (error) {
    console.error("[v0] Create hospital error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
