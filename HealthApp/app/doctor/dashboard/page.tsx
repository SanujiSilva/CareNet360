"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "../doctor.module.css"

interface User {
  id: string
  name: string
  email: string
  role: string
  specialization?: string
}

interface Appointment {
  _id: string
  patient: any
  date: string
  time: string
  status: string
  reason: string
}

export default function DoctorDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState("dashboard")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false)

  useEffect(() => {
    fetchUserData()
    fetchAppointments()
    fetchPatients()
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

  const fetchPatients = async () => {
    try {
      const response = await fetch("/api/patients")
      if (!response.ok) throw new Error("Failed to fetch patients")
      const data = await response.json()
      setPatients(data.patients)
    } catch (error) {
      console.error("[v0] Fetch patients error:", error)
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

  const handleCompleteAppointment = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      })

      if (!response.ok) throw new Error("Failed to update appointment")

      fetchAppointments()
    } catch (error) {
      console.error("[v0] Update appointment error:", error)
      alert("Failed to update appointment")
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  const todayAppointments = appointments.filter(
    (apt) => new Date(apt.date).toDateString() === new Date().toDateString(),
  )
  const scheduledAppointments = appointments.filter((apt) => apt.status === "scheduled")

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
          <button className={styles.navItem} onClick={() => router.push("/doctor/profile")}>
            <span className={styles.navIcon}>👤</span>
            Profile
          </button>
          <button className={styles.navItem} onClick={() => router.push("/doctor/scan-qr")}>
            <span className={styles.navIcon}>📷</span>
            Scan QR Code
          </button>
          <button
            className={`${styles.navItem} ${activeView === "appointments" ? styles.active : ""}`}
            onClick={() => setActiveView("appointments")}
          >
            <span className={styles.navIcon}>📅</span>
            Appointments
          </button>
          <button
            className={`${styles.navItem} ${activeView === "patients" ? styles.active : ""}`}
            onClick={() => setActiveView("patients")}
          >
            <span className={styles.navIcon}>👥</span>
            Patients
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
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{user?.name.charAt(0).toUpperCase()}</div>
            <div>
              <div className={styles.userName}>Dr. {user?.name}</div>
              <div className={styles.userRole}>{user?.specialization || "Doctor"}</div>
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
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Welcome, Dr. {user?.name}!</h1>
              <p className={styles.pageSubtitle}>Here's your practice overview</p>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Today's Appointments</span>
                  <div className={`${styles.statIcon} ${styles.primary}`}>📅</div>
                </div>
                <div className={styles.statValue}>{todayAppointments.length}</div>
                <div className={styles.statChange}>Scheduled for today</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Total Patients</span>
                  <div className={`${styles.statIcon} ${styles.secondary}`}>👥</div>
                </div>
                <div className={styles.statValue}>{patients.length}</div>
                <div className={styles.statChange}>Active patients</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Pending</span>
                  <div className={`${styles.statIcon} ${styles.accent}`}>⏰</div>
                </div>
                <div className={styles.statValue}>{scheduledAppointments.length}</div>
                <div className={styles.statChange}>Upcoming</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Completed</span>
                  <div className={`${styles.statIcon} ${styles.success}`}>✓</div>
                </div>
                <div className={styles.statValue}>
                  {appointments.filter((apt) => apt.status === "completed").length}
                </div>
                <div className={styles.statChange}>This month</div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Today's Schedule</h2>
              </div>

              {todayAppointments.length > 0 ? (
                <table className={styles.table}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th>Time</th>
                      <th>Patient</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {todayAppointments.map((appointment) => (
                      <tr key={appointment._id}>
                        <td>{appointment.time}</td>
                        <td>{appointment.patient?.name || "Unknown"}</td>
                        <td>{appointment.reason}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[appointment.status]}`}>{appointment.status}</span>
                        </td>
                        <td>
                          <button
                            className={styles.actionButton}
                            onClick={() => {
                              setSelectedAppointment(appointment)
                              setShowRecordModal(true)
                            }}
                          >
                            Add Record
                          </button>
                          <button
                            className={styles.actionButton}
                            onClick={() => handleCompleteAppointment(appointment._id)}
                          >
                            Complete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📅</div>
                  <div className={styles.emptyText}>No appointments scheduled for today</div>
                </div>
              )}
            </div>
          </>
        )}

        {activeView === "appointments" && (
          <>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>All Appointments</h1>
              <p className={styles.pageSubtitle}>Manage your patient appointments</p>
            </div>

            <div className={styles.card}>
              {appointments.length > 0 ? (
                <table className={styles.table}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Patient</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {appointments.map((appointment) => (
                      <tr key={appointment._id}>
                        <td>{new Date(appointment.date).toLocaleDateString()}</td>
                        <td>{appointment.time}</td>
                        <td>{appointment.patient?.name || "Unknown"}</td>
                        <td>{appointment.reason}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[appointment.status]}`}>{appointment.status}</span>
                        </td>
                        <td>
                          <button
                            className={styles.actionButton}
                            onClick={() => {
                              setSelectedAppointment(appointment)
                              setShowRecordModal(true)
                            }}
                          >
                            Add Record
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📅</div>
                  <div className={styles.emptyText}>No appointments found</div>
                </div>
              )}
            </div>
          </>
        )}

        {activeView === "patients" && (
          <>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>My Patients</h1>
              <p className={styles.pageSubtitle}>View and manage patient information</p>
            </div>

            <div className={styles.card}>
              {patients.length > 0 ? (
                <table className={styles.table}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Gender</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {patients.map((patient) => (
                      <tr key={patient._id}>
                        <td>{patient.name}</td>
                        <td>{patient.email}</td>
                        <td>{patient.phone || "N/A"}</td>
                        <td>{patient.gender || "N/A"}</td>
                        <td>
                          <button
                            className={styles.actionButton}
                            onClick={() => {
                              setSelectedAppointment({ patient } as any)
                              setShowPrescriptionModal(true)
                            }}
                          >
                            Prescribe
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>👥</div>
                  <div className={styles.emptyText}>No patients found</div>
                </div>
              )}
            </div>
          </>
        )}

        {activeView === "records" && <MedicalRecordsView />}
        {activeView === "prescriptions" && <PrescriptionsView />}
      </main>

      {showRecordModal && selectedAppointment && (
        <AddMedicalRecordModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowRecordModal(false)
            setSelectedAppointment(null)
          }}
          onSuccess={() => {
            setShowRecordModal(false)
            setSelectedAppointment(null)
            fetchAppointments()
          }}
        />
      )}

      {showPrescriptionModal && selectedAppointment && (
        <AddPrescriptionModal
          patient={selectedAppointment.patient}
          onClose={() => {
            setShowPrescriptionModal(false)
            setSelectedAppointment(null)
          }}
          onSuccess={() => {
            setShowPrescriptionModal(false)
            setSelectedAppointment(null)
          }}
        />
      )}
    </div>
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
        <p className={styles.pageSubtitle}>Patient medical history and records</p>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div>Loading...</div>
        ) : records.length > 0 ? (
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Diagnosis</th>
                <th>Treatment</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {records.map((record) => (
                <tr key={record._id}>
                  <td>{new Date(record.createdAt).toLocaleDateString()}</td>
                  <td>{record.patient?.name || "Unknown"}</td>
                  <td>{record.diagnosis}</td>
                  <td>{record.treatment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <div className={styles.emptyText}>No medical records found</div>
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
        <h1 className={styles.pageTitle}>Prescriptions</h1>
        <p className={styles.pageSubtitle}>Manage patient prescriptions</p>
      </div>

      <div className={styles.card}>
        {loading ? (
          <div>Loading...</div>
        ) : prescriptions.length > 0 ? (
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th>Date</th>
                <th>Patient</th>
                <th>Medicine</th>
                <th>Dosage</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {prescriptions.map((prescription) => (
                <tr key={prescription._id}>
                  <td>{new Date(prescription.createdAt).toLocaleDateString()}</td>
                  <td>{prescription.patient?.name || "Unknown"}</td>
                  <td>{prescription.medicineName}</td>
                  <td>{prescription.dosage}</td>
                  <td>{prescription.duration}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[prescription.status]}`}>{prescription.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

function AddMedicalRecordModal({
  appointment,
  onClose,
  onSuccess,
}: {
  appointment: Appointment
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    diagnosis: "",
    symptoms: "",
    treatment: "",
    labResults: "",
    notes: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/medical-records/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: appointment.patient._id,
          appointmentId: appointment._id,
          ...formData,
          symptoms: formData.symptoms.split(",").map((s) => s.trim()),
        }),
      })

      if (!response.ok) throw new Error("Failed to create medical record")

      onSuccess()
    } catch (error) {
      console.error("[v0] Create medical record error:", error)
      alert("Failed to create medical record")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Add Medical Record</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Patient: {appointment.patient?.name}</label>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Diagnosis</label>
            <input
              type="text"
              className={styles.formInput}
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="Enter diagnosis"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Symptoms (comma separated)</label>
            <input
              type="text"
              className={styles.formInput}
              value={formData.symptoms}
              onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
              placeholder="fever, cough, headache"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Treatment</label>
            <textarea
              className={styles.formTextarea}
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              placeholder="Describe treatment plan"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Lab Results</label>
            <textarea
              className={styles.formTextarea}
              value={formData.labResults}
              onChange={(e) => setFormData({ ...formData, labResults: e.target.value })}
              placeholder="Enter lab results if any"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Notes</label>
            <textarea
              className={styles.formTextarea}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes"
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`} disabled={loading}>
              {loading ? "Saving..." : "Save Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddPrescriptionModal({
  patient,
  onClose,
  onSuccess,
}: {
  patient: any
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    medicineName: "",
    dosage: "",
    frequency: "",
    duration: "",
    instructions: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/prescriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patient._id,
          ...formData,
        }),
      })

      if (!response.ok) throw new Error("Failed to create prescription")

      onSuccess()
    } catch (error) {
      console.error("[v0] Create prescription error:", error)
      alert("Failed to create prescription")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Add Prescription</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Patient: {patient?.name}</label>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Medicine Name</label>
            <input
              type="text"
              className={styles.formInput}
              value={formData.medicineName}
              onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
              placeholder="Enter medicine name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Dosage</label>
            <input
              type="text"
              className={styles.formInput}
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              placeholder="e.g., 500mg"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Frequency</label>
            <input
              type="text"
              className={styles.formInput}
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              placeholder="e.g., Twice daily"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Duration</label>
            <input
              type="text"
              className={styles.formInput}
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              placeholder="e.g., 7 days"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Instructions</label>
            <textarea
              className={styles.formTextarea}
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Special instructions for the patient"
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`} disabled={loading}>
              {loading ? "Creating..." : "Create Prescription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
