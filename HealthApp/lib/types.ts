import type { ObjectId } from "mongodb"

// Reconciled and consolidated types for scheduling system and core models

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday"

export interface TimeSlot {
  startTime: string // e.g. "09:00"
  endTime: string // e.g. "09:10"
  maxPatients?: number
  bookedPatients?: number
  available?: boolean
}

export interface DoctorSchedule {
  _id?: ObjectId
  doctorId: ObjectId
  // For single-date schedules (doctor sets availability on a specific date)
  date?: Date
  // Slots for date-specific schedules
  slots?: TimeSlot[]
  // Or weekly schedule for recurring availability
  weeklySchedule?: {
    [key in DayOfWeek]: {
      isAvailable: boolean
      slots: TimeSlot[]
    }
  }
  // Exceptions override weekly schedule on a specific date
  exceptions?: {
    date: Date
    isAvailable: boolean
    slots?: TimeSlot[]
  }[]
  isAvailable?: boolean
  createdAt?: Date
  updatedAt?: Date
}

export interface Hospital {
  _id?: ObjectId
  name: string
  address: string
  phone: string
  email: string
  registrationNumber: string
  type: "government" | "private" | "clinic"
  departments: string[]
  facilities: string[]
  operatingHours: { open: string; close: string }
  status: "active" | "inactive"
  createdAt?: Date
  updatedAt?: Date
}

export interface User {
  _id?: ObjectId
  email: string
  password: string
  role: "patient" | "doctor" | "admin" | "pharmacist"
  name: string
  phone?: string
  dateOfBirth?: string
  gender?: "male" | "female" | "other"
  address?: string
  profileImage?: string
  specialization?: string
  licenseNumber?: string
  department?: string
  hospitalId?: ObjectId
  allergies?: string
  bloodGroup?: string
  medicalHistory?: string
  emergencyContact?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface UserPayload {
  userId: string
  email: string
  role: User["role"]
  name: string
}

export interface Appointment {
  _id?: ObjectId
  patientId: ObjectId
  doctorId: ObjectId
  date: Date
  time: string
  status: "scheduled" | "completed" | "cancelled" | "no-show"
  reason: string
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface MedicalRecord {
  _id?: ObjectId
  patientId: ObjectId
  doctorId: ObjectId
  appointmentId?: ObjectId
  diagnosis: string
  symptoms: string[]
  treatment: string
  prescriptions: ObjectId[]
  labResults?: string
  notes?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Prescription {
  _id?: ObjectId
  patientId: ObjectId
  doctorId: ObjectId
  medicineId: ObjectId
  medicineName: string
  dosage: string
  frequency: string
  duration: string
  instructions?: string
  status: "active" | "completed" | "cancelled"
  createdAt?: Date
  updatedAt?: Date
}

export interface Medicine {
  _id?: ObjectId
  name: string
  genericName: string
  manufacturer: string
  category: string
  price: number
  stock: number
  description?: string
  sideEffects?: string[]
  createdAt?: Date
  updatedAt?: Date
}

export interface Payment {
  _id?: ObjectId
  userId: ObjectId
  appointmentId?: ObjectId
  amount: number
  paymentMethod: "card" | "cash" | "insurance"
  status: "pending" | "completed" | "failed" | "refunded"
  transactionId?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface HealthCard {
  _id?: ObjectId
  patientId: ObjectId
  cardNumber: string
  qrCode: string
  bloodGroup?: string
  allergies?: string[]
  emergencyContact?: { name: string; phone: string; relationship: string }
  medicalHistory?: string
  medicalConditions?: string[]
  createdAt?: Date
  updatedAt?: Date
}

