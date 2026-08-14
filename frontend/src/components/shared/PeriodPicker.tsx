"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { TODAY, todayISO } from "@/lib/mock"

interface PeriodPickerProps {
  dateFrom: string
  dateTo: string
  onDateFromChange: (date: string) => void
  onDateToChange: (date: string) => void
  onApply: () => void
  onClear?: () => void
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

function shortDate(dateStr: string) {
  if (!dateStr) return ""
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" })
}

function quickRange(type: QuickFilterType) {
  const d = TODAY
  const pad = (n: number) => String(n).padStart(2, "0")
  const fmt = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
  if (type === "today") {
    return { from: todayISO(), to: todayISO() }
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
  return { from: fmt(threeMonthsAgo), to: todayISO() }
}

export default function PeriodPicker({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onApply,
  onClear,
}: PeriodPickerProps) {
  const today = TODAY
  const todayStr = todayISO()
  const [open, setOpen] = useState(false)
  const [calMonth, setCalMonth] = useState(today.getMonth() + 1)
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [target, setTarget] = useState<"from" | "to">("from")
  const ref = useRef<HTMLDivElement>(null)

  const activeIndex = QUICK_FILTERS.findIndex(
    (q) => dateFrom === quickRange(q.value).from && dateTo === quickRange(q.value).to
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function openPanel() {
    setTarget(dateFrom ? "to" : "from")
    const anchor = dateFrom || dateTo
    if (anchor) {
      const [yy, mm] = anchor.split("-").map(Number)
      if (!isNaN(yy) && !isNaN(mm)) {
        setCalMonth(mm)
        setCalYear(yy)
      }
    }
    setOpen((v) => !v)
  }

  function selectDate(dateStr: string) {
    if (target === "from") {
      onDateFromChange(dateStr)
      if (dateTo && dateStr > dateTo) onDateToChange(dateStr)
      setTarget("to")
    } else {
      onDateToChange(dateStr)
      if (dateFrom && dateStr < dateFrom) onDateFromChange(dateStr)
    }
  }

  function setQuickFilter(type: QuickFilterType) {
    const r = quickRange(type)
    onDateFromChange(r.from)
    onDateToChange(r.to)
    onApply()
    setOpen(false)
  }

  function applyCustom() {
    onApply()
    setOpen(false)
  }

  function isInRange(dateStr: string) {
    if (!dateFrom || !dateTo) return false
    return dateStr >= dateFrom && dateStr <= dateTo
  }

  let label = "Select Period"
  if (activeIndex >= 0) {
    label = QUICK_FILTERS[activeIndex].label
  } else if (dateFrom && dateTo) {
    label = `${shortDate(dateFrom)} – ${shortDate(dateTo)}`
  } else if (dateFrom) {
    label = `From ${shortDate(dateFrom)}`
  } else if (dateTo) {
    label = `To ${shortDate(dateTo)}`
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={openPanel}
        className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors ${
          open
            ? "border-primary bg-primary text-white"
            : "border-stroke bg-white text-foreground hover:bg-gray-50"
        }`}
      >
        <Calendar className="h-3.5 w-3.5" />
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[21rem] rounded-xl border border-stroke bg-white p-4 shadow-lg">
          <div className="mb-3 flex flex-wrap gap-1">
            {QUICK_FILTERS.map((q, i) => {
              const active = i === activeIndex
              return (
                <button
                  key={q.value}
                  type="button"
                  onClick={() => setQuickFilter(q.value)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                    active ? "bg-primary text-white" : "bg-gray-100 text-muted-foreground hover:bg-gray-200"
                  }`}
                >
                  {q.label}
                </button>
              )
            })}
          </div>

          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Custom range</span>
            <span className="h-px flex-1 bg-stroke" />
          </div>

          <div className="mb-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setTarget("from")}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                target === "from"
                  ? "border-primary bg-primary text-white"
                  : dateFrom
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-stroke bg-white text-muted-foreground hover:bg-gray-50"
              }`}
            >
              <Calendar className="h-3 w-3" />
              {dateFrom ? shortDate(dateFrom) : "From"}
            </button>
            <span className="text-muted-foreground">–</span>
            <button
              type="button"
              onClick={() => setTarget("to")}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                target === "to"
                  ? "border-primary bg-primary text-white"
                  : dateTo
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-stroke bg-white text-muted-foreground hover:bg-gray-50"
              }`}
            >
              <Calendar className="h-3 w-3" />
              {dateTo ? shortDate(dateTo) : "To"}
            </button>
          </div>

          <div className="rounded-lg border border-stroke p-3">
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

            <div className="mb-1.5 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
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
                const isToday = dateStr === todayStr
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
                    } ${isToday ? "font-bold" : ""}`}
                  >
                    <span className="relative inline-flex flex-col items-center leading-none">
                      {day}
                      {isToday && (
                        <span className={`mt-0.5 h-1 w-1 rounded-full ${isTarget ? "bg-white" : "bg-primary"}`} />
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            {onClear ? (
              <button
                type="button"
                onClick={() => { onClear(); setOpen(false) }}
                className="text-xs font-medium text-muted-foreground hover:text-primary"
              >
                Clear
              </button>
            ) : <span />}
            <button
              type="button"
              onClick={applyCustom}
              className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
