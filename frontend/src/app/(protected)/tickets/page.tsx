"use client"

import { useEffect, useState, useCallback } from "react"
import { ticketsApi } from "@/lib/api-client"
import { formatDateTime, initialOf } from "@/lib/format"
import PageHeader from "@/components/shared/PageHeader"
import StatusBadge from "@/components/shared/StatusBadge"
import FilterSelect from "@/components/shared/FilterSelect"
import SearchInput from "@/components/shared/SearchInput"
import FloatingFilterBadge from "@/components/shared/FloatingFilterBadge"
import SummaryCards from "@/components/shared/SummaryCards"

interface TicketSummary {
  tickets: number
  status_counts: { ACTIVE: number; USED: number; EXPIRED: number; REFUND: number }
}

interface Ticket {
  orderticket_id: number
  ticket_no: string
  ticket_date: string
  status: string
  status_code: string
  status_color: string
  order_no: string
  order_id: number
  customer_name: string
  product_name: string
  site_code: string
  site_name: string
}

export default function TicketsPage() {
  const [data, setData] = useState<{ data: Ticket[]; current_page: number; last_page: number; total: number; per_page: number } | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [status, setStatus] = useState("all")
  const [unit, setUnit] = useState("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState<TicketSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true)
    try {
      const res = await ticketsApi.summary({
        search: search || undefined,
        status,
        unit,
      })
      setSummary(res as TicketSummary)
    } catch {
      setSummary(null)
    } finally {
      setSummaryLoading(false)
    }
  }, [search, status, unit])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await ticketsApi.list<Ticket>({
        page,
        per_page: 15,
        search: search || undefined,
        status,
        unit,
      })
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load tickets")
    } finally {
      setLoading(false)
    }
  }, [page, search, status, unit])

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 0)
    return () => clearTimeout(t)
  }, [fetchData])

  useEffect(() => {
    const t = setTimeout(() => fetchSummary(), 0)
    return () => clearTimeout(t)
  }, [fetchSummary])

  const activeFilterCount =
    (status !== "all" ? 1 : 0) +
    (unit !== "all" ? 1 : 0) +
    (searchInput.trim() ? 1 : 0)

  return (
    <div className="page content">
      <div className="content__container space-y-4">
        <PageHeader title="Tickets" description="List of e-tickets issued per order." />

        {/* Summary */}
        <SummaryCards
          loading={summaryLoading}
          items={[
            { label: "Total Tickets", value: (summary?.tickets ?? 0).toLocaleString("id-ID"), sub: "Total e-tickets", bg: "/cube-bg.jpg" },
            { label: "Active", value: (summary?.status_counts?.ACTIVE ?? 0).toLocaleString("id-ID"), sub: "Active tickets", bg: "/cube-bg_1.jpg" },
            { label: "Used", value: (summary?.status_counts?.USED ?? 0).toLocaleString("id-ID"), sub: "Used tickets", bg: "/cube-bg_2.jpg" },
            { label: "Expired / Refund", value: ((summary?.status_counts?.EXPIRED ?? 0) + (summary?.status_counts?.REFUND ?? 0)).toLocaleString("id-ID"), sub: `${summary?.status_counts?.EXPIRED ?? 0} expired · ${summary?.status_counts?.REFUND ?? 0} refund`, bg: "/cube-bg_3.jpg" },
          ]}
        />

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-wrap items-end gap-2">
            <FilterSelect value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={[
              { value: "all", label: "All Status" },
              { value: "ACTIVE", label: "Active" },
              { value: "USED", label: "Used" },
              { value: "EXPIRED", label: "Expired" },
              { value: "REFUND", label: "Refund" },
            ]} />
            <FilterSelect value={unit} onChange={(v) => { setUnit(v); setPage(1) }} options={[
              { value: "all", label: "All Units" },
              { value: "pgu", label: "Ancol Taman Impian" },
              { value: "awa", label: "Atlantis" },
              { value: "dfn", label: "Dufan" },
              { value: "jbl", label: "Jakarta Bird Land" },
              { value: "ods", label: "Samudra" },
              { value: "swa", label: "Seaworld" },
            ]} />
          </div>
          <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search ticket / order..." />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stroke px-5 py-4">
            <h3 className="text-base font-bold text-gray-900">Ticket List</h3>
            <span className="text-sm text-muted-foreground">{data?.total ?? 0} tickets</span>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Ticket No</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Unit</th>
                  <th>Ticket Date</th>
                  <th>Status</th>
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
                {!loading && data?.data.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="py-10 text-center text-muted-foreground">No tickets found.</div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  data?.data.map((t) => (
                    <tr key={t.orderticket_id} className="hover:bg-gray-50">
                      <td className="font-mono text-xs font-semibold text-primary">{t.ticket_no.slice(0, 16)}…</td>
                      <td className="font-mono text-xs text-muted-foreground">{t.order_no}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {initialOf(t.customer_name)}
                          </span>
                          <span className="max-w-[9rem] truncate">{t.customer_name}</span>
                        </div>
                      </td>
                      <td className="max-w-[12rem] truncate text-sm">{t.product_name}</td>
                      <td>
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold uppercase text-gray-600">
                          {t.site_code}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(t.ticket_date)}</td>
                      <td>
                        <StatusBadge label={t.status} color={t.status_color} />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {data && data.last_page > 1 && (
            <div className="flex items-center justify-between border-t border-stroke px-5 py-3">
              <span className="text-xs text-muted-foreground">
                Page {data.current_page} of {data.last_page}
              </span>
              <div className="flex gap-1">
                <button className="pagination__button" disabled={data.current_page <= 1} onClick={() => setPage(data.current_page - 1)}>‹</button>
                <button className="pagination__button" disabled={data.current_page >= data.last_page} onClick={() => setPage(data.current_page + 1)}>›</button>
              </div>
            </div>
          )}
        </div>

        <FloatingFilterBadge
          activeFilterCount={activeFilterCount}
          onClearAll={() => {
            setStatus("all")
            setUnit("all")
            setSearchInput("")
            setSearch("")
            setPage(1)
          }}
        />
      </div>
    </div>
  )
}
