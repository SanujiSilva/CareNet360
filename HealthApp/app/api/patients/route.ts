import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const patients = await usersCollection.find({ role: "patient" }, { projection: { password: 0 } }).toArray()

    return NextResponse.json({ patients })
  } catch (error) {
    console.error("[v0] Get patients error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
