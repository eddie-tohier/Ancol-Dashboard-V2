"use client"

import { useEffect, useState, useCallback } from "react"
import { dashboardApi } from "@/lib/api-client"
import { formatRupiah } from "@/lib/format"
import { TODAY } from "@/lib/mock"
import PageHeader from "@/components/shared/PageHeader"
import PeriodPicker from "@/components/shared/PeriodPicker"
import { TrendChart } from "@/components/shared/Charts"
import dynamic from "next/dynamic"
import { Wallet, ShoppingCart, TicketCheck, UserRound, CheckCircle2, TrendingUp } from "lucide-react"

const BarChart = dynamic(() => import("react-apexcharts"), { ssr: false })

interface Stats {
  period: string
  revenue: number
  revenue_formatted: string
  orders: number
  tickets_issued: number
  tickets_used: number
  customers: number
  status_counts: { PD: number; TI: number; PE: number; FL: number }
}

interface ChartsData {
  series: Array<{ date: string; orders: number; revenue: number; tickets: number }>
  by_site: Array<{ site_code: string; site_name: string; orders: number; revenue: number }>
  top_products: Array<{ product_code: string; product_name: string; qty: number; revenue: number }>
  customer_growth: Array<{ date: string; new_customers: number; returning_customers: number }>
}

interface SharingData {
  period: string
  total_revenue: number
  base_amt: number
  pbjt_amt: number
  revsharing_pct: number
  pbjt_rate: number
  is_pbjt_include: boolean
  partner_share: number
  pja_share: number
}

function pad2(n: number) { return String(n).padStart(2, "0") }
function fmtDate(d: Date) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}` }

function thisWeekRange() {
  const now = new Date(TODAY)
  const day = now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() - ((day + 6) % 7))
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return { from: fmtDate(mon), to: fmtDate(sun) }
}

function shortDate(s: string) {
  if (!s) return ""
  const d = new Date(s + "T00:00:00")
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" })
}

export default function DashboardPage() {
  const initialRange = thisWeekRange()
  const [dateFrom, setDateFrom] = useState(initialRange.from)
  const [dateTo, setDateTo] = useState(initialRange.to)
  const [stats, setStats] = useState<Stats | null>(null)
  const [charts, setCharts] = useState<ChartsData | null>(null)
  const [sharing, setSharing] = useState<SharingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const periodLabel =
    dateFrom && dateTo ? `${shortDate(dateFrom)} – ${shortDate(dateTo)}` : "Custom"

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const [s, c, sh] = await Promise.all([
        dashboardApi.stats(undefined, dateFrom || undefined, dateTo || undefined),
        dashboardApi.charts(undefined, dateFrom || undefined, dateTo || undefined),
        dashboardApi.sharing(undefined, dateFrom || undefined, dateTo || undefined),
      ])
      setStats(s as Stats)
      setCharts(c as ChartsData)
      setSharing(sh as SharingData)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard")
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    const t = setTimeout(() => fetchAll(), 0)
    return () => clearTimeout(t)
  }, [fetchAll])

  const barOptions = {
    chart: { type: "bar" as const, toolbar: { show: false }, fontFamily: "var(--font-sans), sans-serif", foreColor: "#64748B", height: 300 },
    colors: ["#14b8a6"],
    plotOptions: { bar: { borderRadius: 6, columnWidth: "45%", distributed: false } },
    grid: { borderColor: "#E2E8F0", strokeDashArray: 4 },
    dataLabels: { enabled: false },
    xaxis: { categories: (charts?.by_site ?? []).map((s) => s.site_code.toUpperCase()) },
    yaxis: { labels: { formatter: (v: number) => Math.round(v).toLocaleString("id-ID") } },
    legend: { show: false },
  }

  const customerBarOptions = {
    chart: {
      type: "bar" as const,
      stacked: true,
      toolbar: { show: false },
      fontFamily: "var(--font-sans), sans-serif",
      foreColor: "#64748B",
      height: 280,
    },
    colors: ["#6366f1", "#14b8a6"],
    plotOptions: { bar: { borderRadius: 3, columnWidth: "55%", borderRadiusApplication: "end" as const, borderRadiusWhenStacked: "last" as const } },
    grid: { borderColor: "#E2E8F0", strokeDashArray: 4 },
    dataLabels: { enabled: false },
    xaxis: { categories: (charts?.customer_growth ?? []).map((c) => c.date.slice(5)), axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { formatter: (v: number) => Math.round(v).toLocaleString("id-ID") } },
    legend: { show: true, position: "top" as const, horizontalAlign: "right" as const },
    tooltip: { y: { formatter: (v: number) => Math.round(v).toLocaleString("id-ID") } },
  }

  const customerSeries = [
    { name: "Existing Customers", data: (charts?.customer_growth ?? []).map((c) => c.returning_customers) },
    { name: "New Customers", data: (charts?.customer_growth ?? []).map((c) => c.new_customers) },
  ]

  const pendingCount = (stats?.status_counts.PE ?? 0) + (stats?.status_counts.TI ?? 0)

  const totalPct = sharing?.total_revenue ?? 0
  const pjaPct = totalPct ? ((sharing?.pja_share ?? 0) / totalPct) * 100 : 0
  const partnerPct = totalPct ? ((sharing?.partner_share ?? 0) / totalPct) * 100 : 0
  const pbjtPct = totalPct ? ((sharing?.pbjt_amt ?? 0) / totalPct) * 100 : 0

  if (loading && !stats) {
    return (
      <div className="page content thin-scrollbar">
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="page content">
      <div className="content__container space-y-5">
        <PageHeader title="Dashboard" description="Summary of transactions, payments, and Ancol Connect tickets.">
          <div className="flex w-full flex-wrap items-end justify-end gap-2">
            <PeriodPicker
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              onApply={() => {}}
            />
          </div>
        </PageHeader>

        {error && <div className="error-message">{error}</div>}

        {/* Revenue banner */}
        <div className="relative w-full overflow-hidden rounded-2xl bg-[url('/revenue-bg.webp')] bg-cover bg-center shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b1a33]/95 via-[#0b1a33]/70 to-black/30" />
          <div className="relative flex flex-wrap items-end justify-between gap-6 px-6 py-8 sm:px-8">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/70">
                <Wallet className="h-4 w-4" />
                Total Revenue · {periodLabel}
              </p>
              <h3 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{formatRupiah(stats?.revenue)}</h3>
              <p className="mt-2 text-sm text-white/70">
                Orders with status PD + TI · <span className="font-semibold text-white">{stats?.orders.toLocaleString() ?? "0"} orders</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">Base Sales</p>
                <p className="mt-1 text-lg font-bold text-white">{formatRupiah(sharing?.base_amt)}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                <p className="text-[11px] font-medium uppercase tracking-wider text-white/60">PBJT {sharing?.pbjt_rate ?? 10}%</p>
                <p className="mt-1 text-lg font-bold text-white">{formatRupiah(sharing?.pbjt_amt)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Orders", value: stats?.orders.toLocaleString() ?? "0", sub: `${pendingCount} pending + issued`, icon: ShoppingCart, bg: "/cube-bg.jpg" },
            { label: "Tickets Issued", value: stats?.tickets_issued.toLocaleString() ?? "0", icon: TicketCheck, bg: "/cube-bg_1.jpg" },
            { label: "Tickets Used", value: stats?.tickets_used.toLocaleString() ?? "0", icon: CheckCircle2, bg: "/cube-bg_2.jpg" },
            { label: "Customers", value: stats?.customers.toLocaleString() ?? "0", icon: UserRound, bg: "/cube-bg_3.jpg" },
          ].map((c) => {
            const Icon = c.icon
            return (
              <div
                key={c.label}
                className="relative overflow-hidden rounded-2xl border border-stroke bg-white bg-no-repeat bg-[right_bottom] bg-[length:auto_90%] p-5 shadow-sm"
                style={{ backgroundImage: `url(${c.bg})` }}
              >
                <div className="absolute bottom-[46px] right-[22px] z-20 text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)] [transform:rotate(30deg)_skewX(-30deg)_scale(1.2)] [&>svg]:h-8 [&>svg]:w-8">
                  <Icon />
                </div>
                <div className="relative z-10">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</p>
                  <h3 className="mt-2 text-xl font-bold text-gray-900">{c.value}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{c.sub}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm lg:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Revenue &amp; Tickets</h3>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                <TrendingUp className="h-3.5 w-3.5" />
                {periodLabel} trend
              </span>
            </div>
            <TrendChart series={charts?.series ?? []} compact />
          </div>

          <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm">
            <h3 className="mb-2 text-base font-bold text-gray-900">Revenue by Site</h3>
            <BarChart
              options={barOptions}
              series={[{ name: "Revenue", data: (charts?.by_site ?? []).map((s) => Math.round(s.revenue)) }]}
              type="bar"
              height={300}
            />
          </div>
        </div>

        {/* Customer growth */}
        <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-gray-900">Customer Growth</h3>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
              New vs Existing Customers · {periodLabel}
            </span>
          </div>
          <BarChart
            options={customerBarOptions}
            series={customerSeries}
            type="bar"
            height={280}
          />
        </div>

        {/* Top products + revenue sharing */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-base font-bold text-gray-900">Top Products</h3>
            <div className="space-y-3">
              {(charts?.top_products ?? []).map((p, i) => (
                <div key={p.product_code} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-xs font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900">{p.product_name}</p>
                    <p className="text-xs text-muted-foreground">{p.qty.toLocaleString()} tickets sold</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatRupiah(p.revenue)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue sharing */}
          <div className="rounded-2xl border border-stroke bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900">Revenue Sharing</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Revenue sharing · operator {sharing?.revsharing_pct ?? 0}% of base sales
            </p>

            <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div className="bg-[#0b1a33]" style={{ width: `${pjaPct}%` }} />
              <div className="bg-teal-500" style={{ width: `${partnerPct}%` }} />
              <div className="bg-amber-400" style={{ width: `${pbjtPct}%` }} />
            </div>

            <div className="mt-4 space-y-2.5">
              {[
                { label: "PJA Share", value: sharing?.pja_share ?? 0, color: "#0b1a33" },
                { label: `Operator Share (${sharing?.revsharing_pct ?? 0}%)`, value: sharing?.partner_share ?? 0, color: "#14b8a6" },
                { label: `PBJT (${sharing?.pbjt_rate ?? 10}%)`, value: sharing?.pbjt_amt ?? 0, color: "#f59e0b" },
              ].map((r) => (
                <div key={r.label} className="flex items-center gap-3 text-sm">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="flex-1 text-muted-foreground">{r.label}</span>
                  <span className="font-semibold text-gray-900">{formatRupiah(r.value)}</span>
                  <span className="w-12 text-right text-xs text-muted-foreground">
                    {totalPct ? Math.round((r.value / totalPct) * 100) : 0}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
