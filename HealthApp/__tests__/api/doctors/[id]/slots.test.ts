import { type NextRequest } from "next/server"
import { GET } from "@/app/api/doctors/[id]/slots/route"
import { getDatabase } from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// Mock MongoDB
jest.mock("@/lib/mongodb", () => ({
  getDatabase: jest.fn(),
}))

describe("GET /api/doctors/[id]/slots", () => {
  const mockCollection = {
    findOne: jest.fn(),
    find: jest.fn(),
  }

  const mockDb = {
    collection: jest.fn(() => mockCollection),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(getDatabase as jest.Mock).mockResolvedValue(mockDb)
  })

  //  1. Missing doctor ID
  it("returns 400 if doctor id is missing", async () => {
    const request = new Request(
      "http://localhost:3000/api/doctors/slots?date=2025-10-26"
    ) as unknown as NextRequest

    const res = await GET(request, { params: Promise.resolve({ id: "" }) })
    expect(res.status).toBe(400)
  })

  //  2. Invalid doctor ID
  it("returns 400 if doctor id is invalid", async () => {
    const request = new Request(
      "http://localhost:3000/api/doctors/abc/slots?date=2025-10-26"
    ) as unknown as NextRequest

    const res = await GET(request, { params: Promise.resolve({ id: "invalid" }) })
    expect(res.status).toBe(400)
  })

  //  3. Missing date parameter
  it("returns 400 if date is missing", async () => {
    const request = new Request(
      "http://localhost:3000/api/doctors/123/slots"
    ) as unknown as NextRequest

    const res = await GET(request, {
      params: Promise.resolve({ id: new ObjectId().toString() }),
    })
    expect(res.status).toBe(400)
  })

  //  4. Valid doctor & available slots
  it("returns available slots when found", async () => {
    mockCollection.findOne
      .mockResolvedValueOnce({
        doctorId: new ObjectId(),
        date: new Date("2025-10-26"),
        isAvailable: true,
        slots: [{ startTime: "09:00 AM", endTime: "09:10 AM", maxPatients: 1 }],
      })
      .mockResolvedValueOnce(null)

    const mockFind = {
      toArray: jest.fn().mockResolvedValue([]),
    }
    mockCollection.find.mockReturnValue(mockFind)

    const request = new Request(
      "http://localhost:3000/api/doctors/507f1f77bcf86cd799439011/slots?date=2025-10-26"
    ) as unknown as NextRequest

    const res = await GET(request, {
      params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }),
    })

    const data = await res.json()
    expect(res.status).toBe(200)
    expect(Array.isArray(data.slots)).toBe(true)
  })

  //  5. Doctor unavailable case
  it("returns empty slots if doctor unavailable", async () => {
    mockCollection.findOne.mockResolvedValueOnce({ isAvailable: false })

    const request = new Request(
      "http://localhost:3000/api/doctors/507f1f77bcf86cd799439011/slots?date=2025-10-26"
    ) as unknown as NextRequest

    const res = await GET(request, {
      params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }),
    })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.slots).toEqual([])
  })

  // 6. No weekly schedule found (fallback -> not found)
  it("returns empty slots when no weekly schedule exists", async () => {
    mockCollection.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null)

    const request = new Request(
      "http://localhost:3000/api/doctors/507f1f77bcf86cd799439011/slots?date=2025-10-26"
    ) as unknown as NextRequest

    const res = await GET(request, {
      params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }),
    })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.slots).toEqual([])
  })

  // 7. Weekly schedule has an exception and doctor is unavailable on that date
  it("returns empty slots when exception marks doctor unavailable", async () => {
    const weeklyDoc = {
      doctorId: new ObjectId(),
      weeklySchedule: {},
      exceptions: [{ date: "2025-10-26", isAvailable: false }],
    }

    mockCollection.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(weeklyDoc)
    mockCollection.find.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) })

    const request = new Request(
      "http://localhost:3000/api/doctors/507f1f77bcf86cd799439011/slots?date=2025-10-26"
    ) as unknown as NextRequest

    const res = await GET(request, {
      params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }),
    })

    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.slots).toEqual([])
  })

  // 8. Weekly schedule exception provides slots
  it("returns exception slots when exception has slots", async () => {
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

    mockCollection.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(weeklyDoc)
    mockCollection.find.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) })

    const request = new Request(
      "http://localhost:3000/api/doctors/507f1f77bcf86cd799439011/slots?date=2025-10-26"
    ) as unknown as NextRequest

    const res = await GET(request, {
      params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }),
    })

    const data = await res.json()
    expect(res.status).toBe(200)
    expect(Array.isArray(data.slots)).toBe(true)
    expect(data.slots.length).toBeGreaterThan(0)
  })

  // 9. Weekly schedule daySchedule exists but is not available
  it("returns empty slots when day schedule is not available", async () => {
    const weeklyDoc = {
      doctorId: new ObjectId(),
      weeklySchedule: { sunday: { isAvailable: false } },
    }

    mockCollection.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(weeklyDoc)
    mockCollection.find.mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) })

    const request = new Request(
      "http://localhost:3000/api/doctors/507f1f77bcf86cd799439011/slots?date=2025-10-26"
    ) as unknown as NextRequest

    const res = await GET(request, {
      params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }),
    })

    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.slots).toEqual([])
  })

  // 10. Slot is fully booked (processedSlots.available === false)
  it("marks slot as unavailable when fully booked", async () => {
    mockCollection.findOne
      .mockResolvedValueOnce({
        doctorId: new ObjectId(),
        date: new Date("2025-10-26"),
        isAvailable: true,
        slots: [{ startTime: "09:00 AM", endTime: "09:10 AM", maxPatients: 1 }],
      })
      .mockResolvedValueOnce(null)

    // existing appointment matches the slot time
    const mockFind = {
      toArray: jest.fn().mockResolvedValue([
        { _id: new ObjectId(), doctorId: new ObjectId(), date: new Date("2025-10-26"), time: "09:00 AM", status: "scheduled" },
      ]),
    }
    mockCollection.find.mockReturnValue(mockFind)

    const request = new Request(
      "http://localhost:3000/api/doctors/507f1f77bcf86cd799439011/slots?date=2025-10-26"
    ) as unknown as NextRequest

    const res = await GET(request, {
      params: Promise.resolve({ id: "507f1f77bcf86cd799439011" }),
    })

    const data = await res.json()
    expect(res.status).toBe(200)
    expect(data.slots[0].available).toBe(false)
    expect(data.slots[0].bookedPatients).toBeGreaterThan(0)
  })
})
