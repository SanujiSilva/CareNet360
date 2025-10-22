"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import styles from "../doctor.module.css"
import { Html5QrcodeScanner } from "html5-qrcode"

interface PatientData {
  patient: any
  healthCard: any
  medicalHistory: any[]
  prescriptions: any[]
  appointments: any[]
}

export default function ScanQRPage() {
  const router = useRouter()
  const [cardNumber, setCardNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [error, setError] = useState("")
  const [showAddRecordModal, setShowAddRecordModal] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  // ---- helpers -------------------------------------------------------------

  /** Extract a health card number from any QR/text:
   *  - JSON: {"cardNumber":"HC...","patientId":"..."}
   *  - Plain: HC...
   *  - Fallback: try regex like HC[A-Za-z0-9]+ inside the string
   */
  const extractCardNumber = (raw: string): string | null => {
    if (!raw) return null

    // Try JSON first
    try {
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed.cardNumber === "string" && parsed.cardNumber.trim()) {
        return parsed.cardNumber.trim()
      }
    } catch {
      // not JSON, continue
    }

    // Try key=value style
    const kvMatch = raw.match(/cardNumber\s*[:=]\s*"?([A-Za-z0-9-_/]+)"?/i)
    if (kvMatch?.[1]) return kvMatch[1].trim()

    // Try generic HC... pattern
    const hcMatch = raw.match(/HC[A-Za-z0-9]+/i)
    if (hcMatch?.[0]) return hcMatch[0].trim()

    // Plain text fallback
    const trimmed = raw.trim()
    if (/^HC[A-Za-z0-9]+$/i.test(trimmed)) return trimmed

    return null
  }

  // ---- camera --------------------------------------------------------------

  const startCameraScanner = () => {
    setShowCamera(true)
    setError("")
    setPatientData(null)
    setCardNumber("")

    setTimeout(() => {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        false
      )

      scanner.render(
        async (decodedText) => {
          console.log("[QR] Raw scanned data:", decodedText)

          const cn = extractCardNumber(decodedText)
          if (!cn) {
            setError("Invalid QR: couldn't find a health card number.")
            await stopCameraScanner()
            return
          }

          // Fill only the card number in the input
          setCardNumber(cn)

          // Stop camera and fetch patient data
          await stopCameraScanner()
          handleScanWithCardNumber(cn)
        },
        (scanErr) => {
          // keep silent to avoid noisy UI; logs help during dev
          if (process.env.NODE_ENV !== "production") {
            console.warn("[QR] scan error:", scanErr)
          }
        }
      )

      scannerRef.current = scanner
    }, 100)
  }

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear()
      } catch {
        // ignore
      }
      scannerRef.current = null
    }
    setShowCamera(false)
  }

  // ---- fetch ---------------------------------------------------------------

  const handleScanWithCardNumber = async (rawCardNum: string) => {
    const cn = extractCardNumber(rawCardNum)
    if (!cn) {
      setError("Invalid health card number.")
      return
    }

    setLoading(true)
    setError("")
    setPatientData(null)

    try {
      const response = await fetch("/api/health-card/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber: cn }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Failed to scan health card")
      }

      const data = await response.json()
      setPatientData(data)
      // ensure the input displays the clean value
      setCardNumber(cn)
    } catch (err: any) {
      setError(err?.message || "Something went wrong while scanning the health card.")
    } finally {
      setLoading(false)
    }
  }

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleScanWithCardNumber(cardNumber)
  }

  // ---- UI ------------------------------------------------------------------

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
            <span className={styles.navIcon}>📷</span>
            Scan QR Code
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutButton} onClick={() => router.push("/doctor/dashboard")}>
            Back
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Scan Patient QR Code</h1>
          <p className={styles.pageSubtitle}>Use camera or enter health card number manually</p>
        </div>

        <div className={styles.card}>
          <div className={styles.scanOptions}>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={startCameraScanner}
              disabled={showCamera}
            >
              📷 Scan with Camera
            </button>
          </div>

          {showCamera && (
            <div className={styles.cameraContainer}>
              <div id="qr-reader" className={styles.qrReader}></div>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonSecondary}`}
                onClick={stopCameraScanner}
              >
                Cancel Scanning
              </button>
            </div>
          )}

          <div className={styles.divider}>
            <span>OR</span>
          </div>

          <form onSubmit={handleScan} className={styles.scanForm}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Health Card Number</label>
              <input
                type="text"
                className={styles.formInput}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="Enter health card number (e.g., HC1234567890ABC)"
                required
              />
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`} disabled={loading}>
              {loading ? "Scanning..." : "Scan Health Card"}
            </button>
          </form>
        </div>

        {patientData && (
          <>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Patient Information</h2>
                <button
                  className={`${styles.button} ${styles.buttonPrimary}`}
                  onClick={() => setShowAddRecordModal(true)}
                >
                  Add Medical Record
                </button>
              </div>

              <div className={styles.patientInfo}>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Name:</span>
                  <span className={styles.infoValue}>{patientData.patient.name}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Email:</span>
                  <span className={styles.infoValue}>{patientData.patient.email}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Phone:</span>
                  <span className={styles.infoValue}>{patientData.patient.phone || "N/A"}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Gender:</span>
                  <span className={styles.infoValue}>{patientData.patient.gender || "N/A"}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Date of Birth:</span>
                  <span className={styles.infoValue}>
                    {patientData.patient.dateOfBirth
                      ? new Date(patientData.patient.dateOfBirth).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Blood Group:</span>
                  <span className={styles.infoValue}>{patientData.patient.bloodGroup || "N/A"}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Allergies:</span>
                  <span className={styles.infoValue}>{patientData.patient.allergies || "None"}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.infoLabel}>Emergency Contact</span>
                  <span className={styles.infoValue}>{patientData.patient.emergencyContact || "None"}</span>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Medical History</h2>
              </div>

              {patientData.medicalHistory.length > 0 ? (
                <table className={styles.table}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th>Date</th>
                      <th>Diagnosis</th>
                      <th>Treatment</th>
                      <th>Symptoms</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {patientData.medicalHistory.map((record) => (
                      <tr key={record._id}>
                        <td>{new Date(record.createdAt).toLocaleDateString()}</td>
                        <td>{record.diagnosis}</td>
                        <td>{record.treatment}</td>
                        <td>{record.symptoms?.join(", ") || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📋</div>
                  <div className={styles.emptyText}>No medical history found</div>
                </div>
              )}
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Prescription History</h2>
              </div>

              {patientData.prescriptions.length > 0 ? (
                <table className={styles.table}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th>Date</th>
                      <th>Medicine</th>
                      <th>Dosage</th>
                      <th>Duration</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {patientData.prescriptions.map((prescription) => (
                      <tr key={prescription._id}>
                        <td>{new Date(prescription.createdAt).toLocaleDateString()}</td>
                        <td>{prescription.medicineName}</td>
                        <td>{prescription.dosage}</td>
                        <td>{prescription.duration}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[prescription.status]}`}>
                            {prescription.status}
                          </span>
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
        )}
      </main>

      {showAddRecordModal && patientData && (
        <AddMedicalRecordModal
          patientId={patientData.patient._id}
          patientName={patientData.patient.name}
          onClose={() => setShowAddRecordModal(false)}
          onSuccess={() => {
            setShowAddRecordModal(false)
            handleScanWithCardNumber(cardNumber)
          }}
        />
      )}
    </div>
  )
}

function AddMedicalRecordModal({
  patientId,
  patientName,
  onClose,
  onSuccess,
}: {
  patientId: string
  patientName: string
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
          patientId,
          ...formData,
          symptoms: formData.symptoms.split(",").map((s) => s.trim()),
        }),
      })

      if (!response.ok) throw new Error("Failed to create medical record")

      alert("Medical record added successfully!")
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
            <label className={styles.formLabel}>Patient: {patientName}</label>
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
