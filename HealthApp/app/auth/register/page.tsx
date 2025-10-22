"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import styles from "../auth.module.css"

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "patient" as "patient" | "doctor" | "admin" | "pharmacist",
    phone: "",
    dateOfBirth: "",
    gender: "male" as "male" | "female" | "other",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Registration failed")
      }

      // Redirect based on role
      const roleRoutes = {
        patient: "/patient/dashboard",
        doctor: "/doctor/dashboard",
        admin: "/admin/dashboard",
        pharmacist: "/pharmacist/dashboard",
      }

      router.push(roleRoutes[data.user.role as keyof typeof roleRoutes])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.authContainer}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>H+</div>
            <div className={styles.logoText}>Carenet360</div>
          </div>
          <h1 className={styles.authTitle}>Create Account</h1>
          <p className={styles.authSubtitle}>Join our healthcare platform</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.authForm}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>I am a</label>
            <div className={styles.radioGroup}>
              {[
                { value: "patient", icon: "🏥", label: "Patient" },
                { value: "doctor", icon: "👨‍⚕️", label: "Doctor" },
                { value: "pharmacist", icon: "💊", label: "Pharmacist" },
                { value: "admin", icon: "⚙️", label: "Admin" },
              ].map((role) => (
                <label key={role.value} className={styles.radioCard}>
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={formData.role === role.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        role: e.target.value as any,
                      })
                    }
                    className={styles.radioInput}
                  />
                  <div className={styles.radioContent}>
                    <div className={styles.radioIcon}>{role.icon}</div>
                    <div className={styles.radioLabel}>{role.label}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.formLabel}>
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className={styles.formInput}
              placeholder="Enter your full name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.formLabel}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className={styles.formInput}
              placeholder="Enter your email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone" className={styles.formLabel}>
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              className={styles.formInput}
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="dateOfBirth" className={styles.formLabel}>
              Date of Birth
            </label>
            <input
              id="dateOfBirth"
              type="date"
              className={styles.formInput}
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Gender</label>
            <div className={styles.radioGroupInline}>
              {[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
                { value: "other", label: "Other" },
              ].map((gender) => (
                <label key={gender.value} className={styles.radioOption}>
                  <input
                    type="radio"
                    name="gender"
                    value={gender.value}
                    checked={formData.gender === gender.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        gender: e.target.value as any,
                      })
                    }
                    className={styles.radioInput}
                  />
                  <span className={styles.radioMark}></span>
                  <span className={styles.radioText}>{gender.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.formLabel}>
              Password
            </label>
            <input
              id="password"
              type="password"
              className={styles.formInput}
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.formLabel}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className={styles.formInput}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>

          <button type="submit" className={styles.submitButton} disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className={styles.authFooter}>
          Already have an account?{" "}
          <Link href="/auth/login" className={styles.authLink}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
