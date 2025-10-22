"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "../admin.module.css"

interface Hospital {
  _id: string
  name: string
  address: string
  phone: string
  email: string
  registrationNumber: string
  type: string
  departments: string[]
  facilities: string[]
  status: string
}

export default function HospitalsPage() {
  const router = useRouter()
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    registrationNumber: "",
    type: "private",
    departments: "",
    facilities: "",
  })

  useEffect(() => {
    fetchHospitals()
  }, [])

  const fetchHospitals = async () => {
    try {
      const response = await fetch("/api/hospitals")
      if (!response.ok) throw new Error("Failed to fetch hospitals")
      const data = await response.json()
      setHospitals(data.hospitals)
    } catch (error) {
      console.error("[v0] Fetch hospitals error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch("/api/hospitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          departments: formData.departments.split(",").map((d) => d.trim()),
          facilities: formData.facilities.split(",").map((f) => f.trim()),
        }),
      })

      if (!response.ok) throw new Error("Failed to create hospital")

      setShowForm(false)
      setFormData({
        name: "",
        address: "",
        phone: "",
        email: "",
        registrationNumber: "",
        type: "private",
        departments: "",
        facilities: "",
      })
      fetchHospitals()
    } catch (error) {
      console.error("[v0] Create hospital error:", error)
      alert("Failed to create hospital")
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Hospital Management</h1>
          <p className={styles.pageSubtitle}>Manage healthcare facilities</p>
        </div>
        <button className={styles.primaryButton} onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ Add Hospital"}
        </button>
      </div>

      {showForm && (
        <div className={styles.card} style={{ marginBottom: "2rem" }}>
          <h3 className={styles.cardTitle}>Add New Hospital</h3>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Hospital Name</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Registration Number</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
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
                <label className={styles.label}>Phone</label>
                <input
                  type="tel"
                  className={styles.input}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Type</label>
                <select
                  className={styles.input}
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="government">Government</option>
                  <option value="private">Private</option>
                  <option value="clinic">Clinic</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Address</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Departments (comma-separated)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.departments}
                  onChange={(e) => setFormData({ ...formData, departments: e.target.value })}
                  placeholder="Cardiology, Neurology, Pediatrics"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Facilities (comma-separated)</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.facilities}
                  onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  placeholder="ICU, Emergency, Laboratory"
                />
              </div>
            </div>

            <button type="submit" className={styles.primaryButton} style={{ marginTop: "1rem" }}>
              Create Hospital
            </button>
          </form>
        </div>
      )}

      <div className={styles.card}>
        {hospitals.length > 0 ? (
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th>Name</th>
                <th>Registration No.</th>
                <th>Type</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Departments</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {hospitals.map((hospital) => (
                <tr key={hospital._id}>
                  <td>{hospital.name}</td>
                  <td>{hospital.registrationNumber}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[hospital.type]}`}>{hospital.type}</span>
                  </td>
                  <td>{hospital.phone}</td>
                  <td>{hospital.email}</td>
                  <td>{hospital.departments.slice(0, 3).join(", ")}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[hospital.status]}`}>{hospital.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏥</div>
            <div className={styles.emptyText}>No hospitals found</div>
          </div>
        )}
      </div>
    </div>
  )
}
