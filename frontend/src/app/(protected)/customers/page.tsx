"use client"

import { useEffect, useState, useCallback } from "react"
import { customersApi } from "@/lib/api-client"
import { formatDateTime } from "@/lib/format"
import PageHeader from "@/components/shared/PageHeader"
import SearchInput from "@/components/shared/SearchInput"
import SummaryCards from "@/components/shared/SummaryCards"
import Avvvatars from "avvvatars-react"

interface Customer {
  customer_id: number
  customer_code: string
  name: string
  phone: string
  email: string | null
  loyalti_no: string | null
  total_orders: number
  last_visit: string | null
}

interface CustomerSummary {
  customers: number
  total_orders: number
  avg_orders: number
  active_customers: number
  loyalty_members: number
}

export default function CustomersPage() {
  const [data, setData] = useState<{ data: Customer[]; current_page: number; last_page: number; total: number; per_page: number } | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState<CustomerSummary | null>(null)
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
      const res = await customersApi.summary()
      setSummary(res as CustomerSummary)
    } catch {
      setSummary(null)
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const res = await customersApi.list<Customer>({ page, per_page: 15, search: search || undefined })
      setData(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load customers")
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 0)
    return () => clearTimeout(t)
  }, [fetchData])

  useEffect(() => {
    const t = setTimeout(() => fetchSummary(), 0)
    return () => clearTimeout(t)
  }, [fetchSummary])

  return (
    <div className="page content">
      <div className="content__container space-y-4">
        <PageHeader title="Customers" description="Daftar pelanggan Ancol Connect." />

        <SummaryCards
          loading={summaryLoading}
          items={[
            { label: "Total Customers", value: (summary?.customers ?? 0).toLocaleString("id-ID"), bg: "/cube-bg.jpg" },
            { label: "Total Orders", value: (summary?.total_orders ?? 0).toLocaleString("id-ID"), sub: `${summary?.avg_orders ?? 0} rata-rata / customer`, bg: "/cube-bg_1.jpg" },
            { label: "Active Customers", value: (summary?.active_customers ?? 0).toLocaleString("id-ID"), sub: "Pernah bertransaksi", bg: "/cube-bg_2.jpg" },
            { label: "Loyalty Members", value: (summary?.loyalty_members ?? 0).toLocaleString("id-ID"), sub: "Punya nomor loyalitas", bg: "/cube-bg_3.jpg" },
          ]}
        />

        <div className="flex justify-end gap-2">
          <SearchInput value={searchInput} onChange={setSearchInput} placeholder="Search name / phone / email..." />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-stroke px-5 py-4">
            <h3 className="text-base font-bold text-gray-900">Customer List</h3>
            <span className="text-sm text-muted-foreground">{data?.total ?? 0} customers</span>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Loyalty No</th>
                  <th className="text-right">Orders</th>
                  <th>Last Visit</th>
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
                      <div className="py-10 text-center text-muted-foreground">No customers found.</div>
                    </td>
                  </tr>
                )}
                {!loading &&
                  data?.data.map((c) => (
                    <tr key={c.customer_id} className="hover:bg-gray-50">
                      <td className="font-mono text-xs font-semibold text-primary">{c.customer_code}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Avvvatars value={c.name || c.email || "?"} size={36} />
                          <span className="font-medium text-gray-900">{c.name}</span>
                        </div>
                      </td>
                      <td className="text-sm">{c.phone || "-"}</td>
                      <td className="max-w-[12rem] truncate text-sm text-muted-foreground">{c.email || "-"}</td>
                      <td className="font-mono text-xs text-muted-foreground">{c.loyalti_no || "-"}</td>
                      <td className="text-right font-semibold text-gray-900">{c.total_orders}</td>
                      <td className="whitespace-nowrap text-xs text-muted-foreground">{formatDateTime(c.last_visit)}</td>
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
      </div>
    </div>
  )
}
