"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "../doctor.module.css"

interface User {
  _id: string
  name: string
  email: string
  phone?: string
  specialization?: string
  licenseNumber?: string
  department?: string
}

export default function DoctorProfile() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    specialization: "",
    licenseNumber: "",
    department: "",
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
        specialization: data.user.specialization || "",
        licenseNumber: data.user.licenseNumber || "",
        department: data.user.department || "",
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

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setMessage("New passwords do not match")
      setSaving(false)
      return
    }

    try {
      const updateData: any = {
        name: formData.name,
        phone: formData.phone,
        specialization: formData.specialization,
        department: formData.department,
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
          <button className={styles.navItem} onClick={() => router.push("/doctor/dashboard")}>
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
              <div className={styles.userName}>Dr. {user?.name}</div>
              <div className={styles.userRole}>{user?.specialization || "Doctor"}</div>
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
          <p className={styles.pageSubtitle}>Update your professional information</p>
        </div>

        <div className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Professional Information</h3>

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
                <label className={styles.formLabel}>Specialization</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  placeholder="e.g., Cardiology, Pediatrics"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>License Number (cannot be changed)</label>
                <input type="text" className={styles.formInput} value={formData.licenseNumber} disabled />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Department</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g., Emergency, Surgery"
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
                onClick={() => router.push("/doctor/dashboard")}
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
