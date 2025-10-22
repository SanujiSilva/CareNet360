"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "../admin.module.css"

interface Staff {
  _id: string
  name: string
  email: string
  role: string
  phone?: string
  specialization?: string
  department?: string
  licenseNumber?: string
}

interface Hospital {
  _id: string
  name: string
}

export default function StaffPage() {
  const router = useRouter()
  const [staff, setStaff] = useState<Staff[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "doctor",
    phone: "",
    dateOfBirth: "",
    gender: "male",
    specialization: "",
    licenseNumber: "",
    department: "",
    hospitalId: "",
  })

  useEffect(() => {
    fetchStaff()
    fetchHospitals()
  }, [])

  const fetchStaff = async () => {
    try {
      const response = await fetch("/api/admin/staff")
      if (!response.ok) throw new Error("Failed to fetch staff")
      const data = await response.json()
      setStaff(data.staff)
    } catch (error) {
      console.error("[v0] Fetch staff error:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHospitals = async () => {
    try {
      const response = await fetch("/api/hospitals")
      if (!response.ok) throw new Error("Failed to fetch hospitals")
      const data = await response.json()
      setHospitals(data.hospitals)
    } catch (error) {
      console.error("[v0] Fetch hospitals error:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      setShowForm(false)
      setFormData({
        name: "",
        email: "",
        password: "",
        role: "doctor",
        phone: "",
        dateOfBirth: "",
        gender: "male",
        specialization: "",
        licenseNumber: "",
        department: "",
        hospitalId: "",
      })
      fetchStaff()
      alert("Staff member created successfully!")
    } catch (error: any) {
      console.error("[v0] Create staff error:", error)
      alert(error.message || "Failed to create staff member")
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Staff Management</h1>
          <p className={styles.pageSubtitle}>Register and manage doctors and pharmacists</p>
        </div>
        <button className={styles.primaryButton} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Staff Member"}
        </button>
      </div>

      {showForm && (
        <div className={styles.card} style={{ marginBottom: "2rem" }}>
          <h3 className={styles.cardTitle}>Register New Staff Member</h3>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  className={styles.input}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Password</label>
                <input
                  type="password"
                  className={styles.input}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Role</label>
                <select
                  className={styles.input}
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="doctor">Doctor</option>
                  <option value="pharmacist">Pharmacist</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Phone</label>
                <input
                  type="tel"
                  className={styles.input}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Date of Birth</label>
                <input
                  type="date"
                  className={styles.input}
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Gender</label>
                <select
                  className={styles.input}
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Hospital</label>
                <select
                  className={styles.input}
                  value={formData.hospitalId}
                  onChange={(e) => setFormData({ ...formData, hospitalId: e.target.value })}
                >
                  <option value="">Select Hospital</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital._id} value={hospital._id}>
                      {hospital.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.role === "doctor" && (
                <>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Specialization</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      placeholder="e.g., Cardiologist"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>License Number</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Department</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g., Cardiology"
                    />
                  </div>
                </>
              )}
            </div>

            <button type="submit" className={styles.primaryButton} style={{ marginTop: "1rem" }}>
              Register Staff Member
            </button>
          </form>
        </div>
      )}

      <div className={styles.card}>
        {staff.length > 0 ? (
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Specialization</th>
                <th>Department</th>
                <th>License No.</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {staff.map((member) => (
                <tr key={member._id}>
                  <td>{member.name}</td>
                  <td>{member.email}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[member.role]}`}>{member.role}</span>
                  </td>
                  <td>{member.phone || "N/A"}</td>
                  <td>{member.specialization || "N/A"}</td>
                  <td>{member.department || "N/A"}</td>
                  <td>{member.licenseNumber || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👨‍⚕️</div>
            <div className={styles.emptyText}>No staff members found</div>
          </div>
        )}
      </div>
    </div>
  )
}
