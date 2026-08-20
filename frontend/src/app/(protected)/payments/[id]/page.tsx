"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { paymentsApi } from "@/lib/api-client"
import { formatRupiah, formatDateTime, initialOf } from "@/lib/format"
import PageHeader from "@/components/shared/PageHeader"
import StatusBadge from "@/components/shared/StatusBadge"
import { ArrowLeft } from "lucide-react"

interface PaymentDetail {
  payment_id: number
  payment_amt: number
  payment_method: string
  payment_status: string
  status_label: string
  status_color: string
  transaction_time: string
  settlement_time: string | null
  transaction_id: string | null
  payment_number: string | null
  bank_code: string | null
  currency: string
  gateway: string
  order_no: string | null
  order_date: string | null
  order_status: string | null
  order_id: number | null
  customer_name: string
  customer_phone: string
}

export default function PaymentDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [payment, setPayment] = useState<PaymentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    paymentsApi
      .get(Number(params.id))
      .then((res) => setPayment(res as PaymentDetail))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load payment"))
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

  if (error || !payment) {
    return (
      <div className="page content">
        <div className="error-message">{error || "Payment not found"}</div>
      </div>
    )
  }

  return (
    <div className="page content">
      <div className="content__container space-y-4">
        <button onClick={() => router.back()} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <PageHeader title={`Payment #${payment.payment_id}`} description="Payment gateway transaction detail.">
          <StatusBadge label={payment.status_label} color={payment.status_color} />
        </PageHeader>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Payment Info */}
          <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm lg:col-span-2">
            {/* Amount + Order No */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{formatRupiah(payment.payment_amt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order No</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{payment.order_no || "-"}</p>
              </div>
            </div>

            <div className="my-4 border-t border-stroke" />

            {/* Method + Gateway */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Method</p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {payment.payment_method.toUpperCase()}{payment.bank_code ? ` • ${payment.bank_code}` : ""}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gateway</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{payment.gateway}</p>
              </div>
            </div>

            <div className="my-4 border-t border-stroke" />

            {/* Transaction ID + VA Number */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Transaction ID</p>
                <p className="mt-1 font-mono text-xs font-medium text-gray-900">{payment.transaction_id || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment Number (VA)</p>
                <p className="mt-1 font-mono text-xs font-medium text-gray-900">{payment.payment_number || "-"}</p>
              </div>
            </div>

            <div className="my-4 border-t border-stroke" />

            {/* Currency + Order Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Currency</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{payment.currency || "IDR"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Order Date</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{formatDateTime(payment.order_date)}</p>
              </div>
            </div>

            <div className="my-4 border-t border-stroke" />

            {/* Transaction Time + Settlement Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Transaction Time</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{formatDateTime(payment.transaction_time)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Settlement Time</p>
                <p className="mt-1 text-sm font-medium text-gray-900">{formatDateTime(payment.settlement_time)}</p>
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="rounded-2xl border border-stroke bg-white p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Customer</h3>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {initialOf(payment.customer_name)}
              </span>
              <div>
                <p className="font-semibold text-gray-900">{payment.customer_name}</p>
                <p className="text-xs text-muted-foreground">{payment.customer_phone || "-"}</p>
              </div>
            </div>
            {payment.order_no && (
              <button
                onClick={() => router.push(`/orders/${payment.order_id}`)}
                className="button button--primary button--block button--sm mt-4"
              >
                View Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
