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

// Info Item Component for View Mode
const InfoItem = ({ label, value, isLong }: { label: string; value: string; isLong?: boolean }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
    <label style={{ 
      fontSize: "12px", 
      fontWeight: "600", 
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: "0.5px"
    }}>
      {label}
    </label>
    <div style={{
      padding: isLong ? "12px 16px" : "10px 16px",
      background: "#f8fafc",
      borderRadius: "8px",
      border: "1px solid #e2e8f0",
      fontSize: "15px",
      color: "#1e293b",
      fontWeight: "500",
      minHeight: isLong ? "60px" : "auto",
      whiteSpace: isLong ? "pre-wrap" : "nowrap",
      wordBreak: isLong ? "break-word" : "normal"
    }}>
      {value}
    </div>
  </div>
)

export default function PatientProfile() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Record<string, { from: any; to: any }> | null>(null)
  const [changeLogId, setChangeLogId] = useState<string | null>(null)
  const [undoTimer, setUndoTimer] = useState<number | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
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
      // compute diff for confirmation
      const changes: Record<string, { from: any; to: any }> = {}
      if (user) {
        const keys = Object.keys(updateData)
        for (const k of keys) {
          const oldVal = (user as any)[k] ?? null
          const newVal = updateData[k] ?? null
          if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            changes[k] = { from: oldVal, to: newVal }
          }
        }
      }

      if (Object.keys(changes).length === 0) {
        setMessage("No changes to save")
        setSaving(false)
        return
      }

      // show confirmation modal
      setPendingChanges(changes)
      setShowConfirm(true)
      return
    } catch (error: any) {
      console.error("[v0] Update profile error:", error)
      setMessage(error.message || "Failed to update profile")
    }

  }

  const confirmAndSend = async () => {
    setShowConfirm(false)
    setSaving(true)
    if (!pendingChanges) return

    try {
      // build payload from pendingChanges 'to' values
      const payload: any = {}
      for (const [k, v] of Object.entries(pendingChanges)) {
        payload[k] = v.to
      }

      // if password change present in formData, include it as well
      if (formData.currentPassword && formData.newPassword) {
        payload.currentPassword = formData.currentPassword
        payload.newPassword = formData.newPassword
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile")
      }

      setMessage("Profile updated successfully!")
      setUser(data.user)
      setChangeLogId(data.changeLogId || null)
      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))

      // Exit edit mode and show view mode
      setTimeout(() => {
        setIsEditMode(false)
      }, 2000)

      // start undo timer (60s)
      let remaining = 60
      setUndoTimer(remaining)
      const iv = setInterval(() => {
        remaining -= 1
        setUndoTimer(remaining)
        if (remaining <= 0) {
          clearInterval(iv)
          setChangeLogId(null)
          setUndoTimer(null)
        }
      }, 1000)

    } catch (error: any) {
      console.error("Profile save failed:", error)
      setMessage(error.message || "Failed to update profile")
    } finally {
      setSaving(false)
      setPendingChanges(null)
    }
  }

  const handleUndo = async () => {
    if (!changeLogId) return
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeLogId }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to undo")
      setUser(data.user)
      setMessage("Changes reverted")
      setChangeLogId(null)
      setUndoTimer(null)
    } catch (err: any) {
      console.error("Undo failed:", err)
      setMessage(err.message || "Undo failed")
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
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
        <div style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "32px 40px",
          borderRadius: "16px",
          marginBottom: "24px",
          color: "white",
          boxShadow: "0 8px 24px rgba(102, 126, 234, 0.3)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "8px" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(10px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              border: "2px solid rgba(255, 255, 255, 0.3)"
            }}>
              ⚙️
            </div>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: "28px", 
                fontWeight: "700",
                textShadow: "0 2px 8px rgba(0, 0, 0, 0.1)"
              }}>
                My Profile Settings
              </h1>
              <p style={{ 
                margin: "4px 0 0 0", 
                fontSize: "15px", 
                opacity: 0.95,
                fontWeight: "400"
              }}>
                Manage your personal information and account security
              </p>
            </div>
          </div>
        </div>

        {/* View Mode - Display Profile */}
        {!isEditMode && (
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            
            {/* Success/Info Messages in View Mode */}
            {message && !isEditMode && (
              <div style={{
                padding: "16px 20px",
                borderRadius: "12px",
                marginBottom: "24px",
                border: message.includes("success") || message.includes("reverted") ? "1px solid #bbf7d0" : "1px solid #fecaca",
                background: message.includes("success") || message.includes("reverted") 
                  ? "linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)" 
                  : "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                color: message.includes("success") || message.includes("reverted") ? "#166534" : "#991b1b",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: message.includes("success") || message.includes("reverted") 
                  ? "0 4px 12px rgba(34, 197, 94, 0.2)" 
                  : "0 4px 12px rgba(239, 68, 68, 0.2)",
                animation: "slideDown 0.3s ease-out"
              }}>
                <span style={{ fontSize: "20px" }}>
                  {message.includes("success") || message.includes("reverted") ? "✓" : "⚠"}
                </span>
                <span>{message}</span>
              </div>
            )}

            {/* Undo banner in View Mode */}
            {changeLogId && undoTimer !== null && !isEditMode && (
              <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                padding: "16px 24px",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(102, 126, 234, 0.4)",
                animation: "slideDown 0.3s ease-out",
                position: "relative",
                overflow: "hidden",
                marginBottom: "24px"
              }}>
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "4px",
                  background: "#fbbf24",
                  width: `${(undoTimer / 60) * 100}%`,
                  transition: "width 1s linear"
                }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "white" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "24px" }}>✓</span>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "15px" }}>Changes saved successfully!</div>
                      <div style={{ fontSize: "13px", opacity: 0.9, marginTop: "2px" }}>
                        You can undo this action for <strong style={{ fontWeight: "700" }}>{undoTimer}s</strong>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      onClick={handleUndo}
                      style={{
                        background: "white",
                        color: "#667eea",
                        border: "none",
                        padding: "8px 20px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontSize: "14px",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                      }}
                    >
                      ↶ Undo
                    </button>
                    <button 
                      onClick={() => { setChangeLogId(null); setUndoTimer(null); }}
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.3)",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontWeight: "500",
                        cursor: "pointer",
                        fontSize: "14px",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Overview Card */}
            <div style={{
              background: "white",
              borderRadius: "16px",
              padding: "32px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              border: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              gap: "24px",
              flexWrap: "wrap",
              marginBottom: "24px"
            }}>
              <div style={{
                width: "96px",
                height: "96px",
                borderRadius: "20px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "40px",
                fontWeight: "700",
                color: "white",
                boxShadow: "0 8px 24px rgba(102, 126, 234, 0.4)"
              }}>
                {user?.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>
                  {user?.name}
                </h2>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  marginTop: "8px",
                  color: "#64748b",
                  fontSize: "14px"
                }}>
                  <span>✉️</span>
                  <span>{user?.email}</span>
                </div>
                <div style={{
                  marginTop: "12px",
                  display: "inline-block",
                  padding: "6px 14px",
                  background: "#dcfce7",
                  color: "#166534",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: "600"
                }}>
                  Patient Account
                </div>
              </div>
              <button
                onClick={() => setIsEditMode(true)}
                style={{
                  padding: "12px 24px",
                  borderRadius: "10px",
                  border: "none",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  fontWeight: "600",
                  fontSize: "15px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
                }}
              >
                <span>✏️</span>
                Edit Profile
              </button>
            </div>

            {/* Information Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "24px"
            }}>
              {/* Personal Information Card - View */}
              <div style={{
                background: "white",
                borderRadius: "16px",
                padding: "0",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                border: "1px solid #e2e8f0",
                overflow: "hidden"
              }}>
                <div style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  padding: "20px 24px",
                  color: "white"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "24px" }}>👤</span>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
                      Personal Information
                    </h3>
                  </div>
                </div>
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <InfoItem label="Full Name" value={user?.name || "Not set"} />
                  <InfoItem label="Email" value={user?.email || "Not set"} />
                  <InfoItem label="Phone" value={(user as any)?.phone || "Not set"} />
                  <InfoItem label="Date of Birth" value={(user as any)?.dateOfBirth || "Not set"} />
                  <InfoItem label="Gender" value={(user as any)?.gender || "Not set"} />
                  <InfoItem label="Address" value={(user as any)?.address || "Not set"} isLong />
                  <InfoItem label="Emergency Contact" value={(user as any)?.emergencyContact || "Not set"} />
                </div>
              </div>

              {/* Medical Information Card - View */}
              <div style={{
                background: "white",
                borderRadius: "16px",
                padding: "0",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                border: "1px solid #e2e8f0",
                overflow: "hidden"
              }}>
                <div style={{
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  padding: "20px 24px",
                  color: "white"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "24px" }}>🏥</span>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
                      Medical Information
                    </h3>
                  </div>
                </div>
                <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <InfoItem label="Blood Group" value={(user as any)?.bloodGroup || "Not set"} />
                  <InfoItem label="Allergies" value={(user as any)?.allergies || "None"} />
                  <InfoItem label="Medical History" value={(user as any)?.medicalHistory || "None"} isLong />
                </div>
              </div>

              {/* Security Card - View */}
              <div style={{
                background: "white",
                borderRadius: "16px",
                padding: "0",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                border: "1px solid #e2e8f0",
                overflow: "hidden"
              }}>
                <div style={{
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  padding: "20px 24px",
                  color: "white"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "24px" }}>🔒</span>
                    <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
                      Security
                    </h3>
                  </div>
                </div>
                <div style={{ padding: "24px" }}>
                  <div style={{
                    padding: "20px",
                    background: "#fef3c7",
                    borderRadius: "12px",
                    border: "1px solid #fde68a",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔐</div>
                    <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "600", color: "#92400e" }}>
                      Password Protected
                    </h4>
                    <p style={{ margin: 0, fontSize: "13px", color: "#92400e" }}>
                      Your account is secured with a password. Click "Edit Profile" to change it.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Mode - Edit Forms */}
        {isEditMode && (
        <form onSubmit={handleSubmit} style={{ 
          display: "grid", 
          gap: "24px",
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          {/* Profile Overview Card */}
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "24px",
            flexWrap: "wrap"
          }}>
            <div style={{
              width: "96px",
              height: "96px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "40px",
              fontWeight: "700",
              color: "white",
              boxShadow: "0 8px 24px rgba(102, 126, 234, 0.4)"
            }}>
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: "200px" }}>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>
                {user?.name}
              </h2>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "8px", 
                marginTop: "8px",
                color: "#64748b",
                fontSize: "14px"
              }}>
                <span>✉️</span>
                <span>{user?.email}</span>
              </div>
              <div style={{
                marginTop: "12px",
                display: "inline-block",
                padding: "6px 14px",
                background: "#dcfce7",
                color: "#166534",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "600"
              }}>
                Patient Account
              </div>
            </div>
          </div>

          {/* Main Grid Layout */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px"
          }}>
            {/* Personal Information Card */}
            <div style={{
              background: "white",
              borderRadius: "16px",
              padding: "0",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              border: "1px solid #e2e8f0",
              overflow: "hidden"
            }}>
              <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "20px 24px",
                color: "white"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>👤</span>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
                    Personal Details
                  </h3>
                </div>
              </div>
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "2px solid #e2e8f0",
                      fontSize: "15px",
                      transition: "all 0.2s ease",
                      outline: "none"
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Email Address</label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "2px solid #e2e8f0",
                      fontSize: "15px",
                      background: "#f8fafc",
                      color: "#94a3b8",
                      cursor: "not-allowed"
                    }}
                  />
                  <span style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                    Email cannot be changed
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "2px solid #e2e8f0",
                      fontSize: "15px",
                      transition: "all 0.2s ease",
                      outline: "none"
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        border: "2px solid #e2e8f0",
                        fontSize: "15px",
                        transition: "all 0.2s ease",
                        outline: "none"
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                    />
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "10px",
                        border: "2px solid #e2e8f0",
                        fontSize: "15px",
                        transition: "all 0.2s ease",
                        outline: "none",
                        background: "white"
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
                      onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Enter your full address"
                    rows={3}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "2px solid #e2e8f0",
                      fontSize: "15px",
                      transition: "all 0.2s ease",
                      outline: "none",
                      fontFamily: "inherit",
                      resize: "vertical"
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Emergency Contact</label>
                  <input
                    type="tel"
                    value={formData.emergencyContact || ""}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="Emergency contact number"
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "2px solid #e2e8f0",
                      fontSize: "15px",
                      transition: "all 0.2s ease",
                      outline: "none"
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#667eea"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                  />
                </div>
              </div>
            </div>

            {/* Medical Information Card */}
            <div style={{
              background: "white",
              borderRadius: "16px",
              padding: "0",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              border: "1px solid #e2e8f0",
              overflow: "hidden"
            }}>
              <div style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                padding: "20px 24px",
                color: "white"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "24px" }}>🏥</span>
                  <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
                    Medical Information
                  </h3>
                </div>
              </div>
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "2px solid #e2e8f0",
                      fontSize: "15px",
                      transition: "all 0.2s ease",
                      outline: "none",
                      background: "white"
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#10b981"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
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

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Allergies</label>
                  <input
                    type="text"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="E.g., Penicillin, Dust, Peanuts"
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "2px solid #e2e8f0",
                      fontSize: "15px",
                      transition: "all 0.2s ease",
                      outline: "none"
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#10b981"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                  />
                  <span style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                    Separate multiple allergies with commas
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Medical History</label>
                  <textarea
                    value={formData.medicalHistory}
                    onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                    placeholder="Describe previous illnesses, surgeries, or ongoing conditions"
                    rows={4}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "2px solid #e2e8f0",
                      fontSize: "15px",
                      transition: "all 0.2s ease",
                      outline: "none",
                      fontFamily: "inherit",
                      resize: "vertical"
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = "#10b981"}
                    onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings Card */}
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "0",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0",
            overflow: "hidden"
          }}>
            <div style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              padding: "20px 24px",
              color: "white"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "24px" }}>🔒</span>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700" }}>
                  Security Settings
                </h3>
              </div>
              <p style={{ margin: "6px 0 0 0", fontSize: "13px", opacity: 0.9 }}>
                Change your password to keep your account secure
              </p>
            </div>
            <div style={{ 
              padding: "24px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px"
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Current Password</label>
                <input
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "2px solid #e2e8f0",
                    fontSize: "15px",
                    transition: "all 0.2s ease",
                    outline: "none"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>New Password</label>
                <input
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "2px solid #e2e8f0",
                    fontSize: "15px",
                    transition: "all 0.2s ease",
                    outline: "none"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b" }}>Confirm New Password</label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    border: "2px solid #e2e8f0",
                    fontSize: "15px",
                    transition: "all 0.2s ease",
                    outline: "none"
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = "#f59e0b"}
                  onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            padding: "24px",
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            border: "1px solid #e2e8f0"
          }}>
            <button
              type="button"
              onClick={() => {
                setIsEditMode(false);
                // Reset form data to original user data
                if (user) {
                  setFormData({
                    name: (user as any).name || "",
                    phone: (user as any).phone || "",
                    dateOfBirth: (user as any).dateOfBirth || "",
                    gender: (user as any).gender || "",
                    address: (user as any).address || "",
                    allergies: (user as any).allergies || "",
                    bloodGroup: (user as any).bloodGroup || "",
                    emergencyContact: (user as any).emergencyContact || "",
                    medicalHistory: (user as any).medicalHistory || "",
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }
              }}
              style={{
                padding: "12px 28px",
                borderRadius: "10px",
                border: "2px solid #e2e8f0",
                background: "white",
                color: "#64748b",
                fontWeight: "600",
                fontSize: "15px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#f8fafc";
                e.currentTarget.style.borderColor = "#cbd5e1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: "12px 32px",
                borderRadius: "10px",
                border: "none",
                background: saving ? "#94a3b8" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                fontWeight: "600",
                fontSize: "15px",
                cursor: saving ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                boxShadow: saving ? "none" : "0 4px 12px rgba(102, 126, 234, 0.4)",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.5)";
                }
              }}
              onMouseLeave={(e) => {
                if (!saving) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
                }
              }}
            >
              {saving ? (
                <>
                  <span style={{ 
                    display: "inline-block",
                    width: "16px",
                    height: "16px",
                    border: "2px solid white",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite"
                  }} />
                  Saving...
                </>
              ) : (
                <>
                  <span>💾</span>
                  Save Changes
                </>
              )}
            </button>
          </div>

          {message && (
              <div style={{
                padding: "16px 20px",
                borderRadius: "12px",
                border: message.includes("success") || message.includes("reverted") ? "1px solid #bbf7d0" : "1px solid #fecaca",
                background: message.includes("success") || message.includes("reverted") 
                  ? "linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%)" 
                  : "linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)",
                color: message.includes("success") || message.includes("reverted") ? "#166534" : "#991b1b",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: message.includes("success") || message.includes("reverted") 
                  ? "0 4px 12px rgba(34, 197, 94, 0.2)" 
                  : "0 4px 12px rgba(239, 68, 68, 0.2)",
                animation: "slideDown 0.3s ease-out"
              }}>
                <span style={{ fontSize: "20px" }}>
                  {message.includes("success") || message.includes("reverted") ? "✓" : "⚠"}
                </span>
                <span>{message}</span>
              </div>
            )}

            {/* Undo banner - Enhanced */}
            {changeLogId && undoTimer !== null && (
              <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                border: "none",
                padding: "16px 24px",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(102, 126, 234, 0.4)",
                animation: "slideDown 0.3s ease-out",
                position: "relative",
                overflow: "hidden"
              }}>
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  height: "4px",
                  background: "#fbbf24",
                  width: `${(undoTimer / 60) * 100}%`,
                  transition: "width 1s linear"
                }} />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "white" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "24px" }}>✓</span>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "15px" }}>Changes saved successfully!</div>
                      <div style={{ fontSize: "13px", opacity: 0.9, marginTop: "2px" }}>
                        You can undo this action for <strong style={{ fontWeight: "700" }}>{undoTimer}s</strong>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button 
                      onClick={handleUndo}
                      style={{
                        background: "white",
                        color: "#667eea",
                        border: "none",
                        padding: "8px 20px",
                        borderRadius: "8px",
                        fontWeight: "600",
                        cursor: "pointer",
                        fontSize: "14px",
                        transition: "all 0.2s ease",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
                      }}
                    >
                      ↶ Undo
                    </button>
                    <button 
                      onClick={() => { setChangeLogId(null); setUndoTimer(null); }}
                      style={{
                        background: "rgba(255,255,255,0.2)",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.3)",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontWeight: "500",
                        cursor: "pointer",
                        fontSize: "14px",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.3)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm modal - Enhanced */}
            {showConfirm && pendingChanges && (
              <div style={{
                position: "fixed",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0, 0, 0, 0.6)",
                backdropFilter: "blur(4px)",
                zIndex: 9999,
                animation: "fadeIn 0.2s ease-out"
              }}>
                <div style={{
                  background: "white",
                  padding: "0",
                  borderRadius: "16px",
                  width: "min(600px, 90vw)",
                  maxHeight: "85vh",
                  overflow: "hidden",
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                  animation: "scaleIn 0.3s ease-out"
                }}>
                  {/* Modal Header */}
                  <div style={{
                    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    padding: "24px 28px",
                    color: "white"
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: "22px",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px"
                    }}>
                      <span style={{ fontSize: "28px" }}>🔍</span>
                      Confirm Profile Changes
                    </h3>
                    <p style={{
                      margin: "8px 0 0 0",
                      fontSize: "14px",
                      opacity: 0.95,
                      fontWeight: "400"
                    }}>
                      Please review the changes below before saving
                    </p>
                  </div>

                  {/* Modal Body */}
                  <div style={{
                    padding: "28px",
                    maxHeight: "calc(85vh - 200px)",
                    overflowY: "auto"
                  }}>
                    <div style={{
                      background: "#f8fafc",
                      borderRadius: "12px",
                      padding: "20px",
                      border: "1px solid #e2e8f0"
                    }}>
                      {Object.entries(pendingChanges).map(([key, value], index) => (
                        <div
                          key={key}
                          style={{
                            padding: "16px",
                            background: "white",
                            borderRadius: "8px",
                            marginBottom: index < Object.entries(pendingChanges).length - 1 ? "12px" : "0",
                            border: "1px solid #e2e8f0",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <div style={{
                            fontSize: "12px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                            color: "#64748b",
                            letterSpacing: "0.5px",
                            marginBottom: "8px"
                          }}>
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            flexWrap: "wrap"
                          }}>
                            <div style={{
                              flex: "1",
                              minWidth: "120px",
                              padding: "10px 14px",
                              background: "#fee2e2",
                              borderRadius: "6px",
                              fontSize: "14px",
                              color: "#991b1b",
                              border: "1px solid #fecaca",
                              wordBreak: "break-word"
                            }}>
                              <div style={{ fontSize: "11px", fontWeight: "600", marginBottom: "4px", opacity: 0.7 }}>Previous</div>
                              {String(value.from ?? "(empty)")}
                            </div>
                            <div style={{
                              fontSize: "18px",
                              color: "#64748b",
                              fontWeight: "bold"
                            }}>
                              →
                            </div>
                            <div style={{
                              flex: "1",
                              minWidth: "120px",
                              padding: "10px 14px",
                              background: "#dcfce7",
                              borderRadius: "6px",
                              fontSize: "14px",
                              color: "#166534",
                              border: "1px solid #bbf7d0",
                              wordBreak: "break-word"
                            }}>
                              <div style={{ fontSize: "11px", fontWeight: "600", marginBottom: "4px", opacity: 0.7 }}>New</div>
                              {String(value.to ?? "(empty)")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Important notice */}
                    {Object.keys(pendingChanges).some(k => 
                      ["email", "phone", "dateOfBirth", "address", "emergencyContact", "bloodGroup"].includes(k)
                    ) && (
                      <div style={{
                        marginTop: "20px",
                        padding: "14px 16px",
                        background: "#fef3c7",
                        border: "1px solid #fde68a",
                        borderRadius: "8px",
                        display: "flex",
                        gap: "12px",
                        alignItems: "flex-start"
                      }}>
                        <span style={{ fontSize: "20px" }}>⚠️</span>
                        <div style={{ fontSize: "13px", color: "#92400e", lineHeight: "1.5" }}>
                          <strong>Important:</strong> You're changing sensitive information.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div style={{
                    padding: "20px 28px",
                    background: "#f8fafc",
                    borderTop: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px"
                  }}>
                    <button
                      type="button"
                      onClick={() => { setShowConfirm(false); setPendingChanges(null); }}
                      style={{
                        padding: "10px 24px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        background: "white",
                        color: "#475569",
                        fontWeight: "600",
                        fontSize: "14px",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#f1f5f9";
                        e.currentTarget.style.borderColor = "#94a3b8";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "white";
                        e.currentTarget.style.borderColor = "#cbd5e1";
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmAndSend}
                      style={{
                        padding: "10px 28px",
                        borderRadius: "8px",
                        border: "none",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        fontWeight: "600",
                        fontSize: "14px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(102, 126, 234, 0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
                      }}
                    >
                      ✓ Confirm and Save
                    </button>
                  </div>
                </div>
              </div>
            )}

          </form>
        )}
      </main>
    </div>
    </>
  )
}
