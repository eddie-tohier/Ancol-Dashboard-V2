interface SummaryItem {
  label: string
  value: string | number
  sub?: string
  bg?: string
}

interface SummaryCardsProps {
  items: SummaryItem[]
  loading?: boolean
}

export default function SummaryCards({ items, loading }: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((c) => (
        <div
          key={c.label}
          className="relative overflow-hidden rounded-xl border border-stroke bg-white bg-no-repeat bg-[right_bottom] bg-[length:auto_100%] px-4 py-3 shadow-sm"
          style={c.bg ? { backgroundImage: `url(${c.bg})` } : undefined}
        >
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</p>
          <p className="mt-0.5 truncate text-lg font-bold text-gray-900">{loading ? "—" : c.value}</p>
          {c.sub && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{c.sub}</p>}
        </div>
      ))}
    </div>
  )
}
