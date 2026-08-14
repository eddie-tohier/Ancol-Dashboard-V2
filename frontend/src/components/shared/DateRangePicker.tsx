"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { TODAY, todayISO } from "@/lib/mock"

interface DateRangePickerProps {
  dateFrom: string
  dateTo: string
  onDateFromChange: (date: string) => void
  onDateToChange: (date: string) => void
  onApply: () => void
  onClear?: () => void
  variant?: "row" | "stacked"
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

type QuickFilterType = "today" | "week" | "month" | "last3months"

const QUICK_FILTERS: Array<{ value: QuickFilterType; label: string }> = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "last3months", label: "Last 3 Months" },
]

function daysInMonth(m: number, y: number) {
  return new Date(y, m, 0).getDate()
}

function firstDayOfMonth(m: number, y: number) {
  return new Date(y, m - 1, 1).getDay()
}

function formatDate(dateStr: string) {
  if (!dateStr) return ""
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
}

export default function DateRangePicker({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApply,
  onClear,
  variant = "row",
}: DateRangePickerProps) {
  const today = TODAY
  const todayStr = todayISO()
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1)
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [target, setTarget] = useState<"from" | "to">("from")
  const ref = useRef<HTMLDivElement>(null)
  const quickRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [thumb, setThumb] = useState({ left: 0, width: 0 })

  const activeIndex = QUICK_FILTERS.findIndex(
    (q) => dateFrom === quickRange(q.value).from && dateTo === quickRange(q.value).to
  )

  useEffect(() => {
    function measure() {
      const container = quickRef.current
      const btn = activeIndex >= 0 ? buttonRefs.current[activeIndex] : null
      if (!container || !btn) {
        setThumb({ left: 0, width: 0 })
        return
      }
      const c = container.getBoundingClientRect()
      const b = btn.getBoundingClientRect()
      setThumb({ left: b.left - c.left, width: b.width })
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [activeIndex])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setCalendarOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function openCalendar(t: "from" | "to") {
    setTarget(t)
    const anchor = t === "from" ? dateFrom : dateTo
    if (anchor) {
      const [yy, mm] = anchor.split("-").map(Number)
      if (!isNaN(yy) && !isNaN(mm)) {
        setCalMonth(mm)
        setCalYear(yy)
      }
    }
    setCalendarOpen(true)
  }

  function selectDate(dateStr: string) {
    if (target === "from") {
      onDateFromChange(dateStr)
      if (dateTo && dateStr > dateTo) onDateToChange(dateStr)
    } else {
      onDateToChange(dateStr)
      if (dateFrom && dateStr < dateFrom) onDateFromChange(dateStr)
    }
    setCalendarOpen(false)
    onApply()
  }

  function isInRange(dateStr: string) {
    if (!dateFrom || !dateTo) return false
    return dateStr >= dateFrom && dateStr <= dateTo
  }

  function quickRange(type: QuickFilterType) {
    const d = TODAY
    const pad = (n: number) => String(n).padStart(2, "0")
    const fmt = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
    if (type === "today") {
      return { from: todayStr, to: todayStr }
    }
    if (type === "week") {
      const dayOfWeek = d.getDay()
      const mon = new Date(d)
      mon.setDate(d.getDate() - ((dayOfWeek + 6) % 7))
      const sun = new Date(mon)
      sun.setDate(mon.getDate() + 6)
      return { from: fmt(mon), to: fmt(sun) }
    }
    if (type === "month") {
      const first = new Date(d.getFullYear(), d.getMonth(), 1)
      const last = new Date(d.getFullYear(), d.getMonth() + 1, 0)
      return { from: fmt(first), to: fmt(last) }
    }
    const threeMonthsAgo = new Date(d)
    threeMonthsAgo.setMonth(d.getMonth() - 3)
    return { from: fmt(threeMonthsAgo), to: todayStr }
  }

  function setQuickFilter(type: QuickFilterType) {
    const r = quickRange(type)
    onDateFromChange(r.from)
    onDateToChange(r.to)
    onApply()
  }

  const quickFilterRow = (
    <div ref={quickRef} className="relative flex h-8 items-center rounded-lg border border-stroke bg-white">
      <span
        aria-hidden
        className="pointer-events-none absolute top-px bottom-px rounded-md bg-primary shadow-sm transition-[left,width] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ left: thumb.left, width: thumb.width, opacity: activeIndex >= 0 ? 1 : 0 }}
      />
      {QUICK_FILTERS.map((q, i) => {
        const active = i === activeIndex
        return (
          <button
            key={q.value}
            ref={(el) => { buttonRefs.current[i] = el }}
            type="button"
            onClick={() => setQuickFilter(q.value)}
            className={`relative z-10 flex h-8 items-center rounded-md px-3 text-xs font-semibold transition-colors ${
              active ? "text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {q.label}
          </button>
        )
      })}
    </div>
  )

  const rangePicker = (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1.5 text-sm">
        <button
          type="button"
          onClick={() => openCalendar("from")}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 font-medium transition-colors ${
            dateFrom
              ? "h-[30px] border-primary bg-primary text-white"
              : "h-8 border-stroke bg-white text-muted-foreground hover:bg-gray-50"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          {dateFrom ? formatDate(dateFrom) : "From"}
        </button>
        <span className="text-muted-foreground">-</span>
        <button
          type="button"
          onClick={() => openCalendar("to")}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 font-medium transition-colors ${
            dateTo
              ? "h-[30px] border-primary bg-primary text-white"
              : "h-8 border-stroke bg-white text-muted-foreground hover:bg-gray-50"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          {dateTo ? formatDate(dateTo) : "To"}
        </button>
        {variant === "row" && onClear && (dateFrom || dateTo) && (
          <button
            type="button"
            onClick={() => { onClear(); onApply() }}
            className="ml-1 text-xs font-medium text-muted-foreground hover:text-primary"
          >
            Clear
          </button>
        )}
      </div>

      {calendarOpen && (
        <div className="absolute left-0 top-full z-50 mt-1 w-64 rounded-lg border border-stroke bg-white p-4 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
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
            <span className="text-sm font-semibold text-gray-900">{monthNames[calMonth - 1]} {calYear}</span>
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

          <div className="mb-2 text-xs font-medium text-primary">
            {target === "from" ? "Select start date" : "Select end date"}
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {Array.from({ length: firstDayOfMonth(calMonth, calYear) }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth(calMonth, calYear) }, (_, i) => i + 1).map((day) => {
              const dateStr = `${calYear}-${String(calMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const inRange = isInRange(dateStr)
              const isTarget = dateStr === (target === "from" ? dateFrom : dateTo)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => selectDate(dateStr)}
                  className={`rounded py-1 text-sm transition-colors ${
                    isTarget
                      ? "bg-primary font-semibold text-white"
                      : inRange
                        ? "bg-primary/10 text-primary"
                        : "text-gray-900 hover:bg-gray-50"
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

  if (variant === "stacked") {
    return (
      <div className="flex flex-col items-end gap-1.5">
        {quickFilterRow}
        {rangePicker}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {quickFilterRow}
      {rangePicker}
    </div>
  )
}
