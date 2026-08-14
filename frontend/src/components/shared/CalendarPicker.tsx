"use client"

import { useEffect, useRef, useState } from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"

interface CalendarPickerProps {
  value: string
  onChange: (date: string) => void
  availableDates: string[]
  min?: string
  max?: string
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function pad(n: number) {
  return String(n).padStart(2, "0")
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`
}

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate()
}

function firstDayOfMonth(month: number, year: number) {
  return new Date(year, month - 1, 1).getDay()
}

export default function CalendarPicker({ value, onChange, availableDates, min, max }: CalendarPickerProps) {
  const [open, setOpen] = useState(false)
  const [y, m] = value.split("-").map(Number)
  const [lastValue, setLastValue] = useState(value)
  const [calMonth, setCalMonth] = useState(m)
  const [calYear, setCalYear] = useState(y)
  const ref = useRef<HTMLDivElement>(null)

  if (value !== lastValue) {
    setLastValue(value)
    const [yy, mm] = value.split("-").map(Number)
    if (!isNaN(yy) && !isNaN(mm)) {
      setCalMonth(mm)
      setCalYear(yy)
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-lg border border-stroke bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
      >
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {formatDate(value)}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-stroke bg-white p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (calMonth === 1) { setCalMonth(12); setCalYear(calYear - 1) }
                else { setCalMonth(calMonth - 1) }
              }}
              className="rounded p-1 hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-gray-900">{MONTH_NAMES[calMonth - 1]} {calYear}</span>
            <button
              type="button"
              onClick={() => {
                if (calMonth === 12) { setCalMonth(1); setCalYear(calYear + 1) }
                else { setCalMonth(calMonth + 1) }
              }}
              className="rounded p-1 hover:bg-gray-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {Array.from({ length: firstDayOfMonth(calMonth, calYear) }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth(calMonth, calYear) }, (_, i) => i + 1).map((day) => {
              const dateStr = toDateStr(calYear, calMonth, day)
              const hasData = availableDates.includes(dateStr)
              const isSelected = dateStr === value
              const isOutsideRange = Boolean(min && dateStr < min) || Boolean(max && dateStr > max)
              return (
                <button
                  key={day}
                  type="button"
                  disabled={!hasData || isOutsideRange}
                  onClick={() => { onChange(dateStr); setOpen(false) }}
                  className={`rounded py-1 text-sm ${
                    isSelected
                      ? "bg-primary font-semibold text-white"
                      : hasData && !isOutsideRange
                        ? "text-gray-900 hover:bg-gray-50"
                        : "cursor-not-allowed text-gray-300"
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
