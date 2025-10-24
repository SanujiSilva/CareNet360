import { POST } from "@/app/api/medical-records/create/route"
import { GET } from "@/app/api/medical-records/route"
import { NextRequest } from "next/server"
import { ObjectId } from "mongodb"

// --- Global mocks declared ONCE (Jest hoists these) ---
jest.mock("@/lib/mongodb", () => ({
  getDatabase: jest.fn(),
}))
jest.mock("@/lib/auth", () => ({
  getSession: jest.fn(),
}))

import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"

// --- Optional: silence console during tests (keeps output clean) ---
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(console, "warn").mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe("POST /api/medical-records/create", () => {
  const mockCollection = { insertOne: jest.fn() }
  const mockDb = { collection: jest.fn(() => mockCollection) }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getDatabase as jest.Mock).mockResolvedValue(mockDb)
  })

  it("creates a new medical record successfully", async () => {
    ;(getSession as jest.Mock).mockResolvedValue({
      userId: new ObjectId().toString(),
      role: "doctor",
    })
    mockCollection.insertOne.mockResolvedValue({ insertedId: new ObjectId() })

    const body = {
      patientId: new ObjectId().toString(),
      diagnosis: "Fever",
      symptoms: ["Cough", "Fatigue"],
      treatment: "Paracetamol 500mg",
      prescriptions: [],
    }

    const request = new NextRequest("http://localhost/api/medical-records/create", {
      method: "POST",
      body: JSON.stringify(body),
    })

    const res = await POST(request)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.recordId).toBeDefined()
    expect(mockCollection.insertOne).toHaveBeenCalledTimes(1)
  })

  it("returns 401 if user is not a doctor", async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ role: "patient" })

    const request = new NextRequest("http://localhost/api/medical-records/create", {
      method: "POST",
      body: JSON.stringify({}),
    })

    const res = await POST(request)
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe("Unauthorized")
  })

  it("returns 400 if required fields are missing", async () => {
    ;(getSession as jest.Mock).mockResolvedValue({
      userId: new ObjectId().toString(),
      role: "doctor",
    })

    const request = new NextRequest("http://localhost/api/medical-records/create", {
      method: "POST",
      body: JSON.stringify({ patientId: "", diagnosis: "", symptoms: "", treatment: "" }),
    })

    const res = await POST(request)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.error).toBe("Missing required fields")
  })

  it("handles database insertion error", async () => {
    ;(getSession as jest.Mock).mockResolvedValue({
      userId: new ObjectId().toString(),
      role: "doctor",
    })
    mockCollection.insertOne.mockRejectedValue(new Error("DB error"))

    const body = {
      patientId: new ObjectId().toString(),
      diagnosis: "Fever",
      symptoms: ["Cough"],
      treatment: "Paracetamol",
      prescriptions: [],
    }

    const request = new NextRequest("http://localhost/api/medical-records/create", {
      method: "POST",
      body: JSON.stringify(body),
    })

    const res = await POST(request)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe("Internal server error")
  })
})

describe("GET /api/medical-records", () => {
  const mockCollection = {
    find: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    toArray: jest.fn(),
  }
  const mockUsersCollection = { findOne: jest.fn() }
  const mockDb = {
    collection: jest.fn((name: string) => {
      if (name === "medical_records") return mockCollection
      if (name === "users") return mockUsersCollection
      return null
    }),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getDatabase as jest.Mock).mockResolvedValue(mockDb)
  })

  it("returns medical records for doctor role", async () => {
    const mockDoctorId = new ObjectId()
    const mockPatientId = new ObjectId()

    ;(getSession as jest.Mock).mockResolvedValue({
      userId: mockDoctorId.toString(),
      role: "doctor",
    })

    mockCollection.toArray.mockResolvedValue([
      {
        _id: new ObjectId(),
        patientId: mockPatientId,
        doctorId: mockDoctorId,
        diagnosis: "Fever",
        createdAt: new Date(),
      },
    ])

    mockUsersCollection.findOne
      .mockResolvedValueOnce({ _id: mockPatientId, name: "John Doe" })
      .mockResolvedValueOnce({ _id: mockDoctorId, name: "Dr. Smith" })

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.records).toHaveLength(1)
    expect(data.records[0].patient.name).toBe("John Doe")
    expect(data.records[0].doctor.name).toBe("Dr. Smith")
    expect(mockCollection.find).toHaveBeenCalledWith({ doctorId: mockDoctorId })
    expect(mockCollection.sort).toHaveBeenCalledWith({ createdAt: -1 })
  })

  it("returns medical records for patient role", async () => {
    const mockPatientId = new ObjectId()
    ;(getSession as jest.Mock).mockResolvedValue({
      userId: mockPatientId.toString(),
      role: "patient",
    })

    mockCollection.toArray.mockResolvedValue([])

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(Array.isArray(data.records)).toBe(true)
    expect(mockCollection.find).toHaveBeenCalledWith({ patientId: mockPatientId })
  })

  it("returns 401 if no session found", async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.error).toBe("Unauthorized")
  })

  it("returns 500 on database error", async () => {
    ;(getSession as jest.Mock).mockResolvedValue({
      userId: new ObjectId().toString(),
      role: "doctor",
    })
    ;(getDatabase as jest.Mock).mockRejectedValue(new Error("DB connection failed"))

    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.error).toBe("Internal server error")
  })
})
