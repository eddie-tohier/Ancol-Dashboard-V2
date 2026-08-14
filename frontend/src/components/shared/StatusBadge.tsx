import { badgeClass } from "@/lib/format"

export default function StatusBadge({ label, color }: { label?: string | null; color?: string | null }) {
  if (!label) return <span className="text-muted-foreground">-</span>
  return <span className={badgeClass(color || undefined)}>{label}</span>
}
