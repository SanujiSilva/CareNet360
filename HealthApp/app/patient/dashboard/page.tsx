"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "../patient.module.css"
import type { TimeSlot } from "@/lib/types"
import { toast } from '@/hooks/use-toast'

interface User {
  id: string
  name: string
  email: string
  role: string
  allergies?: string
  bloodGroup?: string
  medicalHistory?: string
  emergencyContact?: string
  
}

interface Appointment {
  _id: string
  doctor: any
  date: string
  time: string
  status: string
  reason: string
}



export default function PatientDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState("dashboard")
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [topBanner, setTopBanner] = useState<{ type: 'success' | 'error' | 'info' | null; text?: string }>({ type: null })

  useEffect(() => {
    fetchUserData()
    fetchAppointments()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/me")
      if (!response.ok) throw new Error("Failed to fetch user")
      const data = await response.json()
      setUser(data.user)
    } catch (error) {
      console.error("[v0] Fetch user error:", error)
      router.push("/auth/login")
    } finally {
      setLoading(false)
    }
  }

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/appointments")
      if (!response.ok) throw new Error("Failed to fetch appointments")
      const data = await response.json()
      setAppointments(data.appointments)
    } catch (error) {
      console.error("[v0] Fetch appointments error:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/auth/login")
    } catch (error) {
      console.error("[v0] Logout error:", error)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  const upcomingAppointments = appointments.filter((apt) => apt.status === "scheduled")

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
          <button
            className={`${styles.navItem} ${activeView === "dashboard" ? styles.active : ""}`}
            onClick={() => setActiveView("dashboard")}
          >
            <span className={styles.navIcon}>📊</span>
            Dashboard
          </button>
          <button className={styles.navItem} onClick={() => router.push("/patient/profile")}>
            <span className={styles.navIcon}>👤</span>
            Profile
          </button>
          <button
            className={`${styles.navItem} ${activeView === "appointments" ? styles.active : ""}`}
            onClick={() => setActiveView("appointments")}
          >
            <span className={styles.navIcon}>📅</span>
            Appointments
          </button>
          <button
            className={`${styles.navItem} ${activeView === "health-card" ? styles.active : ""}`}
            onClick={() => setActiveView("health-card")}
          >
            <span className={styles.navIcon}>💳</span>
            Health Card
          </button>
          <button
            className={`${styles.navItem} ${activeView === "records" ? styles.active : ""}`}
            onClick={() => setActiveView("records")}
          >
            <span className={styles.navIcon}>📋</span>
            Medical Records
          </button>
          <button
            className={`${styles.navItem} ${activeView === "prescriptions" ? styles.active : ""}`}
            onClick={() => setActiveView("prescriptions")}
          >
            <span className={styles.navIcon}>💊</span>
            Prescriptions
          </button>
          <button className={styles.navItem} onClick={() => router.push("/patient/payments")}>
            <span className={styles.navIcon}>💰</span>
            Payments
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
          <button className={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        {activeView === "dashboard" && (
          <>
            {/* Global top banner (appears at top of main content) */}
            {topBanner.type && topBanner.text && (
              <div className={`${styles.topBanner} ${topBanner.type === 'error' ? styles.topBannerError : topBanner.type === 'success' ? styles.topBannerSuccess : styles.topBannerInfo}`}>
                <div>{topBanner.text}</div>
                <button className={styles.topBannerClose} onClick={() => setTopBanner({ type: null })} aria-label="Close">×</button>
              </div>
            )}
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Welcome back, {user?.name}!</h1>
              <p className={styles.pageSubtitle}>Here's your health overview</p>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Total Appointments</span>
                  <div className={`${styles.statIcon} ${styles.primary}`}>📅</div>
                </div>
                <div className={styles.statValue}>{appointments.length}</div>
                <div className={styles.statChange}>All time</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Upcoming</span>
                  <div className={`${styles.statIcon} ${styles.secondary}`}>⏰</div>
                </div>
                <div className={styles.statValue}>{upcomingAppointments.length}</div>
                <div className={styles.statChange}>Scheduled</div>
              </div>


              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Health Score</span>
                  <div className={`${styles.statIcon} ${styles.success}`}>❤️</div>
                </div>
                <div className={styles.statValue}>95%</div>
                <div className={styles.statChange}>Excellent</div>
              </div>
            </div>

            <div className={styles.contentGrid}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Upcoming Appointments</h2>
                  <button className={styles.cardAction} onClick={() => setShowBookingModal(true)}>
                    Book New
                  </button>
                </div>

                {upcomingAppointments.length > 0 ? (
                  <div className={styles.appointmentsList}>
                    {upcomingAppointments.slice(0, 3).map((appointment) => (
                      <div key={appointment._id} className={styles.appointmentItem}>
                        <div className={styles.appointmentHeader}>
                          <span className={styles.doctorName}>Dr. {appointment.doctor?.name || "Unknown"}</span>
                          <span className={`${styles.appointmentStatus} ${styles[appointment.status]}`}>
                            {appointment.status}
                          </span>
                        </div>
                        <div className={styles.appointmentDetails}>
                          <span>📅 {new Date(appointment.date).toLocaleDateString()}</span>
                          <span>🕐 {appointment.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📅</div>
                    <div className={styles.emptyText}>No upcoming appointments</div>
                  </div>
                )}
              </div>

              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Quick Actions</h2>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <button
                    className={styles.cardAction}
                    style={{ width: "100%" }}
                    onClick={() => setShowBookingModal(true)}
                  >
                    📅 Book Appointment
                  </button>
                  <button
                    className={styles.cardAction}
                    style={{ width: "100%" }}
                    onClick={() => setActiveView("health-card")}
                  >
                    💳 View Health Card
                  </button>
                  <button
                    className={styles.cardAction}
                    style={{ width: "100%" }}
                    onClick={() => setActiveView("records")}
                  >
                    📋 Medical Records
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeView === "appointments" && (
          <>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>My Appointments</h1>
              <p className={styles.pageSubtitle}>Manage your appointments with doctors</p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>All Appointments</h2>
                <button className={styles.cardAction} onClick={() => setShowBookingModal(true)}>
                  Book New Appointment
                </button>
              </div>

              {appointments.length > 0 ? (
                <div className={styles.appointmentsList}>
                  {appointments.map((appointment) => (
                    <div key={appointment._id} className={styles.appointmentItem}>
                      <div className={styles.appointmentHeader}>
                        <span className={styles.doctorName}>Dr. {appointment.doctor?.name || "Unknown"}</span>
                        <span className={`${styles.appointmentStatus} ${styles[appointment.status]}`}>
                          {appointment.status}
                        </span>
                      </div>
                      <div className={styles.appointmentDetails}>
                        <span>📅 {new Date(appointment.date).toLocaleDateString()}</span>
                        <span>🕐 {appointment.time}</span>
                        <span>📝 {appointment.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📅</div>
                  <div className={styles.emptyText}>No appointments found</div>
                </div>
              )}
            </div>
          </>
        )}

        {activeView === "health-card" && user && <HealthCardView patient={user} />}

        {activeView === "records" && <MedicalRecordsView />}
        {activeView === "prescriptions" && <PrescriptionsView />}
      </main>

      {showBookingModal && (
        <BookAppointmentModal
          onClose={() => setShowBookingModal(false)}
          onSuccess={() => {
            setShowBookingModal(false)
            fetchAppointments()
          }}
          setTopBanner={setTopBanner}
        />
      )}
    </div>
  )
}

function HealthCardView({ patient }: { patient: User }) 
 {
  const [healthCard, setHealthCard] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHealthCard()
  }, [])

  const fetchHealthCard = async () => {
    try {
      const response = await fetch("/api/health-card")
      if (!response.ok) throw new Error("Failed to fetch health card")
      const data = await response.json()
      setHealthCard(data.healthCard)
    } catch (error) {
      console.error("[v0] Fetch health card error:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Digital Health Card</h1>
        <p className={styles.pageSubtitle}>Your digital health identification</p>
      </div>

      <div
  style={{
    background: "linear-gradient(135deg, #00bcd4, #3f51b5)",
    borderRadius: "20px",
    padding: "24px",
    color: "#fff",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
    maxWidth: "380px",
    margin: "30px auto",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  }}
>
  {/* Header */}
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
    }}
  >
    <div
      style={{
        fontSize: "22px",
        fontWeight: "700",
        letterSpacing: "0.5px",
      }}
    >
      Health Card
    </div>
    <div
      style={{
        fontSize: "16px",
        fontWeight: "600",
        color: "#e0f7fa",
      }}
    >
      {healthCard?.cardNumber || "N/A"}
    </div>
  </div>

  {/* Patient Info */}
  <div style={{ textAlign: "center", marginTop: "10px" }}>
    <div
      style={{
        fontSize: "20px",
        fontWeight: "600",
        marginBottom: "14px",
        color: "#ffffff",
      }}
    >
      {patient?.name || "Patient Name"}
    </div>

    {/* QR Code */}
    {healthCard?.qrCode && (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "8px",
        }}
      >
        <img
          src={healthCard.qrCode || "/placeholder.svg"}
          alt="Health Card QR Code"
          style={{
            width: "180px",
            height: "180px",
            borderRadius: "16px",
            backgroundColor: "#ffffff",
            padding: "8px",
            border: "2px solid rgba(255,255,255,0.5)",
            boxShadow: "0 6px 20px rgba(0, 0, 0, 0.3)",
          }}
        />
      </div>
    )}
  </div>

  {/* Footer / Accent Strip */}
  <div
    style={{
      marginTop: "24px",
      height: "6px",
      width: "100%",
      borderRadius: "6px",
      background: "linear-gradient(to right, #ffb800, #06b6d4, #2563eb)",
    }}
  ></div>
</div>


    </>
  )
}

function MedicalRecordsView() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecords()
  }, [])

  const fetchRecords = async () => {
    try {
      const response = await fetch("/api/medical-records")
      if (!response.ok) throw new Error("Failed to fetch records")
      const data = await response.json()
      setRecords(data.records)
    } catch (error) {
      console.error("[v0] Fetch records error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Medical Records</h1>
        <p className={styles.pageSubtitle}>Your medical history and records</p>
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #e0f2fe 0%, #f8fafc 100%)",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          marginTop: "24px",
          width: "100%",
          maxWidth: "800px",
          backdropFilter: "blur(6px)",
          transition: "all 0.3s ease",
        }}
      >
        {loading ? (
          <div
            style={{
              textAlign: "center",
              fontSize: "18px",
              color: "#2563eb",
              fontWeight: "500",
            }}
          >
            Loading medical records...
          </div>
        ) : records.length > 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "18px",
              animation: "fadeIn 0.5s ease-in-out",
            }}
          >
            {records.map((record) => (
              <div
                key={record._id}
                style={{
                  borderRadius: "14px",
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(240,249,255,0.95))",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                  padding: "18px 22px",
                  borderLeft: "6px solid #3b82f6",
                  cursor: "pointer",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                  e.currentTarget.style.boxShadow = "0 6px 18px rgba(59,130,246,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.06)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <span
                    style={{
                      fontWeight: "700",
                      fontSize: "17px",
                      color: "#1e3a8a",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {record.diagnosis}
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      color: "#64748b",
                      backgroundColor: "#e0f2fe",
                      padding: "4px 10px",
                      borderRadius: "6px",
                    }}
                  >
                    {new Date(record.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    fontSize: "15px",
                    color: "#334155",
                    lineHeight: "1.4",
                  }}
                >
                  <span>
                    👨‍⚕️ <strong>Doctor:</strong> {record.doctor?.name}
                  </span>
                  <span>
                    💊 <strong>Treatment:</strong> {record.treatment}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "#94a3b8",
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.8), rgba(241,245,249,0.9))",
              borderRadius: "12px",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📋</div>
            <div
              style={{
                fontSize: "17px",
                fontWeight: "600",
                color: "#475569",
              }}
            >
              No medical records found
            </div>
            <p style={{ fontSize: "14px", color: "#64748b", marginTop: "6px" }}>
              Try again later or refresh the page.
            </p>
          </div>
        )}
      </div>

    </>
  )
}

function PrescriptionsView() {
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPrescriptions()
  }, [])

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch("/api/prescriptions")
      if (!response.ok) throw new Error("Failed to fetch prescriptions")
      const data = await response.json()
      setPrescriptions(data.prescriptions)
    } catch (error) {
      console.error("[v0] Fetch prescriptions error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>My Prescriptions</h1>
        <p className={styles.pageSubtitle}>View your active prescriptions</p>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div>Loading...</div>
        ) : prescriptions.length > 0 ? (
          <div className={styles.appointmentsList}>
            {prescriptions.map((prescription) => (
              <div key={prescription._id} className={styles.appointmentItem}>
                <div className={styles.appointmentHeader}>
                  <span className={styles.doctorName}>{prescription.medicineName}</span>
                  <span className={`${styles.appointmentStatus} ${styles[prescription.status]}`}>
                    {prescription.status}
                  </span>
                </div>
                <div className={styles.appointmentDetails}>
                  <span>💊 {prescription.dosage}</span>
                  <span>📅 {prescription.frequency}</span>
                  <span>⏱️ {prescription.duration}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💊</div>
            <div className={styles.emptyText}>No prescriptions found</div>
          </div>
        )}
      </div>
    </>
  )
}

function BookAppointmentModal({
  onClose,
  onSuccess,
  setTopBanner,
}: {
  onClose: () => void
  onSuccess: () => void
  setTopBanner?: React.Dispatch<React.SetStateAction<{ type: 'success' | 'error' | 'info' | null; text?: string }>>
}) {
  const [doctors, setDoctors] = useState<any[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [formData, setFormData] = useState({
    doctorId: "",
    date: "",
    time: "",
    reason: "",
  })
  const [loading, setLoading] = useState(false)
  const [banner, setBanner] = useState<{ type: 'success' | 'error' | 'info' | null; text?: string }>({ type: null })

  useEffect(() => {
    fetchDoctors()
  }, [])

  useEffect(() => {
    if (formData.doctorId && formData.date) {
      fetchAvailableSlots()
    }
  }, [formData.doctorId, formData.date])

  const fetchDoctors = async () => {
    try {
      const response = await fetch("/api/doctors")
      if (!response.ok) throw new Error("Failed to fetch doctors")
      const data = await response.json()
      setDoctors(data.doctors)
    } catch (error) {
      console.error("[v0] Fetch doctors error:", error)
    }
  }

  const fetchAvailableSlots = async () => {
    if (!formData.doctorId || !formData.date) return
    
    setSlotsLoading(true)
    setFormData(prev => ({ ...prev, time: "" })) // Reset selected time when slots change

    try {
      const response = await fetch(`/api/doctors/${formData.doctorId}/slots?date=${formData.date}`)
      const data = await response.json()
      
      setAvailableSlots([])
      
      if (!response.ok) {
        console.error('[v0] Slots API returned non-OK:', response.status, data)
        
        // Check if it's a "no schedule" error
        if (data?.error?.includes('No schedule found')) {
          setBanner({ type: 'info', text: 'No schedule found for this doctor. Please select a different date.' })
          if (setTopBanner) setTopBanner({ type: 'info', text: 'No schedule found for this doctor.' })
        } else {
          const msg = data?.userMessage || data?.error || 'Failed to load slots'
          setBanner({ type: 'error', text: msg })
          if (setTopBanner) setTopBanner({ type: 'error', text: msg })
        }
        return
      }

      // If slots array is empty but response is OK, it means no available slots
      if (data.slots && data.slots.length === 0) {
        setBanner({ type: 'info', text: 'No available time slots for this date. Please try selecting a different date.' })
        if (setTopBanner) setTopBanner({ type: 'info', text: 'No available slots for selected date.' })
        return
      }

      // Clear any previous error/info messages if slots are found
      setBanner({ type: null })
      if (setTopBanner) setTopBanner({ type: null })

      setAvailableSlots(data.slots || [])
    } catch (error) {
      console.error("[v0] Fetch available slots error:", error)
      setAvailableSlots([])
    } finally {
      setSlotsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate doctor selection
    if (!formData.doctorId) {
      toast({
        title: "Doctor Required",
        description: "Please select a doctor to continue.",
        variant: "destructive"
      });
      return;
    }

    // Validate date selection
    if (!formData.date) {
      toast({
        title: "Missing Date",
        description: "Please select a valid appointment date.",
        variant: "destructive"
      });
      return;
    }

    // Validate time slot selection
    if (!formData.time) {
      toast({
        title: "Missing Time Slot",
        description: "Please select an available time slot.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true)

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const body = await response.json().catch(() => ({}))

      if (!response.ok) {
        // Slot full -> show server message when available
        const msg = body.error || "Failed to book appointment"
        // show inline banner fallback
        setBanner({ type: 'error', text: msg })
        // also try toast if available
        try {
          toast({ title: 'Booking failed', description: msg })
        } catch (e) {
          console.error('Toast error', e)
        }
        return
      }

      // show inline banner and toast to the user with selected doctor/time
      try {
        const doctor = doctors.find((d) => d._id === formData.doctorId)
        const title = ' Appointment Booked Successfully'
        const description = `Your appointment with Dr. ${doctor?.name || ''} has been confirmed for ${formData.date} at ${formData.time}`
        // inline banner
        setBanner({ type: 'success', text: description })
        // also try toast
        try {
          toast({
            title,
            description,
            variant: 'success',
            duration: 5000
          })
        } catch (e) {
          console.log('Toast error', e)
        }
      } catch (e) {
        console.log('Toast error', e)
      }

      onSuccess()
    } catch (error) {
      console.error("[v0] Book appointment error:", error)
      // inline fallback message
      setBanner({ type: 'error', text: 'Failed to book appointment' })
      try {
        toast({ title: 'Booking failed', description: 'Failed to book appointment' })
      } catch (e) {
        console.error('Toast error', e)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Book Appointment</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        {banner.type && banner.text && (
          <div className={`${styles.banner} ${banner.type === 'success' ? styles.bannerSuccess : styles.bannerError}`}>
            {banner.text}
            <button className={styles.bannerClose} onClick={() => setBanner({ type: null })} aria-label="Close">×</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Select Doctor *</label>
            <select
              className={styles.formSelect}
              value={formData.doctorId}
              onChange={(e) => {
                setFormData({ ...formData, doctorId: e.target.value, date: "", time: "" });
                if (!e.target.value) {
                  toast({
                    title: "Doctor Required",
                    description: "Please select a doctor to continue.",
                    variant: "destructive"
                  });
                }
              }}
              required
            >
              <option value="">Please select a doctor to continue</option>
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  Dr. {doctor.name} - {doctor.specialization || "General"}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Date</label>
            <input
              type="date"
              className={styles.formInput}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              min={new Date().toISOString().split("T")[0]}
              required
              onFocus={async (e) => {
                if (!formData.doctorId) {
                  toast({
                    title: "Doctor Required",
                    description: "Please select a doctor to continue.",
                    variant: "destructive"
                  });
                  e.target.blur()
                  return
                }

                // Fetch doctor's schedule dates
                const response = await fetch(`/api/doctors/schedules?doctorId=${formData.doctorId}`)
                if (!response.ok) {
                  alert("Failed to fetch doctor's schedule")
                  return
                }

                const data = await response.json()
                const availableDates = data.schedules
                  .filter(schedule => schedule.isAvailable)
                  .map(schedule => new Date(schedule.date).toISOString().split("T")[0])

                // Set the available dates as the datepicker's valid values
                e.target.setAttribute("min", availableDates[0] || new Date().toISOString().split("T")[0])
                e.target.setAttribute("max", availableDates[availableDates.length - 1] || "")
              }}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Available Time Slots</label>
            {slotsLoading ? (
              <div className={styles.loadingSlots}>Loading available slots...</div>
            ) : availableSlots.length > 0 ? (
              <div className={styles.timeSlots}>
                  {availableSlots.map((slot) => {
                    // compute visual state class: unavailable, limited (some bookings), available
                    const isSelected = formData.time === slot.startTime
                    const isUnavailable = !slot.available
                    const isLimited = !isUnavailable && slot.maxPatients && (slot.bookedPatients || 0) > 0

                    const className = [
                      styles.timeSlot,
                      isUnavailable ? styles.unavailable : styles.available,
                      isLimited ? styles.limited : "",
                      isSelected ? styles.selected : "",
                    ].filter(Boolean).join(" ")

                    return (
                      <button
                        key={`${slot.startTime}-${slot.endTime}`}
                        type="button"
                        className={className}
                        onClick={() => setFormData(prev => ({ ...prev, time: slot.startTime }))}
                        disabled={!slot.available}
                      >
                        {slot.startTime}
                        {slot.maxPatients && (
                          <span className={styles.slotCapacity}>
                            ({slot.bookedPatients || 0}/{slot.maxPatients})
                          </span>
                        )}
                      </button>
                    )
                  })}
              </div>
            ) : formData.doctorId && formData.date ? (
              <div className={styles.noSlots}>
                {banner.type === 'info' ? (
                  banner.text
                ) : (
                  'No available time slots. Please select a different date.'
                )}
              </div>
            ) : !formData.doctorId ? (
              <div className={styles.noSlots}>
                Please select a doctor to see available slots
              </div>
            ) : !formData.date ? (
              <div className={styles.noSlots}>
                Please select an appointment date
              </div>
            ) : (
              <div className={styles.noSlots}>
                Select both doctor and date to see available slots
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Reason for Visit</label>
            <textarea
              className={styles.formTextarea}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Describe your symptoms or reason for visit"
              required
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`} disabled={loading}>
              {loading ? "Booking..." : "Book Appointment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
