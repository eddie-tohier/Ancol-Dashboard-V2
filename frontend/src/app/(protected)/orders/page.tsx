"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ordersApi } from "@/lib/api-client"
import { formatRupiah, formatDateTime, initialOf } from "@/lib/format"
import PageHeader from "@/components/shared/PageHeader"
import StatusBadge from "@/components/shared/StatusBadge"
import FilterSelect from "@/components/shared/FilterSelect"
import SearchInput from "@/components/shared/SearchInput"
import FloatingFilterBadge from "@/components/shared/FloatingFilterBadge"
import DateRangePicker from "@/components/shared/DateRangePicker"
import SummaryCards from "@/components/shared/SummaryCards"
import { ChevronRight } from "lucide-react"

interface OrderSummary {
  orders: number
  revenue: number
  gross_amt: number
  base_amt: number
  pbjt_amt: number
  tickets: number
  status_counts: { PD: number; TI: number; PE: number; FL: number }
}

interface Order {
  order_id: number
  order_no: string
  order_date: string
  visit_date: string
  total_amt: number
  status: string
  status_label: string
  status_color: string
  customer_name: string
  customer_phone: string
  total_qty: number
  items: Array<{ product_name: string; qty: number; site_code: string }>
  unit_ids: string[]
}

const SITES = [
  { value: "all", label: "All Units" },
  { value: "pgu", label: "Ancol Taman Impian" },
  { value: "awa", label: "Atlantis" },
  { value: "dfn", label: "Dufan" },
  { value: "jbl", label: "Jakarta Bird Land" },
  { value: "ods", label: "Samudra" },
  { value: "swa", label: "Seaworld" },
]

export default function OrdersPage() {
  const router = useRouter()
  const [data, setData] = useState<{ data: Order[]; current_page: number; last_page: number; total: number; per_page: number } | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [status, setStatus] = useState("all")
  const [unit, setUnit] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState<OrderSummary | null>(null)
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
      const res = await ordersApi.summary({
        search: search || undefined,
        status,
        unit,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      setSummary(res as OrderSummary)
    } catch {
      setSummary(null)
    } finally {
      setSummaryLoading(false)
    }
  }, [search, status, unit, dateFrom, dateTo])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await ordersApi.list<Order>({
        page,
        per_page: 10,
        search: search || undefined,
        status,
        unit,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sort: "order_date_desc",
      })
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load orders")
    } finally {
      setLoading(false)
    }
  }, [page, search, status, unit, dateFrom, dateTo])

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
    (dateFrom || dateTo ? 1 : 0) +
    (searchInput.trim() ? 1 : 0)

  return (
    <div className="page content">
      <div className="content__container space-y-4">
        <PageHeader title="Orders" description="List of ticket purchase transactions." />

        {/* Summary */}
        <SummaryCards
          loading={summaryLoading}
          items={[
            { label: "Total Orders", value: summary?.orders ?? 0, sub: `${summary?.status_counts?.PE ?? 0} pending · ${summary?.status_counts?.TI ?? 0} issued · ${summary?.status_counts?.FL ?? 0} failed`, bg: "/cube-bg.jpg" },
            { label: "Revenue", value: formatRupiah(summary?.revenue), sub: "Order PD + TI", bg: "/cube-bg_1.jpg" },
            { label: "Gross Amount", value: formatRupiah(summary?.gross_amt), sub: `PBJT ${formatRupiah(summary?.pbjt_amt)}`, bg: "/cube-bg_2.jpg" },
            { label: "Tickets", value: (summary?.tickets ?? 0).toLocaleString("id-ID"), sub: "Total tickets sold", bg: "/cube-bg_3.jpg" },
          ]}
        />

        {/* Filters */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-wrap items-end gap-2">
            <FilterSelect value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={[
              { value: "all", label: "All Status" },
              { value: "PD", label: "Paid" },
              { value: "TI", label: "Issued" },
              { value: "PE", label: "Pending" },
              { value: "FL", label: "Failed" },
            ]} />
            <FilterSelect value={unit} onChange={(v) => { setUnit(v); setPage(1) }} options={SITES} />
            <DateRangePicker
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={(v) => { setDateFrom(v); setPage(1) }}
              onDateToChange={(v) => { setDateTo(v); setPage(1) }}
              onClear={() => { setDateFrom(""); setDateTo("") }}
              onApply={() => setPage(1)}
            />
          </div>
          <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search order / customer..." />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stroke px-5 py-4">
            <h3 className="text-base font-bold text-gray-900">Order List</h3>
            <span className="text-sm text-muted-foreground">{data?.total ?? 0} orders</span>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Order No</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                  <th>Order Date</th>
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
                {!loading && data?.data.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="py-10 text-center text-muted-foreground">No orders found.</div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  data?.data.map((o) => (
                    <tr key={o.order_id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/orders/${o.order_id}`)}>
                      <td className="font-mono text-xs font-semibold text-primary">{o.order_no}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {initialOf(o.customer_name)}
                          </span>
                          <span className="max-w-[10rem] truncate">{o.customer_name}</span>
                        </div>
                      </td>
                      <td>
                        <div className="max-w-[14rem]">
                          <p className="truncate text-sm font-medium">
                            {o.items.map((i) => i.product_name).join(", ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {o.total_qty} tickets {o.unit_ids.length ? `• ${o.unit_ids.join(" / ").toUpperCase()}` : ""}
                          </p>
                        </div>
                      </td>
                      <td className="text-right font-semibold text-gray-900">{formatRupiah(o.total_amt)}</td>
                      <td>
                        <StatusBadge label={o.status_label} color={o.status_color} />
                      </td>
                      <td className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(o.order_date)}</td>
                      <td>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
                <button
                  className="pagination__button"
                  disabled={data.current_page <= 1}
                  onClick={() => setPage(data.current_page - 1)}
                >
                  ‹
                </button>
                <button
                  className="pagination__button"
                  disabled={data.current_page >= data.last_page}
                  onClick={() => setPage(data.current_page + 1)}
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>

        <FloatingFilterBadge
          activeFilterCount={activeFilterCount}
          onClearAll={() => {
            setStatus("all")
            setUnit("all")
            setDateFrom("")
            setDateTo("")
            setSearchInput("")
            setSearch("")
            setPage(1)
          }}
        />
      </div>
    </div>
  )
}
