import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyAuth } from "@/lib/auth"
import { hashPassword } from "@/lib/password"
import { ObjectId } from "mongodb"

export async function GET(request: Request) {
  try {
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const userData = await db
      .collection("users")
      .findOne({ _id: new ObjectId(user.userId) }, { projection: { password: 0 } })

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: userData })
  } catch (error) {
    console.error("[Profile] GET error:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const user = await verifyAuth()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      phone,
      dateOfBirth,
      gender,
      address,
      specialization,
      department,
      allergies,
      bloodGroup,
      medicalHistory,
      emergencyContact,
      currentPassword,
      newPassword,
    } = body

    const db = await getDatabase()

    const updateData: any = { updatedAt: new Date() }

    if (name) updateData.name = name
    if (phone) updateData.phone = phone
    if (dateOfBirth) updateData.dateOfBirth = dateOfBirth
    if (gender) updateData.gender = gender
    if (address) updateData.address = address
    if (specialization) updateData.specialization = specialization
    if (department) updateData.department = department
    if (allergies) updateData.allergies = allergies
    if (bloodGroup) updateData.bloodGroup = bloodGroup
    if (medicalHistory) updateData.medicalHistory = medicalHistory
    if (emergencyContact) updateData.emergencyContact = emergencyContact

    // Handle password change if provided
    if (currentPassword && newPassword) {
      const userData = await db.collection("users").findOne({ _id: new ObjectId(user.userId) })

      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const bcrypt = await import("bcryptjs")
      const isValidPassword = await bcrypt.compare(currentPassword, userData.password)

      if (!isValidPassword) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }

      updateData.password = await hashPassword(newPassword)
    }

    const result = await db.collection("users").updateOne(
      { _id: new ObjectId(user.userId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updatedUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(user.userId) }, { projection: { password: 0 } })

    return NextResponse.json({
      message: "Profile updated successfully",
      user: updatedUser,
    })
  } catch (error) {
    console.error("[Profile] PUT error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
