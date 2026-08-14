"use client"

import { useEffect, useState } from "react"
import { sitesApi } from "@/lib/api-client"
import PageHeader from "@/components/shared/PageHeader"
import { MapPin, RefreshCw, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"

interface Site {
  site_id: number
  site_code: string
  name: string
  sync_status: "synced" | "syncing" | "error"
  last_sync: string
  active_products: number
  tickets_issued: number
  products: Array<{ product_code: string; product_name: string }>
}

const SYNC_META: Record<string, { label: string; color: string }> = {
  synced: { label: "Synced", color: "green" },
  syncing: { label: "Syncing", color: "blue" },
  error: { label: "Error", color: "red" },
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
        <PageHeader title="Wahana" description="Status sinkronisasi produk dan tiket per unit wahana.">
          <button onClick={fetchSites} className="button button--neutral button--sm">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </PageHeader>

        {error && <div className="error-message">{error}</div>}
        {loading && !sites.length && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sites.map((site) => {
            const meta = SYNC_META[site.sync_status]
            return (
              <div key={site.site_id} className="rounded-2xl border border-stroke bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <MapPin className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-900">{site.name}</h3>
                      <p className="font-mono text-xs uppercase text-muted-foreground">{site.site_code}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      site.sync_status === "synced"
                        ? "bg-emerald-50 text-success"
                        : site.sync_status === "syncing"
                          ? "bg-blue-50 text-primary"
                          : "bg-red-50 text-danger"
                    }`}
                  >
                    {site.sync_status === "syncing" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : site.sync_status === "error" ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    {meta?.label}
                  </span>
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
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Products</p>
                  <div className="flex flex-wrap gap-1">
                    {site.products.slice(0, 6).map((p) => (
                      <span key={p.product_code} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {p.product_name}
                      </span>
                    ))}
                    {site.products.length > 6 && (
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-muted-foreground">
                        +{site.products.length - 6}
                      </span>
                    )}
                  </div>
                </div>

                <p className="mt-4 border-t border-stroke pt-3 text-xs text-muted-foreground">
                  Last sync: {new Date(site.last_sync).toLocaleString("id-ID")}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
