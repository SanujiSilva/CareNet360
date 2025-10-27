"use client"

import { useState, useEffect } from "react"
import styles from "./schedules.module.css"
import type { User, DoctorSchedule, DayOfWeek, TimeSlot } from "@/lib/types"

const DAYS: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export default function ManageSchedulesPage() {
  const [doctors, setDoctors] = useState<User[]>([])
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoctor, setSelectedDoctor] = useState("")
  const [showScheduleModal, setShowScheduleModal] = useState(false)

  useEffect(() => {
    fetchDoctors()
    fetchSchedules()
  }, [])

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

  const fetchSchedules = async () => {
    try {
      const response = await fetch("/api/admin/schedules")
      if (!response.ok) throw new Error("Failed to fetch schedules")
      const data = await response.json()
      setSchedules(data.schedules)
    } catch (error) {
      console.error("[v0] Fetch schedules error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSchedule = () => {
    setSelectedDoctor("")
    setShowScheduleModal(true)
  }

  const handleEditSchedule = (doctorId: string) => {
    setSelectedDoctor(doctorId)
    setShowScheduleModal(true)
  }

  if (loading) {
    return <div className={styles.loading}>Loading...</div>
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Doctor Schedules</h1>
        <button className={styles.addButton} onClick={handleCreateSchedule}>
          Add Schedule
        </button>
      </div>

      <div className={styles.schedulesList}>
        {doctors.map((doctor) => {
          const schedule = schedules.find((s) => s.doctorId.toString() === doctor._id?.toString())
          return (
            <div key={doctor._id?.toString()} className={styles.scheduleCard}>
              <div className={styles.doctorInfo}>
                <h3 className={styles.doctorName}>Dr. {doctor.name}</h3>
                <p className={styles.doctorSpecialty}>{doctor.specialization || "General"}</p>
              </div>
              {schedule ? (
                <>
                  <div className={styles.scheduleGrid}>
                    {DAYS.map((day) => (
                      <div key={day} className={styles.daySchedule}>
                        <h4 className={styles.dayTitle}>{day.charAt(0).toUpperCase() + day.slice(1)}</h4>
                        {schedule.weeklySchedule[day].isAvailable ? (
                          <div className={styles.slots}>
                            {schedule.weeklySchedule[day].slots.map((slot, i) => (
                              <div key={i} className={styles.slot}>
                                {slot.startTime} - {slot.endTime}
                                {slot.maxPatients && (
                                  <span className={styles.capacity}>
                                    (max: {slot.maxPatients})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className={styles.unavailable}>Not Available</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    className={styles.editButton}
                    onClick={() => handleEditSchedule(doctor._id!.toString())}
                  >
                    Edit Schedule
                  </button>
                </>
              ) : (
                <div className={styles.noSchedule}>
                  <p>No schedule set</p>
                  <button
                    className={styles.addButton}
                    onClick={() => handleEditSchedule(doctor._id!.toString())}
                  >
                    Add Schedule
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {showScheduleModal && (
        <ScheduleModal
          doctorId={selectedDoctor}
          schedule={schedules.find((s) => s.doctorId.toString() === selectedDoctor)}
          onClose={() => setShowScheduleModal(false)}
          onSuccess={() => {
            setShowScheduleModal(false)
            fetchSchedules()
          }}
        />
      )}
    </div>
  )
}

function ScheduleModal({
  doctorId,
  schedule,
  onClose,
  onSuccess,
}: {
  doctorId: string
  schedule?: DoctorSchedule
  onClose: () => void
  onSuccess: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [weeklySchedule, setWeeklySchedule] = useState<DoctorSchedule["weeklySchedule"]>(
    schedule?.weeklySchedule || DAYS.reduce((acc, day) => ({
      ...acc,
      [day]: { isAvailable: false, slots: [] }
    }), {} as DoctorSchedule["weeklySchedule"])
  )

  const handleToggleDay = (day: DayOfWeek) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        isAvailable: !prev[day].isAvailable,
      },
    }))
  }

  const handleAddSlot = (day: DayOfWeek) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, { startTime: "09:00", endTime: "10:00", maxPatients: 1 }],
      },
    }))
  }

  const handleUpdateSlot = (day: DayOfWeek, index: number, updates: Partial<TimeSlot>) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, i) =>
          i === index ? { ...slot, ...updates } : slot
        ),
      },
    }))
  }

  const handleRemoveSlot = (day: DayOfWeek, index: number) => {
    setWeeklySchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== index),
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/schedules`, {
        method: schedule ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          weeklySchedule,
        }),
      })

      if (!response.ok) throw new Error("Failed to save schedule")

      onSuccess()
    } catch (error) {
      console.error("[v0] Save schedule error:", error)
      alert("Failed to save schedule")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{schedule ? "Edit" : "Add"} Schedule</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.scheduleForm}>
          {DAYS.map((day) => (
            <div key={day} className={styles.daySection}>
              <div className={styles.dayHeader}>
                <label className={styles.dayLabel}>
                  <input
                    type="checkbox"
                    checked={weeklySchedule[day].isAvailable}
                    onChange={() => handleToggleDay(day)}
                  />
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </label>
                {weeklySchedule[day].isAvailable && (
                  <button
                    type="button"
                    className={styles.addSlotButton}
                    onClick={() => handleAddSlot(day)}
                  >
                    Add Slot
                  </button>
                )}
              </div>

              {weeklySchedule[day].isAvailable && (
                <div className={styles.slots}>
                  {weeklySchedule[day].slots.map((slot, index) => (
                    <div key={index} className={styles.slotInputs}>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) =>
                          handleUpdateSlot(day, index, { startTime: e.target.value })
                        }
                        required
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) =>
                          handleUpdateSlot(day, index, { endTime: e.target.value })
                        }
                        required
                      />
                      <input
                        type="number"
                        value={slot.maxPatients || ""}
                        onChange={(e) =>
                          handleUpdateSlot(day, index, {
                            maxPatients: parseInt(e.target.value) || undefined,
                          })
                        }
                        placeholder="Max patients"
                        min="1"
                      />
                      <button
                        type="button"
                        className={styles.removeSlotButton}
                        onClick={() => handleRemoveSlot(day, index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading}>
              {loading ? "Saving..." : "Save Schedule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}