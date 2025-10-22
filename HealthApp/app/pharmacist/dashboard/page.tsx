"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "../pharmacist.module.css"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Medicine {
  _id: string
  name: string
  genericName: string
  manufacturer: string
  category: string
  price: number
  stock: number
  description?: string
}

export default function PharmacistDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [prescriptions, setPrescriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState("inventory")
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchUserData()
    fetchMedicines()
    fetchPrescriptions()
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

  const fetchMedicines = async () => {
    try {
      const response = await fetch("/api/medicines")
      if (!response.ok) throw new Error("Failed to fetch medicines")
      const data = await response.json()
      setMedicines(data.medicines)
    } catch (error) {
      console.error("[v0] Fetch medicines error:", error)
    }
  }

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch("/api/prescriptions")
      if (!response.ok) throw new Error("Failed to fetch prescriptions")
      const data = await response.json()
      setPrescriptions(data.prescriptions)
    } catch (error) {
      console.error("[v0] Fetch prescriptions error:", error)
    }
  }

  const handleDeleteMedicine = async (medicineId: string) => {
    if (!confirm("Are you sure you want to delete this medicine?")) return

    try {
      const response = await fetch(`/api/medicines/${medicineId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete medicine")

      fetchMedicines()
    } catch (error) {
      console.error("[v0] Delete medicine error:", error)
      alert("Failed to delete medicine")
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

  const filteredMedicines = medicines.filter(
    (med) =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.genericName.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStockStatus = (stock: number) => {
    if (stock === 0) return "outOfStock"
    if (stock < 10) return "lowStock"
    return "inStock"
  }

  const getStockLabel = (stock: number) => {
    if (stock === 0) return "Out of Stock"
    if (stock < 10) return "Low Stock"
    return "In Stock"
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
          <button
            className={`${styles.navItem} ${activeView === "inventory" ? styles.active : ""}`}
            onClick={() => setActiveView("inventory")}
          >
            <span className={styles.navIcon}>💊</span>
            Medicine Inventory
          </button>
          <button
            className={`${styles.navItem} ${activeView === "prescriptions" ? styles.active : ""}`}
            onClick={() => setActiveView("prescriptions")}
          >
            <span className={styles.navIcon}>📋</span>
            Prescriptions
          </button>
          <button
            className={`${styles.navItem} ${activeView === "orders" ? styles.active : ""}`}
            onClick={() => setActiveView("orders")}
          >
            <span className={styles.navIcon}>📦</span>
            Orders
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{user?.name.charAt(0).toUpperCase()}</div>
            <div>
              <div className={styles.userName}>{user?.name}</div>
              <div className={styles.userRole}>Pharmacist</div>
            </div>
          </div>
          <button className={styles.logoutButton} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        {activeView === "inventory" && (
          <>
            <div className={styles.pageHeader}>
              <div>
                <h1 className={styles.pageTitle}>Medicine Inventory</h1>
                <p className={styles.pageSubtitle}>Manage your pharmacy stock</p>
              </div>
              <button className={styles.addButton} onClick={() => setShowAddModal(true)}>
                + Add Medicine
              </button>
            </div>

            <div className={styles.searchBar}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search medicines by name or generic name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {filteredMedicines.length > 0 ? (
              <div className={styles.medicineGrid}>
                {filteredMedicines.map((medicine) => (
                  <div key={medicine._id} className={styles.medicineCard}>
                    <div className={styles.medicineHeader}>
                      <div>
                        <div className={styles.medicineName}>{medicine.name}</div>
                        <div className={styles.medicineGeneric}>{medicine.genericName}</div>
                      </div>
                      <span className={`${styles.stockBadge} ${styles[getStockStatus(medicine.stock)]}`}>
                        {getStockLabel(medicine.stock)}
                      </span>
                    </div>

                    <div className={styles.medicineDetails}>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Category:</span>
                        <span className={styles.detailValue}>{medicine.category}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Manufacturer:</span>
                        <span className={styles.detailValue}>{medicine.manufacturer}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Price:</span>
                        <span className={styles.detailValue}>${medicine.price.toFixed(2)}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Stock:</span>
                        <span className={styles.detailValue}>{medicine.stock} units</span>
                      </div>
                    </div>

                    <div className={styles.medicineActions}>
                      <button className={`${styles.actionButton} ${styles.editButton}`}>Edit</button>
                      <button
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={() => handleDeleteMedicine(medicine._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>💊</div>
                <div className={styles.emptyText}>No medicines found</div>
              </div>
            )}
          </>
        )}

        {activeView === "prescriptions" && (
          <>
            <div className={styles.pageHeader}>
              <div>
                <h1 className={styles.pageTitle}>Prescriptions</h1>
                <p className={styles.pageSubtitle}>View and fulfill prescriptions</p>
              </div>
            </div>

            {prescriptions.length > 0 ? (
              <div className={styles.prescriptionsList}>
                {prescriptions.map((prescription) => (
                  <div key={prescription._id} className={styles.prescriptionCard}>
                    <div className={styles.prescriptionHeader}>
                      <div className={styles.prescriptionPatient}>
                        {prescription.patient?.name || "Unknown Patient"}
                      </div>
                      <span className={`${styles.prescriptionStatus} ${styles[prescription.status]}`}>
                        {prescription.status}
                      </span>
                    </div>

                    <div className={styles.prescriptionDetails}>
                      <div className={styles.prescriptionDetail}>
                        <span className={styles.prescriptionLabel}>Medicine</span>
                        <span className={styles.prescriptionValue}>{prescription.medicineName}</span>
                      </div>
                      <div className={styles.prescriptionDetail}>
                        <span className={styles.prescriptionLabel}>Dosage</span>
                        <span className={styles.prescriptionValue}>{prescription.dosage}</span>
                      </div>
                      <div className={styles.prescriptionDetail}>
                        <span className={styles.prescriptionLabel}>Frequency</span>
                        <span className={styles.prescriptionValue}>{prescription.frequency}</span>
                      </div>
                      <div className={styles.prescriptionDetail}>
                        <span className={styles.prescriptionLabel}>Duration</span>
                        <span className={styles.prescriptionValue}>{prescription.duration}</span>
                      </div>
                      <div className={styles.prescriptionDetail}>
                        <span className={styles.prescriptionLabel}>Doctor</span>
                        <span className={styles.prescriptionValue}>Dr. {prescription.doctor?.name || "Unknown"}</span>
                      </div>
                      <div className={styles.prescriptionDetail}>
                        <span className={styles.prescriptionLabel}>Date</span>
                        <span className={styles.prescriptionValue}>
                          {new Date(prescription.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📋</div>
                <div className={styles.emptyText}>No prescriptions found</div>
              </div>
            )}
          </>
        )}

        {activeView === "orders" && (
          <>
            <div className={styles.pageHeader}>
              <div>
                <h1 className={styles.pageTitle}>Orders</h1>
                <p className={styles.pageSubtitle}>Manage medicine orders</p>
              </div>
            </div>

            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📦</div>
              <div className={styles.emptyText}>No orders available</div>
            </div>
          </>
        )}
      </main>

      {showAddModal && (
        <AddMedicineModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchMedicines()
          }}
        />
      )}
    </div>
  )
}

function AddMedicineModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    manufacturer: "",
    category: "",
    price: "",
    stock: "",
    description: "",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to add medicine")

      onSuccess()
    } catch (error) {
      console.error("[v0] Add medicine error:", error)
      alert("Failed to add medicine")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Add New Medicine</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Medicine Name</label>
            <input
              type="text"
              className={styles.formInput}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter medicine name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Generic Name</label>
            <input
              type="text"
              className={styles.formInput}
              value={formData.genericName}
              onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
              placeholder="Enter generic name"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Manufacturer</label>
            <input
              type="text"
              className={styles.formInput}
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              placeholder="Enter manufacturer"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Category</label>
            <select
              className={styles.formSelect}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Select category</option>
              <option value="Antibiotic">Antibiotic</option>
              <option value="Painkiller">Painkiller</option>
              <option value="Vitamin">Vitamin</option>
              <option value="Antacid">Antacid</option>
              <option value="Antihistamine">Antihistamine</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Price ($)</label>
            <input
              type="number"
              step="0.01"
              className={styles.formInput}
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Stock (units)</label>
            <input
              type="number"
              className={styles.formInput}
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              placeholder="0"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Description</label>
            <textarea
              className={styles.formTextarea}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter medicine description"
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" className={`${styles.button} ${styles.buttonSecondary}`} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={`${styles.button} ${styles.buttonPrimary}`} disabled={loading}>
              {loading ? "Adding..." : "Add Medicine"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
