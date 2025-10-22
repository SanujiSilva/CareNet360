import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "pharmacist" && session.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    const db = await getDatabase()
    const medicinesCollection = db.collection("medicines")

    const updateData: any = { updatedAt: new Date() }
    if (body.name) updateData.name = body.name
    if (body.price !== undefined) updateData.price = Number.parseFloat(body.price)
    if (body.stock !== undefined) updateData.stock = Number.parseInt(body.stock)
    if (body.description) updateData.description = body.description

    const result = await medicinesCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Update medicine error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "pharmacist" && session.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const db = await getDatabase()
    const medicinesCollection = db.collection("medicines")

    const result = await medicinesCollection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Delete medicine error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
