"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "../patient.module.css"
import StripeCheckout from "@/components/stripe-checkout"

interface Appointment {
  _id: string
  doctor: any
  date: string
  time: string
  status: string
  paymentStatus?: string
}

export default function PaymentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [appointmentsRes, paymentsRes] = await Promise.all([
        fetch("/api/appointments"),
        fetch("/api/payments"),
      ])

      if (appointmentsRes.ok) {
        const data = await appointmentsRes.json()
        setAppointments(data.appointments)
      }

      if (paymentsRes.ok) {
        const data = await paymentsRes.json()
        setPayments(data.payments)
      }
    } catch (error) {
      console.error("[v0] Fetch data error:", error)
    } finally {
      setLoading(false)
    }
  }

  const unpaidAppointments = appointments.filter(
    (apt) => apt.status === "scheduled" && apt.paymentStatus !== "paid"
  )

  return (
    <div className={styles.dashboardLayout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>H+</div>
            <div className={styles.logoText}>Carenet360</div>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <button className={styles.navItem} onClick={() => router.push("/patient/dashboard")}>
            <span className={styles.navIcon}>📊</span> Dashboard
          </button>
          <button className={`${styles.navItem} ${styles.active}`}>
            <span className={styles.navIcon}>💳</span> Payments
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutButton} onClick={() => router.push("/patient/dashboard")}>
            Back
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Payments</h1>
          <p className={styles.pageSubtitle}>Manage your payments and billing</p>
        </div>

        {/* Pending Payments */}
        {unpaidAppointments.length > 0 && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Pending Payments</h2>
            </div>

            <table className={styles.table}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th>Date</th>
                  <th>Doctor</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {unpaidAppointments.map((appointment) => (
                  <tr key={appointment._id}>
                    <td>{new Date(appointment.date).toLocaleDateString()}</td>
                    <td>Dr. {appointment.doctor?.name || "Unknown"}</td>
                    <td>Rs.5000.00</td>
                    <td>
                      <button
                        className={`${styles.button} ${styles.buttonPrimary}`}
                        onClick={() => {
                          setSelectedAppointment(appointment)
                          setShowPaymentModal(true)
                        }}
                      >
                        Pay Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Payment History */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Payment History</h2>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : payments.length > 0 ? (
            <table className={styles.table}>
              <thead className={styles.tableHeader}>
                <tr>
                  <th>Date</th>
                  <th>Transaction ID</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody className={styles.tableBody}>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td>{payment.transactionId || "N/A"}</td>
                    <td>${payment.amount.toFixed(2)}</td>
                    <td>{payment.paymentMethod}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[payment.status]}`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>💳</div>
              <div className={styles.emptyText}>No payment history found</div>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showPaymentModal && selectedAppointment && (
        <PaymentModal
          appointment={selectedAppointment}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedAppointment(null)
          }}
          onSuccess={() => {
            setShowPaymentModal(false)
            setSelectedAppointment(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

/* ---------- MODAL BELOW ---------- */

function PaymentModal({
  appointment,
  onClose,
  onSuccess,
}: {
  appointment: Appointment
  onClose: () => void
  onSuccess: () => void
}) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "insurance">("card")
  const [insuranceProvider, setInsuranceProvider] = useState("")
  const [insuranceId, setInsuranceId] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCashPayment = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment._id,
          amount: 50.0,
          paymentMethod: "cash",
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to record cash payment.")
      alert("Cash payment recorded successfully.")
      onSuccess()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInsuranceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment._id,
          amount: 50.0,
          paymentMethod: "insurance",
          insuranceProvider,
          insuranceId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to submit insurance claim.")
      alert("Insurance claim submitted successfully.")
      onSuccess()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ✅ Called after Stripe checkout completes
  const handleStripePaymentComplete = async (transactionId: string) => {
    try {
      const res = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment._id,
          amount: 50.0,
          paymentMethod: "card",
          transactionId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to record card payment.")
      alert("Payment successful!")
      onSuccess()
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Make a Payment</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        {/* Appointment Info */}
        <div className={styles.paymentSummary}>
          <div className={styles.summaryRow}>
            <span>Appointment with Dr. {appointment.doctor?.name}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Date: {new Date(appointment.date).toLocaleDateString()}</span>
          </div>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Amount:</span>
            <span className={styles.summaryAmount}>Rs.5000.00</span>
          </div>
        </div>

        {/* Method Selector */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Select Payment Method</label>
          <select
            className={styles.formInput}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as "card" | "cash" | "insurance")}
          >
            <option value="card">💳 Card (Stripe)</option>
            <option value="cash">💵 Cash</option>
            <option value="insurance">🏥 Insurance</option>
          </select>
        </div>

        {/* Conditional Sections */}
        {paymentMethod === "card" && (
          <div className={styles.stripeCheckoutContainer}>
            <StripeCheckout
              productId="general-consultation"
              appointmentId={appointment._id}
              onPaymentComplete={handleStripePaymentComplete}
            />
          </div>
        )}

        {paymentMethod === "cash" && (
          <div className={styles.formActions}>
            <button
              onClick={handleCashPayment}
              disabled={loading}
              className={`${styles.button} ${styles.buttonPrimary}`}
            >
              {loading ? "Recording..." : "Confirm Cash Payment"}
            </button>
          </div>
        )}

        {paymentMethod === "insurance" && (
          <form onSubmit={handleInsuranceSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Insurance Provider</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="e.g. Ceylinco, Allianz"
                value={insuranceProvider}
                onChange={(e) => setInsuranceProvider(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Insurance Policy ID</label>
              <input
                type="text"
                className={styles.formInput}
                placeholder="Policy ID or Membership No."
                value={insuranceId}
                onChange={(e) => setInsuranceId(e.target.value)}
                required
              />
            </div>
            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={loading}
                className={`${styles.button} ${styles.buttonPrimary}`}
              >
                {loading ? "Submitting..." : "Submit Insurance Claim"}
              </button>
            </div>
          </form>
        )}

        {/* Cancel Button */}
        <div className={styles.formActions}>
          <button
            className={`${styles.button} ${styles.buttonSecondary}`}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
