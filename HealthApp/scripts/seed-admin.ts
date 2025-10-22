import { MongoClient } from "mongodb"
import { hashPassword } from "../lib/password"

const MONGODB_URI = process.env.MONGODB_URI || ""

async function seedAdmin() {
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined")
    process.exit(1)
  }

  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    console.log("Connected to MongoDB")

    const db = client.db()
    const usersCollection = db.collection("users")
    const hospitalsCollection = db.collection("hospitals")

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ email: "admin@healthcare.com" })

    if (existingAdmin) {
      console.log("Admin user already exists")
      return
    }

    // Create default hospital
    const defaultHospital = {
      name: "Central Healthcare Hospital",
      address: "123 Medical Center Drive, Healthcare City",
      phone: "+1-555-0100",
      email: "info@centralhealthcare.com",
      registrationNumber: "HOS-2024-001",
      type: "private",
      departments: ["Cardiology", "Neurology", "Orthopedics", "Pediatrics", "General Medicine", "Emergency", "Surgery"],
      facilities: ["ICU", "Emergency Room", "Laboratory", "Radiology", "Pharmacy", "Blood Bank"],
      operatingHours: {
        open: "00:00",
        close: "23:59",
      },
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const hospitalResult = await hospitalsCollection.insertOne(defaultHospital)
    console.log("Default hospital created:", hospitalResult.insertedId)

    // Create admin user
    const hashedPassword = await hashPassword("Admin@123456")

    const adminUser = {
      email: "admin@healthcare.com",
      password: hashedPassword,
      name: "System Administrator",
      role: "admin",
      phone: "+1-555-0100",
      hospitalId: hospitalResult.insertedId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const userResult = await usersCollection.insertOne(adminUser)
    console.log("Admin user created:", userResult.insertedId)

    console.log("\n=== Admin Credentials ===")
    console.log("Email: admin@healthcare.com")
    console.log("Password: Admin@123456")
    console.log("========================\n")

    console.log("Seeding completed successfully!")
  } catch (error) {
    console.error("Error seeding admin:", error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

seedAdmin()
