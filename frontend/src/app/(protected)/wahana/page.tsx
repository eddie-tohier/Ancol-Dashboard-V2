"use client"

import { useEffect, useState, useCallback } from "react"
import { sitesApi } from "@/lib/api-client"
import PageHeader from "@/components/shared/PageHeader"
import SummaryCards from "@/components/shared/SummaryCards"
import { MapPin } from "lucide-react"

interface Site {
  site_id: number
  site_code: string
  name: string
  active_products: number
  tickets_issued: number
  products: Array<{ product_code: string; product_name: string }>
}

interface SiteSummary {
  sites: number
  products: number
  active_products: number
  tickets_issued: number
}

export default function WahanaPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [summary, setSummary] = useState<SiteSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)

  async function fetchSites() {
    setLoading(true)
    setError("")
    try {
      const res = await sitesApi.list<Site>()
      setSites(res)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load sites")
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true)
    try {
      const res = await sitesApi.summary()
      setSummary(res as SiteSummary)
    } catch {
      setSummary(null)
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchSites(), 0)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchSummary(), 0)
    return () => clearTimeout(t)
  }, [fetchSummary])

  return (
    <div className="page content thin-scrollbar">
      <div className="content__container space-y-4">
        <PageHeader title="Wahana" description="Daftar unit wahana beserta produk dan tiket terbit." />

        <SummaryCards
          loading={summaryLoading}
          items={[
            { label: "Total Wahana", value: (summary?.sites ?? 0).toLocaleString("id-ID"), bg: "/cube-bg.jpg" },
            { label: "Total Produk", value: (summary?.products ?? 0).toLocaleString("id-ID"), bg: "/cube-bg_1.jpg" },
            { label: "Produk Aktif", value: (summary?.active_products ?? 0).toLocaleString("id-ID"), sub: "Pernah terjual", bg: "/cube-bg_2.jpg" },
            { label: "Total Tiket Terbit", value: (summary?.tickets_issued ?? 0).toLocaleString("id-ID"), bg: "/cube-bg_3.jpg" },
          ]}
        />

        {error && <div className="error-message">{error}</div>}
        {loading && !sites.length && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <div key={site.site_id} className="flex flex-col rounded-2xl border border-stroke bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-bold text-gray-900">{site.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {site.site_code.toUpperCase()} · {site.active_products} produk · {site.tickets_issued.toLocaleString()} tiket
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {site.products.length === 0 && (
                  <span className="text-xs text-muted-foreground">Tidak ada produk</span>
                )}
                {site.products.map((p) => (
                  <span
                    key={p.product_code}
                    className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-700 ring-1 ring-inset ring-stroke"
                    title={p.product_name}
                  >
                    {p.product_name}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
