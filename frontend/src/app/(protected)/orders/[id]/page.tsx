"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ordersApi } from "@/lib/api-client"
import { formatRupiah, formatDateTime, initialOf } from "@/lib/format"
import PageHeader from "@/components/shared/PageHeader"
import StatusBadge from "@/components/shared/StatusBadge"
import { ArrowLeft, Printer } from "lucide-react"

interface OrderDetail {
  order_id: number
  order_no: string
  order_date: string
  visit_date: string
  total_amt: number
  base_amt: number
  pbjt_amt: number
  status: string
  status_label: string
  status_color: string
  customer_id: number
  customer_code: string
  customer_name: string
  customer_phone: string
  customer_email: string
  items: Array<{ product_id: number; product_code: string; product_name: string; qty: number; price: number; total_amt: number; site_code: string; site_name: string }>
  tickets: Array<{ ticket_no: string; ticket_date: string; status: string }>
  payment: {
    payment_id: number
    payment_amt: number
    payment_method: string
    payment_status: string
    status_label: string
    status_color: string
    transaction_time: string
    transaction_id: string
    bank_code: string
    settlement_time: string
  } | null
}

export default function OrderDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    ordersApi
      .get(Number(params.id))
      .then((res) => setOrder(res as OrderDetail))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load order"))
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="page content">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="page content">
        <div className="error-message">{error || "Order not found"}</div>
      </div>
    )
  }

  const usedTickets = order.tickets.filter((t) => t.status === "USED").length

  return (
    <div className="page content">
      <div className="content__container space-y-4">
        <div>
          <button onClick={() => router.back()} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <PageHeader title={`Order ${order.order_no}`} description={`Order transaction detail #${order.order_id}`}>
            <StatusBadge label={order.status_label} color={order.status_color} />
            <button className="button button--neutral button--sm">
              <Printer className="h-4 w-4" /> Print
            </button>
          </PageHeader>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Customer + payment info */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Customer</h3>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {initialOf(order.customer_name)}
                </span>
                <div>
                  <p className="font-semibold text-gray-900">{order.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{order.customer_code}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-gray-900">Phone:</span> {order.customer_phone || "-"}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-gray-900">Email:</span> {order.customer_email || "-"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Payment</h3>
              {order.payment ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge label={order.payment.status_label} color={order.payment.status_color} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Method</span>
                    <span className="font-medium capitalize">{order.payment.payment_method} {order.payment.bank_code ? `• ${order.payment.bank_code}` : ""}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold text-gray-900">{formatRupiah(order.payment.payment_amt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Trx ID</span>
                    <span className="font-mono text-xs">{order.payment.transaction_id || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Paid at</span>
                    <span className="text-xs">{formatDateTime(order.payment.transaction_time)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No payment yet.</p>
              )}
            </div>
          </div>

          {/* Items */}
          <div className="overflow-hidden rounded-2xl border border-stroke bg-white shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between border-b border-stroke px-5 py-4">
              <h3 className="text-base font-bold text-gray-900">Items</h3>
              <span className="text-sm text-muted-foreground">{order.items.length} products</span>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Unit</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it) => (
                    <tr key={it.product_id}>
                      <td>
                        <p className="font-medium text-gray-900">{it.product_name}</p>
                        <p className="font-mono text-xs text-muted-foreground">{it.product_code}</p>
                      </td>
                      <td className="text-xs uppercase">{it.site_code}</td>
                      <td className="text-right">{it.qty}</td>
                      <td className="text-right">{formatRupiah(it.price)}</td>
                      <td className="text-right font-semibold text-gray-900">{formatRupiah(it.total_amt)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="text-right text-sm font-medium text-muted-foreground">
                      Subtotal
                    </td>
                    <td className="text-right font-semibold text-gray-900">{formatRupiah(order.total_amt)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="text-right text-sm font-medium text-muted-foreground">
                      PBJT (10%)
                    </td>
                    <td className="text-right font-semibold text-gray-900">{formatRupiah(order.pbjt_amt)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="text-right text-sm font-medium text-muted-foreground">
                      Base Amount
                    </td>
                    <td className="text-right font-semibold text-gray-900">{formatRupiah(order.base_amt)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Tickets */}
            <div className="border-t border-stroke px-5 py-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-900">Tickets</h4>
                <span className="text-xs text-muted-foreground">{usedTickets} / {order.tickets.length} used</span>
              </div>
              {order.tickets.length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {order.tickets.map((t) => (
                    <div key={t.ticket_no} className="flex items-center justify-between rounded-lg border border-stroke bg-gray-50 px-3 py-2">
                      <span className="font-mono text-xs text-gray-700">{t.ticket_no.slice(0, 12)}…</span>
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">{t.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No tickets yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
