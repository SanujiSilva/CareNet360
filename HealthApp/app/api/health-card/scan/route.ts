import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== "doctor") {
      return NextResponse.json({ error: "Unauthorized - Doctor access only" }, { status: 401 })
    }

    const body = await request.json()
    const { cardNumber } = body

    if (!cardNumber) {
      return NextResponse.json({ error: "Card number is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const healthCardsCollection = db.collection("health_cards")
    const usersCollection = db.collection("users")
    const medicalRecordsCollection = db.collection("medical_records")
    const prescriptionsCollection = db.collection("prescriptions")
    const appointmentsCollection = db.collection("appointments")

    // Find health card
    const healthCard = await healthCardsCollection.findOne({ cardNumber })

    if (!healthCard) {
      return NextResponse.json({ error: "Invalid health card" }, { status: 404 })
    }

    // Get patient details
    const patient = await usersCollection.findOne({ _id: healthCard.patientId })

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    // Get medical history
    const medicalRecords = await medicalRecordsCollection
      .find({ patientId: healthCard.patientId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    // Get prescriptions
    const prescriptions = await prescriptionsCollection
      .find({ patientId: healthCard.patientId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray()

    // Get appointments
    const appointments = await appointmentsCollection
      .find({ patientId: healthCard.patientId })
      .sort({ date: -1 })
      .limit(5)
      .toArray()

    return NextResponse.json({
      patient: {
        _id: patient._id.toString(),
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address,
        allergies: patient.allergies,
        bloodGroup: patient.bloodGroup,
        medicalHistory: patient.medicalHistory,
        emergencyContact: patient.emergencyContact, 
      },
      healthCard: {
        ...healthCard,
        _id: healthCard._id.toString(),
        patientId: healthCard.patientId.toString(),
      },
      medicalHistory: medicalRecords.map((record) => ({
        ...record,
        _id: record._id.toString(),
        patientId: record.patientId.toString(),
        doctorId: record.doctorId?.toString(),
      })),
      prescriptions: prescriptions.map((prescription) => ({
        ...prescription,
        _id: prescription._id.toString(),
        patientId: prescription.patientId.toString(),
        doctorId: prescription.doctorId?.toString(),
      })),
      appointments: appointments.map((appointment) => ({
        ...appointment,
        _id: appointment._id.toString(),
        patientId: appointment.patientId.toString(),
        doctorId: appointment.doctorId?.toString(),
      })),
    })
  } catch (error) {
    console.error("[v0] Scan health card error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
