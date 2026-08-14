"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { paymentsApi } from "@/lib/api-client"
import { formatRupiah, formatDateTime, initialOf } from "@/lib/format"
import PageHeader from "@/components/shared/PageHeader"
import StatusBadge from "@/components/shared/StatusBadge"
import FilterSelect from "@/components/shared/FilterSelect"
import SearchInput from "@/components/shared/SearchInput"
import FloatingFilterBadge from "@/components/shared/FloatingFilterBadge"
import DateRangePicker from "@/components/shared/DateRangePicker"
import SummaryCards from "@/components/shared/SummaryCards"

interface PaymentSummary {
  payments: number
  collected: number
  total_amt: number
  status_counts: { PS: number; PE: number; FL: number }
}

interface Payment {
  payment_id: number
  payment_amt: number
  payment_method: string
  payment_status: string
  status_label: string
  status_color: string
  transaction_time: string
  transaction_id: string
  bank_code: string
  order_no: string | null
  order_date: string | null
  order_status: string | null
  customer_name: string
  customer_phone: string
  gateway: string
}

export default function PaymentsPage() {
  const router = useRouter()
  const [data, setData] = useState<{ data: Payment[]; current_page: number; last_page: number; total: number; per_page: number } | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [status, setStatus] = useState("all")
  const [method, setMethod] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState<PaymentSummary | null>(null)
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
      const res = await paymentsApi.summary({
        search: search || undefined,
        status,
        method,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
      })
      setSummary(res as PaymentSummary)
    } catch {
      setSummary(null)
    } finally {
      setSummaryLoading(false)
    }
  }, [search, status, method, dateFrom, dateTo])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await paymentsApi.list<Payment>({
        page,
        per_page: 15,
        search: search || undefined,
        status,
        method,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        sort: "paid_at_desc",
      })
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load payments")
    } finally {
      setLoading(false)
    }
  }, [page, search, status, method, dateFrom, dateTo])

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
    (method !== "all" ? 1 : 0) +
    (dateFrom || dateTo ? 1 : 0) +
    (searchInput.trim() ? 1 : 0)

  return (
    <div className="page content">
      <div className="content__container space-y-4">
        <PageHeader title="Payments" description="Daftar pembayaran dari payment gateway (Midtrans)." />

        {/* Summary */}
        <SummaryCards
          loading={summaryLoading}
          items={[
            { label: "Total Payments", value: summary?.payments ?? 0, sub: `${summary?.status_counts?.PE ?? 0} pending · ${summary?.status_counts?.FL ?? 0} failed`, bg: "/cube-bg.jpg" },
            { label: "Collected", value: formatRupiah(summary?.collected), sub: `${summary?.status_counts?.PS ?? 0} transaksi sukses`, bg: "/cube-bg_1.jpg" },
            { label: "Gross Amount", value: formatRupiah(summary?.total_amt), sub: "Total nominal", bg: "/cube-bg_2.jpg" },
            { label: "Success", value: summary?.status_counts?.PS ?? 0, sub: "Pembayaran sukses", bg: "/cube-bg_3.jpg" },
          ]}
        />

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex flex-wrap items-end gap-2">
            <FilterSelect value={status} onChange={(v) => { setStatus(v); setPage(1) }} options={[
              { value: "all", label: "All Status" },
              { value: "PS", label: "Success" },
              { value: "PE", label: "Pending" },
              { value: "FL", label: "Failed" },
            ]} />
            <FilterSelect value={method} onChange={(v) => { setMethod(v); setPage(1) }} options={[
              { value: "all", label: "All Methods" },
              { value: "va", label: "Virtual Account" },
              { value: "pg", label: "Payment Gateway" },
            ]} />
            <DateRangePicker
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={(v) => { setDateFrom(v); setPage(1) }}
              onDateToChange={(v) => { setDateTo(v); setPage(1) }}
              onClear={() => { setDateFrom(""); setDateTo("") }}
              onApply={() => setPage(1)}
            />
          </div>
          <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search payment / order..." />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stroke px-5 py-4">
            <h3 className="text-base font-bold text-gray-900">Payment List</h3>
            <span className="text-sm text-muted-foreground">{data?.total ?? 0} payments</span>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Method</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                  <th>Paid At</th>
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
                      <div className="py-10 text-center text-muted-foreground">No payments found.</div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  data?.data.map((p) => (
                    <tr key={p.payment_id} className="cursor-pointer hover:bg-gray-50" onClick={() => router.push(`/payments/${p.payment_id}`)}>
                      <td className="font-mono text-xs font-semibold text-primary">#{p.payment_id}</td>
                      <td className="font-mono text-xs text-muted-foreground">{p.order_no || "—"}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {initialOf(p.customer_name)}
                          </span>
                          <span className="max-w-[9rem] truncate">{p.customer_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold uppercase text-gray-600">
                          {p.payment_method}
                        </span>
                        {p.bank_code && <span className="ml-1 text-xs text-muted-foreground">{p.bank_code}</span>}
                      </td>
                      <td className="text-right font-semibold text-gray-900">{formatRupiah(p.payment_amt)}</td>
                      <td>
                        <StatusBadge label={p.status_label} color={p.status_color} />
                      </td>
                      <td className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(p.transaction_time)}</td>
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
            setMethod("all")
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
