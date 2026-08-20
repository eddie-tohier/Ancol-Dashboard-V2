"use client"

import { useState, FormEvent } from "react"
import { csApi } from "@/lib/api-client"
import { formatRupiah, formatDateTime, initialOf } from "@/lib/format"
import PageHeader from "@/components/shared/PageHeader"
import StatusBadge from "@/components/shared/StatusBadge"
import {
  Search,
  Send,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Copy,
  Check,
} from "lucide-react"

interface TicketItem {
  ticket_id: number
  ticket_no: string
  ticket_date: string
  status: string
  status_code: string
  status_color: string
  product_name: string
  product_code: string
  site_code: string
  site_name: string
  qty: number
  price: number
  detail_total: number
}

interface OrderData {
  order_id: number
  order_no: string
  order_date: string
  visit_date: string
  order_total: number
  order_status: string
  customer_name: string
  customer_phone: string
  customer_email: string
  customer_code: string
  tickets: TicketItem[]
  payment: {
    payment_id: number
    payment_amt: number
    payment_method: string
    payment_status: string
    status_label: string
    status_color: string
    bank_code: string | null
    payment_number: string | null
    transaction_id: string | null
    transaction_time: string
    settlement_time: string | null
    currency: string
  } | null
}

function CopyField({
  value,
  className = "",
  mono = false,
}: {
  value: string
  className?: string
  mono?: boolean
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable — ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Klik untuk salin"
      className="group -mx-1.5 inline-flex max-w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left transition-colors hover:bg-gray-100"
    >
      <span className={`truncate ${mono ? "font-mono" : ""} ${className}`}>{value}</span>
      {copied ? (
        <Check className="h-3.5 w-3.5 flex-shrink-0 text-green-600" />
      ) : (
        <Copy className="h-3 w-3 flex-shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  )
}

export default function CSSearchPage() {
  const [orderNo, setOrderNo] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [order, setOrder] = useState<OrderData | null>(null)
  const [searched, setSearched] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSuccess, setResendSuccess] = useState("")
  const [resendError, setResendError] = useState("")

  function handleReset() {
    setOrderNo("")
    setOrder(null)
    setError("")
    setSearched(false)
    setResendSuccess("")
    setResendError("")
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    const trimmed = orderNo.trim()
    if (!trimmed) return

    setLoading(true)
    setError("")
    setOrder(null)
    setSearched(false)
    setResendSuccess("")
    setResendError("")

    try {
      const res = await csApi.searchByOrderNo(trimmed)
      setOrder(res as OrderData)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Pencarian gagal"
      setError(msg)
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  async function handleResendAll() {
    if (!order) return

    setResendLoading(true)
    setResendSuccess("")
    setResendError("")

    try {
      const res = await csApi.resendOrder(order.order_id) as { message: string; updated_count: number; tickets: Array<{ ticket_id: number; status: string; status_code: string; status_color: string }> }
      setResendSuccess(res.message)
      // Update all ticket statuses in local state
      const updatedMap = new Map(res.tickets.map((t) => [t.ticket_id, t]))
      setOrder({
        ...order,
        tickets: order.tickets.map((t) => {
          const updated = updatedMap.get(t.ticket_id)
          return updated ? { ...t, status: updated.status, status_code: updated.status_code, status_color: updated.status_color } : t
        }),
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengirim ulang tiket"
      setResendError(msg)
    } finally {
      setResendLoading(false)
    }
  }

  const hasEligibleTickets = order?.tickets.some((t) => t.status_code === "EXPIRED" || t.status_code === "REFUND")

  return (
    <div className="page content">
      <div className="content__container space-y-4">
        <PageHeader title="CS Search" description="Cari order berdasarkan nomor order untuk layanan customer service." />

        {/* Search Form */}
        <div>
          <form onSubmit={handleSearch}>
            <label htmlFor="orderNo" className="field__label mb-2 block">
              Nomor Order
            </label>
            <div className="relative">
              <input
                id="orderNo"
                type="text"
                className="input h-12 pr-28 text-base"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                placeholder="Masukkan nomor order (ex: WBT01025826)..."
                disabled={!!(order || searched)}
                autoFocus
              />
              {order || searched ? (
                <button
                  type="button"
                  onClick={handleReset}
                  className="absolute right-2 top-2 bottom-2 rounded-lg bg-orange-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                >
                  Reset
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !orderNo.trim()}
                  className="absolute right-2 top-2 bottom-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    "Search"
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <XCircle className="mx-auto mb-2 h-10 w-10 text-red-400" />
            <p className="font-semibold text-red-700">Order Tidak Ditemukan</p>
            <p className="mt-1 text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Not searched yet */}
        {!loading && !error && !order && !searched && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-20 text-center">
            <Search className="mb-4 h-14 w-14 text-gray-300" />
            <p className="text-base text-gray-400">Masukkan nomor order dan klik Search untuk memulai pencarian.</p>
          </div>
        )}

        {/* Order Detail */}
        {order && (
          <div className="space-y-4">
            {/* Success / Error resend message */}
            {resendSuccess && (
              <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-700">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">{resendSuccess}</span>
              </div>
            )}
            {resendError && (
              <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
                <XCircle className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">{resendError}</span>
              </div>
            )}

            {/* Order Info + Payment — side by side */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Informasi Order */}
              <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-4 ring-primary/5">
                      {initialOf(order.customer_name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{order.customer_name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        {order.customer_phone || "-"}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                        {order.customer_email || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-muted-foreground">Customer Code</p>
                    <p className="font-mono text-sm font-bold text-gray-900">{order.customer_code || "-"}</p>
                  </div>
                </div>

                {/* Separator */}
                <div className="my-4 border-t border-stroke" />

                {/* Order fields */}
                <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order Date</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">{formatDateTime(order.order_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Visit Date</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">{formatDateTime(order.visit_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order Total</p>
                      <p className="mt-1 text-sm font-medium text-gray-900">{formatRupiah(order.order_total)}</p>
                    </div>
                  </div>
              </div>

              {/* Pembayaran */}
              <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-stroke bg-gray-50/70 px-6 py-3.5">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">Pembayaran</h3>
                  {order.payment && <StatusBadge label={order.payment.status_label} color={order.payment.status_color} />}
                </div>

                <div className="p-6">
                  {order.payment ? (
                    <>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Method</p>
                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {order.payment.payment_method?.toUpperCase()}
                            {order.payment.bank_code ? ` • ${order.payment.bank_code}` : ""}
                          </p>
                        </div>
                        {order.payment.payment_number && (
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">VA Number</p>
                            <CopyField value={order.payment.payment_number} mono className="text-sm font-medium text-gray-900" />
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Transaction Time</p>
                          <p className="mt-1 text-sm font-medium text-gray-900">{formatDateTime(order.payment.transaction_time)}</p>
                        </div>
                      </div>

                      {order.payment.settlement_time && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Settlement</p>
                          <p className="mt-1 text-sm font-medium text-gray-900">{formatDateTime(order.payment.settlement_time)}</p>
                        </div>
                      )}

                      <div className="my-4 border-t border-stroke" />

                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</p>
                        <p className="text-lg font-bold text-gray-900">{formatRupiah(order.payment.payment_amt)}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Tidak ada data pembayaran</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tickets Table + Resend Button */}
            <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-stroke bg-gray-50/70 px-6 py-3.5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700">Daftar Tiket</h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{order.tickets.length} tiket</span>
                  <button
                    onClick={handleResendAll}
                    disabled={resendLoading || !hasEligibleTickets}
                    className="button button--primary inline-flex items-center gap-2"
                    title={!hasEligibleTickets ? "Tidak ada tiket yang bisa dikirim ulang" : "Kirim ulang semua tiket yang eligible"}
                  >
                    {resendLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Resend Ticket(s)
                  </button>
                </div>
              </div>

              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Ticket No</th>
                      <th>Product</th>
                      <th>Unit</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.tickets.map((t) => (
                      <tr key={t.ticket_id} className="hover:bg-gray-50">
                        <td className="font-mono text-xs font-semibold text-primary">{t.ticket_no.slice(0, 16)}…</td>
                        <td className="text-sm">{t.product_name}</td>
                        <td>
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold uppercase text-gray-600">
                            {t.site_code}
                          </span>
                        </td>
                        <td className="text-center">{t.qty}</td>
                        <td className="text-sm">{formatRupiah(t.price)}</td>
                        <td className="text-sm font-medium">{formatRupiah(t.detail_total)}</td>
                        <td>
                          <StatusBadge label={t.status} color={t.status_color} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
