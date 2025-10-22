import type { ObjectId } from "mongodb"

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
  operatingHours: {
    open: string
    close: string
  }
  status: "active" | "inactive"
  createdAt: Date
  updatedAt: Date
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
  specialization?: string // for doctors
  licenseNumber?: string // for doctors
  department?: string // for doctors
  hospitalId?: ObjectId // hospital association
  allergies?: string
  bloodGroup?: string
  medicalHistory?: string
  emergencyContact?: string
  createdAt: Date
  updatedAt: Date
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
  createdAt: Date
  updatedAt: Date
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
  createdAt: Date
  updatedAt: Date
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
  createdAt: Date
  updatedAt: Date
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
  createdAt: Date
  updatedAt: Date
}

export interface Payment {
  _id?: ObjectId
  userId: ObjectId
  appointmentId?: ObjectId
  amount: number
  paymentMethod: "card" | "cash" | "insurance"
  status: "pending" | "completed" | "failed" | "refunded"
  transactionId?: string
  createdAt: Date
  updatedAt: Date
}

export interface HealthCard {
  _id?: ObjectId
  patientId: ObjectId
  cardNumber: string
  qrCode: string
  bloodGroup?: string
  allergies?: string[]
  emergencyContact?: {
    name: string
    phone: string
    relationship: string
  }
  medicalHistory?: string
  medicalConditions?: string[]
  createdAt: Date
  updatedAt: Date
}
