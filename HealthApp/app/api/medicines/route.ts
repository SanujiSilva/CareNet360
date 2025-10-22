import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import type { Medicine } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const category = searchParams.get("category")

    const db = await getDatabase()
    const medicinesCollection = db.collection<Medicine>("medicines")

    const query: any = {}
    if (search) {
      query.$or = [{ name: { $regex: search, $options: "i" } }, { genericName: { $regex: search, $options: "i" } }]
    }
    if (category) {
      query.category = category
    }

    const medicines = await medicinesCollection.find(query).toArray()

    return NextResponse.json({ medicines })
  } catch (error) {
    console.error("[v0] Get medicines error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || (session.role !== "pharmacist" && session.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, genericName, manufacturer, category, price, stock, description, sideEffects } = body

    if (!name || !genericName || !manufacturer || !category || !price || stock === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const db = await getDatabase()
    const medicinesCollection = db.collection<Medicine>("medicines")

    const newMedicine: Medicine = {
      name,
      genericName,
      manufacturer,
      category,
      price: Number.parseFloat(price),
      stock: Number.parseInt(stock),
      description,
      sideEffects: Array.isArray(sideEffects) ? sideEffects : [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const result = await medicinesCollection.insertOne(newMedicine)

    return NextResponse.json({
      success: true,
      medicineId: result.insertedId.toString(),
    })
  } catch (error) {
    console.error("[v0] Create medicine error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
