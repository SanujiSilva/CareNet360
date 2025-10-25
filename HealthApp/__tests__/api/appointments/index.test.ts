import { type NextRequest } from "next/server"
import { POST, GET } from "@/app/api/appointments/route"
import { getDatabase } from "@/lib/mongodb"
import { getSession } from "@/lib/auth"
import { ObjectId } from "mongodb"

// ---- Mock dependencies ----
jest.mock("@/lib/mongodb", () => ({
  getDatabase: jest.fn(),
}))
jest.mock("@/lib/auth", () => ({
  getSession: jest.fn(),
}))

// ---- Silence console errors for cleaner output ----
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {})
})
afterAll(() => {
  jest.restoreAllMocks()
})

describe("Appointments API (GET & POST)", () => {
  let mockDb: any
  let mockAppointmentsCollection: any
  let mockUsersCollection: any
  let mockSchedulesCollection: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockAppointmentsCollection = {
      find: jest.fn(() => ({
        sort: jest.fn(() => ({
          toArray: jest.fn().mockResolvedValue([
            {
              _id: new ObjectId(),
              doctorId: new ObjectId(),
              patientId: new ObjectId(),
              date: new Date(),
              time: "09:00 AM",
            },
          ]),
        })),
      })),
      insertOne: jest.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      countDocuments: jest.fn().mockResolvedValue(0),
    }

    mockUsersCollection = {
      findOne: jest.fn().mockResolvedValue({ name: "John Doe", email: "john@example.com" }),
    }

    mockSchedulesCollection = {
      findOne: jest.fn().mockResolvedValue({
        doctorId: new ObjectId(),
        date: new Date("2025-10-26"),
        slots: [{ startTime: "09:00 AM", maxPatients: 2 }],
      }),
    }

    mockDb = {
      collection: jest.fn((name: string) => {
        if (name === "appointments") return mockAppointmentsCollection
        if (name === "users") return mockUsersCollection
        if (name === "doctor_schedules") return mockSchedulesCollection
        return {}
      }),
    }

    ;(getDatabase as jest.Mock).mockResolvedValue(mockDb)
  })

  // ✅ --- POST Tests ---
  it("creates a new appointment successfully", async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ userId: "u123", role: "patient" })

    const req = new Request("http://localhost:3000/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        doctorId: new ObjectId().toString(),
        date: "2025-10-26",
        time: "09:00 AM",
        reason: "Check-up",
      }),
    }) as unknown as NextRequest

    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it("returns 401 if not authenticated", async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    const req = new Request("http://localhost:3000/api/appointments", {
      method: "POST",
      body: JSON.stringify({}),
    }) as unknown as NextRequest
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("returns 400 if missing required fields", async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ userId: "u123", role: "patient" })
    const req = new Request("http://localhost:3000/api/appointments", {
      method: "POST",
      body: JSON.stringify({ doctorId: "507f1f77bcf86cd799439011" }),
    }) as unknown as NextRequest
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it("returns 409 if time slot is full", async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ userId: "u123", role: "patient" })
    mockAppointmentsCollection.countDocuments.mockResolvedValueOnce(5) // simulate full slot

    const req = new Request("http://localhost:3000/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        doctorId: new ObjectId().toString(),
        date: "2025-10-26",
        time: "09:00 AM",
        reason: "Check-up",
      }),
    }) as unknown as NextRequest

    const res = await POST(req)
    expect(res.status).toBe(409)
  })

  it("returns 500 if DB insert fails", async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ userId: "u123", role: "patient" })
    mockAppointmentsCollection.insertOne.mockRejectedValueOnce(new Error("DB error"))

    const req = new Request("http://localhost:3000/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        doctorId: new ObjectId().toString(),
        date: "2025-10-26",
        time: "09:00 AM",
        reason: "Check-up",
      }),
    }) as unknown as NextRequest

    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  // ✅ --- GET Tests ---
  it("fetches appointments successfully", async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ userId: "d123", role: "doctor" })

    const req = new Request("http://localhost:3000/api/appointments", {
      method: "GET",
    }) as unknown as NextRequest

    const res = await GET(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(Array.isArray(data.appointments)).toBe(true)
  })

  it("returns 401 if unauthorized on GET", async () => {
    ;(getSession as jest.Mock).mockResolvedValue(null)
    const req = new Request("http://localhost:3000/api/appointments", {
      method: "GET",
    }) as unknown as NextRequest
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it("returns 500 if DB error occurs in GET", async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ userId: "d123", role: "doctor" })
    mockAppointmentsCollection.find.mockImplementationOnce(() => {
      throw new Error("DB failure")
    })
    const req = new Request("http://localhost:3000/api/appointments", {
      method: "GET",
    }) as unknown as NextRequest
    const res = await GET(req)
    expect(res.status).toBe(500)
  })

  it("fetches appointments as patient with status filter", async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ userId: new ObjectId().toString(), role: "patient" })

    const req = new Request("http://localhost:3000/api/appointments?status=scheduled", {
      method: "GET",
    }) as unknown as NextRequest

    const res = await GET(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(Array.isArray(data.appointments)).toBe(true)
  })

  it("uses weekly schedule fallback when date-specific schedule not found", async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ userId: "u123", role: "patient" })

    // Make the schedules collection return null for the date-specific lookup
    // and then return a weekly schedule document for the fallback.
    const weeklyDoc = {
      doctorId: new ObjectId(),
      weeklySchedule: {
        sunday: { slots: [{ startTime: "09:00 AM", maxPatients: 3 }] },
      },
    }

    mockSchedulesCollection.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(weeklyDoc)
    mockAppointmentsCollection.countDocuments.mockResolvedValueOnce(0)

    const req = new Request("http://localhost:3000/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        doctorId: new ObjectId().toString(),
        date: "2025-10-26",
        time: "09:00 AM",
        reason: "Fallback test",
      }),
    }) as unknown as NextRequest

    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it("fetches appointments when role is neither patient nor doctor (no query filter)", async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ userId: "x123", role: "admin" })

    const req = new Request("http://localhost:3000/api/appointments", {
      method: "GET",
    }) as unknown as NextRequest

    const res = await GET(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(Array.isArray(data.appointments)).toBe(true)
  })

  it("falls back to weekly schedule when date-specific schedule has non-array slots", async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ userId: "u123", role: "patient" })

    const weeklyDoc = {
      doctorId: new ObjectId(),
      weeklySchedule: {
        sunday: { slots: [{ startTime: "09:00 AM", maxPatients: 2 }] },
      },
    }

    // First call returns a scheduleForDate object but slots is not an array
    mockSchedulesCollection.findOne.mockResolvedValueOnce({ isAvailable: true, slots: null }).mockResolvedValueOnce(weeklyDoc)
    mockAppointmentsCollection.countDocuments.mockResolvedValueOnce(0)

    const req = new Request("http://localhost:3000/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        doctorId: new ObjectId().toString(),
        date: "2025-10-26",
        time: "09:00 AM",
        reason: "Fallback non-array slots",
      }),
    }) as unknown as NextRequest

    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it("uses exception slots from weekly schedule when present", async () => {
    ;(getSession as jest.Mock).mockResolvedValue({ userId: "u123", role: "patient" })

    const weeklyDoc = {
      doctorId: new ObjectId(),
      weeklySchedule: {},
      exceptions: [
        {
          date: "2025-10-26",
          isAvailable: true,
          slots: [{ startTime: "09:00 AM", endTime: "09:30 AM", maxPatients: 2 }],
        },
      ],
    }

    // date-specific schedule not found, weeklyDoc has exception with slots
    mockSchedulesCollection.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(weeklyDoc)
    mockAppointmentsCollection.countDocuments.mockResolvedValueOnce(0)

    const req = new Request("http://localhost:3000/api/appointments", {
      method: "POST",
      body: JSON.stringify({
        doctorId: new ObjectId().toString(),
        date: "2025-10-26",
        time: "09:00 AM",
        reason: "Exception slot test",
      }),
    }) as unknown as NextRequest

    const res = await POST(req)
    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
  })
})
