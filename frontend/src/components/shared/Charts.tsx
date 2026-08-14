import { useMemo } from "react"
import dynamic from "next/dynamic"

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false })

export interface LineSeriesPoint {
  date: string
  orders: number
  revenue: number
  tickets: number
}

export function TrendChart({ series, compact }: { series: LineSeriesPoint[]; compact?: boolean }) {
  const options = useMemo(
    () => ({
      chart: {
        type: "area" as const,
        toolbar: { show: false },
        fontFamily: "var(--font-sans), sans-serif",
        foreColor: "#64748B",
        height: compact ? 260 : 320,
      },
      colors: ["#14b8a6", "#0ea5e9"],
      stroke: { curve: "smooth" as const, width: 2 },
      fill: {
        type: "gradient",
        gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02 },
      },
      grid: { borderColor: "#E2E8F0", strokeDashArray: 4 },
      dataLabels: { enabled: false },
      xaxis: {
        categories: series.map((d) => d.date.slice(5)),
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: [
        {
          title: { text: "Revenue" },
          labels: { formatter: (v: number) => v.toLocaleString("id-ID") },
        },
        {
          opposite: true,
          min: 0,
          title: { text: "Tickets" },
          labels: { formatter: (v: number) => v.toLocaleString("id-ID") },
        },
      ],
      legend: { show: true, position: "top" as const, horizontalAlign: "right" as const },
      tooltip: {
        y: { formatter: (v: number) => v.toLocaleString("id-ID") },
      },
    }),
    [series, compact]
  )

  const seriesData = useMemo(
    () => [
      {
        name: "Revenue",
        data: series.map((d) => Math.round(d.revenue)),
        yaxis: 0,
      },
      {
        name: "Tickets",
        data: series.map((d) => d.tickets),
        yaxis: 1,
      },
    ],
    [series]
  )

  return <Chart options={options} series={seriesData} type="area" height={compact ? 260 : 320} />
}
