"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "../patient.module.css"

interface User {
  _id: string
  name: string
  email: string
  phone?: string
  dateOfBirth?: string
  gender?: string
  address?: string
}

export default function PatientProfile() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    allergies: "",
    bloodGroup: "",
    emergencyContact: "",
    medicalHistory: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile")
      if (!response.ok) throw new Error("Failed to fetch profile")
      const data = await response.json()
      setUser(data.user)
      setFormData({
        name: data.user.name || "",
        phone: data.user.phone || "",
        dateOfBirth: data.user.dateOfBirth || "",
        gender: data.user.gender || "",
        address: data.user.address || "",
        allergies: data.user.allergies || "",
        bloodGroup: data.user.bloodGroup || "",
        emergencyContact: data.user.emergencyContact || "",
        medicalHistory: data.user.medicalHistory || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      console.error("[v0] Fetch profile error:", error)
      router.push("/auth/login")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage("")

    // Validate password change
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage("New passwords do not match")
      setSaving(false)
      return
    }

    try {
      const updateData: any = {
        name: formData.name,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        allergies: formData.allergies,
        bloodGroup: formData.bloodGroup,
        emergencyContact: formData.emergencyContact,
        medicalHistory: formData.medicalHistory,
      }

      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword
        updateData.newPassword = formData.newPassword
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile")
      }

      setMessage("Profile updated successfully!")
      setUser(data.user)
      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    } catch (error: any) {
      console.error("[v0] Update profile error:", error)
      setMessage(error.message || "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className={styles.dashboardLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>H+</div>
            <div className={styles.logoText}>Carenet360</div>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <button className={styles.navItem} onClick={() => router.push("/patient/dashboard")}>
            <span className={styles.navIcon}>📊</span>
            Dashboard
          </button>
          <button className={`${styles.navItem} ${styles.active}`}>
            <span className={styles.navIcon}>👤</span>
            Profile
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{user?.name.charAt(0).toUpperCase()}</div>
            <div>
              <div className={styles.userName}>{user?.name}</div>
              <div className={styles.userRole}>Patient</div>
            </div>
          </div>
          <button className={styles.logoutButton} onClick={() => router.push("/auth/login")}>
            Logout
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My Profile</h1>
          <p className={styles.pageSubtitle}>Update your personal information</p>
        </div>

        <div className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form} style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            width: "100%",
            maxWidth: "720px",
            margin: "0 auto",
            backgroundColor: "#ffffff",
            padding: "32px 36px",
            borderRadius: "16px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
            transition: "all 0.3s ease",
          }}>
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Personal Information</h3>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email (cannot be changed)</label>
                <input type="email" className={styles.formInput} value={user?.email} disabled />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone Number</label>
                <input
                  type="tel"
                  className={styles.formInput}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1234567890"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Date of Birth</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Gender</label>
                <select
                  className={styles.formSelect}
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Address</label>
                <textarea
                  className={styles.formTextarea}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter your full address"
                  rows={3}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Allergies</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="E.g., Penicillin, Dust, Peanuts"
                />
                <small className={styles.formHint}>
                  Separate multiple allergies with commas
                </small>
              </div>

              {/* Blood Group */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Blood Group</label>
                <select
                  className={styles.formSelect}
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                >
                  <option value="">Select blood group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Medical History</label>
                <textarea
                  className={styles.formTextarea}
                  value={formData.medicalHistory}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  placeholder="Describe previous illnesses, surgeries, or ongoing conditions"
                  rows={4}
                />
              </div>

              {/* Emergency Contact */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Emergency Contact</label>
                <input
                  type="tel"
                  className={styles.formInput}
                  value={formData.emergencyContact || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyContact: e.target.value })
                  }
                  placeholder="Full name of emergency contact"
                />
              </div>

            </div>

            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Change Password</h3>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Current Password</label>
                <input
                  type="password"
                  className={styles.formInput}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>New Password</label>
                <input
                  type="password"
                  className={styles.formInput}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Confirm New Password</label>
                <input
                  type="password"
                  className={styles.formInput}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {message && (
              <div className={message.includes("success") ? styles.successMessage : styles.errorMessage}>{message}</div>
            )}

            <div className={styles.formActions}>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={() => router.push("/patient/dashboard")}
              >
                Cancel
              </button>
              <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
