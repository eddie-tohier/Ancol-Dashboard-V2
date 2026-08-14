import { format } from "date-fns"

export function formatRupiah(value?: number | string | null): string {
  const num = Number(value ?? 0)
  return `Rp ${Math.round(num).toLocaleString("id-ID")}`
}

export function formatDateTime(value?: string | null, fmt = "dd MMM yyyy • HH:mm"): string {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return format(d, fmt)
}

export function formatDate(value?: string | null, fmt = "dd MMM yyyy"): string {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return format(d, fmt)
}

export function initialOf(name?: string | null): string {
  if (!name) return "?"
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

const BADGE_MAP: Record<string, string> = {
  green: "badge badge--success",
  red: "badge badge--danger",
  amber: "badge badge--warning",
  blue: "badge badge--info",
  purple: "badge badge--info",
  gray: "badge badge--info",
}

export function badgeClass(color?: string): string {
  return BADGE_MAP[color || "gray"] || BADGE_MAP.gray
}
