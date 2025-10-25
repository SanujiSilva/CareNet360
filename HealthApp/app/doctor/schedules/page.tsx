"use client"

import { useState } from "react"
import styles from "../doctor.module.css"

interface TimeRange {
  start: string
  end: string
}

interface ScheduleFormData {
  date: string
  timeRanges: TimeRange[]
  maxPatientsPerSlot?: number
  isAvailable: boolean
}

export default function DoctorSchedulePage() {
  const [scheduleData, setScheduleData] = useState<ScheduleFormData>({
    date: "",
    timeRanges: [{ start: "", end: "" }],
    maxPatientsPerSlot: 1,
    isAvailable: true
  })

  const addTimeRange = () => {
    setScheduleData(prev => ({
      ...prev,
      timeRanges: [...prev.timeRanges, { start: "", end: "" }]
    }))
  }

  const removeTimeRange = (index: number) => {
    setScheduleData(prev => ({
      ...prev,
      timeRanges: prev.timeRanges.filter((_, i) => i !== index)
    }))
  }

  const handleTimeRangeChange = (index: number, field: keyof TimeRange, value: string) => {
    setScheduleData(prev => ({
      ...prev,
      timeRanges: prev.timeRanges.map((range, i) => 
        i === index ? { ...range, [field]: value } : range
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch("/api/doctors/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleData),
      })

      if (!response.ok) throw new Error("Failed to save schedule")

      alert("Schedule saved successfully!")
      setScheduleData({
        date: "",
        timeRanges: [{ start: "", end: "" }],
        maxPatientsPerSlot: 1,
        isAvailable: true
      })
    } catch (error) {
      console.error("[v0] Save schedule error:", error)
      alert("Failed to save schedule")
    }
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Manage Schedule</h1>
        <p className={styles.pageSubtitle}>Set your availability and time slots</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Date</label>
          <input
            type="date"
            className={styles.formInput}
            value={scheduleData.date}
            onChange={(e) => setScheduleData(prev => ({ ...prev, date: e.target.value }))}
            min={new Date().toISOString().split("T")[0]}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Time Ranges</label>
          {scheduleData.timeRanges.map((range, index) => (
            <div key={index} className={styles.timeRangeGroup}>
              <input
                type="time"
                className={styles.timeInput}
                value={range.start}
                onChange={(e) => handleTimeRangeChange(index, "start", e.target.value)}
                required
              />
              <span>to</span>
              <input
                type="time"
                className={styles.timeInput}
                value={range.end}
                onChange={(e) => handleTimeRangeChange(index, "end", e.target.value)}
                required
              />
              {index > 0 && (
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeTimeRange(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className={styles.addButton}
            onClick={addTimeRange}
          >
            Add Time Range
          </button>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Max Patients Per 10-min Slot</label>
          <input
            type="number"
            className={styles.formInput}
            value={scheduleData.maxPatientsPerSlot}
            onChange={(e) => setScheduleData(prev => ({ ...prev, maxPatientsPerSlot: parseInt(e.target.value) }))}
            min={1}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            <input
              type="checkbox"
              checked={scheduleData.isAvailable}
              onChange={(e) => setScheduleData(prev => ({ ...prev, isAvailable: e.target.checked }))}
            />
            Available for Appointments
          </label>
        </div>

        <div className={styles.formActions}>
          <button type="submit" className={styles.submitButton}>
            Save Schedule
          </button>
        </div>
      </form>
    </div>
  )
}