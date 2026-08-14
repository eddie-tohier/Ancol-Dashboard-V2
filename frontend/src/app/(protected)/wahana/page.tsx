"use client"

import { useEffect, useState } from "react"
import { sitesApi } from "@/lib/api-client"
import PageHeader from "@/components/shared/PageHeader"
import { MapPin } from "lucide-react"

interface Site {
  site_id: number
  site_code: string
  name: string
  active_products: number
  tickets_issued: number
  products: Array<{ product_code: string; product_name: string }>
}

export default function WahanaPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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

  useEffect(() => {
    const t = setTimeout(() => fetchSites(), 0)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="page content">
      <div className="content__container space-y-4">
        <PageHeader title="Wahana" description="Daftar unit wahana beserta produk dan tiket terbit." />

        {error && <div className="error-message">{error}</div>}
        {loading && !sites.length && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => (
            <div key={site.site_id} className="rounded-2xl border border-stroke bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-gray-900">{site.name}</h3>
                  <p className="font-mono text-xs uppercase text-muted-foreground">{site.site_code}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-stroke bg-gray-50 p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{site.active_products}</p>
                  <p className="text-xs text-muted-foreground">Produk Aktif</p>
                </div>
                <div className="rounded-xl border border-stroke bg-gray-50 p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{site.tickets_issued.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Tiket Terbit</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Products</p>
                  <span className="text-xs font-medium text-muted-foreground">{site.products.length} produk</span>
                </div>
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-stroke bg-gray-50 p-2">
                  {site.products.length === 0 && (
                    <p className="py-2 text-center text-xs text-muted-foreground">Tidak ada produk</p>
                  )}
                  {site.products.map((p) => (
                    <div key={p.product_code} className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 shadow-sm">
                      <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-muted-foreground">
                        {p.product_code}
                      </span>
                      <span className="truncate text-sm font-medium text-gray-800">{p.product_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
