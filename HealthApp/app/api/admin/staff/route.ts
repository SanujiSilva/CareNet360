import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAuth } from "@/lib/auth"
import { hashPassword } from "@/lib/password"
import type { User } from "@/lib/types"
import { ObjectId } from "mongodb"

// Admin creates doctors, pharmacists, and other staff
export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth()
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 401 })
    }

    const body = await request.json()
    const {
      email,
      password,
      name,
      role,
      phone,
      dateOfBirth,
      gender,
      specialization,
      licenseNumber,
      department,
      hospitalId,
    } = body

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["doctor", "pharmacist"].includes(role)) {
      return NextResponse.json({ error: "Invalid role. Only doctor and pharmacist allowed" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection<User>("users")

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create staff user
    const newUser: User = {
      email,
      password: hashedPassword,
      name,
      role,
      phone,
      dateOfBirth,
      gender,
      specialization,
      licenseNumber,
      department,
      hospitalId: hospitalId ? new ObjectId(hospitalId) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await usersCollection.insertOne(newUser)

    return NextResponse.json({
      success: true,
      user: {
        id: result.insertedId.toString(),
        email,
        name,
        role,
      },
    })
  } catch (error) {
    console.error("[v0] Create staff error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Get all staff members
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth()
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection<User>("users")

    const staff = await usersCollection
      .find({
        role: { $in: ["doctor", "pharmacist"] },
      })
      .toArray()

    return NextResponse.json({ staff })
  } catch (error) {
    console.error("[v0] Fetch staff error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
