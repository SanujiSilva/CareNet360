"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "../admin.module.css"

interface User {
  id: string
  name: string
  email: string
  role: string
}

interface Stats {
  totalUsers: number
  totalAppointments: number
  totalPrescriptions: number
  totalRecords: number
  usersByRole: Array<{ _id: string; count: number }>
  appointmentsByStatus: Array<{ _id: string; count: number }>
  recentAppointments: any[]
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState("dashboard")

  useEffect(() => {
    fetchUserData()
    fetchStats()
    fetchUsers()
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

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats")
      if (!response.ok) throw new Error("Failed to fetch stats")
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error("[v0] Fetch stats error:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (!response.ok) throw new Error("Failed to fetch users")
      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      console.error("[v0] Fetch users error:", error)
    }
  }

  const fetchAppointments = async () => {
    try {
      const response = await fetch("/api/admin/appointments")
      if (!response.ok) throw new Error("Failed to fetch appointments")
      const data = await response.json()
      setAppointments(data.appointments)
    } catch (error) {
      console.error("[v0] Fetch appointments error:", error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete user")

      fetchUsers()
      fetchStats()
    } catch (error) {
      console.error("[v0] Delete user error:", error)
      alert("Failed to delete user")
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

  const getRoleCount = (role: string) => {
    return stats?.usersByRole.find((r) => r._id === role)?.count || 0
  }

  const getStatusCount = (status: string) => {
    return stats?.appointmentsByStatus.find((s) => s._id === status)?.count || 0
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
            className={`${styles.navItem} ${activeView === "dashboard" ? styles.active : ""}`}
            onClick={() => setActiveView("dashboard")}
          >
            <span className={styles.navIcon}>📊</span>
            Dashboard
          </button>
          <button
            className={`${styles.navItem} ${activeView === "hospitals" ? styles.active : ""}`}
            onClick={() => router.push("/admin/hospitals")}
          >
            <span className={styles.navIcon}>🏥</span>
            Hospitals
          </button>
          <button
            className={`${styles.navItem} ${activeView === "staff" ? styles.active : ""}`}
            onClick={() => router.push("/admin/staff")}
          >
            <span className={styles.navIcon}>👨‍⚕️</span>
            Staff
          </button>
          <button
            className={`${styles.navItem} ${activeView === "users" ? styles.active : ""}`}
            onClick={() => setActiveView("users")}
          >
            <span className={styles.navIcon}>👥</span>
            Patients
          </button>
          <button
            className={`${styles.navItem} ${activeView === "appointments" ? styles.active : ""}`}
            onClick={() => setActiveView("appointments")}
          >
            <span className={styles.navIcon}>📅</span>
            Appointments
          </button>
          <button
            className={`${styles.navItem} ${activeView === "analytics" ? styles.active : ""}`}
            onClick={() => setActiveView("analytics")}
          >
            <span className={styles.navIcon}>📈</span>
            Analytics
          </button>
          <button
            className={`${styles.navItem} ${activeView === "settings" ? styles.active : ""}`}
            onClick={() => setActiveView("settings")}
          >
            <span className={styles.navIcon}>⚙️</span>
            Settings
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{user?.name.charAt(0).toUpperCase()}</div>
            <div>
              <div className={styles.userName}>{user?.name}</div>
              <div className={styles.userRole}>Administrator</div>
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
              <h1 className={styles.pageTitle}>Admin Dashboard</h1>
              <p className={styles.pageSubtitle}>System overview and analytics</p>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Total Users</span>
                  <div className={`${styles.statIcon} ${styles.primary}`}>👥</div>
                </div>
                <div className={styles.statValue}>{stats?.totalUsers || 0}</div>
                <div className={styles.statChange}>All registered users</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Appointments</span>
                  <div className={`${styles.statIcon} ${styles.secondary}`}>📅</div>
                </div>
                <div className={styles.statValue}>{stats?.totalAppointments || 0}</div>
                <div className={styles.statChange}>Total bookings</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Prescriptions</span>
                  <div className={`${styles.statIcon} ${styles.accent}`}>💊</div>
                </div>
                <div className={styles.statValue}>{stats?.totalPrescriptions || 0}</div>
                <div className={styles.statChange}>Total issued</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Medical Records</span>
                  <div className={`${styles.statIcon} ${styles.success}`}>📋</div>
                </div>
                <div className={styles.statValue}>{stats?.totalRecords || 0}</div>
                <div className={styles.statChange}>Total records</div>
              </div>
            </div>

            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>Users by Role</h3>
                <div className={styles.chartContent}>
                  {["patient", "doctor", "pharmacist", "admin"].map((role) => {
                    const count = getRoleCount(role)
                    const percentage = stats?.totalUsers ? (count / stats.totalUsers) * 100 : 0
                    return (
                      <div key={role} className={styles.chartItem}>
                        <span className={styles.chartLabel}>{role}</span>
                        <div className={styles.chartBar}>
                          <div className={styles.chartBarFill} style={{ width: `${percentage}%` }} />
                        </div>
                        <span className={styles.chartValue}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>Appointments by Status</h3>
                <div className={styles.chartContent}>
                  {["scheduled", "completed", "cancelled"].map((status) => {
                    const count = getStatusCount(status)
                    const percentage = stats?.totalAppointments ? (count / stats.totalAppointments) * 100 : 0
                    return (
                      <div key={status} className={styles.chartItem}>
                        <span className={styles.chartLabel}>{status}</span>
                        <div className={styles.chartBar}>
                          <div className={styles.chartBarFill} style={{ width: `${percentage}%` }} />
                        </div>
                        <span className={styles.chartValue}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Recent Activity</h2>
              </div>

              {stats?.recentAppointments && stats.recentAppointments.length > 0 ? (
                <table className={styles.table}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {stats.recentAppointments.slice(0, 5).map((appointment: any) => (
                      <tr key={appointment._id}>
                        <td>{new Date(appointment.date).toLocaleDateString()}</td>
                        <td>{appointment.time}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[appointment.status]}`}>{appointment.status}</span>
                        </td>
                        <td>{appointment.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📊</div>
                  <div className={styles.emptyText}>No recent activity</div>
                </div>
              )}
            </div>
          </>
        )}

        {activeView === "users" && (
          <>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>User Management</h1>
              <p className={styles.pageSubtitle}>Manage all system users</p>
            </div>

            <div className={styles.card}>
              {users.length > 0 ? (
                <table className={styles.table}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Phone</th>
                      <th>Joined</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[user.role]}`}>{user.role}</span>
                        </td>
                        <td>{user.phone || "N/A"}</td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button className={styles.actionButton} onClick={() => handleDeleteUser(user._id)}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>👥</div>
                  <div className={styles.emptyText}>No users found</div>
                </div>
              )}
            </div>
          </>
        )}

        {activeView === "appointments" && (
          <>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>All Appointments</h1>
              <p className={styles.pageSubtitle}>System-wide appointment overview</p>
            </div>

            <div className={styles.card}>
              {appointments.length > 0 ? (
                <table className={styles.table}>
                  <thead className={styles.tableHeader}>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Status</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody className={styles.tableBody}>
                    {appointments.map((appointment) => (
                      <tr key={appointment._id}>
                        <td>{new Date(appointment.date).toLocaleDateString()}</td>
                        <td>{appointment.time}</td>
                        <td>{appointment.patient?.name || "Unknown"}</td>
                        <td>Dr. {appointment.doctor?.name || "Unknown"}</td>
                        <td>
                          <span className={`${styles.badge} ${styles[appointment.status]}`}>{appointment.status}</span>
                        </td>
                        <td>{appointment.reason}</td>
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

        {activeView === "analytics" && (
          <>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Analytics</h1>
              <p className={styles.pageSubtitle}>System performance and insights</p>
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Patients</span>
                  <div className={`${styles.statIcon} ${styles.primary}`}>🏥</div>
                </div>
                <div className={styles.statValue}>{getRoleCount("patient")}</div>
                <div className={styles.statChange}>Registered patients</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Doctors</span>
                  <div className={`${styles.statIcon} ${styles.secondary}`}>👨‍⚕️</div>
                </div>
                <div className={styles.statValue}>{getRoleCount("doctor")}</div>
                <div className={styles.statChange}>Active doctors</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Pharmacists</span>
                  <div className={`${styles.statIcon} ${styles.accent}`}>💊</div>
                </div>
                <div className={styles.statValue}>{getRoleCount("pharmacist")}</div>
                <div className={styles.statChange}>Active pharmacists</div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>Completion Rate</span>
                  <div className={`${styles.statIcon} ${styles.success}`}>✓</div>
                </div>
                <div className={styles.statValue}>
                  {stats?.totalAppointments
                    ? Math.round((getStatusCount("completed") / stats.totalAppointments) * 100)
                    : 0}
                  %
                </div>
                <div className={styles.statChange}>Appointments completed</div>
              </div>
            </div>

            <div className={styles.chartsGrid}>
              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>System Health</h3>
                <div className={styles.chartContent}>
                  <div className={styles.chartItem}>
                    <span className={styles.chartLabel}>Database</span>
                    <div className={styles.chartBar}>
                      <div className={styles.chartBarFill} style={{ width: "95%" }} />
                    </div>
                    <span className={styles.chartValue}>95%</span>
                  </div>
                  <div className={styles.chartItem}>
                    <span className={styles.chartLabel}>API Response</span>
                    <div className={styles.chartBar}>
                      <div className={styles.chartBarFill} style={{ width: "98%" }} />
                    </div>
                    <span className={styles.chartValue}>98%</span>
                  </div>
                  <div className={styles.chartItem}>
                    <span className={styles.chartLabel}>Uptime</span>
                    <div className={styles.chartBar}>
                      <div className={styles.chartBarFill} style={{ width: "99%" }} />
                    </div>
                    <span className={styles.chartValue}>99%</span>
                  </div>
                </div>
              </div>

              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>User Engagement</h3>
                <div className={styles.chartContent}>
                  <div className={styles.chartItem}>
                    <span className={styles.chartLabel}>Daily Active</span>
                    <div className={styles.chartBar}>
                      <div className={styles.chartBarFill} style={{ width: "75%" }} />
                    </div>
                    <span className={styles.chartValue}>75%</span>
                  </div>
                  <div className={styles.chartItem}>
                    <span className={styles.chartLabel}>Weekly Active</span>
                    <div className={styles.chartBar}>
                      <div className={styles.chartBarFill} style={{ width: "85%" }} />
                    </div>
                    <span className={styles.chartValue}>85%</span>
                  </div>
                  <div className={styles.chartItem}>
                    <span className={styles.chartLabel}>Monthly Active</span>
                    <div className={styles.chartBar}>
                      <div className={styles.chartBarFill} style={{ width: "92%" }} />
                    </div>
                    <span className={styles.chartValue}>92%</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeView === "settings" && (
          <>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>System Settings</h1>
              <p className={styles.pageSubtitle}>Configure system preferences</p>
            </div>

            <div className={styles.card}>
              <h3 className={styles.cardTitle}>General Settings</h3>
              <p style={{ color: "var(--color-text-secondary)", marginTop: "1rem" }}>
                System configuration options will be available here. This includes email notifications, backup
                schedules, security settings, and more.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
