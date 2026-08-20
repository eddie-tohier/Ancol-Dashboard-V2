"use client"

import { useEffect, useState, useCallback } from "react"
import { reconciliationApi } from "@/lib/api-client"
import PageHeader from "@/components/shared/PageHeader"
import StatusBadge from "@/components/shared/StatusBadge"
import FilterSelect from "@/components/shared/FilterSelect"
import CalendarPicker from "@/components/shared/CalendarPicker"
import FloatingFilterBadge from "@/components/shared/FloatingFilterBadge"
import { ChevronLeft, ChevronRight, RefreshCw, Loader2 } from "lucide-react"

interface Session {
  id: number
  session_no: string
  date: string
  time: string
  duration: string
  total_orders: number
  match_rate: number
  status: "COMPLETED" | "FAILED" | "NO_ORDERS"
  site_code: string
  site_name: string
}

interface SessionDetail extends Session {
  logs: Array<{ level: string; step: string; message: string; createdAt: string }>
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: "Completed", color: "green" },
  FAILED: { label: "Failed", color: "red" },
  NO_ORDERS: { label: "No Orders", color: "gray" },
}

export default function ReconciliationPage() {
  const [dates, setDates] = useState<string[]>([])
  const [date, setDate] = useState("")
  const [sessions, setSessions] = useState<Session[]>([])
  const [statusFilter, setStatusFilter] = useState("all")
  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    reconciliationApi
      .availableDates()
      .then((d) => {
        setDates(d)
        setDate(d[d.length - 1] || new Date().toISOString().slice(0, 10))
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load dates"))
  }, [])

  const fetchSessions = useCallback(async (d: string) => {
    setLoading(true)
    setError("")
    try {
      const res = await reconciliationApi.sessions(d)
      setSessions(res as Session[])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load sessions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!date) return
    const t = setTimeout(() => fetchSessions(date), 0)
    return () => clearTimeout(t)
  }, [date, fetchSessions])

  async function openDetail(session: Session) {
    setDetailLoading(true)
    try {
      const res = await reconciliationApi.session(session.id)
      setDetail(res as SessionDetail)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load session")
    } finally {
      setDetailLoading(false)
    }
  }

  const filtered = sessions.filter((s) => (statusFilter === "all" ? true : s.status === statusFilter))
  const completed = sessions.filter((s) => s.status === "COMPLETED").length
  const failed = sessions.filter((s) => s.status === "FAILED").length

  const minDate = dates[0] || ""
  const maxDate = dates[dates.length - 1] || ""

  function pad(n: number) { return String(n).padStart(2, "0") }

  function shiftDay(dateStr: string, offset: number) {
    const [y, m, d] = dateStr.split("-").map(Number)
    const dt = new Date(y, m - 1, d)
    dt.setDate(dt.getDate() + offset)
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
  }

  const activeFilterCount = (statusFilter !== "all" ? 1 : 0)

  return (
    <div className="page content">
      <div className="content__container space-y-4">
        <PageHeader title="Reconciliation" description="Transaction reconciliation sessions by hour per attraction.">
          <button
            onClick={() => fetchSessions(date)}
            className="button button--neutral button--sm"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </PageHeader>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDate(shiftDay(date, -1))}
              disabled={!date || date <= minDate}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-stroke bg-white px-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous day"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <CalendarPicker
              value={date}
              onChange={setDate}
              availableDates={dates}
              min={minDate}
              max={maxDate}
            />
            <button
              type="button"
              onClick={() => setDate(shiftDay(date, 1))}
              disabled={!date || date >= maxDate}
              className="inline-flex h-8 items-center justify-center rounded-lg border border-stroke bg-white px-2 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next day"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <FilterSelect value={statusFilter} onChange={setStatusFilter} options={[
            { value: "all", label: "All Sessions" },
            { value: "COMPLETED", label: "Completed" },
            { value: "FAILED", label: "Failed" },
            { value: "NO_ORDERS", label: "No Orders" },
          ]} />
          <span className="ml-auto text-sm text-muted-foreground">
            {completed} completed · {failed} failed · {sessions.length} sessions
          </span>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Session list */}
          <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm lg:col-span-2">
            <div className="border-b border-stroke px-5 py-4">
              <h3 className="text-base font-bold text-gray-900">Sessions — {date || "..."}</h3>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Session</th>
                    <th>Time</th>
                    <th>Site</th>
                    <th className="text-right">Orders</th>
                    <th className="text-right">Match Rate</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={7}>
                        <div className="flex items-center justify-center py-10">
                          <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className="py-10 text-center text-muted-foreground">No sessions for this filter.</div>
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    filtered.map((s) => (
                      <tr key={s.id} className="cursor-pointer hover:bg-gray-50" onClick={() => openDetail(s)}>
                        <td className="font-mono text-xs font-semibold text-primary">{s.session_no}</td>
                        <td className="whitespace-nowrap text-sm">{s.time.slice(0, 5)}</td>
                        <td>
                          <p className="text-sm font-medium">{s.site_name}</p>
                          <p className="text-xs uppercase text-muted-foreground">{s.site_code}</p>
                        </td>
                        <td className="text-right">{s.total_orders}</td>
                        <td className="text-right">
                          {s.status === "COMPLETED" ? (
                            <span className="font-semibold text-success">{s.match_rate}%</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td>
                          <StatusBadge label={STATUS_META[s.status]?.label} color={STATUS_META[s.status]?.color} />
                        </td>
                        <td>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail panel */}
          <div className="h-fit self-start rounded-2xl border border-stroke bg-white p-5 shadow-sm lg:sticky lg:top-4">
            <h3 className="mb-3 text-base font-bold text-gray-900">Session Detail</h3>
            {detailLoading && (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            {!detailLoading && !detail && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Select a session to view reconciliation logs.
              </p>
            )}
            {!detailLoading && detail && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-stroke bg-gray-50 p-4">
                  <div>
                    <p className="font-mono text-sm font-bold text-primary">{detail.session_no}</p>
                    <p className="text-xs text-muted-foreground">
                      {detail.date} · {detail.time.slice(0, 5)} · {detail.site_name}
                    </p>
                  </div>
                  <StatusBadge label={STATUS_META[detail.status]?.label} color={STATUS_META[detail.status]?.color} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-xl border border-stroke p-3">
                    <p className="text-lg font-bold text-gray-900">{detail.total_orders}</p>
                    <p className="text-xs text-muted-foreground">Orders</p>
                  </div>
                  <div className="rounded-xl border border-stroke p-3">
                    <p className="text-lg font-bold text-success">{detail.match_rate}%</p>
                    <p className="text-xs text-muted-foreground">Match Rate</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Logs</p>
                  {detail.logs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2 rounded-lg border border-stroke bg-gray-50 px-3 py-2">
                      <span
                        className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                          log.level === "ERROR" ? "bg-danger" : log.level === "WARN" ? "bg-warning" : "bg-primary"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900">{log.message}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {log.step} · {log.createdAt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <FloatingFilterBadge
          activeFilterCount={activeFilterCount}
          onClearAll={() => setStatusFilter("all")}
        />
      </div>
    </div>
  )
}
