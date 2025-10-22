import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const department = searchParams.get("department")

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const query: any = { role: "doctor" }
    if (department) {
      query.department = department
    }

    const doctors = await usersCollection.find(query, { projection: { password: 0 } }).toArray()

    return NextResponse.json({ doctors })
  } catch (error) {
    console.error("[v0] Get doctors error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
